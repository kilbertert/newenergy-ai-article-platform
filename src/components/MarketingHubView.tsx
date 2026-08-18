import React, { useState } from "react";
import {
  Sparkles,
  Plus,
  FileText,
  Eye,
  CheckCircle2,
  Tag,
  Building2,
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  Search,
  Trash2,
  Copy,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import { Material, Article, ImageAsset, Region, MediaType } from "../types";
import { REGION_NAMES } from "../server/geminiService";
import { NewImageAssetModal } from "./NewImageAssetModal";

interface MarketingHubViewProps {
  materials: Material[];
  articles: Article[];
  imageAssets: ImageAsset[];
  onOpenNewMaterialModal: () => void;
  onPreviewArticle: (article: Article) => void;
  onAddImageAsset: (data: {
    title: string;
    url: string;
    mediaType: MediaType;
    fileName?: string;
    fileSize?: string;
    remarks: string;
    tags?: string[];
    region?: Region;
  }) => void;
  onDeleteImageAsset: (id: string) => void;
}

export const MarketingHubView: React.FC<MarketingHubViewProps> = ({
  materials = [],
  articles = [],
  imageAssets = [],
  onOpenNewMaterialModal,
  onPreviewArticle,
  onAddImageAsset,
  onDeleteImageAsset,
}) => {
  const safeMaterials = materials || [];
  const safeArticles = articles || [];
  const safeImageAssets = imageAssets || [];

  const [subTab, setSubTab] = useState<"articles_preview" | "marketing_materials" | "image_gallery">("image_gallery");
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [searchTag, setSearchTag] = useState("");
  const [mediaFilter, setMediaFilter] = useState<"ALL" | "image" | "video">("ALL");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const marketingMaterials = safeMaterials.filter((m) => m.type === "marketing_asset");

  const filteredImageAssets = safeImageAssets.filter((item) => {
    const isVideo = item.mediaType === "video" || item.url?.startsWith("data:video");
    const itemType = isVideo ? "video" : "image";
    if (mediaFilter !== "ALL" && itemType !== mediaFilter) return false;

    if (!searchTag) return true;
    const q = searchTag.toLowerCase();
    return (
      (item.title || "").toLowerCase().includes(q) ||
      (item.remarks || "").toLowerCase().includes(q) ||
      (item.tags || []).some((t) => (t || "").toLowerCase().includes(q)) ||
      (item.region && (REGION_NAMES[item.region] || item.region).toLowerCase().includes(q))
    );
  });

  const handleCopyMarkdown = (item: ImageAsset) => {
    const isVideo = item.mediaType === "video" || item.url?.startsWith("data:video");
    const md = isVideo ? `🎬 [视频素材: ${item.title}](${item.url.slice(0, 30)}...)` : `![${item.title}](${item.url})`;
    navigator.clipboard.writeText(md);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">模块 2：市场部素材中心（图片/视频本地直传与长文预览）</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            支持市场部直接导入本地高清营销配图、现场实拍视频，自动转码嵌入并设置核心卖点备注与索引标签；供 AI 撰写长文时精准匹配引用，无需繁琐外链。
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={() => setIsImageModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-teal-600 hover:bg-teal-700 transition shadow-sm"
          >
            <UploadCloud className="w-4 h-4 text-white" />
            <span>直接导入图片 / 视频</span>
          </button>

          <button
            onClick={onOpenNewMaterialModal}
            className="flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-slate-900 hover:bg-slate-800 transition shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>导入推文卖点素材</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex space-x-3 border-b border-slate-200 pb-3">
        <button
          onClick={() => setSubTab("image_gallery")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            subTab === "image_gallery"
              ? "bg-teal-600 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>媒体素材库 (图片/视频: {imageAssets.length})</span>
        </button>

        <button
          onClick={() => setSubTab("marketing_materials")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            subTab === "marketing_materials"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <Building2 className="w-3.5 h-3.5 text-teal-400" />
          <span>市场卖点素材 ({marketingMaterials.length})</span>
        </button>

        <button
          onClick={() => setSubTab("articles_preview")}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition flex items-center space-x-2 ${
            subTab === "articles_preview"
              ? "bg-slate-900 text-white shadow-sm"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>生成长文排版预览 ({articles.length})</span>
        </button>
      </div>

      {/* Content for Media Gallery */}
      {subTab === "image_gallery" && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="按素材标题、备注关键词或索引标签（如 #储能舱 #中东 #视频）筛选..."
                value={searchTag}
                onChange={(e) => setSearchTag(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto justify-between sm:justify-end">
              <div className="flex items-center bg-slate-100 p-1 rounded-xl space-x-1 text-[11px] font-bold">
                <button
                  onClick={() => setMediaFilter("ALL")}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    mediaFilter === "ALL" ? "bg-white text-slate-900 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  全部 ({safeImageAssets.length})
                </button>
                <button
                  onClick={() => setMediaFilter("image")}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    mediaFilter === "image" ? "bg-white text-teal-700 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  <span>图片</span>
                </button>
                <button
                  onClick={() => setMediaFilter("video")}
                  className={`px-2.5 py-1 rounded-lg transition flex items-center space-x-1 ${
                    mediaFilter === "video" ? "bg-white text-indigo-700 shadow-2xs" : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>视频</span>
                </button>
              </div>

              <div className="text-xs text-slate-500 font-mono hidden md:block">
                共找到 <span className="font-bold text-teal-600">{filteredImageAssets.length}</span> 项素材
              </div>
            </div>
          </div>

          {/* Media Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredImageAssets.map((item) => {
              const isVideo = item.mediaType === "video" || item.url?.startsWith("data:video");
              return (
                <div
                  key={item.id}
                  className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
                >
                  <div>
                    {/* Media Preview Stage */}
                    <div className="relative h-48 bg-slate-950 overflow-hidden flex items-center justify-center">
                      {isVideo ? (
                        <video
                          src={item.url}
                          controls
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <img
                          src={item.url}
                          alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                        />
                      )}
                      
                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5 pointer-events-none">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono uppercase ${
                          isVideo ? "bg-indigo-600 text-white" : "bg-teal-500 text-slate-950"
                        }`}>
                          {isVideo ? "🎬 视频素材" : "🖼️ 图片素材"}
                        </span>
                        {item.region && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 text-white backdrop-blur-md">
                            {REGION_NAMES[item.region] || item.region}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => onDeleteImageAsset(item.id)}
                        title="删除该素材"
                        className="absolute top-3 right-3 p-1.5 bg-slate-900/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-lg transition shadow-md z-10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Body Info */}
                    <div className="p-4 space-y-2.5">
                      <div className="space-y-1">
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.title}</h3>
                        {item.fileName && (
                          <p className="text-[10px] font-mono text-slate-400 truncate">
                            文件: {item.fileName} {item.fileSize ? `(${item.fileSize})` : ""}
                          </p>
                        )}
                      </div>
                      
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[11px] text-slate-600 leading-relaxed space-y-1">
                        <span className="font-bold text-slate-700 block">素材备注与卖点说明:</span>
                        <p className="line-clamp-3">{item.remarks}</p>
                      </div>

                      {/* Tags / Indexes */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {item.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200/60"
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Action */}
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <button
                      onClick={() => handleCopyMarkdown(item)}
                      className="flex items-center space-x-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-teal-600 hover:border-teal-300 transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedId === item.id ? "已复制引用!" : "复制 Markdown 引用"}</span>
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredImageAssets.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl p-6">
                <div className="p-3 bg-slate-50 rounded-2xl w-fit mx-auto mb-2 text-slate-400">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-700">未找到符合条件的媒体素材项目</p>
                <p className="text-xs text-slate-400 mt-1">支持直接从电脑导入本地图片 (PNG/JPG) 或视频 (MP4/WEBM)</p>
                <button
                  onClick={() => setIsImageModalOpen(true)}
                  className="mt-4 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  <span>直接导入图片 / 视频</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area: Articles Preview */}
      {subTab === "articles_preview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((art) => (
            <div
              key={art.id}
              className="bg-white border border-slate-200/90 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group"
            >
              {/* Cover Image */}
              <div className="relative h-44 bg-slate-100 overflow-hidden">
                <img
                  src={art.coverImage || "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80"}
                  alt={art.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono">
                    {art.weekNo}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900/90 text-white backdrop-blur-md">
                    {REGION_NAMES[art.region] || art.region}
                  </span>
                </div>
              </div>

              {/* Body Content */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {art.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {art.summary}
                  </p>
                </div>

                <div className="space-y-3 pt-3">
                  {/* BD Slot indicator */}
                  <div className="text-[11px] font-mono bg-teal-50 text-teal-800 p-2 rounded-lg border border-teal-200/60 flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    <span className="truncate">挂钩插槽: {"{{BD_CONSULTATION_SLOT}}"}</span>
                  </div>

                  {/* Actions */}
                  <button
                    onClick={() => onPreviewArticle(art)}
                    className="w-full py-2 px-3 text-xs font-bold rounded-xl bg-slate-900 text-white hover:bg-slate-800 transition flex items-center justify-center space-x-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-blue-400" />
                    <span>预览 LinkedIn 帖子与插槽排版</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          {articles.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded-3xl p-6">
              <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">本周尚未生成 AI 文章</p>
              <p className="text-xs text-slate-400 mt-1">请前往“AI 文章生成引擎”点击生成文章</p>
            </div>
          )}
        </div>
      )}

      {/* Marketing Materials Tab */}
      {subTab === "marketing_materials" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {marketingMaterials.map((mat) => {
              const isVideo = mat.mediaType === "video" || mat.imageUrl?.startsWith("data:video");
              return (
                <div
                  key={mat.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {REGION_NAMES[mat.region] || mat.region}
                        </span>
                        {mat.imageUrl && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                            {isVideo ? "🎬 附带实拍视频" : "🖼️ 附带产品配图"}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(mat.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* Media Preview if attached */}
                    {mat.imageUrl && (
                      <div className="rounded-xl overflow-hidden bg-slate-950 border border-slate-200 max-h-48 flex items-center justify-center">
                        {isVideo ? (
                          <video src={mat.imageUrl} controls className="w-full max-h-48 object-contain" />
                        ) : (
                          <img src={mat.imageUrl} alt={mat.title} className="w-full max-h-48 object-cover" />
                        )}
                      </div>
                    )}

                    <h3 className="text-sm font-bold text-slate-900">{mat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{mat.summary}</p>

                    {mat.fullContent && (
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
                        <span className="font-bold text-slate-700 block">营销核心卖点/引流重点:</span>
                        <p className="leading-relaxed">{mat.fullContent}</p>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate max-w-[200px]">标签: {mat.tags.join(", ")}</span>
                    <span className="text-teal-600 font-semibold shrink-0">优先结合生成</span>
                  </div>
                </div>
              );
            })}
          </div>

          {marketingMaterials.length === 0 && (
            <div className="py-12 text-center bg-white border border-slate-200 rounded-3xl p-6">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">暂无自定义市场部推文素材</p>
              <button
                onClick={onOpenNewMaterialModal}
                className="mt-3 inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition"
              >
                <Plus className="w-4 h-4" />
                <span>立即导入首个推文素材</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {isImageModalOpen && (
        <NewImageAssetModal
          onClose={() => setIsImageModalOpen(false)}
          onSubmit={onAddImageAsset}
        />
      )}
    </div>
  );
};
