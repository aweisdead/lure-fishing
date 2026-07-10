const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      return bootstrap(env);
    }

    if (url.pathname === "/api/conditions" && request.method === "GET") {
      return conditions(request, url, env);
    }

    if (url.pathname === "/api/logs" && request.method === "POST") {
      return createLog(request, env);
    }

    if (url.pathname === "/api/spots" && request.method === "POST") {
      return createSpot(request, env);
    }

    if (url.pathname === "/api/gear" && request.method === "POST") {
      return createGear(request, env);
    }

    return env.ASSETS.fetch(request);
  }
};

async function conditions(request, url, env) {
  const location = resolveConditionLocation(request, url);

  if (!location) {
    return json({ error: "INVALID_LOCATION" }, 400);
  }

  const apiUrl = new URL("https://api.open-meteo.com/v1/forecast");
  apiUrl.search = new URLSearchParams({
    latitude: location.lat.toFixed(5),
    longitude: location.lon.toFixed(5),
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "apparent_temperature",
      "precipitation",
      "weather_code",
      "cloud_cover",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m"
    ].join(","),
    hourly: [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "pressure_msl",
      "wind_speed_10m",
      "weather_code",
      "cloud_cover"
    ].join(","),
    daily: "sunrise,sunset,temperature_2m_max,temperature_2m_min",
    past_days: "1",
    forecast_days: "1",
    timezone: "auto"
  }).toString();

  try {
    const response = await fetch(apiUrl, {
      headers: { accept: "application/json" },
      cf: { cacheTtl: 600, cacheEverything: true }
    });

    if (!response.ok) throw new Error(`weather api ${response.status}`);
    const data = await response.json();
    const context = await loadRecommendationContext(env);
    return json(buildConditionModel(data, location, context), 200, { "cache-control": "private, no-store" });
  } catch (error) {
    return json({ error: "CONDITIONS_FAILED", message: error.message }, 502);
  }
}

async function bootstrap(env) {
  try {
    const [logs, spots, gear] = await Promise.all([
      env.DB.prepare("SELECT * FROM logs ORDER BY created_at DESC LIMIT 50").all(),
      env.DB.prepare("SELECT * FROM spots ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare("SELECT * FROM gear ORDER BY created_at DESC LIMIT 100").all()
    ]);

    return json({
      logs: logs.results,
      spots: spots.results,
      gear: gear.results
    });
  } catch (error) {
    return json({ error: "DB_BOOTSTRAP_FAILED", message: error.message }, 500);
  }
}

async function createLog(request, env) {
  try {
    const data = await request.json();
    const record = {
      id: crypto.randomUUID(),
      species: clean(data.species),
      size: clean(data.size),
      weight: clean(data.weight),
      spot: clean(data.spot),
      lure: clean(data.lure),
      date: clean(data.date),
      time: clean(data.time),
      image: "assets/catch-perch.png",
      note: clean(data.note)
    };

    if (!record.species) return json({ error: "species is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO logs (id, species, size, weight, spot, lure, date, time, image, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.id,
      record.species,
      record.size,
      record.weight,
      record.spot,
      record.lure,
      record.date,
      record.time,
      record.image,
      record.note
    ).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "LOG_CREATE_FAILED", message: error.message }, 500);
  }
}

async function createSpot(request, env) {
  try {
    const data = await request.json();
    const record = {
      id: crypto.randomUUID(),
      name: clean(data.name),
      water: clean(data.water),
      structure: clean(data.structure),
      target: clean(data.target),
      note: clean(data.note)
    };

    if (!record.name) return json({ error: "name is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO spots (id, name, water, structure, target, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(record.id, record.name, record.water, record.structure, record.target, record.note).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "SPOT_CREATE_FAILED", message: error.message }, 500);
  }
}

async function loadRecommendationContext(env) {
  if (!env?.DB) return { gear: [], logs: [], spots: [] };

  try {
    const [gear, logs, spots] = await Promise.all([
      env.DB.prepare("SELECT name, type, spec FROM gear ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare("SELECT lure FROM logs WHERE lure IS NOT NULL AND lure != '' ORDER BY created_at DESC LIMIT 50").all(),
      env.DB.prepare("SELECT name, target, structure FROM spots ORDER BY created_at DESC LIMIT 20").all()
    ]);
    return {
      gear: gear.results || [],
      logs: logs.results || [],
      spots: spots.results || []
    };
  } catch (error) {
    return { gear: [], logs: [], spots: [] };
  }
}

async function createGear(request, env) {
  try {
    const data = await request.json();
    const record = {
      id: crypto.randomUUID(),
      name: clean(data.name),
      type: clean(data.type),
      spec: clean(data.spec),
      note: clean(data.note)
    };

    if (!record.name) return json({ error: "name is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO gear (id, name, type, spec, note)
      VALUES (?, ?, ?, ?, ?)
    `).bind(record.id, record.name, record.type, record.spec, record.note).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "GEAR_CREATE_FAILED", message: error.message }, 500);
  }
}

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}

function resolveConditionLocation(request, url) {
  const queryLat = Number(url.searchParams.get("lat"));
  const queryLon = Number(url.searchParams.get("lon"));
  const hasQueryLocation = validCoordinate(queryLat, queryLon);

  if (hasQueryLocation) {
    return {
      lat: queryLat,
      lon: queryLon,
      source: "device",
      label: "GPS定位"
    };
  }

  const cf = request.cf || {};
  const cfLat = Number(cf.latitude);
  const cfLon = Number(cf.longitude);
  if (validCoordinate(cfLat, cfLon)) {
    const place = [cf.city, cf.region, cf.country].filter(Boolean).join(" · ");
    return {
      lat: cfLat,
      lon: cfLon,
      source: "network",
      label: place || "网络位置"
    };
  }

  return null;
}

function validCoordinate(lat, lon) {
  return Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;
}

function buildConditionModel(data, location, context = {}) {
  const { lat, lon } = location;
  const current = data.current || {};
  const hourly = data.hourly || {};
  const daily = data.daily || {};
  const currentTime = String(current.time || "");
  const hourIndex = findHourIndex(hourly.time || [], currentTime);

  const temp = num(current.temperature_2m, 24);
  const humidity = num(current.relative_humidity_2m, 68);
  const pressure = num(current.surface_pressure, 1008);
  const wind = num(current.wind_speed_10m, 6);
  const windDirection = num(current.wind_direction_10m, 135);
  const weatherCode = num(current.weather_code, 3);
  const cloud = num(current.cloud_cover, 60);
  const precipitation = num(current.precipitation, 0);
  const rainChance = pick(hourly.precipitation_probability, hourIndex, 20);
  const pressureNow = pick(hourly.pressure_msl, hourIndex, pressure);
  const pressurePast = pick(hourly.pressure_msl, Math.max(0, hourIndex - 3), pressureNow);
  const pressureDelta = pressureNow - pressurePast;
  const maxTemp = pick(daily.temperature_2m_max, 0, temp + 3);
  const minTemp = pick(daily.temperature_2m_min, 0, temp - 4);
  const waterTemp = estimateWaterTemp(temp, maxTemp, minTemp);
  const sunrise = String(pick(daily.sunrise, 0, ""));
  const sunset = String(pick(daily.sunset, 0, ""));
  const localHour = getHour(currentTime);

  const weatherScore = scoreWeather(weatherCode, rainChance, wind, cloud, precipitation);
  const waterScore = scoreWaterTemp(waterTemp);
  const oxygenScore = scoreOxygen(waterTemp, wind, humidity);
  const pressureScore = scorePressure(pressureNow, pressureDelta);
  const activityScore = scoreActivity(localHour, sunrise, sunset, weatherScore, pressureScore, wind);
  const score = Math.round(weightedAverage([
    [weatherScore, 0.22],
    [waterScore, 0.2],
    [oxygenScore, 0.18],
    [pressureScore, 0.18],
    [activityScore, 0.22]
  ]));

  const recommendation = personalizeRecommendation({
    lure: recommendLure(waterTemp, wind, weatherCode),
    color: recommendColor(cloud, weatherCode),
    weight: recommendWeight(wind),
    retrieve: recommendRetrieve(activityScore, waterTemp)
  }, context);

  return {
    location: {
      latitude: Number(lat.toFixed(5)),
      longitude: Number(lon.toFixed(5)),
      timezone: data.timezone || "auto",
      source: location.source,
      label: location.label
    },
    updatedAt: currentTime,
    score,
    description: scoreDescription(score),
    radar: [
      { key: "weather", label: "天气条件", value: Math.round(weatherScore) },
      { key: "water", label: "水温条件", value: Math.round(waterScore) },
      { key: "oxygen", label: "溶氧估算", value: Math.round(oxygenScore) },
      { key: "pressure", label: "气压趋势", value: Math.round(pressureScore) },
      { key: "activity", label: "活跃度预测", value: Math.round(activityScore) }
    ],
    weather: {
      summary: weatherText(weatherCode),
      tempRange: `${Math.round(minTemp)}~${Math.round(maxTemp)}°C`,
      wind: `${windDirectionText(windDirection)} ${windLevel(wind)}级`,
      pressure: `气压 ${Math.round(pressureNow)} hPa${pressureDeltaText(pressureDelta)}`,
      humidity: `湿度 ${Math.round(humidity)}%`,
      visibility: "Open-Meteo 实况",
      water: `水温估算 ${waterTemp.toFixed(1)}°C`,
      window: buildWindowLabel(sunrise, sunset)
    },
    recommendation,
    source: "Open-Meteo forecast; water temperature and dissolved oxygen are model estimates."
  };
}

function num(value, fallback) {
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function pick(list, index, fallback) {
  return Array.isArray(list) && list[index] != null ? list[index] : fallback;
}

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function findHourIndex(times, currentTime) {
  if (!Array.isArray(times) || !times.length) return 0;
  const key = currentTime.slice(0, 13);
  const exact = times.findIndex((time) => String(time).slice(0, 13) === key);
  return exact >= 0 ? exact : Math.floor(times.length / 2);
}

function getHour(time) {
  const match = String(time).match(/T(\d{2})/);
  return match ? Number(match[1]) : new Date().getHours();
}

function estimateWaterTemp(temp, maxTemp, minTemp) {
  const dailyMean = (maxTemp + minTemp) / 2;
  return Number((dailyMean * 0.68 + temp * 0.32 - 0.8).toFixed(1));
}

function scoreWeather(code, rainChance, wind, cloud, precipitation) {
  let score = 84;
  if ([0, 1, 2, 3].includes(code)) score += code === 0 ? -3 : 4;
  if ([45, 48].includes(code)) score -= 8;
  if (code >= 51 && code <= 67) score -= 10;
  if (code >= 80 && code <= 82) score -= 16;
  if (code >= 95) score -= 32;
  score -= Math.min(22, rainChance * 0.16 + precipitation * 5);
  score -= wind < 2 ? 6 : 0;
  score -= wind > 24 ? 22 : wind > 16 ? 10 : 0;
  score += cloud >= 35 && cloud <= 85 ? 5 : 0;
  return clamp(score);
}

function scoreWaterTemp(waterTemp) {
  if (waterTemp >= 18 && waterTemp <= 27) return clamp(92 - Math.abs(waterTemp - 23) * 2);
  if (waterTemp < 18) return clamp(92 - (18 - waterTemp) * 5);
  return clamp(92 - (waterTemp - 27) * 6);
}

function scoreOxygen(waterTemp, wind, humidity) {
  const tempPart = clamp(96 - Math.max(0, waterTemp - 20) * 3.2 - Math.max(0, 14 - waterTemp) * 2.2);
  const windPart = wind >= 4 && wind <= 16 ? 10 : wind > 22 ? -12 : -4;
  const humidityPart = humidity > 88 ? -6 : 2;
  return clamp(tempPart + windPart + humidityPart);
}

function scorePressure(pressure, delta) {
  let score = 86;
  score -= Math.abs(delta) * 8;
  if (pressure < 995 || pressure > 1030) score -= 10;
  if (delta < -0.3 && delta > -1.8) score += 5;
  return clamp(score);
}

function scoreActivity(hour, sunrise, sunset, weatherScore, pressureScore, wind) {
  const sunriseHour = getHour(sunrise);
  const sunsetHour = getHour(sunset);
  const windowBoost = Math.max(
    0,
    18 - Math.min(Math.abs(hour - sunriseHour), Math.abs(hour - sunsetHour)) * 6
  );
  const middayPenalty = hour >= 11 && hour <= 15 ? 7 : 0;
  const windBoost = wind >= 4 && wind <= 14 ? 5 : 0;
  return clamp(58 + windowBoost + (weatherScore - 70) * 0.22 + (pressureScore - 70) * 0.2 + windBoost - middayPenalty);
}

function weightedAverage(items) {
  return items.reduce((sum, [value, weight]) => sum + value * weight, 0);
}

function scoreDescription(score) {
  if (score >= 86) return "非常适合出钓";
  if (score >= 72) return "适合出钓";
  if (score >= 58) return "可尝试窗口期";
  return "建议谨慎出钓";
}

function weatherText(code) {
  const map = {
    0: "晴",
    1: "少云",
    2: "多云",
    3: "阴",
    45: "雾",
    48: "雾凇",
    51: "小毛毛雨",
    53: "毛毛雨",
    55: "较强毛毛雨",
    61: "小雨",
    63: "中雨",
    65: "大雨",
    80: "阵雨",
    81: "较强阵雨",
    82: "强阵雨",
    95: "雷暴"
  };
  return map[code] || "天气变化";
}

function windDirectionText(deg) {
  const dirs = ["北风", "东北风", "东风", "东南风", "南风", "西南风", "西风", "西北风"];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 45) % 8];
}

function windLevel(speedKmh) {
  const speedMs = speedKmh / 3.6;
  if (speedMs < 0.3) return 0;
  if (speedMs < 1.6) return 1;
  if (speedMs < 3.4) return 2;
  if (speedMs < 5.5) return 3;
  if (speedMs < 8) return 4;
  if (speedMs < 10.8) return 5;
  return 6;
}

function pressureDeltaText(delta) {
  if (Math.abs(delta) < 0.4) return " 稳定";
  return delta > 0 ? " 上升" : " 下降";
}

function buildWindowLabel(sunrise, sunset) {
  const start = String(sunrise).slice(11, 16);
  const end = String(sunset).slice(11, 16);
  if (!start || !end) return "适宜窗口 清晨/傍晚";
  return `窗口 ${start} / ${end}`;
}

function recommendLure(waterTemp, wind, code) {
  if (code >= 61 && code <= 82) return "VIB / 沉水铅笔";
  if (waterTemp < 16) return "小克重软虫";
  if (wind > 18) return "重心稳定米诺";
  return "米诺 (Minnow)";
}

function recommendColor(cloud, code) {
  if (code >= 61 || cloud > 80) return "亮片 / 高反差";
  if (cloud < 25) return "自然色系";
  return "银黑背";
}

function recommendWeight(wind) {
  if (wind > 18) return "14 ~ 18g";
  if (wind > 10) return "10 ~ 14g";
  return "7 ~ 12g";
}

function recommendRetrieve(activityScore, waterTemp) {
  if (activityScore >= 80) return "快慢结合抽停";
  if (waterTemp < 16) return "慢拖小跳";
  return "匀收穿插停顿";
}

function personalizeRecommendation(base, context) {
  const gear = Array.isArray(context.gear) ? context.gear : [];
  const logs = Array.isArray(context.logs) ? context.logs : [];
  const spots = Array.isArray(context.spots) ? context.spots : [];
  const recentSpot = spots[0] || {};
  const targetText = `${recentSpot.target || ""} ${recentSpot.structure || ""}`;
  const keywords = recommendationKeywords(base.lure, targetText);
  const lureGear = gear.filter(isLureGear);

  if (!lureGear.length) {
    return {
      ...base,
      lureMeta: "\u73af\u5883\u5339\u914d",
      basis: "\u57fa\u4e8e\u5f53\u524d\u73af\u5883"
    };
  }

  const historicalLures = logs.map((log) => String(log.lure || "").trim()).filter(Boolean);
  const selected = lureGear
    .map((item) => ({ item, score: scorePersonalLure(item, keywords, historicalLures) }))
    .sort((left, right) => right.score - left.score)[0].item;

  return {
    ...base,
    lure: selected.name || base.lure,
    lureMeta: selected.spec || "\u88c5\u5907\u5e93\u53ef\u7528",
    basis: recentSpot.name
      ? "\u7ed3\u5408\u88c5\u5907\u5e93\u3001\u5386\u53f2\u9c7c\u83b7\u4e0e\u6700\u8fd1\u6807\u70b9"
      : historicalLures.length
        ? "\u7ed3\u5408\u88c5\u5907\u5e93\u4e0e\u5386\u53f2\u9c7c\u83b7"
        : "\u7ed3\u5408\u4f60\u7684\u88c5\u5907\u5e93\u4e0e\u5f53\u524d\u73af\u5883"
  };
}

function isLureGear(item) {
  const type = String(item.type || item.category || "");
  const text = `${item.name || ""} ${item.spec || ""} ${type}`;
  return type === "\u62df\u9975" || /(\u7c73\u8bfa|VIB|\u8f6f\u866b|\u96f7\u86d9|\u94c5\u7b14|\u4eae\u7247|\u62df\u9975)/i.test(text);
}

function recommendationKeywords(baseLure, targetText) {
  const keywords = baseLure.includes("VIB")
    ? ["VIB", "\u6c89\u6c34", "\u94c5\u7b14"]
    : baseLure.includes("\u8f6f\u866b")
      ? ["\u8f6f\u866b", "\u96f7\u86d9"]
      : ["\u7c73\u8bfa", "Minnow", "\u94c5\u7b14"];

  if (/(\u7fd8\u5634|\u9cdc|\u9ce1)/.test(targetText)) keywords.unshift("VIB", "\u7c73\u8bfa");
  if (/(\u9ed1\u9c7c|\u8349\u9c7c)/.test(targetText) || /(\u8349|\u969c\u788d)/.test(targetText)) keywords.unshift("\u8f6f\u866b", "\u96f7\u86d9");
  return [...new Set(keywords)];
}

function scorePersonalLure(item, keywords, historicalLures) {
  const text = `${item.name || ""} ${item.spec || ""}`.toLowerCase();
  let score = 0;
  keywords.forEach((keyword, index) => {
    if (text.includes(keyword.toLowerCase())) score += 12 - Math.min(index, 8);
  });

  if (historicalLures.some((lure) => shareLureFamily(text, lure.toLowerCase()))) score += 10;
  return score;
}

function shareLureFamily(left, right) {
  return ["\u7c73\u8bfa", "vib", "\u8f6f\u866b", "\u96f7\u86d9", "\u94c5\u7b14", "\u4eae\u7247"].some(
    (keyword) => left.includes(keyword) && right.includes(keyword)
  );
}

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...jsonHeaders, ...headers }
  });
}
