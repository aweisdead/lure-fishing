export async function onRequestPost({ request, env }) {
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
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
