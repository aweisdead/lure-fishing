const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      return login(request, env);
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") {
      return logout();
    }

    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      return session(request, env);
    }

    if (url.pathname.startsWith("/api/") && !await hasValidSession(request, env)) {
      return json({ error: "UNAUTHORIZED" }, 401, { "cache-control": "no-store" });
    }

    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      return bootstrap(env);
    }

    if (url.pathname === "/api/conditions" && request.method === "GET") {
      return conditions(request, url, env);
    }

    if (url.pathname === "/api/data/export" && request.method === "GET") {
      return exportData(env);
    }

    if (url.pathname === "/api/data/restore" && request.method === "POST") {
      return restoreData(request, env);
    }

    if (url.pathname === "/api/logs" && request.method === "GET") {
      return listLogs(url, env);
    }

    if (url.pathname === "/api/log-photos" && request.method === "GET") {
      return getCatchPhoto(url, env);
    }

    if (url.pathname === "/api/log-photos" && request.method === "POST") {
      return uploadCatchPhoto(request, url, env);
    }

    if (url.pathname === "/api/log-photos" && request.method === "DELETE") {
      return deleteCatchPhoto(url, env);
    }

    if (url.pathname === "/api/analytics" && request.method === "GET") {
      return analytics(url, env);
    }

    if (url.pathname === "/api/logs" && request.method === "POST") {
      return createLog(request, env);
    }

    if (url.pathname === "/api/logs" && request.method === "PUT") {
      return updateLog(request, env);
    }

    if (url.pathname === "/api/sessions" && request.method === "POST") {
      return createSession(request, env);
    }

    if (url.pathname === "/api/sessions" && request.method === "PUT") {
      return updateSession(request, env);
    }

    if (url.pathname === "/api/sessions/review" && request.method === "PUT") {
      return updateSessionReview(request, env);
    }

    if (url.pathname === "/api/sessions" && request.method === "DELETE") {
      return archiveSession(request, env);
    }

    if (url.pathname === "/api/spots" && request.method === "POST") {
      return createSpot(request, env);
    }

    if (url.pathname === "/api/logs" && request.method === "DELETE") {
      return deleteRecord(request, env, "logs", "LOG_DELETE_FAILED");
    }

    if (url.pathname === "/api/spots" && request.method === "PUT") {
      return updateSpot(request, env);
    }

    if (url.pathname === "/api/spots" && request.method === "DELETE") {
      return archiveRecord(request, env, "spots", "SPOT_ARCHIVE_FAILED");
    }

    if (url.pathname === "/api/gear" && request.method === "POST") {
      return createGear(request, env);
    }

    if (url.pathname === "/api/gear" && request.method === "PUT") {
      return updateGear(request, env);
    }

    if (url.pathname === "/api/gear" && request.method === "DELETE") {
      return archiveRecord(request, env, "gear", "GEAR_ARCHIVE_FAILED");
    }

    return env.ASSETS.fetch(request);
  }
};

const SESSION_COOKIE = "lure_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_CATCH_PHOTO_BYTES = 800 * 1024;
const ALLOWED_CATCH_PHOTO_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

async function login(request, env) {
  if (!authConfigured(env)) {
    return json({ error: "AUTH_NOT_CONFIGURED" }, 503);
  }

  try {
    const data = await request.json();
    const password = String(data.password || "");
    if (!password || !(await verifyPassword(password, env))) {
      return json({ error: "INVALID_PASSWORD" }, 401, { "cache-control": "no-store" });
    }

    const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = `${expiresAt}.${randomToken(18)}`;
    const signature = await sign(payload, env.AUTH_SESSION_SECRET);
    const cookie = [
      `${SESSION_COOKIE}=${payload}.${signature}`,
      "Path=/",
      "HttpOnly",
      "Secure",
      "SameSite=Lax",
      `Max-Age=${SESSION_TTL_SECONDS}`
    ].join("; ");

    return json({ authenticated: true }, 200, {
      "cache-control": "no-store",
      "set-cookie": cookie
    });
  } catch (error) {
    return json({ error: "LOGIN_FAILED", message: error.message }, 400);
  }
}

function logout() {
  return json({ authenticated: false }, 200, {
    "cache-control": "no-store",
    "set-cookie": `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  });
}

async function session(request, env) {
  if (!authConfigured(env)) {
    return json({ error: "AUTH_NOT_CONFIGURED" }, 503);
  }
  const authenticated = await hasValidSession(request, env);
  return json({ authenticated }, authenticated ? 200 : 401, { "cache-control": "no-store" });
}

function authConfigured(env) {
  return Boolean(((env?.AUTH_PASSWORD_TOKEN && env?.AUTH_PASSWORD_PEPPER) || env?.AUTH_PASSWORD_HASH) && env?.AUTH_SESSION_SECRET);
}

async function hasValidSession(request, env) {
  if (!authConfigured(env)) return false;

  const cookies = parseCookies(request.headers.get("cookie") || "");
  const value = cookies[SESSION_COOKIE] || "";
  const parts = value.split(".");
  if (parts.length !== 3) return false;

  const expiresAt = Number(parts[0]);
  if (!Number.isFinite(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;

  const payload = `${parts[0]}.${parts[1]}`;
  return verifySignature(payload, parts[2], env.AUTH_SESSION_SECRET);
}

function parseCookies(header) {
  return Object.fromEntries(header.split(";").map((part) => {
    const index = part.indexOf("=");
    if (index < 0) return ["", ""];
    return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
  }).filter(([key]) => key));
}

async function verifyPassword(password, env) {
  if (env.AUTH_PASSWORD_TOKEN && env.AUTH_PASSWORD_PEPPER) {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(env.AUTH_PASSWORD_PEPPER), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const token = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(password));
    return constantTimeEqual(new Uint8Array(token), decodeBase64Url(env.AUTH_PASSWORD_TOKEN));
  }

  const encodedHash = env.AUTH_PASSWORD_HASH;
  const [scheme, iterationsText, saltText, expectedText] = String(encodedHash || "").trim().split("$");
  const iterations = Number(iterationsText);
  if (scheme !== "pbkdf2" || !Number.isInteger(iterations) || iterations < 100000 || !saltText || !expectedText) return false;

  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({
    name: "PBKDF2",
    salt: decodeBase64Url(saltText),
    iterations,
    hash: "SHA-256"
  }, key, 256);
  return constantTimeEqual(new Uint8Array(bits), decodeBase64Url(expectedText));
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

async function verifySignature(value, signature, secret) {
  try {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
    return crypto.subtle.verify("HMAC", key, decodeBase64Url(signature), new TextEncoder().encode(value));
  } catch (error) {
    return false;
  }
}

function constantTimeEqual(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) result |= left[index] ^ right[index];
  return result === 0;
}

function randomToken(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return encodeBase64Url(bytes);
}

function encodeBase64Url(bytes) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

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
    const [context, place] = await Promise.all([
      loadRecommendationContext(env),
      reverseGeocode(location, env)
    ]);
    const model = buildConditionModel(data, location, context);
    model.location.place = place;
    return json(model, 200, { "cache-control": "private, no-store" });
  } catch (error) {
    return json({ error: "CONDITIONS_FAILED", message: error.message }, 502);
  }
}

async function bootstrap(env) {
  try {
    const [logPage, spots, gear, sessions] = await Promise.all([
      getLogPage(env, { limit: 50 }),
      env.DB.prepare("SELECT * FROM spots WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare("SELECT * FROM gear WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare("SELECT * FROM fishing_sessions WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100").all()
    ]);

    return json({
      logs: logPage.items,
      log_page: { total: logPage.total, next_cursor: logPage.nextCursor },
      spots: spots.results,
      gear: gear.results,
      sessions: sessions.results
    });
  } catch (error) {
    return json({ error: "DB_BOOTSTRAP_FAILED", message: error.message }, 500);
  }
}

function parseListLimit(value, fallback = 50) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? Math.max(10, Math.min(parsed, 100)) : fallback;
}

function parseLogCursor(value) {
  const cursor = String(value || "");
  const separator = cursor.lastIndexOf("|");
  if (separator < 1) return null;
  const createdAt = cursor.slice(0, separator);
  const id = cursor.slice(separator + 1);
  return createdAt && id ? { createdAt, id } : null;
}

function buildLogFilters(url) {
  const where = [];
  const params = [];
  const add = (sql, ...values) => {
    where.push(sql);
    params.push(...values);
  };
  const species = clean(url.searchParams.get("species"));
  const gearId = clean(url.searchParams.get("gear_id"));
  const lureName = clean(url.searchParams.get("lure_name"));
  const spotId = clean(url.searchParams.get("spot_id"));
  const sessionId = clean(url.searchParams.get("session_id"));
  const dateFrom = clean(url.searchParams.get("date_from"));
  const dateTo = clean(url.searchParams.get("date_to"));
  if (species) add("species = ?", species);
  if (gearId === "none") add("COALESCE(gear_id, '') = '' AND COALESCE(rod_id, '') = '' AND COALESCE(reel_id, '') = ''");
  else if (gearId) add("(gear_id = ? OR rod_id = ? OR reel_id = ?)", gearId, gearId, gearId);
  if (lureName === "none") add("COALESCE(lure_name, '') = '' AND COALESCE(lure, '') = ''");
  else if (lureName) add("lure_name = ?", lureName);
  if (spotId === "none") add("COALESCE(spot_id, '') = ''");
  else if (spotId) add("spot_id = ?", spotId);
  if (sessionId === "none") add("COALESCE(session_id, '') = ''");
  else if (sessionId) add("session_id = ?", sessionId);
  if (dateFrom) add("date >= ?", dateFrom);
  if (dateTo) add("date <= ?", dateTo);
  return { where, params };
}

async function getLogPage(env, options = {}) {
  const { where, params } = options.url ? buildLogFilters(options.url) : { where: [], params: [] };
  const cursor = parseLogCursor(options.cursor);
  if (cursor) {
    where.push("(created_at < ? OR (created_at = ? AND id < ?))");
    params.push(cursor.createdAt, cursor.createdAt, cursor.id);
  }
  const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const countWhere = where.filter((item) => !item.startsWith("(created_at <"));
  const countParams = cursor ? params.slice(0, -3) : params;
  const limit = parseListLimit(options.limit, 50);
  const listStatement = env.DB.prepare(`SELECT * FROM logs ${clause} ORDER BY created_at DESC, id DESC LIMIT ?`).bind(...params, limit + 1);
  const countStatement = env.DB.prepare(`SELECT COUNT(*) AS total FROM logs ${countWhere.length ? `WHERE ${countWhere.join(" AND ")}` : ""}`);
  const [rows, count] = await Promise.all([
    listStatement.all(),
    (countParams.length ? countStatement.bind(...countParams) : countStatement).first()
  ]);
  const results = rows.results || [];
  const hasMore = results.length > limit;
  const items = results.slice(0, limit).map(normalizeCatchImage);
  const last = items.at(-1);
  return {
    items,
    total: Number(count?.total || 0),
    nextCursor: hasMore && last ? `${last.created_at}|${last.id}` : null
  };
}

async function listLogs(url, env) {
  try {
    const page = await getLogPage(env, { url, cursor: url.searchParams.get("cursor"), limit: url.searchParams.get("limit") });
    return json({ logs: page.items, total: page.total, next_cursor: page.nextCursor }, 200, { "cache-control": "no-store" });
  } catch (error) {
    return json({ error: "LOG_LIST_FAILED", message: error.message }, 500);
  }
}

async function getCatchPhoto(url, env) {
  try {
    const id = clean(url.searchParams.get("id"));
    if (!id) return json({ error: "id is required" }, 400);

    const photo = await env.DB.prepare("SELECT content_type, data, byte_size FROM catch_photos WHERE id = ?").bind(id).first();
    if (!photo?.data) return json({ error: "NOT_FOUND" }, 404);
    const bytes = asPhotoBytes(photo.data);
    if (!bytes.byteLength) return json({ error: "EMPTY_STORED_IMAGE" }, 500);
    return new Response(bytes, {
      headers: {
        "content-type": photo.content_type,
        "cache-control": "private, no-store",
        "vary": "Cookie",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    return json({ error: "LOG_PHOTO_FETCH_FAILED", message: error.message }, 500);
  }
}

function asPhotoBytes(value) {
  if (value instanceof ArrayBuffer) return new Uint8Array(value);
  if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
  if (Array.isArray(value)) return Uint8Array.from(value);
  throw new Error("Unexpected image data type");
}

async function uploadCatchPhoto(request, url, env) {
  try {
    const logId = clean(url.searchParams.get("log_id"));
    const contentType = clean(request.headers.get("content-type")).toLowerCase().split(";")[0];
    if (!logId) return json({ error: "log_id is required" }, 400);
    if (!ALLOWED_CATCH_PHOTO_TYPES.has(contentType)) return json({ error: "UNSUPPORTED_IMAGE_TYPE" }, 415);

    const log = await env.DB.prepare("SELECT id FROM logs WHERE id = ?").bind(logId).first();
    if (!log) return json({ error: "LOG_NOT_FOUND" }, 404);

    const data = await request.arrayBuffer();
    if (!data.byteLength) return json({ error: "EMPTY_IMAGE" }, 400);
    if (data.byteLength > MAX_CATCH_PHOTO_BYTES) return json({ error: "IMAGE_TOO_LARGE", max_bytes: MAX_CATCH_PHOTO_BYTES }, 413);

    const photoId = crypto.randomUUID();
    await env.DB.batch([
      env.DB.prepare(`
        INSERT INTO catch_photos (id, log_id, content_type, data, byte_size)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(log_id) DO UPDATE SET
          id = excluded.id,
          content_type = excluded.content_type,
          data = excluded.data,
          byte_size = excluded.byte_size,
          updated_at = CURRENT_TIMESTAMP
      `).bind(photoId, logId, contentType, new Uint8Array(data), data.byteLength),
      env.DB.prepare("UPDATE logs SET photo_id = ? WHERE id = ?").bind(photoId, logId)
    ]);

    return json({ id: photoId, log_id: logId, image: `/api/log-photos?id=${encodeURIComponent(photoId)}&v=2` }, 201);
  } catch (error) {
    return json({ error: "LOG_PHOTO_UPLOAD_FAILED", message: error.message }, 500);
  }
}

async function deleteCatchPhoto(url, env) {
  try {
    const logId = clean(url.searchParams.get("log_id"));
    if (!logId) return json({ error: "log_id is required" }, 400);

    const results = await env.DB.batch([
      env.DB.prepare("DELETE FROM catch_photos WHERE log_id = ?").bind(logId),
      env.DB.prepare("UPDATE logs SET photo_id = NULL WHERE id = ?").bind(logId)
    ]);
    if (!results[1]?.meta?.changes) return json({ error: "LOG_NOT_FOUND" }, 404);
    return json({ log_id: logId, deleted: Boolean(results[0]?.meta?.changes) });
  } catch (error) {
    return json({ error: "LOG_PHOTO_DELETE_FAILED", message: error.message }, 500);
  }
}

function analyticsRank(rows, getLabel) {
  const counts = new Map();
  rows.forEach((row) => {
    const label = clean(getLabel(row));
    if (!label) return;
    counts.set(label, (counts.get(label) || 0) + 1);
  });
  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "zh-CN"));
}

function analyticsTrend(rows, getLabel) {
  return analyticsRank(rows, getLabel).sort((left, right) => left.label.localeCompare(right.label));
}

function analyticsNumber(value, type) {
  const text = clean(value).toLowerCase();
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  if (!Number.isFinite(number)) return null;
  if (type === "weight" && /(?:^|\d)g\b/.test(text) && !/kg/.test(text)) return number / 1000;
  if (type === "size" && /(?:^|\d)m\b/.test(text) && !/cm/.test(text)) return number * 100;
  return number;
}

function analyticsLargest(rows, field, type) {
  return rows.reduce((largest, row) => {
    const stored = type === "size" ? Number(row.length_cm) : Number(row.weight_g) / 1000;
    const value = Number.isFinite(stored) && stored > 0 ? stored : analyticsNumber(row[field], type);
    return value != null && (!largest || value > largest.value) ? { row, value } : largest;
  }, null)?.row || null;
}

function analyticsTimeWindow(row) {
  const match = clean(row.time).match(/^(\d{1,2}):/);
  if (!match) return "";
  const hour = Number(match[1]);
  if (!Number.isFinite(hour)) return "";
  if (hour >= 5 && hour < 9) return "早口 05-09";
  if (hour >= 9 && hour < 17) return "日间 09-17";
  if (hour >= 17 && hour < 21) return "晚口 17-21";
  return "夜间 21-05";
}

async function analytics(url, env) {
  try {
    const year = clean(url.searchParams.get("year"));
    const hasYear = /^\d{4}$/.test(year);
    const where = hasYear ? "WHERE date >= ? AND date < ?" : "";
    const params = hasYear ? [year, `${Number(year) + 1}`] : [];
    const logsStatement = env.DB.prepare(`SELECT species, size, weight, length_cm, weight_g, spot_id, spot_name_snapshot, session_id, lure, lure_name, gear_id, gear_name_snapshot, rod_id, rod_name_snapshot, reel_id, reel_name_snapshot, date, time FROM logs ${where}`);
    const [logsResult, yearsResult] = await Promise.all([
      (params.length ? logsStatement.bind(...params) : logsStatement).all(),
      env.DB.prepare("SELECT DISTINCT substr(date, 1, 4) AS year FROM logs WHERE length(date) >= 4 ORDER BY year DESC").all()
    ]);
    const logs = logsResult.results || [];
    const species = analyticsRank(logs, (row) => row.species);
    const lures = analyticsRank(logs, (row) => row.lure_name || row.lure);
    const spots = analyticsRank(logs, (row) => row.spot_id ? row.spot_name_snapshot : "");
    const gear = analyticsRank(logs.flatMap((row) => {
      const entries = [
        [row.rod_id, row.rod_name_snapshot],
        [row.reel_id, row.reel_name_snapshot],
        [row.gear_id, row.gear_name_snapshot]
      ];
      return [...new Map(entries.filter(([id]) => id).map(([id, label]) => [id, { label }])).values()];
    }), (row) => row.label);
    const timeWindows = analyticsRank(logs, analyticsTimeWindow);
    const monthlyTrend = analyticsTrend(logs, (row) => String(row.date || "").match(/^\d{4}-\d{2}/)?.[0]).slice(-12);
    const allYearTrend = hasYear
      ? await env.DB.prepare("SELECT substr(date, 1, 4) AS year, COUNT(*) AS count FROM logs WHERE length(date) >= 4 GROUP BY year ORDER BY year").all()
      : null;
    const yearlyTrend = allYearTrend
      ? (allYearTrend.results || []).map((row) => ({ label: row.year, count: Number(row.count || 0) }))
      : analyticsTrend(logs, (row) => String(row.date || "").match(/^\d{4}/)?.[0]);
    return json({
      years: (yearsResult.results || []).map((row) => row.year).filter(Boolean),
      total: logs.length,
      species,
      lures,
      spots,
      gear,
      time_windows: timeWindows,
      session_count: new Set(logs.map((row) => clean(row.session_id)).filter(Boolean)).size,
      spot_count: new Set(logs.map((row) => clean(row.spot_id)).filter(Boolean)).size,
      largest_size: analyticsLargest(logs, "size", "size"),
      largest_weight: analyticsLargest(logs, "weight", "weight"),
      monthly_trend: monthlyTrend,
      yearly_trend: yearlyTrend
    }, 200, { "cache-control": "no-store" });
  } catch (error) {
    return json({ error: "ANALYTICS_FAILED", message: error.message }, 500);
  }
}

async function exportData(env) {
  try {
    const [logs, spots, gear, sessions] = await Promise.all([
      env.DB.prepare("SELECT * FROM logs ORDER BY created_at ASC").all(),
      env.DB.prepare("SELECT * FROM spots ORDER BY created_at ASC").all(),
      env.DB.prepare("SELECT * FROM gear ORDER BY created_at ASC").all(),
      env.DB.prepare("SELECT * FROM fishing_sessions ORDER BY created_at ASC").all()
    ]);
    const exportedAt = new Date().toISOString();
    const backupLogs = (logs.results || []).map(({ photo_id, ...log }) => log);
    return json({
      version: 1,
      app: "Lure Assistant",
      exported_at: exportedAt,
      data: {
        logs: backupLogs,
        spots: spots.results || [],
        gear: gear.results || [],
        sessions: sessions.results || []
      }
    }, 200, {
      "cache-control": "no-store",
      "content-disposition": `attachment; filename="lure-assistant-backup-${exportedAt.slice(0, 10)}.json"`
    });
  } catch (error) {
    return json({ error: "DATA_EXPORT_FAILED", message: error.message }, 500);
  }
}

const BACKUP_LIMITS = { logs: 5000, spots: 1000, gear: 1000, sessions: 1000 };

function backupRows(input, key) {
  const rows = input?.data?.[key];
  if (!Array.isArray(rows) || rows.length > BACKUP_LIMITS[key]) throw new Error(`Invalid ${key} backup data`);
  return rows;
}

function backupId(value) {
  return clean(value).slice(0, 120) || crypto.randomUUID();
}

function backupTimestamp(value) {
  return clean(value).slice(0, 80) || new Date().toISOString();
}

function backupSnapshot(value) {
  if (!value) return null;
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return JSON.stringify(parsed).slice(0, 16000);
  } catch (error) {
    return null;
  }
}

function normalizeBackupData(input) {
  if (!input || typeof input !== "object" || Number(input.version) !== 1) throw new Error("Unsupported backup file");
  const logs = backupRows(input, "logs").map((row) => {
    const species = clean(row?.species);
    if (!species) throw new Error("Backup contains a catch without species");
    return {
      id: backupId(row.id), species, size: clean(row.size), weight: clean(row.weight), length_cm: parseLengthCm(row.length_cm ?? row.size), weight_g: parseWeightG(row.weight_g ?? row.weight), spot: clean(row.spot),
      spot_id: clean(row.spot_id), session_id: clean(row.session_id), lure: clean(row.lure), lure_name: clean(row.lure_name),
      lure_weight: clean(row.lure_weight), gear_id: clean(row.gear_id), rod_id: clean(row.rod_id), reel_id: clean(row.reel_id),
      spot_name_snapshot: clean(row.spot_name_snapshot), session_name_snapshot: clean(row.session_name_snapshot),
      gear_name_snapshot: clean(row.gear_name_snapshot), rod_name_snapshot: clean(row.rod_name_snapshot), reel_name_snapshot: clean(row.reel_name_snapshot),
      date: clean(row.date), time: clean(row.time), image: catchImageForSpecies(species), note: clean(row.note),
      condition_snapshot: backupSnapshot(row.condition_snapshot),
      condition_latitude: parseCoordinate(row.condition_latitude, -90, 90),
      condition_longitude: parseCoordinate(row.condition_longitude, -180, 180),
      condition_place: clean(row.condition_place).slice(0, 200), condition_source: clean(row.condition_source).slice(0, 40),
      condition_accuracy: parseAccuracy(row.condition_accuracy), condition_score: parseScore(row.condition_score),
      created_at: backupTimestamp(row.created_at)
    };
  });
  const spots = backupRows(input, "spots").map((row) => ({
    id: backupId(row?.id), name: clean(row?.name), water: clean(row?.water), structure: clean(row?.structure),
    target: clean(row?.target), note: clean(row?.note), status: normalizeSpotStatus(row?.status), latitude: parseCoordinate(row?.latitude, -90, 90),
    longitude: parseCoordinate(row?.longitude, -180, 180), accuracy: parseAccuracy(row?.accuracy), created_at: backupTimestamp(row?.created_at)
  }));
  const gear = backupRows(input, "gear").map((row) => ({
    id: backupId(row?.id), name: clean(row?.name), type: clean(row?.type), spec: clean(row?.spec),
    weight_options: clean(row?.weight_options), note: clean(row?.note), created_at: backupTimestamp(row?.created_at)
  }));
  const sessions = backupRows(input, "sessions").map((row) => ({
    id: backupId(row?.id), name: clean(row?.name), started_at: clean(row?.started_at), ended_at: clean(row?.ended_at),
    spot_id: clean(row?.spot_id), note: clean(row?.note), outcome: normalizeSessionOutcome(row?.outcome), review_note: clean(row?.review_note), condition_snapshot: backupSnapshot(row?.condition_snapshot),
    condition_latitude: parseCoordinate(row?.condition_latitude, -90, 90), condition_longitude: parseCoordinate(row?.condition_longitude, -180, 180),
    condition_place: clean(row?.condition_place).slice(0, 200), condition_source: clean(row?.condition_source).slice(0, 40),
    condition_accuracy: parseAccuracy(row?.condition_accuracy), condition_score: parseScore(row?.condition_score), created_at: backupTimestamp(row?.created_at)
  }));

  if (spots.some((row) => !row.name) || gear.some((row) => !row.name) || sessions.some((row) => !row.name)) {
    throw new Error("Backup contains an unnamed record");
  }
  const spotNames = new Map(spots.map((row) => [row.id, row.name]));
  const sessionNames = new Map(sessions.map((row) => [row.id, row.name]));
  const gearNames = new Map(gear.map((row) => [row.id, row.name]));
  logs.forEach((row) => {
    row.spot_name_snapshot ||= spotNames.get(row.spot_id) || row.spot;
    row.session_name_snapshot ||= sessionNames.get(row.session_id) || "";
    row.gear_name_snapshot ||= gearNames.get(row.gear_id) || "";
    row.rod_name_snapshot ||= gearNames.get(row.rod_id) || "";
    row.reel_name_snapshot ||= gearNames.get(row.reel_id) || "";
  });
  return { logs, spots, gear, sessions };
}

async function runD1Batches(db, statements) {
  // D1 rolls back the complete batch when any statement fails, so a restore never leaves a partial dataset.
  await db.batch(statements);
}

async function restoreData(request, env) {
  try {
    const input = await request.json();
    const data = normalizeBackupData(input);
    const statements = [
      env.DB.prepare("DELETE FROM catch_photos"),
      env.DB.prepare("DELETE FROM logs"),
      env.DB.prepare("DELETE FROM fishing_sessions"),
      env.DB.prepare("DELETE FROM spots"),
      env.DB.prepare("DELETE FROM gear")
    ];

    data.gear.forEach((row) => statements.push(env.DB.prepare(`
      INSERT INTO gear (id, name, type, spec, weight_options, note, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(row.id, row.name, row.type, row.spec, row.weight_options, row.note, row.created_at)));
    data.spots.forEach((row) => statements.push(env.DB.prepare(`
      INSERT INTO spots (id, name, water, structure, target, note, status, latitude, longitude, accuracy, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(row.id, row.name, row.water, row.structure, row.target, row.note, row.status, row.latitude, row.longitude, row.accuracy, row.created_at)));
    data.sessions.forEach((row) => statements.push(env.DB.prepare(`
      INSERT INTO fishing_sessions (id, name, started_at, ended_at, spot_id, note, outcome, review_note, condition_snapshot, condition_latitude, condition_longitude, condition_place, condition_source, condition_accuracy, condition_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(row.id, row.name, row.started_at, row.ended_at, row.spot_id, row.note, row.outcome, row.review_note, row.condition_snapshot, row.condition_latitude, row.condition_longitude, row.condition_place, row.condition_source, row.condition_accuracy, row.condition_score, row.created_at)));
    data.logs.forEach((row) => statements.push(env.DB.prepare(`
      INSERT INTO logs (id, species, size, weight, length_cm, weight_g, spot, spot_id, session_id, lure, lure_name, lure_weight, gear_id, rod_id, reel_id, spot_name_snapshot, session_name_snapshot, gear_name_snapshot, rod_name_snapshot, reel_name_snapshot, date, time, image, note, condition_snapshot, condition_latitude, condition_longitude, condition_place, condition_source, condition_accuracy, condition_score, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(row.id, row.species, row.size, row.weight, row.length_cm, row.weight_g, row.spot, row.spot_id, row.session_id, row.lure, row.lure_name, row.lure_weight, row.gear_id, row.rod_id, row.reel_id, row.spot_name_snapshot, row.session_name_snapshot, row.gear_name_snapshot, row.rod_name_snapshot, row.reel_name_snapshot, row.date, row.time, row.image, row.note, row.condition_snapshot, row.condition_latitude, row.condition_longitude, row.condition_place, row.condition_source, row.condition_accuracy, row.condition_score, row.created_at)));

    await runD1Batches(env.DB, statements);
    return json({ restored: true, counts: Object.fromEntries(Object.entries(data).map(([key, rows]) => [key, rows.length])) });
  } catch (error) {
    return json({ error: "DATA_RESTORE_FAILED", message: error.message }, 400);
  }
}

async function createLog(request, env) {
  try {
    const data = await request.json();
    const species = clean(data.species);
    const lureName = clean(data.lure_name);
    const lureWeight = clean(data.lure_weight);
    const rodId = clean(data.rod_id);
    const reelId = clean(data.reel_id);
    const sessionId = clean(data.session_id);
    const condition = normalizeConditionSnapshot(data.condition_snapshot);
    const record = {
      id: crypto.randomUUID(),
      species,
      size: clean(data.size),
      weight: clean(data.weight),
      length_cm: parseLengthCm(data.length_cm ?? data.size),
      weight_g: parseWeightG(data.weight_g ?? data.weight),
      spot: clean(data.spot),
      spot_id: clean(data.spot_id),
      session_id: sessionId,
      lure: [lureName, lureWeight].filter(Boolean).join(" ") || clean(data.lure),
      lure_name: lureName,
      lure_weight: lureWeight,
      gear_id: clean(data.gear_id) || rodId || reelId,
      rod_id: rodId,
      reel_id: reelId,
      date: clean(data.date),
      time: clean(data.time),
      image: catchImageForSpecies(species),
      note: clean(data.note),
      condition_snapshot: condition.json,
      condition_latitude: condition.latitude,
      condition_longitude: condition.longitude,
      condition_place: condition.place,
      condition_source: condition.source,
      condition_accuracy: condition.accuracy,
      condition_score: condition.score
    };

    if (!record.species) return json({ error: "species is required" }, 400);
    Object.assign(record, await getLogReferenceSnapshots(env, record));

    await env.DB.prepare(`
      INSERT INTO logs (id, species, size, weight, length_cm, weight_g, spot, spot_id, session_id, lure, lure_name, lure_weight, gear_id, rod_id, reel_id, spot_name_snapshot, session_name_snapshot, gear_name_snapshot, rod_name_snapshot, reel_name_snapshot, date, time, image, note, condition_snapshot, condition_latitude, condition_longitude, condition_place, condition_source, condition_accuracy, condition_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.id,
      record.species,
      record.size,
      record.weight,
      record.length_cm,
      record.weight_g,
      record.spot,
      record.spot_id,
      record.session_id,
      record.lure,
      record.lure_name,
      record.lure_weight,
      record.gear_id,
      record.rod_id,
      record.reel_id,
      record.spot_name_snapshot,
      record.session_name_snapshot,
      record.gear_name_snapshot,
      record.rod_name_snapshot,
      record.reel_name_snapshot,
      record.date,
      record.time,
      record.image,
      record.note,
      record.condition_snapshot,
      record.condition_latitude,
      record.condition_longitude,
      record.condition_place,
      record.condition_source,
      record.condition_accuracy,
      record.condition_score
    ).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "LOG_CREATE_FAILED", message: error.message }, 500);
  }
}

async function createSession(request, env) {
  try {
    const data = await request.json();
    const condition = normalizeConditionSnapshot(data.condition_snapshot);
    const record = {
      id: crypto.randomUUID(),
      name: clean(data.name),
      started_at: clean(data.started_at),
      ended_at: clean(data.ended_at),
      spot_id: clean(data.spot_id),
      note: clean(data.note),
      condition_snapshot: condition.json,
      condition_latitude: condition.latitude,
      condition_longitude: condition.longitude,
      condition_place: condition.place,
      condition_source: condition.source,
      condition_accuracy: condition.accuracy,
      condition_score: condition.score
    };

    if (!record.name) return json({ error: "name is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO fishing_sessions (id, name, started_at, ended_at, spot_id, note, condition_snapshot, condition_latitude, condition_longitude, condition_place, condition_source, condition_accuracy, condition_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.id,
      record.name,
      record.started_at,
      record.ended_at,
      record.spot_id,
      record.note,
      record.condition_snapshot,
      record.condition_latitude,
      record.condition_longitude,
      record.condition_place,
      record.condition_source,
      record.condition_accuracy,
      record.condition_score
    ).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "SESSION_CREATE_FAILED", message: error.message }, 500);
  }
}

async function updateSession(request, env) {
  try {
    const data = await request.json();
    const id = clean(new URL(request.url).searchParams.get("id"));
    const record = {
      id,
      name: clean(data.name),
      started_at: clean(data.started_at),
      ended_at: clean(data.ended_at),
      spot_id: clean(data.spot_id),
      note: clean(data.note)
    };

    if (!id) return json({ error: "id is required" }, 400);
    if (!record.name) return json({ error: "name is required" }, 400);

    const result = await env.DB.prepare(`
      UPDATE fishing_sessions
      SET name = ?, started_at = ?, ended_at = ?, spot_id = ?, note = ?
      WHERE id = ?
    `).bind(
      record.name,
      record.started_at,
      record.ended_at,
      record.spot_id,
      record.note,
      record.id
    ).run();

    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json(record);
  } catch (error) {
    return json({ error: "SESSION_UPDATE_FAILED", message: error.message }, 500);
  }
}

async function updateSessionReview(request, env) {
  try {
    const data = await request.json();
    const id = clean(new URL(request.url).searchParams.get("id"));
    const record = {
      id,
      outcome: normalizeSessionOutcome(data.outcome),
      review_note: clean(data.review_note)
    };

    if (!id) return json({ error: "id is required" }, 400);
    const result = await env.DB.prepare(`
      UPDATE fishing_sessions
      SET outcome = ?, review_note = ?
      WHERE id = ?
    `).bind(record.outcome, record.review_note, record.id).run();

    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json(record);
  } catch (error) {
    return json({ error: "SESSION_REVIEW_UPDATE_FAILED", message: error.message }, 500);
  }
}

async function archiveSession(request, env) {
  try {
    const id = clean(new URL(request.url).searchParams.get("id"));
    if (!id) return json({ error: "id is required" }, 400);

    const result = await env.DB.prepare("UPDATE fishing_sessions SET archived_at = CURRENT_TIMESTAMP WHERE id = ? AND archived_at IS NULL").bind(id).run();
    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json({ id, archived: true });
  } catch (error) {
    return json({ error: "SESSION_ARCHIVE_FAILED", message: error.message }, 500);
  }
}

async function createSpot(request, env) {
  try {
    const data = await request.json();
    const latitude = parseCoordinate(data.latitude, -90, 90);
    const longitude = parseCoordinate(data.longitude, -180, 180);
    const accuracy = parseAccuracy(data.accuracy);
    const record = {
      id: crypto.randomUUID(),
      name: clean(data.name),
      water: clean(data.water),
      structure: clean(data.structure),
      target: clean(data.target),
      note: clean(data.note),
      status: normalizeSpotStatus(data.status),
      latitude,
      longitude,
      accuracy: latitude != null && longitude != null ? accuracy : null
    };

    if (!record.name) return json({ error: "name is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO spots (id, name, water, structure, target, note, status, latitude, longitude, accuracy)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.id,
      record.name,
      record.water,
      record.structure,
      record.target,
      record.note,
      record.status,
      record.latitude,
      record.longitude,
      record.accuracy
    ).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "SPOT_CREATE_FAILED", message: error.message }, 500);
  }
}

async function updateLog(request, env) {
  try {
    const data = await request.json();
    const id = clean(new URL(request.url).searchParams.get("id"));
    const species = clean(data.species);
    const lureName = clean(data.lure_name);
    const lureWeight = clean(data.lure_weight);
    const rodId = clean(data.rod_id);
    const reelId = clean(data.reel_id);
    const sessionId = clean(data.session_id);
    const record = {
      id,
      species,
      size: clean(data.size),
      weight: clean(data.weight),
      length_cm: parseLengthCm(data.length_cm ?? data.size),
      weight_g: parseWeightG(data.weight_g ?? data.weight),
      spot: clean(data.spot),
      spot_id: clean(data.spot_id),
      session_id: sessionId,
      lure: [lureName, lureWeight].filter(Boolean).join(" ") || clean(data.lure),
      lure_name: lureName,
      lure_weight: lureWeight,
      gear_id: clean(data.gear_id) || rodId || reelId,
      rod_id: rodId,
      reel_id: reelId,
      date: clean(data.date),
      time: clean(data.time),
      image: catchImageForSpecies(species),
      note: clean(data.note)
    };

    if (!id) return json({ error: "id is required" }, 400);
    if (!record.species) return json({ error: "species is required" }, 400);
    Object.assign(record, await getLogReferenceSnapshots(env, record));

    const result = await env.DB.prepare(`
      UPDATE logs
      SET species = ?, size = ?, weight = ?, length_cm = ?, weight_g = ?, spot = ?, spot_id = ?, session_id = ?, lure = ?, lure_name = ?, lure_weight = ?, gear_id = ?, rod_id = ?, reel_id = ?, spot_name_snapshot = ?, session_name_snapshot = ?, gear_name_snapshot = ?, rod_name_snapshot = ?, reel_name_snapshot = ?, date = ?, time = ?, image = ?, note = ?
      WHERE id = ?
    `).bind(
      record.species,
      record.size,
      record.weight,
      record.length_cm,
      record.weight_g,
      record.spot,
      record.spot_id,
      record.session_id,
      record.lure,
      record.lure_name,
      record.lure_weight,
      record.gear_id,
      record.rod_id,
      record.reel_id,
      record.spot_name_snapshot,
      record.session_name_snapshot,
      record.gear_name_snapshot,
      record.rod_name_snapshot,
      record.reel_name_snapshot,
      record.date,
      record.time,
      record.image,
      record.note,
      record.id
    ).run();

    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json(record);
  } catch (error) {
    return json({ error: "LOG_UPDATE_FAILED", message: error.message }, 500);
  }
}

async function getLogReferenceSnapshots(env, record) {
  const lookup = (table, id) => id
    ? env.DB.prepare(`SELECT name FROM ${table} WHERE id = ?`).bind(id).first()
    : Promise.resolve(null);
  const [spot, session, gear, rod, reel] = await Promise.all([
    lookup("spots", record.spot_id),
    lookup("fishing_sessions", record.session_id),
    lookup("gear", record.gear_id),
    lookup("gear", record.rod_id),
    lookup("gear", record.reel_id)
  ]);
  return {
    spot_name_snapshot: clean(spot?.name) || clean(record.spot),
    session_name_snapshot: clean(session?.name),
    gear_name_snapshot: clean(gear?.name),
    rod_name_snapshot: clean(rod?.name),
    reel_name_snapshot: clean(reel?.name)
  };
}

async function updateSpot(request, env) {
  try {
    const data = await request.json();
    const id = clean(new URL(request.url).searchParams.get("id"));
    const latitude = parseCoordinate(data.latitude, -90, 90);
    const longitude = parseCoordinate(data.longitude, -180, 180);
    const accuracy = parseAccuracy(data.accuracy);
    const record = {
      id,
      name: clean(data.name),
      water: clean(data.water),
      structure: clean(data.structure),
      target: clean(data.target),
      note: clean(data.note),
      status: normalizeSpotStatus(data.status),
      latitude,
      longitude,
      accuracy: latitude != null && longitude != null ? accuracy : null
    };

    if (!id) return json({ error: "id is required" }, 400);
    if (!record.name) return json({ error: "name is required" }, 400);

    const result = await env.DB.prepare(`
      UPDATE spots
      SET name = ?, water = ?, structure = ?, target = ?, note = ?, status = ?, latitude = ?, longitude = ?, accuracy = ?
      WHERE id = ?
    `).bind(
      record.name,
      record.water,
      record.structure,
      record.target,
      record.note,
      record.status,
      record.latitude,
      record.longitude,
      record.accuracy,
      record.id
    ).run();

    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json(record);
  } catch (error) {
    return json({ error: "SPOT_UPDATE_FAILED", message: error.message }, 500);
  }
}

async function loadRecommendationContext(env) {
  if (!env?.DB) return { gear: [], logs: [], spots: [], sessions: [] };

  try {
    const [gear, logs, spots, sessions] = await Promise.all([
      env.DB.prepare("SELECT name, type, spec FROM gear WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare(`
        SELECT session_id, spot_id, lure, lure_name, lure_weight, date, time, condition_snapshot, condition_score
        FROM logs
        ORDER BY created_at DESC
        LIMIT 200
      `).all(),
      env.DB.prepare("SELECT id, name, target, structure, latitude, longitude FROM spots WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100").all(),
      env.DB.prepare(`
        SELECT id, spot_id, started_at, ended_at, condition_snapshot, condition_score
        FROM fishing_sessions
        WHERE archived_at IS NULL
        ORDER BY created_at DESC
        LIMIT 200
      `).all()
    ]);
    return {
      gear: gear.results || [],
      logs: logs.results || [],
      spots: spots.results || [],
      sessions: sessions.results || []
    };
  } catch (error) {
    return { gear: [], logs: [], spots: [], sessions: [] };
  }
}

function locationCacheKey(location) {
  return `${Number(location.lat).toFixed(3)},${Number(location.lon).toFixed(3)}`;
}

async function readCachedPlace(env, coordinateKey) {
  try {
    const record = await env.DB.prepare("SELECT place FROM location_cache WHERE coordinate_key = ?")
      .bind(coordinateKey)
      .first();
    return clean(record?.place).slice(0, 200);
  } catch (error) {
    return "";
  }
}

async function reserveNominatimRequest(env) {
  const now = Date.now();
  const minimumPrevious = now - 1100;
  try {
    const result = await env.DB.prepare(`
      INSERT INTO service_rate_limits (service, last_request_at)
      VALUES ('nominatim', ?)
      ON CONFLICT(service) DO UPDATE SET last_request_at = excluded.last_request_at
      WHERE service_rate_limits.last_request_at <= ?
    `).bind(now, minimumPrevious).run();
    return Boolean(result.meta?.changes);
  } catch (error) {
    return false;
  }
}

async function cachePlace(env, coordinateKey, place) {
  if (!place) return;
  try {
    await env.DB.prepare(`
      INSERT INTO location_cache (coordinate_key, place, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(coordinate_key) DO UPDATE SET place = excluded.place, updated_at = CURRENT_TIMESTAMP
    `).bind(coordinateKey, place).run();
  } catch (error) {
    // Location labels are optional and should never block condition results.
  }
}

async function reverseGeocode(location, env) {
  const latitude = Number(location.lat.toFixed(4));
  const longitude = Number(location.lon.toFixed(4));
  const coordinateKey = locationCacheKey(location);
  const cached = await readCachedPlace(env, coordinateKey);
  if (cached) return cached;
  if (!await reserveNominatimRequest(env)) return "";

  const endpoint = new URL("https://nominatim.openstreetmap.org/reverse");
  endpoint.search = new URLSearchParams({
    format: "jsonv2",
    lat: latitude,
    lon: longitude,
    zoom: "18",
    addressdetails: "1",
    "accept-language": "zh-CN"
  });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(endpoint, {
      headers: {
        accept: "application/json",
        "user-agent": "LureAssistant/2.0 (+https://lure-assistant.1071242743.workers.dev)"
      },
      cf: { cacheTtl: 3600, cacheEverything: true },
      signal: controller.signal
    });
    if (!response.ok) return "";
    const data = await response.json();
    const address = data.address || {};
    const parts = [
      address.city,
      address.town,
      address.municipality,
      address.county,
      address.district,
      address.suburb,
      address.village,
      address.neighbourhood
    ].filter(Boolean);
    const place = [...new Set(parts)].slice(0, 2).join(" · ") || String(data.display_name || "").split(",").slice(0, 2).join(" · ");
    await cachePlace(env, coordinateKey, place);
    return place;
  } catch (error) {
    return "";
  } finally {
    clearTimeout(timer);
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
      weight_options: clean(data.weight_options),
      note: clean(data.note)
    };

    if (!record.name) return json({ error: "name is required" }, 400);

    await env.DB.prepare(`
      INSERT INTO gear (id, name, type, spec, weight_options, note)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(record.id, record.name, record.type, record.spec, record.weight_options, record.note).run();

    return json(record, 201);
  } catch (error) {
    return json({ error: "GEAR_CREATE_FAILED", message: error.message }, 500);
  }
}

async function updateGear(request, env) {
  try {
    const data = await request.json();
    const id = clean(new URL(request.url).searchParams.get("id"));
    const record = {
      id,
      name: clean(data.name),
      type: clean(data.type),
      spec: clean(data.spec),
      weight_options: clean(data.weight_options),
      note: clean(data.note)
    };

    if (!id) return json({ error: "id is required" }, 400);
    if (!record.name) return json({ error: "name is required" }, 400);

    const result = await env.DB.prepare(`
      UPDATE gear
      SET name = ?, type = ?, spec = ?, weight_options = ?, note = ?
      WHERE id = ?
    `).bind(
      record.name,
      record.type,
      record.spec,
      record.weight_options,
      record.note,
      record.id
    ).run();

    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json(record);
  } catch (error) {
    return json({ error: "GEAR_UPDATE_FAILED", message: error.message }, 500);
  }
}

async function archiveRecord(request, env, table, errorCode) {
  try {
    const id = clean(new URL(request.url).searchParams.get("id"));
    if (!id) return json({ error: "id is required" }, 400);

    const result = await env.DB.prepare(`UPDATE ${table} SET archived_at = CURRENT_TIMESTAMP WHERE id = ? AND archived_at IS NULL`).bind(id).run();
    if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    return json({ id, archived: true });
  } catch (error) {
    return json({ error: errorCode, message: error.message }, 500);
  }
}

async function deleteRecord(request, env, table, errorCode) {
  try {
    const id = clean(new URL(request.url).searchParams.get("id"));
    if (!id) return json({ error: "id is required" }, 400);

    if (table === "logs") {
      const results = await env.DB.batch([
        env.DB.prepare("DELETE FROM catch_photos WHERE log_id = ?").bind(id),
        env.DB.prepare("DELETE FROM logs WHERE id = ?").bind(id)
      ]);
      if (!results[1]?.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    } else {
      const result = await env.DB.prepare(`DELETE FROM ${table} WHERE id = ?`).bind(id).run();
      if (!result.meta?.changes) return json({ error: "NOT_FOUND" }, 404);
    }
    return json({ id, deleted: true });
  } catch (error) {
    return json({ error: errorCode, message: error.message }, 500);
  }
}

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}

function parseMeasurement(value, kind) {
  const text = clean(value).toLowerCase();
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  if (!Number.isFinite(number) || number <= 0) return null;
  if (kind === "length") {
    const centimeters = /cm|厘米/.test(text) || (!/\bm\b|米/.test(text) && number >= 10);
    const valueCm = centimeters ? number : number * 100;
    return valueCm <= 100000 ? Number(valueCm.toFixed(2)) : null;
  }
  const grams = /\bkg\b|公斤|千克/.test(text) || (!/\bg\b|克/.test(text) && number < 100);
  const valueG = grams ? number * 1000 : number;
  return valueG <= 100000000 ? Number(valueG.toFixed(1)) : null;
}

function parseLengthCm(value) {
  const numeric = Number(value);
  if (typeof value === "number" && Number.isFinite(numeric) && numeric > 0) return Number(numeric.toFixed(2));
  return parseMeasurement(value, "length");
}

function parseWeightG(value) {
  const numeric = Number(value);
  if (typeof value === "number" && Number.isFinite(numeric) && numeric > 0) return Number(numeric.toFixed(1));
  return parseMeasurement(value, "weight");
}

function normalizeSessionOutcome(value) {
  return ["hit", "partial", "miss", "pending"].includes(value) ? value : "pending";
}

function normalizeSpotStatus(value) {
  return ["active", "seasonal", "closed"].includes(value) ? value : "active";
}

function catchImageForSpecies(species) {
  const name = clean(species);
  if (name === "黑鱼") return "assets/fish-snakehead-user.png";
  if (name === "鲈鱼") return "assets/fish-bass-user.png";
  if (name === "鳜鱼") return "assets/fish-mandarin-user.png";
  if (name === "马口") return "assets/fish-makou-user.png";
  if (name === "军鱼") return "assets/fish-junyu-user.png";
  if (name === "鲶鱼") return "assets/fish-catfish-user.png";
  if (name === "鲤鱼") return "assets/fish-carp-user.png";
  if (name === "红尾") return "assets/fish-redtail-user.jpg";
  if (name === "鳡鱼") return "assets/fish-ganchina-user.png";
  if (name === "鸭嘴翘") return "assets/fish-duckbill-zui-user-fixed.jpg";
  return name === "翘嘴" ? "assets/catch-zui.png" : "assets/catch-perch.png";
}

function normalizeCatchImage(log) {
  return {
    ...log,
    image: log.photo_id
      ? `/api/log-photos?id=${encodeURIComponent(log.photo_id)}&v=2`
      : (log.image || catchImageForSpecies(log.species))
  };
}

function normalizeConditionSnapshot(input) {
  if (!input || typeof input !== "object") {
    return { json: null, latitude: null, longitude: null, place: null, source: null, accuracy: null, score: null };
  }

  const location = input.location && typeof input.location === "object" ? input.location : {};
  const weather = input.weather && typeof input.weather === "object" ? input.weather : {};
  const recommendation = input.recommendation && typeof input.recommendation === "object" ? input.recommendation : {};
  const radar = Array.isArray(input.radar)
    ? input.radar.slice(0, 8).map((item) => ({
      key: clean(item?.key).slice(0, 40),
      label: clean(item?.label).slice(0, 60),
      value: parseScore(item?.value)
    }))
    : [];
  const snapshot = {
    capturedAt: clean(input.capturedAt || input.updatedAt).slice(0, 50),
    score: parseScore(input.score),
    location: {
      latitude: parseCoordinate(location.latitude, -90, 90),
      longitude: parseCoordinate(location.longitude, -180, 180),
      place: clean(location.place).slice(0, 200),
      source: clean(location.source).slice(0, 40),
      accuracy: parseAccuracy(location.accuracy)
    },
    radar,
    weather: {
      summary: clean(weather.summary).slice(0, 100),
      temperature: clean(weather.temperature).slice(0, 40),
      wind: clean(weather.wind).slice(0, 80),
      pressure: clean(weather.pressure).slice(0, 80),
      humidity: clean(weather.humidity).slice(0, 60),
      visibility: clean(weather.visibility).slice(0, 100),
      water: clean(weather.water).slice(0, 80),
      window: clean(weather.window).slice(0, 100)
    },
    recommendation: {
      lure: clean(recommendation.lure).slice(0, 100),
      color: clean(recommendation.color).slice(0, 100),
      weight: clean(recommendation.weight).slice(0, 50),
      retrieve: clean(recommendation.retrieve).slice(0, 120)
    }
  };

  return {
    json: JSON.stringify(snapshot),
    latitude: snapshot.location.latitude,
    longitude: snapshot.location.longitude,
    place: snapshot.location.place || null,
    source: snapshot.location.source || null,
    accuracy: snapshot.location.accuracy,
    score: snapshot.score
  };
}

function parseScore(value) {
  const next = Number(value);
  return Number.isFinite(next) ? Math.round(Math.max(0, Math.min(100, next))) : null;
}

function parseCoordinate(value, min, max) {
  const next = Number(value);
  return Number.isFinite(next) && next >= min && next <= max ? Number(next.toFixed(6)) : null;
}

function parseAccuracy(value) {
  const next = Number(value);
  return Number.isFinite(next) && next >= 0 && next <= 100000 ? Number(next.toFixed(1)) : null;
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
  }, {
    ...context,
    current: { lat, lon, hour: localHour, waterTemp, pressureNow, pressureDelta, wind, weatherCode }
  });

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
      temperature: `${temp.toFixed(1)}°C`,
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
  const sessions = Array.isArray(context.sessions) ? context.sessions : [];
  const current = context.current || {};
  const activeSpot = findNearestRecommendationSpot(spots, current.lat, current.lon);
  const spotLogs = activeSpot
    ? logs.filter((log) => String(log.spot_id || "") === String(activeSpot.id))
    : logs;
  const similarLogs = spotLogs.filter((log) => isSimilarFishingCondition(log, current));
  const tripStats = buildTripRecommendationStats(sessions, logs, activeSpot, current);
  const targetText = `${activeSpot?.target || ""} ${activeSpot?.structure || ""}`;
  const keywords = recommendationKeywords(base.lure, targetText);
  const lureGear = gear.filter(isLureGear);

  if (!lureGear.length) {
    return {
      ...base,
      lureMeta: "\u73af\u5883\u5339\u914d",
      basis: activeSpot
        ? `${activeSpot.name} 暂无可用拟饵装备，当前为环境推荐`
        : "未匹配到附近标点，当前为环境推荐"
    };
  }

  const historicalLures = spotLogs.map(logLureName).filter(Boolean);
  const candidates = lureGear.map((item) => {
    const allHits = spotLogs.filter((log) => shareLureFamily(lureGearText(item), logLureName(log)));
    const similarHits = similarLogs.filter((log) => shareLureFamily(lureGearText(item), logLureName(log)));
    return {
      item,
      allHits,
      similarHits,
      score: scorePersonalLure(item, keywords, historicalLures) + allHits.length * 4 + similarHits.length * 18
    };
  }).sort((left, right) => right.score - left.score || right.similarHits.length - left.similarHits.length);
  const selected = candidates[0];
  const selectedName = selected.item.name || base.lure;
  const windowLabel = recommendationTimeWindow(current.hour);
  const sampleCount = spotLogs.length;
  const evidenceCount = selected.similarHits.length;

  return {
    ...base,
    lure: selectedName,
    lureMeta: evidenceCount
      ? `相似条件鱼获 ${evidenceCount} 条${tripStats.total ? ` · 钓行命中率 ${tripStats.rate}%` : ""}`
      : selected.item.spec || "装备库可用",
    basis: evidenceCount >= 2
      ? `${activeSpot?.name || "历史记录"} 在${windowLabel}相似环境下，${selectedName}有 ${evidenceCount} 条鱼获；${tripStats.label}`
      : activeSpot && sampleCount
        ? `${activeSpot.name} 仅有 ${sampleCount} 条历史鱼获样本，${tripStats.label || "当前以环境和装备匹配为主"}`
        : activeSpot
          ? `${activeSpot.name} 暂无历史鱼获，${tripStats.label || "当前以环境和目标鱼推荐"}`
          : historicalLures.length
            ? "未匹配到附近标点，结合全部历史鱼获与当前环境推荐"
            : "历史样本不足，当前为环境与装备推荐"
  };
}

function buildTripRecommendationStats(sessions, logs, activeSpot, current) {
  const scopedSessions = sessions.filter((session) => !activeSpot || String(session.spot_id || "") === String(activeSpot.id));
  const similarSessions = scopedSessions.filter((session) => isSimilarFishingSession(session, current));
  const caughtSessionIds = new Set(logs.map((log) => String(log.session_id || "")).filter(Boolean));
  const hit = similarSessions.filter((session) => caughtSessionIds.has(String(session.id))).length;
  const total = similarSessions.length;
  const empty = total - hit;
  const rate = total ? Math.round((hit / total) * 100) : 0;
  const label = total ? `相似条件 ${total} 次钓行，命中 ${hit} 次、空军 ${empty} 次（${rate}%）` : "";
  return { total, hit, empty, rate, label };
}

function lureGearText(item) {
  return `${item?.name || ""} ${item?.spec || ""}`.toLowerCase();
}

function logLureName(log) {
  return String(log?.lure_name || log?.lure || "").trim().toLowerCase();
}

function findNearestRecommendationSpot(spots, lat, lon) {
  if (lat == null || lon == null || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) return null;
  const candidates = spots.map((spot) => {
    if (spot.latitude == null || spot.longitude == null) return null;
    const distance = distanceInKm(lat, lon, Number(spot.latitude), Number(spot.longitude));
    return Number.isFinite(distance) ? { spot, distance } : null;
  }).filter(Boolean).sort((left, right) => left.distance - right.distance);
  return candidates[0]?.distance <= 5 ? candidates[0].spot : null;
}

function distanceInKm(lat1, lon1, lat2, lon2) {
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return NaN;
  const rad = Math.PI / 180;
  const a = Math.sin((lat2 - lat1) * rad / 2) ** 2
    + Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin((lon2 - lon1) * rad / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isSimilarFishingCondition(log, current) {
  return isSimilarSnapshotCondition(log?.time, log?.condition_snapshot, current);
}

function isSimilarFishingSession(session, current) {
  const [date = "", time = ""] = String(session?.started_at || "").split("T");
  return isSimilarSnapshotCondition(time || date, session?.condition_snapshot, current);
}

function isSimilarSnapshotCondition(timeValue, snapshotValue, current) {
  const time = String(timeValue || "");
  const hour = Number(time.slice(0, 2));
  const timeMatch = Number.isFinite(hour) && Number.isFinite(Number(current.hour)) && circularHourDistance(hour, Number(current.hour)) <= 3;
  const snapshot = parseFishingSnapshot(snapshotValue);
  if (!snapshot) return timeMatch;
  const water = snapshotNumber(snapshot.weather?.water);
  const pressure = snapshotNumber(snapshot.weather?.pressure);
  const waterMatch = !Number.isFinite(water) || !Number.isFinite(Number(current.waterTemp)) || Math.abs(water - Number(current.waterTemp)) <= 4;
  const pressureMatch = !Number.isFinite(pressure) || !Number.isFinite(Number(current.pressureNow)) || Math.abs(pressure - Number(current.pressureNow)) <= 8;
  return timeMatch && waterMatch && pressureMatch;
}

function parseFishingSnapshot(value) {
  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch (error) {
    return null;
  }
}

function snapshotNumber(value) {
  const match = String(value || "").match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function circularHourDistance(left, right) {
  const difference = Math.abs(left - right);
  return Math.min(difference, 24 - difference);
}

function recommendationTimeWindow(hour) {
  if (!Number.isFinite(Number(hour))) return "当前时段";
  const start = (Math.round(Number(hour) / 2) * 2 + 22) % 24;
  const end = (start + 2) % 24;
  return `${String(start).padStart(2, "0")}:00-${String(end).padStart(2, "0")}:00`;
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
