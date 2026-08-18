import React, { useState } from "react";
import {
  Zap,
  Sparkles,
  Play,
  CheckCircle2,
  ShieldAlert,
  Database,
  Users,
  BarChart3,
  RefreshCw,
  Terminal,
  ArrowUpRight,
  Trash2,
} from "lucide-react";
import { PipelineStats, PipelineLog, BDDistributionTask, BDMember } from "../types";
import { clearDatabaseDataApi } from "../lib/api";

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

  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [isClearingData, setIsClearingData] = useState<boolean>(false);

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
