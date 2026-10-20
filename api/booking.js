// GET /api/booking?ref=MW12-13 -> the details shown on the confirmation page.
const { db, handler, HttpError } = require("./_lib");

module.exports = handler(async req => {
  const ref = new URL(req.url, "http://x").searchParams.get("ref") || "";
  if (!/^MW\d+(-\d+)*$/.test(ref) || ref.length > 40) throw new HttpError(404, "Booking not found.");
  const ids = ref.slice(2).split("-").map(Number);
  const [rows] = await db().query(
    `SELECT b.Booking_ID, b.Start_Date, b.End_Date, b.Delivery_Option, b.Delivery_Address, b.Customer_ID, c.First_Name, c.Last_Name,
            v.Make, v.Model, cat.Daily_Rate,
            (SELECT COALESCE(SUM(p.Amount),0) FROM PAYMENT p WHERE p.Booking_ID = b.Booking_ID) AS Paid,
            (SELECT p.Payment_Method FROM PAYMENT p WHERE p.Booking_ID = b.Booking_ID ORDER BY p.Payment_ID LIMIT 1) AS Method
     FROM BOOKING b JOIN CUSTOMER c ON c.Customer_ID = b.Customer_ID JOIN VEHICLE v ON v.Vehicle_ID = b.Vehicle_ID JOIN CATEGORY cat ON cat.Category_ID = v.Category_ID
     WHERE b.Booking_ID IN (?)`, [ids]);
  if (rows.length !== ids.length || new Set(rows.map(r => r.Customer_ID)).size !== 1) throw new HttpError(404, "Booking not found.");
  const { RULES, daysBetween } = require("./_lib");
  const r0 = rows[0], n = daysBetween(r0.Start_Date, r0.End_Date);
  const sub = rows.reduce((t, r) => t + Number(r.Daily_Rate) * n, 0);
  const total = sub - (n >= RULES.longTermDays ? sub * RULES.longTermDiscount : 0) + (r0.Delivery_Option === "Delivery" ? RULES.deliveryFee : 0);
  return {
    ref, start: r0.Start_Date, end: r0.End_Date, mode: r0.Delivery_Option, address: r0.Delivery_Address || "",
    name: r0.First_Name + " " + r0.Last_Name, cars: rows.map(r => r.Make + " " + r.Model),
    total, deposit: rows.reduce((t, r) => t + Number(r.Paid), 0), method: r0.Method
  };
});
