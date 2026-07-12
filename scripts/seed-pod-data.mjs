#!/usr/bin/env node
/**
 * Seed đơn hàng mẫu từ CSV Etsy (data/etsy-orders-sample.csv) — FLAT MODE.
 * Mỗi field = một cột thật (không dùng data jsonb).
 * Yêu cầu: đã chạy supabase/schema_columns.sql
 *
 * Chạy: node scripts/seed-pod-data.mjs
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CSV_PATH = resolve(ROOT, "data/etsy-orders-sample.csv");
const STORE_ID = "store-besun-0000000001";

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

function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { cell += '"'; i++; }
        else inQuotes = false;
      } else cell += c;
    } else if (c === '"') inQuotes = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  if (cell !== "" || row.length) { row.push(cell); rows.push(row); }
  const header = rows[0];
  return rows.slice(1).map((r) => {
    const obj = {};
    header.forEach((h, i) => (obj[h.trim()] = (r[i] ?? "").trim()));
    return obj;
  });
}

function toISO(d) {
  if (!d) return null;
  const m = d.match(/^(\d{2})\/(\d{2})\/(\d{2,4})$/);
  if (!m) return null;
  const year = m[3].length === 2 ? `20${m[3]}` : m[3];
  return new Date(`${year}-${m[1]}-${m[2]}T00:00:00Z`).toISOString();
}

function parseVariations(v) {
  const out = { color: "", size: "", personalization: "" };
  (v || "").split(",").forEach((part) => {
    const idx = part.indexOf(":");
    if (idx < 0) return;
    const key = part.slice(0, idx).trim().toLowerCase();
    const value = part.slice(idx + 1).trim();
    if (key.includes("color")) out.color = value;
    else if (key.includes("size")) out.size = value;
    else if (key.includes("personalization")) out.personalization = value;
  });
  return out;
}

async function upsert(table, rows) {
  for (let i = 0; i < rows.length; i += 500) {
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
        body: JSON.stringify(rows.slice(i, i + 500)),
      }
    );
    if (!res.ok)
      throw new Error(`Supabase ${res.status} (${table}): ${await res.text()}`);
  }
}

// ---------- Orders từ CSV Etsy (flat) ----------
const rows = parseCSV(readFileSync(CSV_PATH, "utf8"));
const byOrder = new Map();
for (const r of rows) {
  const orderId = r["Order ID"];
  if (!orderId) continue;
  if (!byOrder.has(orderId)) byOrder.set(orderId, []);
  byOrder.get(orderId).push(r);
}

const skuSet = new Set();
const orders = [...byOrder.entries()].map(([orderId, items]) => {
  const f = items[0];
  items.forEach((it) => it.SKU && skuSet.add(it.SKU));
  return {
    id: `etsy-${orderId}`,
    orderCode: orderId,
    storeId: STORE_ID,
    storeName: "BESUN",
    status: f["Date Shipped"] ? "completed" : "pending_payment",
    tracking: "",
    source: "etsy",
    customerName: f["Ship Name"] || f["Buyer"],
    customerEmail: "",
    customerPhone: "",
    address1: f["Ship Address1"],
    address2: f["Ship Address2"],
    city: f["Ship City"],
    state: f["Ship State"],
    zip: f["Ship Zipcode"],
    country: f["Ship Country"] || "United States",
    items: items.map((it) => {
      const v = parseVariations(it["Variations"]);
      return {
        productName: it["Item Name"],
        productSku: it["SKU"] || "",
        sku: it["SKU"] || "",
        color: v.color,
        size: v.size,
        personalization: v.personalization,
        quantity: parseInt(it["Quantity"]) || 1,
        price: parseFloat(it["Price"]) || 0,
        itemTotal: parseFloat(it["Item Total"]) || 0,
        transactionId: it["Transaction ID"],
        frontUrl: "", backUrl: "", mockupUrl: "", extraAreas: [], note: "",
      };
    }),
    note: "",
    total: items.reduce((s, it) => s + (parseFloat(it["Item Total"]) || 0), 0),
    created: toISO(f["Sale Date"]) || new Date().toISOString(),
    datePaid: toISO(f["Date Paid"]),
    dateShipped: toISO(f["Date Shipped"]),
  };
});

// ---------- Designs: 1 dòng cho mỗi SKU trong CSV (flat) ----------
const designs = [...skuSet].map((sku) => ({
  id: `design-${sku.replace(/[^a-zA-Z0-9]/g, "-").toLowerCase()}`,
  sku,
  frontUrl: "",
  backUrl: "",
  mockupUrl: "",
  extraAreas: [],
  testBg: "#FFFFFF",
  created: new Date().toISOString(),
}));

console.log(`\n🚀 Seed (flat): ${designs.length} designs, ${orders.length} đơn (${rows.length} items CSV)\n`);
await upsert("designs", designs);
console.log("  designs   ✅");
await upsert("podOrders", orders);
console.log("  podOrders ✅");
console.log("\n🎉 Xong!\n");
