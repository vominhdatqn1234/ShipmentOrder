#!/usr/bin/env node
/**
 * Migrate toàn bộ data từ Firestore -> Supabase.
 * Không cần dependency, chạy bằng Node 18+:
 *
 *   node scripts/migrate-firestore-to-supabase.mjs
 *
 * Yêu cầu:
 *  1. Đã chạy supabase/schema.sql trong Supabase SQL Editor
 *  2. File .env có REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY
 *     (hoặc set env SUPABASE_SERVICE_ROLE_KEY để ghi khi bảng bật RLS)
 *  3. Firestore rules cho phép đọc (app hiện tại đọc bằng client key nên mặc định là được)
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// ----- Firebase project (lấy từ src/lib cũ) -----
const FIREBASE_PROJECT_ID = "shipmentinfomation";
const FIREBASE_API_KEY = "AIzaSyDpuVkE-v1ay3_-zLCl9MCkktPn_xpUQSs";

const COLLECTIONS = [
  "aboutMePage",
  "booking",
  "contactPage",
  "contract",
  "employee",
  "homePage",
  "orders",
  "priceWedding",
  "productType",
  "revenue",
  "searchOrders",
  "servicePage",
  "servicesArising",
  "team",
  "weddingDress",
  "weddingDressType",
];

// ----- Đọc .env -----
function loadEnv() {
  const env = {};
  try {
    for (const line of readFileSync(resolve(ROOT, ".env"), "utf8").split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (m) env[m[1]] = m[2];
    }
  } catch {}
  return { ...env, ...process.env };
}
const env = loadEnv();
const SUPABASE_URL = env.REACT_APP_SUPABASE_URL;
const SUPABASE_KEY =
  env.SUPABASE_SERVICE_ROLE_KEY || env.REACT_APP_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("❌ Thiếu REACT_APP_SUPABASE_URL / REACT_APP_SUPABASE_ANON_KEY trong .env");
  process.exit(1);
}

// ----- Decode giá trị từ Firestore REST -----
function decodeValue(v) {
  if (v == null) return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("timestampValue" in v) return v.timestampValue; // ISO string
  if ("mapValue" in v) return decodeFields(v.mapValue.fields || {});
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(decodeValue);
  if ("referenceValue" in v) return v.referenceValue;
  if ("geoPointValue" in v) return v.geoPointValue;
  if ("bytesValue" in v) return v.bytesValue;
  return null;
}
function decodeFields(fields) {
  const out = {};
  for (const [k, v] of Object.entries(fields)) out[k] = decodeValue(v);
  return out;
}

// ----- Đọc 1 collection từ Firestore (phân trang) -----
async function fetchCollection(name) {
  const docs = [];
  let pageToken = "";
  do {
    const url =
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}` +
      `/databases/(default)/documents/${encodeURIComponent(name)}` +
      `?pageSize=300&key=${FIREBASE_API_KEY}` +
      (pageToken ? `&pageToken=${pageToken}` : "");
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Firestore ${res.status} khi đọc "${name}": ${await res.text()}`
      );
    }
    const json = await res.json();
    for (const d of json.documents || []) {
      const id = d.name.split("/").pop();
      docs.push({ id, data: decodeFields(d.fields || {}) });
    }
    pageToken = json.nextPageToken || "";
  } while (pageToken);
  return docs;
}

// ----- Ghi vào Supabase (upsert theo id, batch 500) -----
async function upsertRows(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${encodeURIComponent(table)}?on_conflict=id`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(batch),
      }
    );
    if (!res.ok) {
      throw new Error(
        `Supabase ${res.status} khi ghi "${table}": ${await res.text()}\n` +
          `→ Kiểm tra đã chạy supabase/schema.sql chưa?`
      );
    }
  }
}

// ----- Main -----
console.log(`\n🚀 Migrate Firestore (${FIREBASE_PROJECT_ID}) → Supabase\n`);
let total = 0;
let failed = 0;
for (const name of COLLECTIONS) {
  process.stdout.write(`  ${name.padEnd(20)}`);
  try {
    const docs = await fetchCollection(name);
    if (docs.length) await upsertRows(name, docs);
    total += docs.length;
    console.log(`✅ ${docs.length} documents`);
  } catch (err) {
    failed++;
    console.log(`❌ ${err.message}`);
  }
}
console.log(`\n${failed ? "⚠️" : "🎉"} Xong: ${total} documents${failed ? `, ${failed} collection lỗi` : ""}.\n`);
process.exit(failed ? 1 : 0);
