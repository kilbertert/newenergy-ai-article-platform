import React, { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  Sparkles,
  Image as ImageIcon,
  Video as VideoIcon,
  Film,
  FileCheck,
  AlertCircle,
} from "lucide-react";
import { Region, EventCategory, MediaType } from "../types";

interface NewMaterialModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    region: Region;
    category: EventCategory;
    summary: string;
    fullContent?: string;
    imageUrl?: string;
    mediaType?: MediaType;
    mediaFileName?: string;
    fileSize?: string;
    tags?: string[];
  }) => void;
}

export const NewMaterialModal: React.FC<NewMaterialModalProps> = ({
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState("");
  const [region, setRegion] = useState<Region>("MiddleEast");
  const [category, setCategory] = useState<EventCategory>("GridTech");
  const [summary, setSummary] = useState("");
  const [fullContent, setFullContent] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [tags, setTags] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg("");
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setErrorMsg("请直接选择有效的本地图片（PNG/JPG/WEBP）或短视频（MP4/WEBM/MOV）！");
      return;
    }

    if (file.size > 30 * 1024 * 1024) {
      setErrorMsg("文件过大（超过 30MB），请压缩后重试！");
      return;
    }

    const type: MediaType = isVideo ? "video" : "image";
    setMediaType(type);
    setFileName(file.name);

    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    const sizeStr = file.size > 1024 * 1024 ? `${sizeInMb} MB` : `${Math.round(file.size / 1024)} KB`;
    setFileSize(sizeStr);

    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, "");
      setTitle(cleanName);
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setMediaDataUrl(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setErrorMsg("文件读取解析失败，请重试！");
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearMedia = () => {
    setMediaDataUrl("");
    setFileName("");
    setFileSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !summary.trim()) return;

    onSubmit({
      title: title.trim(),
      region,
      category,
      summary: summary.trim(),
      fullContent: fullContent.trim() || undefined,
      imageUrl: mediaDataUrl.trim() || undefined,
      mediaType: mediaDataUrl ? mediaType : undefined,
      mediaFileName: fileName || undefined,
      fileSize: fileSize || undefined,
      tags: tags
        .split(/[,，\s]+/)
        .map((t) => t.trim())
        .filter(Boolean),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-200 max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">市场部自主导入推文与产品素材</h3>
              <p className="text-[11px] text-slate-400">支持直接导入本地图片/视频素材与产品核心卖点话术</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 space-y-4 text-xs pr-1">
          {/* Direct File Media Upload */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                <UploadCloud className="w-4 h-4 text-teal-600" />
                <span>直接导入产品配图 / 现场实拍视频 (免外链)</span>
              </label>
              {mediaDataUrl && (
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                  <FileCheck className="w-3 h-3" />
                  <span>已载入: {fileName} ({fileSize})</span>
                </span>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {!mediaDataUrl ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-1.5 ${
                  dragActive
                    ? "border-teal-500 bg-teal-50/80 scale-[0.99]"
                    : "border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/20"
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <div className="p-2 bg-teal-100 text-teal-700 rounded-xl">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                    <Film className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-xs font-bold text-slate-700">
                  点击选择本地图片 / 视频，或拖拽文件到这里
                </div>
                <p className="text-[10px] text-slate-400">
                  支持 JPG, PNG, WEBP 及 MP4, WEBM 格式（自动转码入库，无需 URL 链接）
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 bg-slate-900 rounded-2xl overflow-hidden relative">
                {mediaType === "video" ? (
                  <video
                    src={mediaDataUrl}
                    controls
                    className="w-full max-h-40 object-contain bg-black"
                  />
                ) : (
                  <img
                    src={mediaDataUrl}
                    alt="素材配图"
                    className="w-full max-h-40 object-contain bg-slate-950/80"
                  />
                )}

                <div className="p-2 bg-slate-900/90 border-t border-slate-800 text-white flex items-center justify-between">
                  <div className="flex items-center space-x-2 truncate pr-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500 text-slate-950 uppercase font-mono">
                      {mediaType === "video" ? "视频素材" : "图片素材"}
                    </span>
                    <span className="text-[11px] font-mono text-slate-200 truncate">{fileName || "已直接载入"}</span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                    >
                      重新选择
                    </button>
                    <button
                      type="button"
                      onClick={handleClearMedia}
                      className="px-2 py-0.5 text-[10px] font-bold bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition"
                    >
                      移除
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="font-bold text-slate-800 block mb-1">素材标题 / 推文核心卖点 *</label>
            <input
              type="text"
              placeholder="例如：全新一代5MWh液冷储能舱（AeroGrid-5000）海外发布特辑"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-slate-800 block mb-1">目标海外区域 *</label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="MiddleEast">中东 (Middle East)</option>
                <option value="SoutheastAsia">东南亚 (Southeast Asia)</option>
                <option value="EuropeUK">欧英 (Europe & UK)</option>
                <option value="NorthAmerica">北美 (North America)</option>
                <option value="LatinAmerica">拉美 (Latin America)</option>
                <option value="CentralAsia">中亚 (Central Asia)</option>
                <option value="Africa">非洲 (Africa)</option>
              </select>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">标准 5 大板块 *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EventCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
              >
                <option value="Policy">板块A: 政策/监管</option>
                <option value="Investment">板块B: 招商/投资</option>
                <option value="GridTech">板块C: 技术/网侧</option>
                <option value="EVFleet">板块D: EV车队</option>
                <option value="BusinessModel">板块E: 商业模式</option>
              </select>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">100字精炼摘要 *</label>
            <textarea
              rows={2}
              placeholder="提炼核心话术，将直接融合进AI编写的长文中..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
              required
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">核心卖点与产品要点 (详细背景说明)</label>
            <textarea
              rows={3}
              placeholder="例如：1) 12000次长循环；2) Pack级气液双重消防；3) 具备50℃高温极热运行与单柜黑启动能力..."
              value={fullContent}
              onChange={(e) => setFullContent(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">标签 (以逗号分隔)</label>
            <input
              type="text"
              placeholder="例如：5MWh液冷舱, 中东极热, Pack消防"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>

          <div className="flex space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition shadow-md"
            >
              提交保存至素材库
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
