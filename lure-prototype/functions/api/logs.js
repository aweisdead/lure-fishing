export async function onRequestPost({ request, env }) {
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

function clean(value) {
  return String(value || "").trim().slice(0, 500);
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
