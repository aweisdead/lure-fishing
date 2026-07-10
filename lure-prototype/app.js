const HAS_CLOUD_API = location.protocol !== "file:";

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
      image: "assets/catch-bass.png",
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
  ]
};

const toast = document.querySelector(".toast");
const modal = document.getElementById("entry-modal");
const form = document.getElementById("entry-form");
const modalTitle = document.getElementById("entry-title");
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

const defaultGearCategories = ["全部", "拟饵", "钓竿", "渔轮", "线组", "配件", "未分类"];

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

function saveState() {
  // Persistence is intentionally cloud-only. file:// preview keeps data in memory.
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
      gear: Array.isArray(data.gear) ? data.gear : []
    };
    renderAll();
  } catch (error) {
    showToast("云端数据暂不可用，当前显示演示数据");
  }
}

async function apiCreate(type, data) {
  if (!HAS_CLOUD_API) {
    return { id: `${type}-${Date.now()}`, ...data };
  }

  const endpoints = { log: "/api/logs", spot: "/api/spots", gear: "/api/gear" };
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

async function apiGetConditions(coords) {
  if (!HAS_CLOUD_API) return structuredClone(defaultConditions);
  const params = coords
    ? new URLSearchParams({ lat: coords.latitude, lon: coords.longitude })
    : new URLSearchParams({ fallback: "network" });
  const response = await fetch(`/api/conditions?${params}`);
  if (!response.ok) throw new Error(`conditions ${response.status}`);
  return response.json();
}

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function formatDate(log) {
  return `${log.date || ""} ${log.time || ""}`.trim();
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
  setText("weather-temp", data.weather.tempRange);
  setText("weather-wind", data.weather.wind);
  setText("weather-pressure", data.weather.pressure);
  setText("weather-humidity", data.weather.humidity);
  setText("weather-visibility", data.weather.visibility);
  setText("weather-water", data.weather.water);
  setText("weather-window", data.weather.window);
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

function renderHomeLogs() {
  const target = document.getElementById("home-catch-list");
  const logs = state.logs.slice(0, 3);
  if (!logs.length) {
    target.innerHTML = `<div class="empty-state">还没有钓况记录。点击“记录钓况”开始保存第一条。</div>`;
    return;
  }
  target.innerHTML = logs.map((log) => `
    <article class="catch-row">
      <img src="${log.image || "assets/catch-perch.png"}" alt="${log.species}渔获照片">
      <div class="catch-info">
        <strong>${log.species}</strong>
        <span>${log.size || "-"} | ${log.weight || "-"}</span>
        <small><span class="material-symbols-rounded">location_on</span>${log.spot || "未记录标点"}</small>
      </div>
      <div class="catch-meta">
        <time>${formatDate(log)}</time>
        <em>${log.lure || "未记录"}</em>
      </div>
      <span class="material-symbols-rounded row-arrow">chevron_right</span>
    </article>
  `).join("");
}

function renderSpots() {
  const target = document.getElementById("spots-list");
  if (!state.spots.length) {
    target.innerHTML = `<div class="empty-state">还没有标点。点击“新增标点”记录第一个点位。</div>`;
    return;
  }
  target.innerHTML = state.spots.map((spot) => `
    <article class="stack-item">
      <strong>${spot.name}</strong>
      <span>${spot.water || "未记录水域"} · ${spot.structure || "未记录结构"}</span>
      <small>目标鱼：${spot.target || "未设置"}${spot.note ? ` · ${spot.note}` : ""}</small>
    </article>
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

  target.innerHTML = visibleGear.map((gear) => `
    <article class="stack-item gear-item">
      <div class="gear-item-head">
        <strong>${gear.name}</strong>
        <em class="gear-category">${getGearCategory(gear)}</em>
      </div>
      <span>${gear.spec || "未记录规格"}</span>
      <small>${gear.note || "暂无备注"}</small>
    </article>
  `).join("");
}

function renderAll() {
  renderHomeLogs();
  renderSpots();
  renderGear();
}

function showView(view) {
  document.querySelectorAll(".bottom-nav button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === view);
  });

  const isToday = view === "today";
  document.querySelectorAll(".home-section").forEach((section) => {
    section.hidden = !isToday;
  });
  document.querySelectorAll(".page-view").forEach((section) => {
    section.hidden = section.id !== `view-${view}`;
  });

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(type) {
  const configs = {
    log: {
      title: "记录钓况",
      submit: "保存钓况",
      fields: `
        <div class="field-grid">
          <label class="form-field"><span>鱼种</span><input name="species" required placeholder="黑鱼 / 翘嘴 / 鲈鱼"></label>
          <label class="form-field"><span>日期</span><input name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></label>
        </div>
        <div class="field-grid">
          <label class="form-field"><span>长度</span><input name="size" placeholder="42cm"></label>
          <label class="form-field"><span>重量</span><input name="weight" placeholder="1.3kg"></label>
        </div>
        <label class="form-field"><span>标点</span><input name="spot" placeholder="长河水库 · 大坝左侧"></label>
        <div class="field-grid">
          <label class="form-field"><span>拟饵</span><input name="lure" placeholder="米诺 12g"></label>
          <label class="form-field"><span>时间</span><input name="time" placeholder="18:40"></label>
        </div>
        <label class="form-field"><span>备注</span><textarea name="note" placeholder="窗口期、咬口、手法、天气变化"></textarea></label>
      `
    },
    spot: {
      title: "新增标点",
      submit: "保存标点",
      fields: `
        <label class="form-field"><span>标点名称</span><input name="name" required placeholder="南湖公园标点"></label>
        <label class="form-field"><span>水域位置</span><input name="water" placeholder="东岸浅滩 / 大坝左侧"></label>
        <label class="form-field"><span>结构</span><input name="structure" placeholder="草边、乱石、桥墩、回水"></label>
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
          <label class="form-field"><span>规格</span><input name="spec" placeholder="12g / 银黑背"></label>
        </div>
        <label class="form-field"><span>备注</span><textarea name="note" placeholder="适用鱼种、场景、搭配线组"></textarea></label>
      `
    }
  };

  const config = configs[type];
  modalTitle.textContent = config.title;
  form.dataset.type = type;
  form.innerHTML = `${config.fields}<button class="submit-btn" type="submit">${config.submit}</button>`;
  modal.hidden = false;
  form.querySelector("input, select, textarea")?.focus();
}

function closeModal() {
  modal.hidden = true;
  form.reset();
}

async function handleSubmit(event) {
  event.preventDefault();
  const type = form.dataset.type;
  const data = Object.fromEntries(new FormData(form).entries());
  const submit = form.querySelector(".submit-btn");
  submit.disabled = true;
  submit.textContent = "保存中...";

  try {
    const record = await apiCreate(type, data);

    if (type === "log") {
      record.image = record.image || "assets/catch-perch.png";
      state.logs.unshift(record);
      showToast(HAS_CLOUD_API ? "钓况已保存到云端" : "钓况已保存到当前演示会话");
      showView("today");
    }
    if (type === "spot") {
      state.spots.unshift(record);
      showToast(HAS_CLOUD_API ? "标点已保存到云端" : "标点已保存到当前演示会话");
      showView("spots");
    }
    if (type === "gear") {
      state.gear.unshift(record);
      showToast(HAS_CLOUD_API ? "装备已保存到云端" : "装备已保存到当前演示会话");
      showView("gear");
    }

    saveState();
    renderAll();
    closeModal();
  } catch (error) {
    showToast("保存失败，请检查云端 API 配置");
  } finally {
    submit.disabled = false;
  }
}

async function refreshConditionsFromCoords(coords) {
  setText("condition-source", "更新中");
  try {
    const data = await apiGetConditions(coords);
    const accuracy = Number(coords.accuracy);
    const accuracyLabel = Number.isFinite(accuracy)
      ? `定位 ±${Math.round(accuracy)}m`
      : "定位成功";
    conditionsState = {
      ...structuredClone(defaultConditions),
      ...data,
      weather: { ...defaultConditions.weather, ...(data.weather || {}), visibility: accuracyLabel },
      recommendation: { ...defaultConditions.recommendation, ...(data.recommendation || {}) },
      radar: Array.isArray(data.radar) ? data.radar : defaultConditions.radar
    };
    renderConditions();
    setText("condition-source", "已定位");
    showToast("已按当前位置更新钓况指数");
  } catch (error) {
    setText("condition-source", "重试");
    showToast("实时钓况获取失败，当前显示默认模型");
  }
}

async function refreshConditionsFromNetwork(reason) {
  setText("condition-source", "网络估算");
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

document.querySelectorAll("[data-action]").forEach((button) => {
  button.addEventListener("click", () => openModal(button.dataset.action));
});

document.querySelectorAll("[data-view-link]").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.viewLink));
});

document.querySelectorAll(".bottom-nav button").forEach((button) => {
  button.addEventListener("click", () => showView(button.dataset.tab));
});

document.querySelector("[data-close-modal]").addEventListener("click", closeModal);
modal.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});
form.addEventListener("submit", handleSubmit);
document.addEventListener("click", handleLocationTrigger);
document.addEventListener("touchend", handleLocationTrigger, { passive: false });
document.addEventListener("click", handleGearFilter);

renderConditions();
renderAll();
apiGetState();
if (HAS_CLOUD_API && location.protocol === "https:") {
  requestLocationConditions();
}
