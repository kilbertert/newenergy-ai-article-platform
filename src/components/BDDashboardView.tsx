import React, { useState } from "react";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Send,
  Eye,
  Sparkles,
  Filter,
  Search,
  Award,
  TrendingUp,
  BellRing,
  Calendar,
  ArrowUpRight,
  ShieldAlert,
  ChevronRight,
  User,
  Building2,
  Check,
  Sliders,
  Settings2,
} from "lucide-react";
import { BDDistributionTask, BDMember, Article, Region } from "../types";
import { REGION_NAMES } from "../server/geminiService";

interface BDDashboardViewProps {
  tasks: BDDistributionTask[];
  bdMembers: BDMember[];
  articles: Article[];
  overdueThresholdHours?: number;
  onSetOverdueRule?: (hours: number) => void;
  onRemindTask: (taskId: string) => void;
  onPreviewArticle: (article: Article) => void;
}

export const BDDashboardView: React.FC<BDDashboardViewProps> = ({
  tasks = [],
  bdMembers = [],
  articles = [],
  overdueThresholdHours = 24,
  onSetOverdueRule,
  onRemindTask,
  onPreviewArticle,
}) => {
  const safeTasks = tasks || [];
  const safeBdMembers = bdMembers || [];
  const safeArticles = articles || [];

  const [selectedBDId, setSelectedBDId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<"ALL" | "published" | "pending" | "overdue">("ALL");
  const [selectedRegion, setSelectedRegion] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [remindedTaskIds, setRemindedTaskIds] = useState<string[]>([]);

  // Overdue Rule Configuration panel state
  const [showRuleConfig, setShowRuleConfig] = useState<boolean>(false);
  const [customHoursInput, setCustomHoursInput] = useState<string>(String(overdueThresholdHours));

  // Current threshold hours to use
  const threshold = overdueThresholdHours > 0 ? overdueThresholdHours : 24;

  // Task Status Helper based on dynamic overdue threshold
  const getTaskStatusInfo = (task: BDDistributionTask) => {
    if (task.status === "published") {
      return {
        type: "published" as const,
        label: "已打卡发布",
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        badgeBg: "bg-emerald-500 text-white",
        icon: CheckCircle2,
      };
    }
    const elapsedHours = (Date.now() - new Date(task.receivedAt).getTime()) / (1000 * 3600);
    if (elapsedHours > threshold) {
      const overdueHours = Math.floor(elapsedHours - threshold);
      return {
        type: "overdue" as const,
        label: `逾期 ${overdueHours} 小时未打卡 (超${threshold}h规则)`,
        overdueHours,
        bg: "bg-rose-50 text-rose-800 border-rose-300 ring-1 ring-rose-200",
        badgeBg: "bg-rose-600 text-white animate-pulse",
        icon: ShieldAlert,
      };
    }
    const remainingHours = Math.max(0, Math.floor(threshold - elapsedHours));
    return {
      type: "pending" as const,
      label: `待打卡 (剩余 ${remainingHours} 小时)`,
      bg: "bg-amber-50 text-amber-800 border-amber-200",
      badgeBg: "bg-amber-500 text-slate-950",
      icon: Clock,
    };
  };

  // Filter tasks base (for selected BD and Region)
  const baseTasks = safeTasks.filter((t) => {
    if (selectedBDId !== "ALL" && t.bdId !== selectedBDId) return false;
    if (selectedRegion !== "ALL" && t.articleRegion !== selectedRegion) return false;
    return true;
  });

  // Calculate Metrics based on dynamic threshold
  const totalCount = baseTasks.length;
  const completedTasks = baseTasks.filter((t) => t.status === "published");
  const overdueTasks = baseTasks.filter((t) => {
    if (t.status === "published") return false;
    const elapsed = (Date.now() - new Date(t.receivedAt).getTime()) / 3600000;
    return elapsed > threshold;
  });
  const normalPendingTasks = baseTasks.filter((t) => {
    if (t.status === "published") return false;
    const elapsed = (Date.now() - new Date(t.receivedAt).getTime()) / 3600000;
    return elapsed <= threshold;
  });
  const completionRate = totalCount > 0 ? Math.round((completedTasks.length / totalCount) * 100) : 0;

  // Filter tasks for table list (applying status & search)
  const filteredTasks = baseTasks.filter((t) => {
    const statusInfo = getTaskStatusInfo(t);
    if (selectedStatus === "published" && statusInfo.type !== "published") return false;
    if (selectedStatus === "pending" && statusInfo.type !== "pending") return false;
    if (selectedStatus === "overdue" && statusInfo.type !== "overdue") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = t.articleTitle.toLowerCase().includes(q);
      const matchBd = t.bdName.toLowerCase().includes(q);
      if (!matchTitle && !matchBd) return false;
    }
    return true;
  });

  const selectedBDObj = bdMembers.find((b) => b.id === selectedBDId);

  const handleRemindClick = (taskId: string) => {
    onRemindTask(taskId);
    setRemindedTaskIds((prev) => [...prev, taskId]);
    setTimeout(() => {
      setRemindedTaskIds((prev) => prev.filter((id) => id !== taskId));
    }, 3000);
  };

  const handleApplyOverdueRule = (hours: number) => {
    if (onSetOverdueRule && hours > 0) {
      onSetOverdueRule(hours);
      setCustomHoursInput(String(hours));
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Control Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-lg bg-teal-500/20 text-teal-300 text-[11px] font-bold border border-teal-500/30">
                首页 · 商务发放打卡看板
              </span>
              <span className="text-[11px] text-slate-400 font-mono">2026-W33 实时大屏</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              出海 BD 商务文章发放与社交打卡履约看板
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              集中监控全管线生成的 AI 商务推文在各大区域 BD 团队中的分发履约率、已发布打卡进度以及
              <span className="text-amber-300 font-bold"> 逾期未打卡告警</span>。
              当前逾期判定规则为：<strong className="text-teal-300 underline font-mono">{threshold} 小时（{threshold / 24 >= 1 ? `${threshold / 24} 天` : `${threshold} 小时`}）</strong>。
            </p>
          </div>

          {/* Quick Stats Widget in Banner */}
          <div className="flex items-center space-x-3 bg-slate-800/80 border border-slate-700/80 p-3 rounded-2xl backdrop-blur-md">
            <div className="p-2.5 bg-teal-500/20 text-teal-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase">全网履约打卡率</div>
              <div className="text-xl font-extrabold text-teal-400 font-mono">{completionRate}%</div>
              <div className="text-[10px] text-slate-400 font-mono">
                {completedTasks.length} / {totalCount} 篇已发布
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global BD / Region Filter Controls */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm flex flex-col space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* BD Members Pill Tabs */}
          <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center space-x-1">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>筛选商务人员:</span>
            </span>
            <button
              onClick={() => setSelectedBDId("ALL")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                selectedBDId === "ALL"
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              全部商务团队 ({bdMembers.length}人)
            </button>
            {bdMembers.map((bd) => {
              const isSelected = selectedBDId === bd.id;
              return (
                <button
                  key={bd.id}
                  onClick={() => setSelectedBDId(bd.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                    isSelected
                      ? "bg-blue-600 text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{bd.name}</span>
                </button>
              );
            })}
          </div>

          {/* Region Filter Dropdown */}
          <div className="flex items-center space-x-2 text-xs shrink-0">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-bold text-slate-600">按区域:</span>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">全部海外 7 大区域</option>
              {Object.entries(REGION_NAMES).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Info label if specific BD is selected */}
        {selectedBDObj && (
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-blue-900 bg-blue-50/60 p-2.5 rounded-xl">
            <div className="flex items-center space-x-2">
              <span className="font-bold">{selectedBDObj.name}</span>
              <span className="text-slate-500">| {selectedBDObj.title}</span>
              <span className="px-2 py-0.5 rounded bg-blue-200/80 text-blue-800 text-[10px] font-bold">
                负责: {(selectedBDObj.assignedRegions || []).map((r) => REGION_NAMES[r] || r).join(", ")}
              </span>
            </div>
            <button
              onClick={() => setSelectedBDId("ALL")}
              className="text-blue-700 hover:text-blue-900 font-bold underline text-[11px]"
            >
              重置为全体视图
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Distributed */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">发放文章任务总数</span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 font-mono">{totalCount}</div>
          <p className="text-[11px] text-slate-400">系统生成的个性化文章派发总数</p>
        </div>

        {/* Card 2: Completed Check-Ins */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800">已完成发布打卡</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-extrabold text-emerald-600 font-mono">{completedTasks.length}</div>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
              {completionRate}% 履约
            </span>
          </div>
          <p className="text-[11px] text-slate-400">已在 LinkedIn 或微信完成社媒打卡</p>
        </div>

        {/* Card 3: Normal Pending Check-Ins */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800">待打卡 ({threshold}h窗口内)</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-600 font-mono">{normalPendingTasks.length}</div>
          <p className="text-[11px] text-slate-400">处于正常发布时间窗内的任务</p>
        </div>

        {/* Card 4: Overdue Check-Ins */}
        <div
          className={`border rounded-2xl p-5 shadow-2xs space-y-2 transition ${
            overdueTasks.length > 0
              ? "bg-rose-50/80 border-rose-300 ring-2 ring-rose-200/60"
              : "bg-white border-slate-200/90"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${overdueTasks.length > 0 ? "text-rose-900" : "text-slate-500"}`}>
              🚨 逾期未打卡 (超{threshold}h)
            </span>
            <div
              className={`p-2 rounded-xl ${
                overdueTasks.length > 0 ? "bg-rose-600 text-white animate-pulse" : "bg-slate-100 text-slate-500"
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-2xl font-extrabold font-mono ${overdueTasks.length > 0 ? "text-rose-600" : "text-slate-900"}`}>
            {overdueTasks.length}
          </div>
          <p className={`text-[11px] ${overdueTasks.length > 0 ? "text-rose-700 font-bold" : "text-slate-400"}`}>
            {overdueTasks.length > 0 ? "需要管理员催办跟进！" : "暂无逾期未打卡项目"}
          </p>
        </div>

        {/* Card 5: Performance Metric */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-2xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">平均打卡响应时长</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-blue-600 font-mono">4.2 小时</div>
          <p className="text-[11px] text-slate-400">从派发至打卡的平均响应效率</p>
        </div>
      </div>

      {/* BD Leaderboard / Individual Performance Cards */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Award className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">商务人员打卡履约考核榜 (BD Compliance Matrix)</h3>
          </div>
          <span className="text-xs text-slate-400">支持点击特定商务直接筛选明细</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bdMembers.map((bd) => {
            const bdTasks = tasks.filter((t) => t.bdId === bd.id);
            const bdTotal = bdTasks.length;
            const bdCompleted = bdTasks.filter((t) => t.status === "published").length;
            const bdOverdue = bdTasks.filter((t) => {
              if (t.status === "published") return false;
              const elapsed = (Date.now() - new Date(t.receivedAt).getTime()) / 3600000;
              return elapsed > threshold;
            }).length;
            const bdPending = bdTotal - bdCompleted - bdOverdue;
            const rate = bdTotal > 0 ? Math.round((bdCompleted / bdTotal) * 100) : 0;
            const isSelected = selectedBDId === bd.id;

            return (
              <div
                key={bd.id}
                onClick={() => setSelectedBDId(bd.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between space-y-3 ${
                  isSelected
                    ? "bg-blue-50/90 border-blue-500 ring-2 ring-blue-200 shadow-sm"
                    : "bg-slate-50/70 border-slate-200 hover:bg-slate-100/80"
                }`}
              >
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <img src={bd.avatar} alt={bd.name} className="w-10 h-10 rounded-full object-cover border border-slate-300" />
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center space-x-1">
                        <span>{bd.name}</span>
                        {bdOverdue > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white">
                            逾期 {bdOverdue}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500">{bd.title}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-bold">
                      <span className="text-slate-600">履约完成率</span>
                      <span className="text-blue-700 font-mono">{rate}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${rate}%` }} />
                    </div>
                  </div>
                </div>

                {/* Sub Stats Badges */}
                <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-200/60">
                  <span className="text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                    已打卡: {bdCompleted}
                  </span>
                  <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                    待打卡: {bdPending}
                  </span>
                  <span className={`font-bold px-1.5 py-0.5 rounded ${bdOverdue > 0 ? "bg-rose-100 text-rose-800" : "text-slate-400 bg-slate-100"}`}>
                    逾期: {bdOverdue}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Distribution & Check-In Detailed Table */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
        {/* Overdue Rule Setting Banner in Table Section */}
        <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 flex items-center space-x-2">
                <span>打卡逾期规则设置 (Overdue Rule Configuration)</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono border border-amber-500/30">
                  当前规则: {threshold} 小时 ({threshold / 24 >= 1 ? `${threshold / 24} 天` : `${threshold} 小时`})
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                系统默认规则为 **1天 (24小时)**。当文章派发给商务后，超过设定时限未提交打卡凭证将被自动标记为【已逾期】。
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            {/* Quick Preset Buttons */}
            <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl border border-slate-700">
              {[
                { hours: 12, label: "半天(12h)" },
                { hours: 24, label: "1天(24h·默认)" },
                { hours: 48, label: "2天(48h)" },
                { hours: 72, label: "3天(72h)" },
              ].map((p) => (
                <button
                  key={p.hours}
                  type="button"
                  onClick={() => handleApplyOverdueRule(p.hours)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
                    threshold === p.hours
                      ? "bg-amber-500 text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Custom Hours Toggle */}
            <button
              type="button"
              onClick={() => setShowRuleConfig(!showRuleConfig)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white flex items-center space-x-1"
            >
              <Sliders className="w-3.5 h-3.5 text-teal-400" />
              <span>自定义</span>
            </button>
          </div>
        </div>

        {/* Custom Overdue Rule Input Expandable Form */}
        {showRuleConfig && (
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in duration-150">
            <div className="text-xs text-slate-700 font-medium space-y-0.5">
              <span className="font-bold text-slate-900 block">自定义逾期考核时间阈值 (小时数)</span>
              <span>输入任意小时数（例如 36 小时、120 小时等），系统将即时重新计算全体打卡细目表中的逾期状态与履约考核榜。</span>
            </div>
            <div className="flex items-center space-x-2 shrink-0">
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="720"
                  value={customHoursInput}
                  onChange={(e) => setCustomHoursInput(e.target.value)}
                  className="w-28 px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="小时数"
                />
                <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">h</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const val = Number(customHoursInput);
                  if (val > 0) {
                    handleApplyOverdueRule(val);
                    setShowRuleConfig(false);
                  }
                }}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-sm transition"
              >
                保存规则
              </button>
            </div>
          </div>
        )}

        {/* Table Header Controls */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-bold text-slate-900">文章发放与打卡细目表</span>
            <span className="text-xs text-slate-500">({filteredTasks.length} 项)</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Status Tabs */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setSelectedStatus("ALL")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                全部 ({baseTasks.length})
              </button>
              <button
                onClick={() => setSelectedStatus("published")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === "published"
                    ? "bg-emerald-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                已打卡 ({completedTasks.length})
              </button>
              <button
                onClick={() => setSelectedStatus("pending")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === "pending"
                    ? "bg-amber-500 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                待打卡 ({normalPendingTasks.length})
              </button>
              <button
                onClick={() => setSelectedStatus("overdue")}
                className={`px-3 py-1 rounded-lg transition ${
                  selectedStatus === "overdue"
                    ? "bg-rose-600 text-white shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                🚨 逾期 ({overdueTasks.length})
              </button>
            </div>

            {/* Search Box */}
            <div className="relative flex-1 md:w-60">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="搜索文章标题或商务姓名..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tasks Cards/Table List */}
        <div className="space-y-3">
          {filteredTasks.map((t) => {
            const statusInfo = getTaskStatusInfo(t);
            const StatusIcon = statusInfo.icon;
            const articleObj = articles.find((a) => a.id === t.articleId);
            const isReminded = remindedTaskIds.includes(t.id);

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  statusInfo.type === "overdue"
                    ? "bg-rose-50/50 border-rose-300 ring-1 ring-rose-200"
                    : statusInfo.type === "published"
                    ? "bg-white border-slate-200/80"
                    : "bg-amber-50/30 border-amber-200"
                }`}
              >
                {/* Left: Article Title & BD info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                      {REGION_NAMES[t.articleRegion] || t.articleRegion}
                    </span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${statusInfo.badgeBg}`}>
                      <StatusIcon className="w-3 h-3" />
                      <span>{statusInfo.label}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">ID: {t.id}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 leading-snug">{t.articleTitle}</h4>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                    <span className="font-bold text-slate-800 flex items-center space-x-1">
                      <User className="w-3 h-3 text-blue-600" />
                      <span>指派商务: {t.bdName} ({t.bdTitle})</span>
                    </span>
                    <span>|</span>
                    <span>派发时间: {new Date(t.receivedAt).toLocaleString("zh-CN")}</span>
                  </div>

                  {/* Proof Note if Published */}
                  {t.status === "published" && t.checkInProof && (
                    <div className="mt-2 bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl text-[11px] text-emerald-900 space-y-1">
                      <span className="font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>打卡凭证说明 (已于 {t.publishedAt ? new Date(t.publishedAt).toLocaleString("zh-CN") : "今日"} 发布至 {t.publishChannel || "LinkedIn"}):</span>
                      </span>
                      <p className="text-slate-700">{t.checkInProof}</p>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                  {articleObj && (
                    <button
                      onClick={() => onPreviewArticle(articleObj)}
                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:text-blue-600 hover:border-blue-300 transition flex items-center space-x-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>预览推文</span>
                    </button>
                  )}

                  {t.status === "pending" && (
                    <button
                      onClick={() => handleRemindClick(t.id)}
                      disabled={isReminded}
                      className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-2xs ${
                        isReminded
                          ? "bg-slate-200 text-slate-500 cursor-not-allowed"
                          : statusInfo.type === "overdue"
                          ? "bg-rose-600 hover:bg-rose-700 text-white animate-bounce"
                          : "bg-amber-500 hover:bg-amber-600 text-slate-950"
                      }`}
                    >
                      <BellRing className="w-3.5 h-3.5" />
                      <span>{isReminded ? "已发送催办" : statusInfo.type === "overdue" ? "🚨 紧急催办" : "提醒打卡"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="py-12 text-center bg-slate-50 border border-slate-200 rounded-2xl p-6">
              <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-700">未找到符合条件的发放打卡记录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
