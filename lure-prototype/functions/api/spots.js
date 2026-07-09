export async function onRequestPost({ request, env }) {
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

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
