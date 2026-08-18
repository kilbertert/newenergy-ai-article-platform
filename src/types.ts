export type Region = 
  | 'NorthAmerica' 
  | 'EuropeUK' 
  | 'SoutheastAsia' 
  | 'MiddleEast' 
  | 'CentralAsia' 
  | 'Africa' 
  | 'LatinAmerica';

export type EventCategory = 
  | 'Policy' 
  | 'Investment' 
  | 'GridTech' 
  | 'EVFleet' 
  | 'BusinessModel';

export type MaterialType = 'auto_event' | 'marketing_asset';
export type MediaType = 'image' | 'video';

export interface Material {
  id: string;
  title: string;
  region: Region;
  category: EventCategory;
  type: MaterialType;
  source: string;
  sourceUrl?: string; // 真实联网新闻原文 URL
  webDomain?: string; // 来源域名 (e.g. reuters.com, pv-magazine.com)
  isSimulated?: boolean; // 标记是否为模板数据（现已全面禁用虚构数据）
  summary: string;
  fullContent?: string;
  keyMetrics?: string[];
  tags: string[];
  eventDate?: string; // 精确事件发生/公报日期 (e.g. 2026-08-15)
  createdAt: string;
  isUsedInArticle?: boolean;
  imageUrl?: string;
  mediaType?: MediaType;
  mediaFileName?: string;
  fileSize?: string;
  importanceScore: number; // 1-10
  // AI Full-Text Audit & Fact-Checking metadata
  auditStatus?: 'audited_approved' | 'audited_flagged' | 'pending_audit';
  factCheckVerified?: boolean;
  auditNotes?: string;
  auditScore?: number; // 1-100
  auditTimestamp?: string;
}

export interface NegativeCacheItem {
  id: string;
  eventSummary: string;
  region: Region;
  filteredDate: string;
  reason: string;
  similarityScore: number; // e.g. 0.88
}

export interface BDMember {
  id: string;
  name: string;
  avatar: string;
  title: string;
  assignedRegions: Region[];
  phone?: string;
  email: string;
  wechat?: string;
  whatsapp?: string;
  ctaCopy: string;
  leadMagnetCta?: string;
  consultLink: string;
  qrCodeUrl?: string;
  preferredLanguage?: TargetLanguage;
  personalStylePrompt?: string; // 商务个性化风格专属提示词 (Personalized AI Persona Prompt)
  active: boolean;
}

export type StylePreset = string;
export interface StylePresetItem {
  id: string;
  name: string;
  description?: string;
  promptInstruction: string;
  isBuiltIn?: boolean;
}

export interface ScheduleConfig {
  cronEnabled: boolean;
  scheduleFrequency: 'daily' | 'every_3_days' | 'weekly';
  scheduleDay: string;
  scheduleTime: string;
}

export interface SearchDiagnosticStatus {
  success: boolean;
  grounded: boolean;
  queriesUsed?: string[];
  webSourcesFound?: number;
  errorType?: 'RATE_LIMIT_429' | 'NO_GROUNDING_PERMISSION' | 'NETWORK_ERROR' | 'EMPTY_SEARCH_RESULTS' | 'API_KEY_MISSING' | 'AUTH_ERROR' | 'OTHER';
  errorMessage?: string;
  cooldownRemainingSeconds?: number;
  timestamp?: string;
  sourceLinks?: Array<{ title: string; url: string; domain?: string }>;
}

export type AiProvider = 'gemini' | 'openai_compatible';

export interface AiApiConfig {
  provider?: AiProvider; // 'gemini' | 'openai_compatible'
  apiKey?: string;
  baseUrl?: string; // 自定义模型 API 端点 (例如 https://api.deepseek.com/v1 或 https://dashscope.aliyuncs.com/compatible-mode/v1)
  model: string; // 自拟模型名称 (例如 deepseek-chat, qwen-max, gpt-4o, gemini-3.7-flash)
  temperature?: number;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
  isKeyConfigured?: boolean;
  activeModel?: string;
  activeProvider?: AiProvider;
  updatedAt?: string;
}

export interface AiConnectionTestResult {
  success: boolean;
  latencyMs: number;
  modelUsed: string;
  providerUsed?: AiProvider;
  groundingSupported: boolean;
  message: string;
  testResponse?: string;
  errorDetails?: string;
  timestamp: string;
}

export interface CollectorPromptConfig {
  searchInstruction?: string;
  freshnessWindow: 'realtime_7d' | 'recent_30d' | 'year_2026';
  enableWebSearch: boolean;
  minImportanceScore: number;
  strictYearFilter: number;
  lastCollectedAt?: string; // 上次采集时间戳 (ISO)
  collectionWindow?: {
    from: string; // 采集窗口起始时间 (ISO)
    to: string;   // 采集窗口截止时间 (ISO)
  };
  lastSearchStatus?: SearchDiagnosticStatus;
}

export type TimeFilter = 'ALL' | '24h' | '7d' | '30d';
export type TargetLanguage = 'en' | 'zh' | 'ar' | 'es' | 'de' | 'fr';

export const TARGET_LANGUAGE_NAMES: Record<TargetLanguage, { name: string; flag: string; native: string }> = {
  en: { name: 'English', flag: '🇬🇧', native: 'English' },
  zh: { name: 'Chinese', flag: '🇨🇳', native: '中文' },
  ar: { name: 'Arabic', flag: '🇸🇦', native: 'العربية' },
  es: { name: 'Spanish', flag: '🇪🇸', native: 'Español' },
  de: { name: 'German', flag: '🇩🇪', native: 'Deutsch' },
  fr: { name: 'French', flag: '🇫🇷', native: 'Français' },
};

export interface ImageAsset {
  id: string;
  title: string;
  url: string;
  mediaType?: MediaType; // 'image' | 'video'
  fileName?: string;
  fileSize?: string;
  remarks: string; // 素材/图片/视频备注内容
  tags: string[]; // 索引标签 (e.g. #储能舱 #中东 #PV #构网型)
  region?: Region;
  createdAt: string;
}

export interface Article {
  id: string;
  weekNo: string; // e.g., "2026-W33"
  title: string;
  subtitle: string;
  region: Region;
  category: EventCategory;
  summary: string;
  bodyMarkdown: string; // contains {{BD_CONSULTATION_SLOT}}
  usedMaterialIds: string[];
  status: 'pending_dispatch' | 'distributed' | 'draft' | 'generated';
  dispatchWindowHours?: number; // e.g. 24 (hours)
  dispatchScheduledAt?: string; // ISO string when window expires
  assignedBdIds?: string[]; // multi-selected BD ids assigned for this article
  embeddedImageIds?: string[]; // image asset IDs associated or embedded
  stylePreset: StylePreset;
  targetLanguage?: TargetLanguage;
  createdAt: string;
  wordCount: number;
  coverImage?: string;
  tags?: string[];
}

export type PublishChannel = 'WeChatMoments' | 'LinkedIn' | 'OfficialAccount' | 'DirectContact' | 'RedBook';

export interface BDDistributionTask {
  id: string;
  articleId: string;
  articleTitle: string;
  articleRegion: Region;
  bdId: string;
  bdName: string;
  bdTitle: string;
  personalizedSection: string; // dynamically rendered consultation box text
  fullPersonalizedMarkdown: string; // complete article with BD signature inserted
  personalStylePromptUsed?: string; // the specific personal AI style prompt executed for this BD
  isAiPersonalized?: boolean; // whether 2nd layer AI tone/persona rendering completed
  status: 'pending' | 'read' | 'published';
  receivedAt: string;
  readAt?: string;
  publishedAt?: string;
  publishChannel?: PublishChannel;
  checkInProof?: string; // proof note or screenshot link
}

export interface PipelineStats {
  totalCollected: number;
  totalDeduped: number;
  totalMaterials: number;
  generatedArticlesThisWeek: number;
  totalDistributed: number;
  completedCheckIns: number;
  checkInRate: number; // 0 - 100%
  lastRunTime: string;
  nextScheduledRun: string;
  cronEnabled: boolean;
  overdueThresholdHours?: number;
  scheduleConfig?: ScheduleConfig;
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  module: 'Collector' | 'NegativeDedup' | 'GenerationEngine' | 'DistributionEngine' | 'CheckInMonitor';
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
  details?: string;
}

export interface StorageStats {
  storageType: 'LocalDiskJSON';
  storagePath: string;
  fileSizeBytes: number;
  fileSizeFormatted: string;
  lastSavedAt: string;
  uploadsCount: number;
  uploadsSizeBytes: number;
  uploadsSizeFormatted: string;
  recordCounts: {
    materials: number;
    articles: number;
    distributionTasks: number;
    bdMembers: number;
    imageAssets: number;
    negativeCache: number;
    logs: number;
    stylePresets: number;
  };
  autoSaveStatus: 'healthy' | 'warning';
}

export interface ImageUploadPayload {
  filename: string;
  data: string; // Base64 data URL
  title: string;
  remarks: string;
  tags?: string[];
  region?: Region;
}

export interface BackupPayload {
  version: string;
  exportedAt: string;
  materials: Material[];
  negativeCache: NegativeCacheItem[];
  bdMembers: BDMember[];
  articles: Article[];
  distributionTasks: BDDistributionTask[];
  imageAssets: ImageAsset[];
  logs: PipelineLog[];
  scheduleConfig: ScheduleConfig;
  stylePresets: StylePresetItem[];
  defaultDispatchWindowHours: number;
  overdueThresholdHours: number;
  cronEnabled: boolean;
}
