export async function onRequestGet({ env }) {
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

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" }
  });
}
