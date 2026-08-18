import React, { useState, useEffect } from "react";
import {
  Activity,
  Zap,
  Sparkles,
  Play,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Database,
  Users,
  BarChart3,
  RefreshCw,
  Terminal,
  ArrowUpRight,
  Cpu,
  Key,
  Sliders,
  Check,
  AlertTriangle,
  Radio,
  Trash2,
  Flame,
  Globe,
  SlidersHorizontal,
  ExternalLink,
  Link,
  Server,
  Eye,
  EyeOff,
  ChevronDown,
  Layers,
} from "lucide-react";
import { PipelineStats, PipelineLog, BDDistributionTask, BDMember, AiProvider } from "../types";
import {
  fetchAiConfigApi,
  updateAiConfigApi,
  testAiConfigApi,
  clearDatabaseDataApi,
  AiConfigData,
  ProviderPresetItem,
} from "../lib/api";

interface PipelineMonitorProps {
  stats: PipelineStats;
  logs: PipelineLog[];
  distributionTasks: BDDistributionTask[];
  bdMembers: BDMember[];
  onToggleCron: (enabled: boolean) => void;
  onRefresh: () => void;
  onRunCollector: () => void;
  onRunGenerator: () => void;
  onRunDistributor: () => void;
  isProcessing: boolean;
  onDataChanged?: () => void;
  onNotify?: (type: "success" | "error" | "info", msg: string) => void;
}

const defaultStats: PipelineStats = {
  totalCollected: 0,
  totalDeduped: 0,
  totalMaterials: 0,
  generatedArticlesThisWeek: 0,
  totalDistributed: 0,
  completedCheckIns: 0,
  checkInRate: 0,
  lastRunTime: new Date().toISOString(),
  nextScheduledRun: "明天 09:00",
  cronEnabled: true,
};

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({
  stats = defaultStats,
  logs = [],
  distributionTasks = [],
  bdMembers = [],
  onToggleCron,
  onRefresh,
  onRunCollector,
  onRunGenerator,
  onRunDistributor,
  isProcessing,
  onDataChanged,
  onNotify,
}) => {
  const safeStats = stats || defaultStats;
  const safeLogs = logs || [];
  const safeTasks = distributionTasks || [];

  // AI Configuration State
  const [aiConfig, setAiConfig] = useState<AiConfigData>({
    provider: "gemini",
    apiKey: "",
    hasCustomKey: false,
    baseUrl: "",
    model: "gemini-3.7-flash",
    temperature: 0.3,
    thinkingLevel: "HIGH",
  });
  const [providerPresets, setProviderPresets] = useState<ProviderPresetItem[]>([
    {
      id: "gemini",
      name: "Google Gemini 官方 (推荐/原生联网)",
      provider: "gemini",
      defaultBaseUrl: "",
      defaultModel: "gemini-3.7-flash",
      description: "Google 官方多模态旗舰，支持 Google Search 真实联网检索与深度事实核查。",
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
      description: "阿里云百炼兼容模式，中文产业理解与海外政策研判能力优异。",
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
      name: "自拟模型端点 (Custom OpenAI Endpoint)",
      provider: "openai_compatible",
      defaultBaseUrl: "https://api.your-model-service.com/v1",
      defaultModel: "custom-model",
      description: "支持任意自建 Ollama、vLLM、OneAPI、第三方代理中转站等 OpenAI 标准格式接口。",
      keyPlaceholder: "自定义 API 密钥 (若无鉴权可留空)",
      popularModels: [
        { id: "custom-model", name: "自拟模型名称 (例如 deepseek-r1, llama-3.3-70b 等)" },
      ],
    },
  ]);

  const [selectedPresetId, setSelectedPresetId] = useState<string>("gemini");
  const [provider, setProvider] = useState<AiProvider>("gemini");
  const [baseUrlInput, setBaseUrlInput] = useState<string>("");
  const [customKeyInput, setCustomKeyInput] = useState<string>("");
  const [showKeyText, setShowKeyText] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("gemini-3.7-flash");
  const [temperature, setTemperature] = useState<number>(0.3);
  const [isTestingAi, setIsTestingAi] = useState<boolean>(false);
  const [isSavingAi, setIsSavingAi] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success: boolean;
    model?: string;
    provider?: AiProvider;
    latencyMs?: number;
    groundingSupported?: boolean;
    message?: string;
    sampleOutput?: string;
    errorDetails?: string;
  } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isClearingData, setIsClearingData] = useState<boolean>(false);

  // Load AI configuration on mount
  useEffect(() => {
    loadAiConfig();
  }, []);

  const loadAiConfig = async () => {
    try {
      const res = await fetchAiConfigApi();
      if (res.success && res.config) {
        setAiConfig(res.config);
        const curProvider = res.config.provider || (res.config.baseUrl ? 'openai_compatible' : 'gemini');
        setProvider(curProvider);
        setBaseUrlInput(res.config.baseUrl || "");
        setSelectedModel(res.config.model || (curProvider === 'gemini' ? "gemini-3.7-flash" : "deepseek-v4-flash"));
        setTemperature(res.config.temperature ?? 0.3);

        if (res.providerPresets && res.providerPresets.length > 0) {
          setProviderPresets(res.providerPresets);
        }

        // Match active preset
        if (curProvider === 'gemini') {
          setSelectedPresetId('gemini');
        } else if (res.config.baseUrl?.includes("deepseek.com")) {
          setSelectedPresetId('deepseek');
        } else if (res.config.baseUrl?.includes("dashscope.aliyuncs.com")) {
          setSelectedPresetId('qwen');
        } else if (res.config.baseUrl?.includes("siliconflow.cn")) {
          setSelectedPresetId('siliconflow');
        } else if (res.config.baseUrl?.includes("moonshot.cn")) {
          setSelectedPresetId('moonshot');
        } else if (res.config.baseUrl?.includes("openai.com")) {
          setSelectedPresetId('openai');
        } else {
          setSelectedPresetId('custom');
        }
      }
    } catch (err) {
      console.warn("Failed to load AI config:", err);
    }
  };

  const handleSelectPreset = (preset: ProviderPresetItem) => {
    setSelectedPresetId(preset.id);
    setProvider(preset.provider);
    setBaseUrlInput(preset.defaultBaseUrl || "");
    setSelectedModel(preset.defaultModel);
    setTestResult(null);
  };

  const handleSaveAiConfig = async () => {
    setIsSavingAi(true);
    try {
      const payload: any = {
        provider,
        baseUrl: baseUrlInput.trim(),
        model: selectedModel.trim(),
        temperature,
        thinkingLevel: "HIGH",
      };
      if (customKeyInput.trim()) {
        payload.apiKey = customKeyInput.trim();
      }
      const res = await updateAiConfigApi(payload);
      if (res.success) {
        setAiConfig(res.config);
        setCustomKeyInput("");
        if (onNotify) onNotify("success", `AI 引擎配置已成功保存并生效：[${provider === 'gemini' ? 'Google Gemini' : '自拟第三方模型'}] - ${selectedModel}`);
        if (onDataChanged) onDataChanged();
      }
    } catch (err: any) {
      if (onNotify) onNotify("error", err.message || "更新 AI 配置失败");
    } finally {
      setIsSavingAi(false);
    }
  };

  const handleTestAiConnection = async () => {
    setIsTestingAi(true);
    setTestResult(null);
    try {
      const res = await testAiConfigApi({
        provider,
        baseUrl: baseUrlInput.trim() || undefined,
        apiKey: customKeyInput.trim() || undefined,
        model: selectedModel.trim(),
      });
      setTestResult({
        tested: true,
        success: res.success,
        model: res.model,
        provider: res.provider,
        latencyMs: res.latencyMs,
        groundingSupported: res.groundingSupported,
        message: res.message,
        sampleOutput: res.sampleOutput,
        errorDetails: res.errorDetails,
      });
      if (res.success && onNotify) {
        onNotify("success", `模型接口连通性测试通过 (${res.latencyMs}ms)！模型: ${res.model}`);
      } else if (!res.success && onNotify) {
        onNotify("error", `模型连通性测试未通过: ${res.message}`);
      }
      if (onDataChanged) onDataChanged();
    } catch (err: any) {
      setTestResult({
        tested: true,
        success: false,
        message: err.message || "网络请求失败",
      });
      if (onNotify) onNotify("error", err.message || "连通性测试异常");
    } finally {
      setIsTestingAi(false);
    }
  };

  const handleClearDatabaseData = async () => {
    setIsClearingData(true);
    try {
      const res = await clearDatabaseDataApi();
      setShowClearConfirm(false);
      if (onNotify) onNotify("success", res.message || "数据库假数据已全部清空！");
      if (onDataChanged) onDataChanged();
      onRefresh();
    } catch (err: any) {
      if (onNotify) onNotify("error", err.message || "清空数据失败");
    } finally {
      setIsClearingData(false);
    }
  };

  const dedupRate =
    (safeStats.totalCollected || 0) + (safeStats.totalDeduped || 0) > 0
      ? Math.round(
          ((safeStats.totalDeduped || 0) /
            ((safeStats.totalCollected || 0) + (safeStats.totalDeduped || 0))) *
            100
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Top Architecture & Workflow Overview Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-bold tracking-tight">新能源出海 AI 文章自动化生成与分发管线架构</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              基于内置调研 Prompt 框架与负向去重缓存引擎，自动化连接市场部素材与商务部分发打卡
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition text-xs flex items-center space-x-1"
              title="刷新管线状态"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>刷新状态</span>
            </button>
            <div className="flex items-center space-x-2 bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-slate-400">自动周调度:</span>
              <button
                onClick={() => onToggleCron(!stats.cronEnabled)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  stats.cronEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {stats.cronEnabled ? "已开启 (每周周日)" : "已暂停"}
              </button>
            </div>
          </div>
        </div>

        {/* 5-Step Pipeline Flow Visualization */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Module 1 */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 relative group hover:border-emerald-500/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                模块 1
              </span>
              <Zap className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">海外7区事件检索</h3>
            <p className="text-[11px] text-slate-400 mb-3">负向去重缓存过滤，保留最新增量事件</p>
            <button
              onClick={onRunCollector}
              disabled={isProcessing}
              className="w-full text-center text-[11px] font-medium py-1.5 px-2 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 rounded border border-emerald-500/30 transition flex items-center justify-center space-x-1"
            >
              <span>手动搜采事件</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Module 2 */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 relative group hover:border-teal-500/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                模块 2
              </span>
              <Sparkles className="w-4 h-4 text-teal-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">市场部素材库</h3>
            <p className="text-[11px] text-slate-400 mb-3">上传推文卖点、配图，精选素材列表</p>
            <div className="text-[11px] text-teal-300 bg-teal-500/10 px-2 py-1 rounded text-center border border-teal-500/20">
              已入库素材: {stats.totalMaterials} 项
            </div>
          </div>

          {/* Module 3 */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 relative group hover:border-cyan-500/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                模块 3
              </span>
              <Play className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">AI 撰写文章引擎</h3>
            <p className="text-[11px] text-slate-400 mb-3">每周生成一周长文，嵌入商务咨询插槽</p>
            <button
              onClick={onRunGenerator}
              disabled={isProcessing}
              className="w-full text-center text-[11px] font-medium py-1.5 px-2 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 rounded border border-cyan-500/30 transition flex items-center justify-center space-x-1"
            >
              <span>生成本周文章</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Module 4 */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 relative group hover:border-blue-500/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                模块 4
              </span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">商务部入口与分发</h3>
            <p className="text-[11px] text-slate-400 mb-3">区域专属衔接段落自动拼接与智能分发</p>
            <button
              onClick={onRunDistributor}
              disabled={isProcessing}
              className="w-full text-center text-[11px] font-medium py-1.5 px-2 bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 rounded border border-blue-500/30 transition flex items-center justify-center space-x-1"
            >
              <span>智能推送分发</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          {/* Module 5 */}
          <div className="bg-slate-800/60 border border-slate-700/70 rounded-xl p-4 relative group hover:border-indigo-500/50 transition">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                模块 5
              </span>
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
            </div>
            <h3 className="text-sm font-semibold mb-1">打卡与状态跟踪</h3>
            <p className="text-[11px] text-slate-400 mb-3">商务渠道发布打卡，全管线监控大盘</p>
            <div className="text-[11px] text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded text-center border border-indigo-500/20">
              完成打卡率: {stats.checkInRate}%
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* AI Engine & Multi-Provider API Configuration Card (Non-Gemini & Custom Models) */}
      {/* ========================================================================= */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-emerald-600">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">AI 核心模型与 API 引擎配置</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  provider === 'gemini' 
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                    : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 animate-pulse ${
                    provider === 'gemini' ? 'bg-emerald-500' : 'bg-indigo-500'
                  }`} />
                  {provider === 'gemini' ? 'Google Gemini 引擎' : '自定义第三方模型'} : {selectedModel}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                开放多模型架构：支持 Google Gemini 原生引擎或 DeepSeek、阿里通义千问、硅基流动、月之暗面、OpenAI 及自拟端点
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleTestAiConnection}
              disabled={isTestingAi}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center space-x-1.5 border border-slate-200 disabled:opacity-50"
            >
              <Radio className={`w-3.5 h-3.5 text-emerald-600 ${isTestingAi ? 'animate-spin' : ''}`} />
              <span>{isTestingAi ? "正在连通性测试..." : "测试模型连通性"}</span>
            </button>
            <button
              onClick={handleSaveAiConfig}
              disabled={isSavingAi}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition flex items-center space-x-1.5 shadow-sm disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSavingAi ? "保存中..." : "保存引擎配置"}</span>
            </button>
          </div>
        </div>

        {/* 1. Quick Provider Presets Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>选择主流模型服务商预设 / 协议模板</span>
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              点击即可快速切换基准端点与推荐模型
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
            {providerPresets.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`px-3 py-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                  selectedPresetId === preset.id
                    ? "bg-emerald-50/80 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-500/20 shadow-xs"
                    : "bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100/80"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-xs truncate font-bold">{preset.name.split(' ')[0]}</span>
                  {preset.provider === 'gemini' && (
                    <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-200 text-emerald-900 font-medium">
                      联网
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-500 truncate">{preset.defaultModel}</span>
              </button>
            ))}
          </div>
        </div>

        {/* 2. Detailed Configuration Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-1">
          {/* Left Column (Col 6): Endpoint Base URL & Model Name */}
          <div className="md:col-span-6 space-y-4">
            {/* Protocol & Base URL */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-600" />
                  <span>自拟模型链接 / API 端点 (Base URL)</span>
                </label>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-mono">
                  {provider === 'gemini' ? 'Google 原生 SDK 路由' : 'OpenAI 协议 (/chat/completions)'}
                </span>
              </div>

              <div className="relative">
                <input
                  type="text"
                  disabled={provider === 'gemini'}
                  placeholder={provider === 'gemini' ? "Google Gemini 原生 SDK 自动托管端点（无需填写）" : "例如: https://api.deepseek.com/v1 或您的中转/自建端点"}
                  value={provider === 'gemini' ? "" : baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  className={`w-full text-xs px-3.5 py-2.5 rounded-xl border text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono ${
                    provider === 'gemini' ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-slate-50 border-slate-200'
                  }`}
                />
                {provider !== 'gemini' && (
                  <div className="absolute right-2.5 top-2.5">
                    <Link className="w-4 h-4 text-slate-400" />
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                {provider === 'gemini' 
                  ? "Google Gemini 官方引擎由原生 @google/genai SDK 驱动，具备 Google 实时权威搜索 Grounding 能力。" 
                  : "兼容所有遵循 OpenAI 标准接口规范的自拟端点（DeepSeek、Qwen、SiliconFlow、Moonshot、Ollama、OneAPI 等）。"}
              </p>
            </div>

            {/* Model Name & Popular Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>模型标识名称 (Model Name)</span>
              </label>

              {/* Popular model tags for current provider */}
              {(() => {
                const currentPreset = providerPresets.find(p => p.id === selectedPresetId);
                if (currentPreset && currentPreset.popularModels.length > 0) {
                  return (
                    <div className="flex flex-wrap gap-1.5 pb-1">
                      {currentPreset.popularModels.map((pm) => (
                        <button
                          key={pm.id}
                          type="button"
                          onClick={() => setSelectedModel(pm.id)}
                          className={`px-2 py-1 text-[11px] rounded-lg border transition font-mono ${
                            selectedModel === pm.id
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-semibold"
                              : "bg-slate-100/80 text-slate-600 border-slate-200 hover:bg-slate-200/80"
                          }`}
                        >
                          {pm.id}
                        </button>
                      ))}
                    </div>
                  );
                }
                return null;
              })()}

              <input
                type="text"
                placeholder="自拟模型名称，例如: deepseek-v4-flash, qwen-plus, gemini-3.7-flash, gpt-4o"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          {/* Right Column (Col 6): API Key & Temperature & Test */}
          <div className="md:col-span-6 space-y-4">
            {/* Custom Key Input */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" />
                  <span>配置对应 API 密钥 (API Key / Token)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  {aiConfig.hasCustomKey ? "已配置密钥 (输入可覆盖更新)" : "未配置或使用环境缺省"}
                </span>
              </div>
              <div className="relative">
                <input
                  type={showKeyText ? "text" : "password"}
                  placeholder={
                    aiConfig.hasCustomKey
                      ? "已保存安全密钥（输入新 Key 可直接覆盖）"
                      : provider === 'gemini'
                      ? "请输入 GEMINI_API_KEY (AIzaSy...)"
                      : "请输入对应的 API Key (sk-...)"
                  }
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowKeyText(!showKeyText)}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 transition"
                  title={showKeyText ? "隐藏明文" : "显示明文"}
                >
                  {showKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                安全保障：API 密钥仅保存在安全的服务端内存中进行反向代理，不会泄露至前端。
              </p>
            </div>

            {/* Temperature Slider */}
            <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center space-x-1">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                  <span>严谨度控制 (Temperature: {temperature})</span>
                </span>
                <span className="text-slate-500 text-[11px]">
                  {temperature <= 0.2 ? "硬核事实核查 (严谨)" : temperature <= 0.5 ? "出海洞察标准 (平衡)" : "开放创意"}
                </span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>0.0 (最严谨)</span>
                <span>0.3 (出海分析推荐)</span>
                <span>1.0 (开放创意)</span>
              </div>
            </div>

            {/* Live Connection Test Result Display */}
            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 transition ${
                  testResult.success
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-rose-50/80 border-rose-200 text-rose-900"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">
                      {testResult.success ? "模型接口连通性测试通过" : "连通性测试未通过"}
                    </span>
                    {testResult.latencyMs !== undefined && (
                      <span className={`font-mono text-[11px] px-1.5 py-0.5 rounded ${
                        testResult.success ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        响应延迟: {testResult.latencyMs}ms
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] leading-normal">{testResult.message}</p>
                  {testResult.sampleOutput && (
                    <div className="mt-1 pt-1 border-t border-emerald-200/60 font-mono text-[10px] text-slate-600">
                      模型验证输出: "{testResult.sampleOutput}"
                    </div>
                  )}
                  {testResult.errorDetails && (
                    <div className="mt-1 pt-1 border-t border-rose-200/60 font-mono text-[10px] text-rose-700 truncate">
                      错误详情: {testResult.errorDetails}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Collector Monitoring */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">采集与去重监控</h3>
                <p className="text-xs text-slate-500">海外7大区域自动化搜索</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              去重率 {dedupRate}%
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">增量事件总数</span>
              <span className="text-2xl font-black text-slate-900">{stats.totalCollected}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">负向拦截旧闻</span>
              <span className="text-2xl font-black text-emerald-600">{stats.totalDeduped}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>负向提示词（Negative Cache）已生效，自动剔除与近一周高度重合的政策/项目旧新闻。</span>
          </div>
        </div>

        {/* AI Article Generation Monitoring */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-cyan-50 text-cyan-600">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">生成引擎监控</h3>
                <p className="text-xs text-slate-500">每周标准长文撰写</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-cyan-50 text-cyan-700 border border-cyan-200">
              100% 挂钩插槽
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">本周已生成</span>
              <span className="text-2xl font-black text-slate-900">{stats.generatedArticlesThisWeek} 篇</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-xs text-slate-500 block">素材利用率</span>
              <span className="text-2xl font-black text-cyan-600">
                {stats.totalMaterials > 0 ? `${Math.min(100, Math.round((stats.generatedArticlesThisWeek * 2 / stats.totalMaterials) * 100))}%` : "0%"}
              </span>
            </div>
          </div>

          <div className="text-xs text-slate-500 bg-cyan-50/50 p-3 rounded-xl border border-cyan-100/60 flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>自动在文章结尾渲染挂钩点 <code className="text-cyan-800 font-mono bg-cyan-100 px-1 rounded">{"{{BD_CONSULTATION_SLOT}}"}</code>。</span>
          </div>
        </div>

        {/* BD Check-In Rate Monitoring */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">分发与打卡监控</h3>
                <p className="text-xs text-slate-500">商务人员宣传打卡状态</p>
              </div>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              {stats.completedCheckIns}/{stats.totalDistributed} 已打卡
            </span>
          </div>

          {/* Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-500">商务分发打卡完成率</span>
              <span className="font-bold text-indigo-600">{stats.checkInRate}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-teal-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.checkInRate}%` }}
              />
            </div>
          </div>

          {/* BD Status Breakdown List */}
          <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1 text-xs">
            {distributionTasks.slice(0, 4).map((task) => (
              <div key={task.id} className="flex items-center justify-between py-1 border-b border-slate-50 last:border-0">
                <div className="flex items-center space-x-2 truncate">
                  <span className={`w-2 h-2 rounded-full ${task.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                  <span className="font-medium text-slate-800 truncate">{task.bdName}</span>
                </div>
                <span className={`text-[11px] font-semibold px-1.5 py-0.5 rounded ${
                  task.status === 'published' 
                    ? 'bg-emerald-100 text-emerald-800' 
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {task.status === 'published' ? `已打卡 (${task.publishChannel || '已发'})` : '待打卡确认'}
                </span>
              </div>
            ))}
            {distributionTasks.length === 0 && (
              <div className="text-center py-3 text-slate-400 text-xs">
                暂无待分发或打卡任务
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Database Hygiene & Cleanup Section */}
      <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-slate-200 text-slate-700">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">数据库洁净度维护</h4>
            <p className="text-[11px] text-slate-500">
              当前数据库包含 {stats.totalMaterials} 条素材、{stats.generatedArticlesThisWeek} 篇本周文章、{distributionTasks.length} 个分发任务
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          {!showClearConfirm ? (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>清空数据库假数据</span>
            </button>
          ) : (
            <div className="flex items-center space-x-2 bg-rose-100/90 border border-rose-300 px-3 py-1.5 rounded-lg text-xs">
              <span className="text-rose-800 font-semibold">确认彻底清空所有文章/事件/商务数据？</span>
              <button
                onClick={handleClearDatabaseData}
                disabled={isClearingData}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] transition shadow-sm"
              >
                {isClearingData ? "清空中..." : "确认清空"}
              </button>
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[11px] transition"
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Pipeline System Real-Time Terminal Log */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-slate-200 font-mono text-xs space-y-3 shadow-xl">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white text-sm">系统实时调度终端日志 (Pipeline Engine Terminal Logs)</span>
          </div>
          <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            Realtime Stream
          </span>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto pr-2 font-mono leading-relaxed">
          {logs.map((log) => {
            const levelColor =
              log.level === "success"
                ? "text-emerald-400"
                : log.level === "warning"
                ? "text-amber-400"
                : log.level === "error"
                ? "text-rose-400"
                : "text-cyan-400";

            return (
              <div
                key={log.id}
                className="flex items-start space-x-3 text-[11px] hover:bg-slate-900/60 p-1.5 rounded transition"
              >
                <span className="text-slate-500 shrink-0">
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-semibold shrink-0">
                  {log.module}
                </span>
                <span className={`font-semibold shrink-0 uppercase ${levelColor}`}>
                  [{log.level}]
                </span>
                <div className="flex-1 text-slate-300">
                  <span>{log.message}</span>
                  {log.details && (
                    <p className="text-slate-500 text-[10px] mt-0.5">{log.details}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
