import React, { useState, useEffect } from "react";
import {
  Library,
  Clock,
  Send,
  Edit3,
  Image as ImageIcon,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Settings,
  Sparkles,
  Search,
  Filter,
  Check,
  X,
  Plus,
} from "lucide-react";
import { Article, BDMember, ImageAsset, Region, TargetLanguage } from "../types";
import { REGION_NAMES } from "../server/geminiService";

interface ArticleLibraryViewProps {
  articles: Article[];
  bdMembers: BDMember[];
  imageAssets: ImageAsset[];
  dispatchWindowHours: number;
  onSetWindowHours: (hours: number) => void;
  onUpdateArticle: (id: string, updates: Partial<Article>) => void;
  onDispatchNow: (id: string) => void;
  onPreviewArticle: (article: Article) => void;
}

export const ArticleLibraryView: React.FC<ArticleLibraryViewProps> = ({
  articles = [],
  bdMembers = [],
  imageAssets = [],
  dispatchWindowHours = 24,
  onSetWindowHours,
  onUpdateArticle,
  onDispatchNow,
  onPreviewArticle,
}) => {
  const safeArticles = articles || [];
  const safeBdMembers = bdMembers || [];
  const safeImageAssets = imageAssets || [];

  const [filterStatus, setFilterStatus] = useState<"all" | "pending_dispatch" | "distributed">("all");
  const [filterRegion, setFilterRegion] = useState<string>("all");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [tempHours, setTempHours] = useState(dispatchWindowHours);

  // Keep the settings-dialog draft in sync when the persisted window hours change
  // (e.g. after a save + backend refresh), so it never shows a stale value.
  useEffect(() => {
    setTempHours(dispatchWindowHours);
  }, [dispatchWindowHours]);

  // Time remaining helper
  const getTimeRemaining = (scheduledAt?: string) => {
    if (!scheduledAt) return "未知";
    const diff = new Date(scheduledAt).getTime() - Date.now();
    if (diff <= 0) return "即将派发";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时 ${minutes}分`;
  };

  const filteredArticles = safeArticles.filter((a) => {
    if (filterStatus === "pending_dispatch" && a.status !== "pending_dispatch") return false;
    if (filterStatus === "distributed" && a.status !== "distributed") return false;
    if (filterRegion !== "all" && a.region !== filterRegion) return false;
    return true;
  });

  const pendingCount = safeArticles.filter((a) => a.status === "pending_dispatch").length;
  const distributedCount = safeArticles.filter((a) => a.status === "distributed").length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Library className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">模块 3-B：AI 生成文章库与时间窗管控</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            独立存储与展示 AI 引擎生成的所有周文章。设置了 <span className="font-bold text-amber-600">{dispatchWindowHours}小时</span> 隔离时间窗，待发状态下可修改文章内容、嵌入素材图及指派多选商务，时间窗结束后或手动触发后派发给商务团队。
          </p>
        </div>

        {/* Window Settings Control */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
          >
            <Settings className="w-4 h-4 text-slate-500" />
            <span>设置隔离时间窗 ({dispatchWindowHours}h)</span>
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-bold text-amber-900">
              <Clock className="w-4 h-4 text-amber-600" />
              <span>配置 AI 生成文章的默认缓冲时间窗 (Window Quarantine)</span>
            </div>
            <button onClick={() => setShowSettings(false)} className="text-amber-700 hover:text-amber-900 text-xs font-bold">
              关闭
            </button>
          </div>
          <p className="text-xs text-amber-800">
            生成的新文章在此时间窗内为“待发状态”，不会直接指派给预设商务。您有充分的时间审核文案、挑选配图并自定义多选商务。
          </p>
          <div className="flex items-center space-x-3 pt-1">
            <input
              type="number"
              min="1"
              max="168"
              value={tempHours}
              onChange={(e) => setTempHours(Number(e.target.value))}
              className="w-24 p-2 bg-white border border-amber-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-xs font-bold text-amber-900">小时</span>
            <button
              onClick={() => {
                onSetWindowHours(tempHours);
                setShowSettings(false);
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl text-white bg-amber-600 hover:bg-amber-700 transition"
            >
              保存修改
            </button>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterStatus("all")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
              filterStatus === "all" ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            全部文章 ({articles.length})
          </button>
          <button
            onClick={() => setFilterStatus("pending_dispatch")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              filterStatus === "pending_dispatch"
                ? "bg-amber-500 text-white shadow-xs"
                : "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>待发隔离状态 ({pendingCount})</span>
          </button>
          <button
            onClick={() => setFilterStatus("distributed")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              filterStatus === "distributed"
                ? "bg-emerald-600 text-white"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>已派发商务 ({distributedCount})</span>
          </button>
        </div>

        {/* Filter Region */}
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-bold text-slate-600">按区域筛选:</span>
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="p-1.5 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800 focus:outline-none"
          >
            <option value="all">全部海外 7 大区域</option>
            {Object.entries(REGION_NAMES).map(([key, name]) => (
              <option key={key} value={key}>
                {name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredArticles.map((art) => {
          const isPending = art.status === "pending_dispatch";
          const assignedBDList = bdMembers.filter((bd) => art.assignedBdIds?.includes(bd.id));

          return (
            <div
              key={art.id}
              className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between ${
                isPending ? "border-amber-300 ring-2 ring-amber-100" : "border-slate-200"
              }`}
            >
              <div>
                {/* Header Cover & Badge */}
                <div className="relative h-44 bg-slate-900 overflow-hidden">
                  <img
                    src={art.coverImage || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"}
                    alt={art.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 text-white backdrop-blur-md">
                      {REGION_NAMES[art.region] || art.region}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500 text-slate-950">
                      {(art.targetLanguage || "en").toUpperCase()}
                    </span>
                  </div>

                  {/* Status Banner */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[11px] font-bold">
                    {isPending ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 flex items-center space-x-1 shadow-xs">
                        <Clock className="w-3.5 h-3.5" />
                        <span>待发倒计时: {getTimeRemaining(art.dispatchScheduledAt)}</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 flex items-center space-x-1 shadow-xs">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>已派发任务库</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">{art.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{art.summary}</p>

                  {/* Assigned BDs tag list */}
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span>指派商务 ({assignedBDList.length} 位):</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {assignedBDList.map((bd) => (
                        <span
                          key={bd.id}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60"
                        >
                          {bd.name} ({(bd.assignedRegions || []).join(",")})
                        </span>
                      ))}
                      {assignedBDList.length === 0 && (
                        <span className="text-[10px] text-slate-400 italic">尚未选择多选商务</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setEditingArticle(art)}
                    className="py-2 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-teal-500 hover:text-teal-600 transition flex items-center justify-center space-x-1"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-teal-600" />
                    <span>编辑与插图</span>
                  </button>

                  <button
                    onClick={() => onPreviewArticle(art)}
                    className="py-2 px-3 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-800 hover:border-slate-400 transition flex items-center justify-center space-x-1"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-500" />
                    <span>预览排版</span>
                  </button>
                </div>

                {isPending && (
                  <button
                    onClick={() => onDispatchNow(art.id)}
                    className="w-full py-2.5 px-3 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 transition flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>手动提前派发商务团队</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {filteredArticles.length === 0 && (
          <div className="col-span-full py-16 text-center bg-white border border-slate-200 rounded-2xl p-6">
            <Library className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">文章库中暂无符合条件的文章</p>
            <p className="text-xs text-slate-400 mt-1">请前往 AI 文章生成引擎生成新的文章。</p>
          </div>
        )}
      </div>

      {/* Edit Article Modal */}
      {editingArticle && (
        <ArticleEditModal
          article={editingArticle}
          bdMembers={bdMembers}
          imageAssets={imageAssets}
          onClose={() => setEditingArticle(null)}
          onSave={(updated) => {
            onUpdateArticle(editingArticle.id, updated);
            setEditingArticle(null);
          }}
        />
      )}
    </div>
  );
};

// Subcomponent: Modal to Edit Article Markdown, Cover, Images, and BD assignments
const ArticleEditModal: React.FC<{
  article: Article;
  bdMembers: BDMember[];
  imageAssets: ImageAsset[];
  onClose: () => void;
  onSave: (updated: Partial<Article>) => void;
}> = ({ article, bdMembers, imageAssets, onClose, onSave }) => {
  const [title, setTitle] = useState(article.title);
  const [subtitle, setSubtitle] = useState(article.subtitle || "");
  const [summary, setSummary] = useState(article.summary);
  const [bodyMarkdown, setBodyMarkdown] = useState(article.bodyMarkdown);
  const [coverImage, setCoverImage] = useState(article.coverImage || "");
  const [selectedBdIds, setSelectedBdIds] = useState<string[]>(article.assignedBdIds || []);

  const toggleBdId = (bdId: string) => {
    if (selectedBdIds.includes(bdId)) {
      setSelectedBdIds(selectedBdIds.filter((id) => id !== bdId));
    } else {
      setSelectedBdIds([...selectedBdIds, bdId]);
    }
  };

  const handleInsertImage = (img: ImageAsset) => {
    const mdTag = `\n\n![${img.title}](${img.url})\n*配图说明：${img.remarks}*\n\n`;
    setBodyMarkdown((prev) => prev + mdTag);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-sm font-bold text-white">审核修改文章、插入图片素材与指派商务</h3>
              <p className="text-[11px] text-slate-400">设置文章正文、选择素材图库中的配图、并勾选目标多选商务</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs flex-1">
          {/* Title & Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-700 block mb-1">文章标题 (Title)</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">副标题 (Subtitle)</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">封面大图 URL</label>
            <input
              type="text"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            />
          </div>

          {/* Select BD Members (Multi-select) */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <label className="font-bold text-slate-800 flex items-center space-x-1.5">
              <Users className="w-4 h-4 text-blue-600" />
              <span>多选指派商务团队成员 (Assigned BDs)</span>
            </label>
            <p className="text-[11px] text-slate-500">
              勾选后，时间窗结束或提前派发时，系统将为选中的 BD 各生成一份挂钩其名片二维码的专属长文推文：
            </p>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
              {bdMembers.map((bd) => {
                const isSelected = selectedBdIds.includes(bd.id);
                return (
                  <button
                    key={bd.id}
                    type="button"
                    onClick={() => toggleBdId(bd.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-white text-slate-700 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <div className="font-bold">{bd.name}</div>
                      <div className={`text-[10px] ${isSelected ? "text-blue-100" : "text-slate-400"}`}>
                        {(bd.assignedRegions || []).join(", ")}
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Image Asset Quick Insertion Bar */}
          <div className="bg-teal-50/60 p-4 rounded-2xl border border-teal-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-900 flex items-center space-x-1.5">
                <ImageIcon className="w-4 h-4 text-teal-600" />
                <span>从市场部“素材图库”快捷挑选并插入文中:</span>
              </span>
              <span className="text-[10px] text-teal-700">点击下方按钮直接追加至 Markdown 末尾</span>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {imageAssets.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => handleInsertImage(img)}
                  className="px-3 py-1.5 bg-white border border-teal-300 hover:border-teal-500 text-slate-800 rounded-xl transition text-[11px] font-bold flex items-center space-x-1.5 shadow-2xs group"
                >
                  <Plus className="w-3.5 h-3.5 text-teal-600 group-hover:scale-110 transition" />
                  <span>插入: {img.title}</span>
                </button>
              ))}
              {imageAssets.length === 0 && (
                <span className="text-[11px] text-slate-400 italic">素材图库为空，可先前往模块2上传图片</span>
              )}
            </div>
          </div>

          {/* Markdown Editor */}
          <div>
            <label className="font-bold text-slate-700 block mb-1">文章正文 Markdown 内容 (需保留 {"{{BD_CONSULTATION_SLOT}}"} 插槽)</label>
            <textarea
              rows={12}
              value={bodyMarkdown}
              onChange={(e) => setBodyMarkdown(e.target.value)}
              className="w-full p-3 bg-slate-900 text-slate-100 font-mono text-xs rounded-xl focus:ring-2 focus:ring-teal-500 focus:outline-none leading-relaxed"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition">
            取消
          </button>
          <button
            onClick={() =>
              onSave({
                title,
                subtitle,
                summary,
                bodyMarkdown,
                coverImage,
                assignedBdIds: selectedBdIds,
              })
            }
            className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-md"
          >
            保存文章更新
          </button>
        </div>
      </div>
    </div>
  );
};
