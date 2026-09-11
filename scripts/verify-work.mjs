import assert from "node:assert/strict";

function atTime(base, hhmm) {
  const [hours, minutes] = hhmm.split(":").map(Number);
  const next = new Date(base.getTime());
  next.setUTCHours(hours, minutes, 0, 0);
  return next;
}

function secondsBetween(from, to) {
  return Math.max(0, Math.floor((to.getTime() - from.getTime()) / 1000));
}

const now = new Date(Date.UTC(2026, 8, 4, 13, 54, 0));
const start = atTime(now, "09:00");
const end = atTime(now, "19:00");
const worked = secondsBetween(start, now);
const remaining = secondsBetween(now, end);
const daily = 12223 / 22;
const hourly = daily / 10;
const earned = (daily / 36000) * worked;

assert.equal(worked, 17640);
assert.equal(remaining, 18360);
assert.ok(Math.abs(hourly - 55.56) < 0.01);
assert.ok(earned > 270 && earned < 273);
assert.equal(Math.round((worked / 36000) * 100), 49);

console.log("work math ok", {
  hourly: hourly.toFixed(2),
  earned: earned.toFixed(2),
  worked,
  remaining,
});
