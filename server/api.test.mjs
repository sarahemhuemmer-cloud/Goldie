import test from "node:test";
import assert from "node:assert/strict";
import { handleApi, integrations, canAccessRecord } from "./api.mjs";
test("every integration refuses operation without claiming connection", () => {
  for (const service of [...Object.keys(integrations), "unknown"]) {
    let status, headers, body;
    const response = {
      writeHead(s, h) {
        status = s;
        headers = h;
      },
      end(b) {
        body = JSON.parse(b);
      },
    };
    assert.equal(
      handleApi({ url: `/api/${service}`, method: "POST" }, response),
      true,
    );
    assert.equal(status, 503);
    assert.equal(body.error, "integration_not_connected");
    assert.equal(headers["Cache-Control"], "no-store");
  }
});
test("non API requests are left to static server", () =>
  assert.equal(handleApi({ url: "/planen" }, {}), false));
test("ownership and explicit per-record grants prevent cross-user access", () => {
  const record = { id: "a", owner_id: "owner" };
  assert.equal(canAccessRecord("owner", record, [], "write"), true);
  assert.equal(canAccessRecord("other", record), false);
  assert.equal(canAccessRecord(null, record), false);
  assert.equal(
    canAccessRecord("other", record, [
      { record_id: "b", recipient_id: "other", permission: "write" },
    ]),
    false,
  );
  const grants = [
    { record_id: "a", recipient_id: "other", permission: "read" },
  ];
  assert.equal(canAccessRecord("other", record, grants), true);
  assert.equal(canAccessRecord("other", record, grants, "write"), false);
});
