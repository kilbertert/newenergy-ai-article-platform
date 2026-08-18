import React, { useState } from "react";
import {
  X,
  Copy,
  Check,
  FileText,
  Sparkles,
  Download,
  CheckCircle2,
  Linkedin,
  ThumbsUp,
  MessageSquare,
  Repeat,
  Send,
  Globe,
  MoreHorizontal,
} from "lucide-react";
import { Article, BDDistributionTask } from "../types";
import { REGION_NAMES } from "../server/geminiService";

interface ArticleDetailModalProps {
  article: Article | null;
  task?: BDDistributionTask | null;
  onClose: () => void;
}

export const ArticleDetailModal: React.FC<ArticleDetailModalProps> = ({
  article,
  task,
  onClose,
}) => {
  const [copied, setCopied] = useState(false);
  const [viewTab, setViewTab] = useState<"linkedin" | "markdown">("linkedin");

  if (!article && !task) return null;

  const currentArticle = article || {
    id: task?.articleId || "",
    weekNo: "2026-W33",
    title: task?.articleTitle || "",
    subtitle: "针对海湾及中东市场的专项解构",
    region: task?.articleRegion || "MiddleEast",
    category: "Investment",
    summary: "智能生成长文",
    bodyMarkdown: task?.fullPersonalizedMarkdown || "",
    usedMaterialIds: [],
    status: "distributed" as const,
    stylePreset: "LinkedInPost" as const,
    createdAt: new Date().toISOString(),
    wordCount: 850,
  };

  const bodyContent = task?.fullPersonalizedMarkdown || currentArticle.bodyMarkdown;

  const handleCopy = () => {
    navigator.clipboard.writeText(bodyContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([bodyContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentArticle.title.slice(0, 20)}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 my-auto overflow-hidden">
        {/* Header Bar */}
        <div className="p-6 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-emerald-500 text-slate-950 font-mono">
                {currentArticle.weekNo}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                {REGION_NAMES[currentArticle.region] || currentArticle.region}
              </span>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center space-x-1">
                <Linkedin className="w-3 h-3 text-blue-400" />
                <span>海外领英 (LinkedIn) 风格</span>
              </span>
              {task && (
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  商务专属拼接: {task.bdName}
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-snug">
              {currentArticle.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Switcher Tabs */}
        <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex items-center space-x-3">
          <button
            onClick={() => setViewTab("linkedin")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              viewTab === "linkedin"
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <Linkedin className="w-3.5 h-3.5" />
            <span>模拟 LinkedIn 海外帖子效果</span>
          </button>

          <button
            onClick={() => setViewTab("markdown")}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
              viewTab === "markdown"
                ? "bg-slate-900 text-white shadow-sm"
                : "bg-white text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Standard Markdown 模式</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 font-sans space-y-6 text-slate-800 text-sm bg-slate-50">
          {viewTab === "linkedin" ? (
            /* LinkedIn Post Mockup Container */
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 space-y-4 max-w-2xl mx-auto">
              {/* LinkedIn Post Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
                    GNE
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="font-bold text-slate-900 text-sm">
                        Global Energy Intelligence (全球新能源出海智库)
                      </span>
                      <span className="text-xs text-blue-600 font-semibold">• 1st</span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Overseas Energy Transition & Equipment Supply Chain Advisory
                    </p>
                    <div className="flex items-center space-x-1 text-[10px] text-slate-400 mt-0.5">
                      <span>1d</span>
                      <span>•</span>
                      <Globe className="w-3 h-3" />
                    </div>
                  </div>
                </div>

                <MoreHorizontal className="w-5 h-5 text-slate-400" />
              </div>

              {/* LinkedIn Post Content Body */}
              <div className="text-slate-800 text-sm leading-relaxed space-y-3 font-sans">
                {bodyContent.split("\n\n").map((chunk, idx) => {
                  if (chunk.includes("{{BD_CONSULTATION_SLOT}}")) {
                    return (
                      <div
                        key={idx}
                        className="my-5 p-4 bg-gradient-to-r from-blue-50 via-teal-50 to-cyan-50 rounded-xl border border-blue-200 text-slate-900 space-y-2"
                      >
                        <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
                          <Sparkles className="w-4 h-4 text-blue-600" />
                          <span>【LinkedIn 专署商务咨询卡槽 - 分发前预留】</span>
                        </div>
                        <p className="text-xs text-slate-600 font-mono">
                          分发给 BD 后，此处自动嵌入该区域负责人联系方式、微信及咨询预约链接。
                        </p>
                      </div>
                    );
                  }

                  if (chunk.startsWith("【") && chunk.includes("联系卡】")) {
                    return (
                      <div
                        key={idx}
                        className="my-5 p-4 bg-blue-50/90 rounded-xl border border-blue-300 text-slate-900 space-y-2 shadow-sm font-sans"
                      >
                        <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs border-b border-blue-200 pb-1.5">
                          <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          <span>【商务部专属咨询段落已拼接】</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-xs text-slate-800 leading-relaxed">
                          {chunk}
                        </pre>
                      </div>
                    );
                  }

                  // Handle bold lines / headers
                  if (chunk.startsWith("# ")) {
                    return (
                      <h3 key={idx} className="text-base font-bold text-slate-950 pt-2">
                        {chunk.replace("# ", "")}
                      </h3>
                    );
                  }

                  if (chunk.startsWith("## ")) {
                    return (
                      <h4 key={idx} className="text-sm font-bold text-slate-900 pt-2">
                        {chunk.replace("## ", "")}
                      </h4>
                    );
                  }

                  return (
                    <p key={idx} className="whitespace-pre-line text-slate-800">
                      {chunk}
                    </p>
                  );
                })}
              </div>

              {/* LinkedIn Interactive Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-around text-slate-500 text-xs font-semibold">
                <button className="flex items-center space-x-1.5 hover:text-blue-600 transition py-1 px-2 rounded hover:bg-slate-100">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Like</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-blue-600 transition py-1 px-2 rounded hover:bg-slate-100">
                  <MessageSquare className="w-4 h-4" />
                  <span>Comment</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-blue-600 transition py-1 px-2 rounded hover:bg-slate-100">
                  <Repeat className="w-4 h-4" />
                  <span>Repost</span>
                </button>
                <button className="flex items-center space-x-1.5 hover:text-blue-600 transition py-1 px-2 rounded hover:bg-slate-100">
                  <Send className="w-4 h-4" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Markdown Mode */
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm prose prose-slate max-w-none space-y-4">
              {bodyContent.split("\n\n").map((chunk, idx) => {
                if (chunk.startsWith("# ")) {
                  return (
                    <h1 key={idx} className="text-xl font-bold text-slate-950 border-b pb-2">
                      {chunk.replace("# ", "")}
                    </h1>
                  );
                }
                if (chunk.startsWith("## ")) {
                  return (
                    <h2 key={idx} className="text-base font-bold text-slate-900 mt-6 mb-2">
                      {chunk.replace("## ", "")}
                    </h2>
                  );
                }
                if (chunk.includes("{{BD_CONSULTATION_SLOT}}")) {
                  return (
                    <div
                      key={idx}
                      className="my-6 p-5 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 rounded-2xl border-2 border-dashed border-teal-300 text-slate-900 space-y-2 shadow-sm"
                    >
                      <div className="flex items-center space-x-2 text-teal-800 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-teal-600" />
                        <span>【商务部咨询挂钩插槽未拼接前预览状态】</span>
                      </div>
                      <p className="text-xs text-slate-600 font-mono">
                        分发给 BD 后，此处将自动填充该商务人员的个人联系方式、区域职责与专属咨询链接。
                      </p>
                    </div>
                  );
                }
                return (
                  <p key={idx} className="leading-relaxed text-slate-700">
                    {chunk}
                  </p>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500 font-mono">
            字数: {currentArticle.wordCount} 字 | 风格: Global Overseas LinkedIn Style
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handleDownloadMarkdown}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 transition flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>导出 Markdown</span>
            </button>

            <button
              onClick={handleCopy}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center space-x-1.5 shadow-sm"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-cyan-200" />
                  <span className="text-cyan-200">已复制领英帖文</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>一键复制领英帖文 (直接粘贴发布)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
