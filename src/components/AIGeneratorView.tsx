import React, { useState } from "react";
import {
  Play,
  Sparkles,
  FileText,
  CheckCircle2,
  Settings,
  ArrowRight,
  Info,
  Filter,
  Calendar,
  Globe,
  CheckSquare,
  Square,
  Linkedin,
  Layers,
  Sparkle,
  Languages,
  Users,
  Zap,
  Check,
  Plus,
  Edit2,
  Trash2,
  X,
  Sliders,
  HelpCircle,
} from "lucide-react";
import {
  Material,
  Article,
  BDMember,
  Region,
  TimeFilter,
  StylePreset,
  StylePresetItem,
  TargetLanguage,
  TARGET_LANGUAGE_NAMES,
} from "../types";
import { REGION_NAMES, CATEGORY_NAMES } from "../server/geminiService";

interface AIGeneratorViewProps {
  materials: Material[];
  bdMembers: BDMember[];
  onGenerateArticles: (
    count: number,
    selectedMaterialIds?: string[],
    stylePreset?: string,
    targetLanguage?: TargetLanguage,
    assignedBdIds?: string[],
    skipQuarantine?: boolean
  ) => void;
  isGenerating: boolean;
  articles: Article[];
  onPreviewArticle: (art: Article) => void;
  stylePresets?: StylePresetItem[];
  onAddStylePreset?: (preset: Omit<StylePresetItem, "id">) => void;
  onUpdateStylePreset?: (id: string, updates: Partial<StylePresetItem>) => void;
  onDeleteStylePreset?: (id: string) => void;
}

const DEFAULT_PRESETS: StylePresetItem[] = [
  {
    id: "LinkedInPost",
    name: "⚡ 海外爆款领英帖 (LinkedIn Post)",
    description: "含 Emoji 首行 Hook、数据清单、海外高管话术与热门 Hashtags",
    promptInstruction:
      "采用全球领英高赞爆款排版：第一行必须为极具吸引力的高管级行业痛点 Hook（配 Emoji）；正文采用高密度项目与技术数据清单（使用 🔹 或 • 列出）；段落之间空一行以保持极佳的移动端阅读体验；结尾以开放性高管问题引发评论区互动，并附上 3-5 个行业英文热门 Hashtags（如 #CleanEnergy #BESS #GridForming 等）。",
    isBuiltIn: true,
  },
  {
    id: "DeepInsight",
    name: "📊 领英深度趋势帖 (Deep Insight)",
    description: "针对项目投资与政策规范的结构化深度分析长帖",
    promptInstruction:
      "采用行业智库与麦肯锡级深度研报风格：开篇概述区域宏观政策与供需矛盾；中篇从财务回报率（IRR）、平准化度电成本（LCOE）以及电网构网合规（Grid Code Compliance）三个维度展开深度技术经济学剖析；结尾给出面向海外 EPC 与投资机构的选型落地建议。",
    isBuiltIn: true,
  },
  {
    id: "ExecutiveDigest",
    name: "🚀 高管观点总结帖 (Executive Digest)",
    description: "高密度极简要点，重点突出商机与设备选型建议",
    promptInstruction:
      "采用跨国新能源企业 CXO / VP 视角的极简硬核体：拒绝空话套话，全文由 3-4 个核心洞察要点组成，突出商业机遇、设备选型关键参数与供应链抗风险策略，适合繁忙的海外决策层快速扫读。",
    isBuiltIn: true,
  },
];

export const AIGeneratorView: React.FC<AIGeneratorViewProps> = ({
  materials = [],
  bdMembers = [],
  onGenerateArticles,
  isGenerating,
  articles = [],
  onPreviewArticle,
  stylePresets = DEFAULT_PRESETS,
  onAddStylePreset,
  onUpdateStylePreset,
  onDeleteStylePreset,
}) => {
  const safeBdMembers = bdMembers || [];
  const safeMaterials = materials || [];
  const safeArticles = articles || [];
  const safeStylePresets = (stylePresets && stylePresets.length > 0) ? stylePresets : DEFAULT_PRESETS;

  const [selectedWeek, setSelectedWeek] = useState<string>("2026-W33");
  const [selectedStyleId, setSelectedStyleId] = useState<string>(
    safeStylePresets[0]?.id || "LinkedInPost"
  );
  const [targetLanguage, setTargetLanguage] = useState<TargetLanguage>("en");
  const [generationStrategy, setGenerationStrategy] = useState<
    "fixed_pipeline" | "manual"
  >("manual");

  // BD recipients selection for manual mode
  const [selectedBdIds, setSelectedBdIds] = useState<string[]>(
    safeBdMembers.map((b) => b.id)
  );

  // Filters state for events selection
  const [regionFilter, setRegionFilter] = useState<Region | "ALL">("ALL");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("ALL");
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [generationMode, setGenerationMode] = useState<"separate" | "batch">(
    "separate"
  );
  const [batchCount, setBatchCount] = useState<number>(3);

  // Style Preset Management Modal State
  const [showStyleModal, setShowStyleModal] = useState<boolean>(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editPromptText, setEditPromptText] = useState<string>("");
  const [editNameText, setEditNameText] = useState<string>("");
  const [editDescText, setEditDescText] = useState<string>("");

  // Add New Style Preset State
  const [isAddingNewStyle, setIsAddingNewStyle] = useState<boolean>(false);
  const [newStyleName, setNewStyleName] = useState<string>("");
  const [newStyleDesc, setNewStyleDesc] = useState<string>("");
  const [newStylePrompt, setNewStylePrompt] = useState<string>("");

  // Toggle BD selection
  const toggleBdSelection = (id: string) => {
    setSelectedBdIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllBds = () => {
    setSelectedBdIds(bdMembers.map((b) => b.id));
  };

  const handleClearBds = () => {
    setSelectedBdIds([]);
  };

  // Helper to filter materials by time
  const isWithinTimeRange = (createdAt: string, filter: TimeFilter): boolean => {
    if (filter === "ALL") return true;
    const dateMs = new Date(createdAt).getTime();
    const nowMs = Date.now();
    const hoursDiff = (nowMs - dateMs) / (1000 * 3600);

    if (filter === "24h") return hoursDiff <= 24;
    if (filter === "7d") return hoursDiff <= 24 * 7;
    if (filter === "30d") return hoursDiff <= 24 * 30;
    return true;
  };

  // Filtered materials
  const filteredMaterials = materials.filter((m) => {
    const matchRegion = regionFilter === "ALL" || m.region === regionFilter;
    const matchTime = isWithinTimeRange(m.createdAt, timeFilter);
    return matchRegion && matchTime;
  });

  // Toggle selection for an event
  const toggleMaterialSelection = (id: string) => {
    setSelectedMaterialIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Select All / Clear
  const handleSelectAllFiltered = () => {
    const filteredIds = filteredMaterials.map((m) => m.id);
    const allSelected = filteredIds.every((id) =>
      selectedMaterialIds.includes(id)
    );
    if (allSelected) {
      setSelectedMaterialIds((prev) =>
        prev.filter((id) => !filteredIds.includes(id))
      );
    } else {
      setSelectedMaterialIds((prev) =>
        Array.from(new Set([...prev, ...filteredIds]))
      );
    }
  };

  const handleClearSelection = () => {
    setSelectedMaterialIds([]);
  };

  // Trigger generation
  const handleStartGeneration = () => {
    const isManual = generationStrategy === "manual";
    const countToGen =
      generationMode === "separate"
        ? selectedMaterialIds.length > 0
          ? selectedMaterialIds.length
          : 1
        : batchCount;

    onGenerateArticles(
      countToGen,
      selectedMaterialIds,
      selectedStyleId,
      targetLanguage,
      isManual ? selectedBdIds : undefined,
      isManual // skipQuarantine = true when manual
    );
  };

  // Style Prompt Edit Handlers
  const handleStartEditPreset = (preset: StylePresetItem) => {
    setEditingPresetId(preset.id);
    setEditNameText(preset.name);
    setEditDescText(preset.description || "");
    setEditPromptText(preset.promptInstruction || "");
  };

  const handleSavePresetEdit = (id: string) => {
    if (onUpdateStylePreset) {
      onUpdateStylePreset(id, {
        name: editNameText,
        description: editDescText,
        promptInstruction: editPromptText,
      });
    }
    setEditingPresetId(null);
  };

  const handleCreateNewStyle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStyleName.trim() || !newStylePrompt.trim()) {
      alert("请填写风格名称和提示词指令！");
      return;
    }
    if (onAddStylePreset) {
      onAddStylePreset({
        name: newStyleName.trim(),
        description: newStyleDesc.trim() || newStyleName.trim(),
        promptInstruction: newStylePrompt.trim(),
        isBuiltIn: false,
      });
      // Reset form
      setNewStyleName("");
      setNewStyleDesc("");
      setNewStylePrompt("");
      setIsAddingNewStyle(false);
    }
  };

  const activePresetsList =
    stylePresets && stylePresets.length > 0 ? stylePresets : DEFAULT_PRESETS;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Linkedin className="w-5 h-5 fill-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              模块 3：AI 文章生成引擎 (海外领英/LinkedIn 格式模拟)
            </h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            支持按**时间**与**区域**精准筛选海外事件，自由打勾选择特定事件，由 AI 模拟**全球海外领英（LinkedIn）高品质帖文**排版，并支持自定义与配置生成风格 Prompt 提示词。
          </p>
        </div>

        <button
          onClick={handleStartGeneration}
          disabled={isGenerating}
          className="flex items-center space-x-2 px-6 py-3 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 transition shadow-md shadow-blue-500/20 disabled:opacity-60 shrink-0"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>LinkedIn 风格文章实时撰写中...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-cyan-200" />
              <span>
                {generationStrategy === "manual"
                  ? `⚡ 手动生成并发放 (${selectedBdIds.length} 位商务)`
                  : `生成 ${
                      selectedMaterialIds.length > 0
                        ? selectedMaterialIds.length
                        : batchCount
                    } 篇 LinkedIn 帖子`}
              </span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Granular Event Selection & Filtering */}
        <div className="lg:col-span-2 space-y-5">
          {/* Filtering Header Box */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  按时间和区域筛选素材事件
                </h3>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <span className="text-slate-500">已选中:</span>
                <span className="font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  {selectedMaterialIds.length} 项
                </span>
                <button
                  onClick={handleSelectAllFiltered}
                  className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                >
                  {filteredMaterials.every((m) =>
                    selectedMaterialIds.includes(m.id)
                  )
                    ? "取消全选"
                    : "全选当前筛选"}
                </button>
                {selectedMaterialIds.length > 0 && (
                  <button
                    onClick={handleClearSelection}
                    className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                  >
                    清空选择
                  </button>
                )}
              </div>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Region Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  <span>所属海外区域 (Region)</span>
                </label>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">🌐 全部区域 (7大海外区域)</option>
                  <option value="MiddleEast">🇸🇦 中东 (Middle East)</option>
                  <option value="NorthAmerica">🇺🇸 北美 (North America)</option>
                  <option value="EuropeUK">🇪🇺 欧英 (Europe & UK)</option>
                  <option value="SoutheastAsia">🇮🇩 东南亚 (Southeast Asia)</option>
                  <option value="CentralAsia">🇰🇿 中亚 (Central Asia)</option>
                  <option value="Africa">🇿🇦 非洲 (Africa)</option>
                  <option value="LatinAmerica">🇧🇷 拉美 (Latin America)</option>
                </select>
              </div>

              {/* Time Filter */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-500" />
                  <span>搜采时间范围 (Time Range)</span>
                </label>
                <div className="flex space-x-1.5">
                  {[
                    { id: "ALL", label: "全部时间" },
                    { id: "24h", label: "近24小时" },
                    { id: "7d", label: "近7天" },
                    { id: "30d", label: "近30天" },
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setTimeFilter(t.id as TimeFilter)}
                      className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg border transition ${
                        timeFilter === t.id
                          ? "bg-slate-900 text-white border-slate-900"
                          : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Selectable Material Cards List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
              <span>共匹配到 {filteredMaterials.length} 项事件素材</span>
              <span>勾选事件后，点击生成即可为每个事件生成专门的 LinkedIn 帖子</span>
            </div>

            {filteredMaterials.map((mat) => {
              const isSelected = selectedMaterialIds.includes(mat.id);
              return (
                <div
                  key={mat.id}
                  onClick={() => toggleMaterialSelection(mat.id)}
                  className={`border rounded-2xl p-4 cursor-pointer transition shadow-sm space-y-2.5 ${
                    isSelected
                      ? "bg-blue-50/60 border-blue-400 ring-2 ring-blue-500/20"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3">
                      <div className="mt-0.5 shrink-0 text-blue-600">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 fill-blue-600 text-white" />
                        ) : (
                          <Square className="w-5 h-5 text-slate-300" />
                        )}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {REGION_NAMES[mat.region] || mat.region}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {CATEGORY_NAMES[mat.category] || mat.category}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(mat.createdAt).toLocaleDateString()}
                          </span>
                          {mat.isUsedInArticle && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              已有文章生成
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 leading-snug">
                          {mat.title}
                        </h4>
                      </div>
                    </div>

                    <span className="text-[11px] font-mono font-bold px-2 py-1 rounded bg-amber-50 text-amber-700 border border-amber-200/60 shrink-0">
                      重要度 {mat.importanceScore}/10
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pl-8">
                    {mat.summary}
                  </p>

                  {mat.keyMetrics && mat.keyMetrics.length > 0 && (
                    <div className="pl-8 flex items-center space-x-2 flex-wrap gap-1 text-[10px]">
                      {mat.keyMetrics.map((metric, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-slate-100 text-slate-600 font-mono rounded"
                        >
                          {metric}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredMaterials.length === 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-2">
                <Globe className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">
                  未找到符合当前时间和区域筛选条件的事件素材
                </p>
                <p className="text-xs text-slate-400">
                  请尝试放宽筛选条件，或前往“自动化搜采”模块获取最新事件。
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Generation Mode Settings & Generated Posts List */}
        <div className="space-y-5">
          {/* Generator Config Card */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center space-x-2">
              <Settings className="w-4 h-4 text-blue-600" />
              <span>生成模式与领英风格设置</span>
            </h3>

            {/* Week Selector & Language Selector */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  生成期次 (Week No.)
                </label>
                <input
                  type="text"
                  value={selectedWeek}
                  onChange={(e) => setSelectedWeek(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center space-x-1">
                  <Languages className="w-3.5 h-3.5 text-blue-600" />
                  <span>目标生成语言 (Language)</span>
                </label>
                <select
                  value={targetLanguage}
                  onChange={(e) =>
                    setTargetLanguage(e.target.value as TargetLanguage)
                  }
                  className="w-full px-3 py-2 bg-blue-50/60 border border-blue-200 rounded-xl text-xs font-bold text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {Object.entries(TARGET_LANGUAGE_NAMES).map(([code, item]) => (
                    <option key={code} value={code}>
                      {item.flag} {item.name} ({item.native})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generation Strategy Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                生成策略 (Generation Strategy)
              </label>
              <div className="space-y-2 text-xs">
                {/* Fixed Pipeline Mode */}
                <div
                  className={`p-3 rounded-xl border transition ${
                    generationStrategy === "fixed_pipeline"
                      ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setGenerationStrategy("fixed_pipeline")}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <span>策略 1：固定管线 (Fixed Pipeline)</span>
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      不可直接编辑项 / 全管线自动调度
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    固定策略为每周定时调度或系统启动全管线时全自动运行。根据全域事件自动配对 7 大区域默认 BD 商务与英文输出，直接存入离线文章库开启时间窗。
                  </p>
                </div>

                {/* Manual Trigger Mode */}
                <div
                  className={`p-3 rounded-xl border cursor-pointer transition ${
                    generationStrategy === "manual"
                      ? "bg-blue-50 border-blue-400 text-slate-900 shadow-sm"
                      : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700"
                  }`}
                  onClick={() => setGenerationStrategy("manual")}
                >
                  <div className="flex items-center justify-between font-bold mb-1">
                    <span className="flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span>策略 2：手动选择生成 (Manual Selection)</span>
                    </span>
                    {generationStrategy === "manual" && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    自由勾选搜采事件素材或市场卖点素材，自定义多国语言、指定商务接收人与样式预设，生成定制长帖。
                  </p>
                </div>
              </div>

              {/* Multi-Select Assigned BD Members for Manual Mode */}
              {generationStrategy === "manual" && (
                <div className="bg-blue-50/80 border border-blue-200/90 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-blue-950 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-blue-600" />
                      <span>
                        多选择发放商务人员 ({selectedBdIds.length} /{" "}
                        {bdMembers.length})
                      </span>
                    </label>
                    <div className="flex items-center space-x-1.5 text-[10px]">
                      <button
                        type="button"
                        onClick={handleSelectAllBds}
                        className="px-2 py-0.5 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-bold"
                      >
                        全选
                      </button>
                      <button
                        type="button"
                        onClick={handleClearBds}
                        className="px-2 py-0.5 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold"
                      >
                        清空
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-50/90 border border-amber-200/80 p-2.5 rounded-xl text-[11px] text-amber-900 leading-tight space-y-1">
                    <div className="font-bold flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>手动模式特性：直派模式 (不触发隔离时间窗)</span>
                    </div>
                    <p className="text-amber-800 text-[10px] leading-relaxed">
                      生成后文章将**无需经过 24 小时时间窗搁置**，立即直接分发至选中的商务人员账号下并生成社交打卡任务。
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {bdMembers.map((bd) => {
                      const isSelected = selectedBdIds.includes(bd.id);
                      return (
                        <button
                          key={bd.id}
                          type="button"
                          onClick={() => toggleBdSelection(bd.id)}
                          className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? "bg-blue-600 text-white border-blue-600 shadow-2xs"
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="space-y-0.5 overflow-hidden">
                            <div className="font-bold text-xs truncate">
                              {bd.name}
                            </div>
                            <div
                              className={`text-[10px] truncate ${
                                isSelected ? "text-blue-100" : "text-slate-400"
                              }`}
                            >
                              {bd.title}
                            </div>
                          </div>
                          {isSelected ? (
                            <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-1" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* LinkedIn Style Preset Selection with Edit/Prompt Config Trigger */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 block">
                  领英帖子模拟风格与 Prompt 指令
                </label>
                <button
                  type="button"
                  onClick={() => setShowStyleModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100"
                >
                  <Sliders className="w-3 h-3 text-blue-600" />
                  <span>管理/配置提示词</span>
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {activePresetsList.map((style) => (
                  <div
                    key={style.id}
                    onClick={() => setSelectedStyleId(style.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition ${
                      selectedStyleId === style.id
                        ? "bg-blue-50 border-blue-400 text-slate-900 shadow-sm ring-1 ring-blue-300/40"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100/80 text-slate-600"
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold mb-0.5 text-xs">
                      <span className="truncate">{style.name}</span>
                      {selectedStyleId === style.id && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-normal line-clamp-2">
                      {style.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Slot Info Card */}
            <div className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs space-y-2 font-mono">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-bold">
                <Info className="w-4 h-4" />
                <span>商务部衔接插槽机制</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                AI 输出帖文自动预留插槽：
                <code className="text-emerald-400 bg-slate-800 px-1 py-0.5 rounded font-mono ml-1">
                  {"{{BD_CONSULTATION_SLOT}}"}
                </code>
                <br />
                模块 4 自动根据不同商务分配个性化名片与联系链接。
              </p>
            </div>
          </div>

          {/* Generated Articles List Preview */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>已生成的领英文章 ({articles.length})</span>
              </h3>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {articles.map((art) => (
                <div
                  key={art.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {REGION_NAMES[art.region] || art.region}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(art.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {art.title}
                  </h5>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500">
                      字数: {art.wordCount || art.bodyMarkdown?.length || 0}
                    </span>
                    <button
                      onClick={() => onPreviewArticle(art)}
                      className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                    >
                      <span>查看推文详情</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {articles.length === 0 && (
                <div className="text-center py-6 text-slate-400 text-xs">
                  暂无已生成文章，请选择上方事件后启动生成
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Style Presets & Prompt Instructions Management Modal */}
      {showStyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-3xl w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI 帖子模拟风格与 Prompt 提示词管理中心
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    在此增加新的模拟风格、修改已有风格的生成提示词，或删减不适用的风格预设。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowStyleModal(false);
                  setEditingPresetId(null);
                  setIsAddingNewStyle(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                已配置的风格预设 ({activePresetsList.length} 种)
              </span>
              <button
                type="button"
                onClick={() => setIsAddingNewStyle(!isAddingNewStyle)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingNewStyle ? "收起新建面板" : "新增模拟风格预设"}</span>
              </button>
            </div>

            {/* Form: Add New Style Preset */}
            {isAddingNewStyle && (
              <form
                onSubmit={handleCreateNewStyle}
                className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-3 text-xs animate-in fade-in duration-150"
              >
                <div className="font-bold text-blue-900 flex items-center space-x-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>添加自定义帖子模拟风格</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      风格名称 (Style Name) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={newStyleName}
                      onChange={(e) => setNewStyleName(e.target.value)}
                      placeholder="例如：🏛️ 中东政府合规与主权基金风"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      简要说明 (Description)
                    </label>
                    <input
                      type="text"
                      value={newStyleDesc}
                      onChange={(e) => setNewStyleDesc(e.target.value)}
                      placeholder="例如：强调主权信用、本地化合规与长期IRR"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    AI 详细 Prompt 提示词指令 <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={newStylePrompt}
                    onChange={(e) => setNewStylePrompt(e.target.value)}
                    placeholder="在此编写给 Gemini 大模型的生成指导，例如：采用中东主权基金与政府招商合规语调，首段点出海湾六国国家愿景，结构上分列技术与财务指标..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 leading-relaxed font-sans text-xs"
                  />
                </div>

                <div className="flex items-center justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNewStyle(false)}
                    className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-100 transition"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition flex items-center space-x-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>确认创建新风格</span>
                  </button>
                </div>
              </form>
            )}

            {/* Presets List */}
            <div className="space-y-4">
              {activePresetsList.map((preset) => {
                const isEditing = editingPresetId === preset.id;

                return (
                  <div
                    key={preset.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3"
                  >
                    {/* Header: Title & Edit/Delete actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-slate-900 text-sm">
                          {preset.name}
                        </span>
                        {preset.isBuiltIn ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                            系统预置
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            自定义预设
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {!isEditing && (
                          <button
                            type="button"
                            onClick={() => handleStartEditPreset(preset)}
                            className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-white border border-slate-200 rounded-lg transition flex items-center space-x-1"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>修改提示词</span>
                          </button>
                        )}
                        {!preset.isBuiltIn && onDeleteStylePreset && (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                confirm(`确认删除风格预设【${preset.name}】吗？`)
                              ) {
                                onDeleteStylePreset(preset.id);
                              }
                            }}
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                            title="删除此风格"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-500">{preset.description}</p>

                    {/* View mode vs. Edit Mode */}
                    {!isEditing ? (
                      <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                        <div className="text-[10px] font-bold text-slate-400 uppercase">
                          Prompt 指令内容:
                        </div>
                        <p className="text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                          {preset.promptInstruction || "（未设置特殊指令，使用默认）"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3 p-3 bg-white rounded-xl border border-blue-300 animate-in fade-in duration-100">
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            修改风格名称
                          </label>
                          <input
                            type="text"
                            value={editNameText}
                            onChange={(e) => setEditNameText(e.target.value)}
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-900"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-600 block mb-1">
                            修改 Prompt 指令要求
                          </label>
                          <textarea
                            rows={4}
                            value={editPromptText}
                            onChange={(e) => setEditPromptText(e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 leading-relaxed font-mono"
                          />
                        </div>

                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingPresetId(null)}
                            className="px-3 py-1 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                          >
                            取消
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSavePresetEdit(preset.id)}
                            className="px-4 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>保存提示词修改</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowStyleModal(false);
                  setEditingPresetId(null);
                  setIsAddingNewStyle(false);
                }}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition"
              >
                完成并返回
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
