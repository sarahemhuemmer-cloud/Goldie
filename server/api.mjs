/** Stage-one adapter boundary. No credentials, network calls or simulated identity. */
export const integrations = Object.freeze({
  auth: "Supabase Auth",
  sync: "Supabase Postgres",
  files: "Supabase Storage",
  sharing: "Supabase Postgres",
  chat: "Supabase Realtime",
  assistant: "OpenAI",
  transcription: "OpenAI",
  speech: "OpenAI",
  realtime: "OpenAI",
  search: "Google Places",
  notifications: "Web Push / VAPID",
});
export function canAccessRecord(
  userId,
  record,
  grants = [],
  operation = "read",
) {
  if (!userId || !record || !["read", "write"].includes(operation))
    return false;
  if (record.owner_id === userId) return true;
  return grants.some(
    (grant) =>
      grant.record_id === record.id &&
      grant.recipient_id === userId &&
      (grant.permission === "write" ||
        (operation === "read" && grant.permission === "read")),
  );
}
export function handleApi(req, res) {
  let pathname;
  try {
    pathname = new URL(req.url, "http://localhost").pathname;
  } catch {
    return false;
  }
  if (pathname !== "/api" && !pathname.startsWith("/api/")) return false;
  const service = pathname.split("/")[2];
  res.writeHead(503, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  res.end(
    JSON.stringify({
      error: "integration_not_connected",
      service: service || "api",
      provider: integrations[service] || null,
      ...(service === "status"
        ? {
            services: Object.entries(integrations).map(([id, name]) => ({
              id,
              name,
              status: "not_connected",
            })),
          }
        : {}),
      message: "Diese Anbindung ist vorbereitet, aber noch nicht verbunden.",
    }),
  );
  return true;
}
