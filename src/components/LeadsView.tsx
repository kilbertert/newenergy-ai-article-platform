import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Search,
  RefreshCw,
  ArrowUpRight,
  ExternalLink,
  X,
  Mail,
  Building2,
  Briefcase,
  Star,
  Link2,
  Calendar,
  FileText,
  Tag,
  Rocket,
  ListFilter,
} from "lucide-react";
import {
  fetchLeadsApi,
  fetchLeadDetailApi,
  fetchLeadTaskApi,
  createLeadSearchTaskApi,
  Lead,
  LeadSearchTask,
} from "../lib/api";

const STATUS_LABELS: Record<string, string> = {
  new: "新线索",
  contacted: "已联系",
  qualified: "已合格",
  rejected: "已排除",
};

function statusColor(status: string | null | undefined): string {
  switch (status) {
    case "new":
      return "bg-cyan-500/15 text-cyan-300 border-cyan-500/40";
    case "contacted":
      return "bg-amber-500/15 text-amber-300 border-amber-500/40";
    case "qualified":
      return "bg-emerald-500/15 text-emerald-300 border-emerald-500/40";
    case "rejected":
      return "bg-rose-500/15 text-rose-300 border-rose-500/40";
    default:
      return "bg-slate-500/15 text-slate-300 border-slate-500/40";
  }
}

function scoreColor(score: number | null | undefined): string {
  if (score == null) return "bg-slate-500/15 text-slate-300";
  if (score >= 80) return "bg-emerald-500/15 text-emerald-400";
  if (score >= 60) return "bg-teal-500/15 text-teal-300";
  if (score >= 40) return "bg-amber-500/15 text-amber-300";
  return "bg-rose-500/15 text-rose-300";
}

function fmtDate(v: string | null | undefined): string {
  if (!v) return "-";
  const d = new Date(v);
  return isNaN(d.getTime()) ? v : d.toLocaleString();
}

const POSTED_LIMITS: Array<{ value: string; label: string }> = [
  { value: "24h", label: "近 24 小时" },
  { value: "week", label: "近一周" },
  { value: "month", label: "近一月" },
];

interface LeadsViewProps {
  onNotify?: (type: "success" | "error" | "info", msg: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({ onNotify }) => {
  // View mode: "all" = existing all-leads browser, "mine" = keyword-triggered mining results
  const [viewMode, setViewMode] = useState<"all" | "mine">("all");

  // All-leads view state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  // Mining view state
  const [keywords, setKeywords] = useState("");
  const [postedLimit, setPostedLimit] = useState("week");
  const [mining, setMining] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [mineError, setMineError] = useState<string | null>(null);
  const [mineTask, setMineTask] = useState<LeadSearchTask | null>(null);
  const [minedLeads, setMinedLeads] = useState<Lead[]>([]);

  // Shared detail modal state
  const [selected, setSelected] = useState<Lead | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const pollRef = useRef<number | null>(null);
  const elapsedRef = useRef<number | null>(null);

  const load = useCallback(async (statusFilter: string, searchQuery: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = { limit: "200" };
      if (statusFilter !== "ALL") params.status = statusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();
      const res = await fetchLeadsApi(params);
      if (!res.success) throw new Error(res.error || "获取线索失败");
      setLeads(res.data || []);
      setTotal(res.meta?.total ?? (res.data || []).length);
    } catch (err: any) {
      setError(err.message || "无法加载销售线索数据");
      if (onNotify) onNotify("error", err.message || "无法加载销售线索数据");
    } finally {
      setLoading(false);
    }
  }, [onNotify]);

  useEffect(() => {
    load(status, search);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup polling/timer on unmount
  useEffect(
    () => () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (elapsedRef.current) window.clearInterval(elapsedRef.current);
    },
    []
  );

  const handleRefresh = () => load(status, search);

  const handleApplyFilter = () => load(status, search);

  const handleSelect = async (lead: Lead) => {
    setSelected(lead);
    try {
      setDetailLoading(true);
      const res = await fetchLeadDetailApi(lead.id);
      if (res.success && res.data) setSelected(res.data);
    } catch {
      // fall back to the list row already shown
    } finally {
      setDetailLoading(false);
    }
  };

  const stopMining = () => {
    setMining(false);
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
    if (elapsedRef.current) {
      window.clearInterval(elapsedRef.current);
      elapsedRef.current = null;
    }
  };

  const handleStartMining = async () => {
    if (mining) return;
    const kws = keywords
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (kws.length === 0) {
      setMineError("请输入至少一个关键词");
      return;
    }
    stopMining(); // clear any stale timers from a previous run
    setMineError(null);
    setMineTask(null);
    setMinedLeads([]);
    setElapsed(0);
    setMining(true);

    elapsedRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);

    let taskId: number;
    try {
      const created = await createLeadSearchTaskApi({
        keywords: kws,
        posted_limit: postedLimit,
      });
      if (!created.success || !created.data) {
        throw new Error(created.error || "创建挖掘任务失败");
      }
      taskId = created.data.id;
      setMineTask(created.data);
    } catch (err: any) {
      setMining(false);
      if (elapsedRef.current) {
        window.clearInterval(elapsedRef.current);
        elapsedRef.current = null;
      }
      setMineError(err.message || "创建挖掘任务失败");
      if (onNotify) onNotify("error", err.message || "创建挖掘任务失败");
      return;
    }

    const poll = async () => {
      try {
        const res = await fetchLeadTaskApi(taskId);
        if (!res.success || !res.data) {
          throw new Error(res.error || "查询任务状态失败");
        }
        setMineTask(res.data);
        if (res.data.status === "succeeded" || res.data.status === "completed") {
          stopMining();
          const leadsRes = await fetchLeadsApi({ task_id: String(taskId), limit: "200" });
          if (!leadsRes.success) throw new Error(leadsRes.error || "获取线索失败");
          setMinedLeads(leadsRes.data || []);
          if (onNotify) onNotify("success", `挖掘完成，共获取 ${leadsRes.data?.length ?? 0} 条线索`);
        } else if (res.data.status === "failed" || res.data.status === "error") {
          stopMining();
          setMineError(res.data.error || "挖掘任务失败");
          if (onNotify) onNotify("error", res.data.error || "挖掘任务失败");
        }
      } catch (err: any) {
        stopMining();
        setMineError(err.message || "任务轮询失败");
      }
    };

    pollRef.current = window.setInterval(poll, 4000);
    poll(); // immediate first check
  };

  const renderCards = (list: Lead[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {list.map((lead) => (
        <div key={lead.id}>
          <LeadCard lead={lead} onSelect={handleSelect} />
        </div>
      ))}
    </div>
  );

  const miningDone = !mining && mineTask && !mineError;

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-500" />
            LinkedIn 销售线索 (Leads)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            来自 linkedin-lead-gen 服务的潜在客户线索 · 共 {total} 条
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              load(e.target.value, search);
            }}
            className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="ALL">全部状态</option>
            {Object.entries(STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l} ({v})
              </option>
            ))}
          </select>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            刷新
          </button>
        </div>
      </div>

      {/* View toggle */}
      <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 w-fit">
        <button
          onClick={() => setViewMode("all")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            viewMode === "all"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <ListFilter className="w-3.5 h-3.5" />
          全部线索
        </button>
        <button
          onClick={() => setViewMode("mine")}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            viewMode === "mine"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <Rocket className="w-3.5 h-3.5" />
          关键词挖掘
        </button>
      </div>

      {viewMode === "all" ? (
        <>
          {/* Search bar (name/company) */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleApplyFilter()}
                placeholder="搜索姓名 / 公司..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>
            <button
              onClick={handleApplyFilter}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition"
            >
              搜索
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {error} — 请确认 linkedin-lead-gen 服务 (127.0.0.1:8100) 正在运行。
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-20 flex flex-col items-center gap-3 text-slate-500">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-semibold">正在加载销售线索...</div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && leads.length === 0 && (
            <div className="py-20 flex flex-col items-center gap-2 text-slate-400">
              <Users className="w-10 h-10 text-slate-300" />
              <div className="text-sm font-semibold">暂无匹配的销售线索</div>
            </div>
          )}

          {/* Lead cards */}
          {!loading && !error && leads.length > 0 && renderCards(leads)}
        </>
      ) : (
        <>
          {/* Mining trigger area */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleStartMining()}
                  placeholder="输入关键词(多个用逗号分隔), 如 solar energy, ev charger"
                  disabled={mining}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                />
              </div>
              <select
                value={postedLimit}
                onChange={(e) => setPostedLimit(e.target.value)}
                disabled={mining}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
                title="帖文发布时间范围"
              >
                {POSTED_LIMITS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStartMining}
                disabled={mining}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 text-white text-xs font-bold hover:bg-cyan-400 transition disabled:opacity-60"
              >
                <Rocket className={`w-3.5 h-3.5 ${mining ? "animate-pulse" : ""}`} />
                {mining ? "挖掘中..." : "开始挖掘"}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              将创建异步挖掘任务并在后台抓取 LinkedIn 帖文，完成后展示该任务产出的销售线索。
            </p>
          </div>

          {/* Mining progress */}
          {mining && (
            <div className="py-10 flex flex-col items-center gap-3 text-slate-500">
              <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs font-semibold">
                挖掘中...已 {elapsed}s
                {mineTask?.id ? ` · 任务 #${mineTask.id}` : ""}
              </div>
            </div>
          )}

          {/* Mining error */}
          {!mining && mineError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
              {mineError}
              {mineError.includes("不可达") ? " — 请确认 linkedin-lead-gen 服务 (127.0.0.1:8100) 正在运行。" : ""}
            </div>
          )}

          {/* Mining result header */}
          {miningDone && (
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-slate-700">
                关键词 "{keywords}" 挖掘结果 · 共 {minedLeads.length} 条
                {mineTask?.id ? ` · 任务 #${mineTask.id}` : ""}
              </div>
            </div>
          )}

          {/* Mining empty state */}
          {miningDone && minedLeads.length === 0 && (
            <div className="py-20 flex flex-col items-center gap-2 text-slate-400">
              <Search className="w-10 h-10 text-slate-300" />
              <div className="text-sm font-semibold">该关键词未挖掘到线索</div>
              <div className="text-xs">可尝试更换关键词或扩大发布时间范围后重试。</div>
            </div>
          )}

          {/* Mining result cards */}
          {miningDone && minedLeads.length > 0 && renderCards(minedLeads)}
        </>
      )}

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-lg font-bold">
                  {(selected.name || "?").slice(0, 1).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {selected.name || "-"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selected.company || "-"}
                    {selected.position ? ` · ${selected.position}` : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 overflow-y-auto text-sm">
              {detailLoading && (
                <div className="text-center text-xs text-slate-400">
                  加载详情中...
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusColor(
                    selected.status
                  )}`}
                >
                  {STATUS_LABELS[selected.status || ""] || selected.status || "-"}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${scoreColor(
                    selected.score
                  )}`}
                >
                  {selected.score != null ? `评分 ${selected.score}` : "评分 N/A"}
                </span>
                {selected.confidence != null && (
                  <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-indigo-500/10 text-indigo-600 border-indigo-500/30">
                    置信度 {Math.round(selected.confidence * 100)}%
                  </span>
                )}
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold border bg-slate-100 text-slate-600 border-slate-200">
                  来源 {selected.source || "-"}
                </span>
              </div>

              <DetailRow icon={Mail} label="邮箱" value={selected.email} />
              <DetailRow icon={Briefcase} label="职位" value={selected.position} />
              <DetailRow icon={Building2} label="公司规模" value={selected.company_size} />
              <DetailRow icon={Calendar} label="创建时间" value={fmtDate(selected.created_at)} />
              <DetailRow icon={Tag} label="情感态度" value={selected.user_sentiment} />
              <DetailRow icon={FileText} label="Prompt 版本" value={selected.prompt_version} />

              {selected.linkedin_url && (
                <a
                  href={selected.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-cyan-700 text-xs font-bold hover:bg-cyan-100 transition"
                >
                  <Link2 className="w-4 h-4" />
                  查看 LinkedIn 主页
                  <ExternalLink className="w-3.5 h-3.5 ml-auto" />
                </a>
              )}

              {selected.post_url && (
                <a
                  href={selected.post_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition"
                >
                  <ExternalLink className="w-4 h-4" />
                  来源帖子
                  <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
                </a>
              )}

              {selected.reason && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[11px] font-bold text-amber-700 mb-1 flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" />
                    评分理由 (Reason)
                  </div>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {selected.reason}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function LeadCard({
  lead,
  onSelect,
}: {
  lead: Lead;
  onSelect: (lead: Lead) => void | Promise<void>;
}) {
  return (
    <button
      onClick={() => onSelect(lead)}
      className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-cyan-300 transition p-4 space-y-2"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-white text-sm font-bold">
            {(lead.name || "?").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-bold text-slate-900 truncate">
              {lead.name || "-"}
            </div>
            <div className="text-xs text-slate-500 truncate flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {lead.company || "-"}
              {lead.position ? ` · ${lead.position}` : ""}
            </div>
          </div>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border ${scoreColor(
            lead.score
          )}`}
        >
          {lead.score != null ? `${lead.score} 分` : "N/A"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusColor(
              lead.status
            )}`}
          >
            {STATUS_LABELS[lead.status || ""] || lead.status || "-"}
          </span>
          <span className="text-[10px] text-slate-400 truncate flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {lead.source || "-"}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0">
          <Calendar className="w-3 h-3" />
          {fmtDate(lead.created_at)}
        </span>
      </div>

      {lead.reason && (
        <p className="text-xs text-slate-500 line-clamp-2">
          {lead.reason}
        </p>
      )}

      {lead.email && (
        <div className="text-xs text-slate-500 flex items-center gap-1">
          <Mail className="w-3 h-3 text-slate-400" />
          <span className="truncate">{lead.email}</span>
        </div>
      )}

      <div className="flex items-center gap-1 text-[11px] font-semibold text-cyan-500">
        查看详情
        <ArrowUpRight className="w-3.5 h-3.5" />
      </div>
    </button>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-wide text-slate-400 font-semibold">
          {label}
        </div>
        <div className="text-sm text-slate-700 break-words">{value || "-"}</div>
      </div>
    </div>
  );
}
