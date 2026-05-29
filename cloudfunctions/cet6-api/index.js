const http = require("http");
const { URL } = require("url");

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * @param {import("http").ServerResponse} res
 * @param {number} statusCode
 * @param {unknown} data
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...CORS_HEADERS,
  });
  res.end(JSON.stringify(data));
}

/**
 * @param {import("http").ServerResponse} res
 */
function sendOptions(res) {
  res.writeHead(204, CORS_HEADERS);
  res.end();
}

const server = http.createServer((req, res) => {
  if (!req.url) {
    sendJson(res, 400, { ok: false, message: "Bad request" });
    return;
  }

  if (req.method === "OPTIONS") {
    sendOptions(res);
    return;
  }

  const url = new URL(req.url, "http://localhost");
  const path = url.pathname.replace(/\/+$/, "") || "/";

  if (req.method === "GET" && (path === "/" || path === "/health")) {
    sendJson(res, 200, {
      ok: true,
      service: "cet6-api",
      env: process.env.TCB_ENV || process.env.SCF_NAMESPACE || "",
      time: new Date().toISOString(),
    });
    return;
  }

  sendJson(res, 404, { ok: false, message: "Not found" });
});

const port = 9000;
server.listen(port, () => {
  console.log(`cet6-api listening on ${port}`);
});
