import fs from "fs";
import path from "path";
import {
  Material,
  NegativeCacheItem,
  BDMember,
  Article,
  BDDistributionTask,
  PipelineStats,
  PipelineLog,
  Region,
  PublishChannel,
  TargetLanguage,
  ImageAsset,
  StylePresetItem,
  ScheduleConfig,
  CollectorPromptConfig,
  AiApiConfig,
  AiConnectionTestResult,
  StorageStats,
  BackupPayload,
} from "../types";
import {
  runEventResearchAndDedup,
  generateAIWeeklyArticles,
  renderPersonalizedPostForBD,
  getAiApiConfig,
  getRawAiApiConfig,
  setAiApiConfig,
  testGeminiConnection,
  getGeminiModel,
} from "./geminiService";

export class DataStore {
  private dataDir = path.join(process.cwd(), "data");
  private storageFile = path.join(process.cwd(), "data", "storage.json");
  private uploadsDir = path.join(process.cwd(), "data", "uploads");

  private materials: Material[] = [];
  private negativeCache: NegativeCacheItem[] = [];
  private bdMembers: BDMember[] = [];
  private articles: Article[] = [];
  private distributionTasks: BDDistributionTask[] = [];
  private imageAssets: ImageAsset[] = [];
  private logs: PipelineLog[] = [];
  private cronEnabled: boolean = true;
  private defaultDispatchWindowHours: number = 24;
  private overdueThresholdHours: number = 24;
  private scheduleConfig: ScheduleConfig = {
    cronEnabled: true,
    scheduleFrequency: 'daily',
    scheduleDay: 'Monday',
    scheduleTime: '09:00',
  };
  private stylePresets: StylePresetItem[] = [
    {
      id: "style-1",
      name: "领英专业爆款 (LinkedIn Post Default)",
      promptInstruction: "要求使用 Scrolling-Stopping Emoji 标题、短段落与移动端友好间距，用词客观严谨，具备全球出海视野，段落包含 Key Highlights, Technical Specs, Strategic Takeaway 与 BD 咨询引流名片插槽。",
      isBuiltIn: true,
    },
    {
      id: "style-2",
      name: "法约尔极简硬核风格 (Fayol Engineering Style)",
      promptInstruction: "模仿资深电网与逆变器工程师口吻，用词极简紧凑，拒绝修饰性套话。集中输出 MW/GWh/内部收益率 IRR/LCOE/构网型黑启动/防孤岛保护等硬核指标，每段不超过 2 句话。",
      isBuiltIn: true,
    },
    {
      id: "style-3",
      name: "硅谷风投引流体 (Silicon Valley VC Insight)",
      promptInstruction: "第一人称金句爆款开场，点出产业链大考与出海资本破局点。重点突出商业模式创新、PPA 绿电协议与微电网套利空间，结尾抛出互动议题与强引流插槽。",
      isBuiltIn: false,
    },
    {
      id: "style-4",
      name: "中东及政府高管合规风 (GCC Executive & Regulatory)",
      promptInstruction: "高度契合中东 Vision 2030 / NREP 政策与欧美法案。强调 IKTVA 本地化率、高等级防腐消防、政府公报契合度与高威望商业礼仪，展现国企/大厂威望重磅气场。",
      isBuiltIn: false,
    },
  ];
  private collectorConfig: CollectorPromptConfig = {
    searchInstruction: "",
    freshnessWindow: "year_2026",
    enableWebSearch: true,
    minImportanceScore: 8,
    strictYearFilter: 2026,
    lastCollectedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    collectionWindow: {
      from: new Date(Date.now() - 7 * 86400000).toISOString(),
      to: new Date().toISOString(),
    },
  };
  private lastRunTime: string = new Date().toISOString();
  private currentWeekNo: string = "2026-W33";

  constructor() {
    this.ensureDirectories();
    const loaded = this.loadFromDisk();
    if (!loaded) {
      this.seedInitialData();
    }
  }

  private ensureDirectories() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
      if (!fs.existsSync(this.uploadsDir)) {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      }
    } catch (err: any) {
      console.warn(`存储目录创建失败: ${err?.message}`);
    }
  }

  private loadFromDisk(): boolean {
    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, "utf-8");
        if (!raw || raw.trim().length === 0) return false;
        const data = JSON.parse(raw);
        if (data && typeof data === "object") {
          if (Array.isArray(data.materials)) this.materials = data.materials;
          if (Array.isArray(data.negativeCache)) this.negativeCache = data.negativeCache;
          if (Array.isArray(data.bdMembers)) this.bdMembers = data.bdMembers;
          if (Array.isArray(data.articles)) this.articles = data.articles;
          if (Array.isArray(data.distributionTasks)) this.distributionTasks = data.distributionTasks;
          if (Array.isArray(data.imageAssets)) this.imageAssets = data.imageAssets;
          if (Array.isArray(data.logs)) this.logs = data.logs;
          if (typeof data.cronEnabled === "boolean") this.cronEnabled = data.cronEnabled;
          if (typeof data.defaultDispatchWindowHours === "number") this.defaultDispatchWindowHours = data.defaultDispatchWindowHours;
          if (typeof data.overdueThresholdHours === "number") this.overdueThresholdHours = data.overdueThresholdHours;
          if (data.scheduleConfig) this.scheduleConfig = data.scheduleConfig;
          if (data.stylePresets && Array.isArray(data.stylePresets)) this.stylePresets = data.stylePresets;
          if (data.collectorConfig) this.collectorConfig = { ...this.collectorConfig, ...data.collectorConfig };
          if (data.aiConfig && typeof data.aiConfig === "object") {
            setAiApiConfig(data.aiConfig);
          }
          return true;
        }
      }
    } catch (err: any) {
      console.warn(`storage.json 加载失败，回退到默认初始数据: ${err?.message}`);
    }
    return false;
  }

  public persistToDisk() {
    try {
      this.ensureDirectories();
      const snapshot = {
        materials: this.materials,
        negativeCache: this.negativeCache,
        bdMembers: this.bdMembers,
        articles: this.articles,
        distributionTasks: this.distributionTasks,
        imageAssets: this.imageAssets,
        logs: this.logs,
        cronEnabled: this.cronEnabled,
        defaultDispatchWindowHours: this.defaultDispatchWindowHours,
        overdueThresholdHours: this.overdueThresholdHours,
        scheduleConfig: this.scheduleConfig,
        stylePresets: this.stylePresets,
        collectorConfig: this.collectorConfig,
        aiConfig: getRawAiApiConfig(),
      };
      const tempFile = path.join(this.dataDir, `storage.json.${Date.now()}.tmp`);
      fs.writeFileSync(tempFile, JSON.stringify(snapshot, null, 2), "utf-8");
      fs.renameSync(tempFile, this.storageFile);
    } catch (err: any) {
      console.warn(`持久化写入失败: ${err?.message}`);
    }
  }

  private seedInitialData() {
    // Clean initial database state: 0 mock articles, 0 mock events, 0 mock business items
    this.materials = [];
    this.negativeCache = [];
    this.bdMembers = [];
    this.articles = [];
    this.distributionTasks = [];
    this.imageAssets = [];
    this.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        module: "Collector",
        level: "info",
        message: "系统初始化完成：数据库已清空所有示例假数据，AI 核心引擎就绪。",
        details: `当前活跃 AI 模型: ${getGeminiModel()}`,
      },
    ];
  }

  /**
   * Clears all mock/example data in database (articles, events, materials, bd members, tasks, image assets)
   */
  public clearAllDatabaseData() {
    this.materials = [];
    this.negativeCache = [];
    this.bdMembers = [];
    this.articles = [];
    this.distributionTasks = [];
    this.imageAssets = [];
    this.logs = [
      {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        module: "Collector",
        level: "success",
        message: "已成功清空数据库中的所有历史假数据文章、事件、商务人员及分发任务。",
        details: "系统已重置为干净状态，等待真实数据录入或执行联网检索采集。",
      }
    ];

    return {
      success: true,
      message: "数据库中的示例假数据文章、事件、商务人员及分发任务已全部清空！",
    };
  }

  // === AI API CONFIGURATION & TESTING ===
  public getAiConfig(): AiApiConfig {
    return getAiApiConfig();
  }

  public updateAiConfig(config: Partial<AiApiConfig>) {
    setAiApiConfig(config);
    const providerLabel = config.provider === 'openai_compatible' || config.baseUrl ? '自定义第三方模型' : 'Google Gemini';
    this.addLog(
      "Collector",
      "info",
      `AI 引擎配置已更新: 引擎 [${providerLabel}] | 模型 [${config.model || getGeminiModel()}]${config.baseUrl ? ` | 端点 [${config.baseUrl}]` : ''}${config.apiKey ? ' | API Key 已配置' : ''}`
    );
    this.persistToDisk();
    return getAiApiConfig();
  }

  public async testAiConnection(
    customKey?: string,
    customModel?: string,
    customBaseUrl?: string,
    customProvider?: any
  ): Promise<AiConnectionTestResult> {
    const result = await testGeminiConnection(customKey, customModel, customBaseUrl, customProvider);
    this.addLog(
      "Collector",
      result.success ? "success" : "warning",
      `AI 引擎连通性测试${result.success ? '成功' : '未通过'}: ${result.message}`
    );
    return result;
  }

  // === GETTERS ===
  public getMaterials() { return this.materials; }
  public getNegativeCache() { return this.negativeCache; }
  public getBDMembers() { return this.bdMembers; }
  public getArticles() { 
    this.checkAndAutoDispatchArticles();
    return this.articles; 
  }
  public getDistributionTasks() { return this.distributionTasks; }
  public getImageAssets() { return this.imageAssets; }
  public getLogs() { return this.logs.slice(-30); }
  public getDefaultDispatchWindowHours() { return this.defaultDispatchWindowHours; }
  public getOverdueThresholdHours() { return this.overdueThresholdHours; }
  public getScheduleConfig() { return this.scheduleConfig; }
  public getStylePresets() { return this.stylePresets; }
  public getCollectorConfig() { return this.collectorConfig; }

  public updateCollectorConfig(config: Partial<CollectorPromptConfig>) {
    this.collectorConfig = { ...this.collectorConfig, ...config };
    this.addLog(
      "Collector",
      "info",
      `事件检索 AI Agent 配置已更新：时效窗口 [${this.collectorConfig.freshnessWindow}] | 联网检索 [${this.collectorConfig.enableWebSearch ? '开启' : '关闭'}] | 年份锁定 [${this.collectorConfig.strictYearFilter}]`
    );
    return this.collectorConfig;
  }

  // Clean stale/legacy non-2026 materials from database
  public cleanStaleMaterials() {
    const prevCount = this.materials.length;
    // Filter to retain only fresh materials or marketing assets
    this.materials = this.materials.filter(m => {
      if (m.type === 'marketing_asset') return true;
      const titleLower = (m.title || "").toLowerCase();
      const summaryLower = (m.summary || "").toLowerCase();
      // Remove stale items that mention 2022, 2023, 2024 or old legacy keywords
      if (titleLower.includes("2023") || titleLower.includes("2022") || titleLower.includes("2024")) return false;
      if (summaryLower.includes("2023年") || summaryLower.includes("2022年")) return false;
      return true;
    });
    const cleanedCount = prevCount - this.materials.length;
    this.addLog("NegativeDedup", "info", `时效性大扫除：已从素材库彻底清除 ${cleanedCount} 条陈旧历史过期素材。`);
    return { cleanedCount, remainingMaterials: this.materials };
  }

  public getStats(): PipelineStats {
    const totalDistributed = this.distributionTasks.length;
    const completedCheckIns = this.distributionTasks.filter(t => t.status === 'published').length;
    const checkInRate = totalDistributed > 0 ? Math.round((completedCheckIns / totalDistributed) * 100) : 0;

    return {
      totalCollected: this.materials.filter(m => m.type === 'auto_event').length,
      totalDeduped: this.negativeCache.length,
      totalMaterials: this.materials.length,
      generatedArticlesThisWeek: this.articles.filter(a => a.weekNo === this.currentWeekNo).length,
      totalDistributed,
      completedCheckIns,
      checkInRate,
      lastRunTime: this.lastRunTime,
      nextScheduledRun: new Date(Date.now() + 86400000 * (this.scheduleConfig.scheduleFrequency === 'daily' ? 1 : this.scheduleConfig.scheduleFrequency === 'every_3_days' ? 3 : 7)).toISOString(),
      cronEnabled: this.cronEnabled,
      overdueThresholdHours: this.overdueThresholdHours,
      scheduleConfig: this.scheduleConfig,
    };
  }

  // Set Overdue Threshold Hours Rule
  public setOverdueThresholdHours(hours: number) {
    this.overdueThresholdHours = hours;
    this.addLog(
      "CheckInMonitor",
      "info",
      `打卡逾期规则更新：已设置为 ${hours} 小时（超过 ${hours >= 24 ? (hours/24) + ' 天' : hours + ' 小时'} 未发布即标记为【已逾期】）`
    );
    return this.overdueThresholdHours;
  }

  // Update Schedule Config
  public updateScheduleConfig(config: Partial<ScheduleConfig>) {
    this.scheduleConfig = { ...this.scheduleConfig, ...config };
    if (config.cronEnabled !== undefined) {
      this.cronEnabled = config.cronEnabled;
    }
    this.addLog(
      "Collector",
      "info",
      `顶栏调度器时间配置更新：频率 [${this.scheduleConfig.scheduleFrequency}] | 时间 [${this.scheduleConfig.scheduleTime}] | 状态 [${this.scheduleConfig.cronEnabled ? '开启' : '暂停'}]`
    );
    return this.scheduleConfig;
  }

  // BD Member Management
  public addBDMember(data: Omit<BDMember, 'id'>) {
    const newMember: BDMember = {
      ...data,
      id: `bd-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    };
    this.bdMembers.push(newMember);
    this.addLog("DistributionEngine", "success", `新增商务团队成员：【${newMember.name}】(${newMember.title})，负责区域：${newMember.assignedRegions.join(", ")}`);
    return newMember;
  }

  public importBDMembers(members: Omit<BDMember, 'id'>[]) {
    const created: BDMember[] = [];
    members.forEach((m, idx) => {
      const member: BDMember = {
        ...m,
        id: `bd-${Date.now()}-${idx}-${Math.floor(Math.random() * 100)}`,
        active: m.active !== undefined ? m.active : true,
      };
      this.bdMembers.push(member);
      created.push(member);
    });
    this.addLog("DistributionEngine", "success", `批量导入商务人员：成功添加 ${created.length} 位商务专员进驻系统！`);
    return created;
  }

  public deleteBDMember(id: string) {
    const member = this.bdMembers.find(b => b.id === id);
    this.bdMembers = this.bdMembers.filter(b => b.id !== id);
    if (member) {
      this.addLog("DistributionEngine", "info", `已从系统移出商务人员：【${member.name}】`);
    }
  }

  // Style Preset Management
  public addStylePreset(preset: Omit<StylePresetItem, 'id'>) {
    const newPreset: StylePresetItem = {
      ...preset,
      id: `style-${Date.now()}`,
      isBuiltIn: false,
    };
    this.stylePresets.push(newPreset);
    this.addLog("GenerationEngine", "info", `新增 AI 文章模拟风格预设：【${newPreset.name}】`);
    return newPreset;
  }

  public updateStylePreset(id: string, updates: Partial<StylePresetItem>) {
    const idx = this.stylePresets.findIndex(s => s.id === id);
    if (idx !== -1) {
      this.stylePresets[idx] = { ...this.stylePresets[idx], ...updates };
      this.addLog("GenerationEngine", "info", `已修改 AI 风格预设提示词：【${this.stylePresets[idx].name}】`);
      return this.stylePresets[idx];
    }
    return null;
  }

  public deleteStylePreset(id: string) {
    const preset = this.stylePresets.find(s => s.id === id);
    this.stylePresets = this.stylePresets.filter(s => s.id !== id);
    if (preset) {
      this.addLog("GenerationEngine", "info", `已删减风格预设：【${preset.name}】`);
    }
  }

  // Check if any pending articles passed their time window and auto-dispatch
  private checkAndAutoDispatchArticles() {
    const now = Date.now();
    this.articles.forEach(art => {
      if (art.status === 'pending_dispatch' && art.dispatchScheduledAt) {
        if (new Date(art.dispatchScheduledAt).getTime() <= now) {
          this.dispatchArticleNow(art.id);
        }
      }
    });
  }

  // === ACTIONS ===

  // 1. Trigger Collector & Negative Dedup
  public async triggerCollector(overrideConfig?: Partial<CollectorPromptConfig>) {
    const activeConfig: CollectorPromptConfig = {
      ...this.collectorConfig,
      ...(overrideConfig || {}),
    };

    const toTime = new Date().toISOString();
    const fromTime = activeConfig.lastCollectedAt || new Date(Date.now() - 7 * 86400000).toISOString();
    const fromDateShort = fromTime.slice(0, 10);
    const toDateShort = toTime.slice(0, 10);

    this.addLog(
      "Collector",
      "info",
      `启动 7 大区域增量事件智能搜索与负向去重协议 [时间窗口: ${fromDateShort} 至 ${toDateShort} | 联网搜索: ${activeConfig.enableWebSearch ? '开启' : '关闭'}]...`
    );
    
    const result = await runEventResearchAndDedup(
      this.negativeCache,
      this.materials,
      activeConfig.searchInstruction,
      activeConfig.freshnessWindow,
      activeConfig.enableWebSearch,
      fromTime,
      toTime
    );

    // Save diagnostic search status
    this.collectorConfig.lastSearchStatus = result.searchStatus;

    if (!result.searchStatus.success) {
      this.addLog(
        "Collector",
        "error",
        `联网事件检索未完成 [${result.searchStatus.errorType || 'ERROR'}]: ${result.searchStatus.errorMessage || '未知异常'}`
      );
    } else {
      this.addLog(
        "Collector",
        "success",
        `Google 联网检索成功：捕获信源 ${result.searchStatus.webSourcesFound || 0} 个，提取有效候选事件 ${result.newEvents.length + result.dedupedCount} 项。`
      );
    }

    const newMaterials: Material[] = result.newEvents.map((evt, idx) => ({
      ...evt,
      id: `mat-${Date.now()}-${idx}`,
      createdAt: new Date().toISOString(),
      eventDate: evt.eventDate || toDateShort,
    }));

    if (newMaterials.length > 0) {
      this.materials.unshift(...newMaterials);
    }
    if (result.dedupLogs.length > 0) {
      this.negativeCache.unshift(...result.dedupLogs);
    }

    // Update collector configuration with new cached collection timestamp and window
    if (result.searchStatus.success && newMaterials.length > 0) {
      this.collectorConfig.lastCollectedAt = toTime;
      this.collectorConfig.collectionWindow = {
        from: fromTime,
        to: toTime,
      };
      this.lastRunTime = toTime;
    }

    this.addLog(
      "NegativeDedup",
      result.searchStatus.success ? "success" : "info",
      result.searchStatus.success
        ? `智能负向去重完成：检索到 ${result.newEvents.length + result.dedupedCount} 项区域事件，成功过滤重复/陈旧历史 ${result.dedupedCount} 项，增量入库 ${newMaterials.length} 项 ${fromDateShort}～${toDateShort} 最新行业高价值事件。`
        : `本次检索未产生新入库素材（状态：${result.searchStatus.errorType || '未检索到新事件'}）。`
    );

    return {
      addedMaterialsCount: newMaterials.length,
      dedupedCount: result.dedupedCount,
      newMaterials,
      lastCollectedAt: toTime,
      collectionWindow: { from: fromTime, to: toTime },
      searchStatus: result.searchStatus,
    };
  }

  // 2. Add Marketing Material
  public addMarketingMaterial(data: {
    title: string;
    region: Region;
    category: any;
    summary: string;
    fullContent?: string;
    imageUrl?: string;
    mediaType?: 'image' | 'video';
    mediaFileName?: string;
    fileSize?: string;
    tags?: string[];
  }) {
    const newMat: Material = {
      id: `mat-mkt-${Date.now()}`,
      title: data.title,
      region: data.region,
      category: data.category,
      type: "marketing_asset",
      source: "市场部自主上传",
      summary: data.summary,
      fullContent: data.fullContent || data.summary,
      imageUrl: data.imageUrl,
      mediaType: data.mediaType || (data.imageUrl?.startsWith("data:video") ? "video" : "image"),
      mediaFileName: data.mediaFileName,
      fileSize: data.fileSize,
      tags: data.tags || ["市场素材", "推文焦点"],
      createdAt: new Date().toISOString(),
      importanceScore: 10,
      isUsedInArticle: false,
    };

    this.materials.unshift(newMat);
    const mediaTypeLabel = newMat.mediaType === 'video' ? '视频' : '图片';
    this.addLog("Collector", "info", `市场部上传推文素材：【${newMat.title}】(${mediaTypeLabel})已存入素材库`);
    return newMat;
  }

  // 3. Delete Material
  public deleteMaterial(id: string) {
    this.materials = this.materials.filter(m => m.id !== id);
    this.persistToDisk();
  }

  // === IMAGE & VIDEO ASSETS GALLERY ===
  public addImageAsset(data: {
    title: string;
    url: string;
    mediaType?: 'image' | 'video';
    fileName?: string;
    fileSize?: string;
    remarks: string;
    tags?: string[];
    region?: Region;
  }) {
    const isVideo = data.mediaType === 'video' || data.url?.startsWith('data:video');
    const newImg: ImageAsset = {
      id: `asset-${Date.now()}`,
      title: data.title,
      url: data.url,
      mediaType: isVideo ? 'video' : 'image',
      fileName: data.fileName,
      fileSize: data.fileSize,
      remarks: data.remarks,
      tags: data.tags && data.tags.length > 0 ? data.tags : [isVideo ? "视频素材" : "素材图库", "配图"],
      region: data.region,
      createdAt: new Date().toISOString(),
    };
    this.imageAssets.unshift(newImg);
    this.addLog("Collector", "info", `市场部素材库：新增${isVideo ? '视频' : '图片'}素材【${newImg.title}】及其备注与标签索引`);
    return newImg;
  }

  public deleteImageAsset(id: string) {
    this.imageAssets = this.imageAssets.filter(img => img.id !== id);
    this.persistToDisk();
  }

  // Remind BD Task
  public remindBDTask(taskId: string) {
    const task = this.distributionTasks.find(t => t.id === taskId);
    if (task) {
      this.addLog(
        "CheckInMonitor",
        "warning",
        `【打卡催办告警】系统已向商务【${task.bdName}】发出文章【${task.articleTitle.slice(0, 15)}...】的高优先级打卡催办提醒！`
      );
      return task;
    }
    return null;
  }

  // === TIME WINDOW & ARTICLE EDITING ===
  public setDispatchWindowHours(hours: number) {
    this.defaultDispatchWindowHours = hours;
    this.addLog("GenerationEngine", "info", `更新文章离线隔离时间窗为 ${hours} 小时`);
    return this.defaultDispatchWindowHours;
  }

  public updateArticle(id: string, updates: Partial<Article>) {
    const idx = this.articles.findIndex(a => a.id === id);
    if (idx !== -1) {
      this.articles[idx] = { ...this.articles[idx], ...updates };
      this.addLog("GenerationEngine", "info", `审阅修改 AI 生成文章【${this.articles[idx].title.slice(0, 15)}...】的段落/图片/商务指派`);
      return this.articles[idx];
    }
    return null;
  }

  // Dispatch Article (Manual Early Trigger or Time Window Expiry) with Layer-2 AI Personalization
  public async dispatchArticleNow(articleId: string) {
    const art = this.articles.find(a => a.id === articleId);
    if (!art) return null;

    art.status = 'distributed';

    let bdIdsToAssign = art.assignedBdIds && art.assignedBdIds.length > 0 ? art.assignedBdIds : [];
    if (bdIdsToAssign.length === 0) {
      // Strict region match only; no fallback to arbitrary active BD.
      const matchingBDs = this.bdMembers.filter(bd => bd.active && bd.assignedRegions.includes(art.region));
      bdIdsToAssign = matchingBDs.map(b => b.id);
      art.assignedBdIds = bdIdsToAssign;
    }

    const targetBDs = this.bdMembers.filter(b => bdIdsToAssign.includes(b.id));
    let createdCount = 0;

    for (const bd of targetBDs) {
      const exists = this.distributionTasks.some(t => t.articleId === art.id && t.bdId === bd.id);
      if (!exists) {
        const lang = art.targetLanguage || bd.preferredLanguage || 'en';
        
        // Execute Layer-2 AI Personalization Rendering for this BD!
        const { fullPersonalizedMarkdown, personalizedSection, isAiPersonalized } = await renderPersonalizedPostForBD(art, bd, lang);

        const task: BDDistributionTask = {
          id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          articleId: art.id,
          articleTitle: art.title,
          articleRegion: art.region,
          bdId: bd.id,
          bdName: bd.name,
          bdTitle: bd.title,
          personalizedSection,
          fullPersonalizedMarkdown,
          personalStylePromptUsed: bd.personalStylePrompt || "标准出海商务对接人设",
          isAiPersonalized,
          status: "pending",
          receivedAt: new Date().toISOString(),
        };

        this.distributionTasks.unshift(task);
        createdCount++;

        if (bd.personalStylePrompt) {
          this.addLog(
            "DistributionEngine",
            "info",
            `AI 个性化渲染：已为商务【${bd.name}】执行第二层专属人设风格渲染（Prompt: ${bd.personalStylePrompt.slice(0, 30)}...）`
          );
        }
      }
    }

    this.addLog(
      "DistributionEngine",
      "success",
      `时间窗解除/发放完成：文章【${art.title.slice(0, 15)}...】已向 ${createdCount} 位 BD 人员派发并完成专属 AI 风格与名片渲染！`
    );

    return art;
  }

  // 4. Generate AI Articles (LinkedIn Style & Specific Event Selection & Target Language)
  public async generateWeeklyArticles(
    count: number = 5,
    selectedMaterialIds?: string[],
    stylePreset: string = "LinkedInPost",
    targetLanguage: TargetLanguage = "en",
    assignedBdIds?: string[],
    skipQuarantine: boolean = false
  ) {
    const selectedInfo = selectedMaterialIds && selectedMaterialIds.length > 0 
      ? `指定了 ${selectedMaterialIds.length} 项特定事件素材` 
      : `批量选择前 ${count} 项素材`;

    this.addLog(
      "GenerationEngine",
      "info",
      `启动 AI 海外领英文章撰写引擎：【${selectedInfo}】，风格: ${stylePreset}，目标语言: ${targetLanguage}...`
    );

    const presetItem = this.stylePresets.find(p => p.id === stylePreset || p.name === stylePreset);
    const stylePromptInstruction = presetItem?.promptInstruction || "";

    const rawArticles = await generateAIWeeklyArticles(
      this.materials,
      this.currentWeekNo,
      count,
      selectedMaterialIds,
      stylePreset,
      targetLanguage,
      stylePromptInstruction
    );

    const windowHours = this.defaultDispatchWindowHours || 24;
    const scheduledAt = new Date(Date.now() + windowHours * 3600000).toISOString();

    const createdArticles: Article[] = rawArticles.map((art, idx) => {
      let finalAssignedBdIds = assignedBdIds && assignedBdIds.length > 0 ? assignedBdIds : [];
      if (finalAssignedBdIds.length === 0) {
        // Strict region match only; no fallback to arbitrary active BD.
        const matchingBDs = this.bdMembers.filter(bd => bd.active && bd.assignedRegions.includes(art.region));
        finalAssignedBdIds = matchingBDs.map(b => b.id);
      }

      return {
        ...art,
        id: `art-${Date.now()}-${idx}`,
        status: skipQuarantine ? ('distributed' as const) : ('pending_dispatch' as const),
        dispatchWindowHours: windowHours,
        dispatchScheduledAt: scheduledAt,
        assignedBdIds: finalAssignedBdIds,
        createdAt: new Date().toISOString(),
      };
    });

    this.articles.unshift(...createdArticles);

    // Mark used materials
    this.materials.forEach(m => {
      if (rawArticles.some(a => a.usedMaterialIds?.includes(m.id))) {
        m.isUsedInArticle = true;
      }
    });

    if (skipQuarantine) {
      // Immediately create distribution tasks for assigned BD members with AI personalizer
      for (const art of createdArticles) {
        await this.dispatchArticleNow(art.id);
      }

      this.addLog(
        "GenerationEngine",
        "success",
        `【手动模式直接发放】AI 成功撰写 ${createdArticles.length} 篇 (${targetLanguage.toUpperCase()}) 领英文章，已直派给 ${assignedBdIds?.length || "指定"} 位商务并完成第二层专属 AI 人设风格渲染！`
      );
    } else {
      this.addLog(
        "GenerationEngine",
        "success",
        `AI 成功撰写 ${createdArticles.length} 篇 (${targetLanguage.toUpperCase()}) 领英文章，已存入‘AI 生成文章库’并开启 ${windowHours} 小时时间窗保护。到期分发时将自动执行各商务的专属 AI 风格渲染。`
      );
    }

    return createdArticles;
  }

  // 5. Auto Distribute Articles to BD Members
  public async autoDistributeArticles(articlesToDistribute?: Article[]) {
    const targetArticles = articlesToDistribute || this.articles.filter(a => a.status === 'generated' || a.status === 'draft' || a.status === 'pending_dispatch');
    if (targetArticles.length === 0) return this.distributionTasks;

    let newTasksCount = 0;

    for (const art of targetArticles) {
      // Find matching BD members by region (strict: only BDs covering this region).
      // No fallback to "first active BD" — that misroutes MiddleEast/EuropeUK posts to a
      // LatAm BD. If no BD covers the region, skip and keep the article pending so the
      // operator can add a BD for that region and re-dispatch.
      const bdsToAssign = this.bdMembers.filter(bd => bd.active && bd.assignedRegions.includes(art.region));

      if (bdsToAssign.length === 0) {
        this.addLog(
          "DistributionEngine",
          "warning",
          `文章【${art.title.slice(0, 30)}...】区域 ${art.region} 暂无负责该区域的活跃 BD，已跳过分发，待补充对应区域 BD 后重新分发。`
        );
        continue;
      }

      const lang = art.targetLanguage || 'en';

      for (const bd of bdsToAssign) {
        // Check if task already exists
        const exists = this.distributionTasks.some(t => t.articleId === art.id && t.bdId === bd.id);
        if (!exists) {
          const { fullPersonalizedMarkdown, personalizedSection, isAiPersonalized } = await renderPersonalizedPostForBD(art, bd, lang);

          const task: BDDistributionTask = {
            id: `task-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            articleId: art.id,
            articleTitle: art.title,
            articleRegion: art.region,
            bdId: bd.id,
            bdName: bd.name,
            bdTitle: bd.title,
            personalizedSection,
            fullPersonalizedMarkdown,
            personalStylePromptUsed: bd.personalStylePrompt || "标准出海商务对接人设",
            isAiPersonalized,
            status: "pending",
            receivedAt: new Date().toISOString(),
          };

          this.distributionTasks.unshift(task);
          newTasksCount++;
        }
      }

      art.status = "distributed";
    }

    this.addLog("DistributionEngine", "success", `智能分发模块：已向商务团队自动分发 ${newTasksCount} 项个性化宣发任务（已完成各商务专属 AI 风格与名片渲染）。`);
    return this.distributionTasks;
  }

  // 6. Update BD Profile
  public async updateBDProfile(bdData: Partial<BDMember> & { id: string }) {
    const idx = this.bdMembers.findIndex(b => b.id === bdData.id);
    if (idx !== -1) {
      this.bdMembers[idx] = { ...this.bdMembers[idx], ...bdData };
      const bd = this.bdMembers[idx];
      this.addLog("DistributionEngine", "info", `商务人员【${bd.name}】更新了个人信息及专属 AI 风格提示词（${bd.personalStylePrompt ? bd.personalStylePrompt.slice(0, 30) + '...' : '未设置'}）。`);

      // Refresh pending tasks personalized section & AI styling for this BD
      for (const task of this.distributionTasks) {
        if (task.bdId === bdData.id && task.status === 'pending') {
          const art = this.articles.find(a => a.id === task.articleId);
          if (art) {
            const lang = art.targetLanguage || bd.preferredLanguage || 'en';
            const { fullPersonalizedMarkdown, personalizedSection, isAiPersonalized } = await renderPersonalizedPostForBD(art, bd, lang);
            task.personalizedSection = personalizedSection;
            task.fullPersonalizedMarkdown = fullPersonalizedMarkdown;
            task.personalStylePromptUsed = bd.personalStylePrompt || "标准出海商务对接人设";
            task.isAiPersonalized = isAiPersonalized;
          }
        }
      }
      return this.bdMembers[idx];
    }
    return null;
  }

  // 7. BD Check-In (Publish / Read)
  public checkInBDTask(taskId: string, channel: PublishChannel, proofNote?: string) {
    const task = this.distributionTasks.find(t => t.id === taskId);
    if (task) {
      task.status = "published";
      task.publishedAt = new Date().toISOString();
      task.publishChannel = channel;
      task.checkInProof = proofNote || "已完成指定渠道宣传发布与打卡确认。";

      this.addLog(
        "CheckInMonitor",
        "success",
        `商务打卡完成：商务【${task.bdName}】已在渠道 [${channel}] 发布文章【${task.articleTitle.slice(0, 20)}...】并提交打卡确认。`
      );

      return task;
    }
    return null;
  }

  // 8. Toggle Cron
  public toggleCron(enabled?: boolean) {
    this.cronEnabled = enabled !== undefined ? enabled : !this.cronEnabled;
    this.addLog("Collector", "info", `定时任务调度状态变更：已${this.cronEnabled ? '开启' : '关闭'}每周自动化采集与生成任务。`);
    return this.cronEnabled;
  }

  // Helper log
  private addLog(module: PipelineLog['module'], level: PipelineLog['level'], message: string, details?: string) {
    this.logs.push({
      id: `log-${Date.now()}-${Math.floor(Math.random()*1000)}`,
      timestamp: new Date().toISOString(),
      module,
      level,
      message,
      details,
    });
    this.schedulePersist();
  }

  // Debounced disk persistence: every data mutation routes through addLog, so this
  // covers all write paths (add/delete/update/trigger) without editing each method.
  // ponytail: debounce window 500ms, fine for single-user ops; if multi-writer needed, add a write queue.
  private _persistTimer: ReturnType<typeof setTimeout> | null = null;
  private schedulePersist() {
    if (this._persistTimer) clearTimeout(this._persistTimer);
    this._persistTimer = setTimeout(() => {
      this.persistToDisk();
      this._persistTimer = null;
    }, 500);
  }
}

export const store = new DataStore();
