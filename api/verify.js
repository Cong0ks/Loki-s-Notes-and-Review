const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

// SHA-256 hash of the correct token (same as frontend)
const TOKEN_HASH = "bd561dc51814411df41b1c56fa1d7b702a5d60cfbdaa28a1f78842f31cdbaa19";

function sha256(str) {
  return crypto.createHash("sha256").update(str).digest("hex");
}

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { token } = req.body || {};

  // 1. Verify token (SHA-256 hash)
  if (!token || sha256(token) !== TOKEN_HASH) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 2. Read encryption key from Vercel environment variable
  const keyB64 = process.env.RESUME_ENCRYPT_KEY;
  if (!keyB64) {
    return res.status(500).json({ error: "Server config error" });
  }
  const key = Buffer.from(keyB64, "base64");

  // 3. Read encrypted resume data
  const encPath = path.join(__dirname, "resume-enc.json");
  if (!fs.existsSync(encPath)) {
    return res.status(500).json({ error: "Content not found" });
  }
  const enc = JSON.parse(fs.readFileSync(encPath, "utf8"));
  const iv = Buffer.from(enc.iv, "base64");

  // 4. Decrypt
  let decrypted;
  try {
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
    decrypted = decipher.update(enc.data, "base64", "utf8");
    decrypted += decipher.final("utf8");
  } catch (e) {
    return res.status(500).json({ error: "Decrypt failed" });
  }

  // 5. Extract style + body content from full HTML document
  let style = "";
  let body = decrypted;

  var styleMatch = decrypted.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) style = styleMatch[0];

  var bodyMatch = decrypted.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  if (bodyMatch) {
    body = bodyMatch[1];
  } else {
    // Fallback: strip html/head wrappers manually
    body = decrypted
      .replace(/<!DOCTYPE[^>]*>/i, "")
      .replace(/<html[^>]*>/i, "")
      .replace(/<\/html>/i, "")
      .replace(/<head[^>]*>[\s\S]*?<\/head>/i, "")
      .replace(/<body[^>]*>/i, "")
      .replace(/<\/body>/i, "");
  }

  // Return style (if not already inline) + body content
  var result = (style ? style + "\n" : "") + body;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.status(200).send(result);
};
