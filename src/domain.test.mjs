import test from "node:test";
import assert from "node:assert/strict";
import {
  emptyState,
  addDays,
  weekDates,
  formatDate,
  validateRecord,
  parseCommand,
  applyRecord,
} from "./domain.mjs";
test("empty state contains no demo or personal data", () => {
  const state = emptyState();
  assert.equal(state.settings.name, "");
  for (const value of Object.values(state))
    if (Array.isArray(value)) assert.equal(value.length, 0);
});
test("calendar uses actual weekdays and handles leap dates", () => {
  assert.match(formatDate("2026-10-10"), /Samstag/);
  assert.equal(weekDates("2026-10-10")[5], "2026-10-10");
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2024-02-29", 1), "2024-03-01");
  assert.throws(() => addDays("2026-02-29", 1));
});
test("ambiguous calendar date is not filled in", () => {
  const d = parseCommand(
    "Termin beim Arzt am Freitag",
    emptyState(),
    new Date(2026, 9, 13),
  );
  assert.equal(d.data.date, "");
  assert.match(d.question, /Datum/);
  assert.match(d.text, /noch nicht gespeichert/);
});
test("explicit relative date and time produce a draft without mutating state", () => {
  const state = emptyState();
  const d = parseCommand(
    "Termin morgen um 10 Uhr Zahnarzt",
    state,
    new Date(2026, 9, 13),
  );
  assert.equal(d.type, "draft");
  assert.equal(d.data.date, "2026-10-14");
  assert.equal(d.data.time, "10:00");
  assert.equal(state.events.length, 0);
});
test("missing time is clarified instead of inferred", () => {
  const d = parseCommand(
    "Termin heute Zahnarzt",
    emptyState(),
    new Date(2026, 9, 13),
  );
  assert.equal(d.data.time, "");
  assert.match(d.question, /Uhrzeit/);
});
test("message creates a draft and never sends", () => {
  const d = parseCommand("Nachricht an Eva: Hallo");
  assert.equal(d.kind, "message");
  assert.equal(d.data.recipient, "Eva");
  assert.equal(d.data.text, "Hallo");
  assert.match(d.text, /nichts versendet/);
});
test("external results are honest about unavailable connection", () => {
  assert.match(
    parseCommand("Ausflüge in der Nähe").text,
    /noch nicht verbunden/,
  );
});
test("guard rejects missing and invalid event dates", () => {
  assert.ok(validateRecord("event", { title: "Arzt" }).length);
  assert.ok(
    validateRecord("event", { title: "Arzt", date: "2026-02-30" }).length,
  );
  assert.throws(() => applyRecord(emptyState(), "event", { title: "Arzt" }));
});
test("list and daily reminder become drafts", () => {
  assert.equal(parseCommand("Milch auf die Einkaufsliste").data.title, "Milch");
  const d = parseCommand("Erinnere mich täglich um 9 Uhr ans Trinken");
  assert.equal(d.kind, "routine");
  assert.equal(d.data.frequency, "daily");
  assert.equal(d.data.time, "09:00");
});
