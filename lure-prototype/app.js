const HAS_CLOUD_API = location.protocol !== "file:";
const authGate = document.getElementById("auth-gate");
const authForm = document.getElementById("auth-form");
const authPassword = document.getElementById("auth-password");
const authError = document.getElementById("auth-error");

const seedState = {
  logs: [
    {
      id: "seed-1",
      species: "黑鱼",
      size: "54cm",
      weight: "2.1kg",
      spot: "南湖公园标点 · 东岸浅滩",
      lure: "米诺 12g",
      date: "2025-05-24",
      time: "06:35",
      image: "assets/catch-snakehead.png",
      note: "浅滩边缘追饵，收停后咬口。"
    },
    {
      id: "seed-2",
      species: "翘嘴",
      size: "42cm",
      weight: "1.3kg",
      spot: "长河水库 · 大坝左侧",
      lure: "VIB 14g",
      date: "2025-05-22",
      time: "18:40",
      image: "assets/catch-zui.png",
      note: "傍晚窗口，远投快速搜索。"
    },
    {
      id: "seed-3",
      species: "鲈鱼",
      size: "36cm",
      weight: "0.9kg",
      spot: "城郊野河 · 桥墩回水湾",
      lure: "软虫 7g",
      date: "2025-05-20",
      time: "07:15",
      image: "assets/catch-perch.png",
      note: "桥墩阴影位慢跳。"
    }
  ],
  spots: [
    {
      id: "spot-1",
      name: "南湖公园标点",
      water: "东岸浅滩",
      structure: "草边、浅滩、明暗线",
      target: "黑鱼 / 鲈鱼",
      note: "清晨和阴天更稳定。"
    },
    {
      id: "spot-2",
      name: "长河水库",
      water: "大坝左侧",
      structure: "坝口、深浅交界、回水",
      target: "翘嘴",
      note: "傍晚炸水明显，远投优先。"
    }
  ],
  gear: [
    { id: "gear-1", name: "ML 泛用竿", type: "钓竿", spec: "1.98m / 5-14g", note: "米诺、VIB、软虫泛用" },
    { id: "gear-2", name: "2500S 纺车轮", type: "渔轮", spec: "PE 1.0", note: "搭配 2.5 号碳前导" },
    { id: "gear-3", name: "米诺 110SP", type: "拟饵", spec: "12g / 银黑背", note: "当前推荐主力饵" }
  ],
  sessions: []
};

const toast = document.querySelector(".toast");
const modal = document.getElementById("entry-modal");
const form = document.getElementById("entry-form");
const modalTitle = document.getElementById("entry-title");
const logDateTimePickerModal = document.getElementById("log-datetime-picker-modal");
const logPickerDate = document.getElementById("log-picker-date");
const logPickerTime = document.getElementById("log-picker-time");
const catchDetailModal = document.getElementById("catch-detail-modal");
const catchDetailTitle = document.getElementById("catch-detail-title");
const catchDetailContent = document.getElementById("catch-detail-content");
const catchPhotoViewerModal = document.getElementById("catch-photo-viewer-modal");
const catchPhotoViewerContent = document.getElementById("catch-photo-viewer-content");
const catchPhotoViewerTitle = document.getElementById("catch-photo-viewer-title");
const gearDetailModal = document.getElementById("gear-detail-modal");
const gearDetailTitle = document.getElementById("gear-detail-title");
const gearDetailContent = document.getElementById("gear-detail-content");
const dataToolsModal = document.getElementById("data-tools-modal");
const dataRestoreFile = document.getElementById("data-restore-file");
const sessionArchiveModal = document.getElementById("session-archive-modal");
const sessionArchiveStats = document.getElementById("session-archive-stats");
const sessionArchiveList = document.getElementById("session-archive-list");
const sessionReviewModal = document.getElementById("session-review-modal");
const sessionReviewTitle = document.getElementById("session-review-title");
const sessionReviewContent = document.getElementById("session-review-content");
const spotInsightModal = document.getElementById("spot-insight-modal");
const spotInsightTitle = document.getElementById("spot-insight-title");
const spotInsightContent = document.getElementById("spot-insight-content");
const spotMapElement = document.getElementById("spot-map");
const spotMapStatus = document.getElementById("spot-map-status");
const locationDetailModal = document.getElementById("location-detail-modal");
const locationDetailContent = document.getElementById("location-detail-content");
let toastTimer;

const defaultConditions = {
  score: 86,
  description: "非常适合出钓",
  radar: [
    { label: "天气条件", value: 85 },
    { label: "水温条件", value: 82 },
    { label: "溶氧估算", value: 80 },
    { label: "气压趋势", value: 88 },
    { label: "活跃度预测", value: 90 }
  ],
  weather: {
    summary: "多云",
    temperature: "24.0°C",
    tempRange: "20~28°C",
    wind: "东南风 2级",
    pressure: "气压 1008 hPa",
    humidity: "湿度 68%",
    visibility: "等待定位",
    water: "水温估算 24.6°C",
    window: "适宜窗口 6-10时"
  },
  recommendation: {
    lure: "米诺 (Minnow)",
    lureMeta: "环境匹配",
    color: "自然色系",
    weight: "10 ~ 14g",
    retrieve: "快慢结合抽停",
    basis: "基于当前环境"
  }
};

function loadState() {
  return structuredClone(seedState);
}

let state = loadState();
let conditionsState = structuredClone(defaultConditions);
let locationRequestId = 0;
let activeGearCategory = "全部";
let activeCatchSpecies = "all";
let activeCatchGear = "all";
let activeCatchSpot = "all";
let activeCatchLure = "all";
let activeCatchSession = "all";
let activeCatchDateFrom = "";
let activeCatchDateTo = "";
let activeSessionArchiveYear = "all";
let activeSessionArchiveMonth = "all";
let activeSessionArchiveDate = "";
let activeSpotSpecies = "all";
let activeSpotStatus = "all";
let activeAnalyticsYear = "all";
let analyticsState = null;
let analyticsRequestId = 0;
let catchPage = { logs: [], total: 0, nextCursor: null, loading: false };

const defaultGearCategories = ["全部", "拟饵", "钓竿", "渔轮", "线组", "配件", "未分类"];
const spotStatusMeta = {
  active: { label: "高概率", icon: "local_fire_department" },
  seasonal: { label: "季节性", icon: "event_repeat" },
  closed: { label: "暂不开放", icon: "block" }
};

const speciesGroups = [
  {
    label: "淡水常见",
    items: [
      ["黑鱼", "黑鱼（乌鳢）"],
      ["翘嘴", "翘嘴（翘嘴鲌）"],
      ["鲈鱼", "鲈鱼（大口黑鲈）"],
      ["鳜鱼", "鳜鱼"],
      ["鳡鱼", "鳡鱼"],
      ["马口", "马口鱼"],
      ["军鱼", "军鱼"],
      ["鲶鱼", "鲶鱼"],
      ["罗非鱼", "罗非鱼"],
      ["白条", "白条"],
      ["青梢", "青梢"],
      ["红尾", "红尾"],
      ["鸭嘴翘", "鸭嘴翘"],
      ["鲤鱼", "鲤鱼"]
    ]
  },
  {
    label: "海水 / 近海",
    items: [
      ["海鲈", "海鲈（花鲈）"],
      ["石斑鱼", "石斑鱼"],
      ["黑鲷", "黑鲷"],
      ["真鲷", "真鲷"],
      ["马鲛鱼", "马鲛鱼（鲅鱼）"],
      ["鲹鱼", "鲹鱼"]
    ]
  }
];

const knownSpecies = speciesGroups.flatMap((group) => group.items.map(([value]) => value));

function getGearCategory(gear) {
  return String(gear.category || gear.type || "未分类").trim() || "未分类";
}

function getGearCategories() {
  const categories = [...defaultGearCategories];
  state.gear.forEach((gear) => {
    const category = getGearCategory(gear);
    if (!categories.includes(category)) categories.push(category);
  });
  return categories;
}

function getGearVisual(category) {
  const value = String(category || "");
  if (value === "拟饵") return { icon: "phishing", tone: "lure" };
  if (value === "钓竿") return { asset: "assets/gear-fishing-rod-ai.png", tone: "rod" };
  if (value === "渔轮") return { asset: "assets/gear-spinning-reel-ai.png", tone: "reel" };
  if (value === "线组") return { icon: "polyline", tone: "line" };
  return { icon: "backpack", tone: "accessory" };
}

function renderGearIcon(visual) {
  if (visual.asset) return `<img src="${visual.asset}" alt="">`;
  return `<span class="material-symbols-rounded">${visual.icon}</span>`;
}

async function apiGetState() {
  if (!HAS_CLOUD_API) return;
  try {
    const response = await fetch("/api/bootstrap");
    if (!response.ok) throw new Error(`API ${response.status}`);
    const data = await response.json();
    state = {
      logs: Array.isArray(data.logs) ? data.logs : [],
      spots: Array.isArray(data.spots) ? data.spots : [],
      gear: Array.isArray(data.gear) ? data.gear : [],
      sessions: Array.isArray(data.sessions) ? data.sessions : []
    };
    catchPage = {
      logs: Array.isArray(data.logs) ? data.logs : [],
      total: Number(data.log_page?.total ?? data.logs?.length ?? 0),
      nextCursor: data.log_page?.next_cursor || null,
      loading: false
    };
    renderAll();
    refreshAnalytics();
  } catch (error) {
    showToast("云端数据暂不可用，当前显示演示数据");
  }
}

async function apiCreate(type, data) {
  if (!HAS_CLOUD_API) {
    return { id: `${type}-${Date.now()}`, ...data };
  }

  const endpoints = { log: "/api/logs", spot: "/api/spots", gear: "/api/gear", session: "/api/sessions" };
  const response = await fetch(endpoints[type], {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API ${response.status}`);
  }
  return response.json();
}

async function apiUpdate(type, id, data) {
  if (!HAS_CLOUD_API) return { id, ...data };

  const endpoints = { log: "/api/logs", spot: "/api/spots", gear: "/api/gear", session: "/api/sessions" };
  const response = await fetch(`${endpoints[type]}?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API ${response.status}`);
  }
  return response.json();
}

async function apiUploadCatchPhoto(logId, photo) {
  if (!HAS_CLOUD_API) throw new Error("CLOUD_PHOTO_STORAGE_UNAVAILABLE");
  const response = await fetch(`/api/log-photos?log_id=${encodeURIComponent(logId)}`, {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": photo.type },
    body: photo
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `photo ${response.status}`);
  return data;
}

async function apiDeleteCatchPhoto(logId) {
  if (!HAS_CLOUD_API) return { log_id: logId, deleted: true };
  const response = await fetch(`/api/log-photos?log_id=${encodeURIComponent(logId)}`, {
    method: "DELETE",
    credentials: "same-origin"
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || data.message || `photo ${response.status}`);
  return data;
}

async function apiUpdateSessionReview(id, data) {
  if (!HAS_CLOUD_API) return { id, ...data };

  const response = await fetch(`/api/sessions/review?id=${encodeURIComponent(id)}`, {
    method: "PUT",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(data)
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `API ${response.status}`);
  return result;
}

async function apiDelete(type, id) {
  if (!HAS_CLOUD_API) return { id, deleted: true };

  const endpoints = { log: "/api/logs", spot: "/api/spots", gear: "/api/gear", session: "/api/sessions" };
  const endpoint = endpoints[type];
  const response = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: "DELETE" });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `API ${response.status}`);
  }
  return response.json();
}

async function apiExportData() {
  if (!HAS_CLOUD_API) {
    return {
      version: 1,
      app: "Lure Assistant",
      exported_at: new Date().toISOString(),
      data: structuredClone(state)
    };
  }
  const response = await fetch("/api/data/export", { credentials: "same-origin" });
  if (!response.ok) throw new Error(`export ${response.status}`);
  return response.json();
}

async function apiRestoreData(backup) {
  if (!HAS_CLOUD_API) {
    state = structuredClone(backup.data || seedState);
    return { restored: true };
  }
  const response = await fetch("/api/data/restore", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(backup)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `restore ${response.status}`);
  return data;
}

async function apiGetConditions(coords) {
  if (!HAS_CLOUD_API) return structuredClone(defaultConditions);
  const params = coords
    ? new URLSearchParams({ lat: coords.latitude, lon: coords.longitude })
    : new URLSearchParams({ fallback: "network" });
  const response = await fetch(`/api/conditions?${params}`);
  if (!response.ok) throw new Error(`conditions ${response.status}`);
  return response.json();
}

async function apiGetAnalytics(year = "all") {
  if (!HAS_CLOUD_API) return null;
  const params = year !== "all" ? `?year=${encodeURIComponent(year)}` : "";
  const response = await fetch(`/api/analytics${params}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`analytics ${response.status}`);
  return response.json();
}

async function apiListLogs(cursor = null) {
  if (!HAS_CLOUD_API) return null;
  const params = new URLSearchParams({ limit: "50" });
  if (cursor) params.set("cursor", cursor);
  if (activeCatchSpecies !== "all") params.set("species", activeCatchSpecies);
  if (activeCatchGear !== "all") params.set("gear_id", activeCatchGear);
  if (activeCatchLure !== "all") params.set("lure_name", activeCatchLure);
  if (activeCatchSpot !== "all") params.set("spot_id", activeCatchSpot);
  if (activeCatchSession !== "all") params.set("session_id", activeCatchSession);
  if (activeCatchDateFrom) params.set("date_from", activeCatchDateFrom);
  if (activeCatchDateTo) params.set("date_to", activeCatchDateTo);
  const response = await fetch(`/api/logs?${params}`, { credentials: "same-origin" });
  if (!response.ok) throw new Error(`logs ${response.status}`);
  return response.json();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function backupFileDate() {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(value) {
  return `"${String(value ?? "").replaceAll('"', '""').replaceAll("\n", " ")}"`;
}

function makeCatchCsv(logs) {
  const columns = ["日期", "时间", "鱼种", "长度(cm)", "重量(kg)", "钓行", "标点", "钓竿", "渔轮", "拟饵", "拟饵克数", "备注"];
  const rows = logs.map((log) => [
    log.date, log.time, log.species, log.size, log.weight, getLogSessionLabel(log), getLogSpotLabel(log),
    getGearNameById(log.rod_id), getGearNameById(log.reel_id), getLogLureName(log), getLogLureWeight(log), log.note
  ].map(csvCell).join(","));
  return `\uFEFF${columns.map(csvCell).join(",")}\n${rows.join("\n")}`;
}

function openDataTools() {
  if (dataToolsModal) dataToolsModal.hidden = false;
}

function closeDataTools() {
  if (dataToolsModal) dataToolsModal.hidden = true;
}

async function handleBackupExport(event) {
  const button = event.target.closest?.("[data-export-backup]");
  if (!button) return;
  button.disabled = true;
  try {
    const backup = await apiExportData();
    downloadFile(JSON.stringify(backup, null, 2), `lure-assistant-backup-${backupFileDate()}.json`, "application/json;charset=utf-8");
    showToast("完整备份已下载");
  } catch (error) {
    showToast("备份失败，请检查网络后重试");
  } finally {
    button.disabled = false;
  }
}

async function handleCatchCsvExport(event) {
  const button = event.target.closest?.("[data-export-catches-csv]");
  if (!button) return;
  button.disabled = true;
  try {
    const backup = await apiExportData();
    downloadFile(makeCatchCsv(backup.data?.logs || []), `lure-assistant-catches-${backupFileDate()}.csv`, "text/csv;charset=utf-8");
    showToast("鱼获 CSV 已下载");
  } catch (error) {
    showToast("导出失败，请检查网络后重试");
  } finally {
    button.disabled = false;
  }
}

async function handleBackupRestore(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  event.target.value = "";
  if (file.size > 6 * 1024 * 1024) {
    showToast("备份文件过大，无法恢复");
    return;
  }
  try {
    const backup = JSON.parse(await file.text());
    const counts = backup?.data;
    if (Number(backup?.version) !== 1 || !counts || !Array.isArray(counts.logs) || !Array.isArray(counts.spots) || !Array.isArray(counts.gear) || !Array.isArray(counts.sessions)) {
      throw new Error("invalid backup");
    }
    const message = `恢复将替换当前云端数据：${counts.logs.length} 条鱼获、${counts.spots.length} 个标点、${counts.gear.length} 件装备、${counts.sessions.length} 次钓行。注意：鱼获实拍图不在 JSON 备份中，恢复会清理当前云端实拍图。是否继续？`;
    if (!window.confirm(message)) return;
    await apiRestoreData(backup);
    await apiGetState();
    renderAll();
    closeDataTools();
    showToast("备份已恢复到云端");
  } catch (error) {
    showToast("恢复失败，请确认选择的是完整备份文件");
  }
}

function setAuthError(message = "") {
  if (!authError) return;
  authError.textContent = message;
  authError.hidden = !message;
}

function showAuthGate(message = "") {
  if (!authGate) return;
  authGate.hidden = false;
  setAuthError(message);
  authPassword?.focus();
}

function hideAuthGate() {
  if (!authGate) return;
  authGate.hidden = true;
  setAuthError();
}

async function checkAuthSession() {
  const response = await fetch("/api/auth/session", { credentials: "same-origin" });
  if (response.ok) return true;
  if (response.status === 401) return false;
  const data = await response.json().catch(() => ({}));
  throw new Error(data.error || `auth ${response.status}`);
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  const password = authPassword?.value || "";
  if (!password) return;

  const submitButton = authForm?.querySelector("button[type=submit]");
  if (submitButton) submitButton.disabled = true;
  setAuthError();

  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = data.error === "AUTH_NOT_CONFIGURED"
        ? "线上认证还未配置，请先完成部署设置。"
        : data.error === "INVALID_PASSWORD"
          ? "访问密码不正确。"
          : "登录失败，请稍后重试。";
      throw new Error(message);
    }
    authPassword.value = "";
    hideAuthGate();
    startApp();
  } catch (error) {
    setAuthError(error.message || "登录失败，请稍后重试。");
  } finally {
    if (submitButton) submitButton.disabled = false;
  }
}

function startApp() {
  renderConditions();
  renderAll();
  apiGetState();
  if (HAS_CLOUD_API && location.protocol === "https:") requestLocationConditions();
}

async function initApp() {
  if (!HAS_CLOUD_API) {
    hideAuthGate();
    startApp();
    return;
  }

  showAuthGate();
  try {
    if (await checkAuthSession()) {
      hideAuthGate();
      startApp();
    }
  } catch (error) {
    showAuthGate(error.message === "AUTH_NOT_CONFIGURED"
      ? "线上认证还未配置，请先完成部署设置。"
      : "无法连接认证服务，请检查网络后重试。");
  }
}

function formatDate(log) {
  return `${log.date || ""} ${log.time || ""}`.trim();
}

function formatMeasurement(value, unitPattern, suffix) {
  const text = String(value ?? "").trim();
  if (!text || text === "-") return "-";
  return unitPattern.test(text) ? text : `${text} ${suffix}`;
}

function formatCatchSize(value) {
  return formatMeasurement(value, /(?:cm|m|\u5398\u7c73|\u7c73)/i, "cm");
}

function formatCatchWeight(value) {
  return formatMeasurement(value, /(?:kg|g|\u5343\u514b|\u516c\u65a4|\u514b)/i, "kg");
}

function parseCatchMeasurement(value, kind) {
  const text = String(value ?? "").trim().toLowerCase();
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return "";
  const number = Number(match[0]);
  if (!Number.isFinite(number) || number <= 0) return "";
  if (kind === "length") return String(/cm|厘米/.test(text) || (!/\bm\b|米/.test(text) && number >= 10) ? number : number * 100);
  return String(/\bkg\b|公斤|千克/.test(text) ? number * 1000 : number);
}

function setText(id, value) {
  const target = document.getElementById(id);
  if (target) target.textContent = value;
}

function scoreLabel(score) {
  if (score >= 86) return "极佳";
  if (score >= 72) return "适宜";
  if (score >= 58) return "可钓";
  return "谨慎";
}

function renderConditions() {
  const data = conditionsState;
  setText("score-value", data.score);
  setText("score-desc", data.description);
  setText("fish-index-value", data.score);
  setText("fish-index-label", scoreLabel(data.score));
  setText("weather-summary", data.weather.summary);
  setText("weather-temp", data.weather.temperature || data.weather.tempRange);
  setText("weather-wind", data.weather.wind);
  setText("weather-pressure", data.weather.pressure);
  setText("weather-humidity", data.weather.humidity);
  setText("weather-visibility", data.weather.visibility);
  setText("weather-water", data.weather.water);
  setText("weather-window", data.weather.window);
  setText("condition-place", data.location?.place || "查看详情");
  setText("rec-lure", data.recommendation.lure);
  setText("rec-lure-meta", data.recommendation.lureMeta || "环境匹配");
  setText("recommend-basis", data.recommendation.basis || "基于当前环境");
  setText("rec-color", data.recommendation.color);
  setText("rec-weight", data.recommendation.weight);
  setText("rec-retrieve", data.recommendation.retrieve);
  renderRadar(data.radar);
}

function renderRadar(items) {
  const svg = document.getElementById("radar-chart");
  if (!svg) return;

  const cx = 96;
  const cy = 65;
  const radius = 42;
  const count = items.length;
  const points = items.map((item, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    const distance = radius * Math.max(0, Math.min(100, item.value)) / 100;
    return {
      ...item,
      angle,
      x: cx + Math.cos(angle) * distance,
      y: cy + Math.sin(angle) * distance,
      lx: cx + Math.cos(angle) * (radius + 21),
      ly: cy + Math.sin(angle) * (radius + 18),
      vx: cx + Math.cos(angle) * (radius + 8),
      vy: cy + Math.sin(angle) * (radius + 5)
    };
  });

  const grid = [0.25, 0.5, 0.75, 1].map((scale) => {
    const polygon = items.map((_, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
      return `${cx + Math.cos(angle) * radius * scale},${cy + Math.sin(angle) * radius * scale}`;
    }).join(" ");
    return `<polygon class="radar-grid" points="${polygon}"></polygon>`;
  }).join("");

  const axes = items.map((_, index) => {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index) / count;
    return `<line class="radar-axis" x1="${cx}" y1="${cy}" x2="${cx + Math.cos(angle) * radius}" y2="${cy + Math.sin(angle) * radius}"></line>`;
  }).join("");

  const shape = points.map((point) => `${point.x},${point.y}`).join(" ");
  const dots = points.map((point) => `<circle class="radar-dot" cx="${point.x}" cy="${point.y}" r="3"></circle>`).join("");
  const labels = points.map((point) => {
    const anchor = point.lx < cx - 6 ? "end" : point.lx > cx + 6 ? "start" : "middle";
    return `
      <text class="radar-label" x="${point.lx}" y="${point.ly}" text-anchor="${anchor}">${point.label}</text>
      <text class="radar-value" x="${point.vx}" y="${point.vy}" text-anchor="${anchor}">${point.value}</text>
    `;
  }).join("");

  svg.innerHTML = `
    <title id="radar-title">天气条件雷达图</title>
    ${grid}
    ${axes}
    <polygon class="radar-shape" points="${shape}"></polygon>
    ${dots}
    ${labels}
  `;
}

function getLogGearId(log) {
  return String(log.gear_id || log.gearId || "");
}

function getLogGearIds(log) {
  return [...new Set([log.rod_id, log.reel_id, log.gear_id, log.gearId].map((id) => String(id || "")).filter(Boolean))];
}

function getGearNameById(id, snapshot = "") {
  const gear = state.gear.find((item) => String(item.id) === String(id));
  return gear?.name || snapshot || (id ? "装备已归档" : "未关联装备");
}

function getLogGearLabel(log) {
  const labels = [
    log.rod_id ? getGearNameById(log.rod_id, log.rod_name_snapshot) : "",
    log.reel_id ? getGearNameById(log.reel_id, log.reel_name_snapshot) : "",
    log.gear_id && log.gear_id !== log.rod_id && log.gear_id !== log.reel_id ? getGearNameById(log.gear_id, log.gear_name_snapshot) : ""
  ].filter(Boolean);
  return labels.length ? labels.join(" + ") : "未关联装备";
}

function getLogSpotId(log) {
  return String(log.spot_id || log.spotId || "");
}

function getSpotNameById(id) {
  const spot = state.spots.find((item) => String(item.id) === String(id));
  return spot?.name || "标点已删除";
}

function getLogSpotLabel(log) {
  const spotId = getLogSpotId(log);
  const spot = state.spots.find((item) => String(item.id) === spotId);
  return spot?.name || log.spot_name_snapshot || log.spot || "未记录标点";
}

function getLogSessionId(log) {
  return String(log.session_id || log.sessionId || "");
}

function getSessionNameById(id) {
  const session = state.sessions.find((item) => String(item.id) === String(id));
  return session?.name || "钓行已删除";
}

function getLogSessionLabel(log) {
  const sessionId = getLogSessionId(log);
  const session = state.sessions.find((item) => String(item.id) === sessionId);
  return session?.name || log.session_name_snapshot || "未关联钓行";
}

function parseLureParts(value) {
  const text = String(value || "").trim();
  const match = text.match(/\d+(?:\.\d+)?\s*g\b/i);
  if (!match) return { name: text, weight: "" };
  const name = text.replace(match[0], "").replace(/[·|/]+/g, " ").replace(/\s+/g, " ").trim();
  return { name: name || text, weight: match[0].replace(/\s+/g, "") };
}

function getLogLureName(log) {
  return String(log.lure_name || "").trim() || parseLureParts(log.lure).name;
}

function getLogLureWeight(log) {
  return String(log.lure_weight || "").trim() || parseLureParts(log.lure).weight;
}

function formatLure(log) {
  const name = getLogLureName(log);
  const weight = getLogLureWeight(log);
  return [name, weight].filter(Boolean).join(" · ") || "未记录拟饵";
}

function getLureGearList() {
  return state.gear.filter((gear) => String(gear.type || gear.category || "").includes("拟饵"));
}

function getLureWeightOptions(lureName = "") {
  const gear = getLureGearList().find((item) => item.name === lureName);
  const source = [gear?.weight_options, gear?.spec, gear?.name].filter(Boolean).join(" ");
  const parsed = [...source.matchAll(/\d+(?:\.\d+)?\s*g\b/gi)].map((match) => match[0].replace(/\s+/g, ""));
  const weights = [...new Set(parsed)];
  return weights.length ? weights : ["3g", "5g", "7g", "9g", "10g", "12g", "14g", "18g", "21g"];
}

function getLureSelectOptions(selected = "") {
  const options = getLureGearList().map((gear) => `
    <option value="${escapeHtml(gear.name)}"${gear.name === selected ? " selected" : ""}>${escapeHtml(gear.name)}</option>
  `).join("");
  const customOption = selected && !getLureGearList().some((gear) => gear.name === selected)
    ? `<option value="${escapeHtml(selected)}" selected>${escapeHtml(selected)}（历史记录）</option>`
    : "";
  return `<option value="">未关联拟饵</option>${options}${customOption}`;
}

function getDefaultTime() {
  const now = new Date();
  const roundedMinutes = Math.round(now.getMinutes() / 15) * 15;
  const hour = (now.getHours() + Math.floor(roundedMinutes / 60)) % 24;
  const minute = roundedMinutes % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function getDefaultDateTime() {
  const now = new Date();
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `${date}T${getDefaultTime()}`;
}

function getDefaultSessionName() {
  return `${getDefaultDateTime().slice(0, 10)} 钓行`;
}

function getSpeciesOptions(selected = "") {
  const groups = speciesGroups.map((group) => `
    <optgroup label="${group.label}">
      ${group.items.map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("")}
    </optgroup>
  `).join("");
  return `<option value="">请选择鱼种</option>${groups}<option value="__other__"${selected === "__other__" ? " selected" : ""}>其他鱼种</option>`;
}

function updateSpeciesFieldVisibility() {
  const select = form.querySelector('[name="species"]');
  const customField = form.querySelector("[data-species-custom-field]");
  const customInput = form.querySelector('[name="species_custom"]');
  if (!select || !customField || !customInput) return;
  const isOther = select.value === "__other__";
  customField.hidden = !isOther;
  customInput.required = isOther;
  if (!isOther) customInput.value = "";
}

function updateLureWeightOptions(selected = "") {
  const lureSelect = form.querySelector('[name="lure_name"]');
  const weightSelect = form.querySelector('[name="lure_weight"]');
  if (!lureSelect || !weightSelect) return;
  const weights = getLureWeightOptions(lureSelect.value);
  const options = weights.map((weight) => `<option value="${escapeHtml(weight)}">${escapeHtml(weight)}</option>`).join("");
  weightSelect.innerHTML = `<option value="">未记录克数</option>${options}`;
  if (selected && !weights.includes(selected)) {
    weightSelect.insertAdjacentHTML("afterbegin", `<option value="${escapeHtml(selected)}">${escapeHtml(selected)}</option>`);
  }
  weightSelect.value = selected || "";
}

function updateGearFieldVisibility() {
  const typeField = form.querySelector('[name="type"]');
  const specField = form.querySelector("[data-gear-spec-field]");
  const weightField = form.querySelector("[data-gear-weight-field]");
  if (!typeField || !specField || !weightField) return;

  const isLure = typeField.value === "拟饵";
  specField.hidden = isLure;
  weightField.hidden = !isLure;

  if (isLure) {
    form.elements.spec.value = "";
  } else {
    form.elements.weight_options.value = "";
  }
}

function getGearSelectOptions(selected = "", type = "") {
  const options = state.gear.filter((gear) => !type || getGearCategory(gear) === type).map((gear) => `
    <option value="${escapeHtml(gear.id)}"${String(gear.id) === String(selected) ? " selected" : ""}>
      ${escapeHtml(gear.name)}${gear.type ? ` · ${escapeHtml(gear.type)}` : ""}
    </option>
  `).join("");
  return `<option value="">未关联${type || "装备"}</option>${options}`;
}

function getLogDateTime(log) {
  const date = String(log.date || "").trim();
  const time = String(log.time || "00:00").trim().slice(0, 5);
  return date ? `${date}T${time || "00:00"}` : "";
}

function splitLogDateTime(value) {
  const [date = "", time = ""] = String(value || "").split("T");
  return { date, time: time.slice(0, 5) };
}

function getQuarterHourOptions(selected = "") {
  const value = String(selected || "").slice(0, 5);
  const options = [];
  for (let hour = 0; hour < 24; hour += 1) {
    for (const minute of [0, 15, 30, 45]) {
      const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
      options.push(`<option value="${time}"${time === value ? " selected" : ""}>${time}</option>`);
    }
  }
  if (value && !/^\d{2}:(00|15|30|45)$/.test(value)) {
    options.unshift(`<option value="${escapeHtml(value)}" selected>${escapeHtml(value)}（历史时间）</option>`);
  }
  return options.join("");
}

function formatLogDateTimeField(value) {
  const { date, time } = splitLogDateTime(value);
  return date ? `${date} ${time || "00:00"}` : "选择日期和时间";
}

function syncLogDateTimeField() {
  const input = form.elements.namedItem("logged_at");
  const display = form.querySelector("[data-log-datetime-display]");
  if (input && display) display.textContent = formatLogDateTimeField(input.value);
}

function openLogDateTimePicker() {
  const input = form.elements.namedItem("logged_at");
  if (!input || !logDateTimePickerModal || !logPickerDate || !logPickerTime) return;
  const dateTime = splitLogDateTime(input.value || getDefaultDateTime());
  logPickerDate.value = dateTime.date || getDefaultDateTime().slice(0, 10);
  logPickerTime.innerHTML = getQuarterHourOptions(dateTime.time || getDefaultTime());
  logPickerTime.value = dateTime.time || getDefaultTime();
  logDateTimePickerModal.hidden = false;
}

function closeLogDateTimePicker() {
  if (logDateTimePickerModal) logDateTimePickerModal.hidden = true;
}

function saveLogDateTimePicker() {
  const input = form.elements.namedItem("logged_at");
  if (!input || !logPickerDate?.value || !logPickerTime?.value) return;
  input.value = `${logPickerDate.value}T${logPickerTime.value}`;
  syncLogDateTimeField();
  closeLogDateTimePicker();
}

function getSpotSelectOptions(selected = "") {
  const options = state.spots.map((spot) => `
    <option value="${escapeHtml(spot.id)}"${String(spot.id) === String(selected) ? " selected" : ""}>
      ${escapeHtml(spot.name)}${spot.water ? ` · ${escapeHtml(spot.water)}` : ""}
    </option>
  `).join("");
  return `<option value="">未关联标点</option>${options}`;
}

function getSessionSelectOptions(selected = "") {
  const options = state.sessions.map((session) => `
    <option value="${escapeHtml(session.id)}"${String(session.id) === String(selected) ? " selected" : ""}>
      ${escapeHtml(session.name)}
    </option>
  `).join("");
  return `<option value="">未关联钓行</option>${options}`;
}

function renderCatchFilters() {
  const speciesSelect = document.getElementById("catch-species-filter");
  const gearSelect = document.getElementById("catch-gear-filter");
  const lureSelect = document.getElementById("catch-lure-filter");
  const spotSelect = document.getElementById("catch-spot-filter");
  const dateFromInput = document.getElementById("catch-date-from");
  const dateToInput = document.getElementById("catch-date-to");
  if (!speciesSelect || !gearSelect || !lureSelect || !spotSelect || !dateFromInput || !dateToInput) return;

  const species = [...new Set(state.logs.map((log) => String(log.species || "").trim()).filter(Boolean))];
  const lures = [...new Set(state.logs.map(getLogLureName).filter(Boolean))];
  if (activeCatchSpecies !== "all" && !species.includes(activeCatchSpecies)) activeCatchSpecies = "all";
  if (activeCatchGear !== "all" && activeCatchGear !== "none" && !state.gear.some((gear) => String(gear.id) === activeCatchGear)) activeCatchGear = "all";
  if (activeCatchLure !== "all" && activeCatchLure !== "none" && !lures.includes(activeCatchLure)) activeCatchLure = "all";
  if (activeCatchSpot !== "all" && activeCatchSpot !== "none" && !state.spots.some((spot) => String(spot.id) === activeCatchSpot)) activeCatchSpot = "all";
  if (activeCatchSession !== "all" && activeCatchSession !== "none" && !state.sessions.some((session) => String(session.id) === activeCatchSession)) activeCatchSession = "all";

  speciesSelect.innerHTML = `<option value="all">全部鱼种（${state.logs.length}）</option>${species.map((item) => `
    <option value="${escapeHtml(item)}">${escapeHtml(item)}（${state.logs.filter((log) => log.species === item).length}）</option>
  `).join("")}`;
  gearSelect.innerHTML = `<option value="all">全部装备（${state.logs.length}）</option>${state.gear.map((gear) => `
    <option value="${escapeHtml(gear.id)}">${escapeHtml(gear.name)}（${state.logs.filter((log) => getLogGearIds(log).includes(String(gear.id))).length}）</option>
  `).join("")}<option value="none">未关联装备（${state.logs.filter((log) => !getLogGearIds(log).length).length}）</option>`;
  lureSelect.innerHTML = `<option value="all">全部拟饵（${state.logs.length}）</option>${lures.map((lure) => `
    <option value="${escapeHtml(lure)}">${escapeHtml(lure)}（${state.logs.filter((log) => getLogLureName(log) === lure).length}）</option>
  `).join("")}<option value="none">未记录拟饵（${state.logs.filter((log) => !getLogLureName(log)).length}）</option>`;
  spotSelect.innerHTML = `<option value="all">全部标点（${state.logs.length}）</option>${state.spots.map((spot) => `
    <option value="${escapeHtml(spot.id)}">${escapeHtml(spot.name)}（${state.logs.filter((log) => getLogSpotId(log) === String(spot.id)).length}）</option>
  `).join("")}<option value="none">未关联标点（${state.logs.filter((log) => !getLogSpotId(log)).length}）</option>`;
  speciesSelect.value = activeCatchSpecies;
  gearSelect.value = activeCatchGear;
  lureSelect.value = activeCatchLure;
  spotSelect.value = activeCatchSpot;
  dateFromInput.value = activeCatchDateFrom;
  dateToInput.value = activeCatchDateTo;
}

function getFilteredCatchLogs() {
  return state.logs.filter((log) => {
    const matchesSpecies = activeCatchSpecies === "all" || log.species === activeCatchSpecies;
    const gearIds = getLogGearIds(log);
    const matchesGear = activeCatchGear === "all"
      || (activeCatchGear === "none" ? !gearIds.length : gearIds.includes(activeCatchGear));
    const lure = getLogLureName(log);
    const matchesLure = activeCatchLure === "all"
      || (activeCatchLure === "none" ? !lure : lure === activeCatchLure);
    const spotId = getLogSpotId(log);
    const matchesSpot = activeCatchSpot === "all"
      || (activeCatchSpot === "none" ? !spotId : spotId === activeCatchSpot);
    const sessionId = getLogSessionId(log);
    const matchesSession = activeCatchSession === "all"
      || (activeCatchSession === "none" ? !sessionId : sessionId === activeCatchSession);
    const date = String(log.date || "");
    const matchesStartDate = !activeCatchDateFrom || (date && date >= activeCatchDateFrom);
    const matchesEndDate = !activeCatchDateTo || (date && date <= activeCatchDateTo);
    return matchesSpecies && matchesGear && matchesLure && matchesSpot && matchesSession && matchesStartDate && matchesEndDate;
  });
}

function renderCatchImage(log) {
  const image = String(log.image || getCatchFallbackImage(log.species));
  const alt = escapeHtml(`${log.species || "鱼获"}鱼获照片`);
  if (image.startsWith("/api/log-photos")) {
    return `<img class="private-catch-image" data-private-photo-src="${escapeHtml(image)}" alt="${alt}" aria-busy="true">`;
  }
  return `<img src="${escapeHtml(image)}" alt="${alt}">`;
}

function hydratePrivateCatchImages(root = document) {
  root.querySelectorAll("img[data-private-photo-src]:not([data-private-photo-loading])").forEach((image) => {
    image.dataset.privatePhotoLoading = "true";
    const source = image.dataset.privatePhotoSrc;
    fetch(source, { credentials: "same-origin", cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`photo ${response.status}`);
        return response.blob();
      })
      .then((blob) => {
        if (!blob.size || !image.isConnected) throw new Error("empty photo");
        const objectUrl = URL.createObjectURL(blob);
        image.addEventListener("load", () => URL.revokeObjectURL(objectUrl), { once: true });
        image.src = objectUrl;
        image.classList.add("loaded");
        image.setAttribute("aria-busy", "false");
      })
      .catch(() => {
        image.dataset.privatePhotoLoading = "failed";
      });
  });
}

function renderCatchList(targetId, limit, sourceLogs = state.logs) {
  const target = document.getElementById(targetId);
  if (!target) return;
  const logs = Number.isFinite(limit) ? sourceLogs.slice(0, limit) : sourceLogs;
  if (!logs.length) {
    target.innerHTML = `<div class="empty-state">没有符合条件的鱼获记录。</div>`;
    return;
  }
  target.innerHTML = logs.map((log) => `
    <article class="catch-row" data-catch-id="${log.id}" tabindex="0" role="button" aria-label="查看${log.species}详情">
      ${renderCatchImage(log)}
      <div class="catch-main">
        <div class="catch-primary">
          <strong>${escapeHtml(log.species || "未记录鱼种")}</strong>
          <time>${escapeHtml(formatDate(log))}</time>
        </div>
        <div class="catch-measurements">
          <span>${escapeHtml(formatCatchSize(log.size))}</span>
          <span>${escapeHtml(formatCatchWeight(log.weight))}</span>
        </div>
        <div class="catch-location">
          <span class="material-symbols-rounded">location_on</span>
          <span>${escapeHtml(getLogSpotLabel(log))}</span>
        </div>
        <div class="catch-tags">
          <em>${escapeHtml(formatLure(log))}</em>
          <small>${escapeHtml(getLogGearLabel(log))}</small>
          ${getLogSessionId(log) ? `<small class="catch-session-tag"><span class="material-symbols-rounded">calendar_month</span>${escapeHtml(getLogSessionLabel(log))}</small>` : ""}
        </div>
      </div>
      <span class="material-symbols-rounded row-arrow">chevron_right</span>
    </article>
  `).join("");
  hydratePrivateCatchImages(target);
}

function renderHomeLogs() {
  renderCatchList("home-catch-list", 3);
}

function renderSessionFilterContext() {
  const target = document.getElementById("session-filter-context");
  if (!target) return;
  const isAllSessions = activeCatchSession === "all";
  target.hidden = isAllSessions;
  if (isAllSessions) return;

  const label = activeCatchSession === "none"
    ? "未归档鱼获"
    : getSessionNameById(activeCatchSession);
  const count = activeCatchSession === "none"
    ? state.logs.filter((log) => !getLogSessionId(log)).length
    : state.logs.filter((log) => getLogSessionId(log) === activeCatchSession).length;
  target.innerHTML = `
    <span class="material-symbols-rounded">filter_alt</span>
    <div><small>当前查看</small><strong>${escapeHtml(label)} · ${count} 条鱼获</strong></div>
    <button type="button" data-clear-session-filter aria-label="返回全部鱼获" title="返回全部鱼获">
      <span class="material-symbols-rounded">close</span>
    </button>
  `;
}

function renderAllLogs() {
  renderCatchFilters();
  renderSessionFilterContext();
  renderCatchList("all-catch-list", undefined, HAS_CLOUD_API ? catchPage.logs : getFilteredCatchLogs());
  renderCatchPagination();
}

function renderCatchPagination() {
  const target = document.getElementById("catch-pagination");
  if (!target) return;
  if (!HAS_CLOUD_API) {
    target.innerHTML = "";
    return;
  }
  const shown = catchPage.logs.length;
  const total = Number(catchPage.total || 0);
  if (!total) {
    target.innerHTML = "";
    return;
  }
  target.innerHTML = `
    <small>已显示 ${shown} / ${total} 条鱼获</small>
    ${catchPage.nextCursor ? `<button type="button" data-load-more-catches ${catchPage.loading ? "disabled" : ""}>${catchPage.loading ? "加载中..." : "加载更多"}</button>` : ""}
  `;
}

async function refreshCatchPage(append = false) {
  if (!HAS_CLOUD_API) {
    catchPage = { logs: getFilteredCatchLogs(), total: getFilteredCatchLogs().length, nextCursor: null, loading: false };
    renderAllLogs();
    return;
  }
  if (catchPage.loading) return;
  catchPage.loading = true;
  renderCatchPagination();
  try {
    const data = await apiListLogs(append ? catchPage.nextCursor : null);
    const logs = Array.isArray(data.logs) ? data.logs : [];
    catchPage = {
      logs: append ? [...catchPage.logs, ...logs] : logs,
      total: Number(data.total || 0),
      nextCursor: data.next_cursor || null,
      loading: false
    };
  } catch (error) {
    catchPage.loading = false;
    showToast("鱼获列表加载失败，请稍后重试");
  }
  renderAllLogs();
}

function getAnalyticsYearOptions() {
  return [...new Set(state.logs
    .map((log) => String(log.date || "").match(/^\d{4}/)?.[0])
    .filter(Boolean))]
    .sort((left, right) => right.localeCompare(left));
}

function getAnalyticsLogs() {
  return state.logs.filter((log) => activeAnalyticsYear === "all" || String(log.date || "").startsWith(`${activeAnalyticsYear}-`));
}

function getAnalyticsRanking(logs, getLabel) {
  const buckets = new Map();
  logs.forEach((log) => {
    const label = String(getLabel(log) || "").trim();
    if (!label) return;
    buckets.set(label, (buckets.get(label) || 0) + 1);
  });
  return [...buckets.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "zh-CN"));
}

function getAnalyticsLargest(logs, field, type) {
  return logs.reduce((largest, log) => {
    const value = getNumericMeasurement(log[field], type);
    if (value == null || (largest && largest.value >= value)) return largest;
    return { log, value };
  }, null)?.log || null;
}

function getAnalyticsTimeWindow(log) {
  const match = String(log.time || "").match(/^(\d{1,2}):/);
  if (!match) return "";
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return "";
  if (hour >= 5 && hour < 9) return "早口 05-09";
  if (hour >= 9 && hour < 17) return "日间 09-17";
  if (hour >= 17 && hour < 21) return "晚口 17-21";
  return "夜间 21-05";
}

function getAnalyticsTrend(logs, getKey) {
  const buckets = new Map();
  logs.forEach((log) => {
    const key = getKey(log);
    if (!key) return;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  });
  return [...buckets.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function renderAnalyticsRanking(items, emptyText, limit = 6) {
  if (!items.length) return `<p class="analytics-empty">${escapeHtml(emptyText)}</p>`;
  const max = items[0].count || 1;
  return `<ol class="analytics-ranking">${items.slice(0, limit).map((item, index) => `
    <li>
      <b>${index + 1}</b>
      <span>${escapeHtml(item.label)}</span>
      <i><em style="--rank-width:${Math.max(10, Math.round(item.count / max * 100))}%"></em></i>
      <strong>${item.count}<small> 条</small></strong>
    </li>
  `).join("")}</ol>`;
}

function renderAnalyticsChart(items, emptyText, labelFormatter = (label) => label) {
  if (!items.length) return `<p class="analytics-empty">${escapeHtml(emptyText)}</p>`;
  const max = Math.max(...items.map((item) => item.count), 1);
  return `<div class="analytics-chart-bars">${items.map((item) => `
    <div class="analytics-chart-column" title="${escapeHtml(item.label)}：${item.count} 条">
      <strong>${item.count}</strong>
      <i style="--bar-height:${Math.max(10, Math.round(item.count / max * 100))}%"></i>
      <small>${escapeHtml(labelFormatter(item.label))}</small>
    </div>
  `).join("")}</div>`;
}

async function refreshAnalytics() {
  if (!HAS_CLOUD_API) {
    analyticsState = null;
    renderAnalytics();
    return;
  }
  const requestId = ++analyticsRequestId;
  try {
    const data = await apiGetAnalytics(activeAnalyticsYear);
    if (requestId !== analyticsRequestId) return;
    analyticsState = { year: activeAnalyticsYear, data };
    renderAnalytics();
  } catch (error) {
    if (requestId !== analyticsRequestId) return;
    analyticsState = null;
    renderAnalytics();
    showToast("统计数据暂时不可用，已显示当前已加载记录");
  }
}

function renderAnalytics() {
  const target = document.getElementById("analytics-content");
  const yearSelect = document.getElementById("analytics-year-filter");
  const caption = document.getElementById("analytics-filter-caption");
  if (!target || !yearSelect || !caption) return;

  const remote = analyticsState?.year === activeAnalyticsYear ? analyticsState.data : null;
  const years = Array.isArray(remote?.years) ? remote.years : getAnalyticsYearOptions();
  if (activeAnalyticsYear !== "all" && !years.includes(activeAnalyticsYear)) activeAnalyticsYear = "all";
  yearSelect.innerHTML = `<option value="all">全部时间</option>${years.map((year) => `<option value="${year}">${year} 年</option>`).join("")}`;
  yearSelect.value = activeAnalyticsYear;

  const logs = getAnalyticsLogs();
  const species = remote?.species || getAnalyticsRanking(logs, (log) => log.species);
  const lures = remote?.lures || getAnalyticsRanking(logs, getLogLureName);
  const spots = remote?.spots || getAnalyticsRanking(logs, (log) => getLogSpotId(log) ? getLogSpotLabel(log) : "");
  const gear = remote?.gear || getAnalyticsRanking(logs.flatMap((log) => getLogGearIds(log).map((id) => ({ ...log, analyticsGear: getGearNameById(id) }))), (log) => log.analyticsGear);
  const timeWindows = remote?.time_windows || getAnalyticsRanking(logs, getAnalyticsTimeWindow);
  const largestSize = remote?.largest_size || getAnalyticsLargest(logs, "size", "size");
  const largestWeight = remote?.largest_weight || getAnalyticsLargest(logs, "weight", "weight");
  const relatedSessions = Number(remote?.session_count ?? new Set(logs.map(getLogSessionId).filter(Boolean)).size);
  const hitSpots = Number(remote?.spot_count ?? new Set(logs.map(getLogSpotId).filter(Boolean)).size);
  const monthlyTrend = remote?.monthly_trend || getAnalyticsTrend(logs, (log) => String(log.date || "").match(/^\d{4}-\d{2}/)?.[0]).slice(-12);
  const yearlyTrend = remote?.yearly_trend || getAnalyticsTrend(state.logs, (log) => String(log.date || "").match(/^\d{4}/)?.[0]);
  const periodLabel = activeAnalyticsYear === "all" ? "全部已记录鱼获" : `${activeAnalyticsYear} 年鱼获`;
  const total = Number(remote?.total ?? logs.length);
  caption.textContent = `${periodLabel} · ${total} 条`;

  target.innerHTML = `
    <section class="analytics-hero">
      <div><small>累计鱼获</small><strong>${total}</strong><span>条鱼获记录</span></div>
      <span class="material-symbols-rounded">monitoring</span>
    </section>
    <section class="analytics-kpis" aria-label="核心数据">
      <article><span class="material-symbols-rounded">set_meal</span><small>鱼种</small><strong>${species.length}<i>种</i></strong></article>
      <article><span class="material-symbols-rounded">calendar_month</span><small>钓行</small><strong>${relatedSessions}<i>次</i></strong></article>
      <article><span class="material-symbols-rounded">location_on</span><small>命中标点</small><strong>${hitSpots}<i>个</i></strong></article>
    </section>
    <section class="analytics-section analytics-records">
      <div class="analytics-section-head"><div><small>个人纪录</small><strong>最大尺寸与重量</strong></div><span class="material-symbols-rounded">workspace_premium</span></div>
      <div class="analytics-record-grid">
        <article><small>最大长度</small><strong>${largestSize ? escapeHtml(formatCatchSize(largestSize.size)) : "-"}</strong><span>${largestSize ? escapeHtml(largestSize.species || "未记录鱼种") : "等待第一条记录"}</span></article>
        <article><small>最大重量</small><strong>${largestWeight ? escapeHtml(formatCatchWeight(largestWeight.weight)) : "-"}</strong><span>${largestWeight ? escapeHtml(largestWeight.species || "未记录鱼种") : "等待第一条记录"}</span></article>
      </div>
    </section>
    <section class="analytics-section">
      <div class="analytics-section-head"><div><small>鱼种分布</small><strong>各鱼种上鱼数量</strong></div><span>${species.length} 种</span></div>
      ${renderAnalyticsRanking(species, "还没有可统计的鱼种数据", 10)}
    </section>
    <section class="analytics-section analytics-effective-grid">
      <div class="analytics-section-head"><div><small>有效组合</small><strong>拟饵、标点与装备</strong></div><span class="material-symbols-rounded">insights</span></div>
      <div class="analytics-effective-items">
        <article><small>最有效拟饵</small><strong>${escapeHtml(lures[0]?.label || "暂无数据")}</strong><span>${lures[0] ? `${lures[0].count} 条鱼获` : "记录拟饵后生成"}</span></article>
        <article><small>最佳标点</small><strong>${escapeHtml(spots[0]?.label || "暂无数据")}</strong><span>${spots[0] ? `${spots[0].count} 条鱼获` : "关联标点后生成"}</span></article>
        <article><small>常用上鱼装备</small><strong>${escapeHtml(gear[0]?.label || "暂无数据")}</strong><span>${gear[0] ? `${gear[0].count} 条鱼获` : "关联装备后生成"}</span></article>
        <article><small>最佳时间段</small><strong>${escapeHtml(timeWindows[0]?.label || "暂无数据")}</strong><span>${timeWindows[0] ? `${timeWindows[0].count} 条鱼获` : "记录时间后生成"}</span></article>
      </div>
    </section>
    <section class="analytics-section">
      <div class="analytics-section-head"><div><small>装备命中</small><strong>各装备上鱼次数</strong></div><span>${gear.length} 件</span></div>
      ${renderAnalyticsRanking(gear, "鱼获尚未关联装备", 8)}
    </section>
    <section class="analytics-section">
      <div class="analytics-section-head"><div><small>月度趋势</small><strong>${activeAnalyticsYear === "all" ? "最近 12 个月" : `${activeAnalyticsYear} 年月度鱼获`}</strong></div><span class="material-symbols-rounded">bar_chart</span></div>
      ${renderAnalyticsChart(monthlyTrend, "还没有带日期的鱼获记录", (label) => label.slice(5))}
    </section>
    <section class="analytics-section">
      <div class="analytics-section-head"><div><small>年度趋势</small><strong>累计鱼获对比</strong></div><span class="material-symbols-rounded">timeline</span></div>
      ${renderAnalyticsChart(yearlyTrend, "还没有跨年度的鱼获记录")}
    </section>
  `;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getLogConditionSnapshot(log) {
  if (!log?.condition_snapshot) return null;
  try {
    const snapshot = typeof log.condition_snapshot === "string"
      ? JSON.parse(log.condition_snapshot)
      : log.condition_snapshot;
    return snapshot && typeof snapshot === "object" ? snapshot : null;
  } catch (error) {
    return null;
  }
}

function renderCatchConditionSnapshot(log) {
  const snapshot = getLogConditionSnapshot(log);
  if (!snapshot) return "";

  const location = snapshot.location || {};
  const weather = snapshot.weather || {};
  const source = location.source === "device" ? "手机 GPS" : location.source === "network" ? "网络估算" : "未标注来源";
  const coordinates = Number.isFinite(Number(location.latitude)) && Number.isFinite(Number(location.longitude))
    ? `${Number(location.latitude).toFixed(6)}, ${Number(location.longitude).toFixed(6)}`
    : "未保存坐标";
  const score = Number.isFinite(Number(snapshot.score)) ? `${snapshot.score} 分` : "未记录评分";
  return `
    <section class="catch-condition-snapshot">
      <div class="condition-snapshot-heading">
        <div>
          <small>记录时环境</small>
          <strong>${escapeHtml(score)}</strong>
        </div>
        <span class="material-symbols-rounded">history</span>
      </div>
      <div class="condition-snapshot-grid">
        <div><small>天气</small><strong>${escapeHtml(weather.summary || "未记录")}</strong></div>
        <div><small>温度</small><strong>${escapeHtml(weather.temperature || "未记录")}</strong></div>
        <div><small>风况</small><strong>${escapeHtml(weather.wind || "未记录")}</strong></div>
        <div><small>气压</small><strong>${escapeHtml(weather.pressure || "未记录")}</strong></div>
        <div><small>水温</small><strong>${escapeHtml(weather.water || "未记录")}</strong></div>
        <div><small>定位来源</small><strong>${escapeHtml(source)}</strong></div>
      </div>
      <div class="condition-snapshot-location">
        <span class="material-symbols-rounded">location_on</span>
        <span>${escapeHtml(location.place || "地名未识别")} · ${escapeHtml(coordinates)}</span>
      </div>
    </section>
  `;
}

function getCurrentConditionSnapshot() {
  const snapshot = structuredClone(conditionsState || {});
  snapshot.capturedAt = new Date().toISOString();
  return snapshot;
}

function openCatchDetail(id) {
  const log = state.logs.find((item) => String(item.id) === String(id));
  if (!log || !catchDetailModal) return;

  const species = escapeHtml(log.species || "未记录鱼种");
  catchDetailTitle.textContent = `${log.species || "鱼获"}详情`;
  catchDetailContent.innerHTML = `
    <div class="catch-detail-hero">
      <button class="catch-photo-zoom" type="button" data-open-catch-photo="${escapeHtml(log.id)}" aria-label="放大查看${species}鱼获照片">
        ${renderCatchImage(log)}
        <span class="material-symbols-rounded">zoom_in</span>
      </button>
      <div>
        <strong>${species}</strong>
        <span>${escapeHtml(formatCatchSize(log.size))} · ${escapeHtml(formatCatchWeight(log.weight))}</span>
        <button class="edit-btn catch-detail-edit" type="button" title="编辑鱼获" aria-label="编辑${species}" data-edit-type="log" data-edit-id="${escapeHtml(log.id)}">
          <span class="material-symbols-rounded">edit</span>
          <span>编辑鱼获</span>
        </button>
      </div>
    </div>
    <div class="catch-detail-grid">
      <div><small>时间</small><strong>${escapeHtml(formatDate(log))}</strong></div>
      <div><small>标点</small><strong>${escapeHtml(getLogSpotLabel(log))}</strong></div>
      <div><small>钓行</small><strong>${escapeHtml(getLogSessionLabel(log))}</strong></div>
      <div><small>拟饵</small><strong>${escapeHtml(formatLure(log))}</strong></div>
      <div><small>使用装备</small><strong>${escapeHtml(getLogGearLabel(log))}</strong></div>
    </div>
    ${renderCatchConditionSnapshot(log)}
    <div class="catch-detail-note"><small>备注</small><p>${escapeHtml(log.note || "暂无备注")}</p></div>
    <button class="detail-delete-btn" type="button" data-delete-type="log" data-delete-id="${escapeHtml(log.id)}">
      <span class="material-symbols-rounded">delete</span>
      删除鱼获
    </button>
  `;
  hydratePrivateCatchImages(catchDetailContent);
  catchDetailModal.hidden = false;
}

function closeCatchDetail() {
  if (catchDetailModal) catchDetailModal.hidden = true;
}

function openCatchPhotoViewer(id) {
  const log = state.logs.find((item) => String(item.id) === String(id));
  if (!log || !catchPhotoViewerModal || !catchPhotoViewerContent || !catchPhotoViewerTitle) return;
  catchPhotoViewerContent.innerHTML = renderCatchImage(log);
  catchPhotoViewerTitle.textContent = `${log.species || "鱼获"} · ${formatCatchSize(log.size)} · ${formatCatchWeight(log.weight)}`;
  hydratePrivateCatchImages(catchPhotoViewerContent);
  catchPhotoViewerModal.hidden = false;
}

function closeCatchPhotoViewer() {
  if (catchPhotoViewerModal) catchPhotoViewerModal.hidden = true;
}

function openGearDetail(id) {
  const gear = state.gear.find((item) => String(item.id) === String(id));
  if (!gear || !gearDetailModal) return;

  const category = getGearCategory(gear);
  const visual = getGearVisual(category);
  const logs = [...getGearUsageLogs(gear)].sort((left, right) => getLogDateTime(right).localeCompare(getLogDateTime(left)));
  const speciesCount = new Set(logs.map((log) => log.species).filter(Boolean)).size;
  const latest = logs[0];
  gearDetailTitle.textContent = `${gear.name || "装备"}详情`;
  gearDetailContent.innerHTML = `
    <section class="gear-detail-hero gear-tone-${visual.tone}">
      <div class="gear-card-icon">${renderGearIcon(visual)}</div>
      <div><span class="gear-card-category">${escapeHtml(category)}</span><strong>${escapeHtml(gear.name || "未命名装备")}</strong><small>${escapeHtml(getGearSpecLabel(gear))}</small></div>
    </section>
    <section class="gear-detail-stats">
      <div><small>关联鱼获</small><strong>${logs.length} 条</strong></div>
      <div><small>覆盖鱼种</small><strong>${speciesCount} 种</strong></div>
      <div><small>最近使用</small><strong>${escapeHtml(latest ? formatDate(latest) : "未使用")}</strong></div>
    </section>
    <section class="gear-detail-meta">
      <div><small>${category === "拟饵" ? "可选克数" : "规格"}</small><strong>${escapeHtml(getGearSpecLabel(gear))}</strong></div>
      <div><small>备注</small><strong>${escapeHtml(gear.note || "暂无备注")}</strong></div>
    </section>
    <section class="gear-detail-history">
      <div class="gear-detail-section-head"><strong>最近关联鱼获</strong><span>${logs.length} 条</span></div>
      ${logs.length ? logs.slice(0, 3).map((log) => `
        <button type="button" class="gear-detail-history-row" data-catch-id="${escapeHtml(log.id)}">
          <span class="material-symbols-rounded">set_meal</span>
          <span><strong>${escapeHtml(log.species || "未记录鱼种")}</strong><small>${escapeHtml(formatCatchSize(log.size))} · ${escapeHtml(formatCatchWeight(log.weight))} · ${escapeHtml(formatDate(log))}</small></span>
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      `).join("") : `<p class="gear-detail-empty">暂未关联鱼获，记录鱼获时选择这件装备即可沉淀数据。</p>`}
    </section>
    ${logs.length ? `<button class="gear-detail-view-catches" type="button" data-gear-catches-id="${escapeHtml(gear.id)}" data-gear-catches-category="${escapeHtml(category)}"><span class="material-symbols-rounded">phishing</span>查看全部关联鱼获</button>` : ""}
    <div class="gear-detail-actions">
      <button class="detail-edit-btn" type="button" data-edit-type="gear" data-edit-id="${escapeHtml(gear.id)}"><span class="material-symbols-rounded">edit</span>编辑装备</button>
      <button class="detail-delete-btn" type="button" data-delete-type="gear" data-delete-id="${escapeHtml(gear.id)}"><span class="material-symbols-rounded">delete</span>删除装备</button>
    </div>
  `;
  gearDetailModal.hidden = false;
}

function closeGearDetail() {
  if (gearDetailModal) gearDetailModal.hidden = true;
}

function openLocationDetail() {
  const location = conditionsState.location;
  const hasCoordinates = Number.isFinite(Number(location?.latitude)) && Number.isFinite(Number(location?.longitude));
  if (!hasCoordinates) {
    showToast("请先完成定位，再查看位置详情");
    requestLocationConditions();
    return;
  }

  const accuracy = Number(location.accuracy);
  const source = location.source === "device" ? "手机 GPS" : "网络位置估算";
  locationDetailContent.innerHTML = `
    <div class="location-detail-place">${escapeHtml(location.place || "地名暂未识别")}</div>
    <div class="location-detail-row"><small>纬度</small><strong>${Number(location.latitude).toFixed(6)}°</strong></div>
    <div class="location-detail-row"><small>经度</small><strong>${Number(location.longitude).toFixed(6)}°</strong></div>
    <div class="location-detail-row"><small>定位来源</small><strong>${source}</strong></div>
    <div class="location-detail-row"><small>定位误差</small><strong>${Number.isFinite(accuracy) ? `约 ±${Math.round(accuracy)}m` : "未返回精度"}</strong></div>
    <div class="location-detail-row"><small>时区</small><strong>${escapeHtml(location.timezone || "自动识别")}</strong></div>
  `;
  locationDetailModal.hidden = false;
}

function closeLocationDetail() {
  if (locationDetailModal) locationDetailModal.hidden = true;
}

function formatSpotLocation(spot) {
  const latitude = Number(spot.latitude);
  const longitude = Number(spot.longitude);
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return "未记录 GPS 位置";
  const accuracy = Number(spot.accuracy);
  const accuracyText = Number.isFinite(accuracy) ? ` · GPS ±${Math.round(accuracy)}m` : " · GPS 已定位";
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}${accuracyText}`;
}

function getMostFrequent(values) {
  const counts = new Map();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  const ranked = [...counts.entries()].sort((left, right) => right[1] - left[1] || String(left[0]).localeCompare(String(right[0])));
  return ranked[0] ? { value: ranked[0][0], count: ranked[0][1] } : null;
}

function getSpotTimeBucket(log) {
  const value = String(log.time || "").trim();
  if (!/^\d{1,2}:\d{2}/.test(value)) return "";
  const hour = Number(value.slice(0, 2));
  if (!Number.isFinite(hour)) return "";
  if (hour >= 4 && hour < 8) return "清晨 4-8时";
  if (hour >= 8 && hour < 11) return "上午 8-11时";
  if (hour >= 11 && hour < 15) return "午间 11-15时";
  if (hour >= 15 && hour < 19) return "傍晚 15-19时";
  return "夜间 19-4时";
}

function getSpotIntelligence(spot) {
  const logs = state.logs
    .filter((log) => getLogSpotId(log) === String(spot.id))
    .sort((left, right) => getLogDateTime(right).localeCompare(getLogDateTime(left)));
  const species = [...new Set(logs.map((log) => log.species).filter(Boolean))];
  const topLure = getMostFrequent(logs.map(getLogLureName));
  const topTime = getMostFrequent(logs.map(getSpotTimeBucket));
  const topWeather = getMostFrequent(logs.map((log) => getLogConditionSnapshot(log)?.weather?.summary));
  const maxLength = getLargestSessionCatch(logs, "size", "size");
  const maxWeight = getLargestSessionCatch(logs, "weight", "weight");
  const confidence = logs.length >= 5 ? "样本充足" : logs.length >= 2 ? "持续积累中" : "样本较少";
  return { logs, species, topLure, topTime, topWeather, maxLength, maxWeight, confidence };
}

function getSpotStatus(spot) {
  return spotStatusMeta[spot?.status] ? spot.status : "active";
}

function getSpotStatusMeta(spot) {
  return spotStatusMeta[getSpotStatus(spot)];
}

function getSpotCoordinates(spot) {
  const latitude = Number(spot?.latitude);
  const longitude = Number(spot?.longitude);
  return Number.isFinite(latitude) && Number.isFinite(longitude) ? { latitude, longitude } : null;
}

function getVisibleSpots() {
  return state.spots.filter((spot) => {
    const intelligence = getSpotIntelligence(spot);
    const matchesSpecies = activeSpotSpecies === "all" || intelligence.species.includes(activeSpotSpecies);
    const matchesStatus = activeSpotStatus === "all" || getSpotStatus(spot) === activeSpotStatus;
    return matchesSpecies && matchesStatus;
  });
}

function renderSpotMapControls() {
  const speciesSelect = document.getElementById("spot-map-species-filter");
  const statusSelect = document.getElementById("spot-map-status-filter");
  const count = document.getElementById("spot-map-count");
  const species = [...new Set(state.logs.map((log) => log.species).filter(Boolean))].sort((left, right) => left.localeCompare(right, "zh-CN"));
  if (speciesSelect) {
    speciesSelect.innerHTML = `<option value="all">全部鱼种</option>${species.map((item) => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join("")}`;
    speciesSelect.value = activeSpotSpecies;
  }
  if (statusSelect) {
    statusSelect.innerHTML = `<option value="all">全部状态</option>${Object.entries(spotStatusMeta).map(([value, meta]) => `<option value="${value}">${meta.label}</option>`).join("")}`;
    statusSelect.value = activeSpotStatus;
  }
  if (count) count.textContent = `${getVisibleSpots().length} 个标点`;
}

function groupNearbySpots(spots) {
  const pending = [...spots];
  const groups = [];
  while (pending.length) {
    const seed = pending.shift();
    const seedCoords = getSpotCoordinates(seed);
    const group = [seed];
    for (let index = pending.length - 1; index >= 0; index -= 1) {
      const candidateCoords = getSpotCoordinates(pending[index]);
      if (seedCoords && candidateCoords && Math.abs(seedCoords.latitude - candidateCoords.latitude) < 0.004 && Math.abs(seedCoords.longitude - candidateCoords.longitude) < 0.004) {
        group.push(pending[index]);
        pending.splice(index, 1);
      }
    }
    groups.push(group);
  }
  return groups;
}

function makeSpotMarkerIcon(status, amount = 1) {
  const meta = spotStatusMeta[status] || spotStatusMeta.active;
  const label = amount > 1 ? `<b>${amount}</b>` : `<span class="material-symbols-rounded">${meta.icon}</span>`;
  return window.L.divIcon({
    className: "spot-map-marker-wrap",
    html: `<span class="spot-map-marker spot-map-marker-${status}">${label}</span>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19]
  });
}

function initializeSpotMap() {
  if (!spotMapElement || !window.L || spotMap) return;
  spotMap = window.L.map(spotMapElement, { zoomControl: false, attributionControl: true }).setView([35.8617, 104.1954], 4);
  window.L.control.zoom({ position: "bottomright" }).addTo(spotMap);
  window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
  }).addTo(spotMap);
  spotMarkerLayer = window.L.layerGroup().addTo(spotMap);
}

function getAmapSpotName(spot) {
  return [spot?.name, spot?.water].filter(Boolean).join(" · ") || "路亚标点";
}

function getAmapMarkerUrl(spot) {
  const coords = getSpotCoordinates(spot);
  if (!coords) return "";
  const query = new URLSearchParams({
    position: `${coords.longitude.toFixed(6)},${coords.latitude.toFixed(6)}`,
    name: getAmapSpotName(spot),
    coordinate: "wgs84",
    callnative: "1",
    src: "lure-assistant"
  });
  return `https://uri.amap.com/marker?${query.toString()}`;
}

function isOutsideChina(longitude, latitude) {
  return longitude < 72.004 || longitude > 137.8347 || latitude < 0.8293 || latitude > 55.8271;
}

function transformAmapLatitude(longitude, latitude) {
  let result = -100 + 2 * longitude + 3 * latitude + 0.2 * latitude * latitude + 0.1 * longitude * latitude + 0.2 * Math.sqrt(Math.abs(longitude));
  result += (20 * Math.sin(6 * longitude * Math.PI) + 20 * Math.sin(2 * longitude * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(latitude * Math.PI) + 40 * Math.sin(latitude / 3 * Math.PI)) * 2 / 3;
  return result + (160 * Math.sin(latitude / 12 * Math.PI) + 320 * Math.sin(latitude * Math.PI / 30)) * 2 / 3;
}

function transformAmapLongitude(longitude, latitude) {
  let result = 300 + longitude + 2 * latitude + 0.1 * longitude * longitude + 0.1 * longitude * latitude + 0.1 * Math.sqrt(Math.abs(longitude));
  result += (20 * Math.sin(6 * longitude * Math.PI) + 20 * Math.sin(2 * longitude * Math.PI)) * 2 / 3;
  result += (20 * Math.sin(longitude * Math.PI) + 40 * Math.sin(longitude / 3 * Math.PI)) * 2 / 3;
  return result + (150 * Math.sin(longitude / 12 * Math.PI) + 300 * Math.sin(longitude / 30 * Math.PI)) * 2 / 3;
}

function wgs84ToGcj02(longitude, latitude) {
  if (isOutsideChina(longitude, latitude)) return { longitude, latitude };
  const earthRadius = 6378245.0;
  const eccentricity = 0.00669342162296594323;
  let latitudeOffset = transformAmapLatitude(longitude - 105, latitude - 35);
  let longitudeOffset = transformAmapLongitude(longitude - 105, latitude - 35);
  const latitudeRadians = latitude / 180 * Math.PI;
  let magic = Math.sin(latitudeRadians);
  magic = 1 - eccentricity * magic * magic;
  const magicRoot = Math.sqrt(magic);
  latitudeOffset = (latitudeOffset * 180) / ((earthRadius * (1 - eccentricity)) / (magic * magicRoot) * Math.PI);
  longitudeOffset = (longitudeOffset * 180) / (earthRadius / magicRoot * Math.cos(latitudeRadians) * Math.PI);
  return { longitude: longitude + longitudeOffset, latitude: latitude + latitudeOffset };
}

function getAmapNavigationUrl(spot) {
  const coords = getSpotCoordinates(spot);
  if (!coords) return "";
  const destination = wgs84ToGcj02(coords.longitude, coords.latitude);
  const query = new URLSearchParams({
    to: `${destination.longitude.toFixed(6)},${destination.latitude.toFixed(6)},${getAmapSpotName(spot)}`,
    mode: "car",
    policy: "0",
    callnative: "1",
    src: "lure-assistant"
  });
  return `https://uri.amap.com/navigation?${query.toString()}`;
}

function openAmapUrl(url) {
  if (url) window.location.assign(url);
}

function renderSpotMap(spots) {
  if (!spotMapElement) return;
  const located = spots.filter(getSpotCoordinates);
  const viewable = located.slice(0, 10);
  spotMapElement.innerHTML = `
    <div class="spot-amap-launch">
      <span class="material-symbols-rounded">map</span>
      <div>
        <small>国内地图服务</small>
        <strong>${located.length ? `已准备 ${located.length} 个 GPS 标点` : "当前筛选没有 GPS 标点"}</strong>
        <p>${located.length ? "打开高德地图查看标点，并可直接开始导航" : "编辑标点并使用 GPS 定位后，即可在高德查看"}</p>
      </div>
      <button type="button" data-open-amap-spots${viewable.length ? "" : " disabled"}>
        <span class="material-symbols-rounded">open_in_new</span>高德查看
      </button>
    </div>
  `;
  if (spotMapStatus) spotMapStatus.textContent = located.length > 10
    ? `当前筛选有 ${located.length} 个 GPS 标点；高德单次展示前 10 个，请通过下方标点列表查看其余位置。`
    : located.length
      ? "高德将使用标点名称与保存的 GPS 坐标进行定位。"
      : "没有可打开的 GPS 标点。";
  return;
  if (false) {
  if (!window.L) {
    if (spotMapStatus) spotMapStatus.textContent = "地图组件加载失败，请检查网络后重试";
    return;
  }
  initializeSpotMap();
  if (!spotMap || !spotMarkerLayer) return;
  spotMarkerLayer.clearLayers();
  const located = spots.filter(getSpotCoordinates);
  if (!located.length) {
    if (spotMapStatus) spotMapStatus.textContent = "当前筛选没有带 GPS 的标点，请在编辑标点中补充定位";
    return;
  }

  groupNearbySpots(located).forEach((group) => {
    const anchor = getSpotCoordinates(group[0]);
    const status = getSpotStatus(group[0]);
    const marker = window.L.marker([anchor.latitude, anchor.longitude], { icon: makeSpotMarkerIcon(status, group.length) }).addTo(spotMarkerLayer);
    if (group.length > 1) {
      marker.bindTooltip(`${group.length} 个相近标点`, { direction: "top", offset: [0, -14] });
      marker.on("click", () => {
        const bounds = window.L.latLngBounds(group.map((spot) => {
          const coords = getSpotCoordinates(spot);
          return [coords.latitude, coords.longitude];
        }));
        spotMap.fitBounds(bounds.pad(0.35));
      });
      return;
    }
    const spot = group[0];
    const intelligence = getSpotIntelligence(spot);
    const meta = getSpotStatusMeta(spot);
    marker.bindTooltip(`${escapeHtml(spot.name)} · ${meta.label}`, { direction: "top", offset: [0, -14] });
    marker.on("click", () => openSpotInsight(spot.id));
    marker.on("mouseover", () => marker.openTooltip());
  });

  if (!hasFittedSpotMap) {
    const bounds = window.L.latLngBounds(located.map((spot) => {
      const coords = getSpotCoordinates(spot);
      return [coords.latitude, coords.longitude];
    }));
    spotMap.fitBounds(bounds.pad(0.22), { maxZoom: 14 });
    hasFittedSpotMap = true;
  }
  if (spotMapStatus) spotMapStatus.textContent = `已显示 ${located.length} 个带 GPS 的标点${located.length < spots.length ? `，另有 ${spots.length - located.length} 个待补定位` : ""}`;
  setTimeout(() => spotMap.invalidateSize(), 0);
  }
}

function focusSpotOnMap(id) {
  const spot = state.spots.find((item) => String(item.id) === String(id));
  const coords = getSpotCoordinates(spot);
  if (!spot || !coords) return showToast("该标点还没有 GPS 坐标");
  openAmapUrl(getAmapMarkerUrl(spot));
}

function openSpotInsight(id) {
  const spot = state.spots.find((item) => String(item.id) === String(id));
  if (!spot || !spotInsightModal || !spotInsightTitle || !spotInsightContent) return;
  const intelligence = getSpotIntelligence(spot);
  const { logs, species, topLure, topTime, topWeather, maxLength, maxWeight, confidence } = intelligence;
  const latest = logs[0];
  const statusMeta = getSpotStatusMeta(spot);
  const coordinates = getSpotCoordinates(spot);
  spotInsightTitle.textContent = `${spot.name}洞察`;
  spotInsightContent.innerHTML = `
    <section class="spot-insight-hero">
      <div><small>标点智能化</small><strong>${escapeHtml(spot.water || "未记录水域")}</strong></div>
      <span>${escapeHtml(statusMeta.label)}</span>
    </section>
    <div class="spot-insight-actions">
      ${coordinates ? `<button type="button" data-focus-spot-map="${escapeHtml(spot.id)}"><span class="material-symbols-rounded">map</span>高德定位</button><button type="button" data-spot-navigate="${escapeHtml(spot.id)}"><span class="material-symbols-rounded">navigation</span>高德导航</button>` : `<span><span class="material-symbols-rounded">location_off</span>未记录 GPS，编辑标点后可使用高德定位</span>`}
    </div>
    <section class="spot-insight-stats">
      <div><small>关联鱼获</small><strong>${logs.length}<i>条</i></strong></div>
      <div><small>覆盖鱼种</small><strong>${species.length}<i>种</i></strong></div>
      <div><small>最大长度</small><strong>${escapeHtml(maxLength ? formatCatchSize(maxLength.size) : "-")}</strong></div>
      <div><small>最近记录</small><strong>${escapeHtml(latest ? formatDate(latest) : "-")}</strong></div>
    </section>
    <section class="spot-insight-section">
      <div class="spot-insight-head"><small>有效规律</small><span>基于关联鱼获</span></div>
      <div class="spot-insight-patterns">
        <div><span class="material-symbols-rounded">phishing</span><small>主力拟饵</small><strong>${escapeHtml(topLure?.value || "待积累")}</strong><em>${topLure ? `${topLure.count} 条记录` : "记录鱼获后自动生成"}</em></div>
        <div><span class="material-symbols-rounded">schedule</span><small>高效时段</small><strong>${escapeHtml(topTime?.value || "待积累")}</strong><em>${topTime ? `${topTime.count} 条记录` : "记录出钓时间后自动生成"}</em></div>
        <div><span class="material-symbols-rounded">set_meal</span><small>常见鱼种</small><strong>${escapeHtml(species.length ? species.slice(0, 3).join(" · ") : "待积累")}</strong><em>${species.length ? `共 ${species.length} 种` : "记录鱼获后自动生成"}</em></div>
        <div><span class="material-symbols-rounded">cloud</span><small>常见天气</small><strong>${escapeHtml(topWeather?.value || "待积累")}</strong><em>${topWeather ? `${topWeather.count} 条环境样本` : "需保存带环境的鱼获"}</em></div>
      </div>
    </section>
    <section class="spot-insight-section">
      <div class="spot-insight-head"><small>标点资料</small><span>${escapeHtml(formatSpotLocation(spot))}</span></div>
      <p>${escapeHtml(spot.structure || "未记录结构")}${spot.target ? ` · 目标鱼：${escapeHtml(spot.target)}` : ""}</p>
      <p>${maxWeight ? `最大重量：${escapeHtml(formatCatchWeight(maxWeight.weight))}` : "尚未记录重量数据"}</p>
    </section>
    <section class="spot-insight-section spot-insight-catches">
      <div class="spot-insight-head"><small>关联鱼获</small><button type="button" data-spot-catches-id="${escapeHtml(spot.id)}">查看全部</button></div>
      ${logs.length ? logs.slice(0, 3).map((log) => `<button class="spot-insight-catch" type="button" data-catch-id="${escapeHtml(log.id)}"><span>${escapeHtml(log.species || "鱼获")}</span><small>${escapeHtml(formatCatchSize(log.size))} · ${escapeHtml(formatLure(log))}</small><span class="material-symbols-rounded">chevron_right</span></button>`).join("") : `<p class="spot-insight-empty">该标点还没有关联鱼获。记录鱼获时选择此标点即可形成洞察。</p>`}
    </section>
  `;
  spotInsightModal.hidden = false;
}

function closeSpotInsight() {
  if (spotInsightModal) spotInsightModal.hidden = true;
}

function renderSpots() {
  const target = document.getElementById("spots-list");
  renderSpotMapControls();
  const visibleSpots = getVisibleSpots();
  renderSpotMap(visibleSpots);
  if (!state.spots.length) {
    target.innerHTML = `<div class="empty-state">还没有标点。点击“新增标点”记录第一个点位。</div>`;
    return;
  }
  if (!visibleSpots.length) {
    target.innerHTML = `<div class="empty-state">当前筛选没有符合条件的标点。</div>`;
    return;
  }
  target.innerHTML = visibleSpots.map((spot) => `
    ${(() => {
      const intelligence = getSpotIntelligence(spot);
      const catchCount = intelligence.logs.length;
      const statusMeta = getSpotStatusMeta(spot);
      return `
    <article class="stack-item">
      <div class="stack-item-head">
        <strong>${escapeHtml(spot.name)}</strong><em class="spot-status-badge spot-status-${getSpotStatus(spot)}"><span class="material-symbols-rounded">${statusMeta.icon}</span>${statusMeta.label}</em>
        <div class="spot-item-actions" role="group" aria-label="标点操作">
          <button class="edit-btn" type="button" title="编辑标点" aria-label="编辑标点" data-edit-type="spot" data-edit-id="${escapeHtml(spot.id)}">
            <span class="material-symbols-rounded">edit</span>
          </button>
          <button class="delete-btn" type="button" title="删除标点" aria-label="删除标点" data-delete-type="spot" data-delete-id="${escapeHtml(spot.id)}">
            <span class="material-symbols-rounded">delete</span>
          </button>
        </div>
      </div>
      <span>${escapeHtml(spot.water || "未记录水域")} · ${escapeHtml(spot.structure || "未记录结构")}</span>
      <small>目标鱼：${escapeHtml(spot.target || "未设置")}${spot.note ? ` · ${escapeHtml(spot.note)}` : ""}</small>
      <small class="spot-location">${formatSpotLocation(spot)}</small>
      <div class="spot-intelligence-strip"><span><span class="material-symbols-rounded">phishing</span>${escapeHtml(intelligence.topLure?.value || "待积累拟饵")}</span><span><span class="material-symbols-rounded">schedule</span>${escapeHtml(intelligence.topTime?.value || "待积累时段")}</span></div>
      <div class="spot-card-actions">
        <button class="spot-insight-btn" type="button" data-open-spot-insight="${escapeHtml(spot.id)}"><span class="material-symbols-rounded">insights</span>标点洞察</button>
        <button class="spot-catches-btn" type="button" data-spot-catches-id="${escapeHtml(spot.id)}"><span class="material-symbols-rounded">phishing</span>${catchCount} 条鱼获</button>
      </div>
    </article>
      `;
    })()}
  `).join("");
}

function renderGear() {
  const filterTarget = document.getElementById("gear-filters");
  const target = document.getElementById("gear-list");
  const categories = getGearCategories();
  if (!categories.includes(activeGearCategory)) activeGearCategory = "全部";

  if (filterTarget) {
    const counts = state.gear.reduce((result, gear) => {
      const category = getGearCategory(gear);
      result[category] = (result[category] || 0) + 1;
      return result;
    }, {});
    filterTarget.innerHTML = categories.map((category) => `
      <button class="gear-filter${category === activeGearCategory ? " active" : ""}" type="button" role="tab" aria-selected="${category === activeGearCategory}" data-gear-category="${category}">
        <span>${category}</span><b>${category === "全部" ? state.gear.length : counts[category] || 0}</b>
      </button>
    `).join("");
  }

  if (activeGearCategory === "拟饵") {
    renderLureLibrary(target);
    return;
  }

  if (!state.gear.length) {
    target.innerHTML = `<div class="empty-state">还没有装备。点击“添加装备”建立装备库。</div>`;
    return;
  }
  const visibleGear = activeGearCategory === "全部"
    ? state.gear
    : state.gear.filter((gear) => getGearCategory(gear) === activeGearCategory);

  if (!visibleGear.length) {
    target.innerHTML = `<div class="empty-state">这个分类还没有装备。</div>`;
    return;
  }

  target.innerHTML = `<div class="gear-card-grid">${visibleGear.map(renderGearCard).join("")}</div>`;
}

function getGearUsageLogs(gear) {
  return getGearCategory(gear) === "拟饵"
    ? getLureProfileLogs(gear.name)
    : state.logs.filter((log) => getLogGearIds(log).includes(String(gear.id)));
}

function getGearSpecLabel(gear) {
  if (getGearCategory(gear) === "拟饵") return gear.weight_options || gear.spec || "未设置克数";
  return gear.spec || "未记录规格";
}

function renderGearCard(gear) {
  const category = getGearCategory(gear);
  const visual = getGearVisual(category);
  const logs = getGearUsageLogs(gear);
  const latest = [...logs].sort((left, right) => getLogDateTime(right).localeCompare(getLogDateTime(left)))[0];
  const speciesCount = new Set(logs.map((log) => log.species).filter(Boolean)).size;
  return `
    <article class="gear-card gear-tone-${visual.tone}" data-gear-id="${escapeHtml(gear.id)}" tabindex="0" role="button" aria-label="查看${escapeHtml(gear.name)}详情">
      <div class="gear-card-icon">${renderGearIcon(visual)}</div>
      <div class="gear-card-main">
        <div class="gear-card-top">
          <span class="gear-card-category">${escapeHtml(category)}</span>
          <span class="gear-card-count">${logs.length} 条鱼获</span>
        </div>
        <strong>${escapeHtml(gear.name)}</strong>
        <span class="gear-card-spec">${escapeHtml(getGearSpecLabel(gear))}</span>
        <div class="gear-card-meta">
          <span><span class="material-symbols-rounded">set_meal</span>${speciesCount ? `${speciesCount} 种目标鱼` : "尚无鱼获关联"}</span>
          <span><span class="material-symbols-rounded">schedule</span>${escapeHtml(latest ? formatDate(latest) : "尚未使用")}</span>
        </div>
      </div>
      <span class="material-symbols-rounded gear-card-arrow">chevron_right</span>
    </article>
  `;
}

function getLureProfileLogs(lureName) {
  return state.logs.filter((log) => getLogLureName(log) === lureName);
}

function getLureLibraryItems() {
  const seen = new Set();
  const items = getLureGearList().map((gear) => {
    seen.add(gear.name);
    return { name: gear.name, gear, historical: false };
  });

  state.logs.map(getLogLureName).filter(Boolean).forEach((name) => {
    if (seen.has(name)) return;
    seen.add(name);
    items.push({ name, gear: null, historical: true });
  });

  return items.sort((left, right) => {
    const countDelta = getLureProfileLogs(right.name).length - getLureProfileLogs(left.name).length;
    return countDelta || left.name.localeCompare(right.name, "zh-CN");
  });
}

function renderLureLibrary(target) {
  const items = getLureLibraryItems();
  const usedLogs = state.logs.filter((log) => getLogLureName(log));
  const speciesCount = new Set(usedLogs.map((log) => log.species).filter(Boolean)).size;

  if (!items.length) {
    target.innerHTML = `<div class="empty-state">还没有拟饵档案。添加拟饵后，后续鱼获会自动沉淀为使用记录。</div>`;
    return;
  }

  target.innerHTML = `
    <section class="lure-library-summary">
      <div><small>拟饵档案</small><strong>${items.length} 个</strong></div>
      <div><small>关联鱼获</small><strong>${usedLogs.length} 条</strong></div>
      <div><small>覆盖鱼种</small><strong>${speciesCount} 种</strong></div>
    </section>
    <div class="gear-card-grid">
      ${items.map((item) => {
        if (item.gear) return renderGearCard(item.gear);
        const logs = getLureProfileLogs(item.name);
        const species = new Set(logs.map((log) => log.species).filter(Boolean)).size;
        const latest = [...logs].sort((left, right) => getLogDateTime(right).localeCompare(getLogDateTime(left)))[0];
        const weights = [...new Set(logs.map(getLogLureWeight).filter(Boolean))].join(" · ");
        return `
          <article class="gear-card gear-tone-lure gear-card-history" data-lure-catches-name="${escapeHtml(item.name)}" tabindex="0" role="button" aria-label="查看${escapeHtml(item.name)}鱼获">
            <div class="gear-card-icon"><span class="material-symbols-rounded">phishing</span></div>
            <div class="gear-card-main">
              <div class="gear-card-top"><span class="gear-card-category">历史拟饵</span><span class="gear-card-count">${logs.length} 条鱼获</span></div>
              <strong>${escapeHtml(item.name)}</strong>
              <span class="gear-card-spec">${escapeHtml(weights || "未设置克数")}</span>
              <div class="gear-card-meta"><span><span class="material-symbols-rounded">set_meal</span>${species ? `${species} 种目标鱼` : "尚无鱼获关联"}</span><span><span class="material-symbols-rounded">schedule</span>${escapeHtml(latest ? formatDate(latest) : "尚未使用")}</span></div>
            </div>
            <span class="material-symbols-rounded gear-card-arrow">chevron_right</span>
          </article>
        `;
      }).join("")}
    </div>
  `;
}

function formatSessionTime(value) {
  const text = String(value || "").trim();
  return text ? text.replace("T", " ") : "未记录时间";
}

function getSessionLogs(sessionId) {
  return state.logs
    .filter((log) => getLogSessionId(log) === String(sessionId))
    .sort((left, right) => getLogDateTime(right).localeCompare(getLogDateTime(left)));
}

function getNumericMeasurement(value, type) {
  const text = String(value || "").trim().toLowerCase();
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return null;
  if (type === "weight" && (/(?:^|\d)g\b|克/.test(text)) && !/(?:kg|千克|公斤)/.test(text)) return number / 1000;
  if (type === "size" && /(?:^|\d)m\b|米/.test(text) && !/(?:cm|厘米)/.test(text)) return number * 100;
  return number;
}

function getLargestSessionCatch(logs, field, type) {
  return logs.reduce((largest, log) => {
    const next = getNumericMeasurement(log[field], type);
    if (next == null) return largest;
    if (!largest || next > largest.value) return { log, value: next };
    return largest;
  }, null)?.log || null;
}

function getSessionDuration(session) {
  const start = Date.parse(session.started_at || "");
  const end = Date.parse(session.ended_at || "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return "未记录";
  const minutes = Math.round((end - start) / 60000);
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ""}`;
}

function getSessionOutcomeLabel(outcome) {
  return ({ hit: "判断命中", partial: "部分命中", miss: "未命中", pending: "待复盘" })[outcome] || "待复盘";
}

function getSessionComparison(score, catchCount) {
  if (!Number.isFinite(Number(score))) return "未保存当时预测评分";
  if (!catchCount) return "暂无鱼获，需结合现场情况复盘";
  const prediction = Number(score) >= 75 ? 3 : Number(score) >= 55 ? 2 : 1;
  const actual = catchCount >= 3 ? 3 : 2;
  if (prediction === actual) return "预测与实际鱼获表现基本一致";
  return prediction > actual ? "实际鱼获低于预测，建议补充现场变化" : "实际鱼获优于预测，本次窗口表现更好";
}

function getSessionSnapshot(session, logs) {
  return getLogConditionSnapshot(session) || getLogConditionSnapshot(logs[0]) || null;
}

function renderSessionReview(session) {
  const logs = getSessionLogs(session.id);
  const snapshot = getSessionSnapshot(session, logs);
  const score = Number.isFinite(Number(session.condition_score)) ? Number(session.condition_score) : Number(snapshot?.score);
  const species = [...new Set(logs.map((log) => log.species).filter(Boolean))];
  const gear = [...new Set(logs.map(getLogGearLabel).filter((label) => label && label !== "未关联装备"))];
  const maxLength = getLargestSessionCatch(logs, "size", "size");
  const maxWeight = getLargestSessionCatch(logs, "weight", "weight");
  const outcome = ["hit", "partial", "miss"].includes(session.outcome) ? session.outcome : "pending";
  const weather = snapshot?.weather || {};
  const spotName = session.spot_id ? getSpotNameById(session.spot_id) : "未关联标点";
  const recent = logs.slice(0, 3);

  sessionReviewContent.innerHTML = `
    <section class="session-review-hero">
      <div><small>钓行复盘</small><strong>${escapeHtml(formatSessionTime(session.started_at || session.created_at))}</strong></div>
      <span><span class="material-symbols-rounded">location_on</span>${escapeHtml(spotName)}</span>
    </section>
    <section class="session-review-score">
      <div><small>当时钓况评分</small><strong>${Number.isFinite(score) ? `${score}<i>分</i>` : "未记录"}</strong></div>
      <div><small>复盘结论</small><strong class="session-outcome-label">${escapeHtml(getSessionOutcomeLabel(outcome))}</strong><p>${escapeHtml(getSessionComparison(score, logs.length))}</p></div>
    </section>
    <section class="session-review-stats">
      <div><small>出钓时长</small><strong>${escapeHtml(getSessionDuration(session))}</strong></div>
      <div><small>鱼获</small><strong>${logs.length} 条</strong></div>
      <div><small>鱼种</small><strong>${species.length} 种</strong></div>
      <div><small>最大长度</small><strong>${escapeHtml(maxLength ? formatCatchSize(maxLength.size) : "未记录")}</strong></div>
    </section>
    <section class="session-review-section">
      <div class="session-review-section-head"><small>本次表现</small><span>${maxWeight ? `最大重量 ${escapeHtml(formatCatchWeight(maxWeight.weight))}` : "暂无重量记录"}</span></div>
      <p>${escapeHtml(species.length ? `鱼种：${species.join(" · ")}` : "尚未记录鱼获")}</p>
      <p>${escapeHtml(gear.length ? `装备：${gear.join(" · ")}` : "尚未关联装备")}</p>
    </section>
    <section class="session-review-section">
      <div class="session-review-section-head"><small>环境回看</small><span>${escapeHtml(weather.summary || "未保存天气")}</span></div>
      <p>${escapeHtml([weather.temperature, weather.wind, weather.pressure, weather.water].filter(Boolean).join(" · ") || "未保存环境快照")}</p>
    </section>
    <section class="session-review-section session-review-assessment">
      <div class="session-review-section-head"><small>判断结果</small><span>可按实际情况标记</span></div>
      <div class="session-review-outcomes" role="radiogroup" aria-label="钓行判断结果">
        ${[["hit", "命中"], ["partial", "部分命中"], ["miss", "未命中"]].map(([value, label]) => `<button type="button" role="radio" aria-checked="${outcome === value}" class="${outcome === value ? "active" : ""}" data-session-review-outcome="${value}">${label}</button>`).join("")}
      </div>
      <label class="session-review-note"><span>复盘备注</span><textarea id="session-review-note" maxlength="500" placeholder="记录窗口、标点、操作或后续调整">${escapeHtml(session.review_note || "")}</textarea></label>
      <button class="session-review-save" type="button" data-save-session-review="${escapeHtml(session.id)}"><span class="material-symbols-rounded">save</span>保存复盘</button>
    </section>
    <section class="session-review-section session-review-catches">
      <div class="session-review-section-head"><small>本次鱼获</small><button type="button" data-session-catches-id="${escapeHtml(session.id)}">查看全部</button></div>
      ${recent.length ? recent.map((log) => `<button class="session-review-catch" type="button" data-catch-id="${escapeHtml(log.id)}"><span>${escapeHtml(log.species || "鱼获")}</span><small>${escapeHtml(formatCatchSize(log.size))} · ${escapeHtml(formatCatchWeight(log.weight))}</small><span class="material-symbols-rounded">chevron_right</span></button>`).join("") : `<p class="session-review-empty">本次还没有记录鱼获。</p>`}
    </section>
  `;
}

function openSessionReview(id) {
  const session = state.sessions.find((item) => String(item.id) === String(id));
  if (!session || !sessionReviewModal || !sessionReviewTitle || !sessionReviewContent) return;
  sessionReviewTitle.textContent = session.name || "钓行复盘";
  sessionReviewModal.dataset.sessionId = String(session.id);
  sessionReviewModal.dataset.outcome = ["hit", "partial", "miss"].includes(session.outcome) ? session.outcome : "pending";
  renderSessionReview(session);
  sessionReviewModal.hidden = false;
}

function closeSessionReview() {
  if (sessionReviewModal) sessionReviewModal.hidden = true;
}

function renderSessions() {
  const target = document.getElementById("session-list");
  if (!target) return;
  if (!state.sessions.length) {
    target.innerHTML = `<div class="session-empty"><span class="material-symbols-rounded">calendar_add_on</span><div><strong>先新建一次钓行</strong><small>鱼获会作为该次出钓的子记录保存。</small></div></div>`;
    return;
  }

  target.innerHTML = state.sessions.map((session) => {
    const catchCount = state.logs.filter((log) => getLogSessionId(log) === String(session.id)).length;
    const spotName = session.spot_id ? getSpotNameById(session.spot_id) : "未关联标点";
    const timeLabel = session.started_at ? formatSessionTime(session.started_at) : "未记录时间";
    const isActive = activeCatchSession === String(session.id);
    return `
      <article class="session-history-card${isActive ? " active" : ""}">
        <div class="session-card-top">
          <time>${escapeHtml(timeLabel)}</time>
          <span><b>${catchCount}</b> 条鱼获</span>
        </div>
        <strong>${escapeHtml(session.name)}</strong>
        <small class="session-card-spot"><span class="material-symbols-rounded">location_on</span>${escapeHtml(spotName)}</small>
        <div class="session-card-actions">
          <button class="session-view-btn" type="button" data-open-session-review="${escapeHtml(session.id)}">
            <span class="material-symbols-rounded">insights</span>
            钓行复盘
          </button>
          <button class="session-add-catch-btn" type="button" data-session-add-log-id="${escapeHtml(session.id)}">
            <span class="material-symbols-rounded">add</span>
            记录鱼获
          </button>
        </div>
        <div class="session-card-manage">
          <button type="button" title="编辑钓行" aria-label="编辑钓行" data-edit-type="session" data-edit-id="${escapeHtml(session.id)}">编辑</button>
          <button type="button" title="删除钓行" aria-label="删除钓行" data-delete-type="session" data-delete-id="${escapeHtml(session.id)}">删除</button>
        </div>
      </article>
    `;
  }).join("") + (() => {
    const unassignedCount = state.logs.filter((log) => !getLogSessionId(log)).length;
    if (!unassignedCount) return "";
    return `
      <article class="session-history-card session-unassigned${activeCatchSession === "none" ? " active" : ""}">
        <div class="session-card-top"><time>历史整理</time><span><b>${unassignedCount}</b> 条鱼获</span></div>
        <strong>未归档鱼获</strong>
        <small class="session-card-spot"><span class="material-symbols-rounded">inventory_2</span>尚未关联到具体钓行</small>
        <div class="session-card-actions">
          <button class="session-view-btn" type="button" data-session-catches-id="none">
            <span class="material-symbols-rounded">visibility</span>
            查看鱼获
          </button>
        </div>
      </article>
    `;
  })();
}

function getSessionArchiveDate(session) {
  const value = String(session.started_at || session.created_at || "");
  const match = value.match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function getArchiveSessions() {
  return state.sessions.filter((session) => {
    const date = getSessionArchiveDate(session);
    const matchesYear = activeSessionArchiveYear === "all" || date.startsWith(`${activeSessionArchiveYear}-`);
    const matchesMonth = activeSessionArchiveMonth === "all" || date.slice(5, 7) === activeSessionArchiveMonth;
    const matchesDate = !activeSessionArchiveDate || date === activeSessionArchiveDate;
    return matchesYear && matchesMonth && matchesDate;
  });
}

function renderSessionArchive() {
  if (!sessionArchiveStats || !sessionArchiveList) return;
  const yearSelect = document.getElementById("session-archive-year");
  const monthSelect = document.getElementById("session-archive-month");
  const dateInput = document.getElementById("session-archive-date");
  const sessionDates = state.sessions.map(getSessionArchiveDate).filter(Boolean);
  const years = [...new Set(sessionDates.map((date) => date.slice(0, 4)))].sort((left, right) => right.localeCompare(left));
  if (activeSessionArchiveYear !== "all" && !years.includes(activeSessionArchiveYear)) activeSessionArchiveYear = "all";
  if (yearSelect) {
    yearSelect.innerHTML = `<option value="all">全部年份</option>${years.map((year) => `<option value="${year}">${year} 年</option>`).join("")}`;
    yearSelect.value = activeSessionArchiveYear;
  }
  if (monthSelect) {
    monthSelect.innerHTML = `<option value="all">全部月份</option>${Array.from({ length: 12 }, (_, index) => {
      const month = String(index + 1).padStart(2, "0");
      return `<option value="${month}">${Number(month)} 月</option>`;
    }).join("")}`;
    monthSelect.value = activeSessionArchiveMonth;
  }
  if (dateInput) dateInput.value = activeSessionArchiveDate;

  const sessions = getArchiveSessions();
  const sessionIds = new Set(sessions.map((session) => String(session.id)));
  const catches = state.logs.filter((log) => sessionIds.has(getLogSessionId(log)));
  const days = new Set(sessions.map(getSessionArchiveDate).filter(Boolean));
  const spots = new Set(sessions.map((session) => String(session.spot_id || "")).filter(Boolean));
  sessionArchiveStats.innerHTML = `
    <div><small>钓行</small><strong>${sessions.length}</strong></div>
    <div><small>鱼获</small><strong>${catches.length}</strong></div>
    <div><small>出钓天数</small><strong>${days.size}</strong></div>
    <div><small>标点</small><strong>${spots.size}</strong></div>
  `;

  if (!sessions.length) {
    sessionArchiveList.innerHTML = `<div class="empty-state">该时间范围内还没有钓行记录。</div>`;
    return;
  }

  sessionArchiveList.innerHTML = sessions.map((session) => {
    const catchCount = state.logs.filter((log) => getLogSessionId(log) === String(session.id)).length;
    const spotName = session.spot_id ? getSpotNameById(session.spot_id) : "未关联标点";
    const start = formatSessionTime(session.started_at || session.created_at);
    const end = session.ended_at ? formatSessionTime(session.ended_at) : "未记录结束时间";
    return `
      <article class="session-archive-item">
        <div class="session-archive-item-head"><time>${escapeHtml(start)}</time><em>${catchCount} 条鱼获</em></div>
        <strong>${escapeHtml(session.name)}</strong>
        <small><span class="material-symbols-rounded">location_on</span>${escapeHtml(spotName)}</small>
        <p>${escapeHtml(end)}${session.note ? ` · ${escapeHtml(session.note)}` : ""}</p>
        <button type="button" data-open-session-review="${escapeHtml(session.id)}">
          打开钓行复盘
          <span class="material-symbols-rounded">chevron_right</span>
        </button>
      </article>
    `;
  }).join("");
}

function openSessionArchive() {
  if (!sessionArchiveModal) return;
  renderSessionArchive();
  sessionArchiveModal.hidden = false;
}

function closeSessionArchive() {
  if (sessionArchiveModal) sessionArchiveModal.hidden = true;
}

function renderAll() {
  renderHomeLogs();
  renderAllLogs();
  renderSessions();
  renderSpots();
  renderAnalytics();
  renderGear();
}

function showView(view) {
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === view);
  });
  const bottomNav = document.querySelector(".bottom-nav");
  const tabIndex = ["today", "spots", "catches", "analytics", "gear"].indexOf(view);
  if (bottomNav && tabIndex >= 0) {
    bottomNav.style.setProperty("--active-left", `calc(${tabIndex * 20 + 10}% - 23px)`);
  }

  const isToday = view === "today";
  document.querySelectorAll(".home-section").forEach((section) => {
    section.hidden = !isToday;
  });
  document.querySelectorAll(".page-view").forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });

  if (view === "catches") refreshCatchPage(false);
  if (view === "analytics") refreshAnalytics();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function populateModalForm(type, record) {
  const setField = (name, value) => {
    const field = form.elements.namedItem(name);
    if (field) field.value = value ?? "";
  };

  if (type === "log") {
    const species = knownSpecies.includes(record.species) ? record.species : "__other__";
    setField("species", species);
    setField("species_custom", species === "__other__" ? record.species : "");
    setField("logged_at", getLogDateTime(record));
    setField("size", record.length_cm ?? parseCatchMeasurement(record.size, "length"));
    setField("weight", record.weight_g ?? parseCatchMeasurement(record.weight, "weight"));
    setField("spot_id", getLogSpotId(record));
    setField("spot", record.spot);
    setField("session_id", getLogSessionId(record));
    setField("lure_name", getLogLureName(record));
    setField("lure_weight", getLogLureWeight(record));
    setField("rod_id", record.rod_id || (getGearCategory(state.gear.find((gear) => String(gear.id) === getLogGearId(record)) || {}) === "钓竿" ? getLogGearId(record) : ""));
    setField("reel_id", record.reel_id || (getGearCategory(state.gear.find((gear) => String(gear.id) === getLogGearId(record)) || {}) === "渔轮" ? getLogGearId(record) : ""));
    setField("note", record.note);
  }

  if (type === "session") {
    setField("name", record.name);
    setField("started_at", record.started_at);
    setField("ended_at", record.ended_at);
    setField("spot_id", record.spot_id);
    setField("note", record.note);
  }

  if (type === "spot") {
    setField("name", record.name);
    setField("water", record.water);
    setField("structure", record.structure);
    setField("latitude", record.latitude);
    setField("longitude", record.longitude);
    setField("accuracy", record.accuracy);
    setField("target", record.target);
    setField("note", record.note);
    setField("status", getSpotStatus(record));
    const status = form.querySelector("[data-spot-location-status]");
    const accuracy = Number(record.accuracy);
    if (status && Number.isFinite(Number(record.latitude)) && Number.isFinite(Number(record.longitude))) {
      status.textContent = Number.isFinite(accuracy) ? `已定位 · 误差约 ±${Math.round(accuracy)}m` : "已定位";
      status.classList.add("location-ready");
    }
  }

  if (type === "gear") {
    setField("name", record.name);
    setField("type", record.type);
    setField("spec", record.spec);
    setField("weight_options", record.weight_options);
    setField("note", record.note);
  }
}

function openModal(type, record = null, returnView = "", defaults = {}) {
  const boundSessionId = !record && type === "log" ? String(defaults.session_id || "") : "";
  const logPhotoField = `
    <div class="form-field catch-photo-field">
      <span>鱼获照片</span>
      <span class="catch-photo-actions">
        <label class="catch-photo-button camera"><span class="material-symbols-rounded">photo_camera</span>拍照<input name="catch_photo_camera" type="file" accept="image/jpeg,image/png,image/webp" capture="environment" data-catch-photo-input hidden></label>
        <label class="catch-photo-button gallery"><span class="material-symbols-rounded">photo_library</span>从相册选择<input name="catch_photo_file" type="file" accept="image/jpeg,image/png,image/webp" data-catch-photo-input hidden></label>
      </span>
      <small data-catch-photo-status>${record?.photo_id ? "已保存实拍图。重新选择照片将替换原图。" : "可拍照或从相册选择，保存时自动压缩后上传。"}</small>
    </div>
    ${record?.photo_id ? `<label class="photo-remove-option"><input name="remove_photo" type="checkbox">删除已保存照片，恢复鱼种示意图</label>` : ""}
  `;
  const defaultLogDateTime = record ? getLogDateTime(record) : getDefaultDateTime();
  const sessionField = boundSessionId
    ? `<div class="form-field session-bound-field"><span>所属钓行</span><strong><span class="material-symbols-rounded">calendar_month</span>${escapeHtml(getSessionNameById(boundSessionId))}</strong><input type="hidden" name="session_id" value="${escapeHtml(boundSessionId)}"></div>`
    : `<label class="form-field"><span>关联钓行</span><select name="session_id">${getSessionSelectOptions(record ? getLogSessionId(record) : "")}</select></label>`;
  const configs = {
    log: {
      title: "记录钓况",
      submit: "保存钓况",
      fields: `
        <div class="field-grid">
          <label class="form-field"><span>鱼种</span><select name="species" required>${getSpeciesOptions()}</select></label>
          <label class="form-field"><span>日期和时间</span><button class="log-datetime-trigger" type="button" data-open-log-datetime><span class="material-symbols-rounded">calendar_month</span><strong data-log-datetime-display>${formatLogDateTimeField(defaultLogDateTime)}</strong><span class="material-symbols-rounded">expand_more</span></button><input name="logged_at" type="hidden" value="${defaultLogDateTime}"></label>
        </div>
        <label class="form-field" data-species-custom-field hidden><span>其他鱼种名称</span><input name="species_custom" placeholder="请输入鱼种名称"></label>
        <div class="field-grid">
          <label class="form-field"><span>长度</span><span class="measurement-input"><input name="size" type="number" inputmode="decimal" min="0" step="0.1" placeholder="40"><b>cm</b></span></label>
          <label class="form-field"><span>重量</span><span class="measurement-input"><input name="weight" type="number" inputmode="decimal" min="0" step="0.1" placeholder="750"><b>g</b></span></label>
        </div>
        <label class="form-field"><span>关联标点</span><select name="spot_id">${getSpotSelectOptions()}</select></label>
        ${sessionField}
        <label class="form-field"><span>标点补充说明</span><input name="spot" placeholder="未在标点库时可填写位置"></label>
        <div class="field-grid">
          <label class="form-field"><span>拟饵名称</span><select name="lure_name">${getLureSelectOptions()}</select></label>
          <label class="form-field"><span>克数</span><select name="lure_weight"></select></label>
        </div>
        <div class="field-grid">
          <label class="form-field"><span>钓竿</span><select name="rod_id">${getGearSelectOptions("", "钓竿")}</select></label>
          <label class="form-field"><span>渔轮</span><select name="reel_id">${getGearSelectOptions("", "渔轮")}</select></label>
        </div>
        ${logPhotoField}
        <label class="form-field"><span>备注</span><textarea name="note" placeholder="窗口期、咬口、手法、天气变化"></textarea></label>
      `
    },
    session: {
      title: "新建钓行",
      submit: "保存钓行",
      fields: `
        <label class="form-field"><span>钓行名称</span><input name="name" required value="${getDefaultSessionName()}" placeholder="2026-07-13 南湖晚场"></label>
        <div class="field-grid">
          <label class="form-field"><span>开始时间</span><input name="started_at" type="datetime-local" step="900" required value="${getDefaultDateTime()}"></label>
          <label class="form-field"><span>结束时间</span><input name="ended_at" type="datetime-local" step="900"></label>
        </div>
        <label class="form-field"><span>关联标点</span><select name="spot_id">${getSpotSelectOptions()}</select></label>
        <label class="form-field"><span>钓行备注</span><textarea name="note" placeholder="天气、同行人员、路线和整体情况"></textarea></label>
      `
    },
    spot: {
      title: "新增标点",
      submit: "保存标点",
      fields: `
        <label class="form-field"><span>标点名称</span><input name="name" required placeholder="南湖公园标点"></label>
        <label class="form-field"><span>水域位置</span><input name="water" placeholder="东岸浅滩 / 大坝左侧"></label>
        <label class="form-field"><span>结构</span><input name="structure" placeholder="草边、乱石、桥墩、回水"></label>
        <label class="form-field"><span>标点状态</span><select name="status"><option value="active">高概率</option><option value="seasonal">季节性</option><option value="closed">暂不开放</option></select></label>
        <div class="spot-location-field">
          <button class="location-btn" type="button" data-use-spot-location>
            <span class="material-symbols-rounded">my_location</span>
            <span>使用当前 GPS</span>
          </button>
          <small data-spot-location-status aria-live="polite">未获取位置</small>
          <input type="hidden" name="latitude">
          <input type="hidden" name="longitude">
          <input type="hidden" name="accuracy">
        </div>
        <label class="form-field"><span>目标鱼</span><input name="target" placeholder="黑鱼 / 翘嘴 / 鳜鱼"></label>
        <label class="form-field"><span>备注</span><textarea name="note" placeholder="停车、窗口期、危险点、历史鱼获"></textarea></label>
      `
    },
    gear: {
      title: "添加装备",
      submit: "保存装备",
      fields: `
        <label class="form-field"><span>装备名称</span><input name="name" required placeholder="米诺 110SP"></label>
        <div class="field-grid">
          <label class="form-field"><span>分类</span><select name="type"><option>拟饵</option><option>钓竿</option><option>渔轮</option><option>线组</option><option>配件</option></select></label>
          <label class="form-field" data-gear-spec-field><span>规格</span><input name="spec" placeholder=""></label>
        </div>
        <label class="form-field" data-gear-weight-field><span>可选克数</span><input name="weight_options" placeholder="7g, 10g, 14g"></label>
        <label class="form-field"><span>备注</span><textarea name="note" placeholder="适用鱼种、场景、搭配线组"></textarea></label>
      `
    }
  };

  const config = configs[type];
  modalTitle.textContent = record
    ? `编辑${type === "log" ? "鱼获" : type === "spot" ? "标点" : type === "session" ? "钓行" : "装备"}`
    : config.title;
  form.dataset.type = type;
  if (returnView) form.dataset.returnView = returnView;
  else delete form.dataset.returnView;
  if (record) form.dataset.id = record.id;
  else delete form.dataset.id;
  form.innerHTML = `${config.fields}<button class="submit-btn" type="submit">${record ? "保存修改" : config.submit}</button>`;
  modal.hidden = false;
  form.querySelector("[data-use-spot-location]")?.addEventListener("click", requestSpotLocation);
  form.querySelector("[data-open-log-datetime]")?.addEventListener("click", openLogDateTimePicker);
  form.querySelector('[name="species"]')?.addEventListener("change", updateSpeciesFieldVisibility);
  form.querySelector('[name="lure_name"]')?.addEventListener("change", () => updateLureWeightOptions());
  form.querySelector('[name="type"]')?.addEventListener("change", updateGearFieldVisibility);
  form.querySelectorAll("[data-catch-photo-input]").forEach((input) => {
    input.addEventListener("change", () => {
      const other = input.name === "catch_photo_camera"
        ? form.elements.namedItem("catch_photo_file")
        : form.elements.namedItem("catch_photo_camera");
      if (input.files?.length && other) other.value = "";
      const status = form.querySelector("[data-catch-photo-status]");
      if (status && input.files?.[0]) status.textContent = `已选择：${input.files[0].name}`;
    });
  });
  if (record) populateModalForm(type, record);
  syncLogDateTimeField();
  updateSpeciesFieldVisibility();
  updateLureWeightOptions(record ? getLogLureWeight(record) : "");
  updateGearFieldVisibility();
  form.querySelector("input, select, textarea")?.focus();
}

function closeModal() {
  modal.hidden = true;
  closeLogDateTimePicker();
  form.reset();
  delete form.dataset.id;
  delete form.dataset.returnView;
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function getCatchFallbackImage(species) {
  const images = {
    "黑鱼": "assets/fish-snakehead-user.png",
    "鲈鱼": "assets/fish-bass-user.png",
    "鳜鱼": "assets/fish-mandarin-user.png",
    "马口": "assets/fish-makou-user.png",
    "军鱼": "assets/fish-junyu-user.png",
    "鲶鱼": "assets/fish-catfish-user.png",
    "鲤鱼": "assets/fish-carp-user.png",
    "红尾": "assets/fish-redtail-user.jpg",
    "鳡鱼": "assets/fish-ganchina-user.png",
    "鸭嘴翘": "assets/fish-duckbill-zui-user-fixed.jpg",
    "翘嘴": "assets/catch-zui.png"
  };
  return images[species] || "assets/catch-perch.png";
}

async function compressCatchPhoto(file) {
  const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!file || !acceptedTypes.includes(file.type)) throw new Error("UNSUPPORTED_IMAGE_TYPE");

  let source;
  let width;
  let height;
  let cleanup = () => {};
  if ("createImageBitmap" in window) {
    source = await createImageBitmap(file, { imageOrientation: "from-image" });
    width = source.width;
    height = source.height;
    cleanup = () => source.close();
  } else {
    const sourceUrl = URL.createObjectURL(file);
    source = await new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = sourceUrl;
    });
    width = source.naturalWidth;
    height = source.naturalHeight;
    cleanup = () => URL.revokeObjectURL(sourceUrl);
  }

  try {
    const longestEdge = Math.max(width, height);
    const baseScale = Math.min(1, 1600 / longestEdge);
    for (const [scale, quality] of [[1, 0.82], [0.86, 0.76], [0.72, 0.68]]) {
      const targetWidth = Math.max(1, Math.round(width * baseScale * scale));
      const targetHeight = Math.max(1, Math.round(height * baseScale * scale));
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      canvas.getContext("2d", { alpha: false }).drawImage(source, 0, 0, targetWidth, targetHeight);
      const compressed = await canvasToBlob(canvas, "image/webp", quality);
      if (compressed && compressed.size <= 800 * 1024) return compressed;
    }
  } finally {
    cleanup();
  }
  throw new Error("IMAGE_TOO_LARGE");
}

async function handleSubmit(event) {
  event.preventDefault();
  const type = form.dataset.type;
  const id = form.dataset.id;
  const data = Object.fromEntries(new FormData(form).entries());
  const photoFile = form.elements.namedItem("catch_photo_camera")?.files?.[0]
    || form.elements.namedItem("catch_photo_file")?.files?.[0]
    || null;
  const removePhoto = Boolean(form.elements.namedItem("remove_photo")?.checked);
  if (type === "log") {
    data.species = data.species === "__other__" ? data.species_custom.trim() : data.species;
    const dateTime = splitLogDateTime(data.logged_at);
    data.date = dateTime.date;
    data.time = dateTime.time;
    data.length_cm = data.size === "" ? null : Number(data.size);
    data.weight_g = data.weight === "" ? null : Number(data.weight);
    if (Number.isFinite(data.length_cm) && data.length_cm > 0) data.size = `${data.length_cm}cm`;
    if (Number.isFinite(data.weight_g) && data.weight_g > 0) data.weight = `${data.weight_g}g`;
    data.lure = [data.lure_name, data.lure_weight].filter(Boolean).join(" ");
    if (!id) data.condition_snapshot = getCurrentConditionSnapshot();
    delete data.species_custom;
    delete data.logged_at;
    delete data.catch_photo_camera;
    delete data.catch_photo_file;
    delete data.remove_photo;
  }
  if (type === "session" && !id) {
    data.condition_snapshot = getCurrentConditionSnapshot();
  }
  const submit = form.querySelector(".submit-btn");
  submit.disabled = true;
  submit.textContent = "保存中...";

  try {
    const record = id ? await apiUpdate(type, id, data) : await apiCreate(type, data);
    let photoMessage = "";

    if (type === "log" && photoFile?.size) {
      try {
        submit.textContent = "压缩照片...";
        const compressed = await compressCatchPhoto(photoFile);
        submit.textContent = "上传照片...";
        const photo = await apiUploadCatchPhoto(record.id, compressed);
        record.photo_id = photo.id;
        record.image = photo.image;
      } catch (error) {
        photoMessage = "鱼获已保存，但照片上传失败，请重新编辑补传";
      }
    } else if (type === "log" && removePhoto && id) {
      try {
        await apiDeleteCatchPhoto(id);
        record.photo_id = null;
        record.image = getCatchFallbackImage(record.species);
      } catch (error) {
        photoMessage = "鱼获已保存，但删除照片失败，请稍后重试";
      }
    }

    if (type === "log") {
      record.image = record.image || getCatchFallbackImage(record.species);
      state.logs = id
        ? state.logs.map((item) => String(item.id) === String(id) ? { ...item, ...record } : item)
        : [record, ...state.logs];
      showToast(photoMessage || (id ? "鱼获已更新" : (HAS_CLOUD_API ? "钓况已保存到云端" : "钓况已保存到当前演示会话")));
      showView(form.dataset.returnView || "today");
    }
    if (type === "spot") {
      state.spots = id
        ? state.spots.map((item) => String(item.id) === String(id) ? record : item)
        : [record, ...state.spots];
      showToast(id ? "标点已更新" : (HAS_CLOUD_API ? "标点已保存到云端" : "标点已保存到当前演示会话"));
      showView("spots");
    }
    if (type === "gear") {
      state.gear = id
        ? state.gear.map((item) => String(item.id) === String(id) ? record : item)
        : [record, ...state.gear];
      showToast(id ? "装备已更新" : (HAS_CLOUD_API ? "装备已保存到云端" : "装备已保存到当前演示会话"));
      showView("gear");
    }
    if (type === "session") {
      state.sessions = id
        ? state.sessions.map((item) => String(item.id) === String(id) ? { ...item, ...record } : item)
        : [record, ...state.sessions];
      showToast(id ? "钓行已更新" : (HAS_CLOUD_API ? "钓行已保存到云端" : "钓行已保存到当前演示会话"));
      showView("catches");
    }
    renderAll();
    analyticsState = null;
    refreshAnalytics();
    closeModal();
  } catch (error) {
    showToast("保存失败，请检查云端 API 配置");
  } finally {
    submit.disabled = false;
  }
}

async function refreshConditionsFromCoords(coords) {
  setText("condition-source", "更新中");
  setText("condition-place", "定位地名获取中");
  try {
    const data = await apiGetConditions(coords);
    const accuracy = Number(coords.accuracy);
    const accuracyLabel = Number.isFinite(accuracy)
      ? `定位 ±${Math.round(accuracy)}m`
      : "定位成功";
    conditionsState = {
      ...structuredClone(defaultConditions),
      ...data,
      location: { ...(data.location || {}), accuracy: Number.isFinite(accuracy) ? accuracy : null },
      weather: { ...defaultConditions.weather, ...(data.weather || {}), visibility: accuracyLabel },
      recommendation: { ...defaultConditions.recommendation, ...(data.recommendation || {}) },
      radar: Array.isArray(data.radar) ? data.radar : defaultConditions.radar
    };
    renderConditions();
    setText("condition-source", "已定位");
    showToast("已按当前位置更新钓况指数");
  } catch (error) {
    setText("condition-source", "重试");
    setText("condition-place", "查看详情");
    showToast("实时钓况获取失败，当前显示默认模型");
  }
}

async function refreshConditionsFromNetwork(reason) {
  setText("condition-source", "网络估算");
  setText("condition-place", "地名获取中");
  try {
    const data = await apiGetConditions(null);
    const label = data.location?.label ? `网络估算 ${data.location.label}` : "网络估算";
    conditionsState = {
      ...structuredClone(defaultConditions),
      ...data,
      weather: { ...defaultConditions.weather, ...(data.weather || {}), visibility: label },
      recommendation: { ...defaultConditions.recommendation, ...(data.recommendation || {}) },
      radar: Array.isArray(data.radar) ? data.radar : defaultConditions.radar
    };
    renderConditions();
    setText("condition-source", "网络估算");
    showToast(`${reason}，已用网络位置估算`);
  } catch (error) {
    setText("condition-source", "重试");
    setText("condition-place", "查看详情");
    showToast(`${reason}，网络估算也失败`);
  }
}

function locationErrorMessage(error) {
  if (!error) {
    return { label: "失败", message: "手机没有返回定位结果，请重试" };
  }
  if (error.code === 1) {
    return { label: "未授权", message: "定位权限被拒绝，请在系统权限里允许位置" };
  }
  if (error.code === 2) {
    return { label: "无信号", message: "手机定位不可用，请确认系统定位/GPS已开启" };
  }
  if (error.code === 3) {
    return { label: "超时", message: "定位超时，请到室外或打开系统定位后重试" };
  }
  return { label: "失败", message: "定位失败，请稍后重试" };
}

function getPosition(options) {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, options);
  });
}

async function requestSpotLocation() {
  const button = form.querySelector("[data-use-spot-location]");
  const status = form.querySelector("[data-spot-location-status]");
  if (!button || !status) return;

  if (!navigator.geolocation) {
    status.textContent = "当前浏览器不支持定位";
    showToast("当前浏览器不支持 GPS 定位");
    return;
  }

  const buttonLabel = button.lastElementChild;
  button.disabled = true;
  if (buttonLabel) buttonLabel.textContent = "正在获取位置...";
  status.textContent = "正在请求 GPS...";

  try {
    let position;
    try {
      position = await getPosition({ enableHighAccuracy: true, timeout: 25000, maximumAge: 0 });
    } catch (error) {
      if (error?.code === 1) throw error;
      position = await getPosition({ enableHighAccuracy: false, timeout: 12000, maximumAge: 5 * 60 * 1000 });
    }

    const coords = position.coords;
    form.elements.latitude.value = Number(coords.latitude).toFixed(6);
    form.elements.longitude.value = Number(coords.longitude).toFixed(6);
    form.elements.accuracy.value = Number.isFinite(Number(coords.accuracy))
      ? Number(coords.accuracy).toFixed(1)
      : "";
    const accuracy = Number(coords.accuracy);
    status.textContent = Number.isFinite(accuracy) ? `已定位 · 误差约 ±${Math.round(accuracy)}m` : "已定位";
    status.classList.add("location-ready");
    showToast("已获取当前位置，保存后写入标点");
  } catch (error) {
    const detail = locationErrorMessage(error);
    status.textContent = detail.label;
    status.classList.remove("location-ready");
    showToast(detail.message);
  } finally {
    button.disabled = false;
    if (buttonLabel) buttonLabel.textContent = "重新获取 GPS";
  }
}

function requestLocationConditions() {
  if (!navigator.geolocation) {
    setText("condition-source", "无定位");
    showToast("当前浏览器不支持定位");
    return;
  }

  const requestId = ++locationRequestId;
  setText("condition-source", "定位中");

  Promise.resolve()
    .then(() => getPosition({
      enableHighAccuracy: false,
      timeout: 18000,
      maximumAge: 5 * 60 * 1000
    }))
    .catch((firstError) => {
      if (firstError?.code === 1) throw firstError;
      setText("condition-source", "精定位");
      return getPosition({
        enableHighAccuracy: true,
        timeout: 25000,
        maximumAge: 0
      });
    })
    .then((position) => {
      if (requestId !== locationRequestId) return;
      refreshConditionsFromCoords(position.coords);
    })
    .catch((error) => {
      if (requestId !== locationRequestId) return;
      const detail = locationErrorMessage(error);
      if (error?.code === 1) {
        setText("condition-source", detail.label);
        showToast(detail.message);
        return;
      }
      refreshConditionsFromNetwork(detail.label);
    });
}

function handleLocationTrigger(event) {
  const trigger = event.target.closest?.("#refresh-conditions");
  if (!trigger) return;
  event.preventDefault();
  requestLocationConditions();
}

function handleGearFilter(event) {
  const filter = event.target.closest?.("[data-gear-category]");
  if (!filter) return;
  activeGearCategory = filter.dataset.gearCategory;
  renderGear();
}

function handleGearDetail(event) {
  const card = event.target.closest?.("[data-gear-id]");
  if (!card || event.target.closest("button")) return;
  event.preventDefault();
  openGearDetail(card.dataset.gearId);
}

function handleGearDetailKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  const card = event.target.closest?.("[data-gear-id]");
  if (!card) return;
  event.preventDefault();
  openGearDetail(card.dataset.gearId);
}

function handleLureCatchFilter(event) {
  const button = event.target.closest?.("[data-lure-catches-name]");
  if (!button) return;
  event.preventDefault();
  activeCatchSpecies = "all";
  activeCatchGear = "all";
  activeCatchLure = button.dataset.lureCatchesName;
  activeCatchSpot = "all";
  activeCatchSession = "all";
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  renderAll();
  showView("catches");
}

function handleGearCatchFilter(event) {
  const button = event.target.closest?.("[data-gear-catches-id]");
  if (!button) return;
  event.preventDefault();
  activeCatchSpecies = "all";
  activeCatchGear = "all";
  activeCatchLure = "all";
  activeCatchSpot = "all";
  activeCatchSession = "all";
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  if (button.dataset.gearCatchesCategory === "拟饵") {
    const gear = state.gear.find((item) => String(item.id) === String(button.dataset.gearCatchesId));
    activeCatchLure = gear?.name || "all";
  } else {
    activeCatchGear = button.dataset.gearCatchesId;
  }
  closeGearDetail();
  renderAll();
  showView("catches");
}

async function handleDelete(event) {
  const button = event.target.closest?.("[data-delete-type]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();

  const type = button.dataset.deleteType;
  const id = button.dataset.deleteId;
  const collection = type === "log" ? "logs" : type === "spot" ? "spots" : type === "session" ? "sessions" : "gear";
  const item = state[collection].find((record) => String(record.id) === String(id));
  const label = item?.name || item?.species || (type === "log" ? "这条鱼获" : type === "spot" ? "这个标点" : "这件装备");
  const isArchive = type !== "log";
  const message = isArchive
    ? `确认归档“${label}”？它会从当前列表隐藏，历史鱼获与关联信息会保留。`
    : `确认删除“${label}”？删除后无法恢复。`;
  if (!window.confirm(message)) return;

  button.disabled = true;
  try {
    await apiDelete(type, id);
    state[collection] = state[collection].filter((record) => String(record.id) !== String(id));
    if (type === "session") {
      if (activeCatchSession === String(id)) activeCatchSession = "all";
    }
    if (type === "log") {
      catchPage.logs = catchPage.logs.filter((record) => String(record.id) !== String(id));
      catchPage.total = Math.max(0, Number(catchPage.total || 0) - 1);
    }
    if (type === "log") closeCatchDetail();
    if (type === "gear") closeGearDetail();
    renderAll();
    analyticsState = null;
    refreshAnalytics();
    showToast(`${type === "log" ? "鱼获已删除" : type === "session" ? "钓行已归档" : type === "spot" ? "标点已归档" : "装备已归档"}`);
  } catch (error) {
    button.disabled = false;
    showToast("删除失败，请稍后重试");
  }
}

function handleEdit(event) {
  const button = event.target.closest?.("[data-edit-type]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();

  const type = button.dataset.editType;
  const id = button.dataset.editId;
  const collection = type === "log" ? "logs" : type === "spot" ? "spots" : type === "session" ? "sessions" : "gear";
  const record = state[collection].find((item) => String(item.id) === String(id));
  if (record) {
    if (type === "log") closeCatchDetail();
    if (type === "gear") closeGearDetail();
    openModal(type, record, type === "log" || type === "session" ? "catches" : "");
  }
}

function handleCatchDetail(event) {
  if (event.target.closest?.("[data-edit-type]")) return;
  const row = event.target.closest?.("[data-catch-id]");
  if (!row) return;
  openCatchDetail(row.dataset.catchId);
}

function handleCatchDetailKeyboard(event) {
  if (event.key !== "Enter" && event.key !== " ") return;
  if (event.target.closest?.("[data-edit-type]")) return;
  const row = event.target.closest?.("[data-catch-id]");
  if (!row) return;
  event.preventDefault();
  openCatchDetail(row.dataset.catchId);
}

function handleSpotCatchFilter(event) {
  const button = event.target.closest?.("[data-spot-catches-id]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  activeCatchSpecies = "all";
  activeCatchGear = "all";
  activeCatchLure = "all";
  activeCatchSpot = button.dataset.spotCatchesId;
  activeCatchSession = "all";
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  closeSpotInsight();
  renderAll();
  showView("catches");
}

function handleOpenSpotInsight(event) {
  const button = event.target.closest?.("[data-open-spot-insight]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  openSpotInsight(button.dataset.openSpotInsight);
}

function handleSpotMapFilter(event) {
  if (event.target?.id === "spot-map-species-filter") activeSpotSpecies = event.target.value;
  else if (event.target?.id === "spot-map-status-filter") activeSpotStatus = event.target.value;
  else return;
  renderSpots();
}

function handleFocusSpotMap(event) {
  const button = event.target.closest?.("[data-focus-spot-map]");
  if (!button) return;
  event.preventDefault();
  focusSpotOnMap(button.dataset.focusSpotMap);
}

function handleSpotNavigate(event) {
  const button = event.target.closest?.("[data-spot-navigate]");
  if (!button) return;
  event.preventDefault();
  const spot = state.spots.find((item) => String(item.id) === String(button.dataset.spotNavigate));
  const coords = getSpotCoordinates(spot);
  if (!coords) return showToast("该标点还没有 GPS 坐标");
  openAmapUrl(getAmapNavigationUrl(spot));
}

function handleOpenAmapSpots(event) {
  const button = event.target.closest?.("[data-open-amap-spots]");
  if (!button || button.disabled) return;
  event.preventDefault();
  const spots = getVisibleSpots().filter(getSpotCoordinates).slice(0, 10);
  if (!spots.length) return showToast("当前筛选没有 GPS 标点");
  const markers = spots.map((spot) => {
    const coords = getSpotCoordinates(spot);
    return `${coords.longitude.toFixed(6)},${coords.latitude.toFixed(6)},${getAmapSpotName(spot).replace(/[|,]/g, " ")}`;
  }).join("|");
  const query = new URLSearchParams({ markers, coordinate: "wgs84", callnative: "1", src: "lure-assistant" });
  openAmapUrl(`https://uri.amap.com/marker?${query.toString()}`);
}

function handleSessionCatchFilter(event) {
  const button = event.target.closest?.("[data-session-catches-id]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  activeCatchSpecies = "all";
  activeCatchGear = "all";
  activeCatchLure = "all";
  activeCatchSpot = "all";
  activeCatchSession = button.dataset.sessionCatchesId;
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  closeSessionReview();
  renderAll();
  showView("catches");
}

function handleOpenSessionReview(event) {
  const button = event.target.closest?.("[data-open-session-review]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  closeSessionArchive();
  openSessionReview(button.dataset.openSessionReview);
}

function handleSessionReviewOutcome(event) {
  const button = event.target.closest?.("[data-session-review-outcome]");
  if (!button || !sessionReviewModal) return;
  event.preventDefault();
  sessionReviewModal.dataset.outcome = button.dataset.sessionReviewOutcome;
  sessionReviewModal.querySelectorAll("[data-session-review-outcome]").forEach((item) => {
    const active = item.dataset.sessionReviewOutcome === button.dataset.sessionReviewOutcome;
    item.classList.toggle("active", active);
    item.setAttribute("aria-checked", String(active));
  });
}

async function handleSaveSessionReview(event) {
  const button = event.target.closest?.("[data-save-session-review]");
  if (!button || !sessionReviewModal) return;
  event.preventDefault();
  const id = button.dataset.saveSessionReview;
  const note = sessionReviewModal.querySelector("#session-review-note")?.value || "";
  const outcome = sessionReviewModal.dataset.outcome || "pending";
  button.disabled = true;
  try {
    const record = await apiUpdateSessionReview(id, { outcome, review_note: note });
    state.sessions = state.sessions.map((session) => String(session.id) === String(id) ? { ...session, ...record } : session);
    renderAll();
    openSessionReview(id);
    showToast("钓行复盘已保存");
  } catch (error) {
    button.disabled = false;
    showToast("复盘保存失败，请稍后重试");
  }
}

function handleSessionCatchCreate(event) {
  const button = event.target.closest?.("[data-session-add-log-id]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  openModal("log", null, "catches", { session_id: button.dataset.sessionAddLogId });
}

function handleClearSessionFilter(event) {
  const button = event.target.closest?.("[data-clear-session-filter]");
  if (!button) return;
  event.preventDefault();
  activeCatchSession = "all";
  renderAll();
}

function handleOpenSessionArchive(event) {
  const button = event.target.closest?.("[data-open-session-archive]");
  if (!button) return;
  event.preventDefault();
  openSessionArchive();
}

function handleSessionArchiveCatchView(event) {
  const button = event.target.closest?.("[data-session-archive-catches-id]");
  if (!button) return;
  event.preventDefault();
  activeCatchSpecies = "all";
  activeCatchGear = "all";
  activeCatchLure = "all";
  activeCatchSpot = "all";
  activeCatchSession = button.dataset.sessionArchiveCatchesId;
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  closeSessionArchive();
  renderAll();
  showView("catches");
}

function updateSessionArchiveYear(event) {
  activeSessionArchiveYear = event.target.value;
  if (activeSessionArchiveDate && !activeSessionArchiveDate.startsWith(`${activeSessionArchiveYear}-`)) activeSessionArchiveDate = "";
  renderSessionArchive();
}

function updateSessionArchiveMonth(event) {
  activeSessionArchiveMonth = event.target.value;
  if (activeSessionArchiveDate && activeSessionArchiveMonth !== "all" && activeSessionArchiveDate.slice(5, 7) !== activeSessionArchiveMonth) activeSessionArchiveDate = "";
  renderSessionArchive();
}

function updateSessionArchiveDate(event) {
  activeSessionArchiveDate = event.target.value;
  if (activeSessionArchiveDate) {
    activeSessionArchiveYear = activeSessionArchiveDate.slice(0, 4);
    activeSessionArchiveMonth = activeSessionArchiveDate.slice(5, 7);
  }
  renderSessionArchive();
}

document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => openModal(button.dataset.action, null, button.dataset.returnView));
});

document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewLink));
});

document.querySelectorAll(".bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.tab));
});

document.querySelector("#catch-species-filter")?.addEventListener("change", (event) => {
  activeCatchSpecies = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#catch-gear-filter")?.addEventListener("change", (event) => {
  activeCatchGear = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#catch-lure-filter")?.addEventListener("change", (event) => {
  activeCatchLure = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#catch-spot-filter")?.addEventListener("change", (event) => {
  activeCatchSpot = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#catch-date-from")?.addEventListener("change", (event) => {
  activeCatchDateFrom = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#catch-date-to")?.addEventListener("change", (event) => {
  activeCatchDateTo = event.target.value;
  refreshCatchPage(false);
});
document.querySelector("#clear-catch-time")?.addEventListener("click", () => {
  activeCatchDateFrom = "";
  activeCatchDateTo = "";
  refreshCatchPage(false);
});
document.querySelector("#analytics-year-filter")?.addEventListener("change", (event) => {
  activeAnalyticsYear = event.target.value;
  analyticsState = null;
  refreshAnalytics();
});
document.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-load-more-catches]");
  if (button) refreshCatchPage(true);
});
document.querySelector("#session-archive-year")?.addEventListener("change", updateSessionArchiveYear);
document.querySelector("#session-archive-month")?.addEventListener("change", updateSessionArchiveMonth);
document.querySelector("#session-archive-date")?.addEventListener("change", updateSessionArchiveDate);

document.querySelector("[data-close-modal]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
document.querySelector("[data-close-log-datetime-picker]")?.addEventListener("click", closeLogDateTimePicker);
document.querySelector("[data-save-log-datetime-picker]")?.addEventListener("click", saveLogDateTimePicker);
logDateTimePickerModal?.addEventListener("click", (event) => {
  if (event.target === logDateTimePickerModal) closeLogDateTimePicker();
});
document.querySelector("[data-close-catch-detail]").addEventListener("click", closeCatchDetail);
catchDetailModal.addEventListener("click", (event) => {
  if (event.target === catchDetailModal) closeCatchDetail();
});
catchDetailContent?.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-open-catch-photo]");
  if (button) openCatchPhotoViewer(button.dataset.openCatchPhoto);
});
document.querySelector("[data-close-catch-photo-viewer]")?.addEventListener("click", closeCatchPhotoViewer);
catchPhotoViewerModal?.addEventListener("click", (event) => {
  if (event.target === catchPhotoViewerModal) closeCatchPhotoViewer();
});
document.querySelector("[data-close-gear-detail]")?.addEventListener("click", closeGearDetail);
gearDetailModal?.addEventListener("click", (event) => {
  if (event.target === gearDetailModal) closeGearDetail();
});
document.querySelector("[data-close-data-tools]")?.addEventListener("click", closeDataTools);
dataToolsModal?.addEventListener("click", (event) => {
  if (event.target === dataToolsModal) closeDataTools();
});
dataRestoreFile?.addEventListener("change", handleBackupRestore);
document.querySelector("[data-close-session-archive]")?.addEventListener("click", closeSessionArchive);
sessionArchiveModal?.addEventListener("click", (event) => {
  if (event.target === sessionArchiveModal) closeSessionArchive();
});
document.querySelector("[data-close-session-review]")?.addEventListener("click", closeSessionReview);
sessionReviewModal?.addEventListener("click", (event) => {
  if (event.target === sessionReviewModal) closeSessionReview();
});
document.querySelector("[data-close-spot-insight]")?.addEventListener("click", closeSpotInsight);
spotInsightModal?.addEventListener("click", (event) => {
  if (event.target === spotInsightModal) closeSpotInsight();
});
document.querySelector("#show-location-detail").addEventListener("click", openLocationDetail);
document.querySelector("[data-close-location-detail]").addEventListener("click", closeLocationDetail);
locationDetailModal.addEventListener("click", (event) => {
  if (event.target === locationDetailModal) closeLocationDetail();
});
form.addEventListener("submit", handleSubmit);
authForm?.addEventListener("submit", handleAuthSubmit);
document.addEventListener("click", handleLocationTrigger);
document.addEventListener("touchend", handleLocationTrigger, { passive: false });
document.addEventListener("click", handleGearFilter);
document.addEventListener("click", (event) => {
  if (event.target.closest?.("[data-open-data-tools]")) openDataTools();
});
document.addEventListener("click", handleBackupExport);
document.addEventListener("click", handleCatchCsvExport);
document.addEventListener("click", handleGearDetail);
document.addEventListener("click", handleLureCatchFilter);
document.addEventListener("click", handleGearCatchFilter);
document.addEventListener("click", handleEdit);
document.addEventListener("click", handleDelete);
document.addEventListener("click", handleCatchDetail);
document.addEventListener("click", handleSpotCatchFilter);
document.addEventListener("click", handleOpenSpotInsight);
document.addEventListener("click", handleFocusSpotMap);
document.addEventListener("click", handleSpotNavigate);
document.addEventListener("click", handleOpenAmapSpots);
document.addEventListener("change", handleSpotMapFilter);
document.addEventListener("click", handleSessionCatchFilter);
document.addEventListener("click", handleSessionCatchCreate);
document.addEventListener("click", handleOpenSessionReview);
document.addEventListener("click", handleSessionReviewOutcome);
document.addEventListener("click", handleSaveSessionReview);
document.addEventListener("click", handleClearSessionFilter);
document.addEventListener("click", handleOpenSessionArchive);
document.addEventListener("click", handleSessionArchiveCatchView);
document.addEventListener("keydown", handleCatchDetailKeyboard);
document.addEventListener("keydown", handleGearDetailKeyboard);

initApp();
