// GET /api/fleet -> categories, vehicles and the pricing rules.
const { RULES, db, handler } = require("./_lib");

module.exports = handler(async () => {
  const [cats] = await db().query("SELECT Category_ID, Category_Name, Description, Daily_Rate FROM CATEGORY ORDER BY Category_ID");
  const [vehs] = await db().query("SELECT Vehicle_ID, Make, Model, `Year` AS Yr, Seats, Vehicle_Status, Category_ID FROM VEHICLE ORDER BY Vehicle_ID");
  const icons = { Economy: "🚗", Standard: "🚙", SUV: "🚐", Luxury: "🏎️" };
  return {
    config: RULES,
    categories: cats.map(c => ({ id: c.Category_ID, name: c.Category_Name, desc: c.Description, rate: Number(c.Daily_Rate), icon: icons[c.Category_Name] || "🚗" })),
    vehicles: vehs.map(v => ({ id: v.Vehicle_ID, make: v.Make, model: v.Model, year: v.Yr, seats: v.Seats, status: v.Vehicle_Status, cat: v.Category_ID }))
  };
});
