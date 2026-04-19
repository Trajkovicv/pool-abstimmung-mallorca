// ============================================================================
// Mallorca Bachelor Abstimmung — 6 Leute, 17 Fragen, jsonblob.com Sync
// ============================================================================

// Storage: keyvalue.immanuel.co — free, CORS-enabled, no account.
// API limits: total URL length ~280 chars. Short app key + 180-char chunks
// keeps URL safely under limit. 4 chunks per user → ~540 bytes JSON capacity.
const API_BASE = 'https://keyvalue.immanuel.co/api/KeyVal';
const APP_KEY = 'mbv2';  // keep short — counts against URL length budget
const NAMES = ['Marko', 'Saven', 'Vladan', 'Suheib', 'Vuk', 'Aramis'];
const LS_KEY = 'mallorca_vote_name';
const CHUNKS = 4;          // number of chunks per vote
const CHUNK_MAX = 180;     // max chars per chunk
const MAX_TEXT_LEN = 250;  // cap free-text so full payload fits in 4 chunks

// ============================================================================
// FRAGEN
// ============================================================================
const questions = [
  {
    id: 'name',
    type: 'select',
    kicker: 'Wer bist du?',
    title: 'Wähle deinen Namen',
    sub: 'Damit wir wissen wer wie abgestimmt hat. Jeder Name nur einmal — du kannst deine Stimme jederzeit später ändern.',
    options: NAMES.map(n => ({ value: n, label: n }))
  },

  // -------- UNTERKUNFT --------
  {
    id: 'unterkunft_typ',
    type: 'radio',
    kicker: 'Unterkunft · 1/3',
    title: 'Villa oder Hotel?',
    sub: 'Das ist die wichtigste Entscheidung für den Vibe des Wochenendes.',
    options: [
      { value: 'villa', label: 'Villa', desc: 'Alle 6 zusammen, eigener Pool, eigene Küche. Mehr Gruppen-Feeling, mehr Freiheit, oft abgelegener. Taxi/Mietauto für Palma nötig.' },
      { value: 'hotel', label: 'Hotel zentral Palma', desc: '4 Zimmer — wir teilen uns auf (2×Doppel + 2×Doppel oder 3×Doppel). Näher am Nightlife, weniger Privatsphäre, kein eigener Pool aber Hotel-Pool.' },
      { value: 'hotel_strand', label: 'Hotel an der Küste (Es Trenc / Süden)', desc: '4 Zimmer, direkt am Strand. Chillig, kurzer Weg zu Beachclubs, für Nightlife Palma Taxi nötig.' },
      { value: 'egal', label: 'Mir egal — entscheidet die Mehrheit', desc: 'Ich passe mich an.' }
    ]
  },
  {
    id: 'pool_wichtig',
    type: 'scale',
    kicker: 'Unterkunft · 2/3',
    title: 'Wie wichtig ist dir ein eigener Pool?',
    sub: 'Villa = eigener Pool garantiert. Hotel-Pool ist auch OK, aber geteilt.',
    min: 1, max: 5,
    leftLabel: '1 — brauch ich nicht',
    rightLabel: '5 — unbedingt'
  },
  {
    id: 'unterkunft_budget',
    type: 'radio',
    kicker: 'Unterkunft · 3/3',
    title: 'Budget pro Person / Nacht',
    sub: 'Für 2 Nächte (Fr–So). Gib deine Obergrenze an.',
    options: [
      { value: 'u80', label: 'bis 80 €', desc: 'eher günstig, einfacheres Hotel/Airbnb' },
      { value: '80-150', label: '80 – 150 €', desc: 'solide Mittelklasse, nette Villa möglich' },
      { value: '150-250', label: '150 – 250 €', desc: 'schöne Villa mit Pool, 4-Sterne Hotel' },
      { value: 'o250', label: '250 € +', desc: 'Premium-Villa, Boutique-Hotel' }
    ]
  },

  // -------- STIMMUNG --------
  {
    id: 'party_level',
    type: 'scale',
    kicker: 'Stimmung',
    title: 'Dein Party-Level fürs Wochenende',
    sub: 'Ehrlich sein — damit wir keine Erwartungs-Enttäuschung haben.',
    min: 1, max: 5,
    leftLabel: '1 — Chill-Modus',
    rightLabel: '5 — Vollgas bis morgens'
  },

  // -------- FREITAG --------
  {
    id: 'freitag_ankunft',
    type: 'radio',
    kicker: 'Freitag · Nachmittag',
    title: 'Was direkt nach Ankunft?',
    sub: 'Flug lässt sich noch planen. Was wäre dein Wunsch-Start?',
    options: [
      { value: 'pool_chill', label: 'Villa/Hotel ankommen, Pool, erste Drinks', desc: 'Entspannter Start, zusammen ankommen und runterfahren' },
      { value: 'strand_schnell', label: 'Schnell an den Strand / Beachclub', desc: 'Direkt rein in den Mallorca-Vibe, Liegen + Cocktails' },
      { value: 'palma_erkunden', label: 'Palma Altstadt erkunden + Tapas', desc: 'Kathedrale, Gassen, erste Bar — aktive Stadt-Variante' },
      { value: 'sport', label: 'Erstmal Sport / Aktivität', desc: 'Padel, Golf, Kiten — was aktives bevor der Abend losgeht' }
    ]
  },
  {
    id: 'freitag_abend',
    type: 'checkbox',
    kicker: 'Freitag · Abend',
    title: 'Was kommt für dich in Frage?',
    sub: 'Mehrfachauswahl — wähle alles was du OK findest. So sehen wir was für alle passt.',
    options: [
      { value: 'club_palma', label: 'Club in Palma (Pacha, Titos)', desc: 'Klassischer Mallorca-Club-Abend' },
      { value: 'bar_hopping', label: 'Bar-Hopping Altstadt', desc: 'Mehrere Bars, locker, viel sehen' },
      { value: 'rooftop_dinner', label: 'Rooftop-Dinner + Drinks', desc: 'Schönes Essen mit Aussicht, eleganter Abend' },
      { value: 'chill_villa', label: 'Chill Villa-Start + Drinks', desc: 'Erstmal zusammen ankommen, BBQ, langsam angehen' },
      { value: 'strip_club', label: 'Strip-Club / Bachelor-Klassiker', desc: 'Gehört für manche zum Bachelor dazu, für andere nicht' }
    ]
  },

  // -------- SAMSTAG --------
  {
    id: 'samstag_haupt',
    type: 'radio',
    kicker: 'Samstag · Hauptaktivität',
    title: 'Die große Samstag-Entscheidung',
    sub: 'Wähle EINE Haupt-Aktivität für den Samstag-Tag. (Marko tendiert zu Bootstour.)',
    options: [
      { value: 'bootstour', label: 'Bootstour', desc: '4–6h auf See, Schwimm-Stopps, Drinks, Musik. Mallorca-Klassiker.' },
      { value: 'es_trenc', label: 'Es Trenc Strand-Tag', desc: 'Der karibische Strand. Liegen, Beachclub, Sonne pur.' },
      { value: 'quad_jeep', label: 'Quad- oder Jeep-Tour', desc: 'Action, Insel-Inneres erkunden, Adrenalin' },
      { value: 'jetski', label: 'Jetski / Wasser-Action', desc: 'Jetski-Safari, Parasailing, Flyboard' },
      { value: 'golf_padel', label: 'Golf oder Padel-Turnier', desc: 'Sportlich-kompetitiv, Gruppen-Turnier' }
    ]
  },
  {
    id: 'boot_typ',
    type: 'radio',
    kicker: 'Samstag · Boot-Option',
    title: 'Falls Bootstour gewinnt — welcher Typ?',
    sub: 'Auch ausfüllen wenn du Boot NICHT gewählt hast — dein Ranking zählt falls die Mehrheit Boot will.',
    options: [
      { value: 'private_yacht', label: 'Private Yacht nur für uns 6', desc: '~250–400 € p.P. — wir bestimmen alles, Skipper + eigenes Boot' },
      { value: 'partyboot', label: 'Partyboot / Gruppenboot', desc: '~60–100 € p.P. — andere Leute an Bord, DJ, günstiger' },
      { value: 'katamaran_sunset', label: 'Katamaran Sunset-Cruise (abends)', desc: '~80–120 € p.P. — elegant, 2–3h, Dinner an Bord, entspannter' },
      { value: 'selber_steuern', label: 'Selber steuern (Führerschein-freies Boot)', desc: '~200 € für Gruppe — volle Kontrolle, kleiner, weniger Luxus' }
    ]
  },
  {
    id: 'samstag_abend',
    type: 'checkbox',
    kicker: 'Samstag · Abend',
    title: 'Was kommt für den Samstag-Abend in Frage?',
    sub: 'Mehrfachauswahl. Das ist DER Abend — meistens wird hier länger gemacht.',
    options: [
      { value: 'gross_club', label: 'Großer Club (Pacha Mallorca / BCM Magaluf)', desc: 'Die Mallorca-Clubs, späte Stunden, Tanzfläche' },
      { value: 'beach_club', label: 'Beach Club Nachtprogramm (Nikki Beach, Purobeach)', desc: 'Eleganter, DJ, Drinks, Pool-Party-Vibe' },
      { value: 'casino', label: 'Casino Mallorca', desc: 'Anders als sonst, Black Jack / Roulette, Anzug-Abend' },
      { value: 'villa_bbq', label: 'Villa-BBQ + private Party', desc: 'Bei uns, entspannt, eigene Musik, keine Schlange, günstiger' },
      { value: 'dinner_fine', label: 'Feines Dinner mit 6-Gang', desc: 'Abends essen gehen, Highlight-Restaurant' }
    ]
  },

  // -------- SONNTAG --------
  {
    id: 'sonntag',
    type: 'radio',
    kicker: 'Sonntag',
    title: 'Wie lassen wir das Wochenende ausklingen?',
    sub: 'Sonntag ist typisch Recovery-Tag. Was wäre dir am liebsten?',
    options: [
      { value: 'es_trenc_club', label: 'Es Trenc Beachclub-Tag', desc: 'Falls Samstag Boot war — am Sonntag der schöne Strand. Liegen, Wasser, chilliges Brunch.' },
      { value: 'brunch_pool', label: 'Brunch + Pool chillen', desc: 'Langsam aufstehen, Brunch in Palma, Rest am Pool' },
      { value: 'aktivitaet', label: 'Nochmal Action (Karting / Wandern Serra)', desc: 'Wer noch Energie hat' },
      { value: 'spa', label: 'Spa-Tag / Wellness', desc: 'Recovery pur — Massage, Sauna, ruhiger Ausklang' },
      { value: 'frueh_raus', label: 'Früh zum Flughafen / kurzer Sonntag', desc: 'Flug mittags, Frühstück und raus' }
    ]
  },

  // -------- ESSEN --------
  {
    id: 'essen',
    type: 'checkbox',
    kicker: 'Essen',
    title: 'Welche Essens-Vibes willst du mindestens einmal?',
    sub: 'Mehrfachauswahl — wähle was in jedem Fall drin sein sollte.',
    options: [
      { value: 'tapas', label: 'Tapas-Abend Palma', desc: 'Kleine Teller, Bar-Hopping zum Essen' },
      { value: 'seafood', label: 'Seafood am Hafen', desc: 'Frischer Fisch, am Meer sitzen' },
      { value: 'steakhouse', label: 'Steakhouse / Grill', desc: 'Deftig, Rumpsteak, für die Fleisch-Fraktion' },
      { value: 'chiringuito', label: 'Chiringuito am Strand', desc: 'Einfache Beach-Bar, Füße im Sand, Cocktail + Paella' },
      { value: 'fine_dining', label: 'Fine Dining / Michelin-nah', desc: 'Ein großer Abend, Anzug, Tasting-Menü' },
      { value: 'villa_grill', label: 'Villa-Grillen / selber kochen', desc: 'Wir kaufen ein, grillen selber — günstig + persönlich' }
    ]
  },

  // -------- TRANSPORT --------
  {
    id: 'transport',
    type: 'radio',
    kicker: 'Transport',
    title: 'Transport vor Ort',
    sub: 'Brauchen wir Mietautos?',
    options: [
      { value: 'mietauto_2', label: '2 Mietautos', desc: '~40–60 €/Tag p.Stk. — volle Flexibilität, überall hinkommen, gut für Villa abseits' },
      { value: 'mietauto_1', label: '1 Mietauto + Taxis', desc: 'Mittelweg — ein Auto für Spontanes, sonst Taxi' },
      { value: 'nur_taxi', label: 'Nur Taxi / Uber / Bolt', desc: 'Kein Stress mit Parken, aber abhängig von Verfügbarkeit' },
      { value: 'egal', label: 'Egal — Mehrheit entscheidet' }
    ]
  },

  // -------- BUDGET --------
  {
    id: 'aktivitaeten_budget',
    type: 'radio',
    kicker: 'Budget',
    title: 'Budget für Aktivitäten gesamt p.P.',
    sub: 'Ohne Flug & Unterkunft. Boot + Club + Essen + Transport.',
    options: [
      { value: 'u200', label: 'bis 200 €', desc: 'Günstiger Modus' },
      { value: '200-400', label: '200 – 400 €', desc: 'Mittel, die meisten Aktivitäten drin' },
      { value: '400-600', label: '400 – 600 €', desc: 'Komfortabel, Yacht möglich' },
      { value: 'o600', label: '600 € +', desc: 'All-in, Premium-Programm' }
    ]
  },

  // -------- FREITEXT --------
  {
    id: 'must_have',
    type: 'text',
    kicker: 'Freitext · 1/2',
    title: 'Must-Have',
    sub: 'Was MUSS dieses Wochenende für dich passieren? (Kann auch leer bleiben.)',
    placeholder: 'z.B. einmal Es Trenc Sonnenuntergang, Pacha, Padel-Match gegen Suheib...'
  },
  {
    id: 'no_go',
    type: 'text',
    kicker: 'Freitext · 2/2',
    title: 'No-Go',
    sub: 'Was auf KEINEN Fall? (Damit wir das direkt rausstreichen.)',
    placeholder: 'z.B. kein Minigolf, kein Tattoo-Studio, keine Magaluf-Touri-Falle...'
  }
];

// ============================================================================
// STATE
// ============================================================================
let state = {
  currentTab: 'vote',
  currentIdx: 0,
  myName: localStorage.getItem(LS_KEY) || null,
  answers: {},
  allVotes: {},
  submitted: false,
  loading: true
};

// ============================================================================
// API — keyvalue.immanuel.co (one key per name, base64url-encoded JSON)
// ============================================================================
function b64urlEncode(str) {
  // UTF-8 safe
  const utf8 = new TextEncoder().encode(str);
  let bin = '';
  utf8.forEach(b => bin += String.fromCharCode(b));
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function chunkKey(name, i) { return `${name.toLowerCase()}_${i}`; }

async function getChunk(key) {
  const res = await fetch(`${API_BASE}/GetValue/${APP_KEY}/${key}`, { cache: 'no-store' });
  if (!res.ok) return '';
  const raw = await res.json();
  return (typeof raw === 'string') ? raw : '';
}
async function putChunk(key, value) {
  // API rejects empty path segment; use 'X' placeholder for empty chunks
  const v = value && value.length > 0 ? value : 'X';
  const url = `${API_BASE}/UpdateValue/${APP_KEY}/${key}/${v}`;
  const res = await fetch(url, { method: 'POST', body: '' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
}

async function loadOne(name) {
  const keys = [];
  for (let i = 0; i < CHUNKS; i++) keys.push(chunkKey(name, i));
  const chunks = await Promise.all(keys.map(k => getChunk(k).catch(() => '')));
  const joined = chunks
    .filter(c => c && c !== 'X')
    .join('');
  if (joined.length < 8) return null;
  try {
    return JSON.parse(b64urlDecode(joined));
  } catch (e) {
    return null;
  }
}

async function loadVotes() {
  setStatus('Lade Abstimmungen…');
  try {
    const results = await Promise.all(NAMES.map(n =>
      loadOne(n).catch(() => null)
    ));
    const votes = {};
    NAMES.forEach((n, i) => {
      if (results[i]) votes[n] = results[i];
    });
    state.allVotes = votes;
    setStatus('Verbunden · ' + Object.keys(votes).length + '/' + NAMES.length + ' abgestimmt', 'ok');
    return true;
  } catch (e) {
    setStatus('Offline · ' + e.message, 'err');
    return false;
  }
}

async function saveVote(name, vote) {
  setStatus('Speichere…');
  try {
    const payload = { ...vote, updatedAt: new Date().toISOString() };
    if (payload.must_have && payload.must_have.length > MAX_TEXT_LEN) {
      payload.must_have = payload.must_have.slice(0, MAX_TEXT_LEN);
    }
    if (payload.no_go && payload.no_go.length > MAX_TEXT_LEN) {
      payload.no_go = payload.no_go.slice(0, MAX_TEXT_LEN);
    }
    const b64 = b64urlEncode(JSON.stringify(payload));
    if (b64.length > CHUNKS * CHUNK_MAX) {
      throw new Error('Vote zu lang — kürze Must-Have / No-Go');
    }
    const puts = [];
    for (let i = 0; i < CHUNKS; i++) {
      const chunk = b64.slice(i * CHUNK_MAX, (i + 1) * CHUNK_MAX);
      puts.push(putChunk(chunkKey(name, i), chunk));
    }
    await Promise.all(puts);
    state.allVotes[name] = payload;
    setStatus('Gespeichert · ' + new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }), 'ok');
    return true;
  } catch (e) {
    setStatus('Fehler · ' + e.message, 'err');
    return false;
  }
}

function setStatus(text, cls = '') {
  const el = document.getElementById('status');
  if (!el) return;
  el.textContent = text;
  el.className = 'status ' + cls;
}

// ============================================================================
// RENDER — VOTE FLOW
// ============================================================================
const $main = () => document.getElementById('main');

function render() {
  if (state.currentTab === 'vote') renderVote();
  else renderResults();
}

function renderVote() {
  const main = $main();

  if (state.submitted) {
    main.innerHTML = `
      <div class="card thanks">
        <div class="thanks-mark"></div>
        <h2>Danke, ${escapeHtml(state.myName)}!</h2>
        <p>Deine Stimme ist gespeichert. Du kannst sie jederzeit ändern.</p>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
          <button class="btn btn-ghost" id="btn-edit">Antworten ändern</button>
          <button class="btn btn-primary" id="btn-results">Ergebnisse ansehen</button>
        </div>
      </div>
    `;
    document.getElementById('btn-edit').onclick = () => {
      state.submitted = false;
      state.currentIdx = 1;
      render();
    };
    document.getElementById('btn-results').onclick = () => switchTab('results');
    return;
  }

  const q = questions[state.currentIdx];
  const total = questions.length;
  const pct = Math.round(((state.currentIdx) / (total - 1)) * 100);

  main.innerHTML = `
    <div class="card">
      <div class="progress">
        <div class="progress-bar"><div class="progress-fill" style="width:${pct}%"></div></div>
        <div class="progress-label">
          <span>Frage ${state.currentIdx + 1} von ${total}</span>
          <span>${pct}%</span>
        </div>
      </div>

      <div class="q-kicker">${escapeHtml(q.kicker)}</div>
      <h2 class="q-title">${escapeHtml(q.title)}</h2>
      <p class="q-sub">${escapeHtml(q.sub)}</p>

      <div id="q-body"></div>

      <div class="nav-row">
        <button class="btn btn-ghost" id="btn-back" ${state.currentIdx === 0 ? 'style="visibility:hidden"' : ''}>← Zurück</button>
        <button class="btn btn-primary" id="btn-next" disabled>${state.currentIdx === total - 1 ? 'Abgeben' : 'Weiter →'}</button>
      </div>
    </div>
  `;

  renderQuestionBody(q);

  document.getElementById('btn-back').onclick = () => {
    if (state.currentIdx > 0) {
      state.currentIdx--;
      render();
    }
  };
  document.getElementById('btn-next').onclick = () => onNext(q);
}

function renderQuestionBody(q) {
  const body = document.getElementById('q-body');
  const current = state.answers[q.id];

  if (q.type === 'select' || q.type === 'radio') {
    body.innerHTML = `<div class="options">${q.options.map(opt => `
      <button class="option ${current === opt.value ? 'selected' : ''}" data-value="${escapeHtml(opt.value)}">
        <div class="option-check"></div>
        <div class="option-body">
          <div class="option-label">${escapeHtml(opt.label)}</div>
          ${opt.desc ? `<div class="option-desc">${escapeHtml(opt.desc)}</div>` : ''}
        </div>
      </button>
    `).join('')}</div>`;

    body.querySelectorAll('.option').forEach(el => {
      el.addEventListener('click', () => {
        const value = el.dataset.value;
        if (q.id === 'name') {
          const taken = state.allVotes[value] && value !== state.myName;
          if (taken && !confirm(`${value} hat schon abgestimmt. Möchtest du trotzdem als ${value} weitermachen und dessen Antworten überschreiben?`)) return;
          state.myName = value;
          localStorage.setItem(LS_KEY, value);
          // Load existing answers for this name
          if (state.allVotes[value]) {
            state.answers = { ...state.allVotes[value], name: value };
            delete state.answers.updatedAt;
          } else {
            state.answers = { name: value };
          }
        }
        state.answers[q.id] = value;
        renderQuestionBody(q);
        updateNextBtn(q);
      });
    });
  }

  else if (q.type === 'checkbox') {
    const selected = new Set(current || []);
    body.innerHTML = `<div class="options">${q.options.map(opt => `
      <button class="option ${selected.has(opt.value) ? 'selected' : ''}" data-type="checkbox" data-value="${escapeHtml(opt.value)}">
        <div class="option-check"></div>
        <div class="option-body">
          <div class="option-label">${escapeHtml(opt.label)}</div>
          ${opt.desc ? `<div class="option-desc">${escapeHtml(opt.desc)}</div>` : ''}
        </div>
      </button>
    `).join('')}</div>`;

    body.querySelectorAll('.option').forEach(el => {
      el.addEventListener('click', () => {
        const value = el.dataset.value;
        if (selected.has(value)) selected.delete(value); else selected.add(value);
        state.answers[q.id] = Array.from(selected);
        renderQuestionBody(q);
        updateNextBtn(q);
      });
    });
  }

  else if (q.type === 'scale') {
    const items = [];
    for (let i = q.min; i <= q.max; i++) {
      items.push(`<button class="scale-btn ${current === i ? 'selected' : ''}" data-value="${i}">${i}</button>`);
    }
    body.innerHTML = `
      <div class="scale">${items.join('')}</div>
      <div class="scale-labels">
        <span>${escapeHtml(q.leftLabel || '')}</span>
        <span>${escapeHtml(q.rightLabel || '')}</span>
      </div>
    `;
    body.querySelectorAll('.scale-btn').forEach(el => {
      el.addEventListener('click', () => {
        state.answers[q.id] = Number(el.dataset.value);
        renderQuestionBody(q);
        updateNextBtn(q);
      });
    });
  }

  else if (q.type === 'text') {
    body.innerHTML = `<textarea class="textarea" placeholder="${escapeHtml(q.placeholder || '')}">${escapeHtml(current || '')}</textarea>`;
    const ta = body.querySelector('textarea');
    ta.addEventListener('input', () => {
      state.answers[q.id] = ta.value.trim();
      updateNextBtn(q);
    });
  }

  updateNextBtn(q);
}

function updateNextBtn(q) {
  const btn = document.getElementById('btn-next');
  if (!btn) return;
  const v = state.answers[q.id];
  let valid = false;
  if (q.type === 'text') valid = true;  // Freitext optional
  else if (q.type === 'checkbox') valid = Array.isArray(v) && v.length > 0;
  else valid = v !== undefined && v !== null && v !== '';
  btn.disabled = !valid;
}

async function onNext(q) {
  // Incremental save (fire-and-forget, don't block navigation)
  if (state.myName && q.id !== 'name') {
    saveVote(state.myName, state.answers).catch(() => {});
  }
  if (state.currentIdx === questions.length - 1) {
    // Final save — await to show status
    if (state.myName) await saveVote(state.myName, state.answers);
    state.submitted = true;
    render();
  } else {
    state.currentIdx++;
    render();
  }
}

// ============================================================================
// RENDER — RESULTS
// ============================================================================
function renderResults() {
  const main = $main();
  const votes = state.allVotes;
  const names = Object.keys(votes);
  const voterChips = NAMES.map(n => `
    <div class="voter-chip ${names.includes(n) ? 'voted' : ''}">${escapeHtml(n)}${names.includes(n) ? ' ✓' : ''}</div>
  `).join('');

  let html = `
    <div class="card">
      <div class="q-kicker">Übersicht · ${names.length} von ${NAMES.length} abgestimmt</div>
      <h2 class="q-title">Ergebnisse</h2>
      <div class="voters">${voterChips}</div>
  `;

  if (names.length === 0) {
    html += `<p class="muted" style="margin-top:20px;">Noch keine Stimmen — werde der erste!</p></div>`;
    main.innerHTML = html;
    return;
  }

  html += `<div class="divider"></div>`;

  // Per-question aggregation
  for (const q of questions) {
    if (q.id === 'name') continue;
    html += `<div class="result-section">`;
    html += `<div class="result-kicker">${escapeHtml(q.kicker)}</div>`;
    html += `<div class="result-title">${escapeHtml(q.title)}</div>`;

    if (q.type === 'radio' || q.type === 'checkbox') {
      const counts = {};
      q.options.forEach(opt => counts[opt.value] = 0);
      for (const n of names) {
        const v = votes[n][q.id];
        if (Array.isArray(v)) v.forEach(x => { if (x in counts) counts[x]++; });
        else if (v in counts) counts[v]++;
      }
      const max = Math.max(...Object.values(counts), 1);
      const sorted = q.options.slice().sort((a, b) => counts[b.value] - counts[a.value]);
      const winner = sorted[0];
      if (counts[winner.value] > 0) {
        html += `<div class="result-winner">
          <span class="result-winner-label">${escapeHtml(winner.label)}</span>
          <span class="result-winner-count">${counts[winner.value]} Stimmen</span>
        </div>`;
      }
      for (const opt of sorted) {
        const c = counts[opt.value];
        const pct = (c / max) * 100;
        html += `<div class="result-bar-row">
          <div class="result-bar-label">${escapeHtml(opt.label)}</div>
          <div class="result-bar"><div class="result-bar-fill" style="width:${pct}%"></div></div>
          <div class="result-bar-count">${c}</div>
        </div>`;
      }
    }

    else if (q.type === 'scale') {
      const vals = names.map(n => votes[n][q.id]).filter(v => typeof v === 'number');
      const avg = vals.length ? (vals.reduce((a, b) => a + b, 0) / vals.length) : 0;
      const counts = {};
      for (let i = q.min; i <= q.max; i++) counts[i] = 0;
      vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
      const max = Math.max(...Object.values(counts), 1);
      html += `<div class="result-winner">
        <span class="result-winner-label">Ø ${avg.toFixed(1)} / ${q.max}</span>
        <span class="result-winner-count">${vals.length} Stimmen</span>
      </div>`;
      for (let i = q.min; i <= q.max; i++) {
        const c = counts[i];
        const pct = (c / max) * 100;
        html += `<div class="result-bar-row">
          <div class="result-bar-label">${i}</div>
          <div class="result-bar"><div class="result-bar-fill" style="width:${pct}%"></div></div>
          <div class="result-bar-count">${c}</div>
        </div>`;
      }
    }

    else if (q.type === 'text') {
      const items = names.map(n => ({ n, t: votes[n][q.id] })).filter(x => x.t && x.t.trim());
      if (items.length === 0) {
        html += `<div class="result-text-item empty">Noch keine Einträge</div>`;
      } else {
        html += `<div class="result-text-list">`;
        items.forEach(it => {
          html += `<div class="result-text-item"><b>${escapeHtml(it.n)}:</b> ${escapeHtml(it.t)}</div>`;
        });
        html += `</div>`;
      }
    }

    html += `</div>`;
  }

  // Detail table
  html += `<div class="divider"></div>`;
  html += `<div class="result-kicker">Detail — wer hat was gewählt?</div>`;
  html += `<div class="result-title" style="margin-bottom:10px;">Einzelabstimmung</div>`;
  html += `<div style="overflow-x:auto;"><table class="detail-table"><thead><tr>`;
  html += `<th>Name</th>`;
  for (const q of questions) {
    if (q.id === 'name') continue;
    html += `<th>${escapeHtml(q.kicker.split(' · ')[0])}<br><span style="color:#64748b; font-weight:400; text-transform:none; letter-spacing:0;">${escapeHtml(q.title.slice(0, 26))}${q.title.length > 26 ? '…' : ''}</span></th>`;
  }
  html += `</tr></thead><tbody>`;
  for (const n of names) {
    html += `<tr><td class="name">${escapeHtml(n)}</td>`;
    for (const q of questions) {
      if (q.id === 'name') continue;
      const v = votes[n][q.id];
      html += `<td>${formatAnswer(q, v)}</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table></div>`;

  html += `<div class="divider"></div>`;
  html += `<div style="display:flex; gap:10px; flex-wrap:wrap;">
    <button class="btn btn-ghost" id="btn-refresh">Neu laden</button>
    <button class="btn btn-primary" id="btn-back-vote">Zur Abstimmung</button>
  </div>`;
  html += `</div>`;

  main.innerHTML = html;

  document.getElementById('btn-refresh').onclick = async () => {
    await loadVotes();
    render();
  };
  document.getElementById('btn-back-vote').onclick = () => switchTab('vote');
}

function formatAnswer(q, v) {
  if (v === undefined || v === null || v === '') return '<span class="muted">—</span>';
  if (q.type === 'radio' || q.type === 'select') {
    const opt = q.options.find(o => o.value === v);
    return opt ? escapeHtml(opt.label) : escapeHtml(String(v));
  }
  if (q.type === 'checkbox') {
    if (!Array.isArray(v) || v.length === 0) return '<span class="muted">—</span>';
    return v.map(val => {
      const opt = q.options.find(o => o.value === val);
      return escapeHtml(opt ? opt.label : val);
    }).join(', ');
  }
  if (q.type === 'scale') return `<b style="color:#e9c46a">${v}</b> / ${q.max}`;
  if (q.type === 'text') return escapeHtml(v);
  return escapeHtml(String(v));
}

// ============================================================================
// TABS
// ============================================================================
function switchTab(tab) {
  state.currentTab = tab;
  document.getElementById('tab-vote').classList.toggle('active', tab === 'vote');
  document.getElementById('tab-results').classList.toggle('active', tab === 'results');
  if (tab === 'results') loadVotes().then(render);
  else render();
}

document.getElementById('tab-vote').onclick = () => switchTab('vote');
document.getElementById('tab-results').onclick = () => switchTab('results');

// ============================================================================
// UTIL
// ============================================================================
function escapeHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ============================================================================
// BOOT
// ============================================================================
(async function init() {
  await loadVotes();
  // If we have a remembered name with existing vote, pre-load answers
  if (state.myName && state.allVotes[state.myName]) {
    state.answers = { ...state.allVotes[state.myName], name: state.myName };
    delete state.answers.updatedAt;
    state.submitted = true;
  }
  state.loading = false;
  render();
})();
