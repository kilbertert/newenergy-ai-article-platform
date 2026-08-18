import React, { useState, useRef } from "react";
import {
  X,
  Image as ImageIcon,
  Video as VideoIcon,
  Sparkles,
  UploadCloud,
  FileCheck,
  Film,
  AlertCircle,
} from "lucide-react";
import { Region, MediaType } from "../types";
import { REGION_NAMES } from "../server/geminiService";

interface NewImageAssetModalProps {
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    url: string;
    mediaType: MediaType;
    fileName?: string;
    fileSize?: string;
    remarks: string;
    tags?: string[];
    region?: Region;
  }) => void;
}

const PRESET_MEDIA_SAMPLES = [
  {
    name: "5MWh AeroGrid 极热液冷储能舱",
    type: "image" as MediaType,
    url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?w=800&auto=format&fit=crop&q=80",
    remarks: "专为中东沙特与阿联酋极热高湿度沙尘环境打造，IP67防护与Pack级气液双重消防，具备C5防腐认证。",
    tags: ["储能舱", "5MWh液冷", "中东", "Pack消防"],
    region: "MiddleEast" as Region,
  },
  {
    name: "地面集中式光伏电站与构网型逆变器",
    type: "image" as MediaType,
    url: "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=800&auto=format&fit=crop&q=80",
    remarks: "适用于东南亚岛屿微电网及沙特NREP光伏标包，展示构网型VSG技术与百兆瓦级电网支撑能力。",
    tags: ["光伏电站", "构网型逆变器", "东南亚", "VSG"],
    region: "SoutheastAsia" as Region,
  },
  {
    name: "欧洲集装箱式独立储能电站 (BESS)",
    type: "image" as MediaType,
    url: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?w=800&auto=format&fit=crop&q=80",
    remarks: "符合德国BNetzA免征网费法案要求，配置欧洲G99/VDE电网认证及2小时套利算力指标。",
    tags: ["欧洲大储", "BESS集装箱", "德国", "免网费"],
    region: "EuropeUK" as Region,
  },
];

export const NewImageAssetModal: React.FC<NewImageAssetModalProps> = ({ onClose, onSubmit }) => {
  const [title, setTitle] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [fileName, setFileName] = useState("");
  const [fileSize, setFileSize] = useState("");
  const [remarks, setRemarks] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [region, setRegion] = useState<Region>("MiddleEast");
  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setErrorMsg("");
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setErrorMsg("请上传有效的图片（PNG/JPG/WEBP/GIF）或视频（MP4/WEBM/MOV）文件！");
      return;
    }

    // Limit check: 30MB
    const maxBytes = 30 * 1024 * 1024;
    if (file.size > maxBytes) {
      setErrorMsg("文件过大（超过 30MB），请压缩后重试！");
      return;
    }

    const type: MediaType = isVideo ? "video" : "image";
    setMediaType(type);
    setFileName(file.name);

    // Format human-readable file size
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
      setErrorMsg("文件读取失败，请重新选择！");
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

  const handleSelectPreset = (sample: typeof PRESET_MEDIA_SAMPLES[0]) => {
    setTitle(sample.name);
    setMediaDataUrl(sample.url);
    setMediaType(sample.type);
    setFileName(`${sample.name}.jpg`);
    setFileSize("高清预置");
    setRemarks(sample.remarks);
    setTagsInput(sample.tags.map((t) => `#${t}`).join(" "));
    setRegion(sample.region);
    setErrorMsg("");
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
    if (!title.trim()) {
      setErrorMsg("请填写素材标题！");
      return;
    }
    if (!mediaDataUrl) {
      setErrorMsg("请直接选择并上传图片或视频素材文件！");
      return;
    }
    if (!remarks.trim()) {
      setErrorMsg("请填写素材备注说明内容！");
      return;
    }

    const tags = tagsInput
      .split(/[,，#\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);

    onSubmit({
      title: title.trim(),
      url: mediaDataUrl,
      mediaType,
      fileName,
      fileSize,
      remarks: remarks.trim(),
      tags,
      region,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-xl">
              {mediaType === "video" ? <VideoIcon className="w-5 h-5" /> : <ImageIcon className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">直接导入图片 / 视频素材（本地直传）</h3>
              <p className="text-[11px] text-slate-400">
                支持直接选取本地 PNG/JPG 图片或 MP4/WEBM 短视频，无需任何外部外链
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5 text-xs">
          {/* Quick Presets */}
          <div className="bg-teal-50/70 border border-teal-100/90 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-teal-900">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span>或快捷填充预置高清新能源素材:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PRESET_MEDIA_SAMPLES.map((sample, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(sample)}
                  className="text-left p-2.5 bg-white border border-teal-200/70 hover:border-teal-400 rounded-xl transition text-[11px] space-y-1 shadow-2xs group hover:bg-teal-50/40"
                >
                  <div className="font-bold text-slate-800 truncate group-hover:text-teal-700">{sample.name}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1">{sample.tags.map((t) => `#${t}`).join(" ")}</div>
                </button>
              ))}
            </div>
          </div>

          <form id="media-form" onSubmit={handleSubmit} className="space-y-4">
            {/* Direct File Dropzone */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800 flex items-center space-x-1.5">
                  <UploadCloud className="w-4 h-4 text-teal-600" />
                  <span>本地文件直接导入 (图片 / 视频) *</span>
                </label>
                {mediaDataUrl && (
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center space-x-1">
                    <FileCheck className="w-3 h-3" />
                    <span>已就绪: {fileName} ({fileSize})</span>
                  </span>
                )}
              </div>

              {/* Hidden Native File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                id="direct-media-file-input"
              />

              {!mediaDataUrl ? (
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-2 ${
                    dragActive
                      ? "border-teal-500 bg-teal-50/80 scale-[0.99]"
                      : "border-slate-300 hover:border-teal-500 bg-slate-50/70 hover:bg-teal-50/20"
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <div className="p-3 bg-teal-100 text-teal-700 rounded-2xl">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <div className="p-3 bg-indigo-100 text-indigo-700 rounded-2xl">
                      <Film className="w-6 h-6" />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-sm font-bold text-slate-800">
                      点击直接选择本地图片 / 视频，或拖拽文件至此
                    </div>
                    <p className="text-[11px] text-slate-500">
                      支持 PNG, JPG, JPEG, WEBP, GIF 图片或 MP4, MOV, WEBM 视频文件 (自动转码嵌入)
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-200 bg-slate-900 rounded-2xl overflow-hidden relative group">
                  {mediaType === "video" ? (
                    <video
                      src={mediaDataUrl}
                      controls
                      className="w-full max-h-56 object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={mediaDataUrl}
                      alt="素材预览"
                      className="w-full max-h-56 object-contain bg-slate-950/80"
                    />
                  )}

                  <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-white flex items-center justify-between">
                    <div className="flex items-center space-x-2 truncate pr-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500 text-slate-950 uppercase font-mono">
                        {mediaType === "video" ? "MP4 / 视频" : "图片"}
                      </span>
                      <span className="text-xs font-mono text-slate-200 truncate">{fileName || "直接导入文件"}</span>
                      {fileSize && <span className="text-[10px] text-slate-400 font-mono">({fileSize})</span>}
                    </div>

                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-2.5 py-1 text-[11px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition"
                      >
                        更换文件
                      </button>
                      <button
                        type="button"
                        onClick={handleClearMedia}
                        className="px-2.5 py-1 text-[11px] font-bold bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg transition"
                      >
                        清除
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Title & Remarks */}
            <div>
              <label className="font-bold text-slate-800 block mb-1">素材名称 / 产品配图标题 *</label>
              <input
                type="text"
                required
                placeholder="如：5MWh AeroGrid 液冷储能舱海外现货实拍 / 现场安装视频"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-800 block mb-1">索引标签 (空格或逗号分隔)</label>
                <input
                  type="text"
                  placeholder="#储能舱 #中东极热 #5MWh #现场视频"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-800 block mb-1">适用海外区域</label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value as Region)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {Object.entries(REGION_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-800 block mb-1">
                素材备注与卖点说明 (供 AI 撰写长文时精准匹配引用) *
              </label>
              <textarea
                required
                rows={3}
                placeholder="如：展示5MWh液冷储能舱在沙特50℃极热环境下的Pack级气液消防与C5防腐细节，适用于中东集中式大储投标推文..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
              />
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span>已选类型:</span>
            <span className="font-bold text-teal-700 uppercase">{mediaType === "video" ? "视频素材" : "图片素材"}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              取消
            </button>
            <button
              type="submit"
              form="media-form"
              className="px-5 py-2 font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl transition shadow-md flex items-center space-x-1.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span>确认存入素材库</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
