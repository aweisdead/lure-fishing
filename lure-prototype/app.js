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

function loadState() {
  return structuredClone(seedState);
}

let state = loadState();

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

function showToast(message) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add("show");
  toastTimer = window.setTimeout(() => toast.classList.remove("show"), 1800);
}

function formatDate(log) {
  return `${log.date || ""} ${log.time || ""}`.trim();
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
  const target = document.getElementById("gear-list");
  if (!state.gear.length) {
    target.innerHTML = `<div class="empty-state">还没有装备。点击“添加装备”建立装备库。</div>`;
    return;
  }
  target.innerHTML = state.gear.map((gear) => `
    <article class="stack-item">
      <strong>${gear.name}</strong>
      <span>${gear.type || "装备"} · ${gear.spec || "未记录规格"}</span>
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
          <label class="form-field"><span>类型</span><select name="type"><option>拟饵</option><option>钓竿</option><option>渔轮</option><option>线组</option><option>配件</option></select></label>
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

renderAll();
apiGetState();
