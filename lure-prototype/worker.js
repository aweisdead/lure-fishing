const jsonHeaders = { "content-type": "application/json; charset=utf-8" };

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/bootstrap" && request.method === "GET") {
      return bootstrap(env);
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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: jsonHeaders
  });
}
