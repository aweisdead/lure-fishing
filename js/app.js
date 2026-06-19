/**
 * 路亚助手 - 主应用逻辑
 * 导航、状态管理、天气分析、推荐引擎
 */

// ========== 存储管理 ==========
const Store = {
  _get(key, def) {
    try { const d = localStorage.getItem('lure_' + key); return d ? JSON.parse(d) : def; }
    catch { return def; }
  },
  _set(key, val) { localStorage.setItem('lure_' + key, JSON.stringify(val)); },

  getSpots() { return this._get('spots', []); },
  saveSpots(s) { this._set('spots', s); },
  getLogs() { return this._get('logs', []); },
  saveLogs(l) { this._set('logs', l); },
  getGear() { return this._get('gear', []); },
  saveGear(g) { this._set('gear', g); },
  getWeather() { return this._get('weather', null); },
  saveWeather(w) { this._set('weather', w); },
  getActiveTab() { return this._get('activeTab', 'dashboard'); },
  saveActiveTab(t) { this._set('activeTab', t); }
};

// ========== 导航系统 ==========
let currentDetailCallback = null;

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  const tab = document.querySelector(`.tab-item[data-page="${pageId}"]`);
  if (tab) tab.classList.add('active');
  Store.saveActiveTab(pageId);
  window.scrollTo(0, 0);
}

function showDetail(id, renderFn) {
  currentDetailCallback = { id, renderFn };
  document.getElementById('detail-page').classList.add('active');
  renderFn(id);
  document.getElementById('detail-page').scrollTop = 0;
}

function closeDetail() {
  document.getElementById('detail-page').classList.remove('active');
  currentDetailCallback = null;
}

function toggleModal(modalId, show) {
  document.getElementById(modalId).classList.toggle('active', show);
}

// ========== 天气分析引擎 ==========
function analyzeWeather(input) {
  if (!input) return { score: 0, factors: [], overall: '请先输入天气信息', recommendations: [] };

  let totalScore = 0;
  let factors = [];
  let pressureTrend = 'stable';

  // 气压评分
  if (input.pressure) {
    const p = Number(input.pressure);
    const rules = WEATHER_RULES.pressure.levels;
    let matched = rules.find(r => p >= r.range[0] && p <= r.range[1]);
    if (!matched) matched = rules[rules.length - 1];
    factors.push({ name: '气压', label: matched.label, score: matched.score, desc: matched.desc });
    totalScore += matched.score;
  }

  // 温度评分
  if (input.temp) {
    const t = Number(input.temp);
    const tempRules = WEATHER_RULES.temperature.general;
    let matched = tempRules.find(r => t >= r.range[0] && t <= r.range[1]);
    if (!matched) matched = t > 32 ? tempRules[3] : tempRules[4];
    factors.push({ name: '温度', label: matched.label, score: matched.score, desc: matched.desc });
    totalScore += matched.score;
  }

  // 风力评分
  if (input.wind) {
    const windRules = WEATHER_RULES.wind.levels;
    let matched = null;
    if (['0-1','0-1级','无风'].includes(input.wind)) matched = windRules[0];
    else if (['2-3','2-3级','微风'].includes(input.wind)) matched = windRules[1];
    else if (['4-5','4-5级','中浪'].includes(input.wind)) matched = windRules[2];
    else matched = windRules[3];
    if (matched) {
      factors.push({ name: '风力', label: matched.level, score: matched.score, desc: matched.desc });
      totalScore += matched.score;
    }
  }

  // 天气评分
  if (input.weather) {
    const weatherRules = WEATHER_RULES.weather.conditions;
    let matched = weatherRules.find(c => input.weather.includes(c.type));
    if (!matched && input.weather.includes('雨')) matched = weatherRules[4];
    if (matched) {
      factors.push({ name: '天气', label: input.weather, score: matched.score, desc: matched.desc });
      totalScore += matched.score;
    }
  }

  // 综合评分（满分36，归一化到10分制）
  const avg = Math.round((totalScore / 4) * 10) / 10;

  // 生成推荐
  let recommendations = [];
  if (avg >= 7) {
    recommendations = [
      { title: '适宜出钓！', desc: '条件很好，建议出钓。重点关注窗口期。' },
      { title: '推荐鱼种', desc: getRecommendedFish(input) }
    ];
  } else if (avg >= 5) {
    recommendations = [
      { title: '条件一般', desc: '可以出钓但需选好时段和手法。' },
      { title: '建议', desc: '放慢手法，使用精细钓组，集中在窗口期作钓。' }
    ];
  } else {
    recommendations = [
      { title: '条件不佳', desc: '鱼活性可能较低，建议等待天气好转。' },
      { title: '如果出钓', desc: '使用极慢速手法，搜索深水结构区。' }
    ];
  }

  // 窗口期推荐
  const windowTip = getWindowTip(input);
  if (windowTip) recommendations.push(windowTip);

  return {
    score: avg,
    factors,
    pressureTrend,
    overall: avg >= 7 ? '适合出钓' : avg >= 5 ? '可以尝试' : '不太理想',
    recommendations
  };
}

function getRecommendedFish(input) {
  const season = getCurrentSeason();
  const temp = Number(input.temp) || 25;
  let candidates = [];

  FISH_SPECIES.forEach(fish => {
    if (temp >= fish.temps.min && temp <= fish.temps.max) {
      candidates.push(fish.name);
    }
  });

  if (candidates.length === 0) candidates = FISH_SPECIES.map(f => f.name);
  return candidates.join('、') + '';
}

function getWindowTip(input) {
  const temp = Number(input.temp) || 25;
  const season = getCurrentSeason();
  let windows = '';

  if (season === 'summer') {
    if (temp > 30) windows = '早窗口 5:30-8:00，晚窗口 17:30-20:00，夜钓 20:00-23:00';
    else windows = '早窗口 6:00-9:00，晚窗口 16:00-19:00';
  } else if (season === 'spring' || season === 'autumn') {
    windows = '早窗口 6:30-9:30，晚窗口 15:30-18:00';
  } else {
    windows = '窗口 10:00-15:00（选晴暖天气）';
  }

  const weather = input.weather || '';
  if (['小雨', '阴', '多云'].some(w => weather.includes(w))) {
    windows += '，阴雨天窗口期延长';
  }

  if (input.weather && input.weather.includes('晴')) {
    windows += '，注意遮阳和补水';
  }

  return { title: '窗口期建议', desc: windows };
}
// ========== 推荐引擎 ==========
function getLureRecommendations(weather, season, targetFish) {
  const recs = [];
  const temp = Number(weather.temp) || 25;

  // 根据季节推荐
  const seasonData = SEASON_STRATEGY[season];
  if (seasonData) {
    recs.push({ title: seasonData.name, desc: seasonData.desc });
  }

  // 根据温度推荐
  if (temp > 28) {
    recs.push({ title: '高温建议', desc: '使用深潜米诺或铁板搜索深水区，夜钓效果更佳。' });
  } else if (temp < 15) {
    recs.push({ title: '低温建议', desc: '放慢手法，使用精细钓组（铅头钩+T尾），搜索深水结构。' });
  }

  // 目标鱼推荐
  if (targetFish && targetFish !== 'all') {
    const fish = FISH_SPECIES.find(f => f.id === targetFish);
    if (fish) {
      recs.push({ title: fish.name + '推荐拟饵', desc: fish.lureRecommend.hard.slice(0, 2).join('、') + ' / ' + fish.lureRecommend.soft.slice(0, 2).join('、') });
      recs.push({ title: '推荐颜色', desc: fish.lureRecommend.color[0] });
      recs.push({ title: '推荐手法', desc: fish.tips[0] });
    }
  } else {
    // 通用推荐
    recs.push({ title: '万能搭配', desc: '铅头钩+T尾鱼（5g/3寸）几乎适用于所有鱼种和季节。' });
    recs.push({ title: '搜索利器', desc: 'VIB 7-10g，全水层搜索，快速找到鱼群位置。' });
  }

  return recs;
}

// ========== Dashboard 渲染 ==========
function renderDashboard() {
  const weather = Store.getWeather();
  const logs = Store.getLogs();
  const spots = Store.getSpots();

  // 统计面板
  const totalCatch = logs.filter(l => l.catchCount > 0).length;
  const totalFish = logs.reduce((sum, l) => sum + (l.catchCount || 0), 0);
  const totalSpots = spots.length;
  const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

  document.getElementById('stat-catch').textContent = totalCatch;
  document.getElementById('stat-fish').textContent = totalFish;
  document.getElementById('stat-spots').textContent = totalSpots;

  // 最近钓况
  const recentLogsEl = document.getElementById('recent-logs');
  if (lastLog) {
    recentLogsEl.innerHTML = `
      <div class="log-card">
        <div class="log-date">${lastLog.date}</div>
        <div class="log-fish">${lastLog.fishName} ${lastLog.catchCount > 0 ? 'x' + lastLog.catchCount : '-'}</div>
        <div class="log-detail">${lastLog.spotName || '未知钓点'} ${lastLog.lure ? '| ' + lastLog.lure : ''} ${lastLog.weather ? '| ' + lastLog.weather : ''}</div>
      </div>`;
  } else {
    recentLogsEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎣</div><div class="empty-text">还没有钓况记录</div><div class="empty-sub">在"钓点日志"中记录你的第一次出钓吧</div></div>';
  }

  // 天气分析
  const weatherAnalysisEl = document.getElementById('weather-analysis');
  if (weather) {
    const result = analyzeWeather(weather);
    const colorClass = result.score >= 7 ? 'good' : result.score >= 5 ? 'mid' : 'bad';

    let factorsHtml = result.factors.map(f => `
      <div class="score-bar">
        <span style="font-size:13px;min-width:50px">${f.name}</span><span style="font-size:12px;color:var(--text-secondary);margin-left:6px">${(weather?{ 0: weather.pressure+"hPa", 1: weather.temp+String.fromCharCode(8451), 2: weather.wind, 3: weather.weather }:{})[{"气压":0,"温度":1,"风力":2,"天气":3}[f.name]]||f.label}</span>
        <div class="score-track"><div class="score-fill ${f.score >= 7 ? 'good' : f.score >= 5 ? 'mid' : 'bad'}" style="width:${(f.score/10)*100}%"></div></div>
        <span class="score-label">${f.score}</span>
      </div>`).join('');

    let recsHtml = result.recommendations.map(r => `
      <div class="recommend-card">
        <div class="rec-title">${r.title}</div>
        <div class="rec-desc">${r.desc}</div>
      </div>`).join('');

    weatherAnalysisEl.innerHTML = `
      <div class="card">
        <div class="card-title">🌤 今日作钓评分</div>
        <div style="text-align:center;padding:8px 0">
          <span style="font-size:42px;font-weight:700;color:${result.score >= 7 ? 'var(--success)' : result.score >= 5 ? 'var(--accent)' : 'var(--danger)'}">${result.score}</span>
          <span style="font-size:14px;color:var(--text-light)">/10</span>
          <div style="font-size:16px;font-weight:600;margin-top:4px">${result.overall}</div>
        </div>
        <div class="score-bar">
          <span style="font-size:13px;min-width:50px">综合</span>
          <div class="score-track"><div class="score-fill ${colorClass}" style="width:${result.score*10}%"></div></div>
        </div>
        ${factorsHtml}
      </div>
      <div class="card">
        <div class="card-title">🎯 作钓建议</div>
        ${recsHtml}
      </div>`;
  document.getElementById('weather-analysis').innerHTML += `
    <div class="card">
      <div class="card-title">\ud83c\udfaf 个性化分析</div>${(function(){ var ls=analyzeLogStats(Store.getLogs()); var pr=getPersonalizedRecs(Store.getWeather(), ls); if(pr.length===0) return ''; return pr.map(function(r){ return '<div class="recommend-card"><div class="rec-title">'+r.title+'</div><div class="rec-desc">'+r.desc+'</div></div>'; }).join(''); })()}</div>`;

  } else {
    weatherAnalysisEl.innerHTML = `
      <div class="card">
        <div class="card-title">🌤 今日作钓评分</div>
        <div class="empty-state" style="padding:20px">
          <div class="empty-text">尚未设置天气信息</div>
          <div class="empty-sub">请点击右上角设置今日天气</div>
          <button class="btn btn-primary btn-sm" onclick="showWeatherModal()" style="margin-top:10px">设置天气</button>
        </div>
      </div>`;
  }

  // 季节策略
  const season = getCurrentSeason();
  const seasonData = SEASON_STRATEGY[season];
  document.getElementById('season-strategy').innerHTML = `
    <div class="card">
      <div class="card-title">📅 ${seasonData.name}</div>
      <p style="font-size:13px;color:var(--text-secondary);margin-bottom:8px">${seasonData.desc}</p>
      <ul style="padding-left:16px">${seasonData.tips.map(t => '<li style="font-size:13px;color:var(--text-secondary);margin-bottom:3px">' + t + '</li>').join('')}</ul>
    </div>`;
}

// ========== 天气设置弹窗 ==========
function showWeatherModal() {
  const weather = Store.getWeather() || {};
  document.getElementById('weather-modal').classList.add('active');
  document.getElementById('weather-pressure').value = weather.pressure || '';
  document.getElementById('weather-temp').value = weather.temp || '';
  document.getElementById('weather-wind').value = weather.wind || '';
  document.getElementById('weather-type').value = weather.weather || '';
}

function saveWeather() {
  const data = {
    pressure: document.getElementById('weather-pressure').value,
    temp: document.getElementById('weather-temp').value,
    wind: document.getElementById('weather-wind').value,
    weather: document.getElementById('weather-type').value
  };
  Store.saveWeather(data);
  document.getElementById('weather-modal').classList.remove('active');
  renderDashboard();
}

function quickSetWeather(pressure, temp, wind, weather) {
  document.getElementById('weather-pressure').value = pressure;
  document.getElementById('weather-temp').value = temp;
  document.getElementById('weather-wind').value = wind;
  document.getElementById('weather-type').value = weather;
}
// ========== 鱼种百科渲染 ==========
function renderFishList() {
  const listEl = document.getElementById('fish-list');
  const searchVal = (document.getElementById('fish-search').value || '').trim().toLowerCase();

  let species = FISH_SPECIES;
  if (searchVal) {
    species = species.filter(f => f.name.includes(searchVal) || f.alias.some(a => a.includes(searchVal)) || f.category.includes(searchVal));
  }

  if (species.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🐟</div><div class="empty-text">没有匹配的鱼种</div></div>';
    return;
  }

  listEl.innerHTML = species.map(f => {
    const stars = '★'.repeat(f.difficulty) + '☆'.repeat(5 - f.difficulty);
    return `<div class="fish-card" onclick="showFishDetail('${f.id}')">
      <div class="fish-name">${f.name}<span class="fish-alias">${f.alias.slice(0, 2).join('、')}</span></div>
      <div class="fish-meta">
        <span>${f.category}</span>
        <span>难度: <span class="difficulty-stars">${stars.replace(/★/g, '<span class="active">★</span>').replace(/☆/g, '<span class="empty">☆</span>')}</span></span>
        <span>${f.waters[0]}</span>
      </div>
    </div>`;
  }).join('');
}

function showFishDetail(id) {
  const fish = FISH_SPECIES.find(f => f.id === id);
  if (!fish) return;

  showDetail(id, (fid) => {
    const f = FISH_SPECIES.find(x => x.id === fid);
    if (!f) return;
    const stars = '★'.repeat(f.difficulty) + '☆'.repeat(5 - f.difficulty);

    document.getElementById('detail-page').innerHTML = `
      <div class="detail-header">
        <button class="back-btn" onclick="closeDetail()">←</button>
        <h2>${f.name}</h2>
      </div>
      <div class="detail-body">
        <div class="fish-detail-header">
          <div class="fish-name">${f.name}</div>
          <div style="font-size:13px;color:var(--text-light);margin-top:2px">${f.alias.join('、')} · ${f.scientific}</div>
        </div>

        <div class="card">
          <div class="card-title">📋 基本信息</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.7">${f.desc}</p>
          <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;color:var(--text-secondary)">
            <div>类型: ${f.category}</div>
            <div>难度: ${stars}</div>
            <div>水深: ${f.depth}</div>
            <div>季节: ${f.season}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">🌡 环境偏好</div>
          <div class="score-bar"><span style="font-size:13px;min-width:50px">水温</span><span style="font-size:13px;color:var(--text-secondary)">${f.temps.min}°C ~ ${f.temps.optimal[0]}-${f.temps.optimal[1]}°C ~ ${f.temps.max}°C</span></div>
          <div class="score-bar"><span style="font-size:13px;min-width:50px">气压</span><span style="font-size:13px;color:var(--text-secondary)">${f.pressure.optimal[0]}-${f.pressure.optimal[1]}hPa · ${f.pressure.note}</span></div>
        </div>

        <div class="card">
          <div class="card-title">🎯 行为习性</div>
          <div style="font-size:13px;color:var(--text-secondary);line-height:1.7">
            <div style="margin-bottom:6px"><strong>摄食：</strong>${f.behavior.feeding}</div>
            <div style="margin-bottom:6px"><strong>标点：</strong>${f.behavior.structure}</div>
            <div><strong>攻击：</strong>${f.behavior.attack}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">🎣 推荐拟饵</div>
          <div style="font-size:13px;color:var(--text-secondary)">
            <div style="margin-bottom:4px"><strong>硬饵：</strong>${f.lureRecommend.hard.join('、')}</div>
            <div style="margin-bottom:4px"><strong>软饵：</strong>${f.lureRecommend.soft.join('、')}</div>
            <div style="margin-bottom:4px"><strong>颜色：</strong>${f.lureRecommend.color.join('；')}</div>
            <div><strong>尺寸：</strong>${f.lureRecommend.size.join('，')}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">💡 实战贴士</div>
          <ol style="padding-left:16px">${f.tips.map(t => '<li style="font-size:13px;color:var(--text-secondary);margin-bottom:4px;line-height:1.6">' + t + '</li>').join('')}</ol>
        </div>
      </div>`;
  });
}
// ========== 钓点管理 ==========
function renderSpots() {
  const spots = Store.getSpots();
  const listEl = document.getElementById('spots-list');
  const logs = Store.getLogs();

  if (spots.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📍</div><div class="empty-text">还没有记录钓点</div><div class="empty-sub">点击下方按钮添加你的第一个钓点</div></div>';
    return;
  }

  listEl.innerHTML = spots.map(s => {
    const spotLogs = logs.filter(l => l.spotId === s.id);
    const totalTrips = spotLogs.length;
    const totalCatches = spotLogs.reduce((sum, l) => sum + (l.catchCount || 0), 0);
    const successRate = totalTrips > 0 ? Math.round((spotLogs.filter(l => l.catchCount > 0).length / totalTrips) * 100) : 0;

    return `<div class="spot-card" onclick="showSpotDetail('${s.id}')">
      <div class="spot-name">${s.name}</div>
      <div style="font-size:12px;color:var(--text-light);margin-top:2px">${s.location || ''}</div>
      <div class="spot-tags">${(s.structures || []).map(st => '<span class="tag tag-primary">' + st + '</span>').join('')}</div>
      <div class="spot-stats" style="margin-top:4px">
        <span>🎣 ${totalTrips}次</span>
        <span>🐟 ${totalCatches}尾</span>
        <span>📊 ${successRate}%上鱼率</span>
      </div>
    </div>`;
  }).join('');
}

function showSpotDetail(id) {
  const spot = Store.getSpots().find(s => s.id === id);
  if (!spot) return;

  const logs = Store.getLogs().filter(l => l.spotId === id);
  const totalTrips = logs.length;
  const totalCatches = logs.reduce((sum, l) => sum + (l.catchCount || 0), 0);
  const successRate = totalTrips > 0 ? Math.round((logs.filter(l => l.catchCount > 0).length / totalTrips) * 100) : 0;

  showDetail(id, () => {
    document.getElementById('detail-page').innerHTML = `
      <div class="detail-header">
        <button class="back-btn" onclick="closeDetail()">←</button>
        <h2>${spot.name}</h2>
        <button class="back-btn" style="margin-left:auto;font-size:16px" onclick="deleteSpot('${spot.id}')">🗑</button>
      </div>
      <div class="detail-body">
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-value">${totalTrips}</div><div class="stat-label">出钓次数</div></div>
          <div class="stat-card"><div class="stat-value">${totalCatches}</div><div class="stat-label">总鱼获</div></div>
          <div class="stat-card"><div class="stat-value">${successRate}%</div><div class="stat-label">上鱼率</div></div>
        </div>

        <div class="card">
          <div class="card-title">📋 钓点信息</div>
          <div style="font-size:13px;color:var(--text-secondary)">
            <div>位置: ${spot.location || '未记录'}</div>
            <div>坐标: ${spot.lat ? spot.lat + ', ' + spot.lon : '未记录'}</div>
            <div>结构: ${(spot.structures || []).join('、') || '未记录'}</div>
            <div>目标鱼: ${(spot.targetFish || []).join('、') || '未记录'}</div>
            <div style="margin-top:6px">${spot.notes || ''}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-title">📝 钓况记录</div>
          ${logs.length === 0 ? '<div class="empty-state" style="padding:15px"><div class="empty-text" style="font-size:14px">暂无记录</div></div>' :
            logs.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(l => `
              <div class="list-item">
                <div>
                  <div class="item-title">${l.date} ${l.fishName} ${l.catchCount > 0 ? 'x' + l.catchCount : '-'}</div>
                  <div class="item-sub">${l.lure || ''} ${l.weather || ''}</div>
                </div>
                <button class="btn btn-sm btn-outline" onclick="deleteLog('${l.id}')">删除</button>
              </div>`).join('')}
        </div>
      </div>`;
  });
}

function addSpot() {
  document.getElementById('spot-form').reset();
  document.getElementById('spot-modal-title').textContent = '添加钓点';
  document.getElementById('spot-form-id').value = '';
  toggleModal('spot-modal', true);
}

function editSpot(id) {
  const spot = Store.getSpots().find(s => s.id === id);
  if (!spot) return;
  document.getElementById('spot-modal-title').textContent = '编辑钓点';
  document.getElementById('spot-form-id').value = spot.id;
  document.getElementById('spot-name').value = spot.name;
  document.getElementById('spot-location').value = spot.location || '';
  document.getElementById('spot-structures').value = (spot.structures || []).join(', ');
  document.getElementById('spot-target-fish').value = (spot.targetFish || []).join(', ');
  document.getElementById('spot-notes').value = spot.notes || '';
  toggleModal('spot-modal', true);
}

function saveSpot() {
  const id = document.getElementById('spot-form-id').value;
  const spots = Store.getSpots();
  const data = {
    name: document.getElementById('spot-name').value.trim(),
    location: document.getElementById('spot-location').value.trim(),
    structures: document.getElementById('spot-structures').value.split(/[,\s]+/).filter(Boolean),
    targetFish: document.getElementById('spot-target-fish').value.split(/[,\s]+/).filter(Boolean),
    notes: document.getElementById('spot-notes').value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!data.name) { alert('请输入钓点名称'); return; }

  if (id) {
    const idx = spots.findIndex(s => s.id === id);
    if (idx >= 0) { spots[idx] = { ...spots[idx], ...data }; }
  } else {
    data.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    spots.push(data);
  }

  Store.saveSpots(spots);
  toggleModal('spot-modal', false);
  renderSpots();
  renderDashboard();
}

function deleteSpot(id) {
  if (!confirm('确定删除这个钓点吗？相关记录不会删除。')) return;
  const spots = Store.getSpots().filter(s => s.id !== id);
  Store.saveSpots(spots);
  closeDetail();
  renderSpots();
  renderDashboard();
}
// ========== 钓况日志 ==========
function renderLogs() {
  const logs = Store.getLogs();
  const listEl = document.getElementById('logs-list');

  if (logs.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">📝</div><div class="empty-text">还没有钓况记录</div><div class="empty-sub">点击下方按钮记录第一次出钓</div></div>';
    return;
  }

  // 按日期降序排列
  const sorted = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));

  // 按月份分组
  const grouped = {};
  sorted.forEach(l => {
    const monthKey = l.date.slice(0, 7);
    if (!grouped[monthKey]) grouped[monthKey] = [];
    grouped[monthKey].push(l);
  });

  listEl.innerHTML = Object.entries(grouped).map(([month, monthLogs]) => `
    <div style="margin-bottom:12px">
      <div style="font-size:14px;font-weight:600;color:var(--primary);margin-bottom:6px">${month}</div>
      ${monthLogs.map(l => {
        const weatherIcon = l.weather ? (l.weather.includes('晴') ? '☀️' : l.weather.includes('雨') ? '🌧' : l.weather.includes('云') ? '⛅' : '🌤') : '';
        return `<div class="log-card">
          <div class="log-date">${l.date} ${l.time || ''} ${weatherIcon}</div>
          <div class="log-fish">${l.fishName} ${l.catchCount > 0 ? '<span style="color:var(--success)">x' + l.catchCount + '</span>' : '<span style="color:var(--text-light)">-</span>'}</div>
          <div class="log-detail">
            ${l.spotName ? '📍 ' + l.spotName : ''}
            ${l.lure ? '| 🎣 ' + l.lure : ''}
            ${l.technique ? '| 🔧 ' + l.technique : ''}
            ${l.notes ? '<br>' + l.notes : ''}
          </div>
          <div class="log-actions">
            <button class="btn-icon" onclick="deleteLog('${l.id}')" title="删除">🗑</button>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
}

function addLog() {
  document.getElementById('log-form').reset();
  document.getElementById('log-modal-title').textContent = '记录钓况';
  document.getElementById('log-form-id').value = '';
  document.getElementById('log-date').value = new Date().toISOString().slice(0, 10);
  toggleModal('log-modal', true);

  // 自动填充天气
  const weather = Store.getWeather();
  if (weather) {
    if (!document.getElementById('log-weather').value) {
      document.getElementById('log-weather').value = weather.weather || '';
    }
  }
}

function editLog(id) {
  const log = Store.getLogs().find(l => l.id === id);
  if (!log) return;
  document.getElementById('log-modal-title').textContent = '编辑记录';
  document.getElementById('log-form-id').value = log.id;
  document.getElementById('log-date').value = log.date;
  document.getElementById('log-time').value = log.time || '';
  document.getElementById('log-spot').value = log.spotName || '';
  document.getElementById('log-fish').value = log.fishName || '';
  document.getElementById('log-count').value = log.catchCount || 0;
  document.getElementById('log-lure').value = log.lure || '';
  document.getElementById('log-technique').value = log.technique || '';
  document.getElementById('log-weather').value = log.weather || '';
  document.getElementById('log-notes').value = log.notes || '';
  toggleModal('log-modal', true);
}

function saveLog() {
  const id = document.getElementById('log-form-id').value;
  const logs = Store.getLogs();
  const spots = Store.getSpots();

  const spotName = document.getElementById('log-spot').value.trim();
  let spotId = null;
  const existingSpot = spots.find(s => s.name === spotName);
  if (existingSpot) {
    spotId = existingSpot.id;
  }

  const data = {
    date: document.getElementById('log-date').value,
    time: document.getElementById('log-time').value.trim(),
    spotName: spotName,
    spotId: spotId,
    fishName: document.getElementById('log-fish').value.trim(),
    catchCount: parseInt(document.getElementById('log-count').value) || 0,
    lure: document.getElementById('log-lure').value.trim(),
    technique: document.getElementById('log-technique').value.trim(),
    weather: document.getElementById('log-weather').value.trim(),
    notes: document.getElementById('log-notes').value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!data.fishName && data.catchCount === 0) { alert('请输入鱼种或确认打龟'); return; }

  if (id) {
    const idx = logs.findIndex(l => l.id === id);
    if (idx >= 0) { logs[idx] = { ...logs[idx], ...data }; }
  } else {
    data.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    logs.push(data);
  }

  Store.saveLogs(logs);
  toggleModal('log-modal', false);
  renderLogs();
  renderDashboard();
}

function deleteLog(id) {
  if (!confirm('确定删除这条记录？')) return;
  const logs = Store.getLogs().filter(l => l.id !== id);
  Store.saveLogs(logs);
  renderLogs();
  renderDashboard();
}
// ========== 装备管理 ==========
function renderGear() {
  const gear = Store.getGear();
  const listEl = document.getElementById('gear-list');

  if (gear.length === 0) {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎣</div><div class="empty-text">还没有添加装备</div><div class="empty-sub">点击下方按钮添加你的竿轮饵装备</div></div>';
    return;
  }

  const categories = [
    { key: 'rod', label: '🎣 钓竿', icon: '🎣' },
    { key: 'reel', label: '🔄 渔轮', icon: '🔄' },
    { key: 'lure', label: '🎯 拟饵', icon: '🎯' },
    { key: 'line', label: '🪢 钓线', icon: '🪢' },
    { key: 'other', label: '📦 其他', icon: '📦' }
  ];

  listEl.innerHTML = categories.map(cat => {
    const items = gear.filter(g => g.category === cat.key);
    if (items.length === 0) return '';
    return `<div style="margin-bottom:12px">
      <div style="font-size:14px;font-weight:600;color:var(--primary);margin-bottom:6px">${cat.label} (${items.length})</div>
      ${items.map(g => `
        <div class="gear-item">
          <div class="gear-icon">${cat.icon}</div>
          <div class="gear-info">
            <div class="gear-name">${g.name}</div>
            <div class="gear-spec">${g.spec || ''}</div>
          </div>
          <button class="btn-icon" onclick="deleteGear('${g.id}')" title="删除">🗑</button>
        </div>`).join('')}
    </div>`;
  }).join('');

  if (listEl.innerHTML === '') {
    listEl.innerHTML = '<div class="empty-state"><div class="empty-icon">🎣</div><div class="empty-text">还没有添加装备</div></div>';
  }
}

function addGear() {
  document.getElementById('gear-form').reset();
  toggleModal('gear-modal', true);
}

function saveGear() {
  const gear = Store.getGear();
  const data = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
    name: document.getElementById('gear-name').value.trim(),
    category: document.getElementById('gear-category').value,
    spec: document.getElementById('gear-spec').value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!data.name) { alert('请输入装备名称'); return; }
  gear.push(data);
  Store.saveGear(gear);
  toggleModal('gear-modal', false);
  renderGear();
}

function deleteGear(id) {
  if (!confirm('确定删除这件装备？')) return;
  const gear = Store.getGear().filter(g => g.id !== id);
  Store.saveGear(gear);
  renderGear();
}

// ========== 技巧渲染 ==========
function renderTechniques() {
  const listEl = document.getElementById('techniques-list');
  listEl.innerHTML = TECHNIQUES.map((t, i) => {
    const species = t.targetSpecies.map(sid => {
      const fish = FISH_SPECIES.find(f => f.id === sid);
      return fish ? fish.name : sid;
    }).join('、');

    return `<div class="tip-card">
      <div class="tip-header" onclick="toggleTechnique(this)">
        <span>${t.name}</span>
        <span class="arrow">▼</span>
      </div>
      <div class="tip-body" id="tip-body-${i}">
        <p style="margin-bottom:8px;line-height:1.6">${t.desc}</p>
        <div style="margin-bottom:6px"><strong>步骤：</strong></div>
        <ol>${t.steps.map(s => '<li>' + s + '</li>').join('')}</ol>
        <div style="margin-top:8px;margin-bottom:6px"><strong>要点：</strong></div>
        <ul>${t.keyPoints.map(k => '<li>' + k + '</li>').join('')}</ul>
        <div style="margin-top:8px">
          <span style="font-size:12px;color:var(--text-light)">适用: ${species}</span>
          <span style="font-size:12px;color:var(--text-light);margin-left:12px">推荐: ${t.suitableLures.join('、')}</span>
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleTechnique(header) {
  header.classList.toggle('open');
  const body = header.nextElementSibling;
  body.classList.toggle('open');
}

// ========== 数据统计 ==========
function renderStats() {
  const logs = Store.getLogs();
  const spots = Store.getSpots();

  if (logs.length === 0) {
    document.getElementById('stats-content').innerHTML = '<div class="card"><div class="empty-state" style="padding:20px"><div class="empty-icon">📊</div><div class="empty-text">还没有足够数据生成统计</div><div class="empty-sub">多记录几次钓况后回来查看</div></div></div>';
    return;
  }

  // 基础统计
  const totalLogs = logs.length;
  const totalCatches = logs.reduce((sum, l) => sum + (l.catchCount || 0), 0);
  const successLogs = logs.filter(l => l.catchCount > 0).length;
  const successRate = Math.round((successLogs / totalLogs) * 100);
  const uniqueFish = [...new Set(logs.filter(l => l.fishName).map(l => l.fishName))];

  // 鱼种分布
  const fishCounts = {};
  logs.filter(l => l.fishName).forEach(l => {
    fishCounts[l.fishName] = (fishCounts[l.fishName] || 0) + (l.catchCount || 1);
  });
  const fishRanking = Object.entries(fishCounts).sort((a, b) => b[1] - a[1]);

  // 用饵统计
  const lureCounts = {};
  logs.filter(l => l.lure).forEach(l => {
    lureCounts[l.lure] = (lureCounts[l.lure] || 0) + 1;
  });
  const lureRanking = Object.entries(lureCounts).sort((a, b) => b[1] - a[1]);

  // 最佳钓点
  const spotSuccess = {};
  spots.forEach(s => {
    const spotLogs = logs.filter(l => l.spotId === s.id);
    const catches = spotLogs.reduce((sum, l) => sum + (l.catchCount || 0), 0);
    if (spotLogs.length > 0) spotSuccess[s.name] = { trips: spotLogs.length, catches, rate: Math.round((spotLogs.filter(l => l.catchCount > 0).length / spotLogs.length) * 100) };
  });

  document.getElementById('stats-content').innerHTML = `
    <div class="stat-grid">
      <div class="stat-card"><div class="stat-value">${totalLogs}</div><div class="stat-label">总出钓</div></div>
      <div class="stat-card"><div class="stat-value">${totalCatches}</div><div class="stat-label">总鱼获</div></div>
      <div class="stat-card"><div class="stat-value">${successRate}%</div><div class="stat-label">上鱼率</div></div>
    </div>

    <div class="card">
      <div class="card-title">🐟 鱼种排行</div>
      ${fishRanking.slice(0, 5).map(([name, count], i) => `
        <div class="list-item">
          <div class="item-title">${i + 1}. ${name}</div>
          <span class="tag tag-primary">${count}尾</span>
        </div>`).join('')}
      ${uniqueFish.length > 5 ? `<div style="font-size:12px;color:var(--text-light);text-align:center;margin-top:4px">共计 ${uniqueFish.length} 种目标鱼</div>` : ''}
    </div>

    <div class="card">
      <div class="card-title">🎯 热门拟饵</div>
      ${lureRanking.slice(0, 5).map(([name, count]) => `
        <div class="list-item">
          <div class="item-title">${name}</div>
          <span class="tag tag-accent">${count}次</span>
        </div>`).join('')}
      ${lureRanking.length === 0 ? '<div style="font-size:13px;color:var(--text-light)">暂无数据</div>' : ''}
    </div>

    <div class="card">
      <div class="card-title">📍 最佳钓点</div>
      ${Object.entries(spotSuccess).sort((a, b) => b[1].catches - a[1].catches).slice(0, 5).map(([name, data]) => `
        <div class="list-item">
          <div class="item-title">${name}</div>
          <span style="font-size:12px;color:var(--text-secondary)">${data.trips}次 ${data.catches}尾 ${data.rate}%</span>
        </div>`).join('')}
      ${Object.keys(spotSuccess).length === 0 ? '<div style="font-size:13px;color:var(--text-light)">暂无数据</div>' : ''}
    </div>`;
}
  // 条件胜率分析
  (function() {
    var logs2 = Store.getLogs();
    if (logs2.length < 2) return;
    var stats2 = analyzeLogStats(logs2);
    var el = document.getElementById('stats-content');
    var html = el.innerHTML;

    // 天气类型分析
    var weatherRows = Object.keys(stats2.byWeather).filter(function(k) { return stats2.byWeather[k].trips >= 2; }).sort(function(a, b) { return stats2.byWeather[b].trips - stats2.byWeather[a].trips; });
    if (weatherRows.length > 0) {
      html += '<div class="card"><div class="card-title">\u2601\ufe0f 天气类型胜率</div>';
      html += '<table style="width:100%;font-size:13px;border-collapse:collapse"><tr style="border-bottom:1px solid var(--border)"><th style="padding:6px 4px;text-align:left">天气</th><th style="padding:6px 4px;text-align:center">出钓</th><th style="padding:6px 4px;text-align:center">中鱼</th><th style="padding:6px 4px;text-align:right">胜率</th></tr>';
      weatherRows.forEach(function(k) { var d = stats2.byWeather[k]; var r = Math.round((d.success / d.trips) * 100); html += '<tr><td style="padding:6px 4px">' + k + '</td><td style="padding:6px 4px;text-align:center">' + d.trips + '</td><td style="padding:6px 4px;text-align:center">' + d.success + '</td><td style="padding:6px 4px;text-align:right"><span style="color:' + (r >= 50 ? 'var(--success)' : 'var(--danger)') + ';font-weight:600">' + r + '%</span></td></tr>'; });
      html += '</table></div>';
    }

    // 拟饵分析
    var lureRows = Object.keys(stats2.byLure).filter(function(k) { return stats2.byLure[k].trips >= 2; }).sort(function(a, b) { return (stats2.byLure[b].success / stats2.byLure[b].trips) - (stats2.byLure[a].success / stats2.byLure[a].trips); }).slice(0, 5);
    if (lureRows.length > 0) {
      html += '<div class="card"><div class="card-title">\ud83c\udfaf 拟饵胜率排行（出钓≥2次）</div>';
      html += '<table style="width:100%;font-size:13px;border-collapse:collapse"><tr style="border-bottom:1px solid var(--border)"><th style="padding:6px 4px;text-align:left">拟饵</th><th style="padding:6px 4px;text-align:center">出钓</th><th style="padding:6px 4px;text-align:center">中鱼</th><th style="padding:6px 4px;text-align:right">胜率</th></tr>';
      lureRows.forEach(function(k) { var d = stats2.byLure[k]; var r = Math.round((d.success / d.trips) * 100); html += '<tr><td style="padding:6px 4px">' + k + '</td><td style="padding:6px 4px;text-align:center">' + d.trips + '</td><td style="padding:6px 4px;text-align:center">' + d.success + '</td><td style="padding:6px 4px;text-align:right"><span style="color:' + (r >= 50 ? 'var(--success)' : 'var(--danger)') + ';font-weight:600">' + r + '%</span></td></tr>'; });
      html += '</table></div>';
    }

    el.innerHTML = html;
  })();


// ========== 初始化 ==========



function initApp() {
  // Tab 切换
  document.querySelectorAll('.tab-item').forEach(tab => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.page;
      showPage(page);
      // 渲染对应页面
      switch(page) {
        case 'dashboard': renderDashboard(); break;
        case 'fish': renderFishList(); break;
        case 'gear': renderGear(); renderTechniques(); break;
        case 'spots': renderSpots(); renderLogs(); break;
        case 'stats': renderStats(); break;
      }
    });
  });

  // 鱼种搜索
  document.getElementById('fish-search').addEventListener('input', renderFishList);

  // 初始化页面
  const savedTab = Store.getActiveTab();
  showPage(savedTab);

  // 渲染所有页面
  renderDashboard();
  renderFishList();
  renderSpots();
  renderLogs();
  renderGear();
  renderTechniques();
  renderStats();

  // 关闭模态点击背景
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m) m.classList.remove('active');
    });
  });

  // 页面加载后延迟自动获取天气
  setTimeout(function() { autoFetchWeather(); }, 200);
}

// DOM Ready
document.addEventListener('DOMContentLoaded', initApp);

// ========== 自动获取天气（IP定位+Open-Meteo，无需弹窗） ==========
function autoFetchWeather() {
  fetch('https://ipinfo.io/json')
    .then(function(r) { if (!r.ok) throw new Error(''); return r.json(); })
    .then(function(d) {
      var loc = d.loc.split(',');
      var lat = loc[0], lon = loc[1];
      return fetch('https://api.open-meteo.com/v1/forecast?latitude=' + lat + '&longitude=' + lon + '&current=temperature_2m,pressure_msl,weather_code,wind_speed_10m&timezone=auto');
    })
    .then(function(r) { if (!r.ok) throw new Error(''); return r.json(); })
    .then(function(d) {
      var t = Math.round(d.current.temperature_2m);
      var p = Math.round(d.current.pressure_msl);
      var w = Math.round(d.current.wind_speed_10m);
      var c = d.current.weather_code;
      var map = {0:'晴',1:'晴',2:'多云',3:'阴',45:'多云',48:'雾',51:'小雨',53:'小雨',55:'中雨',61:'小雨',63:'中雨',65:'大雨',80:'小雨',81:'中雨',82:'大雨',95:'雷阵雨',96:'雷阵雨',99:'雷阵雨'};
      var desc = map[c] || '多云';
      var level = '2-3级';
      if (w < 1) level = '0-1级';
      else if (w < 6) level = '0-1级';
      else if (w < 12) level = '2-3级';
      else if (w < 20) level = '2-3级';
      else if (w < 29) level = '4-5级';
      else if (w < 39) level = '4-5级';
      else level = '6级以上';
      Store.saveWeather({pressure: String(p), temp: String(t), wind: level, weather: desc});
      renderDashboard();
    })
    .catch(function(e) {});
}

// ========== 个人钓况分析引擎 ==========
function analyzeLogStats(logs) {
  var stats = { totalTrips: logs.length, totalCatches: 0, successTrips: 0, successRate: 0, byWeather: {}, byLure: {}, bySpecies: {}, bySpot: {} };
  logs.forEach(function(l) {
    stats.totalCatches += (l.catchCount || 0);
    if (l.catchCount > 0) stats.successTrips++;
    var w = l.weather || "未知"; if (!stats.byWeather[w]) stats.byWeather[w] = { trips: 0, catches: 0, success: 0 };
    stats.byWeather[w].trips++; stats.byWeather[w].catches += (l.catchCount || 0);
    if (l.catchCount > 0) stats.byWeather[w].success++;
    var lu = l.lure || "未知"; if (!stats.byLure[lu]) stats.byLure[lu] = { trips: 0, catches: 0, success: 0 };
    stats.byLure[lu].trips++; stats.byLure[lu].catches += (l.catchCount || 0);
    if (l.catchCount > 0) stats.byLure[lu].success++;
    var f = l.fishName || "未知"; if (!stats.bySpecies[f]) stats.bySpecies[f] = { trips: 0, catches: 0, success: 0 };
    stats.bySpecies[f].trips++; stats.bySpecies[f].catches += (l.catchCount || 0);
    if (l.catchCount > 0) stats.bySpecies[f].success++;
    var s = l.spotName || "未知"; if (!stats.bySpot[s]) stats.bySpot[s] = { trips: 0, catches: 0, success: 0 };
    stats.bySpot[s].trips++; stats.bySpot[s].catches += (l.catchCount || 0);
    if (l.catchCount > 0) stats.bySpot[s].success++;
  });
  stats.successRate = stats.totalTrips > 0 ? Math.round((stats.successTrips / stats.totalTrips) * 100) : 0;
  return stats;
}

function getPersonalizedRecs(weather, logStats) {
  var recs = [];
  if (logStats.totalTrips < 2) { recs.push({ title: "数据太少", desc: "记录更多钓况后，这里会给出个性化建议" }); return recs; }

  var w = (weather && weather.weather) ? weather.weather : null;
  if (w && logStats.byWeather[w] && logStats.byWeather[w].trips >= 2) {
    var ws = logStats.byWeather[w];
    var r = Math.round((ws.success / ws.trips) * 100);
    recs.push({ title: "今日天气(" + w + ") 历史表现", desc: "出钓 " + ws.trips + " 次 · 中鱼 " + ws.success + " 次 · 胜率 " + r + "%" });
  }

  var bestLure = null, bestRate = 0;
  for (var k in logStats.byLure) {
    var ld = logStats.byLure[k];
    if (ld.trips >= 2) { var r2 = Math.round((ld.success / ld.trips) * 100); if (r2 > bestRate) { bestRate = r2; bestLure = k; } }
  }
  if (bestLure) recs.push({ title: "最佳拟饵", desc: bestLure + " 在你手上胜率 " + bestRate + "%" });

  return recs;
}


function fetchSpotLocation() {
  var btn = document.getElementById("btn-spot-locate");
  var status = document.getElementById("spot-location-status");
  btn.textContent = "⏳";
  btn.disabled = true;
  status.style.display = "block";
  status.textContent = "正在获取位置...";
  fetch("https://ipinfo.io/json")
    .then(function(r) { if (!r.ok) throw new Error(""); return r.json(); })
    .then(function(d) {
      var loc = d.loc.split(",");
      document.getElementById("spot-location").value = d.city + ", " + d.region;
      document.getElementById("spot-lat").value = loc[0];
      document.getElementById("spot-lon").value = loc[1];
      status.textContent = "✅ " + d.city + " " + d.region + " (" + loc[0] + ", " + loc[1] + ")";
      btn.textContent = "📍";
      btn.disabled = false;
    })
    .catch(function() {
      status.textContent = "❌ 定位失败";
      btn.textContent = "📍";
      btn.disabled = false;
    });
}
