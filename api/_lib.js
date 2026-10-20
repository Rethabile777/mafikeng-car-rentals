// Shared helpers for the API: database pool, pricing rules, validation.
const mysql = require("mysql2/promise");

// Business rules. Keep these the same as the documentation.
const RULES = {
  deliveryFee: 100,
  depositPct: 0.3,
  longTermDays: 30,
  longTermDiscount: 0.1,
  maxDays: 90
};

let pool;
function db() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 4000),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "mafikeng_wheels",
      ssl: { minVersion: "TLSv1.2", rejectUnauthorized: true },
      dateStrings: true,          // return DATE columns as 'YYYY-MM-DD' text
      connectionLimit: 3,
      waitForConnections: true
    });
  }
  return pool;
}

// Today's date in South Africa as YYYY-MM-DD.
const todaySA = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Johannesburg" }).format(new Date());

const isDate = s => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s + "T00:00:00Z"));
const daysBetween = (a, b) => Math.round((Date.parse(b + "T00:00:00Z") - Date.parse(a + "T00:00:00Z")) / 864e5);

class HttpError extends Error { constructor(status, message) { super(message); this.status = status; } }

// Wraps a handler: CORS, JSON body, error handling.
function handler(fn) {
  return async (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    const send = (status, obj) => { res.statusCode = status; res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(obj)); };
    if (req.method === "OPTIONS") { res.statusCode = 204; return res.end(); }
    try {
      if (req.method === "POST" && req.body === undefined) {
        let raw = ""; for await (const c of req) { raw += c; if (raw.length > 20000) throw new HttpError(413, "Request too large."); }
        try { req.body = raw ? JSON.parse(raw) : {}; } catch (e) { throw new HttpError(400, "Invalid JSON."); }
      }
      if (typeof req.body === "string") { try { req.body = JSON.parse(req.body); } catch (e) { throw new HttpError(400, "Invalid JSON."); } }
      send(200, await fn(req));
    } catch (e) {
      if (e instanceof HttpError) return send(e.status, { error: e.message });
      console.error(e);
      send(500, { error: "Something went wrong on our side. Please try again or WhatsApp us." });
    }
  };
}

// Overlap rule: existing [s,e) clashes with requested [start,end) when s < end AND e > start.
const OVERLAP_SQL = "b.Booking_Status <> 'Cancelled' AND b.Start_Date < ? AND b.End_Date > ?";

module.exports = { RULES, db, todaySA, isDate, daysBetween, HttpError, handler, OVERLAP_SQL };
