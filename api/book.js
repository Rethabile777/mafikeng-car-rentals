// POST /api/book -> saves CUSTOMER, one BOOKING per car, and a Deposit PAYMENT per booking.
// Prices are recalculated here from the database, so the browser cannot change them.
const { RULES, db, handler, todaySA, isDate, daysBetween, HttpError, OVERLAP_SQL } = require("./_lib");

const str = (v, max) => (typeof v === "string" ? v.trim() : "").slice(0, max);

module.exports = handler(async req => {
  if (req.method !== "POST") throw new HttpError(405, "Use POST.");
  const b = req.body || {};
  const start = b.start, end = b.end;
  const mode = b.mode === "Delivery" ? "Delivery" : "Collection";
  const method = b.paymentMethod === "EFT" ? "EFT" : "Card";
  const c = b.customer || {};
  const fn = str(c.fn, 20), ln = str(c.ln, 30), ph = str(c.ph, 15), em = str(c.em, 100) || null;
  const addr = mode === "Delivery" ? str(b.address, 100) : null;

  if (!isDate(start) || !isDate(end)) throw new HttpError(400, "Please choose valid dates.");
  const n = daysBetween(start, end);
  if (n <= 0) throw new HttpError(400, "End date must be after the start date.");
  if (n > RULES.maxDays) throw new HttpError(400, `Bookings can be at most ${RULES.maxDays} days. Please WhatsApp us for longer rentals.`);
  if (start < todaySA()) throw new HttpError(400, "The start date cannot be in the past.");
  if (!fn || !ln) throw new HttpError(400, "Please enter your first and last name.");
  if (!/^[0-9+() \-]{7,15}$/.test(ph)) throw new HttpError(400, "Please enter a valid phone number.");
  if (em && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) throw new HttpError(400, "Please enter a valid email address.");
  if (mode === "Delivery" && !addr) throw new HttpError(400, "Please enter a delivery address.");
  const ids = [...new Set((Array.isArray(b.vehicleIds) ? b.vehicleIds : []).map(Number))];
  if (!ids.length || ids.length > 5 || ids.some(i => !Number.isInteger(i) || i < 1)) throw new HttpError(400, "Please add between 1 and 5 cars to your booking.");

  const conn = await db().getConnection();
  try {
    await conn.beginTransaction();

    // Lock the chosen cars so two customers cannot book the same car at the same moment.
    const [cars] = await conn.query(
      "SELECT v.Vehicle_ID, v.Make, v.Model, v.Vehicle_Status, c.Daily_Rate FROM VEHICLE v JOIN CATEGORY c ON c.Category_ID = v.Category_ID WHERE v.Vehicle_ID IN (?) ORDER BY v.Vehicle_ID FOR UPDATE", [ids]);
    if (cars.length !== ids.length) throw new HttpError(400, "One of the cars could not be found.");
    for (const v of cars) {
      if (v.Vehicle_Status !== "Available") throw new HttpError(409, `${v.Make} ${v.Model} is not available. Please update your booking.`);
      const [clash] = await conn.query(`SELECT 1 FROM BOOKING b WHERE b.Vehicle_ID = ? AND ${OVERLAP_SQL} LIMIT 1`, [v.Vehicle_ID, end, start]);
      if (clash.length) throw new HttpError(409, `${v.Make} ${v.Model} was just booked for these dates. Please update your booking.`);
    }

    // Pricing (same rules as the website).
    const sub = cars.reduce((t, v) => t + Number(v.Daily_Rate) * n, 0);
    const disc = n >= RULES.longTermDays ? sub * RULES.longTermDiscount : 0;
    const fee = mode === "Delivery" ? RULES.deliveryFee : 0;
    const total = sub - disc + fee;
    const deposit = Math.round(total * RULES.depositPct);
    const factor = n >= RULES.longTermDays ? 1 - RULES.longTermDiscount : 1;

    const [[staff]] = await conn.query("SELECT Staff_ID FROM STAFF WHERE First_Name = 'Online' AND Last_Name = 'Bookings' LIMIT 1");
    if (!staff) throw new HttpError(500, "Booking system is not set up (missing staff record).");

    // Reuse the customer if the same person has booked before.
    const [found] = await conn.query("SELECT Customer_ID FROM CUSTOMER WHERE First_Name = ? AND Last_Name = ? AND Phone = ? LIMIT 1", [fn, ln, ph]);
    let customerId;
    if (found.length) { customerId = found[0].Customer_ID; if (em) await conn.query("UPDATE CUSTOMER SET Email = ? WHERE Customer_ID = ?", [em, customerId]); }
    else customerId = (await conn.query("INSERT INTO CUSTOMER (First_Name, Last_Name, Phone, Email) VALUES (?,?,?,?)", [fn, ln, ph, em]))[0].insertId;

    // One BOOKING per car; the deposit is split between them so it adds up exactly.
    const today = todaySA(), bookingIds = []; let paid = 0;
    for (let i = 0; i < cars.length; i++) {
      const v = cars[i], last = i === cars.length - 1;
      const share = Number(v.Daily_Rate) * n * factor + (i === 0 ? fee : 0);
      const dep = last ? deposit - paid : Math.round(share * RULES.depositPct);
      paid += dep;
      const bid = (await conn.query(
        "INSERT INTO BOOKING (Booking_Date, Start_Date, End_Date, Booking_Status, Delivery_Option, Delivery_Address, Customer_ID, Vehicle_ID, Staff_ID) VALUES (?,?,?,?,?,?,?,?,?)",
        [today, start, end, "Confirmed", mode, addr, customerId, v.Vehicle_ID, staff.Staff_ID]))[0].insertId;
      await conn.query("INSERT INTO PAYMENT (Payment_Date, Payment_Type, Amount, Payment_Method, Booking_ID) VALUES (?,?,?,?,?)", [today, "Deposit", dep, method, bid]);
      bookingIds.push(bid);
    }
    await conn.commit();
    return { ref: "MW" + bookingIds.join("-"), total, deposit };
  } catch (e) {
    try { await conn.rollback(); } catch (_) {}
    throw e;
  } finally { conn.release(); }
});
