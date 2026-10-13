/* >_ the engine panel on The City, Live.
   A query goes to the same /api/v1/search the site and the bots use, three ways
   at once (the words; the words open now; the words near the crosshair), and the
   answer is drawn on the city as it lands: rank order, tier colour, open ring.
   Every call is shown with its curl line, its timing and its raw JSON. */
(function () {
'use strict';
var LIVE = /(^|\.)motdang\.net$/.test(location.hostname) ? '/' : 'https://motdang.net/';
var API = LIVE + 'api/v1/';
var ABS = 'https://motdang.net/';
var $ = function (id) { return document.getElementById(id); };
var panel = $('engine'), btn = $('engineBtn'), cross = $('crosshair');
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function n(x) { return Number(x).toLocaleString('en-US'); }

function open() {
  panel.classList.add('open'); cross.classList.add('on'); document.body.classList.add('eng');
  if (!/engine/.test(location.hash)) history.replaceState(null, '', '#engine');
  if (!open.done) { open.done = true; database(); readers(); doors(); }
  setTimeout(function () { $('qi').focus({ preventScroll: true }); }, 300);
}
function close() {
  panel.classList.remove('open'); cross.classList.remove('on'); document.body.classList.remove('eng');
  window.CITY && CITY.clearHits(); history.replaceState(null, '', location.pathname);
}
btn.addEventListener('click', function () {
  if (document.documentElement.classList.contains('embed')) { window.top.location.href = new URL('./#engine', location.href).href.replace('?embed=1', ''); return; }
  panel.classList.contains('open') ? close() : open();
});
$('engineX').addEventListener('click', close);
addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && panel.classList.contains('open')) close();
  if (e.key === '`' && document.activeElement.tagName !== 'INPUT') { e.preventDefault(); panel.classList.contains('open') ? close() : open(); }
});

/* ------------------------------------------------------------ query chips */
['ข้าวซอย', 'khao soi', 'vet', 'massage', 'coffee', '24 hour', 'ร้านตัดผม', 'pharmacy', 'wat', 'muay thai'].forEach(function (q) {
  var c = document.createElement('button'); c.className = 'chip'; c.type = 'button'; c.textContent = q;
  c.addEventListener('click', function () { $('qi').value = q; run(q); });
  $('chips').appendChild(c);
});
$('q').addEventListener('submit', function (e) { e.preventDefault(); var q = $('qi').value.trim(); if (q) run(q); });

/* ------------------------------------------------------------ one call, timed */
function call(path) {
  var t0 = performance.now();
  return fetch(API + path).then(function (r) {
    var hd = { edge: r.headers.get('x-md-edge'), n: r.headers.get('x-md-n'), status: r.status };
    return r.json().then(function (j) { return { j: j, ms: Math.round(performance.now() - t0), hd: hd, url: ABS + 'api/v1/' + path }; });
  });
}
function curl(u) { return '<div class="curl" title="click to copy" data-copy="' + esc(u) + '">$ curl -s \'' + esc(u) + '\'</div>'; }
document.addEventListener('click', function (e) {
  var c = e.target.closest && e.target.closest('.curl'); if (!c) return;
  var u = 'curl -s \'' + c.dataset.copy + '\'';
  navigator.clipboard && navigator.clipboard.writeText(u).then(function () { c.style.borderColor = '#7fd8a4'; setTimeout(function () { c.style.borderColor = ''; }, 700); });
});
document.addEventListener('click', function (e) {
  var t = e.target.closest && e.target.closest('[data-raw]'); if (t) { e.preventDefault(); $(t.dataset.raw).classList.toggle('on'); }
});
function step(id, head, ms, body) {
  var el = $(id); if (!el) return;
  el.classList.add('on');
  el.innerHTML = '<div class="h"><span>' + head + '</span><span class="ms">' + (ms != null ? ms + ' ms' : '') + '</span></div><div class="b">' + body + '</div>';
}
function rawToggle(id, j) {
  return '<a href="#" data-raw="' + id + '">raw json</a><pre class="raw" id="' + id + '">' + esc(JSON.stringify(j, null, 1).slice(0, 20000)) + '</pre>';
}
function bars(obj, total, labels) {
  var keys = Object.keys(obj).sort(function (a, b) { return obj[b] - obj[a]; });
  return keys.map(function (k) {
    var v = obj[k], w = total ? Math.round(v / total * 100) : 0;
    return '<div class="bar"><span>' + esc(labels && labels[k] || k) + '</span><span><i style="width:' + w + '%"></i></span><span>' + n(v) + '</span></div>';
  }).join('');
}

/* ------------------------------------------------------------ the run */
var runId = 0;
function run(q) {
  var id = ++runId, c = window.CITY ? CITY.center() : [18.79, 98.99];
  var near = c[0].toFixed(5) + ',' + c[1].toFixed(5);
  var e = encodeURIComponent(q);
  $('trace').innerHTML = ['s1', 's2', 's3', 's4', 's5', 's6'].map(function (s) { return '<div class="step" id="' + s + '"><div class="h"><span>…</span></div></div>'; }).join('');
  history.replaceState(null, '', '#engine/q=' + e);
  window.CITY && CITY.clearHits();

  var A = call('search?q=' + e + '&limit=200');
  var sim = window.CITY && CITY.simulated(), at = sim ? CITY.openAtLabel() : null;
  var B = call('search?q=' + e + '&limit=200' + (sim ? '&open_at=' + encodeURIComponent(at) : '&open_now=1'));
  var C = call('search?q=' + e + '&limit=5&near=' + near + '&radius=2000');

  A.then(function (a) {
    if (id !== runId) return;
    var j = a.j, res = j.results || [];
    step('s1', '1 · analyze + rank', a.ms,
      'tier <code>' + esc(j.tier || '—') + '</code>' + (j.notes && j.notes.length ? ' · notes <code>' + esc(j.notes.join(', ')) + '</code>' : '') +
      '\n' + n(j.total) + ' matches of ' + n(CITY.places() ? CITY.places().count_all : 0) + ' records' + (a.hd.edge ? ' · edge cache ' + esc(a.hd.edge) : '') +
      '\nรายการจัดลำดับ exact → thesaurus → loose → partial; คำไทย อังกฤษ คำอ่าน อยู่ในพจนานุกรมเดียวกัน' +
      '\n<span class="en">tiers run exact → thesaurus → loose → partial; Thai, English and romanised words share one thesaurus</span>\n' +
      curl(a.url) + rawToggle('r1', j));
    var hits = res.filter(function (r) { return r.lat != null; }).map(function (r, i) {
      return { id: r.id, lat: r.lat, lng: r.lng, rank: i, tier: r.tier || j.tier, score: r.score, open: r.openNow, name: r.name, nameEn: r.nameEn,
               url: r.url, confidence: r.confidence, geo: r.geoPrecision };
    });
    if (window.CITY) { CITY.fit(hits); CITY.showHits(hits); }

    /* 4 · refine */
    var ref = (j.refine || []).map(function (d) {
      var o = {}; d.values.forEach(function (v) { o[v.en || v.value] = v.count; });
      return '<div style="margin-top:4px;color:#fff">' + esc(d.en) + ' <span class="en">' + esc(d.th) + '</span></div>' + bars(o, j.total);
    }).join('');
    step('s4', '4 · refine facets', null, ref || 'no facets narrow this set');

    /* 5 · provenance */
    var conf = {}, geo = {}, osm = 0;
    res.forEach(function (r) { conf[r.confidence] = (conf[r.confidence] || 0) + 1; geo[r.geoPrecision] = (geo[r.geoPrecision] || 0) + 1; if (r.osmDerived) osm++; });
    step('s5', '5 · provenance of the top ' + res.length, null,
      'confidence\n' + bars(conf, res.length) + 'pin\n' + bars(geo, res.length) +
      n(osm) + ' of ' + n(res.length) + ' carry OpenStreetMap-derived fields (ODbL)');

    /* 6 · results */
    step('s6', '6 · top results', null, res.slice(0, 6).map(function (r, i) {
      return '<div class="res"><div class="n">' + (i + 1) + '. ' + esc(r.name) + (r.nameEn ? ' <span class="en">' + esc(r.nameEn) + '</span>' : '') + '</div>' +
        '<div class="m">score ' + r.score + ' · ' + esc(r.tier || '') + ' · ' + esc(r.confidence) + ' · pin ' + esc(r.geoPrecision) +
        ' · open ' + (r.openNow == null ? 'unknown' : r.openNow) + ' · updated ' + esc(r.updatedAt) + '</div>' +
        '<div class="m"><a href="' + esc(r.url) + '">page</a> · <a href="' + esc(r.apiUrl) + '">api</a></div></div>';
    }).join('') || 'nothing');

    B.then(function (b) {
      if (id !== runId) return;
      var bset = {}; (b.j.results || []).forEach(function (r) { bset[r.id] = 1; });
      var o = 0, sh = 0, u = 0;
      res.forEach(function (r) { r.openNow === null || r.openNow === undefined ? u++ : (sim ? bset[r.id] : r.openNow) ? o++ : sh++; });
      if (sim) hits.forEach(function (h) { if (h.open !== null && h.open !== undefined) h.open = !!bset[h.id]; });
      step('s2', '2 · ' + (sim ? 'open_at=' + esc(at) : 'open_now=1'), b.ms,
        n(b.j.total) + ' open ' + (sim ? 'at ' + esc(at) + ' (the map\'s clock)' : 'this minute (Bangkok)') +
        ' · of the top ' + res.length + ': ' + o + ' open, ' + sh + ' shut, ' + u + ' hours unknown' +
        '\nไม่รู้เวลา ≠ ปิด: ตัวกรองนี้ตัดออกโดยไม่เรียกว่าปิด · <span class="en">unknown hours are left out of this filter, not called shut</span>\n' +
        curl(b.url) + rawToggle('r2', b.j));
      setTimeout(function () { if (id === runId && window.CITY) CITY.dimHits(function (h) { return h.open !== false; }); }, 1400);
    });
  }).catch(function (err) { step('s1', '1 · analyze + rank', null, 'the call failed: ' + esc(err.message)); });

  C.then(function (cc) {
    if (id !== runId) return;
    var r = cc.j.results || [], first = r[0];
    step('s3', '3 · near the crosshair, 2 km', cc.ms,
      n(cc.j.total) + ' within 2 km of ' + near + (first ? '\nnearest: ' + esc(first.name) + ' · ' + n(first.distanceM) + ' m' : '') + '\n' +
      curl(cc.url) + rawToggle('r3', cc.j));
  }).catch(function () { });
}

/* ------------------------------------------------------------ the database, counted */
var CONF_TH = { field: 'field · มดไปยืนเอง', official: 'official · หน้าร้านเอง', register: 'register · ทะเบียน', curated: 'curated · คัดมือ', crawled: 'crawled · ไต่เว็บ', 'third-party': 'third-party · แหล่งอื่น' };
function database() {
  var P = window.CITY && CITY.places(), L = window.CITY && CITY.lamps();
  if (!P) { setTimeout(database, 500); return; }
  $('db').innerHTML =
    '<div class="b">' + n(P.count_all) + ' records · ' + n(P.count) + ' pinned · ' + n(L.n) + ' with parsed hours → ' + n(P.schedules.length) + ' distinct week-schedules · index built ' + esc(P.generated) + '</div>' +
    '<div style="margin-top:6px">confidence of the pinned</div>' + bars(P.conf_counts, P.count, CONF_TH) +
    '<p>ทุกจุดบนแผนที่คือหนึ่งแถวในไฟล์นี้ ชั้นข้อมูลที่เปลี่ยนเร็ว (ฝน อากาศ ระดับน้ำ ฟ้า งาน) อ่านจาก /data/*.json ทุกสิบนาที<br><span class="en">Every speck on the map is one row of this file. The perishable layers (rain, air, river, sky, events) are read from /data/*.json every ten minutes.</span></p>';
}
function readers() {
  fetch(LIVE + 'ticker.json').then(function (r) { return r.json(); }).then(function (t) {
    $('readers').innerHTML = '<div class="b">' + esc(t.head.en) + ': ' + esc(t.site[0].en) + '</div>' + more;
  }).catch(function () { $('readers').innerHTML = more; });
  var more = '<p>สัปดาห์ 16–22 ก.ย. 2026: 1.95 ล้านคำขอ 85% เป็นบอท AI ไต่เว็บ คนจริงราว 0.4%<br><span class="en">Week of 16–22 Sept 2026: 1.95 M requests to motdang.net, 85% AI crawlers (meta-externalagent 1.18 M, GPTBot 253 k, Amazonbot 144 k), about 0.4% shaped like people. The machines are the main readership; these doors are theirs.</span></p>';
}
function doors() {
  var D = [
    ['api/v1/', 'API descriptor', 'every endpoint'],
    ['api/v1/openapi.json', 'openapi.json', 'OpenAPI 3'],
    ['api/v1/schema.json', 'schema.json', 'record schema'],
    ['data/places.json', 'places.json', 'bulk, CC BY 4.0 + ODbL'],
    ['llms.txt', 'llms.txt', 'for language models'],
    ['llms-full.txt', 'llms-full.txt', 'the long form'],
    ['net.json', 'net.json', "Indra's net of the site"],
    ['api/graph.jsonld', 'graph.jsonld', 'linked data'],
    ['audit.json', 'audit.json', 'self-audit, re-derived'],
    ['colophon.json', 'colophon.json', 'receipts'],
    ['sitemap.xml', 'sitemap.xml', 'every page'],
    ['anthill/skill.md', 'anthill/skill.md', 'รังมด, for agents'],
    ['.well-known/security.txt', 'security.txt', 'red-team it'],
    ['api/', 'API docs', 'for people']
  ];
  $('doors').innerHTML = D.map(function (d) { return '<a href="' + LIVE + d[0] + '">' + esc(d[1]) + '<small>' + esc(d[2]) + '</small></a>'; }).join('');
}

/* a shared link can carry the query: #engine/q=khao%20soi */
window.ENGINE = { open: open, run: run };
var m = location.hash.match(/^#engine\/q=(.+)$/);
if (m) {
  var wait = function () { if (window.CITY && CITY.places()) { open(); $('qi').value = decodeURIComponent(m[1]); run(decodeURIComponent(m[1])); } else setTimeout(wait, 300); };
  wait();
}
})();
