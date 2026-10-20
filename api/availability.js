// GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD -> ids of vehicles already booked in that period.
const { db, handler, isDate, daysBetween, HttpError, OVERLAP_SQL } = require("./_lib");

module.exports = handler(async req => {
  const q = new URL(req.url, "http://x").searchParams, start = q.get("start"), end = q.get("end");
  if (!isDate(start) || !isDate(end) || daysBetween(start, end) <= 0) throw new HttpError(400, "End date must be after the start date.");
  const [rows] = await db().query(`SELECT DISTINCT b.Vehicle_ID FROM BOOKING b WHERE ${OVERLAP_SQL}`, [end, start]);
  return { booked: rows.map(r => r.Vehicle_ID) };
});
