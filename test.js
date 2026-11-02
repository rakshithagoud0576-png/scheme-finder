// Run with: npm test   (or: node test.js)
"use strict";

const assert = require("assert");
const Engine = require("./engine");
const Data = require("./schemes");

const byId = (id) => Data.SCHEMES.find((s) => s.id === id);
let passed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log("  ok   " + name);
  } catch (e) {
    console.error("  FAIL " + name + "\n       " + e.message);
    process.exitCode = 1;
  }
}

console.log("Engine tests");

test("farmer with land, not a taxpayer is eligible for PM-KISAN", () => {
  const r = Engine.evaluate(byId("pm-kisan"), { occupation: "farmer", ownsLand: true, taxpayer: false });
  assert.strictEqual(r.status, "eligible");
});

test("missing answers give 'maybe', not 'eligible'", () => {
  const r = Engine.evaluate(byId("pm-kisan"), { occupation: "farmer" });
  assert.strictEqual(r.status, "maybe");
  assert.strictEqual(r.unknown.length, 2);
});

test("failing exactly one rule gives 'almost' with a reason", () => {
  const r = Engine.evaluate(byId("pm-kisan"), { occupation: "farmer", ownsLand: true, taxpayer: true });
  assert.strictEqual(r.status, "almost");
  assert.strictEqual(r.failed[0].label, "Income tax payers are excluded");
});

test("failing two rules gives 'no'", () => {
  const r = Engine.evaluate(byId("pm-kisan"), { occupation: "student", ownsLand: false, taxpayer: false });
  assert.strictEqual(r.status, "no");
});

test("anyOf group: age 70+ qualifies for PM-JAY without BPL", () => {
  const r = Engine.evaluate(byId("pmjay"), { age: 72, bpl: false });
  assert.strictEqual(r.status, "eligible");
});

test("anyOf group: neither condition met fails", () => {
  const r = Engine.evaluate(byId("pmjay"), { age: 30, bpl: false });
  assert.strictEqual(r.status, "almost");
});

test("between is inclusive on both ends", () => {
  const rule = { field: "age", op: "between", value: [18, 40] };
  assert.strictEqual(Engine.checkRule(rule, { age: 18 }), "pass");
  assert.strictEqual(Engine.checkRule(rule, { age: 40 }), "pass");
  assert.strictEqual(Engine.checkRule(rule, { age: 41 }), "fail");
});

test("income limit: lte boundary", () => {
  const rule = { field: "income", op: "lte", value: 250000 };
  assert.strictEqual(Engine.checkRule(rule, { income: 250000 }), "pass");
  assert.strictEqual(Engine.checkRule(rule, { income: 250001 }), "fail");
});

test("state scheme is 'no' for residents of another state", () => {
  const r = Engine.evaluate(byId("kalyana-lakshmi"), { state: "Karnataka", gender: "female", age: 22, income: 100000 });
  assert.strictEqual(r.status, "no");
});

test("state scheme is eligible for matching state", () => {
  const r = Engine.evaluate(byId("kalyana-lakshmi"), { state: "telangana", gender: "female", age: 22, income: 100000 });
  assert.strictEqual(r.status, "eligible");
});

test("an empty profile never reports 'eligible'", () => {
  const groups = Engine.matchAll(Data.SCHEMES, {});
  assert.strictEqual(groups.eligible.length, 0);
  assert.strictEqual(groups.maybe.length, Data.SCHEMES.length);
});

test("suggestNextField picks an unanswered field, and nothing once all are answered", () => {
  const keys = Data.FIELDS.map((f) => f.key);
  const first = Engine.suggestNextField(Data.SCHEMES, {}, keys);
  assert.ok(keys.includes(first));
  const full = {
    age: 30, gender: "male", state: "Telangana", income: 100000, category: "General",
    occupation: "other", bpl: false, ownsLand: false, taxpayer: false, girlChild: false, disability: false,
  };
  assert.strictEqual(Engine.suggestNextField(Data.SCHEMES, full, keys), null);
});

test("every scheme is well-formed", () => {
  const ids = new Set();
  Data.SCHEMES.forEach((s) => {
    assert.ok(s.id && s.name && s.benefit && s.url, s.id + " missing basic fields");
    assert.ok(!ids.has(s.id), "duplicate id " + s.id);
    ids.add(s.id);
    assert.ok(Array.isArray(s.rules) && s.rules.length > 0, s.id + " has no rules");
    assert.ok(Array.isArray(s.documents) && s.documents.length > 0, s.id + " has no documents");
    s.rules.forEach((r) => assert.ok(r.label, s.id + " has a rule without a label"));
  });
});

console.log("\n" + passed + " passed" + (process.exitCode ? ", some FAILED" : ""));
