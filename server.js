// Local test server: node server.js  (needs DB_HOST, DB_USER, DB_PASSWORD env vars). Serves the site and /api.
const http = require("http"), fs = require("fs"), path = require("path");
const routes = { fleet: require("./api/fleet"), availability: require("./api/availability"), book: require("./api/book"), booking: require("./api/booking") };
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".jpg": "image/jpeg", ".png": "image/png" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  const m = u.pathname.match(/^\/api\/(\w+)$/);
  if (m && routes[m[1]]) return routes[m[1]](req, res);
  const f = path.join(__dirname, u.pathname === "/" ? "index.html" : path.normalize(u.pathname).replace(/^(\.\.[\/\\])+/, ""));
  fs.readFile(f, (e, d) => { if (e) { res.statusCode = 404; return res.end("Not found"); } res.setHeader("Content-Type", types[path.extname(f)] || "application/octet-stream"); res.end(d); });
}).listen(process.env.PORT || 3000, () => console.log("http://localhost:" + (process.env.PORT || 3000)));
