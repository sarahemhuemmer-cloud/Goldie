import {
  emptyState,
  todayISO,
  addDays,
  weekDates,
  formatDate,
  validateRecord,
  parseCommand,
} from "./domain.mjs";
const $ = (s) => document.querySelector(s),
  escape = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const paths = {
  home: "M3 11 12 3l9 8M5 10v11h5v-7h4v7h5V10",
  calendar: "M5 5h14v16H5zM8 3v4M16 3v4M5 10h14M8 14h2M14 14h2M8 17h2",
  list: "M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1",
  file: "M6 3h8l4 4v14H6zM14 3v5h5M9 12h6M9 16h6",
  more: "M5 12h.01M12 12h.01M19 12h.01",
  search: "M20 20l-5-5M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0",
  user: "M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8M4 21v-3a8 6 0 0 1 16 0v3z",
  plus: "M12 4v16M4 12h16",
  left: "m14 5-7 7 7 7",
  right: "m9 5 7 7-7 7",
  mic: "M9 5a3 3 0 0 1 6 0v7a3 3 0 0 1-6 0zM5 11v1a7 7 0 0 0 14 0v-1M12 19v3M8 22h8",
  keyboard:
    "M3 6h18v13H3zM6 10h1M10 10h1M14 10h1M18 10h1M6 14h1M10 14h1M14 14h1M8 17h8",
  send: "m3 3 18 9-18 9 3-9zM6 12h15",
  pin: "M12 22s8-8 8-14a8 8 0 1 0-16 0c0 6 8 14 8 14M12 5a3 3 0 1 1 0 6 3 3 0 0 1 0-6",
  gift: "M3 8h18v4H3zM5 12v9h14v-9M12 8v13M12 8S5 9 5 5s7-2 7 3M12 8s7 1 7-3-7-2-7 3",
  heart: "M12 21 3 12C-2 5 6 0 12 7c6-7 14-2 9 5z",
  leaf: "M3 21 17 7M5 17C1 5 13 2 21 3c0 10-6 17-16 14",
  check: "m5 12 4 4L19 6",
  close: "M5 5l14 14M19 5 5 19",
  phone: "M5 3h4l2 5-3 2c1 3 3 5 6 6l2-3 5 2v4c-8 5-21-8-16-16",
  chat: "M3 4h18v13H9l-6 4zM7 8h10M7 12h7",
  clock: "M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18M12 7v5l3 2",
  settings: "M4 7h16M4 17h16M8 4v6M16 14v6",
  volume: "M3 9h4l5-5v16l-5-5H3zM16 8q6 4 0 8",
  stop: "M5 5h14v14H5z",
  undo: "M8 4 3 9l5 5M3 9h11a6 6 0 1 1 0 12",
  pill: "m7 17 10-10M4 10l6-6a6 6 0 0 1 8 8l-6 6a6 6 0 0 1-8-8",
  people:
    "M8 3a3 3 0 1 1 0 6 3 3 0 0 1 0-6M16 5a3 3 0 1 1 0 6M2 21v-4a6 6 0 0 1 12 0v4M16 14a6 6 0 0 1 6 6",
  cloud: "M7 19h10a5 5 0 0 0 1-10 6 6 0 0 0-11-2 6 6 0 0 0 0 12",
};
const icon = (n) =>
  `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[n] || paths.file}"/></svg>`;
const nav = [
  ["today", "Heute", "home"],
  ["plan", "Planen", "calendar"],
  ["goldie", "Goldie", "mic"],
  ["docs", "Unterlagen", "file"],
  ["more", "Mehr", "more"],
];
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
};
const titles = {
  event: "Termin",
  list: "Liste",
  routine: "Routine",
  contact: "Kontakt",
  document: "Unterlage",
  note: "Notiz",
  plan: "Vorhaben",
  medication: "Medikament",
  message: "Nachrichtenentwurf",
};
const KEY = "goldie-preparation-v1";
let storageError = "";
let state = emptyState();
try {
  const saved = localStorage.getItem(KEY);
  if (saved) {
    const data = JSON.parse(saved);
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error("Ungültiger Speicherstand");
    const loaded = emptyState();
    for (const [kind, key] of Object.entries(collections)) {
      if (
        !Array.isArray(data[key]) ||
        data[key].some(
          (r) =>
            !r || typeof r.id !== "string" || validateRecord(kind, r).length,
        )
      )
        throw new Error("Ungültiger Eintrag");
      if (
        kind === "list" &&
        data[key].some(
          (r) =>
            !Array.isArray(r.items) ||
            r.items.some(
              (i) =>
                !i || typeof i.id !== "string" || typeof i.title !== "string",
            ),
        )
      )
        throw new Error("Ungültige Liste");
      loaded[key] = data[key];
    }
    state = loaded;
    state.grants = Array.isArray(data.grants) ? data.grants : [];
    state.settings = { ...state.settings, ...data.settings };
  }
} catch {
  storageError =
    "Deine gespeicherten Angaben konnten nicht geladen werden. Prüfe die Browser-Speichereinstellungen. Es wurde nichts überschrieben.";
}
let page = "today",
  tab = "calendar",
  selectedDate = todayISO(),
  moreView = "",
  messages = [],
  services = [],
  undoState = null,
  voiceState = "idle",
  recorder = null,
  stream = null,
  utterance = null,
  voiceGeneration = 0;
function store(next) {
  if (storageError) throw new Error(storageError);
  const encoded = JSON.stringify(next);
  localStorage.setItem(KEY, encoded);
  if (localStorage.getItem(KEY) !== encoded)
    throw new Error(
      "Die Angaben konnten nicht gespeichert werden. Bitte prüfe den Gerätespeicher.",
    );
  undoState = structuredClone(state);
  state = next;
}
function update(change, text = "Auf diesem Gerät gespeichert.") {
  try {
    const next = structuredClone(state);
    change(next);
    store(next);
    render();
    toast(text, true);
    return true;
  } catch (e) {
    toast(e.message);
    return false;
  }
}
let toastTimer;
function toast(text, undo = false) {
  const el = $("#toast");
  el.className = "toast";
  el.innerHTML = `${escape(text)}${undo ? ' <button data-action="undo">Rückgängig</button>' : ""}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    el.className = "";
    el.textContent = "";
  }, 10000);
}
function navigate(target, view = "") {
  stopVoice();
  page = target;
  moreView = view;
  render();
  $(".shell").scrollTop = 0;
  window.scrollTo({ top: 0 });
  $("#main")?.focus({ preventScroll: true });
}
const empty = (text, action = "", label = "") =>
  `<div class="cream empty">${escape(text)}${action ? `<button class="primary" data-action="${action}">${escape(label)}</button>` : ""}</div>`;
const bird = () =>
  `<img src="/assets/goldie-mascot.png" alt="" aria-hidden="true">`;
function navHTML() {
  return `<nav class="bottom-nav" aria-label="Hauptnavigation">${nav.map(([id, label, i]) => `<button class="nav-item ${id === page ? "active" : ""} ${id === "goldie" ? "pearl" : ""}" data-nav="${id}" ${id === page ? 'aria-current="page"' : ""}>${id === "goldie" ? `<span class="pearl-circle">${bird()}</span>` : icon(i)}<span>${label}</span></button>`).join("")}</nav>`;
}
function render() {
  const scrollTop = $(".shell")?.scrollTop || 0;
  const fs = Number(state.settings.fontScale);
  document.documentElement.style.setProperty(
    "--font-scale",
    Number.isFinite(fs) ? Math.min(1.5, Math.max(1, fs)) : 1,
  );
  document.body.classList.toggle("high-contrast", !!state.settings.contrast);
  $("#app").innerHTML =
    `<div class="shell"><aside class="rail"><div class="brand">Goldie</div><small>Dein Alltag, leichter.</small><nav aria-label="Navigation am Computer">${nav.map(([id, label, i]) => `<button class="rail-link ${page === id ? "active" : ""}" data-nav="${id}" ${page === id ? 'aria-current="page"' : ""}>${icon(i)}${label}</button>`).join("")}</nav><div class="rail-note">Ein Schritt nach dem anderen.<br><br><span class="dot"></span> Konto noch nicht verbunden</div></aside><main id="main" class="page" tabindex="-1">${storageError ? `<p class="form-error">${escape(storageError)}</p>` : ""}${pageHTML()}</main></div>${navHTML()}`;
  $(".shell").scrollTop = scrollTop;
}
function header(title, actions = "") {
  return `<header><div><h1>${title}</h1>${page === "today" ? `<p class="mobile-date">${formatDate(todayISO())}</p>` : ""}</div><div class="head-actions">${actions}</div></header>`;
}
const searchBtn = `<button class="icon-btn" data-action="search" aria-label="Suchen">${icon("search")}</button>`;
function pageHTML() {
  if (page === "today") return todayPage();
  if (page === "plan") return planPage();
  if (page === "goldie") return goldiePage();
  if (page === "docs") return docsPage();
  return morePage();
}
function greeting() {
  const hour = new Date().getHours();
  return hour < 11 ? "Guten Morgen" : hour < 18 ? "Guten Tag" : "Guten Abend";
}
function todayPage() {
  const events = state.events
    .filter((e) => e.date === todayISO())
    .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const routines = state.routines.filter(
    (r) =>
      r.date &&
      r.date <= todayISO() &&
      (r.frequency === "daily" ||
        (r.frequency === "weekly" &&
          new Date(r.date + "T12:00:00").getDay() === new Date().getDay()) ||
        (r.frequency === "once" && r.date === todayISO())),
  );
  return `${header("Goldie", searchBtn + `<button class="icon-btn" data-action="account" aria-label="Profil und Konto">${icon("user")}</button>`)}<div class="hero">${bird()}</div><section class="cream welcome"><h2>${greeting()}${state.settings.name ? `,<br>${escape(state.settings.name)}` : ""}</h2><p class="subtitle">Was hast du heute vor?</p><button class="primary" data-action="talk">${icon("mic")}Mit Goldie sprechen</button><button class="text-button write-option" data-action="write">Lieber schreiben</button><div class="section"><div class="section-title"><h2>Heute im Blick</h2></div><div class="card-stack">${events.map((e) => recordRow("event", e)).join("")}${routines.map((r) => recordRow("routine", r)).join("")}${!events.length && !routines.length ? `<p class="muted">Heute ist noch nichts eingetragen. Plane deinen Tag ganz in Ruhe.</p><button class="secondary" data-new="event">${icon("plus")} Termin eintragen</button>` : ""}</div></div></section><section class="section"><div class="section-title"><h2>Ein bisschen Zeit für dich</h2></div><button class="cream row" data-action="selftime"><span class="badge-icon">${icon("leaf")}</span><span class="body"><strong>Was tut dir heute gut?</strong><p>Plane einen Moment nur für dich.</p></span>${icon("right")}</button></section><p class="footer-note">Vorbereitung: Deine Eingaben bleiben auf diesem Gerät. Konto und Synchronisierung verbinden wir im nächsten Schritt.</p>`;
}
function recordRow(kind, r) {
  const cfg = {
    event: ["calendar", "peach"],
    routine: ["clock", "rose"],
    contact: ["user", "blue"],
    document: ["file", ""],
    note: ["file", "gold"],
    plan: ["leaf", ""],
    medication: ["pill", "rose"],
    message: ["chat", "blue"],
  };
  const [sym, color] = cfg[kind] || ["list", ""];
  let detail =
    kind === "event"
      ? [r.location, r.note].filter(Boolean).join(" · ")
      : kind === "routine"
        ? `${r.time || ""} · ${frequencyLabel(r.frequency)}${r.completedDates?.includes(todayISO()) ? " · Heute erledigt" : ""}`
        : kind === "contact"
          ? [r.relationship, r.phone].filter(Boolean).join(" · ")
          : kind === "document"
            ? r.dueDate
              ? `Frist: ${formatDate(r.dueDate)}`
              : r.fileName || r.note || "Angaben und Fristen"
            : kind === "message"
              ? `An ${r.recipient} · Nicht gesendet`
              : r.text || r.note || r.status || "";
  return `<button class="cream row" data-open="${kind}" data-id="${escape(r.id)}">${kind === "event" ? `<span class="time">${escape(r.time || "Ganztägig")}</span>` : ""}<span class="badge-icon ${color}">${icon(sym)}</span><span class="body"><strong>${escape(r.title || r.name || r.text)}</strong><p>${escape(detail)}</p></span>${icon("right")}</button>`;
}
const frequencyLabel = (v) =>
  ({ daily: "Täglich", weekly: "Wöchentlich", once: "Einmalig" })[v] ||
  "Häufigkeit fehlt";
function planPage() {
  const days = weekDates(selectedDate);
  const month = new Intl.DateTimeFormat("de-DE", {
    month: "long",
    year: "numeric",
  }).format(new Date(selectedDate + "T12:00:00"));
  let body;
  if (tab === "calendar") {
    const events = state.events
      .filter((e) => e.date === selectedDate)
      .sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    body = `<div class="calendar"><div class="month"><button class="icon-btn" data-action="prev-month" aria-label="Vorheriger Monat">${icon("left")}</button><h2>${month}</h2><button class="icon-btn" data-action="next-month" aria-label="Nächster Monat">${icon("right")}</button></div><div class="week">${days.map((day, i) => `<button data-date="${day}" aria-pressed="${day === selectedDate}"><span class="day-label">${["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"][i]}</span><span class="day-number">${Number(day.slice(-2))}</span></button>`).join("")}</div></div><div class="toolbar"><button class="secondary" data-action="prev-week">${icon("left")} Woche</button><button class="secondary" data-action="today-date">Heute</button><button class="secondary" data-action="next-week">Woche ${icon("right")}</button></div><p class="caption">${formatDate(selectedDate)}</p><div class="card-stack">${events.map((e) => recordRow("event", e)).join("") || empty("Für diesen Tag gibt es noch keine Termine.", "new-event", "Termin eintragen")}</div>`;
  } else if (tab === "lists") body = listsPage();
  else
    body = `<p class="lead">Kleine Gewohnheiten, die deinen Alltag begleiten.</p><div class="notice">Erinnerungen bei geschlossener App sind noch nicht verbunden.</div><div class="card-stack">${state.routines.map((r) => recordRow("routine", r)).join("") || empty("Hier finden deine persönlichen Routinen Platz.", "new-routine", "Routine anlegen")}</div>`;
  return `${header("Planen", searchBtn + `<button class="icon-btn" data-action="plan-add" aria-label="Neuen Eintrag anlegen">${icon("plus")}</button>`)}<div class="tabs" role="tablist" aria-label="Planungsbereich">${[
    ["calendar", "Kalender"],
    ["lists", "Listen"],
    ["routines", "Routinen"],
  ]
    .map(
      ([id, label]) =>
        `<button role="tab" aria-selected="${tab === id}" data-tab="${id}">${label}</button>`,
    )
    .join("")}</div>${body}`;
}
function listsPage() {
  return `<div class="card-stack">${state.lists.map((l) => `<section class="cream panel"><div class="title-flex"><h2>${escape(l.title)}</h2><button class="icon-btn" data-open="list" data-id="${escape(l.id)}" aria-label="Liste ${escape(l.title)} bearbeiten">${icon("more")}</button></div><p class="meta">${(l.items || []).filter((i) => i.done).length} von ${(l.items || []).length} erledigt · ${escape(l.category || "Eigene Liste")}</p><div class="list-items">${(l.items || []).map((i) => `<label class="checkrow ${i.done ? "done" : ""}"><input type="checkbox" data-toggle-item="${escape(i.id)}" data-list="${escape(l.id)}" ${i.done ? "checked" : ""}><span>${escape(i.title)}</span><button type="button" class="icon-btn danger" data-remove-item="${escape(i.id)}" data-list="${escape(l.id)}" aria-label="${escape(i.title)} entfernen">${icon("close")}</button></label>`).join("")}</div><form class="inline-add" data-list-add="${escape(l.id)}"><input name="title" required maxlength="200" aria-label="Neuer Eintrag für ${escape(l.title)}" placeholder="Was kommt dazu?"><button class="icon-btn" aria-label="Eintrag hinzufügen">${icon("plus")}</button></form></section>`).join("") || empty("Einkäufe, Packlisten oder eigene Listen: Hier behältst du den Überblick.", "new-list", "Liste erstellen")}</div>`;
}
function goldiePage() {
  return `${header("Goldie", `<button class="icon-btn" data-nav="today" aria-label="Zurück zu Heute">${icon("left")}</button><button class="icon-btn" data-action="goldie-options" aria-label="Goldie-Optionen">${icon("more")}</button>`)}<div class="assistant-intro"><div class="speech-bubble"><h2>Wie kann ich<br>dir heute helfen?</h2></div><div class="hero">${bird()}</div></div><div class="suggestions">${[
    ["calendar", "Termin eintragen", "new-event"],
    ["list", "Einkaufsliste erstellen", "shopping-list"],
    ["pin", "Ausflugsziele in der Nähe", "nearby"],
    ["gift", "Geschenkideen finden", "gift-search"],
    ["heart", "Zeit für mich planen", "selftime"],
  ]
    .map(
      ([i, label, a]) =>
        `<button class="suggestion" data-action="${a}">${icon(i)}<span>${label}</span>${icon("right")}</button>`,
    )
    .join(
      "",
    )}</div><div class="chat-log" role="log" aria-label="Gespräch mit Goldie" aria-live="polite">${messages.map((m, i) => `<article class="chat-msg ${m.role}"><p class="chat-meta">${m.role === "user" ? "Du" : "Goldie"}</p><p>${escape(m.text)}</p>${m.draft ? `<div class="chat-actions"><button class="secondary" data-draft="${i}">Entwurf prüfen</button></div>` : ""}${m.role === "goldie" ? `<div class="chat-actions"><button class="text-button" data-read="${i}">Vorlesen</button><button class="text-button" data-read-slow="${i}">Langsamer</button><button class="text-button" data-repeat="${i}">Wiederholen</button></div>` : ""}</article>`).join("")}</div><form class="composer" id="composer"><button type="button" class="mic" data-action="mic" aria-label="Aufnahme bewusst starten">${icon("mic")}</button><textarea id="prompt" name="prompt" rows="1" aria-label="Nachricht an Goldie" placeholder="Schreib Goldie …" maxlength="2000" required></textarea><button class="icon-btn" aria-label="Text verarbeiten">${icon("send")}</button></form><div id="voice-status" class="voice-status" role="status">${voiceStatusHTML()}</div><p class="footer-note">KI und Sprache sind noch nicht verbunden. Goldie kann hier einfache Texteingaben als bearbeitbare Entwürfe vorbereiten.</p>`;
}
function voiceStatusHTML() {
  return voiceState === "listening"
    ? `<span class="status-key">Goldie hört zu.</span> Die Aufnahme bleibt bis zum Beenden auf diesem Gerät. <button class="text-button" data-action="stop-record">Aufnahme beenden</button><button class="text-button" data-action="cancel-record">Verwerfen</button>`
    : voiceState === "speaking"
      ? `<span class="status-key">Goldie spricht.</span> <button class="text-button" data-action="stop-voice">Vorlesen beenden</button>`
      : voiceState === "processing"
        ? '<span class="status-key">Goldie verarbeitet deinen Text.</span>'
        : "Mikrofon aus. Du kannst alles auch schreiben.";
}
function docsPage() {
  return `${header("Unterlagen", searchBtn + `<button class="icon-btn" data-new="document" aria-label="Unterlage hinzufügen">${icon("plus")}</button>`)}<p class="lead">Wichtige Angaben und Fristen an einem Ort.</p><div class="notice">Dateiablage und Synchronisierung sind noch nicht verbunden. Du kannst bereits Bezeichnungen, Notizen und Fristen auf diesem Gerät speichern.</div><div class="card-stack">${state.documents.map((r) => recordRow("document", r)).join("") || empty("Hier sind noch keine Unterlagen hinterlegt.", "new-document", "Unterlage anlegen")}</div>`;
}
const moreItems = [
  ["contacts", "user", "Lieblingskontakte", "Vertraute Menschen erreichen"],
  ["messages", "chat", "Nachrichten", "Entwürfe und Kommunikation"],
  [
    "plans",
    "leaf",
    "Vorhaben & Aktivitäten",
    "Ausflüge, Reisen und gemeinsame Zeit",
  ],
  ["notes", "file", "Notizen", "Gedanken festhalten"],
  ["meals", "list", "Essen & Vorräte", "Wochenplanung und Einkaufsbedarf"],
  ["household", "home", "Haushalt", "Aufgaben und Abholtermine"],
  ["medications", "pill", "Medikamente", "Eigene Angaben und Erinnerungen"],
  [
    "help",
    "heart",
    "Hilfe & wichtige Kontakte",
    "Ansprechpersonen und Bedienhilfe",
  ],
  [
    "sharing",
    "people",
    "Angehörige & Freigaben",
    "Du bestimmst, was geteilt wird",
  ],
  [
    "settings",
    "settings",
    "Einstellungen",
    "Schrift, Kontrast und Sprachtempo",
  ],
  [
    "connections",
    "cloud",
    "Konto & Verbindungen",
    "Anbindungen im nächsten Schritt",
  ],
];
function morePage() {
  if (!moreView)
    return `${header("Mehr", `<button class="icon-btn" data-action="account" aria-label="Profil und Konto">${icon("user")}</button>`)}<p class="lead">Was deinen Alltag leichter macht.</p><div class="menu-grid">${moreItems.map(([id, i, label, desc]) => `<button class="cream row" data-more="${id}"><span class="badge-icon">${icon(i)}</span><span class="body"><strong>${label}</strong><p>${desc}</p></span></button>`).join("")}</div>`;
  const info = moreItems.find((i) => i[0] === moreView);
  const top = header(
    info?.[2] || "Mehr",
    `<button class="icon-btn" data-nav="more" aria-label="Zurück zu Mehr">${icon("left")}</button>`,
  );
  if (moreView === "settings") return top + settingsPage();
  if (moreView === "connections") return top + connectionsPage();
  if (moreView === "sharing") return top + sharingPage();
  if (moreView === "help") return top + helpPage();
  if (moreView === "meals")
    return (
      top +
      `<p class="lead">Plane Mahlzeiten und notiere, was du noch brauchst.</p><div class="toolbar"><button class="primary" data-action="meal-list">Essensplan erstellen</button><button class="secondary" data-action="inventory-list">Vorratsliste erstellen</button></div>${listsByCategory(["Essensplan", "Vorräte"])}`
    );
  if (moreView === "household")
    return (
      top +
      `<p class="lead">Haushaltsaufgaben und Abholtermine ohne Familienvorlagen.</p><div class="toolbar"><button class="primary" data-new="routine">Aufgabe oder Routine</button><button class="secondary" data-action="waste-event">Abholtermin</button></div><div class="card-stack">${
        state.routines
          .filter((r) => r.category === "Haushalt")
          .map((r) => recordRow("routine", r))
          .join("") ||
        empty(
          "Noch keine Haushaltsaufgaben. Beim Anlegen kannst du „Haushalt“ als Bereich auswählen.",
        )
      }</div>`
    );
  const kind = {
    contacts: "contact",
    messages: "message",
    plans: "plan",
    notes: "note",
    medications: "medication",
  }[moreView];
  if (!kind) return top;
  const records = state[collections[kind]];
  return (
    top +
    `${kind === "message" ? '<div class="notice">Nachrichten werden als Entwurf gespeichert. Externe Übergaben verlangen deine Bestätigung. Der interne Chat ist noch nicht verbunden.</div>' : ""}${kind === "plan" ? '<div class="toolbar"><button class="secondary" data-action="nearby">Ausflugsziele suchen</button><button class="secondary" data-action="community">Gemeinschaft & Veranstaltungen</button></div>' : ""}${kind === "medication" ? '<div class="notice">Du hinterlegst ausschließlich deine eigenen Angaben. Goldie gibt keine Dosierungs- oder Behandlungsempfehlungen. Erinnerungszustellung ist noch nicht verbunden.</div>' : ""}<div class="toolbar"><button class="primary" data-new="${kind}">${icon("plus")}${titles[kind]} anlegen</button></div><div class="card-stack">${records.map((r) => recordRow(kind, r)).join("") || empty(`Noch keine ${info?.[2] || "Einträge"} hinterlegt.`)}</div>`
  );
}
function listsByCategory(categories) {
  const lists = state.lists.filter((l) => categories.includes(l.category));
  return `<div class="card-stack">${lists.map((l) => `<button class="cream row" data-action="show-lists"><span class="badge-icon">${icon("list")}</span><span class="body"><strong>${escape(l.title)}</strong><p>${(l.items || []).length} Einträge</p></span>${icon("right")}</button>`).join("") || empty("Noch keine Listen angelegt.")}</div>`;
}
function settingsPage() {
  return `<form id="settings-form" class="cream panel settings"><label>Wie darf Goldie dich nennen?<input name="name" maxlength="60" value="${escape(state.settings.name)}" autocomplete="given-name" placeholder="Dein Name (freiwillig)"></label><label>Schriftgröße <input name="fontScale" type="range" min="1" max="1.5" step="0.1" value="${state.settings.fontScale}"><span class="muted">Normal bis 50 % größer</span></label><label class="checkline"><input name="contrast" type="checkbox" ${state.settings.contrast ? "checked" : ""}>Stärkere Kontraste</label><label>Sprachtempo<input name="rate" type="range" min="0.6" max="1.2" step="0.1" value="${state.settings.rate}"><span class="muted">Langsam bis zügig · Systemstimme als Vorschau</span></label><button class="primary">Einstellungen speichern</button></form><div class="section"><button class="secondary" data-action="export">Meine Angaben herunterladen</button></div>`;
}
function connectionsPage() {
  return `<div class="cream panel account-card"><h2>Dein persönliches Konto</h2><p class="lead">Konto und Synchronisierung bereiten wir mit Supabase vor. Aktuell bist du nicht angemeldet.</p><button class="primary" data-action="account">Anmeldung vorbereiten</button></div><div class="cream panel">${(services.length ? services : [{ name: "Supabase · Konto, Daten, Dateien & Chat" }, { name: "OpenAI · KI und Sprache" }, { name: "Google Places · Ortssuche" }, { name: "Benachrichtigungen · Anbieterabgleich offen" }]).map((s) => `<div class="service-row"><strong>${escape(s.name)}</strong><small>Noch nicht verbunden</small></div>`).join("")}</div><p class="footer-note">Zugangsdaten werden später ausschließlich serverseitig eingerichtet. Die lokale Vorbereitung aktiviert keinen Dienst.</p>`;
}
function sharingPage() {
  return `<p class="lead">Du wählst einzelne Termine, Listen oder Unterlagen aus und bestimmst, wer sie sehen oder bearbeiten darf.</p><div class="notice">Freigaben sind noch nicht verbunden. Ein hier gespeicherter Entwurf gibt niemandem Zugriff.</div><button class="primary" data-action="grant">Freigabe vorbereiten</button><div class="section card-stack">${state.grants.map((g) => `<section class="cream panel"><h3>${escape(g.recordTitle)}</h3><p>${escape(g.recipient)} · ${g.permission === "write" ? "Lesen und bearbeiten" : "Nur lesen"}</p><p class="meta">Entwurf · Nicht freigegeben</p><button class="text-button danger" data-remove-grant="${escape(g.id)}">Entwurf entfernen</button></section>`).join("")}</div>`;
}
function helpPage() {
  return `<div class="notice">Dieser Bereich ist kein überwachter Notrufdienst. Hier stehen ausschließlich deine selbst hinterlegten Kontakte.</div><div class="section-title"><h2>Wichtige Kontakte</h2><button class="secondary" data-new="contact">Hinzufügen</button></div><div class="card-stack">${
    state.contacts
      .filter((c) => c.important)
      .map((c) => recordRow("contact", c))
      .join("") ||
    empty(
      "Noch keine wichtigen Kontakte hinterlegt. Markiere einen Kontakt als wichtig.",
    )
  }</div><section class="cream panel section"><h2>So geht’s</h2><p class="lead">1. Unter „Planen“ legst du einen Termin, eine Liste oder Routine an.<br><br>2. Goldie bereitet einfache Texteingaben als Entwurf vor. Du prüfst und speicherst sie.<br><br>3. Unter „Mehr → Einstellungen“ kannst du Schrift und Kontrast verändern.</p><button class="secondary" data-action="write">Goldie öffnen</button></section>`;
}
function dialog(title, html, after) {
  const el = $("#dialog");
  if (el.open) el.close();
  el.innerHTML = `<div class="dialog-top"><h2 id="dialog-title">${escape(title)}</h2><button class="icon-btn" data-action="close-dialog" aria-label="Schließen">${icon("close")}</button></div>${html}`;
  el.showModal();
  after?.(el);
}
function field(name, label, value = "", type = "text", required = false) {
  return `<div class="field"><label for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" value="${escape(value)}" ${required ? "required" : ""} ${type === "text" ? 'maxlength="200"' : ""}></div>`;
}
function area(name, label, value = "") {
  return `<div class="field"><label for="f-${name}">${label}</label><textarea id="f-${name}" name="${name}" maxlength="4000">${escape(value)}</textarea></div>`;
}
function select(name, label, options, value = "") {
  return `<div class="field"><label for="f-${name}">${label}</label><select id="f-${name}" name="${name}">${options.map(([v, t]) => `<option value="${escape(v)}" ${v === value ? "selected" : ""}>${escape(t)}</option>`).join("")}</select></div>`;
}
function edit(kind, id = "", prefill = {}) {
  const key = collections[kind];
  const old = id ? state[key].find((r) => r.id === id) : null;
  const r = { ...prefill, ...old };
  let html =
    kind === "contact"
      ? field("name", "Name", r.name, "text", true)
      : field(
          "title",
          kind === "medication" ? "Bezeichnung" : "Titel",
          r.title,
          "text",
          true,
        );
  if (kind === "event")
    html +=
      field(
        "date",
        "Datum",
        Object.hasOwn(r, "date") ? r.date : selectedDate,
        "date",
        true,
      ) +
      field("time", "Uhrzeit (leer für ganztägig)", r.time, "time") +
      field("location", "Ort", r.location);
  if (kind === "routine")
    html +=
      select(
        "frequency",
        "Wiederholung",
        [
          ["", "Bitte auswählen"],
          ["daily", "Täglich"],
          ["weekly", "Wöchentlich"],
          ["once", "Einmalig"],
        ],
        Object.hasOwn(r, "frequency") ? r.frequency : "daily",
      ) +
      field(
        "date",
        "Startdatum",
        Object.hasOwn(r, "date") ? r.date : todayISO(),
        "date",
        true,
      ) +
      field("time", "Uhrzeit", r.time, "time") +
      select(
        "category",
        "Bereich",
        [
          ["Persönlich", "Persönlich"],
          ["Haushalt", "Haushalt"],
          ["Trinken", "Trinken"],
          ["Medikamente", "Medikamente"],
        ],
        r.category || "Persönlich",
      ) +
      '<p class="notice">Du kannst die Routine abhaken. Benachrichtigungen bei geschlossener App sind noch nicht verbunden.</p>';
  if (kind === "list")
    html += select(
      "category",
      "Art der Liste",
      [
        ["Einkauf", "Einkauf"],
        ["Packliste", "Packliste"],
        ["Eigene Liste", "Eigene Liste"],
        ["Essensplan", "Essensplan"],
        ["Vorräte", "Vorräte"],
      ],
      r.category || "Eigene Liste",
    );
  if (kind === "contact")
    html +=
      field("relationship", "Beziehung / Einrichtung", r.relationship) +
      field("phone", "Telefonnummer", r.phone, "tel") +
      field("email", "E-Mail", r.email, "email") +
      `<label class="checkline"><input type="checkbox" name="important" ${r.important ? "checked" : ""}> Wichtiger Kontakt</label>`;
  if (kind === "document")
    html +=
      select(
        "category",
        "Art",
        [
          ["Dokument", "Dokument"],
          ["Vertrag", "Vertrag"],
          ["Versicherung", "Versicherung"],
          ["Mitgliedschaft", "Mitgliedschaft"],
          ["Frist", "Frist"],
        ],
        r.category,
      ) +
      field("dueDate", "Frist / Ablaufdatum", r.dueDate, "date") +
      '<p class="notice">PDF- und Bildablage wird im zweiten Schritt verbunden. Es wird aktuell keine Datei hochgeladen.</p>';
  if (kind === "note") html += area("text", "Deine Notiz", r.text);
  if (kind === "plan")
    html +=
      select(
        "category",
        "Vorhaben",
        [
          ["Ausflug", "Ausflug"],
          ["Reise", "Reise"],
          ["Feier", "Feier"],
          ["Gemeinschaft", "Gemeinschaft"],
          ["Eigene Planung", "Eigene Planung"],
        ],
        r.category,
      ) +
      field("date", "Datum (optional)", r.date, "date") +
      field("location", "Ort", r.location) +
      select(
        "status",
        "Stand",
        [
          ["Idee", "Idee"],
          ["Planung", "Planung"],
          ["Vorbereitung", "Vorbereitung"],
          ["Fertig", "Fertig"],
        ],
        r.status,
      ) +
      area(
        "stepsText",
        "Schritte – ein Schritt pro Zeile",
        (r.steps || []).map((s) => s.title).join("\n"),
      ) +
      area(
        "packingText",
        "Packliste – ein Eintrag pro Zeile",
        (r.packing || []).map((s) => s.title).join("\n"),
      );
  if (kind === "medication")
    html +=
      field("instructions", "Eigene Einnahmeangaben", r.instructions) +
      field("quantity", "Vorhandene Menge (eigene Angabe)", r.quantity) +
      field("dueDate", "Ablaufdatum", r.dueDate, "date") +
      '<p class="notice">Übernimm hier nur eigene oder verordnete Angaben. Goldie berechnet keine Dosierung.</p>';
  if (kind === "message")
    html +=
      field("recipient", "Empfangende Person", r.recipient, "text", true) +
      area("text", "Nachrichtentext", r.text) +
      select(
        "channel",
        "Gewünschter Weg",
        [
          ["email", "E-Mail"],
          ["sms", "SMS"],
          ["whatsapp", "WhatsApp"],
          ["internal", "Interner Chat"],
        ],
        r.channel || "email",
      ) +
      '<p class="notice">Speichern legt nur einen Entwurf an. Es wird keine Nachricht versendet.</p>';
  if (kind !== "note") html += area("note", "Notiz (optional)", r.note);
  dialog(
    `${titles[kind]} ${old ? "bearbeiten" : "anlegen"}`,
    `<form id="record-form">${html}<p id="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="secondary" data-action="close-dialog">Abbrechen</button><button class="primary">${old ? "Änderungen speichern" : "Auf diesem Gerät speichern"}</button></div></form>`,
    (el) =>
      el.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        data.id = old?.id || crypto.randomUUID();
        if (kind === "contact")
          data.important = !!e.target.elements.important.checked;
        if (kind === "list") data.items = old?.items || [];
        if (kind === "routine") data.completedDates = old?.completedDates || [];
        if (kind === "plan") {
          for (const [fieldName, arrayName] of [
            ["stepsText", "steps"],
            ["packingText", "packing"],
          ]) {
            const usedIds = new Set();
            data[arrayName] = data[fieldName]
              .split("\n")
              .filter((t) => t.trim())
              .map((t) => {
                const prior = old?.[arrayName]?.find(
                  (s) => s.title === t.trim() && !usedIds.has(s.id),
                );
                if (prior) usedIds.add(prior.id);
                return (
                  prior || {
                    id: crypto.randomUUID(),
                    title: t.trim(),
                    done: false,
                  }
                );
              });
            delete data[fieldName];
          }
        }
        data.createdAt = old?.createdAt || new Date().toISOString();
        const errors = validateRecord(kind, data);
        if (errors.length) {
          const p = el.querySelector("#form-error");
          p.className = "form-error";
          p.textContent = errors.join(" ");
          return;
        }
        if (
          update((next) => {
            const idx = next[key].findIndex((x) => x.id === data.id);
            if (idx < 0) next[key].push(data);
            else next[key][idx] = data;
          })
        ) {
          el.close();
        }
      }),
  );
}
function detail(kind, id) {
  const r = state[collections[kind]].find((x) => x.id === id);
  if (!r) return;
  let body = `<p class="lead">${escape(r.note || r.text || "")}</p>`;
  if (kind === "event")
    body =
      `<p class="lead">${formatDate(r.date)} · ${escape(r.time || "Ganztägig")}<br>${escape(r.location || "")}</p>` +
      body;
  if (kind === "contact")
    body += `<p>${escape(r.phone || "Keine Telefonnummer")}</p><p>${escape(r.email || "Keine E-Mail-Adresse")}</p><div class="record-actions">${r.phone ? '<button class="secondary" data-action="call" data-id="' + escape(id) + '">Anrufen</button>' : ""}<button class="secondary" data-action="contact-message" data-id="${escape(id)}">Nachricht schreiben</button></div>`;
  if (kind === "routine")
    body =
      `<p class="lead">${frequencyLabel(r.frequency)} · ${escape(r.time || "Ohne Uhrzeit")}<br>Start: ${formatDate(r.date)}</p><button class="secondary" data-action="routine-done" data-id="${escape(id)}">${r.completedDates?.includes(todayISO()) ? "Heute wieder öffnen" : "Heute als erledigt markieren"}</button><p class="notice section">Erinnerungszustellung ist noch nicht verbunden.</p>` +
      body;
  if (kind === "document")
    body += `<p>${r.dueDate ? "Frist: " + formatDate(r.dueDate) : "Keine Frist eingetragen"}</p><p class="notice section">Keine Datei hochgeladen. Dateiablage noch nicht verbunden.</p>`;
  if (kind === "medication")
    body += `<p>Eigene Einnahmeangaben: ${escape(r.instructions || "Keine")}</p><p>Menge: ${escape(r.quantity || "Keine Angabe")}</p><p>${r.dueDate ? "Ablaufdatum: " + formatDate(r.dueDate) : ""}</p><button class="secondary section" data-action="medication-routine" data-id="${escape(id)}">Erinnerungsroutine vorbereiten</button>`;
  if (kind === "message")
    body = `<p class="lead">An ${escape(r.recipient)} · Entwurf, nicht gesendet</p><p>${escape(r.text)}</p><button class="primary section" data-action="handoff" data-id="${escape(id)}">Übergabe prüfen</button>`;
  if (kind === "plan")
    body += `<p>${escape(r.category)} · ${escape(r.status)}${r.date ? " · " + formatDate(r.date) : ""}</p>${["steps", "packing"].map((k) => `<section class="plan-section"><h3>${k === "steps" ? "Schritte" : "Packliste"}</h3>${(r[k] || []).map((s) => `<label class="checkrow ${s.done ? "done" : ""}"><input type="checkbox" data-plan-check="${escape(s.id)}" data-id="${escape(id)}" data-key="${k}" ${s.done ? "checked" : ""}><span>${escape(s.title)}</span></label>`).join("") || '<p class="muted">Noch keine Einträge.</p>'}</section>`).join("")}`;
  dialog(
    r.title || r.name || titles[kind],
    body +
      `<div class="dialog-actions"><button class="secondary" data-edit="${kind}" data-id="${escape(id)}">Bearbeiten</button>${["event", "list", "document"].includes(kind) ? `<button class="secondary" data-grant="${kind}" data-id="${escape(id)}">Freigabe vorbereiten</button>` : ""}<button class="text-button danger" data-delete="${kind}" data-id="${escape(id)}">Löschen</button></div>`,
  );
}
function newListItem(data) {
  dialog(
    "Listeneintrag prüfen",
    `<form id="item-form">${field("title", "Eintrag", data.title, "text", true)}${select("listId", "Liste", [["", "Bitte auswählen"], ...state.lists.map((l) => [l.id, l.title])])}<p class="notice">Wenn du noch keine Liste hast, lege unter „Planen → Listen“ eine an.</p><p id="form-error" role="alert"></p><div class="dialog-actions"><button type="button" class="secondary" data-new="list">Neue Liste</button><button class="primary">Eintrag speichern</button></div></form>`,
    (el) =>
      el.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        if (!state.lists.some((l) => l.id === data.listId)) {
          el.querySelector("#form-error").textContent =
            "Bitte eine Liste auswählen.";
          return;
        }
        if (
          update((next) =>
            next.lists
              .find((l) => l.id === data.listId)
              .items.push({
                id: crypto.randomUUID(),
                title: data.title.trim(),
                done: false,
              }),
          )
        )
          el.close();
      }),
  );
}
function grant(kind = "", id = "") {
  const options = Object.entries(collections)
    .filter(([k]) => ["event", "list", "document"].includes(k))
    .flatMap(([k, key]) =>
      state[key].map((r) => [`${k}:${r.id}`, `${titles[k]}: ${r.title}`]),
    );
  dialog(
    "Freigabe vorbereiten",
    `<form id="grant-form"><p class="notice">Dies ist ein Entwurf. Ohne Kontoanbindung bekommt niemand Zugriff.</p>${select("record", "Welcher Eintrag?", [["", "Bitte auswählen"], ...options], kind ? `${kind}:${id}` : "")}${field("recipient", "Für wen? (Name oder E-Mail)", "", "text", true)}${select(
      "permission",
      "Berechtigung",
      [
        ["read", "Nur lesen"],
        ["write", "Lesen und bearbeiten"],
      ],
    )}<p id="form-error" role="alert"></p><div class="dialog-actions"><button class="primary">Freigabeentwurf speichern</button></div></form>`,
    (el) =>
      el.querySelector("form").addEventListener("submit", (e) => {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target));
        const opt = options.find((o) => o[0] === data.record);
        if (!opt) {
          el.querySelector("#form-error").textContent =
            "Bitte einen Eintrag auswählen.";
          return;
        }
        if (
          update(
            (next) =>
              next.grants.push({
                ...data,
                id: crypto.randomUUID(),
                recordTitle: opt[1],
                status: "draft",
              }),
            "Freigabeentwurf gespeichert. Kein Zugriff erteilt.",
          )
        )
          el.close();
      }),
  );
}
function account() {
  dialog(
    "Konto noch nicht verbunden",
    `<p class="lead section">Anmeldung, Registrierung, Passwortwiederherstellung und Synchronisierung sind für Supabase vorgesehen. Wir verbinden dein getrenntes Goldie-Projekt im zweiten Schritt.</p><p class="notice">Aktuell werden keine Konten erstellt und keine Zugangsdaten abgefragt.</p><button class="secondary" data-more="connections">Verbindungen ansehen</button>`,
  );
}
function unavailable(title, service, detail = "") {
  dialog(
    title,
    `<p class="lead section">${escape(detail || "Diese Funktion ist vorbereitet, aber noch nicht verbunden.")}</p><p class="notice">${escape(service)} · Noch nicht verbunden. Es wurden keine Daten abgerufen oder übermittelt.</p><button class="secondary" data-more="connections">Verbindungen ansehen</button>`,
  );
}
function communicate(kind, r, target) {
  const label =
    kind === "call"
      ? `Anruf an ${r.name}: ${r.phone}`
      : `Nachricht an ${r.recipient} über ${r.channel}`;
  dialog(
    kind === "call" ? "Anruf bestätigen" : "Nachrichtenübergabe bestätigen",
    `<p class="lead section">${escape(label)}</p>${kind !== "call" ? `<div class="cream panel">${escape(r.text)}</div><p class="notice section">Die Nachricht wird in einer anderen App geöffnet. Dort entscheidest du über den Versand. Goldie kann die Zustellung nicht prüfen.</p>` : ""}<div class="dialog-actions"><button class="secondary" data-action="close-dialog">Abbrechen</button><button class="primary" id="confirm-handoff">${kind === "call" ? "Telefon-App öffnen" : "Andere App öffnen"}</button></div>`,
    (el) =>
      el.querySelector("#confirm-handoff").addEventListener("click", () => {
        el.close();
        window.location.href = target;
        toast("An die andere App übergeben. Zustellung nicht bestätigt.");
      }),
  );
}
function handoff(id) {
  const r = state.messages.find((m) => m.id === id);
  if (!r) return;
  if (r.channel === "internal")
    return unavailable("Interner Chat", "Supabase Realtime");
  const contact = state.contacts.find((c) =>
    [c.name, c.email, c.phone].some(
      (v) => v && v.toLowerCase() === r.recipient.toLowerCase(),
    ),
  );
  let target;
  if (r.channel === "email") {
    const recipient = contact?.email || r.recipient;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient))
      return dialog(
        "E-Mail-Adresse fehlt",
        '<p class="lead section">Bitte hinterlege die E-Mail-Adresse des Kontakts oder trage sie im Entwurf als Empfänger ein.</p>',
      );
    target = `mailto:${encodeURIComponent(recipient)}?body=${encodeURIComponent(r.text)}`;
  } else {
    const phone = (contact?.phone || r.recipient).replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{5,16}$/.test(phone))
      return dialog(
        "Telefonnummer fehlt",
        '<p class="lead section">Bitte hinterlege eine vollständige Telefonnummer beim Kontakt oder im Entwurf.</p>',
      );
    target =
      r.channel === "sms"
        ? `sms:${phone}?body=${encodeURIComponent(r.text)}`
        : `https://wa.me/${phone.replace(/^\+|^00/g, "")}?text=${encodeURIComponent(r.text)}`;
  }
  communicate("message", r, target);
}
function submitCommand(text) {
  messages.push({ role: "user", text });
  voiceState = "processing";
  render();
  let result;
  if (/was (steht|ist).*heute|heute.*an\??$/i.test(text)) {
    const events = state.events.filter((e) => e.date === todayISO());
    result = {
      type: "answer",
      text: events.length
        ? events.map((e) => `${e.time || "Ganztägig"}: ${e.title}`).join("\n")
        : "Für heute sind noch keine Termine eingetragen.",
    };
  } else result = parseCommand(text, state);
  messages.push({
    role: "goldie",
    text: result.text + (result.question ? "\n" + result.question : ""),
    draft: result.type === "draft" ? result : null,
  });
  voiceState = "idle";
  render();
  $("#prompt")?.focus();
}
function stopVoice() {
  voiceGeneration++;
  if (recorder && recorder.state !== "inactive") {
    recorder.onstop = null;
    recorder.stop();
  }
  stream?.getTracks().forEach((t) => t.stop());
  recorder = null;
  stream = null;
  window.speechSynthesis?.cancel();
  utterance = null;
  voiceState = "idle";
  $("#voice-status") && ($("#voice-status").innerHTML = voiceStatusHTML());
}
async function startRecording() {
  if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder)
    return unavailable(
      "Spracheingabe",
      "OpenAI Transkription",
      "Dein Browser bietet hier keine Audioaufnahme. Du kannst Goldie jederzeit schreiben.",
    );
  dialog(
    "Spracheingabe vorbereiten",
    `<p class="lead section">Die Transkription ist noch nicht verbunden. Du kannst das Mikrofon lokal testen; die Aufnahme wird anschließend verworfen und nicht übertragen.</p><div class="dialog-actions"><button class="secondary" data-action="close-dialog">Lieber schreiben</button><button class="primary" id="start-mic">Mikrofon lokal testen</button></div>`,
    (el) =>
      el.querySelector("#start-mic").addEventListener("click", async () => {
        el.close();
        stopVoice();
        const generation = voiceGeneration;
        try {
          voiceState = "requesting";
          const acquired = await navigator.mediaDevices.getUserMedia({
            audio: true,
          });
          if (
            page !== "goldie" ||
            voiceState !== "requesting" ||
            generation !== voiceGeneration
          ) {
            acquired.getTracks().forEach((t) => t.stop());
            return;
          }
          stream = acquired;
          recorder = new MediaRecorder(stream);
          recorder.onstop = () => {
            acquired.getTracks().forEach((t) => t.stop());
            if (generation !== voiceGeneration) return;
            stream = null;
            recorder = null;
            voiceState = "idle";
            render();
            toast(
              "Aufnahme verworfen. Die Transkription ist noch nicht verbunden.",
            );
          };
          recorder.onerror = () => {
            if (generation !== voiceGeneration) return;
            stopVoice();
            toast(
              "Die Aufnahme ist fehlgeschlagen. Bitte schreibe deine Nachricht.",
            );
          };
          recorder.start();
          voiceState = "listening";
          render();
        } catch {
          if (generation !== voiceGeneration) return;
          stopVoice();
          toast(
            "Mikrofonzugriff nicht möglich. Prüfe die Browserberechtigung oder schreibe Goldie.",
          );
        }
      }),
  );
}
function readText(text, slow = false) {
  if (!window.speechSynthesis)
    return toast("Vorlesen wird von diesem Browser nicht unterstützt.");
  stopVoice();
  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "de-DE";
  utterance.rate = slow ? 0.65 : Number(state.settings.rate) || 1;
  utterance.onend = () => {
    voiceState = "idle";
    $("#voice-status") && ($("#voice-status").innerHTML = voiceStatusHTML());
  };
  utterance.onerror = () => {
    voiceState = "idle";
    toast("Die Systemstimme konnte nicht gestartet werden.");
    $("#voice-status") && ($("#voice-status").innerHTML = voiceStatusHTML());
  };
  voiceState = "speaking";
  $("#voice-status") && ($("#voice-status").innerHTML = voiceStatusHTML());
  window.speechSynthesis.speak(utterance);
}
const actions = {
  search() {
    dialog(
      "Deine Angaben durchsuchen",
      `<form id="search-form">${field("query", "Suchbegriff", "", "text", true)}<button class="primary">Suchen</button></form><div id="search-results" class="search-results"></div>`,
      (el) =>
        el.querySelector("form").addEventListener("submit", (e) => {
          e.preventDefault();
          const q = e.target.elements.query.value.toLowerCase().trim();
          const hits = Object.entries(collections).flatMap(([kind, key]) =>
            state[key]
              .filter((r) =>
                [r.title, r.name, r.text, r.note, r.location]
                  .filter(Boolean)
                  .join(" ")
                  .toLowerCase()
                  .includes(q),
              )
              .map((r) => ({ kind, r })),
          );
          el.querySelector("#search-results").innerHTML = hits.length
            ? hits
                .map(
                  ({ kind, r }) =>
                    `<button class="secondary" data-open="${kind}" data-id="${escape(r.id)}">${titles[kind]} · ${escape(r.title || r.name || r.text)}</button>`,
                )
                .join("")
            : '<p class="muted">Keine passenden Angaben auf diesem Gerät gefunden.</p>';
        }),
    );
  },
  account,
  write() {
    navigate("goldie");
    $("#prompt").focus();
  },
  talk() {
    navigate("goldie");
    startRecording();
  },
  mic: startRecording,
  "stop-record"() {
    if (recorder?.state === "recording") recorder.stop();
  },
  "cancel-record"() {
    stopVoice();
    render();
    toast("Aufnahme verworfen.");
  },
  "stop-voice": stopVoice,
  "plan-add"() {
    edit(tab === "calendar" ? "event" : tab === "lists" ? "list" : "routine");
  },
  "new-event"() {
    edit("event");
  },
  "new-list"() {
    edit("list");
  },
  "new-routine"() {
    edit("routine");
  },
  "new-document"() {
    edit("document");
  },
  "shopping-list"() {
    edit("list", "", { category: "Einkauf" });
  },
  "meal-list"() {
    edit("list", "", { category: "Essensplan" });
  },
  "inventory-list"() {
    edit("list", "", { category: "Vorräte" });
  },
  "show-lists"() {
    navigate("plan");
    tab = "lists";
    render();
  },
  "waste-event"() {
    edit("event", "", { title: "Abholtermin" });
  },
  "prev-week"() {
    selectedDate = addDays(selectedDate, -7);
    render();
  },
  "next-week"() {
    selectedDate = addDays(selectedDate, 7);
    render();
  },
  "today-date"() {
    selectedDate = todayISO();
    render();
  },
  "prev-month"() {
    shiftMonth(-1);
  },
  "next-month"() {
    shiftMonth(1);
  },
  nearby() {
    unavailable(
      "Ausflugsziele in der Nähe",
      "Google Places",
      "Die Ortssuche ist vorbereitet. Ohne Verbindung können keine aktuellen Ausflugsziele oder Angaben zur Barrierefreiheit abgerufen werden.",
    );
  },
  "gift-search"() {
    unavailable(
      "Geschenkideen finden",
      "OpenAI / Produktsuche",
      "Die Online-Suche ist noch nicht verbunden. Du kannst eine Liste mit eigenen Geschenkideen anlegen.",
    );
  },
  community() {
    unavailable(
      "Gemeinschaft & Veranstaltungen",
      "Datenquelle noch festzulegen",
      "Die Ansicht ist vorbereitet. Eine geeignete Quelle für aktuelle Gruppen und Veranstaltungen wird im zweiten Schritt geprüft.",
    );
  },
  selftime() {
    edit("event", "", { title: "Zeit für mich" });
  },
  "goldie-options"() {
    dialog(
      "Goldie-Optionen",
      '<div class="section card-stack"><button class="secondary" data-more="settings">Schrift und Sprachtempo</button><button class="secondary" data-action="clear-conversation">Gespräch hier leeren</button><button class="secondary" data-more="connections">Verbindungen ansehen</button></div>',
    );
  },
  "clear-conversation"() {
    messages = [];
    stopVoice();
    $("#dialog").close();
    render();
  },
  "close-dialog"() {
    $("#dialog").close();
  },
  undo() {
    if (!undoState) return;
    try {
      const current = state;
      const previous = undoState;
      store(previous);
      undoState = current;
      render();
      toast("Änderung rückgängig gemacht.");
    } catch (e) {
      toast(e.message);
    }
  },
  grant() {
    grant();
  },
  call(el) {
    const c = state.contacts.find((c) => c.id === el.dataset.id);
    if (!c) return;
    const phone = c.phone.replace(/[\s()-]/g, "");
    if (!/^\+?[0-9]{5,16}$/.test(phone))
      return toast(
        "Bitte eine gültige Telefonnummer beim Kontakt hinterlegen.",
      );
    communicate("call", c, `tel:${phone}`);
  },
  "contact-message"(el) {
    const c = state.contacts.find((c) => c.id === el.dataset.id);
    edit("message", "", { recipient: c.name });
  },
  handoff(el) {
    handoff(el.dataset.id);
  },
  "routine-done"(el) {
    const id = el.dataset.id;
    if (
      update((next) => {
        const r = next.routines.find((r) => r.id === id);
        const dates = r.completedDates || [];
        r.completedDates = dates.includes(todayISO())
          ? dates.filter((d) => d !== todayISO())
          : [...dates, todayISO()];
      }, "Routine für heute aktualisiert.")
    )
      detail("routine", id);
  },
  "medication-routine"(el) {
    const r = state.medications.find((r) => r.id === el.dataset.id);
    edit("routine", "", { title: r.title, category: "Medikamente" });
  },
  export() {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `goldie-angaben-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast("Deine Angaben wurden als Datei zum Herunterladen bereitgestellt.");
  },
};
function shiftMonth(delta) {
  const d = new Date(selectedDate + "T12:00:00"),
    day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + delta);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  selectedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  render();
}
document.addEventListener("click", (e) => {
  const el = e.target.closest("button");
  if (!el) return;
  const d = el.dataset;
  if (d.nav) {
    $("#dialog").close();
    navigate(d.nav);
    return;
  }
  if (d.more) {
    $("#dialog").close();
    navigate("more", d.more);
    return;
  }
  if (d.tab) {
    tab = d.tab;
    render();
    return;
  }
  if (d.date) {
    selectedDate = d.date;
    render();
    return;
  }
  if (d.new) {
    edit(d.new);
    return;
  }
  if (d.open) {
    detail(d.open, d.id);
    return;
  }
  if (d.edit) {
    edit(d.edit, d.id);
    return;
  }
  if (d.delete) {
    dialog(
      "Eintrag löschen?",
      `<p class="lead section">Möchtest du diesen Eintrag auf diesem Gerät löschen?</p><div class="dialog-actions"><button class="secondary" data-action="close-dialog">Behalten</button><button class="primary" id="confirm-delete">Löschen</button></div>`,
      (dlg) =>
        dlg.querySelector("#confirm-delete").addEventListener("click", () => {
          if (
            update((next) => {
              next[collections[d.delete]] = next[collections[d.delete]].filter(
                (r) => r.id !== d.id,
              );
              next.grants = next.grants.filter(
                (g) => g.record !== `${d.delete}:${d.id}`,
              );
            }, "Eintrag gelöscht.")
          )
            dlg.close();
        }),
    );
    return;
  }
  if (d.grant) {
    grant(d.grant, d.id);
    return;
  }
  if (d.draft !== undefined) {
    const draft = messages[Number(d.draft)]?.draft;
    if (!draft) return;
    if (draft.kind === "listItem") newListItem(draft.data);
    else edit(draft.kind, "", draft.data);
    return;
  }
  if (d.read !== undefined || d.readSlow !== undefined) {
    readText(
      messages[Number(d.read ?? d.readSlow)].text,
      d.readSlow !== undefined,
    );
    return;
  }
  if (d.repeat !== undefined) {
    messages.push({ ...messages[Number(d.repeat)] });
    render();
    return;
  }
  if (d.removeItem) {
    update((next) => {
      const l = next.lists.find((l) => l.id === d.list);
      l.items = l.items.filter((i) => i.id !== d.removeItem);
    }, "Listeneintrag entfernt.");
    return;
  }
  if (d.removeGrant) {
    update((next) => {
      next.grants = next.grants.filter((g) => g.id !== d.removeGrant);
    }, "Freigabeentwurf entfernt.");
    return;
  }
  if (d.action) actions[d.action]?.(el);
});
document.addEventListener("change", (e) => {
  const d = e.target.dataset;
  if (d.toggleItem) {
    update((next) => {
      const item = next.lists
        .find((l) => l.id === d.list)
        ?.items.find((i) => i.id === d.toggleItem);
      if (item) item.done = e.target.checked;
    }, "Listenstatus gespeichert.");
  }
  if (d.planCheck) {
    if (
      update((next) => {
        next.plans
          .find((p) => p.id === d.id)
          [d.key].find((s) => s.id === d.planCheck).done = e.target.checked;
      }, "Schritt aktualisiert.")
    )
      detail("plan", d.id);
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "composer") {
    e.preventDefault();
    const text = e.target.elements.prompt.value.trim();
    if (text) submitCommand(text);
  }
  if (e.target.dataset.listAdd) {
    e.preventDefault();
    const id = e.target.dataset.listAdd,
      title = e.target.elements.title.value.trim();
    if (title)
      update((next) =>
        next.lists
          .find((l) => l.id === id)
          .items.push({ id: crypto.randomUUID(), title, done: false }),
      );
  }
  if (e.target.id === "settings-form") {
    e.preventDefault();
    const data = new FormData(e.target);
    update((next) => {
      next.settings = {
        name: String(data.get("name")).trim(),
        fontScale: Number(data.get("fontScale")),
        contrast: data.has("contrast"),
        rate: Number(data.get("rate")),
      };
    });
  }
});
document.addEventListener("visibilitychange", () => {
  if (document.hidden) stopVoice();
});
window.addEventListener("pagehide", stopVoice);
$("#dialog").addEventListener("cancel", () => {
  if (voiceState === "requesting") stopVoice();
});
render();
fetch("/api/status")
  .then((r) => r.json())
  .then((r) => {
    services = r.services || [];
    if (page === "more" && moreView === "connections") render();
  })
  .catch(() => {});
