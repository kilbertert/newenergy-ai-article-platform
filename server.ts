import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { store } from "./src/server/store";

async function startServer() {
  const app = express();
  const PORT = 8580;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // === API ROUTES ===
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  // Get full current pipeline state
  app.get("/api/pipeline/data", (req, res) => {
    res.json({
      materials: store.getMaterials(),
      negativeCache: store.getNegativeCache(),
      bdMembers: store.getBDMembers(),
      articles: store.getArticles(),
      distributionTasks: store.getDistributionTasks(),
      imageAssets: store.getImageAssets(),
      dispatchWindowHours: store.getDefaultDispatchWindowHours(),
      overdueThresholdHours: store.getOverdueThresholdHours(),
      scheduleConfig: store.getScheduleConfig(),
      stylePresets: store.getStylePresets(),
      collectorConfig: store.getCollectorConfig(),
      logs: store.getLogs(),
      stats: store.getStats(),
    });
  });

  // Image Assets API (Support direct image and video uploads via data URLs)
  app.post("/api/images/add", (req, res) => {
    try {
      const { title, url, mediaType, fileName, fileSize, remarks, tags, region } = req.body;
      if (!title || !url || !remarks) {
        return res.status(400).json({ success: false, error: "Missing required fields: title, url, remarks" });
      }
      const newImg = store.addImageAsset({ title, url, mediaType, fileName, fileSize, remarks, tags, region });
      res.json({ success: true, imageAsset: newImg, imageAssets: store.getImageAssets(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete("/api/images/:id", (req, res) => {
    try {
      store.deleteImageAsset(req.params.id);
      res.json({ success: true, imageAssets: store.getImageAssets(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Article Update API
  app.post("/api/articles/update", (req, res) => {
    try {
      const { id, updates } = req.body;
      if (!id || !updates) {
        return res.status(400).json({ success: false, error: "Missing article id or updates" });
      }
      const updatedArticle = store.updateArticle(id, updates);
      res.json({ success: true, article: updatedArticle, articles: store.getArticles(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Dispatch Article Now API
  app.post("/api/articles/dispatch-now", async (req, res) => {
    try {
      const { articleId } = req.body;
      if (!articleId) {
        return res.status(400).json({ success: false, error: "Missing articleId" });
      }
      const art = await store.dispatchArticleNow(articleId);
      res.json({
        success: true,
        article: art,
        articles: store.getArticles(),
        distributionTasks: store.getDistributionTasks(),
        logs: store.getLogs(),
        stats: store.getStats(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Set Window Hours API
  app.post("/api/articles/set-window-hours", (req, res) => {
    try {
      const { hours } = req.body;
      const h = store.setDispatchWindowHours(Number(hours) || 24);
      res.json({ success: true, dispatchWindowHours: h, logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Remind BD Task API
  app.post("/api/bd/remind", (req, res) => {
    try {
      const { taskId } = req.body;
      const task = store.remindBDTask(taskId);
      res.json({ success: true, task, logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Trigger Collector & Negative Deduplication
  app.post("/api/collector/run", async (req, res) => {
    try {
      const { searchInstruction, freshnessWindow, enableWebSearch } = req.body || {};
      const result = await store.triggerCollector({
        searchInstruction,
        freshnessWindow,
        enableWebSearch,
      });

      const isSuccess = result.searchStatus?.success ?? true;
      const statusMsg = isSuccess
        ? `从海外 7 大区域成功抓取 ${result.addedMaterialsCount} 项 2026 最新增量事件，成功负向去重 ${result.dedupedCount} 项陈旧历史事件。`
        : `联网采集提示：${result.searchStatus?.errorMessage || '未能采集到有效事件'}`;

      res.json({
        success: isSuccess,
        message: statusMsg,
        data: result,
        state: {
          materials: store.getMaterials(),
          negativeCache: store.getNegativeCache(),
          collectorConfig: store.getCollectorConfig(),
          stats: store.getStats(),
          logs: store.getLogs(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Collector execution failed" });
    }
  });

  // Update Collector Prompt & Freshness Config
  app.post("/api/collector/config", (req, res) => {
    try {
      const { searchInstruction, freshnessWindow, enableWebSearch, minImportanceScore, strictYearFilter } = req.body;
      const updated = store.updateCollectorConfig({
        searchInstruction,
        freshnessWindow,
        enableWebSearch,
        minImportanceScore,
        strictYearFilter,
      });
      res.json({
        success: true,
        collectorConfig: updated,
        logs: store.getLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Clean Stale / Outdated Materials
  app.post("/api/collector/clean-stale", (req, res) => {
    try {
      const result = store.cleanStaleMaterials();
      res.json({
        success: true,
        cleanedCount: result.cleanedCount,
        materials: result.remainingMaterials,
        logs: store.getLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add Marketing Team Material
  app.post("/api/materials/add", (req, res) => {
    try {
      const { title, region, category, summary, fullContent, imageUrl, mediaType, mediaFileName, fileSize, tags } = req.body;
      if (!title || !region || !summary) {
        return res.status(400).json({ success: false, error: "Missing required fields: title, region, summary" });
      }
      const newMat = store.addMarketingMaterial({ title, region, category, summary, fullContent, imageUrl, mediaType, mediaFileName, fileSize, tags });
      res.json({
        success: true,
        material: newMat,
        materials: store.getMaterials(),
        logs: store.getLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Material
  app.delete("/api/materials/:id", (req, res) => {
    try {
      store.deleteMaterial(req.params.id);
      res.json({ success: true, materials: store.getMaterials() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Generate AI Articles (LinkedIn Style & Granular Event Selection & Internationalization)
  app.post("/api/articles/generate", async (req, res) => {
    try {
      const { count = 3, selectedMaterialIds, stylePreset, targetLanguage = "en", assignedBdIds, skipQuarantine = false } = req.body;
      const articles = await store.generateWeeklyArticles(count, selectedMaterialIds, stylePreset, targetLanguage, assignedBdIds, skipQuarantine);
      res.json({
        success: true,
        count: articles.length,
        articles,
        state: {
          articles: store.getArticles(),
          distributionTasks: store.getDistributionTasks(),
          stats: store.getStats(),
          logs: store.getLogs(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || "Article generation failed" });
    }
  });

  // Auto Distribute Articles
  app.post("/api/articles/distribute", async (req, res) => {
    try {
      const tasks = await store.autoDistributeArticles();
      res.json({
        success: true,
        tasks,
        state: {
          articles: store.getArticles(),
          distributionTasks: store.getDistributionTasks(),
          stats: store.getStats(),
          logs: store.getLogs(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update BD Profile & Consultation Info
  app.post("/api/bd/update", async (req, res) => {
    try {
      const updatedBD = await store.updateBDProfile(req.body);
      if (!updatedBD) {
        return res.status(404).json({ success: false, error: "BD member not found" });
      }
      res.json({
        success: true,
        bdMember: updatedBD,
        state: {
          bdMembers: store.getBDMembers(),
          distributionTasks: store.getDistributionTasks(),
          logs: store.getLogs(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // BD Read / Publish Check-In (打卡)
  app.post("/api/bd/checkin", (req, res) => {
    try {
      const { taskId, publishChannel, proofNote } = req.body;
      if (!taskId || !publishChannel) {
        return res.status(400).json({ success: false, error: "Missing taskId or publishChannel" });
      }
      const updatedTask = store.checkInBDTask(taskId, publishChannel, proofNote);
      if (!updatedTask) {
        return res.status(404).json({ success: false, error: "Task not found" });
      }
      res.json({
        success: true,
        task: updatedTask,
        state: {
          distributionTasks: store.getDistributionTasks(),
          stats: store.getStats(),
          logs: store.getLogs(),
        }
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Toggle Automated Weekly Schedule
  app.post("/api/cron/toggle", (req, res) => {
    try {
      const enabled = store.toggleCron(req.body.enabled);
      res.json({ success: true, cronEnabled: enabled, stats: store.getStats(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add BD Member
  app.post("/api/bd/add", (req, res) => {
    try {
      const member = store.addBDMember(req.body);
      res.json({ success: true, bdMember: member, bdMembers: store.getBDMembers(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Batch Import BD Members
  app.post("/api/bd/import", (req, res) => {
    try {
      const { members } = req.body;
      if (!Array.isArray(members) || members.length === 0) {
        return res.status(400).json({ success: false, error: "Invalid members array" });
      }
      const created = store.importBDMembers(members);
      res.json({ success: true, importedCount: created.length, bdMembers: store.getBDMembers(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete BD Member
  app.delete("/api/bd/:id", (req, res) => {
    try {
      store.deleteBDMember(req.params.id);
      res.json({ success: true, bdMembers: store.getBDMembers(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Set Overdue Threshold Hours Rule
  app.post("/api/overdue/set-rule", (req, res) => {
    try {
      const { hours } = req.body;
      const h = store.setOverdueThresholdHours(Number(hours) || 24);
      res.json({ success: true, overdueThresholdHours: h, stats: store.getStats(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update Schedule Config
  app.post("/api/schedule/update", (req, res) => {
    try {
      const config = store.updateScheduleConfig(req.body);
      res.json({ success: true, scheduleConfig: config, stats: store.getStats(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Add Style Preset
  app.post("/api/styles/add", (req, res) => {
    try {
      const preset = store.addStylePreset(req.body);
      res.json({ success: true, stylePreset: preset, stylePresets: store.getStylePresets(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Update Style Preset
  app.post("/api/styles/update", (req, res) => {
    try {
      const { id, updates } = req.body;
      const updated = store.updateStylePreset(id, updates);
      res.json({ success: true, stylePreset: updated, stylePresets: store.getStylePresets(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Delete Style Preset
  app.delete("/api/styles/:id", (req, res) => {
    try {
      store.deleteStylePreset(req.params.id);
      res.json({ success: true, stylePresets: store.getStylePresets(), logs: store.getLogs() });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === AI API CONFIGURATION & MODEL SWITCHING ===
  app.get("/api/ai-config", (req, res) => {
    try {
      const config = store.getAiConfig();
      res.json({
        success: true,
        config: {
          provider: config.provider || 'gemini',
          apiKey: config.apiKey ? config.apiKey : "",
          hasCustomKey: Boolean(config.apiKey),
          baseUrl: config.baseUrl || "",
          model: config.model,
          temperature: config.temperature,
          thinkingLevel: config.thinkingLevel,
        },
        providerPresets: [
          {
            id: "gemini",
            name: "Google Gemini 官方引擎 (推荐)",
            provider: "gemini",
            defaultBaseUrl: "",
            defaultModel: "gemini-3.7-flash",
            description: "原生 Google GenAI 架构，支持 Google Search 实时联网检索 (Grounding) 与深度研判推理。",
            keyPlaceholder: "AIzaSy...",
            popularModels: [
              { id: "gemini-3.7-flash", name: "Gemini 3.7 Flash (极速联网/最新旗舰推荐)" },
              { id: "gemini-3.7-pro", name: "Gemini 3.7 Pro (复杂长文本深度推理)" },
              { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash (轻量高效)" },
              { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro (通用深度研判)" },
            ],
          },
          {
            id: "deepseek",
            name: "DeepSeek 深度求索 (OpenAI 协议)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://api.deepseek.com",
            defaultModel: "deepseek-v4-flash",
            description: "官方最新 DeepSeek-V4 系列：Flash 极速通用、Pro 深度推理，长文本理解与商业分析能力极佳。",
            keyPlaceholder: "sk-...",
            popularModels: [
              { id: "deepseek-v4-flash", name: "DeepSeek V4 Flash (deepseek-v4-flash 极速通用·最新推荐)" },
              { id: "deepseek-v4-pro", name: "DeepSeek V4 Pro (deepseek-v4-pro 深度推理·复杂研判)" },
            ],
          },
          {
            id: "qwen",
            name: "阿里通义千问 (DashScope / 百炼)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
            defaultModel: "qwen-plus",
            description: "阿里云百炼兼容模式，中文产业理解与政策出海研判优异。",
            keyPlaceholder: "sk-...",
            popularModels: [
              { id: "qwen-plus", name: "Qwen Plus (通义千问进阶版/高性价比)" },
              { id: "qwen-max", name: "Qwen Max (通义千问旗舰级超强推理)" },
              { id: "qwen-turbo", name: "Qwen Turbo (通义千问极速轻量)" },
            ],
          },
          {
            id: "siliconflow",
            name: "硅基流动 (SiliconFlow)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://api.siliconflow.cn/v1",
            defaultModel: "deepseek-ai/DeepSeek-V3",
            description: "国内极速模型托管平台，支持 DeepSeek、Qwen2.5 等开源多模态算力。",
            keyPlaceholder: "sk-...",
            popularModels: [
              { id: "deepseek-ai/DeepSeek-V3", name: "DeepSeek-V3 (硅基流动云端极速)" },
              { id: "deepseek-ai/DeepSeek-R1", name: "DeepSeek-R1 (硅基流动推理版)" },
              { id: "Qwen/Qwen2.5-72B-Instruct", name: "Qwen2.5-72B-Instruct" },
            ],
          },
          {
            id: "moonshot",
            name: "月之暗面 Kimi (Moonshot AI)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://api.moonshot.cn/v1",
            defaultModel: "moonshot-v1-8k",
            description: "超长上下文专家，适合海量出海研报长文深度梳理。",
            keyPlaceholder: "sk-...",
            popularModels: [
              { id: "moonshot-v1-8k", name: "moonshot-v1-8k" },
              { id: "moonshot-v1-32k", name: "moonshot-v1-32k" },
              { id: "moonshot-v1-128k", name: "moonshot-v1-128k (超长文本)" },
            ],
          },
          {
            id: "openai",
            name: "OpenAI (GPT-4o / GPT-4o-mini)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://api.openai.com/v1",
            defaultModel: "gpt-4o",
            description: "OpenAI 官方或海外中转网关，全球顶尖多语言综合能力。",
            keyPlaceholder: "sk-...",
            popularModels: [
              { id: "gpt-4o", name: "GPT-4o (全能旗舰)" },
              { id: "gpt-4o-mini", name: "GPT-4o Mini (轻量极速)" },
              { id: "o3-mini", name: "o3-mini (深度数理与逻辑研判)" },
            ],
          },
          {
            id: "custom",
            name: "自定义 / 自建模型端点 (Custom OpenAI Endpoint)",
            provider: "openai_compatible",
            defaultBaseUrl: "https://your-custom-api.com/v1",
            defaultModel: "custom-model",
            description: "支持任意自建 Ollama、vLLM、OneAPI、第三方代理中转站等 OpenAI 标准格式接口。",
            keyPlaceholder: "自定义 API 密钥 (若无鉴权可留空)",
            popularModels: [
              { id: "custom-model", name: "自拟模型名称 (例如 deepseek-r1, llama-3.3-70b 等)" },
            ],
          },
        ],
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/ai-config", (req, res) => {
    try {
      const { provider, apiKey, baseUrl, model, temperature, thinkingLevel } = req.body;
      const updated = store.updateAiConfig({
        ...(provider !== undefined ? { provider } : {}),
        ...(apiKey !== undefined ? { apiKey } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(model !== undefined ? { model } : {}),
        ...(temperature !== undefined ? { temperature: Number(temperature) } : {}),
        ...(thinkingLevel !== undefined ? { thinkingLevel } : {}),
      });

      res.json({
        success: true,
        config: {
          provider: updated.provider,
          apiKey: updated.apiKey ? updated.apiKey : "",
          hasCustomKey: Boolean(updated.apiKey),
          baseUrl: updated.baseUrl,
          model: updated.model,
          temperature: updated.temperature,
          thinkingLevel: updated.thinkingLevel,
        },
        logs: store.getLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post("/api/ai-config/test", async (req, res) => {
    try {
      const { provider, apiKey, baseUrl, model } = req.body;
      const result = await store.testAiConnection(apiKey, model, baseUrl, provider);
      res.json({
        success: result.success,
        model: result.modelUsed,
        provider: result.providerUsed,
        latencyMs: result.latencyMs,
        groundingSupported: result.groundingSupported,
        message: result.message,
        sampleOutput: result.testResponse,
        errorDetails: result.errorDetails,
        logs: store.getLogs(),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === LINKEDIN LEADS PROXY (linkedin-lead-gen service @ :8100) ===
  const LEAD_GEN_BASE = "http://127.0.0.1:8100";
  const LEAD_GEN_AUTH =
    "Basic " + Buffer.from("beta:VFngHhHIPe71nutiKEnnPBWq").toString("base64");

  // Forward request to linkedin-lead-gen, returning its JSON verbatim.
  // Passes through GET query string and, when method is POST, a JSON body.
  async function proxyLeadGen(
    req: express.Request,
    res: express.Response,
    path: string,
    method: string = "GET"
  ) {
    try {
      const query = req.originalUrl.includes("?")
        ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
        : "";
      const upstream = await fetch(`${LEAD_GEN_BASE}${path}${query}`, {
        method,
        headers: {
          Authorization: LEAD_GEN_AUTH,
          ...(method === "POST" ? { "Content-Type": "application/json" } : {}),
        },
        ...(method === "POST" ? { body: JSON.stringify(req.body ?? {}) } : {}),
      });
      const body = await upstream.text();
      res.status(upstream.status).set("Content-Type", "application/json").send(body);
    } catch (err: any) {
      res.status(502).json({
        success: false,
        error: `LinkedIn Leads 服务(8100)不可达: ${err.message || err}`,
      });
    }
  }

  app.get("/api/leads", (req, res) => proxyLeadGen(req, res, "/leads"));
  app.get("/api/leads/:id", (req, res) =>
    proxyLeadGen(req, res, `/leads/${encodeURIComponent(req.params.id)}`)
  );
  // Create an async LinkedIn search mining task; body passthrough {keywords, max_posts?, posted_limit?}.
  app.post("/api/leads/search", (req, res) =>
    proxyLeadGen(req, res, "/tasks/linkedin-search", "POST")
  );
  // Task status/detail by id.
  app.get("/api/leads/task/:id", (req, res) =>
    proxyLeadGen(req, res, `/tasks/${encodeURIComponent(req.params.id)}`)
  );

  // Clear Database Mock / Fake Data
  app.post("/api/clear-database-data", (req, res) => {
    try {
      const result = store.clearAllDatabaseData();
      res.json({
        success: true,
        message: result.message,
        state: {
          materials: store.getMaterials(),
          negativeCache: store.getNegativeCache(),
          bdMembers: store.getBDMembers(),
          articles: store.getArticles(),
          distributionTasks: store.getDistributionTasks(),
          imageAssets: store.getImageAssets(),
          logs: store.getLogs(),
          stats: store.getStats(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // === VITE MIDDLEWARE OR STATIC SERVING ===
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Pipeline System Engine server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
