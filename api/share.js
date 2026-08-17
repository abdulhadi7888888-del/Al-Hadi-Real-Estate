// /api/share?id=PROPERTY_ID
// Serves a tiny HTML page with per-property Open Graph tags (title, description,
// and the property's own photo) so that WhatsApp / Facebook / Instagram link
// previews show the correct picture instead of the generic site logo.
// Real visitors are redirected straight to the property listing on the main site.
// This works because the property data is public-read in Firestore
// (see the security rules in index.html), so no server credentials are needed.

const PROJECT_ID = 'al-hadi-real-estate-e6707';
const SITE_URL = 'https://al-hadi-realestate.vercel.app';

function esc(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));
}

// Converts a Firestore REST API "Value" object into a plain JS value.
function fsValue(v) {
  if (!v) return undefined;
  if (v.stringValue !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue !== undefined) return v.doubleValue;
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue !== undefined) return null;
  if (v.arrayValue !== undefined) return (v.arrayValue.values || []).map(fsValue);
  if (v.mapValue !== undefined) {
    const obj = {};
    const fields = v.mapValue.fields || {};
    for (const k in fields) obj[k] = fsValue(fields[k]);
    return obj;
  }
  return undefined;
}

module.exports = async (req, res) => {
  const id = (req.query && req.query.id) || '';
  let property = null;

  try {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/site/properties`;
    const r = await fetch(url);
    if (r.ok) {
      const data = await r.json();
      const list = fsValue(data.fields && data.fields.list) || [];
      property = list.find((p) => p && p.id === id) || null;
    }
  } catch (e) {
    console.warn('share.js: could not fetch property', e);
  }

  const title = property
    ? `${property.title}${property.loc ? ' — ' + property.loc : ''}`
    : 'Al Hadi Real Estate';

  const descParts = property
    ? [
        property.price,
        [property.bed, property.bath, property.size].filter(Boolean).join(' · '),
        property.desc
      ].filter(Boolean)
    : ['Buy, sell, or rent property in Lahore. Houses, apartments, and plots.'];
  const description = descParts.join(' | ');

  const image = (property && property.imgUrl) ? property.imgUrl : `${SITE_URL}/logo-full.jpg`;
  const redirectUrl = `${SITE_URL}/#properties`;
  const pageUrl = `${SITE_URL}/api/share?id=${encodeURIComponent(id)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(pageUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0; url=${esc(redirectUrl)}">
<script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
</head>
<body style="font-family:sans-serif;text-align:center;padding:60px 20px;background:#eef2ea;color:#20241f;">
  <p>Taking you to <strong>${esc(title)}</strong> on Al Hadi Real Estate…</p>
  <p><a href="${esc(redirectUrl)}">Tap here if you are not redirected</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
  res.status(200).send(html);
};
