function getBaseUrl(req) {
  const proto = (req.headers['x-forwarded-proto'] || 'https').toString().split(',')[0].trim();
  const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString().split(',')[0].trim();
  if (!host) return '';
  return `${proto}://${host}`;
}

module.exports = (req, res) => {
  const base = getBaseUrl(req);
  const sitemap = base ? `${base}/sitemap.xml` : '/sitemap.xml';

  const txt =
    `User-agent: *\n` +
    `Allow: /\n` +
    `\n` +
    `Sitemap: ${sitemap}\n`;

  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400');
  res.end(txt);
};

