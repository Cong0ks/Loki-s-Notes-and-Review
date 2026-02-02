const crypto = require('crypto');

function timingSafeEqualStr(a, b) {
  const aBuf = Buffer.from(String(a || ''), 'utf8');
  const bBuf = Buffer.from(String(b || ''), 'utf8');
  if (aBuf.length !== bBuf.length) return false;
  return crypto.timingSafeEqual(aBuf, bBuf);
}

async function readJson(req) {
  // Vercel serverless may not always pre-parse JSON; parse manually for safety.
  if (req.body && typeof req.body === 'object') return req.body;
  const chunks = [];
  for await (const c of req) chunks.push(Buffer.from(c));
  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) return {};
  return JSON.parse(raw);
}

function buildPrompt(systemPrompt, messages) {
  const sys = String(systemPrompt || '').trim();
  const lines = [];
  if (sys) {
    lines.push(`【System】\n${sys}\n`);
  }

  for (const m of messages || []) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant')) continue;
    const label = m.role === 'user' ? '用户' : '助手';
    const content = String(m.content || '').trim();
    if (!content) continue;
    lines.push(`${label}：${content}`);
  }

  // Encourage the model to continue as assistant.
  lines.push('助手：');
  return lines.join('\n\n').slice(0, 20000);
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ ok: false, error: 'Method Not Allowed' }));
    return;
  }

  const adminPw = process.env.CHAT_ADMIN_PASSWORD || '';
  const dashscopeKey = process.env.DASHSCOPE_API_KEY || '';
  const appId = process.env.BAILIAN_APP_ID || '';

  if (!adminPw || !dashscopeKey || !appId) {
    res.statusCode = 500;
    res.end(JSON.stringify({ ok: false, error: 'Server missing env vars: CHAT_ADMIN_PASSWORD / DASHSCOPE_API_KEY / BAILIAN_APP_ID' }));
    return;
  }

  let body = {};
  try {
    body = await readJson(req);
  } catch {
    res.statusCode = 400;
    res.end(JSON.stringify({ ok: false, error: 'Invalid JSON body' }));
    return;
  }

  const providedPw = req.headers['x-chat-admin-password'] || body.password || '';
  if (!timingSafeEqualStr(providedPw, adminPw)) {
    res.statusCode = 401;
    res.end(JSON.stringify({ ok: false, error: 'Unauthorized' }));
    return;
  }

  const systemPrompt = body.systemPrompt || '';
  const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
  const prompt = buildPrompt(systemPrompt, messages);

  const url = `https://dashscope.aliyuncs.com/api/v1/apps/${encodeURIComponent(appId)}/completion`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${dashscopeKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: { prompt },
        parameters: {},
        debug: {},
      }),
      signal: controller.signal,
    });

    const rawText = await upstream.text();
    if (!upstream.ok) {
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, error: `Upstream error (HTTP ${upstream.status})`, details: rawText.slice(0, 1500) }));
      return;
    }

    let parsed = {};
    try {
      parsed = JSON.parse(rawText);
    } catch {
      res.statusCode = 502;
      res.end(JSON.stringify({ ok: false, error: 'Upstream returned non-JSON response', details: rawText.slice(0, 1500) }));
      return;
    }

    const text = parsed && parsed.output && typeof parsed.output.text === 'string' ? parsed.output.text : '';
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, text, request_id: parsed.request_id || null }));
  } catch (err) {
    const msg = err && err.name === 'AbortError' ? 'Upstream timeout' : (err && err.message ? err.message : String(err));
    res.statusCode = 502;
    res.end(JSON.stringify({ ok: false, error: msg }));
  } finally {
    clearTimeout(timeout);
  }
};

