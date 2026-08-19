import React, { useState } from "react";
import {
  Zap,
  Play,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  Library,
  BarChart3,
  Calendar,
  Settings2,
  Power,
  UserRoundSearch,
  X,
  Check,
  RotateCcw,
} from "lucide-react";
import { PipelineStats, ScheduleConfig } from "../types";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: PipelineStats;
  onRunFullPipeline: () => void;
  isRunningPipeline: boolean;
  scheduleConfig?: ScheduleConfig;
  onUpdateScheduleConfig?: (config: Partial<ScheduleConfig>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  stats,
  onRunFullPipeline,
  isRunningPipeline,
  scheduleConfig,
  onUpdateScheduleConfig,
}) => {
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);

  // Local state for schedule modal form
  const [cronEnabled, setCronEnabled] = useState<boolean>(
    scheduleConfig?.cronEnabled ?? true
  );
  const [scheduleFrequency, setScheduleFrequency] = useState<
    "daily" | "every_3_days" | "weekly"
  >(scheduleConfig?.scheduleFrequency ?? "daily");
  const [scheduleDay, setScheduleDay] = useState<string>(
    scheduleConfig?.scheduleDay ?? "Monday"
  );
  const [scheduleTime, setScheduleTime] = useState<string>(
    scheduleConfig?.scheduleTime ?? "09:00"
  );

  const tabs = [
    { id: "bd_dashboard", label: "首页 · 商务发放打卡看板", icon: BarChart3 },
    { id: "monitor", label: "系统总览与管线监控", icon: Activity },
    { id: "collector", label: "事件检索与负向去重", icon: Zap },
    { id: "marketing", label: "市场素材库与素材图库", icon: Sparkles },
    { id: "generator", label: "AI 文章生成引擎", icon: Play },
    { id: "article_library", label: "AI 生成文章库与时间窗", icon: Library },
    { id: "bd_portal", label: "商务分发与打卡中心", icon: CheckCircle2 },
    { id: "leads", label: "LinkedIn 销售线索", icon: UserRoundSearch },
  ];

  const handleOpenScheduleModal = () => {
    if (scheduleConfig) {
      setCronEnabled(scheduleConfig.cronEnabled);
      setScheduleFrequency(scheduleConfig.scheduleFrequency);
      setScheduleDay(scheduleConfig.scheduleDay);
      setScheduleTime(scheduleConfig.scheduleTime);
    }
    setShowScheduleModal(true);
  };

  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateScheduleConfig) {
      onUpdateScheduleConfig({
        cronEnabled,
        scheduleFrequency,
        scheduleDay,
        scheduleTime,
      });
    }
    setShowScheduleModal(false);
  };

  const frequencyLabels: Record<string, string> = {
    daily: "每天",
    every_3_days: "每 3 天",
    weekly: "每周",
  };

  const dayLabels: Record<string, string> = {
    Monday: "周一",
    Tuesday: "周二",
    Wednesday: "周三",
    Thursday: "周四",
    Friday: "周五",
    Saturday: "周六",
    Sunday: "周日",
  };

  const currentFrequencyText = scheduleConfig
    ? `${frequencyLabels[scheduleConfig.scheduleFrequency] || "每天"} ${
        scheduleConfig.scheduleFrequency === "weekly"
          ? (dayLabels[scheduleConfig.scheduleDay] || "周一") + " "
          : ""
      }${scheduleConfig.scheduleTime || "09:00"}`
    : "每天 09:00";

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 py-3">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Zap className="w-6 h-6 text-slate-950 font-black fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  新能源 AI 文章自动化生成与分发平台
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Engine v3.6
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                多区域事件自动检索 · 负向去重过滤 · AI文章撰写 · 商务部个性化分发打卡
              </p>
            </div>
          </div>

          {/* Quick Stats & Scheduler Control & Run Pipeline CTA */}
          <div className="flex items-center space-x-3">
            {/* Interactive Scheduler Time Control Button */}
            <button
              onClick={handleOpenScheduleModal}
              title="点击配置自动调度时间与频率"
              className={`hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                cronEnabled
                  ? "bg-slate-800/90 border-teal-500/40 text-slate-200 hover:bg-slate-800 hover:border-teal-400"
                  : "bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800"
              }`}
            >
              <div className="flex items-center space-x-1.5">
                <Clock
                  className={`w-3.5 h-3.5 ${
                    cronEnabled ? "text-teal-400 animate-pulse" : "text-slate-500"
                  }`}
                />
                <span className="text-slate-400">定时调度:</span>
                <strong
                  className={cronEnabled ? "text-teal-300" : "text-slate-400"}
                >
                  {cronEnabled ? currentFrequencyText : "已暂停"}
                </strong>
              </div>
              <div className="w-px h-3 bg-slate-700" />
              <div className="flex items-center space-x-1 text-slate-400 hover:text-white">
                <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[11px] text-cyan-300 underline font-semibold">
                  设置时间
                </span>
              </div>
            </button>

            {/* Check-In Rate Badge */}
            <div className="hidden lg:flex items-center space-x-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">本周打卡率:</span>
              <strong className="text-emerald-400 font-mono">
                {stats?.checkInRate ?? 0}%
              </strong>
            </div>

            {/* One-Click Full Pipeline Run CTA */}
            <button
              onClick={onRunFullPipeline}
              disabled={isRunningPipeline}
              className="relative group inline-flex items-center space-x-2 px-4 py-2 text-xs font-semibold rounded-lg text-slate-950 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 hover:from-emerald-300 hover:to-cyan-300 transition-all duration-200 shadow-md shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isRunningPipeline ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>管线全效调度中...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>一键运行全管线</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto no-scrollbar border-t border-slate-800/80 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-medium rounded-t-lg transition-all whitespace-nowrap border-b-2 ${
                  isActive
                    ? "text-emerald-400 bg-slate-800/90 border-emerald-400 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border-transparent"
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${
                    isActive ? "text-emerald-400" : "text-slate-500"
                  }`}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheduler Time Control Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl text-slate-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">
                    自动化管线定时调度器设置
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    控制后台自动搜采与文章定时撰写任务的执行周期
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveSchedule} className="p-5 space-y-4 text-xs">
              {/* Switch / Enable Toggle */}
              <div className="flex items-center justify-between p-3.5 bg-slate-800/80 rounded-xl border border-slate-700/60">
                <div className="space-y-0.5">
                  <div className="font-bold text-white flex items-center space-x-1.5">
                    <Power className="w-3.5 h-3.5 text-teal-400" />
                    <span>定时调度自动触发</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    开启后系统将按照设定频率自动启动事件检索与素材入库
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCronEnabled(!cronEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    cronEnabled ? "bg-teal-500" : "bg-slate-700"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      cronEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Frequency Selector */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 block">
                  调度执行频率 (Frequency)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "daily", label: "每天 (Daily)", desc: "每日固定时间" },
                    { id: "every_3_days", label: "每 3 天", desc: "高频双周刊" },
                    { id: "weekly", label: "每周 (Weekly)", desc: "周刊模式" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setScheduleFrequency(item.id as "daily" | "every_3_days" | "weekly")
                      }
                      className={`p-2.5 rounded-xl border text-center transition ${
                        scheduleFrequency === item.id
                          ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                          : "bg-slate-800/60 border-slate-700/80 text-slate-400 hover:bg-slate-800"
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {item.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Day of week (if weekly) */}
              {scheduleFrequency === "weekly" && (
                <div className="space-y-1.5 animate-in fade-in duration-150">
                  <label className="font-bold text-slate-300 block">
                    每周执行日 (Day of Week)
                  </label>
                  <select
                    value={scheduleDay}
                    onChange={(e) => setScheduleDay(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Monday">每周一 (Monday)</option>
                    <option value="Tuesday">每周二 (Tuesday)</option>
                    <option value="Wednesday">每周三 (Wednesday)</option>
                    <option value="Thursday">每周四 (Thursday)</option>
                    <option value="Friday">每周五 (Friday)</option>
                    <option value="Saturday">每周六 (Saturday)</option>
                    <option value="Sunday">每周日 (Sunday)</option>
                  </select>
                </div>
              )}

              {/* Execution Time Picker */}
              <div className="space-y-1.5">
                <label className="font-bold text-slate-300 flex items-center justify-between">
                  <span>具体触发时间 (Time of Day)</span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    24小时制
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <div className="flex items-center space-x-1">
                    {["09:00", "14:00", "02:00"].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setScheduleTime(preset)}
                        className={`flex-1 py-2 text-[11px] font-mono rounded-lg border transition ${
                          scheduleTime === preset
                            ? "bg-teal-500/20 border-teal-500 text-teal-300 font-bold"
                            : "bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-750"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status Preview Summary */}
              <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="text-teal-400 font-bold flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>生效规则预览</span>
                </div>
                <p className="text-slate-300">
                  {cronEnabled
                    ? `系统将以【${frequencyLabels[scheduleFrequency]} ${
                        scheduleFrequency === "weekly"
                          ? (dayLabels[scheduleDay] || "周一") + " "
                          : ""
                      }${scheduleTime}】为周期自动唤醒爬虫与生成器。`
                    : "自动化调度处于【暂停】状态，仅支持手动运行管线。"}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-teal-500/20 flex items-center space-x-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>保存调度配置</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
};
