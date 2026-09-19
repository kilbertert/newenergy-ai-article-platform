import React, { useState, useEffect, useRef } from "react";
import {
  Users,
  CheckCircle2,
  Clock,
  Send,
  UserCheck,
  Copy,
  Check,
  Share2,
  Sparkles,
  Languages,
  UserPlus,
  FileSpreadsheet,
  Trash2,
  X,
  AlertCircle,
  Upload,
  Image as ImageIcon,
} from "lucide-react";
import {
  BDMember,
  BDDistributionTask,
  Article,
  PublishChannel,
  Region,
  TargetLanguage,
  TARGET_LANGUAGE_NAMES,
} from "../types";
import { REGION_NAMES } from "../server/geminiService";

const bdUiTranslations: Record<
  string,
  {
    title: string;
    desc: string;
    selectBD: string;
    pendingCheckin: string;
    completed: string;
    consultConfig: string;
    edit: string;
    cancelEdit: string;
    nameTitle: string;
    prefLang: string;
    cta: string;
    save: string;
    myTasks: string;
    copyPost: string;
    previewCard: string;
    checkinBtn: string;
    addBD: string;
    importBD: string;
  }
> = {
  zh: {
    title: "模块 4：商务部入口与分发打卡中心 (BD Portal)",
    desc: "商务人员在此配置个人专属衔接咨询信息与首选语言。系统自动推送个性化长帖与联系卡，完成发布后一键确认打卡（无需上传凭证）。",
    selectBD: "切换当前商务人员 (BD Profile)",
    pendingCheckin: "待打卡",
    completed: "已打卡发布",
    consultConfig: "专属“衔接文章咨询信息”",
    edit: "修改编辑",
    cancelEdit: "取消修改",
    nameTitle: "姓名 & 职称",
    prefLang: "客户咨询首选语言 (Preferred Language)",
    cta: "专属引流文案 (CTA)",
    save: "保存咨询信息更新",
    myTasks: "分配的营销文章与分发打卡任务",
    copyPost: "复制完整帖文(含联系卡)",
    previewCard: "预览个性化名片帖",
    checkinBtn: "一键打卡",
    addBD: "新增商务专员",
    importBD: "批量导入商务配置",
  },
  en: {
    title: "Module 4: BD Portal & Distribution Check-In",
    desc: "BD representatives configure personal contact slots and preferred advisory language. Personalized posts with custom contact cards are automatically routed for direct one-click check-in.",
    selectBD: "Switch BD Representative",
    pendingCheckin: "Pending Check-In",
    completed: "Published & Checked-In",
    consultConfig: "Personal Consultation Contact Card",
    edit: "Edit Profile",
    cancelEdit: "Cancel Edit",
    nameTitle: "Name & Official Title",
    prefLang: "Preferred Consultation Language",
    cta: "Lead Magnet / CTA Copy",
    save: "Save Profile Changes",
    myTasks: "Assigned Marketing Posts & Check-In Tasks",
    copyPost: "Copy Full Post (with Contact Card)",
    previewCard: "Preview Personalized Post",
    checkinBtn: "Check In",
    addBD: "Add BD Member",
    importBD: "Batch Import BDs",
  },
  ar: {
    title: "الوحدة 4: بوابة التطوير التجاري وتسجيل نشر المقالات (BD Portal)",
    desc: "يقوم ممثلو التطوير التجاري بتكوين معلومات الاتصال المخصصة واللغة المفضلة للاستشارات مع إمكانية تأكيد النشر بنقرة واحدة بدون متطلبات إثبات.",
    selectBD: "تبديل ممثل التطوير التجاري",
    pendingCheckin: "في انتظار التسجيل",
    completed: "تم النشر والتسجيل",
    consultConfig: "بطاقة التواصل والاستشارات المخصصة",
    edit: "تعديل الملف الشخصي",
    cancelEdit: "إلغاء التعديل",
    nameTitle: "الاسم والمسمى الوظيفي",
    prefLang: "اللغة المفضلة للاستشارات",
    cta: "نص الدعوة لاتخاذ إجراء (CTA)",
    save: "حفظ التغييرات",
    myTasks: "المقالات والمهام المسندة",
    copyPost: "نسخ المنشور الكامل مع بطاقة الاتصال",
    previewCard: "معاينة المنشور المخصص",
    checkinBtn: "تسجيل النشر",
    addBD: "إضافة مسؤول تجاري",
    importBD: "استيراد مسؤولي BD",
  },
  es: {
    title: "Módulo 4: Portal de Desarrollo Comercial y Control de Distribución",
    desc: "Los ejecutivos de BD configuran sus datos de contacto y idioma preferido de asesoría. Registro directo de un solo clic sin comprobantes.",
    selectBD: "Cambiar Representante de BD",
    pendingCheckin: "Pendiente de Registro",
    completed: "Publicado y Registrado",
    consultConfig: "Tarjeta de Contacto y Asesoría Personal",
    edit: "Editar Perfil",
    cancelEdit: "Cancelar Edición",
    nameTitle: "Nombre y Cargo Oficial",
    prefLang: "Idioma Preferido de Asesoría",
    cta: "Texto de Llamada a la Acción (CTA)",
    save: "Guardar Cambios",
    myTasks: "Publicaciones Asignadas y Tareas de Registro",
    copyPost: "Copiar Publicación Completa",
    previewCard: "Vista Previa de Publicación",
    checkinBtn: "Registrar Publicación",
    addBD: "Agregar Ejecutivo BD",
    importBD: "Importar Ejecutivos BD",
  },
};

const SAMPLE_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
  "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80",
];

const SAMPLE_IMPORT_JSON = `[
  {
    "name": "David Al-Mansoor",
    "title": "中东及北非新能源资深商务总监",
    "assignedRegions": ["MiddleEast"],
    "email": "david.mansoor@cleanenergy-global.com",
    "linkedin": "https://linkedin.com/in/david-mansoor-energy",
    "calendly": "https://calendly.com/david-mena-energy",
    "preferredLanguage": "ar",
    "leadMagnetCta": "欢迎中东及海湾地区 EPC、投资机构私信索取《2026 中东超大型构网储能与绿氢项目投资与设备选型白皮书》",
    "avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "active": true
  },
  {
    "name": "Elena Rostova",
    "title": "中亚及东欧电网级储能业务副总裁",
    "assignedRegions": ["CentralAsia", "EuropeUK"],
    "email": "elena.rostova@cleanenergy-global.com",
    "linkedin": "https://linkedin.com/in/elena-rostova",
    "calendly": "https://calendly.com/elena-central-asia",
    "preferredLanguage": "en",
    "leadMagnetCta": "专注中亚严寒高海拔工况微电网与高倍率调频储能方案，预约 15 分钟技术与商务对接会！",
    "avatar": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    "active": true
  }
]`;

interface BDPortalViewProps {
  bdMembers: BDMember[];
  distributionTasks: BDDistributionTask[];
  articles: Article[];
  onUpdateBDProfile: (bdData: Partial<BDMember> & { id: string }) => void;
  onAddBDMember?: (memberData: Omit<BDMember, "id">) => void;
  onImportBDMembers?: (members: Omit<BDMember, "id">[]) => void;
  onDeleteBDMember?: (id: string) => void;
  onCheckInTask: (taskId: string, channel: PublishChannel, proofNote?: string) => void;
  onPreviewPersonalizedArticle: (task: BDDistributionTask) => void;
}

export const BDPortalView: React.FC<BDPortalViewProps> = ({
  bdMembers = [],
  distributionTasks = [],
  articles = [],
  onUpdateBDProfile,
  onAddBDMember,
  onImportBDMembers,
  onDeleteBDMember,
  onCheckInTask,
  onPreviewPersonalizedArticle,
}) => {
  const safeBdMembers = bdMembers || [];
  const safeTasks = distributionTasks || [];
  const safeArticles = articles || [];

  const [selectedBDId, setSelectedBDId] = useState<string>(safeBdMembers[0]?.id || "");
  const [isEditingBD, setIsEditingBD] = useState<boolean>(false);
  const [copiedTaskId, setCopiedTaskId] = useState<string | null>(null);
  const [portalLang, setPortalLang] = useState<TargetLanguage>("zh");
  // Check-in task status filter: all / pending check-in / completed check-in
  const [taskStatusFilter, setTaskStatusFilter] = useState<"all" | "pending" | "published">("all");

  const activeBD = safeBdMembers.find((b) => b.id === selectedBDId) || safeBdMembers[0];
  const [editForm, setEditForm] = useState<Partial<BDMember>>(activeBD || {});

  // Keep the edit draft in sync when the active BD changes or its profile is
  // refreshed from the backend (after a save + loadData), so the form never
  // shows stale data.
  useEffect(() => {
    setEditForm(activeBD || {});
  }, [activeBD]);

  // Add BD Modal State
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newMemberForm, setNewMemberForm] = useState<Omit<BDMember, "id">>({
    name: "",
    title: "",
    assignedRegions: ["MiddleEast"],
    email: "",
    linkedin: "",
    calendly: "",
    preferredLanguage: "zh",
    personalStylePrompt: "",
    leadMagnetCta: "",
    avatar: SAMPLE_AVATARS[0],
    active: true,
  });

  // Batch Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>(SAMPLE_IMPORT_JSON);
  const [importError, setImportError] = useState<string | null>(null);
  const [parsedPreview, setParsedPreview] = useState<any[] | null>(null);

  // Delete Member Confirmation Modal State
  const [memberToDelete, setMemberToDelete] = useState<BDMember | null>(null);

  // File Upload refs for custom avatar upload
  const addAvatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const editAvatarFileInputRef = useRef<HTMLInputElement | null>(null);

  const t = bdUiTranslations[portalLang] || bdUiTranslations["en"];

  // BD Tasks filter (by active BD + optional status filter)
  const myTasksAll = safeTasks.filter((t) => t.bdId === (activeBD?.id || ""));
  const myTasks =
    taskStatusFilter === "all"
      ? myTasksAll
      : myTasksAll.filter((t) => (taskStatusFilter === "published" ? t.status === "published" : t.status !== "published"));

  const handleSelectBD = (id: string) => {
    setSelectedBDId(id);
    const bd = safeBdMembers.find((b) => b.id === id);
    if (bd) setEditForm(bd);
    setIsEditingBD(false);
  };

  const handleSaveBDForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBD) return;
    // Spread the draft first, then pin id to the currently selected BD's real id.
    // (editForm is initialized from activeBD and carries an id field; putting it last
    // guarantees the correct BD is updated even if editForm holds a stale id.)
    onUpdateBDProfile({
      ...editForm,
      id: activeBD.id,
    });
    setIsEditingBD(false);
  };

  const handleCopyText = (taskId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTaskId(taskId);
    setTimeout(() => setCopiedTaskId(null), 2000);
  };

  // Direct 1-Click Check-In (No proof required)
  const handleDirectCheckIn = (taskId: string) => {
    onCheckInTask(taskId, "LinkedIn", "已确认完成发布打卡");
  };

  // Avatar Upload Handler
  const handleAvatarFileUpload = (
    file: File,
    onSuccess: (dataUrl: string) => void
  ) => {
    if (!file.type.startsWith("image/")) {
      alert("请上传有效的图片文件！");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        onSuccess(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Add Single BD
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim() || !newMemberForm.title.trim()) {
      alert("请填写商务人员姓名与职称！");
      return;
    }
    if (onAddBDMember) {
      onAddBDMember(newMemberForm);
      setShowAddModal(false);
      // Reset form
      setNewMemberForm({
        name: "",
        title: "",
        assignedRegions: ["MiddleEast"],
        email: "",
        linkedin: "",
        calendly: "",
        preferredLanguage: "zh",
        personalStylePrompt: "",
        leadMagnetCta: "",
        avatar: SAMPLE_AVATARS[0],
        active: true,
      });
    }
  };

  // Parse and Preview Batch JSON
  const handleParseImport = () => {
    setImportError(null);
    try {
      const data = JSON.parse(importJsonText);
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error("导入内容必须是非空的 JSON 数组格式！");
      }
      for (const item of data) {
        if (!item.name || !item.title) {
          throw new Error("每位商务专员必须包含 name (姓名) 与 title (职称) 字段！");
        }
      }
      setParsedPreview(data);
    } catch (err: any) {
      setImportError(err.message || "JSON 格式解析失败，请检查语法！");
      setParsedPreview(null);
    }
  };

  // Execute Batch Import
  const handleConfirmImport = () => {
    if (!parsedPreview || parsedPreview.length === 0) return;
    if (onImportBDMembers) {
      onImportBDMembers(parsedPreview);
      setShowImportModal(false);
      setParsedPreview(null);
    }
  };

  const regionOptions: { id: Region; label: string }[] = [
    { id: "MiddleEast", label: "中东 (Middle East)" },
    { id: "NorthAmerica", label: "北美 (North America)" },
    { id: "EuropeUK", label: "欧洲及英国 (Europe & UK)" },
    { id: "SoutheastAsia", label: "东南亚 (Southeast Asia)" },
    { id: "CentralAsia", label: "中亚 (Central Asia)" },
    { id: "Africa", label: "非洲 (Africa)" },
    { id: "LatinAmerica", label: "拉美 (Latin America)" },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">{t.title}</h2>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">{t.desc}</p>
        </div>

        {/* Header Action Buttons & Language Switcher */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Add BD Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm shadow-blue-500/20"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t.addBD}</span>
          </button>

          {/* Batch Import Button */}
          <button
            type="button"
            onClick={() => {
              setImportJsonText(SAMPLE_IMPORT_JSON);
              setImportError(null);
              setParsedPreview(null);
              setShowImportModal(true);
            }}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-400" />
            <span>{t.importBD}</span>
          </button>

          {/* Portal Language Switcher */}
          <div className="flex items-center space-x-1 bg-slate-50 border border-slate-200 p-1 rounded-xl shrink-0">
            <Languages className="w-3.5 h-3.5 text-blue-600 ml-1" />
            {(["zh", "en", "ar", "es"] as TargetLanguage[]).map((langCode) => (
              <button
                key={langCode}
                type="button"
                onClick={() => setPortalLang(langCode)}
                className={`px-2 py-1 text-[11px] font-bold rounded-lg transition ${
                  portalLang === langCode
                    ? "bg-blue-600 text-white shadow-2xs"
                    : "text-slate-600 hover:bg-slate-200/60"
                }`}
              >
                {TARGET_LANGUAGE_NAMES[langCode].flag}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: BD Member Selector & Consultation Config */}
        <div className="space-y-5">
          {/* BD Team Selector */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {t.selectBD} ({safeBdMembers.length}人)
              </h3>
              <div className="flex items-center space-x-1">
                <button
                  type="button"
                  onClick={() => setShowAddModal(true)}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <UserPlus className="w-3 h-3" />
                  <span>+新增</span>
                </button>
              </div>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {safeBdMembers.map((bd) => {
                const pendingCount = safeTasks.filter(
                  (taskItem) => taskItem.bdId === bd.id && taskItem.status === "pending"
                ).length;
                const isSelected = bd.id === (activeBD?.id || "");

                return (
                  <div
                    key={bd.id}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between group ${
                      isSelected
                        ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                        : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-800"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleSelectBD(bd.id)}
                      className="flex items-center space-x-3 truncate flex-1 text-left"
                    >
                      <img
                        src={bd.avatar}
                        alt={bd.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-slate-300"
                      />
                      <div className="truncate">
                        <div className="font-bold text-xs truncate flex items-center space-x-1">
                          <span>{bd.name}</span>
                          <span
                            className={`text-[9px] px-1 rounded ${
                              isSelected
                                ? "bg-slate-800 text-teal-300"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {bd.assignedRegions.map((r) => REGION_NAMES[r] || r).join(", ")}
                          </span>
                        </div>
                        <div
                          className={`text-[10px] truncate ${
                            isSelected ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {bd.title}
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {pendingCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-slate-950">
                          {pendingCount} 待打卡
                        </span>
                      )}
                      {onDeleteBDMember && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setMemberToDelete(bd);
                          }}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/20 transition cursor-pointer"
                          title="删除此商务人员"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Consultation Information Settings Card */}
          {activeBD && (
            <div className="bg-white border border-slate-200/90 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <UserCheck className="w-4 h-4 text-blue-600" />
                  <span>{t.consultConfig}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditingBD(!isEditingBD)}
                  className="px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                >
                  {isEditingBD ? t.cancelEdit : t.edit}
                </button>
              </div>

              {!isEditingBD ? (
                /* Profile Display Card */
                <div className="space-y-3 text-xs">
                  <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <img
                      src={activeBD.avatar}
                      alt={activeBD.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-slate-900 text-sm">{activeBD.name}</div>
                      <div className="text-slate-500 font-medium">{activeBD.title}</div>
                      <div className="text-[10px] text-blue-600 font-bold">
                        负责区域: {activeBD.assignedRegions.map((r) => REGION_NAMES[r] || r).join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 text-slate-600">
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">电子邮箱:</span>
                      <span className="font-mono text-slate-800">{activeBD.email || "未设置"}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">领英主页:</span>
                      <span className="text-blue-600 truncate max-w-[180px]">
                        {activeBD.linkedin ? (
                          <a href={activeBD.linkedin} target="_blank" rel="noreferrer" className="underline">
                            {activeBD.linkedin}
                          </a>
                        ) : (
                          "未设置"
                        )}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-400">{t.prefLang}:</span>
                      <span className="font-bold text-slate-800">
                        {TARGET_LANGUAGE_NAMES[activeBD.preferredLanguage || "zh"]?.native || activeBD.preferredLanguage}
                      </span>
                    </div>
                  </div>

                  {/* AI Personal Style Prompt Display Card */}
                  <div className="p-3 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-xl border border-indigo-100 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase flex items-center space-x-1">
                        <Sparkles className="w-3 h-3 text-indigo-500" />
                        <span>AI 专属人设风格提示词 (二层渲染)</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold">
                        {activeBD.personalStylePrompt ? "已启用" : "标准出海风格"}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-[11px] font-sans">
                      {activeBD.personalStylePrompt || "未设置专属风格（默认采用严谨专业的大客户技术商务人设）"}
                    </p>
                  </div>

                  {activeBD.leadMagnetCta && (
                    <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-100 space-y-1">
                      <span className="text-[10px] font-bold text-blue-700 uppercase">{t.cta}</span>
                      <p className="text-blue-900 leading-relaxed text-[11px]">{activeBD.leadMagnetCta}</p>
                    </div>
                  )}
                </div>
              ) : (
                /* Profile Edit Form */
                <form onSubmit={handleSaveBDForm} className="space-y-3 text-xs">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">姓名</label>
                    <input
                      type="text"
                      value={editForm.name || ""}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">官方头衔 / 职称</label>
                    <input
                      type="text"
                      value={editForm.title || ""}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">电子邮箱</label>
                    <input
                      type="email"
                      value={editForm.email || ""}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">LinkedIn 个人主页链接</label>
                    <input
                      type="url"
                      value={editForm.linkedin || ""}
                      onChange={(e) => setEditForm({ ...editForm, linkedin: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t.prefLang}</label>
                    <select
                      value={editForm.preferredLanguage || "zh"}
                      onChange={(e) => setEditForm({ ...editForm, preferredLanguage: e.target.value as TargetLanguage })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                    >
                      {Object.entries(TARGET_LANGUAGE_NAMES).map(([code, item]) => (
                        <option key={code} value={code}>
                          {item.flag} {item.name} ({item.native})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Avatar Picker & Upload for Edit Form */}
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">更换头像 (预设或上传本地图片)</label>
                    <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                      {SAMPLE_AVATARS.map((av, idx) => (
                        <img
                          key={idx}
                          src={av}
                          alt="avatar option"
                          onClick={() => setEditForm({ ...editForm, avatar: av })}
                          className={`w-8 h-8 rounded-full object-cover cursor-pointer border-2 transition ${
                            editForm.avatar === av
                              ? "border-blue-600 ring-2 ring-blue-300 scale-110"
                              : "border-slate-200 opacity-60 hover:opacity-100"
                          }`}
                        />
                      ))}
                      {/* Upload Button */}
                      <button
                        type="button"
                        onClick={() => editAvatarFileInputRef.current?.click()}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-[10px] font-bold flex items-center space-x-1"
                      >
                        <Upload className="w-3 h-3 text-blue-600" />
                        <span>上传自定义头像</span>
                      </button>
                      <input
                        ref={editAvatarFileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleAvatarFileUpload(file, (dataUrl) => {
                              setEditForm({ ...editForm, avatar: dataUrl });
                            });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* AI Personal Style Prompt Input in Edit Form */}
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
                    <label className="text-[11px] font-bold text-indigo-900 flex items-center justify-between">
                      <span className="flex items-center space-x-1">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>商务个性化风格专属提示词 (AI 渲染层)</span>
                      </span>
                    </label>
                    <p className="text-[10px] text-slate-500">
                      当管线向该商务分发文章时，将在区域基础帖之上执行第二层专属 AI 人设渲染（例如视角、语气口吻、侧重痛点）。
                    </p>
                    <textarea
                      rows={3}
                      value={editForm.personalStylePrompt || ""}
                      onChange={(e) => setEditForm({ ...editForm, personalStylePrompt: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
                      placeholder="例如：以中东主权资本视角，语调沉稳权威，强调主权基金合作、IKTVA本地化产能落地与构网型高可靠性..."
                    />
                    {/* Quick Preset Buttons */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {[
                        { label: "中东主权资本视角", text: "以中东主权资本视角，语调沉稳权威，强调主权基金合作与本土化产能落地" },
                        { label: "东南亚务实降本", text: "东南亚渠道务实风格：强调海岛微电网、柴改光储度电成本降本与快速落地回报" },
                        { label: "欧洲技术极客", text: "欧洲电网合规与技术极客风格：专业硬核，专注构网型拓扑、现货套利模型与G99认证" },
                        { label: "拉美长储拓荒者", text: "拉美矿业长储拓荒者视角：聚焦高海拔极端工况、长时储能与国际银团贷款融资架构" },
                      ].map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setEditForm({ ...editForm, personalStylePrompt: item.text })}
                          className="px-2 py-0.5 text-[9px] font-bold bg-white text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition"
                        >
                          +{item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">{t.cta}</label>
                    <textarea
                      rows={2}
                      value={editForm.leadMagnetCta || ""}
                      onChange={(e) => setEditForm({ ...editForm, leadMagnetCta: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                      placeholder="例如：私信我获取《2026 中东超大型储能白皮书》..."
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-sm"
                    >
                      {t.save}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBD(false)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                    >
                      取消
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>

        {/* Right 2 Columns: BD Tasks & Check-In Area */}
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Send className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  【{activeBD?.name}】{t.myTasks}
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">共 {myTasksAll.length} 项任务</span>
            </div>

            {/* Task Status Filter */}
            <div className="flex items-center gap-1.5 pb-1">
              {([
                { key: "all", label: "全部" },
                { key: "pending", label: "待打卡" },
                { key: "published", label: "已打卡" },
              ] as const).map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTaskStatusFilter(opt.key)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition border ${
                    taskStatusFilter === opt.key
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Task Cards List */}
            <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
              {myTasks.map((task) => {
                const isPublished = task.status === "published";

                return (
                  <div
                    key={task.id}
                    className={`p-5 rounded-2xl border transition space-y-4 ${
                      isPublished
                        ? "bg-slate-50/60 border-slate-200"
                        : "bg-white border-blue-200 shadow-sm ring-1 ring-blue-100"
                    }`}
                  >
                    {/* Task Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                          {REGION_NAMES[task.articleRegion] || task.articleRegion}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center space-x-1 ${
                            isPublished
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-400 text-slate-950"
                          }`}
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" />
                              <span>{t.completed}</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3" />
                              <span>{t.pendingCheckin}</span>
                            </>
                          )}
                        </span>
                        {task.isAiPersonalized && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200 flex items-center space-x-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                            <span>AI 专属人设渲染已生效</span>
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 font-mono">
                          派发时间: {new Date(task.receivedAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyText(task.id, task.fullPersonalizedMarkdown || task.personalizedSection || "")}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                        >
                          {copiedTaskId === task.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">已复制到剪贴板</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-slate-500" />
                              <span>{t.copyPost}</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => onPreviewPersonalizedArticle(task)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition flex items-center space-x-1"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{t.previewCard}</span>
                        </button>
                      </div>
                    </div>

                    {/* Article Title & Content Snippet */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">{task.articleTitle}</h4>
                      </div>
                      {task.personalStylePromptUsed && (
                        <div className="text-[10px] text-indigo-700 bg-indigo-50/70 border border-indigo-100 px-2.5 py-1 rounded-lg flex items-center space-x-1">
                          <Sparkles className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span className="font-bold">应用人设风格：</span>
                          <span className="truncate">{task.personalStylePromptUsed}</span>
                        </div>
                      )}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 font-sans text-xs text-slate-700 leading-relaxed max-h-36 overflow-y-auto whitespace-pre-wrap">
                        {task.fullPersonalizedMarkdown || task.personalizedSection || ""}
                      </div>
                    </div>

                    {/* Published Check-In Status or 1-Click Check-In Button */}
                    {isPublished ? (
                      <div className="bg-emerald-50/80 border border-emerald-200/80 p-3 rounded-xl text-xs text-emerald-900 flex items-center space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="font-bold">
                          已打卡完成 (打卡时间:{" "}
                          {task.publishedAt ? new Date(task.publishedAt).toLocaleString("zh-CN") : "今日"})
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDirectCheckIn(task.id)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition shadow-md shadow-emerald-500/20 flex items-center space-x-1.5 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>一键确认完成打卡</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {myTasks.length === 0 && (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <Clock className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    {taskStatusFilter === "published"
                      ? "当前筛选下暂无已打卡任务"
                      : taskStatusFilter === "pending"
                      ? "当前筛选下暂无待打卡任务"
                      : myTasksAll.length === 0
                      ? "当前商务人员暂无任务"
                      : "当前筛选下暂无任务"}
                  </p>
                  <p className="text-xs text-slate-400">
                    可在“AI 文章生成引擎”中生成个性化文章，或等待周度管线自动分发。
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal 1: Add Single BD Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">录入新增商务人员与配置</h3>
                  <p className="text-[11px] text-slate-500">
                    录入商务专员的个人联系卡配置，以便 AI 在生成海外文章时自动植入引流插槽。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              {/* Name & Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    商务人员姓名 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="例如：Tariq Al-Mansoor"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    官方头衔 / 职务 <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.title}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, title: e.target.value })}
                    placeholder="例如：中东与北非区域高级商务总监"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Assigned Regions (Checkboxes) */}
              <div>
                <label className="font-bold text-slate-700 block mb-1.5">
                  负责海外区域 (Assigned Regions) <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {regionOptions.map((reg) => {
                    const isChecked = newMemberForm.assignedRegions.includes(reg.id);
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => {
                          const current = newMemberForm.assignedRegions;
                          if (isChecked) {
                            if (current.length > 1) {
                              setNewMemberForm({
                                ...newMemberForm,
                                assignedRegions: current.filter((r) => r !== reg.id),
                              });
                            }
                          } else {
                            setNewMemberForm({
                              ...newMemberForm,
                              assignedRegions: [...current, reg.id],
                            });
                          }
                        }}
                        className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          isChecked
                            ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        <span className="truncate">{reg.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 ml-1" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Contact Information (Email & LinkedIn) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">电子邮箱 (Email)</label>
                  <input
                    type="email"
                    value={newMemberForm.email || ""}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, email: e.target.value })}
                    placeholder="tariq@cleanenergy-global.com"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">领英个人主页 (LinkedIn)</label>
                  <input
                    type="url"
                    value={newMemberForm.linkedin || ""}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, linkedin: e.target.value })}
                    placeholder="https://linkedin.com/in/tariq-energy"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Preferred Language & Calendly */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">客户咨询首选语言</label>
                  <select
                    value={newMemberForm.preferredLanguage}
                    onChange={(e) =>
                      setNewMemberForm({
                        ...newMemberForm,
                        preferredLanguage: e.target.value as TargetLanguage,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900"
                  >
                    {Object.entries(TARGET_LANGUAGE_NAMES).map(([code, item]) => (
                      <option key={code} value={code}>
                        {item.flag} {item.name} ({item.native})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Calendly 预约链接</label>
                  <input
                    type="url"
                    value={newMemberForm.calendly || ""}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, calendly: e.target.value })}
                    placeholder="https://calendly.com/tariq-meeting"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                  />
                </div>
              </div>

              {/* Avatar Picker & Upload in Add Modal */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">选择预设头像或上传图片</label>
                <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                  {SAMPLE_AVATARS.map((av, idx) => (
                    <img
                      key={idx}
                      src={av}
                      alt="avatar option"
                      onClick={() => setNewMemberForm({ ...newMemberForm, avatar: av })}
                      className={`w-9 h-9 rounded-full object-cover cursor-pointer border-2 transition ${
                        newMemberForm.avatar === av
                          ? "border-blue-600 ring-2 ring-blue-300 scale-110"
                          : "border-slate-200 opacity-60 hover:opacity-100"
                      }`}
                    />
                  ))}
                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={() => addAvatarFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>上传自定义头像</span>
                  </button>
                  <input
                    ref={addAvatarFileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleAvatarFileUpload(file, (dataUrl) => {
                          setNewMemberForm({ ...newMemberForm, avatar: dataUrl });
                        });
                      }
                    }}
                  />
                </div>
              </div>

              {/* AI Personal Style Prompt in Add Modal */}
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1">
                <label className="font-bold text-indigo-900 block flex items-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>商务个性化风格专属提示词 (可选)</span>
                </label>
                <p className="text-[10px] text-slate-500">
                  为该商务指定专属第二层 AI 渲染人设风格（如口吻、侧重点、专业背景）。
                </p>
                <textarea
                  rows={2}
                  value={newMemberForm.personalStylePrompt || ""}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, personalStylePrompt: e.target.value })}
                  placeholder="例如：以中东主权资本视角，强调主权基金大标合作与本土化落地..."
                  className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 font-sans"
                />
              </div>

              {/* Lead Magnet CTA */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">专属引流文案 (Lead Magnet CTA)</label>
                <textarea
                  rows={2}
                  value={newMemberForm.leadMagnetCta || ""}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, leadMagnetCta: e.target.value })}
                  placeholder="例如：私信我索取《2026 中东超大型储能白皮书》与技术配置清单！"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-xs"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition shadow-md shadow-blue-500/20 flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>确认添加商务专员</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Batch Import BD Members Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">批量导入商务人员及配置 (JSON)</h3>
                  <p className="text-[11px] text-slate-500">
                    支持一次性批量导入多位商务专员及其邮箱、领英、负责区域与引流文案配置。
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-700">粘贴 JSON 数组数据</label>
                <button
                  type="button"
                  onClick={() => setImportJsonText(SAMPLE_IMPORT_JSON)}
                  className="text-blue-600 hover:text-blue-800 font-bold underline text-[11px]"
                >
                  载入示例模板
                </button>
              </div>

              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                className="w-full p-3 font-mono text-[11px] bg-slate-900 text-teal-300 border border-slate-800 rounded-2xl focus:outline-none focus:ring-2 focus:ring-teal-500 leading-relaxed"
                placeholder="在此粘贴包含 name, title, assignedRegions 等字段的 JSON 数组..."
              />

              {importError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Parse Button */}
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleParseImport}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition"
                >
                  解析数据并预览
                </button>
              </div>

              {/* Parsed Preview Table */}
              {parsedPreview && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 animate-in fade-in duration-150">
                  <div className="font-bold text-slate-900 flex items-center justify-between">
                    <span>解析成功：待导入 {parsedPreview.length} 位商务专员</span>
                    <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                      数据校验通过
                    </span>
                  </div>

                  <div className="max-h-40 overflow-y-auto divide-y divide-slate-200">
                    {parsedPreview.map((item, idx) => (
                      <div key={idx} className="py-2 flex items-center justify-between text-slate-700">
                        <div>
                          <span className="font-bold text-slate-900">{item.name}</span>
                          <span className="text-slate-500 text-[11px] ml-2">({item.title})</span>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                          {Array.isArray(item.assignedRegions)
                            ? item.assignedRegions.map((r: string) => REGION_NAMES[r as Region] || r).join(", ")
                            : item.assignedRegions}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition"
                >
                  取消
                </button>
                <button
                  type="button"
                  disabled={!parsedPreview || parsedPreview.length === 0}
                  onClick={handleConfirmImport}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition shadow-md shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>确认批量导入至系统</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Member Confirmation Modal */}
      {memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center space-x-3 text-rose-600">
              <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">确认删除商务专员？</h3>
                <p className="text-xs text-slate-500">此操作将移除该商务配置并同步清理相关任务</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center space-x-3">
              <img
                src={memberToDelete.avatar}
                alt={memberToDelete.name}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs"
              />
              <div className="space-y-0.5">
                <div className="font-bold text-slate-900 text-sm">{memberToDelete.name}</div>
                <div className="text-slate-500 text-xs">{memberToDelete.title}</div>
                <div className="text-[10px] text-blue-600 font-bold">
                  {memberToDelete.assignedRegions.map((r) => REGION_NAMES[r] || r).join(", ")}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setMemberToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onDeleteBDMember && memberToDelete) {
                    onDeleteBDMember(memberToDelete.id);
                    if (selectedBDId === memberToDelete.id) {
                      const nextMember = safeBdMembers.find((m) => m.id !== memberToDelete.id);
                      if (nextMember) {
                        setSelectedBDId(nextMember.id);
                        setEditForm(nextMember);
                      }
                    }
                  }
                  setMemberToDelete(null);
                }}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-md shadow-rose-600/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>确认删除</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
