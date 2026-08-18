import { Material, NegativeCacheItem, BDMember, Article, BDDistributionTask, PipelineStats, PipelineLog, PublishChannel, Region, ImageAsset, StylePresetItem, ScheduleConfig, CollectorPromptConfig, AiProvider } from "../types";

export interface PipelineDataResponse {
  materials: Material[];
  negativeCache: NegativeCacheItem[];
  bdMembers: BDMember[];
  articles: Article[];
  distributionTasks: BDDistributionTask[];
  imageAssets: ImageAsset[];
  logs: PipelineLog[];
  stats: PipelineStats;
  dispatchWindowHours?: number;
  overdueThresholdHours?: number;
  stylePresets?: StylePresetItem[];
  scheduleConfig?: ScheduleConfig;
  collectorConfig?: CollectorPromptConfig;
}

export async function fetchPipelineData(): Promise<PipelineDataResponse> {
  const res = await fetch("/api/pipeline/data");
  if (!res.ok) throw new Error("Failed to fetch pipeline state");
  return res.json();
}

export async function addImageAssetApi(data: {
  title: string;
  url: string;
  mediaType?: 'image' | 'video';
  fileName?: string;
  fileSize?: string;
  remarks: string;
  tags?: string[];
  region?: Region;
}) {
  const res = await fetch("/api/images/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add media asset");
  return res.json();
}

export async function deleteImageAssetApi(id: string) {
  const res = await fetch(`/api/images/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete image asset");
  return res.json();
}

export async function updateArticleApi(id: string, updates: Partial<Article>) {
  const res = await fetch("/api/articles/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  });
  if (!res.ok) throw new Error("Failed to update article");
  return res.json();
}

export async function dispatchArticleNowApi(articleId: string) {
  const res = await fetch("/api/articles/dispatch-now", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ articleId }),
  });
  if (!res.ok) throw new Error("Failed to dispatch article");
  return res.json();
}

export async function setWindowHoursApi(hours: number) {
  const res = await fetch("/api/articles/set-window-hours", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hours }),
  });
  if (!res.ok) throw new Error("Failed to update window hours");
  return res.json();
}

export async function remindBDTaskApi(taskId: string) {
  const res = await fetch("/api/bd/remind", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId }),
  });
  if (!res.ok) throw new Error("Failed to send reminder");
  return res.json();
}

export async function triggerCollectorApi(config?: Partial<CollectorPromptConfig>): Promise<{
  message: string;
  data: any;
  state: Partial<PipelineDataResponse>;
}> {
  const res = await fetch("/api/collector/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config || {}),
  });
  if (!res.ok) throw new Error("Collector execution failed");
  return res.json();
}

export async function updateCollectorConfigApi(config: Partial<CollectorPromptConfig>) {
  const res = await fetch("/api/collector/config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update collector prompt config");
  return res.json();
}

export async function cleanStaleMaterialsApi() {
  const res = await fetch("/api/collector/clean-stale", { method: "POST" });
  if (!res.ok) throw new Error("Failed to clean stale materials");
  return res.json();
}

export async function addMaterialApi(data: {
  title: string;
  region: Region;
  category: string;
  summary: string;
  fullContent?: string;
  imageUrl?: string;
  mediaType?: 'image' | 'video';
  mediaFileName?: string;
  fileSize?: string;
  tags?: string[];
}) {
  const res = await fetch("/api/materials/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add material");
  return res.json();
}

export async function deleteMaterialApi(id: string) {
  const res = await fetch(`/api/materials/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete material");
  return res.json();
}

export async function generateArticlesApi(
  count: number = 3,
  selectedMaterialIds?: string[],
  stylePreset: string = "LinkedInPost",
  targetLanguage: string = "en",
  assignedBdIds?: string[],
  skipQuarantine?: boolean
) {
  const res = await fetch("/api/articles/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ count, selectedMaterialIds, stylePreset, targetLanguage, assignedBdIds, skipQuarantine }),
  });
  if (!res.ok) throw new Error("Article generation failed");
  return res.json();
}

export async function distributeArticlesApi() {
  const res = await fetch("/api/articles/distribute", { method: "POST" });
  if (!res.ok) throw new Error("Distribution failed");
  return res.json();
}

export async function updateBDProfileApi(data: Partial<BDMember> & { id: string }) {
  const res = await fetch("/api/bd/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update BD profile");
  return res.json();
}

export async function checkInBDTaskApi(taskId: string, publishChannel: PublishChannel, proofNote?: string) {
  const res = await fetch("/api/bd/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ taskId, publishChannel, proofNote }),
  });
  if (!res.ok) throw new Error("Check-in failed");
  return res.json();
}

export async function toggleCronApi(enabled: boolean) {
  const res = await fetch("/api/cron/toggle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  if (!res.ok) throw new Error("Failed to toggle cron schedule");
  return res.json();
}

export async function addBDMemberApi(data: Omit<BDMember, 'id'>) {
  const res = await fetch("/api/bd/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to add BD member");
  return res.json();
}

export async function importBDMembersApi(members: Omit<BDMember, 'id'>[]) {
  const res = await fetch("/api/bd/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ members }),
  });
  if (!res.ok) throw new Error("Failed to batch import BD members");
  return res.json();
}

export async function deleteBDMemberApi(id: string) {
  const res = await fetch(`/api/bd/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete BD member");
  return res.json();
}

export async function setOverdueRuleApi(hours: number) {
  const res = await fetch("/api/overdue/set-rule", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ hours }),
  });
  if (!res.ok) throw new Error("Failed to update overdue rule");
  return res.json();
}

export async function updateScheduleConfigApi(config: Partial<ScheduleConfig>) {
  const res = await fetch("/api/schedule/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update schedule config");
  return res.json();
}

export async function addStylePresetApi(preset: Omit<StylePresetItem, 'id'>) {
  const res = await fetch("/api/styles/add", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(preset),
  });
  if (!res.ok) throw new Error("Failed to add style preset");
  return res.json();
}

export async function updateStylePresetApi(id: string, updates: Partial<StylePresetItem>) {
  const res = await fetch("/api/styles/update", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, updates }),
  });
  if (!res.ok) throw new Error("Failed to update style preset");
  return res.json();
}

export async function deleteStylePresetApi(id: string) {
  const res = await fetch(`/api/styles/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete style preset");
  return res.json();
}

// === AI CONFIGURATION & TESTING APIS ===
export interface AiConfigData {
  provider: AiProvider;
  apiKey: string;
  hasCustomKey: boolean;
  baseUrl?: string;
  model: string;
  temperature?: number;
  thinkingLevel?: 'HIGH' | 'LOW' | 'MINIMAL';
}

export interface ProviderPresetItem {
  id: string;
  name: string;
  provider: AiProvider;
  defaultBaseUrl?: string;
  defaultModel: string;
  description: string;
  keyPlaceholder: string;
  popularModels: Array<{ id: string; name: string }>;
}

export async function fetchAiConfigApi(): Promise<{
  success: boolean;
  config: AiConfigData;
  providerPresets: ProviderPresetItem[];
}> {
  const res = await fetch("/api/ai-config");
  if (!res.ok) throw new Error("Failed to fetch AI configuration");
  return res.json();
}

export async function updateAiConfigApi(config: Partial<{
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
  temperature: number;
  thinkingLevel: 'HIGH' | 'LOW' | 'MINIMAL';
}>): Promise<{
  success: boolean;
  config: AiConfigData;
  logs: PipelineLog[];
}> {
  const res = await fetch("/api/ai-config", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error("Failed to update AI configuration");
  return res.json();
}

export async function testAiConfigApi(params?: {
  provider?: AiProvider;
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}): Promise<{
  success: boolean;
  model: string;
  provider?: AiProvider;
  latencyMs: number;
  groundingSupported?: boolean;
  message: string;
  sampleOutput?: string;
  errorDetails?: string;
  logs: PipelineLog[];
}> {
  const res = await fetch("/api/ai-config/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error("Failed to test AI connection");
  return res.json();
}

// Clear Database Mock / Fake Data
export async function clearDatabaseDataApi(): Promise<{
  success: boolean;
  message: string;
  state: PipelineDataResponse;
}> {
  const res = await fetch("/api/clear-database-data", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to clear database data");
  return res.json();
}
