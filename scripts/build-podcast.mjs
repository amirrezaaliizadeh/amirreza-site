// Builds /podcast/ (episode index) and one page per episode from the podcast RSS feed, and rewrites sitemap.xml.
// Run: node scripts/build-podcast.mjs   (set RSS_FILE=path to use a local copy of the feed)
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';

const RSS = 'https://anchor.fm/s/11871d7d4/podcast/rss';
const SITE = 'https://amirrezaalizadeh.com';
const LINKS = [
  ['Spotify', 'https://open.spotify.com/show/4BaIyoMGdqDRFAAlC6Zjg2'],
  ['Apple Podcasts', 'https://podcasts.apple.com/us/podcast/id6822054665'],
  ['Castbox', 'https://castbox.fm/channel/id7450227'],
  ['Amazon Music', 'https://music.amazon.co.uk/podcasts/085ffe74-7256-4728-8e4f-fdec59e15585'],
];

const xml = process.env.RSS_FILE ? readFileSync(process.env.RSS_FILE, 'utf8') : await (await fetch(RSS)).text();
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unCdata = (s) => s.replace(/^\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*$/, '$1');
const unEnt = (s) => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, '&');
const tag = (b, t) => { const m = b.match(new RegExp('<' + t + '(?:\\s[^>]*)?>([\\s\\S]*?)</' + t + '>')); return m ? unCdata(m[1]).trim() : ''; };
const attr = (b, t, a) => { const m = b.match(new RegExp('<' + t + '\\s[^>]*?' + a + '="([^"]*)"')); return m ? unEnt(m[1]) : ''; };
// keep only simple formatting from the episode description
const clean = (h) => unEnt(h).replace(/<(?!\/?(p|strong|em|b|i|br|ul|ol|li|a)\b)[^>]*>/gi, '').replace(/<a\s+[^>]*?href="([^"]*)"[^>]*>/gi, '<a href="$1" rel="noopener">').replace(/<(p|strong|em|b|i|ul|ol|li)\s[^>]*>/gi, '<$1>').trim();
const plain = (h) => unEnt(h).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const show = xml.split('<item>')[0];
const showTitle = tag(show, 'title') || 'سینه‌خیز | Sinekhiz';
const showImage = attr(show, 'itunes:image', 'href');
const items = xml.split('<item>').slice(1).map((b, i) => {
  b = b.split('</item>')[0];
  const type = tag(b, 'itunes:episodeType') || 'full';
  const season = tag(b, 'itunes:season'), ep = tag(b, 'itunes:episode');
  const slug = type === 'trailer' ? 'trailer' : (ep ? 's' + (season || '1') + 'e' + ep : 'ep-' + (i + 1));
  const pub = new Date(tag(b, 'pubDate'));
  return { slug, type, title: tag(b, 'title'), html: clean(tag(b, 'description')), pub, dur: tag(b, 'itunes:duration'), audio: attr(b, 'enclosure', 'url'), img: attr(b, 'itunes:image', 'href') || showImage };
}).sort((a, b) => b.pub - a.pub);

const home = readFileSync('index.html', 'utf8');
const styles = [...home.matchAll(/<style>[\s\S]*?<\/style>/g)].map((m) => m[0]).join('\n');
const fonts = (home.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/) || [''])[0];
const icons = [...home.matchAll(/<link rel="(?:icon|apple-touch-icon)"[^>]*>/g)].map((m) => m[0]).join('\n');
const brand = (home.match(/<a class="brand"[\s\S]*?<\/a>/) || [''])[0].replace(/href="[^"]*"/, 'href="/"').replace(/ data-i="[^"]*"/g, '');
const ga = (home.match(/<script async src="https:\/\/www\.googletagmanager[\s\S]*?<\/script>/) || [''])[0];
const gaInit = (home.match(/<script>[^<]*dataLayer[^<]*<\/script>/) || [''])[0];

const fa = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
const faDate = (d) => fa.format(d);
const faNum = (s) => String(s).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]);
const durFa = (d) => { const p = d.split(':').map(Number); const m = p.length === 3 ? p[0] * 60 + p[1] : p[0]; const s = p[p.length - 1]; return faNum(m) + ' دقیقه' + (m < 3 && s ? ' و ' + faNum(s) + ' ثانیه' : ''); };
const isoDur = (d) => { const p = d.split(':').map(Number); const [h, m, s] = p.length === 3 ? p : [0, p[0], p[1]]; return `PT${h}H${m}M${s}S`; };

const btns = LINKS.map(([n, u]) => `<a class="btn ghost" href="${u}" target="_blank" rel="noopener me">${n}</a>`).join('\n        ');

const page = ({ path, title, desc, body, ld, image }) => `<!doctype html>
<html lang="fa" dir="rtl" data-lang="fa" data-dir="rtl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${icons}
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${path}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<meta property="og:type" content="website"><meta property="og:site_name" content="Amirreza Alizadeh"><meta property="og:locale" content="fa_IR">
<meta property="og:url" content="${SITE}${path}"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${esc(image)}">
<script type="application/ld+json">${JSON.stringify(ld)}</script>
${fonts}
${styles}
<style>
.pw { padding-block: 36px 24px; max-width: 760px; margin-inline: auto; }
.pw h1 { font-family: var(--display); font-weight: 800; font-size: clamp(1.9rem, 5.5vw, 3rem); line-height: 1.3; margin: 8px 0 14px; text-wrap: balance; }
.pw .meta { color: var(--muted); margin: 0 0 22px; }
.pw .cover { width: 100%; max-width: 320px; aspect-ratio: 1; object-fit: cover; border-radius: 18px; border: 1px solid var(--line); display: block; margin-block: 8px 22px; }
.pw audio { width: 100%; margin-block: 6px 22px; }
.pw .back { color: var(--muted); text-decoration: none; }
.pw .back:hover { color: var(--accent); }
.eps { list-style: none; padding: 0; margin: 0; display: grid; gap: 0; }
.eps li { display: grid; grid-template-columns: 84px minmax(0, 1fr); gap: 16px; align-items: center; padding-block: 18px; border-top: 1px solid var(--line); }
.eps img { width: 84px; height: 84px; object-fit: cover; border-radius: 12px; }
.eps a { color: var(--fg); text-decoration: none; font-weight: 700; font-size: 1.1rem; line-height: 1.5; }
.eps a:hover { color: var(--accent); }
.eps small { display: block; color: var(--muted); margin-top: 4px; }
</style>
${ga}${gaInit}
</head>
<body>
<div class="wrap">
  <header class="top">${brand}</header>
  <main class="pw">
${body}
  </main>
  <footer><span>© 2026 Amirreza Alizadeh · <a href="/" style="color:inherit">amirrezaalizadeh.com</a></span></footer>
</div>
</body>
</html>
`;

const series = { '@type': 'PodcastSeries', name: showTitle.trim(), url: SITE + '/podcast/', inLanguage: 'fa', image: showImage, author: { '@type': 'Person', name: 'Amirreza Alizadeh', url: SITE + '/' }, sameAs: LINKS.map((l) => l[1]) };

rmSync('podcast', { recursive: true, force: true });
mkdirSync('podcast', { recursive: true });

for (const e of items) {
  const path = `/podcast/${e.slug}/`;
  const text = plain(e.html);
  const desc = text.length > 155 ? text.slice(0, 152).replace(/\s+\S*$/, '') + '…' : text;
  const body = `    <p><a class="back" href="/podcast/">← همه‌ی قسمت‌های سینه‌خیز</a></p>
    <h1>${esc(e.title)}</h1>
    <p class="meta">${faDate(e.pub)} · ${durFa(e.dur)}${e.type === 'trailer' ? ' · تریلر' : ''}</p>
    <img class="cover" src="${esc(e.img)}" alt="${esc(e.title)}" width="320" height="320">
    <audio controls preload="none" src="${esc(e.audio)}"></audio>
    <div class="prose">${e.html}</div>
    <p class="meta" style="margin-top:28px">گوش دادن در:</p>
    <div class="links">
        ${btns}
    </div>`;
  const ld = { '@context': 'https://schema.org', '@type': 'PodcastEpisode', name: e.title, description: text, url: SITE + path, datePublished: e.pub.toISOString(), duration: isoDur(e.dur), inLanguage: 'fa', image: e.img, associatedMedia: { '@type': 'AudioObject', contentUrl: e.audio, encodingFormat: 'audio/mpeg' }, partOfSeries: series };
  mkdirSync('podcast/' + e.slug, { recursive: true });
  writeFileSync(`podcast/${e.slug}/index.html`, page({ path, title: `${e.title} | سینه‌خیز`, desc, body, ld, image: e.img }));
}

const list = items.map((e) => `      <li><img src="${esc(e.img)}" alt="" width="84" height="84" loading="lazy"><div><a href="/podcast/${e.slug}/">${esc(e.title)}</a><small>${faDate(e.pub)} · ${durFa(e.dur)}</small></div></li>`).join('\n');
const idxBody = `    <p><a class="back" href="/">← amirrezaalizadeh.com</a></p>
    <h1>سینه‌خیز | Sinekhiz</h1>
    <p class="meta">پادکست فارسی امیررضا علیزاده درباره‌ی آدم‌ها، زندگی و انتخاب‌هایی که پشت مسیرهای متفاوت پنهان شده‌اند.</p>
    <div class="links" style="margin-bottom:12px">
        ${btns}
    </div>
    <ul class="eps">
${list}
    </ul>`;
writeFileSync('podcast/index.html', page({ path: '/podcast/', title: 'سینه‌خیز | Sinekhiz | پادکست فارسی', desc: 'سینه‌خیز، پادکست فارسی امیررضا علیزاده درباره‌ی آدم‌ها، زندگی، انتخاب‌ها و تجربه‌ها. همه‌ی قسمت‌ها و لینک گوش دادن.', body: idxBody, ld: { '@context': 'https://schema.org', ...series, episode: items.map((e) => ({ '@type': 'PodcastEpisode', name: e.title, url: `${SITE}/podcast/${e.slug}/`, datePublished: e.pub.toISOString() })) }, image: showImage }));

const today = new Date().toISOString().slice(0, 10);
let homeMod = today; try { homeMod = readFileSync('sitemap.xml', 'utf8').match(/<loc>https:\/\/amirrezaalizadeh\.com\/<\/loc><lastmod>([^<]+)/)[1]; } catch {}
const urls = [[SITE + '/', homeMod, 'monthly', '1.0'], [SITE + '/podcast/', items[0] ? items[0].pub.toISOString().slice(0, 10) : today, 'weekly', '0.8'], ...items.map((e) => [`${SITE}/podcast/${e.slug}/`, e.pub.toISOString().slice(0, 10), 'monthly', '0.6'])];
writeFileSync('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(([l, m, c, p]) => `  <url><loc>${l}</loc><lastmod>${m}</lastmod><changefreq>${c}</changefreq><priority>${p}</priority></url>`).join('\n')}\n</urlset>\n`);
console.log(`Built ${items.length} episode page(s).`);
