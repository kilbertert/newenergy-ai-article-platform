/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from "react";
import { Header } from "./components/Header";
import { PipelineMonitor } from "./components/PipelineMonitor";
import { AutoCollectorView } from "./components/AutoCollectorView";
import { MarketingHubView } from "./components/MarketingHubView";
import { AIGeneratorView } from "./components/AIGeneratorView";
import { ArticleLibraryView } from "./components/ArticleLibraryView";
import { BDPortalView } from "./components/BDPortalView";
import { BDDashboardView } from "./components/BDDashboardView";
import { LeadsView } from "./components/LeadsView";
import { ArticleDetailModal } from "./components/ArticleDetailModal";
import { NewMaterialModal } from "./components/NewMaterialModal";
import {
  fetchPipelineData,
  triggerCollectorApi,
  addMaterialApi,
  deleteMaterialApi,
  generateArticlesApi,
  distributeArticlesApi,
  updateBDProfileApi,
  checkInBDTaskApi,
  toggleCronApi,
  addImageAssetApi,
  deleteImageAssetApi,
  updateArticleApi,
  dispatchArticleNowApi,
  setWindowHoursApi,
  remindBDTaskApi,
  addBDMemberApi,
  importBDMembersApi,
  deleteBDMemberApi,
  setOverdueRuleApi,
  updateScheduleConfigApi,
  addStylePresetApi,
  updateStylePresetApi,
  deleteStylePresetApi,
  updateCollectorConfigApi,
  cleanStaleMaterialsApi,
  PipelineDataResponse,
} from "./lib/api";
import { Material, Article, BDDistributionTask, BDMember, PublishChannel, TargetLanguage, ScheduleConfig, StylePresetItem, CollectorPromptConfig } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("bd_dashboard");
  const [pipelineData, setPipelineData] = useState<PipelineDataResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);

  // Modals State
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null);
  const [previewTask, setPreviewTask] = useState<BDDistributionTask | null>(null);
  const [isNewMaterialModalOpen, setIsNewMaterialModalOpen] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const data = await fetchPipelineData();
      setPipelineData(data);
    } catch (err: any) {
      showNotification("error", "无法连接后端，请检查服务状态");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (type: "success" | "error" | "info", msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 4000);
  };

  // 1. One-Click Full Pipeline Execution
  const handleRunFullPipeline = async () => {
    setIsProcessing(true);
    showNotification("info", "🚀 正在启动管线全效调度：搜采海外事件 -> 负向去重 -> AI撰写长文 -> 商务分发");
    try {
      // Step A: Trigger Collector & Negative Dedup
      const colRes = await triggerCollectorApi();
      showNotification("info", `[1/3] 事件搜采完成：获得 ${colRes.data.addedMaterialsCount} 项海外增量事件，去重 ${colRes.data.dedupedCount} 项旧闻`);

      // Step B: Trigger AI Article Generator
      const genRes = await generateArticlesApi(3);
      showNotification("info", `[2/3] AI撰写完成：生成 ${genRes.count} 篇包含商务插槽的高质长文`);

      // Step C: Trigger BD Distribution
      await distributeArticlesApi();

      await loadData();
      showNotification("success", "🎉 全流程管线成功运行完毕！已向商务团队分发最新宣发任务。");
    } catch (err: any) {
      showNotification("error", err.message || "管线运行中途异常");
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. Individual Collector Action
  const handleTriggerCollector = async (config?: Partial<CollectorPromptConfig>) => {
    setIsProcessing(true);
    try {
      const res = await triggerCollectorApi(config);
      const added = res?.data?.addedMaterialsCount ?? 0;
      const deduped = res?.data?.dedupedCount ?? 0;
      const collected = res?.data?.newMaterials ?? [];
      // Refresh data first, then land the user on the collector tab so they immediately
      // see the freshly harvested events (previously they had to manually refresh).
      await loadData();
      setActiveTab("collector");
      showNotification(
        added > 0 ? "success" : "info",
        added > 0
          ? `搜采完成：新增 ${added} 项海外事件（已去重 ${deduped} 项旧闻），已自动跳转到素材列表。`
          : `搜采完成：本次未产生新入库素材（去重 ${deduped} 项）。${res?.data?.searchStatus?.errorMessage ? " " + res.data.searchStatus.errorMessage : ""}`
      );
    } catch (err: any) {
      showNotification("error", err.message || "搜采失败");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateCollectorConfig = async (config: Partial<CollectorPromptConfig>) => {
    try {
      await updateCollectorConfigApi(config);
      await loadData();
      showNotification("info", "事件检索 AI Agent 提示词配置已成功保存！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleCleanStaleMaterials = async () => {
    try {
      const res = await cleanStaleMaterialsApi();
      await loadData();
      showNotification("success", `时效性清理完成：已剔除 ${res.cleanedCount} 条陈旧历史过期素材`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 3. Marketing Material Add
  const handleAddMaterial = async (data: any) => {
    try {
      await addMaterialApi(data);
      await loadData();
      showNotification("success", "市场部推文素材已成功入库");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 4. Delete Material
  const handleDeleteMaterial = async (id: string) => {
    try {
      await deleteMaterialApi(id);
      await loadData();
      showNotification("info", "已删除选定素材");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 5. Generate AI Articles (LinkedIn Style & Granular Event Selection & Internationalization)
  const handleGenerateArticles = async (
    count: number,
    selectedMaterialIds?: string[],
    stylePreset: string = "LinkedInPost",
    targetLanguage: TargetLanguage = "en",
    assignedBdIds?: string[],
    skipQuarantine?: boolean
  ) => {
    setIsProcessing(true);
    try {
      const res = await generateArticlesApi(count, selectedMaterialIds, stylePreset, targetLanguage, assignedBdIds, skipQuarantine);
      await loadData();
      if (skipQuarantine) {
        showNotification("success", `🚀 手动选择生成：已绕过隔离时间窗，文章直接分发至 ${assignedBdIds?.length || "指定"} 位商务的任务列表中！`);
      } else {
        showNotification("success", `🎉 成功生成 ${res.count} 篇 (${targetLanguage.toUpperCase()}) 领英（LinkedIn）风格海外专业文章！已存入时间窗隔离库。`);
      }
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 6. Auto Distribute Articles
  const handleDistributeArticles = async () => {
    setIsProcessing(true);
    try {
      await distributeArticlesApi();
      await loadData();
      showNotification("success", "已成功将个性化文章分发至各区域商务人员！");
    } catch (err: any) {
      showNotification("error", err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // 7. Update BD Profile
  const handleUpdateBDProfile = async (bdData: Partial<BDMember> & { id: string }) => {
    try {
      await updateBDProfileApi(bdData);
      await loadData();
      showNotification("success", "商务人员衔接文章咨询信息已更新");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 8. BD Check-In Task
  const handleCheckInBDTask = async (taskId: string, channel: PublishChannel, proofNote?: string) => {
    try {
      await checkInBDTaskApi(taskId, channel, proofNote);
      await loadData();
      showNotification("success", "✅ 恭喜！您已成功完成发布打卡与确认！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 9. Toggle Automated Weekly Schedule
  const handleToggleCron = async (enabled: boolean) => {
    try {
      await toggleCronApi(enabled);
      await loadData();
      showNotification("info", `自动调度已${enabled ? "开启" : "暂停"}`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 10. Image Asset Management (Direct Image & Video Upload)
  const handleAddImageAsset = async (data: any) => {
    try {
      await addImageAssetApi(data);
      await loadData();
      const mediaLabel = data.mediaType === "video" ? "视频" : "图片";
      showNotification("success", `${mediaLabel}素材已直接导入市场部素材库并建立标签索引`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDeleteImageAsset = async (id: string) => {
    try {
      await deleteImageAssetApi(id);
      await loadData();
      showNotification("info", "已从素材库删除指定素材");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  // 11. Article Management & Time Window Actions
  const handleUpdateArticle = async (id: string, updates: Partial<Article>) => {
    try {
      await updateArticleApi(id, updates);
      await loadData();
      showNotification("success", "文章更新成功（包含插图与指派商务设置）");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDispatchArticleNow = async (articleId: string) => {
    try {
      await dispatchArticleNowApi(articleId);
      await loadData();
      showNotification("success", "🎉 文章已成功解除隔离并提前派发至指派的商务团队！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleSetWindowHours = async (hours: number) => {
    try {
      await setWindowHoursApi(hours);
      await loadData();
      showNotification("info", `离线隔离时间窗已更新为 ${hours} 小时`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleRemindTask = async (taskId: string) => {
    try {
      await remindBDTaskApi(taskId);
      await loadData();
      showNotification("info", "🔔 打卡催办提醒已实时发送并已计入系统监控告警日志！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleSetOverdueRule = async (hours: number) => {
    try {
      await setOverdueRuleApi(hours);
      await loadData();
      showNotification("success", `打卡逾期判定规则已成功设置为 ${hours} 小时（${hours / 24 >= 1 ? hours / 24 + " 天" : hours + " 小时"}）`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleUpdateScheduleConfig = async (config: Partial<ScheduleConfig>) => {
    try {
      await updateScheduleConfigApi(config);
      await loadData();
      showNotification("info", "顶栏调度器自动化时间规则已保存应用！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleAddBDMember = async (memberData: Omit<BDMember, 'id'>) => {
    try {
      await addBDMemberApi(memberData);
      await loadData();
      showNotification("success", `成功添加商务人员：${memberData.name}`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleImportBDMembers = async (members: Omit<BDMember, 'id'>[]) => {
    try {
      await importBDMembersApi(members);
      await loadData();
      showNotification("success", `成功批量导入 ${members.length} 位商务专员配置！`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDeleteBDMember = async (id: string) => {
    try {
      await deleteBDMemberApi(id);
      await loadData();
      showNotification("info", "已删除指定商务人员");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleAddStylePreset = async (preset: Omit<StylePresetItem, 'id'>) => {
    try {
      await addStylePresetApi(preset);
      await loadData();
      showNotification("success", `已新增文章风格预设：${preset.name}`);
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleUpdateStylePreset = async (id: string, updates: Partial<StylePresetItem>) => {
    try {
      await updateStylePresetApi(id, updates);
      await loadData();
      showNotification("success", "风格提示词设置已更新！");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  const handleDeleteStylePreset = async (id: string) => {
    try {
      await deleteStylePresetApi(id);
      await loadData();
      showNotification("info", "已删减选定风格预设");
    } catch (err: any) {
      showNotification("error", err.message);
    }
  };

  if (loading || !pipelineData) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white space-y-4 font-sans">
        <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <div className="text-sm font-bold text-slate-300">正在初始化新能源 AI 文章自动化生成与分发管线...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 font-sans antialiased pb-16">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        stats={pipelineData.stats}
        onRunFullPipeline={handleRunFullPipeline}
        isRunningPipeline={isProcessing}
        scheduleConfig={pipelineData.scheduleConfig}
        onUpdateScheduleConfig={handleUpdateScheduleConfig}
      />

      {/* Floating Notification Toast */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl text-xs font-bold transition-all border flex items-center space-x-2 ${
            notification.type === "success"
              ? "bg-slate-900 text-emerald-400 border-emerald-500/50"
              : notification.type === "error"
              ? "bg-rose-950 text-rose-200 border-rose-500/50"
              : "bg-slate-900 text-cyan-300 border-cyan-500/50"
          }`}
        >
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Module 0: Homepage BD Distribution & Performance Dashboard */}
        {activeTab === "bd_dashboard" && (
          <BDDashboardView
            tasks={pipelineData.distributionTasks || []}
            bdMembers={pipelineData.bdMembers || []}
            articles={pipelineData.articles || []}
            overdueThresholdHours={pipelineData.overdueThresholdHours || 24}
            onSetOverdueRule={handleSetOverdueRule}
            onRemindTask={handleRemindTask}
            onPreviewArticle={(art) => {
              setPreviewArticle(art);
              setPreviewTask(null);
            }}
          />
        )}

        {/* Module 5: Monitor Dashboard */}
        {activeTab === "monitor" && (
          <PipelineMonitor
            stats={pipelineData.stats}
            logs={pipelineData.logs || []}
            distributionTasks={pipelineData.distributionTasks || []}
            bdMembers={pipelineData.bdMembers || []}
            onToggleCron={handleToggleCron}
            onRefresh={loadData}
            onRunCollector={handleTriggerCollector}
            onRunGenerator={() => handleGenerateArticles(3)}
            onRunDistributor={handleDistributeArticles}
            isProcessing={isProcessing}
            onDataChanged={loadData}
            onNotify={showNotification}
          />
        )}

        {/* Module 1: Automated Event Retrieval & Negative Deduplication */}
        {activeTab === "collector" && (
          <AutoCollectorView
            materials={pipelineData.materials || []}
            negativeCache={pipelineData.negativeCache || []}
            collectorConfig={pipelineData.collectorConfig}
            onTriggerCollector={handleTriggerCollector}
            onUpdateCollectorConfig={handleUpdateCollectorConfig}
            onCleanStaleMaterials={handleCleanStaleMaterials}
            onDeleteMaterial={handleDeleteMaterial}
            isProcessing={isProcessing}
          />
        )}

        {/* Module 2: Marketing Team Materials & Image Gallery */}
        {activeTab === "marketing" && (
          <MarketingHubView
            materials={pipelineData.materials || []}
            articles={pipelineData.articles || []}
            imageAssets={pipelineData.imageAssets || []}
            onOpenNewMaterialModal={() => setIsNewMaterialModalOpen(true)}
            onPreviewArticle={(art) => {
              setPreviewArticle(art);
              setPreviewTask(null);
            }}
            onAddImageAsset={handleAddImageAsset}
            onDeleteImageAsset={handleDeleteImageAsset}
          />
        )}

        {/* Module 3-A: AI Content Generation Engine */}
        {activeTab === "generator" && (
          <AIGeneratorView
            materials={pipelineData.materials || []}
            bdMembers={pipelineData.bdMembers || []}
            stylePresets={pipelineData.stylePresets || []}
            onAddStylePreset={handleAddStylePreset}
            onUpdateStylePreset={handleUpdateStylePreset}
            onDeleteStylePreset={handleDeleteStylePreset}
            onGenerateArticles={handleGenerateArticles}
            isGenerating={isProcessing}
            articles={pipelineData.articles || []}
            onPreviewArticle={(art) => {
              setPreviewArticle(art);
              setPreviewTask(null);
            }}
          />
        )}

        {/* Module 3-B: AI Generated Article Library & Time Window Quarantine */}
        {activeTab === "article_library" && (
          <ArticleLibraryView
            articles={pipelineData.articles || []}
            bdMembers={pipelineData.bdMembers || []}
            imageAssets={pipelineData.imageAssets || []}
            dispatchWindowHours={pipelineData.dispatchWindowHours || 24}
            onSetWindowHours={handleSetWindowHours}
            onUpdateArticle={handleUpdateArticle}
            onDispatchNow={handleDispatchArticleNow}
            onPreviewArticle={(art) => {
              setPreviewArticle(art);
              setPreviewTask(null);
            }}
          />
        )}

        {/* Module 5-B: LinkedIn Sales Leads (linkedin-lead-gen) */}
        {activeTab === "leads" && <LeadsView onNotify={showNotification} />}

        {/* Module 4: BD Team Portal & Check-In Action */}
        {activeTab === "bd_portal" && (
          <BDPortalView
            bdMembers={pipelineData.bdMembers || []}
            distributionTasks={pipelineData.distributionTasks || []}
            articles={pipelineData.articles || []}
            onUpdateBDProfile={handleUpdateBDProfile}
            onAddBDMember={handleAddBDMember}
            onImportBDMembers={handleImportBDMembers}
            onDeleteBDMember={handleDeleteBDMember}
            onCheckInTask={handleCheckInBDTask}
            onPreviewPersonalizedArticle={(task) => {
              setPreviewTask(task);
              setPreviewArticle(null);
            }}
          />
        )}
      </main>

      {/* Article Detail / BD Article Preview Modal */}
      {(previewArticle || previewTask) && (
        <ArticleDetailModal
          article={previewArticle}
          task={previewTask}
          onClose={() => {
            setPreviewArticle(null);
            setPreviewTask(null);
          }}
        />
      )}

      {/* Upload New Marketing Material Modal */}
      {isNewMaterialModalOpen && (
        <NewMaterialModal
          onClose={() => setIsNewMaterialModalOpen(false)}
          onSubmit={handleAddMaterial}
        />
      )}
    </div>
  );
}
