/** Pure domain helpers. Drafts never persist or transmit data. */
export function emptyState() {
  return {
    events: [],
    lists: [],
    routines: [],
    contacts: [],
    documents: [],
    notes: [],
    plans: [],
    medications: [],
    messages: [],
    grants: [],
    settings: { name: "", fontScale: 1, contrast: false, rate: 1 },
  };
}
const isoFor = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export function todayISO() {
  return isoFor(new Date());
}
function dateFromISO(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso || "")) return null;
  const [y, m, d] = iso.split("-").map(Number);
  const result = new Date(y, m - 1, d, 12);
  return isoFor(result) === iso ? result : null;
}
export function addDays(iso, n) {
  const d = dateFromISO(iso);
  if (!d || !Number.isInteger(n))
    throw new RangeError("Ungültiges Datum oder Tageszahl.");
  d.setDate(d.getDate() + n);
  return isoFor(d);
}
export function weekDates(iso) {
  const d = dateFromISO(iso);
  if (!d) throw new RangeError("Ungültiges Datum.");
  const monday = addDays(iso, -((d.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}
export function formatDate(iso) {
  const d = dateFromISO(iso);
  return d
    ? new Intl.DateTimeFormat("de-DE", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(d)
    : "Datum fehlt";
}
const collections = {
  event: "events",
  list: "lists",
  routine: "routines",
  contact: "contacts",
  document: "documents",
  note: "notes",
  plan: "plans",
  medication: "medications",
  message: "messages",
  grant: "grants",
};
export function validateRecord(kind, record) {
  const errors = [];
  if (!collections[kind] && kind !== "listItem")
    return ["Unbekannter Eintragstyp."];
  if (!record || typeof record !== "object") return ["Eintrag fehlt."];
  const title =
    record.title ||
    (kind === "contact" ? record.name : "") ||
    (["note", "message"].includes(kind) ? record.text : "");
  if (!String(title || "").trim())
    errors.push("Bitte einen Titel oder Text eingeben.");
  if (kind === "event" && !dateFromISO(record.date))
    errors.push("Bitte ein gültiges Datum auswählen.");
  if (record.date && !dateFromISO(record.date) && kind !== "event")
    errors.push("Das Datum ist ungültig.");
  if (record.time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(record.time))
    errors.push("Bitte eine gültige Uhrzeit eingeben.");
  if (kind === "routine" && !dateFromISO(record.date))
    errors.push("Bitte ein gültiges Startdatum auswählen.");
  if (
    kind === "routine" &&
    !["daily", "weekly", "once"].includes(record.frequency)
  )
    errors.push("Bitte eine Wiederholung auswählen.");
  if (kind === "message" && !String(record.recipient || "").trim())
    errors.push("Bitte eine empfangende Person auswählen.");
  return errors;
}
export function applyRecord(state, kind, record) {
  const errors = validateRecord(kind, record);
  if (errors.length) throw new Error(errors.join(" "));
  if (kind === "listItem")
    throw new Error("Bitte zuerst eine Liste auswählen.");
  const key = collections[kind];
  return { ...state, [key]: [...(state[key] || []), { ...record }] };
}
export function parseCommand(text, state = emptyState(), now = new Date()) {
  const raw = String(text || "").trim();
  const lower = raw.toLocaleLowerCase("de-DE");
  const answer = (text) => ({ type: "answer", text });
  const draft = (kind, data, text, question) => ({
    type: "draft",
    kind,
    data,
    text,
    ...(question ? { question } : {}),
  });
  if (!raw) return answer("Schreibe mir, wobei ich dir helfen soll.");
  if (/ausflug|in der nähe|suche|suchen|geschenkidee|wetter/.test(lower))
    return answer(
      "Die Suche ist vorbereitet, aber noch nicht verbunden. Ich kann aktuell keine aktuellen Ergebnisse abrufen.",
    );
  if (/^(nachricht|schreib(?:e)? .* an|sende|schicke)/.test(lower)) {
    const match = raw.match(
      /(?:Nachricht an|(?:schreibe?|sende|schicke)(?: eine Nachricht)? an)\s+([^:]+):\s*(.+)/i,
    );
    return draft(
      "message",
      { recipient: match?.[1]?.trim() || "", text: match?.[2]?.trim() || "" },
      "Ich bereite nur einen Nachrichtenentwurf vor. Es wird nichts versendet.",
      match ? undefined : "An wen soll der Entwurf gehen?",
    );
  }
  if (/^(notiz|merke|notiere)/.test(lower)) {
    const content = raw.replace(/^(notiz\s*:?|merke(?: dir)?|notiere)\s*/i, "");
    return draft(
      "note",
      { title: content, text: content },
      "Hier ist dein Notizentwurf. Speichere ihn, wenn er passt.",
      content ? undefined : "Was soll ich notieren?",
    );
  }
  if (/einkauf|auf (?:die |meine )?liste|kaufe|brauche .*milch/.test(lower)) {
    const item = raw
      .replace(/^(?:füge|setze|schreibe)\s*/i, "")
      .replace(
        /\s*(?:auf (?:die |meine )?(?:einkaufs)?liste|(?:zur|auf die) einkaufsliste)(?: hinzu)?[.!]?$/i,
        "",
      )
      .replace(/^(?:einkaufsliste\s*:?|kaufe|ich brauche)\s*/i, "")
      .trim();
    return draft(
      "listItem",
      { title: item },
      "Hier ist ein Listeneintrag als Entwurf. Wähle die Liste und bestätige ihn.",
      item ? undefined : "Was soll auf die Liste?",
    );
  }
  if (/termin|erinner|routine|jeden|täglich|wöchentlich/.test(lower)) {
    const recurring = /jeden|täglich|wöchentlich|routine/.test(lower);
    const frequency = /täglich|jeden tag/.test(lower)
      ? "daily"
      : /wöchentlich|jeden (?:montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)/.test(
            lower,
          )
        ? "weekly"
        : "";
    let date = "";
    if (/\bmorgen\b/.test(lower)) date = addDays(isoFor(now), 1);
    else if (/\bheute\b/.test(lower)) date = isoFor(now);
    else {
      const explicit = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
      if (explicit && dateFromISO(explicit[1])) date = explicit[1];
      const german = raw.match(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/);
      if (german) {
        const candidate = `${german[3]}-${german[2].padStart(2, "0")}-${german[1].padStart(2, "0")}`;
        if (dateFromISO(candidate)) date = candidate;
      }
    }
    const tm =
      raw.match(/\b(?:um\s+)?([01]?\d|2[0-3])(?::([0-5]\d))?\s*Uhr\b/i) ||
      raw.match(/\bum\s+([01]?\d|2[0-3])(?::([0-5]\d))?\b/i);
    const time = tm ? `${tm[1].padStart(2, "0")}:${tm[2] || "00"}` : "";
    const title = raw
      .replace(/^(?:trage|erstelle|lege|plane)\s+(?:einen?\s+)?termin\s*/i, "")
      .replace(/^termin\s*:?\s*/i, "")
      .replace(/^erinnere mich(?: daran)?\s*/i, "")
      .trim();
    let question;
    if (recurring && !frequency)
      question = "Wie oft soll die Routine stattfinden?";
    else if (!recurring && !date)
      question = "An welchem Datum soll der Termin stattfinden?";
    else if (!time) question = "Zu welcher Uhrzeit soll ich ihn vormerken?";
    return draft(
      recurring ? "routine" : "event",
      { title, date, time, ...(recurring ? { frequency } : {}) },
      "Hier ist ein Entwurf. Er ist noch nicht gespeichert und löst noch keine Erinnerung aus.",
      question,
    );
  }
  return answer(
    "Ich kann Termine, Routinen, Listeneinträge, Notizen und Nachrichten als Entwurf vorbereiten. Beschreibe bitte, was du anlegen möchtest.",
  );
}
