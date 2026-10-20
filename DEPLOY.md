# Putting Mafikeng Wheels live (TiDB + Vercel)

Never put the database password in GitHub (the repo is public). It only goes into Vercel's "Environment Variables".

## 1. Create the tables in TiDB
1. TiDB Cloud -> SQL Editor, select `mafikeng_wheels` at the top.
2. Open `db/schema.sql`, copy all of it, paste, Run. (If the editor cuts it off, use Data -> Import and upload the file instead.)
3. Check, one at a time: `SHOW TABLES;` (6 tables), `SELECT * FROM CATEGORY;` (4 rows), `SELECT * FROM VEHICLE;` (7 cars), `SELECT * FROM STAFF;` (Online Bookings).

## 2. Get the connection details
TiDB Cloud -> your cluster -> **Connect**. Note the Host, Port (4000), User (looks like `abc123.root`) and set/copy the Password.

## 3. Upload the new files to GitHub
Add these to the repo (Add file -> Upload files), keeping the folders: `api/`, `db/`, `package.json`, `server.js`, `.gitignore`, `DEPLOY.md`, and the updated `app.js` and `data.js`.

## 4. Deploy on Vercel (free)
1. vercel.com -> sign in with GitHub -> Add New Project -> pick `mafikeng-car-rentals`.
2. Framework Preset: **Other**. Open "Environment Variables" and add:
   `DB_HOST`, `DB_PORT` (4000), `DB_USER`, `DB_PASSWORD`, `DB_NAME` (mafikeng_wheels)
3. Deploy. Then open `https://YOUR-SITE.vercel.app/api/fleet`. You should see JSON with 4 categories and 7 cars.
4. Use the Vercel address as the live website. (The old GitHub Pages address will only work if you set `api:"https://YOUR-SITE.vercel.app"` in data.js.)

## 5. Test a booking
Book a car on the live site, then in TiDB run `SELECT * FROM BOOKING;` and `SELECT * FROM PAYMENT;`. Book the same car for overlapping dates: the site must refuse.

## Documentation changes to make
- Non-functional / Performance: replace "a static site with no server" with "a static front end with a small Node.js API (Vercel) and a TiDB Cloud MySQL database".
- Non-functional / Security: "card details are checked in the browser and never sent or stored; prices are recalculated on the server; all database queries are parameterised; customer text is escaped before display".
- Non-functional / Maintainability: cars, categories and prices are kept in the database; business details are in data.js.
- Functional: availability is checked in the database and again inside the booking transaction. A booking with several cars is saved as one BOOKING row per car, with a Deposit PAYMENT row for each. The reference looks like MW12-13 (the booking numbers).
- Payment is still a demo: no real payment gateway is connected.
