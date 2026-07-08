'use strict';

/* ══════════════════════════════
   지식 증권거래소 v2  ·  app.js
   지식 = 주식 발행 / 타인 매수 = 주가 상승
   ══════════════════════════════ */

/* ── 상수 ── */
const STARTING_BALANCE = 200;
const REVIEW_PERFECT   = 35;
const REVIEW_HAZY      = 20;
const REVIEW_FORGOT    = 0;
const WRITE_REWARD     = 5;    // 지식 입력 시 C 보상
const DECAY_NORMAL     = 0.045;
const DECAY_BOOM       = 0.025;
const DECAY_RECESSION  = 0.07;
const MIN_PRICE        = 5;
const URGENT_THRESHOLD = 30;

const SECTORS = ['수학','영어','과학','역사','국어','프로그래밍','기타'];
const SECTOR_COLORS = {
  '수학':'#3B82F6','영어':'#10B981','과학':'#8B5CF6',
  '역사':'#F59E0B','국어':'#EC4899','프로그래밍':'#06B6D4','기타':'#6B7280'
};
const SECTOR_EMOJI = {
  '수학':'📐','영어':'📖','과학':'🔬','역사':'🏛️','국어':'✍️','프로그래밍':'💻','기타':'📌'
};

/* ── 데모 시장 (다른 유저 주식) ── */
function mkHist(steps, finalPrice) {
  const h = [];
  for (let i = steps; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const t  = (steps - i) / Math.max(steps, 1);
    const p  = Math.round((finalPrice * (0.25 + 0.75 * t)) * 10) / 10;
    h.push({ v: p, d: d.toISOString().slice(0, 10) });
  }
  return h;
}

const DEMO_MARKET = [
  {
    id: 'demo_1', uid: 'u_alice', creatorName: '김민준', sector: '수학',
    price: 48, pricePerBuy: 15, sharesIssued: 9,
    lastInput: offset(-2), lastBought: offset(-1),
    priceHistory: mkHist(9, 48),
    shares: [
      { title: '피타고라스 정리', text: '직각삼각형에서 a² + b² = c²가 성립한다. 빗변의 제곱 = 나머지 두 변의 제곱합.', date: offset(-8) },
      { title: '이차방정식 근의 공식', text: 'x = (-b ± √(b²-4ac)) / 2a. 판별식 D = b²-4ac. D>0 두 실근, D=0 중근, D<0 허근.', date: offset(-6) },
      { title: '삼각함수 기본 항등식', text: 'sin²θ + cos²θ = 1. 단위원에서 x=cosθ, y=sinθ. tanθ = sinθ/cosθ.', date: offset(-4) },
      { title: '등차수열과 합 공식', text: 'n번째 항: a_n = a + (n-1)d. 합: S_n = n(2a+(n-1)d)/2. a=첫항, d=공차.', date: offset(-2) },
    ]
  },
  {
    id: 'demo_2', uid: 'u_bob', creatorName: '이서연', sector: '영어',
    price: 24, pricePerBuy: 10, sharesIssued: 4,
    lastInput: offset(-1), lastBought: offset(-3),
    priceHistory: mkHist(4, 24),
    shares: [
      { title: '가정법 과거', text: 'If + 주어 + were/과거동사, 주어 + would/could + 동사원형. 현재 사실의 반대를 가정할 때 사용.', date: offset(-3) },
      { title: '관계대명사 정리', text: '선행사가 사람→who/that, 사물→which/that. 소유격은 whose. 목적격은 생략 가능.', date: offset(-1) },
    ]
  },
  {
    id: 'demo_3', uid: 'u_carol', creatorName: '박지호', sector: '프로그래밍',
    price: 73, pricePerBuy: 20, sharesIssued: 15,
    lastInput: offset(0), lastBought: offset(0),
    priceHistory: mkHist(15, 73),
    shares: [
      { title: '빅오 표기법', text: 'O(1) 상수, O(log n) 로그, O(n) 선형, O(n²) 이차. 알고리즘의 시간/공간 복잡도를 표기하는 방법.', date: offset(-10) },
      { title: '동적 프로그래밍(DP)', text: '큰 문제를 부분 문제로 분할하고 메모이제이션으로 중복 계산을 방지. top-down/bottom-up 두 방식 존재.', date: offset(-7) },
      { title: 'React Hooks 핵심 3가지', text: 'useState(상태 관리), useEffect(사이드 이펙트 처리), useCallback(함수 메모이제이션). 함수형 컴포넌트 필수.', date: offset(-4) },
      { title: 'Git Flow 브랜치 전략', text: 'main(배포), develop(개발 통합), feature/(기능 개발), hotfix/(긴급 수정). 협업 시 브랜치 관리 전략.', date: offset(-2) },
      { title: 'REST API 메서드', text: 'GET(조회), POST(생성), PUT(전체 수정), PATCH(부분 수정), DELETE(삭제). Stateless 원칙.', date: offset(0) },
    ]
  },
  {
    id: 'demo_4', uid: 'u_dan', creatorName: '최아름', sector: '과학',
    price: 32, pricePerBuy: 10, sharesIssued: 5,
    lastInput: offset(-4), lastBought: offset(-2),
    priceHistory: mkHist(5, 32),
    shares: [
      { title: '산화-환원 반응', text: '산화=전자 잃음/수소 잃음/산소 얻음. 환원=그 반대. 산화와 환원은 항상 동시에 발생(산화환원 동시성).', date: offset(-4) },
      { title: '뉴턴 운동 3법칙', text: '1법칙=관성(힘 없으면 등속직선운동), 2법칙=F=ma(가속도 법칙), 3법칙=작용·반작용(크기 같고 방향 반대).', date: offset(-2) },
    ]
  },
  {
    id: 'demo_5', uid: 'u_eve', creatorName: '정우진', sector: '역사',
    price: 11, pricePerBuy: 10, sharesIssued: 2,
    lastInput: offset(-6), lastBought: offset(-5),
    priceHistory: mkHist(2, 11),
    shares: [
      { title: '갑오개혁(1894)', text: '신분제·과거제 폐지, 조혼 금지, 재정·군사 근대화. 청일전쟁 이후 일본의 압력 하에 추진된 근대적 개혁.', date: offset(-6) },
    ]
  },
];

function offset(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* ── Firebase ── */
let currentUserId   = null;
let currentUserEmail = null;
let db = null;

function isFirebaseConfigured() {
  return typeof firebaseConfig !== 'undefined' && !firebaseConfig.apiKey.startsWith('YOUR_');
}

function initAuth() {
  currentUserId    = 'demo';
  currentUserEmail = 'demo@example.com';
  if (isFirebaseConfigured()) {
    try {
      if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(firebaseConfig);
      if (firebase.firestore) db = firebase.firestore();
    } catch (e) {}
  }
  const profile = getProfile();
  if (!profile) {
    saveProfileData({ name: '데모', age: 20, onboardingDone: false });
    showOverlay('onboarding');
  } else if (!profile.onboardingDone) {
    showOverlay('onboarding');
  } else {
    launchApp();
  }
}

function showOverlay(name) {
  ['login','profile-setup','onboarding'].forEach(s => {
    document.getElementById(`screen-${s}`).classList.toggle('hidden', s !== name);
  });
  document.getElementById('app').classList.toggle('hidden', name !== 'app');
}

function launchApp() {
  showOverlay('app');
  const profile = getProfile();
  if (profile) {
    document.getElementById('sidebar-user-name').textContent   = profile.name;
    document.getElementById('sidebar-user-avatar').textContent = profile.name ? profile.name[0].toUpperCase() : '?';
  }
  const savedTheme = LS.get('kse_theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
    document.getElementById('theme-btn').textContent = '☀️';
  }
  updateBalanceDisplay();
  updateStreak();
  applyDecay();
  renderHome();
  updateTicker();
}

function signInWithGoogle() {
  if (!isFirebaseConfigured()) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(() => {
    document.getElementById('login-error').classList.remove('hidden');
  });
}

function signOutUser() { showToast('데모 모드에서는 로그아웃이 없습니다'); }

function toggleTheme() {
  const isLight = document.body.classList.toggle('light-mode');
  LS.set('kse_theme', isLight ? 'light' : 'dark');
  document.getElementById('theme-btn').textContent = isLight ? '☀️' : '🌙';
}

/* ── 스트릭 ── */
function getStreak() {
  const d = getData();
  const log = d.activityLog || [];
  if (!log.length) return 0;
  const daySet = new Set(log.map(l => new Date(l.ts).toISOString().slice(0, 10)));
  let streak = 0, date = new Date();
  const todayStr = date.toISOString().slice(0, 10);
  if (!daySet.has(todayStr)) {
    const y = new Date(date); y.setDate(y.getDate() - 1);
    if (!daySet.has(y.toISOString().slice(0, 10))) return 0;
    date = y;
  }
  while (daySet.has(date.toISOString().slice(0, 10))) {
    streak++;
    const p = new Date(date); p.setDate(p.getDate() - 1); date = p;
  }
  return streak;
}

function updateStreak() {
  const streak = getStreak();
  document.getElementById('streak-val').textContent = streak;
  const el = document.getElementById('sn-streak');
  if (el) el.style.display = streak > 0 ? 'flex' : 'none';
}

/* ── LocalStorage ── */
const LS = {
  get: k     => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

function dataKey()    { return `kse2_data_${currentUserId || 'demo'}`; }
function profileKey() { return `kse_profile_${currentUserId || 'demo'}`; }

function getData() {
  return LS.get(dataKey()) || {
    mySectors:   {},
    holdings:    {},
    balance:     STARTING_BALANCE,
    activityLog: [],
    marketStatus: 'normal',
    marketExpiry: null,
  };
}
function saveData(d) { LS.set(dataKey(), d); }
function getProfile() { return LS.get(profileKey()); }
function saveProfileData(p) { LS.set(profileKey(), p); }

function updateBalanceDisplay() {
  const d = getData();
  const el = document.getElementById('sidebar-balance');
  if (el) el.textContent = `C${Math.round(d.balance || 0)}`;
}

/* ── 날짜 / 이스케이프 ── */
function today() { return new Date().toISOString().slice(0, 10); }
function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function pushHistory(obj, price) {
  obj.priceHistory = obj.priceHistory || [];
  obj.priceHistory.push({ v: Math.round(price * 10) / 10, d: today() });
  if (obj.priceHistory.length > 365) obj.priceHistory.shift();
  obj.lastHistoryDate = today();
}

function historyValues(h) { return (h || []).map(p => (typeof p === 'number' ? p : p.v)); }
function historyLabels(h) { return (h || []).map((p, i) => (typeof p === 'number' ? `#${i+1}` : p.d)); }

/* ── 상태 변수 ── */
let currentScreen      = 'home';
let prevScreen         = null;
let currentDetailId    = null;
let filterSector       = 'all';
let filterQuery        = '';
let pendingReviewData  = null;
let chartZoom          = 7;
let priceChartInstance = null;
let modalChartInstance = null;
let modalZoom          = 7;
let _currentChartHistory = [];
let wfSector           = '수학';
let wfInitialPrice     = 20;
let wfAttachment       = null;   // { name, type, size, data } base64
let selectedBuyIndices = new Set();

/* ── 시장 자동 등락 ── */
function applyDemoFluctuation() {
  const d      = getData();
  const status = d.marketStatus || 'normal';
  const bias   = status === 'boom' ? 0.025 : status === 'recession' ? -0.035 : 0;
  DEMO_MARKET.forEach(m => {
    const sectorBias = { '수학': 0.01, '프로그래밍': 0.015, '영어': 0, '과학': 0.005, '역사': -0.005 }[m.sector] || 0;
    const change = bias + sectorBias + (Math.random() * 0.12 - 0.06);
    m.price = Math.max(MIN_PRICE, Math.round(m.price * (1 + change) * 10) / 10);
    pushHistory(m, m.price);
  });
}

function applyUserSectorFluctuation() {
  const d      = getData();
  const todayStr = today();
  if (d.lastFluctuationDate === todayStr) return;
  const status = d.marketStatus || 'normal';
  const bias   = status === 'boom' ? 0.02 : status === 'recession' ? -0.025 : 0;
  let changed  = false;
  Object.values(d.mySectors).forEach(s => {
    const change = bias + (Math.random() * 0.08 - 0.04);
    s.price = Math.max(MIN_PRICE, Math.round(s.price * (1 + change) * 10) / 10);
    if (s.lastHistoryDate !== todayStr) {
      pushHistory(s, s.price);
      s.lastHistoryDate = todayStr;
    }
    changed = true;
  });
  d.lastFluctuationDate = todayStr;
  if (changed) saveData(d);
}

/* ── Init ── */
document.addEventListener('DOMContentLoaded', () => {
  initAuth();
  applyDemoFluctuation();
  applyUserSectorFluctuation();
  setInterval(updateTicker, 30000);
});

/* ══ 망각 곡선 (주가 하락) ══ */
function applyDecay() {
  const d = getData();
  const now = Date.now();
  const rate = d.marketStatus === 'boom' ? DECAY_BOOM
             : d.marketStatus === 'recession' ? DECAY_RECESSION
             : DECAY_NORMAL;
  let changed = false;
  Object.values(d.mySectors).forEach(s => {
    const days = (now - (s.lastUpdate || now)) / 86400000;
    if (days < 0.01) return;
    const newP = Math.max(MIN_PRICE, s.price * Math.pow(1 - rate, days));
    if (s.lastHistoryDate !== today()) { pushHistory(s, newP); }
    s.price      = Math.round(newP * 10) / 10;
    s.lastUpdate = now;
    changed = true;
  });
  if (d.marketExpiry && now > d.marketExpiry) {
    d.marketStatus = 'normal'; d.marketExpiry = null; changed = true;
  }
  if (changed) saveData(d);
}

/* ══ 지식 입력 (주식 발행) ══ */
function openWriteKnowledge() {
  document.getElementById('write-form').classList.remove('hidden');
  document.getElementById('wf-title').value = '';
  document.getElementById('wf-text').value  = '';
  document.getElementById('wf-title').focus();
  selectWfSector('수학');
  wfInitialPrice = 20;
  clearAttachment();
  const ipInput = document.getElementById('wf-init-price-input');
  if (ipInput) ipInput.value = 20;
  updatePpbVisibility();
}

function closeWriteKnowledge() {
  document.getElementById('write-form').classList.add('hidden');
  clearAttachment();
}

/* ── 첨부파일 ── */
function handleAttachmentFile(input) {
  const file = input.files[0];
  if (!file) return;
  if (file.size > 512 * 1024) {
    showToast('❌ 파일이 너무 큽니다 (최대 500KB)');
    input.value = '';
    return;
  }
  const reader = new FileReader();
  reader.onload = e => {
    wfAttachment = { name: file.name, type: file.type, size: file.size, data: e.target.result };
    document.getElementById('wf-attach-name').textContent = file.name;
    document.getElementById('wf-attach-size').textContent = `(${Math.round(file.size / 1024)}KB)`;
    document.getElementById('wf-attach-preview').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function clearAttachment() {
  wfAttachment = null;
  const inp = document.getElementById('wf-file-input');
  if (inp) inp.value = '';
  const prev = document.getElementById('wf-attach-preview');
  if (prev) prev.classList.add('hidden');
}

function openAttachment(dataUrl, name) {
  if (!dataUrl) return;
  if (dataUrl.startsWith('data:image/')) {
    // 이미지는 새 탭에서 바로 보여줌
    const w = window.open('', '_blank');
    w.document.write(`<html><body style="margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh"><img src="${dataUrl}" style="max-width:100%;max-height:100vh"></body></html>`);
    w.document.title = name || 'image';
  } else {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name || 'attachment';
    a.click();
  }
}

function openDetailEntryAttachment(idx) {
  const stock = getMarketStock(currentDetailId);
  const entry = (stock?.shares || [])[idx];
  if (entry?.attachment) openAttachment(entry.attachment.data, entry.attachment.name);
}

function openPortfolioAttachment(stockId, boughtEntryIndex) {
  const d  = getData();
  const h  = d.holdings[stockId];
  if (!h) return;
  const be = (h.boughtEntries || [])[boughtEntryIndex];
  if (!be) return;
  const mktStock = getMarketStock(stockId);
  const src = (mktStock?.shares || [])[be.idx];
  if (src?.attachment) openAttachment(src.attachment.data, src.attachment.name);
}

function selectWfSector(sec) {
  wfSector = sec;
  document.querySelectorAll('.wf-sec-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.s === sec);
  });
  updatePpbVisibility();
}

function pickWfSector(btn) { selectWfSector(btn.dataset.s); }

function updatePpbVisibility() {
  const d       = getData();
  const isNew   = !d.mySectors[wfSector];
  const initRow = document.getElementById('wf-init-price-row');
  if (initRow) initRow.style.display = isNew ? '' : 'none';
}

/* 시장 상황에 따라 매수당 주가 상승폭 자동 결정 */
function calcAutoPricePerBuy(sector) {
  const d      = getData();
  const status = d.marketStatus || 'normal';
  // 기준값: 호황=높음, 불황=낮음
  const base   = status === 'boom' ? 18 : status === 'recession' ? 6 : 10;
  // 섹터 인기도 보정 (시장에 많이 거래될수록 조금 더 높게)
  const demoStock = DEMO_MARKET.find(m => m.sector === sector);
  const popularity = demoStock ? Math.min(demoStock.sharesIssued / 10, 1) : 0;
  const bonus = Math.round(popularity * 5);
  // ±2 내 랜덤 변동
  const jitter = Math.round((Math.random() * 4) - 2);
  return Math.max(3, base + bonus + jitter);
}

function pickWfInitPriceInput(input) {
  const val = parseInt(input.value) || 20;
  if (val < 20) { input.value = 20; wfInitialPrice = 20; }
  else wfInitialPrice = val;
}


function submitKnowledge() {
  const title = document.getElementById('wf-title').value.trim();
  const text  = document.getElementById('wf-text').value.trim();
  if (!title) { shake('wf-title'); showToast('❌ 제목을 입력해주세요'); return; }
  if (!text)  { shake('wf-text');  showToast('❌ 내용을 입력해주세요');  return; }

  const d   = getData();
  const sec = wfSector;

  if (!d.mySectors[sec]) {
    d.mySectors[sec] = {
      price:           wfInitialPrice,
      priceHistory:    [{ v: wfInitialPrice, d: today() }],
      shares:          [],
      sharesIssued:    0,
      pricePerBuy:     calcAutoPricePerBuy(sec),
      lastInput:       today(),
      lastBought:      null,
      lastReview:      null,
      lastUpdate:      Date.now(),
      lastHistoryDate: today(),
      addedDate:       today(),
    };
  }

  const s = d.mySectors[sec];
  const entry = { title, text, date: today() };
  if (wfAttachment) entry.attachment = wfAttachment;
  s.shares.push(entry);
  s.sharesIssued = (s.sharesIssued || 0) + 1;
  s.lastInput    = today();
  s.lastUpdate   = Date.now();

  d.balance = (d.balance || 0) + WRITE_REWARD;
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type: 'write', sector: sec });

  saveData(d);
  clearAttachment();
  closeWriteKnowledge();
  showToast(`✅ ${SECTOR_EMOJI[sec]||''} ${sec} 주식 1주 발행 완료! +C${WRITE_REWARD}`);
  updateBalanceDisplay();
  updateStreak();
  renderMyKnowledge();
  updateTicker();
}

/* ══ 시장 매수 — 지식 선택 방식 ══ */
function renderBuyKnowledgeList(filterQ) {
  const list = document.getElementById('buy-knowledge-list');
  if (!list) return;
  const mktStock = getMarketStock(currentDetailId);
  if (!mktStock) return;

  const shares = mktStock.shares || [];
  const q = (filterQ || '').toLowerCase();
  const d = getData();
  const hold = d.holdings[currentDetailId];
  const ownedIdxs = new Set((hold?.boughtEntries || []).map(e => e.idx));

  const rows = shares.map((entry, realIdx) => ({ entry, realIdx }))
    .filter(({ entry }) => !q || entry.text.toLowerCase().includes(q));

  if (!rows.length) {
    list.innerHTML = `<div class="buy-kn-empty">${q ? '검색 결과 없음' : '등록된 지식이 없습니다'}</div>`;
    updateBuySummary(mktStock);
    return;
  }

  list.innerHTML = rows.map(({ entry, realIdx }) => {
    const sel   = selectedBuyIndices.has(realIdx);
    const owned = ownedIdxs.has(realIdx);
    const ttl   = entry.title || '(제목 없음)';
    return `<div class="buy-kn-entry${sel ? ' selected' : ''}${owned ? ' already-bought' : ''}"
                 onclick="${owned ? '' : `toggleBuyEntry(${realIdx})`}">
      <div class="buy-kn-check-col">${owned ? '✓' : sel ? '☑' : '☐'}</div>
      <div class="buy-kn-body">
        <div class="buy-kn-title">${esc(ttl)}</div>
        <div class="buy-kn-meta">
          <span class="buy-kn-date">${entry.date}</span>
          ${entry.attachment ? '<span class="buy-kn-attach-tag">📎 첨부파일 있음</span>' : ''}
          ${owned ? '<span class="buy-kn-owned-tag">보유중</span>' : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  updateBuySummary(mktStock);
}

function filterBuyKnowledge(q) {
  renderBuyKnowledgeList(q);
}

function toggleBuyEntry(idx) {
  if (selectedBuyIndices.has(idx)) selectedBuyIndices.delete(idx);
  else selectedBuyIndices.add(idx);
  const q = document.getElementById('buy-search')?.value || '';
  renderBuyKnowledgeList(q);
}

function updateBuySummary(mktStock) {
  const stock  = mktStock || getMarketStock(currentDetailId);
  const count  = selectedBuyIndices.size;
  const cost   = count * Math.round(stock?.price || 0);
  const selEl  = document.getElementById('buy-selected-label');
  const costEl = document.getElementById('buy-total-cost-label');
  const btn    = document.getElementById('btn-buy-confirm');
  if (selEl)  selEl.textContent  = `${count}개 선택`;
  if (costEl) costEl.textContent = `총 C${cost}`;
  if (btn)    btn.disabled = count === 0;
}

function confirmBuySelected() {
  if (!selectedBuyIndices.size) return;
  const mktStock = getMarketStock(currentDetailId);
  if (!mktStock) return;

  const d         = getData();
  const count     = selectedBuyIndices.size;
  const unitCost  = Math.round(mktStock.price);
  const totalCost = count * unitCost;

  if (d.balance < totalCost) {
    showToast(`❌ 잔액 부족 — 필요 C${totalCost}, 보유 C${Math.round(d.balance)}`);
    return;
  }

  d.balance -= totalCost;

  const h = d.holdings[currentDetailId] || {
    stockId:     currentDetailId,
    uid:         mktStock.uid,
    creatorName: mktStock.creatorName,
    sector:      mktStock.sector,
    sharesOwned: 0,
    totalCost:   0,
    boughtEntries: [],
  };
  h.sharesOwned    += count;
  h.totalCost      += totalCost;
  h.boughtEntries   = h.boughtEntries || [];
  const shares = mktStock.shares || [];
  selectedBuyIndices.forEach(idx => {
    const src = shares[idx] || {};
    h.boughtEntries.push({ idx, title: src.title || '', text: src.text || '', date: today() });
  });
  d.holdings[currentDetailId] = h;
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type: 'buy', stockId: currentDetailId, count });
  saveData(d);

  // 데모 시장: 선택한 수만큼 주가 상승
  const dIdx = DEMO_MARKET.findIndex(m => m.id === currentDetailId);
  if (dIdx >= 0) {
    DEMO_MARKET[dIdx].price = Math.round((DEMO_MARKET[dIdx].price + DEMO_MARKET[dIdx].pricePerBuy * count) * 10) / 10;
    DEMO_MARKET[dIdx].lastBought = today();
    pushHistory(DEMO_MARKET[dIdx], DEMO_MARKET[dIdx].price);
  }

  showToast(`📈 ${count}주 매수 완료! C${totalCost} 지출 · ${mktStock.creatorName}의 ${mktStock.sector}`);
  selectedBuyIndices.clear();
  updateBalanceDisplay();
  openMarketDetail(currentDetailId);
}

function getMarketStock(stockId) {
  const demo = DEMO_MARKET.find(m => m.id === stockId);
  if (demo) return demo;
  if (stockId && stockId.startsWith('my_')) {
    const sec = stockId.slice(3);
    const d   = getData();
    const s   = d.mySectors[sec];
    if (s) {
      const profile = getProfile();
      return { ...s, id: stockId, uid: currentUserId, creatorName: profile?.name || '나', sector: sec, isOwn: true };
    }
  }
  return null;
}

/* ══ 복습 (내 주식 가격 회복) ══ */
let reviewSector = null;

function openReviewPanel() {
  if (!currentDetailId || !currentDetailId.startsWith('my_')) return;
  document.getElementById('review-panel').classList.remove('hidden');
  document.getElementById('review-text').value    = '';
  document.getElementById('review-result').innerHTML = '';
  document.getElementById('review-result').classList.add('hidden');
  document.getElementById('confirm-review-btn').classList.add('hidden');
  document.getElementById('review-submit-btn').classList.remove('hidden');
  document.getElementById('review-text').focus();
  document.getElementById('review-panel').scrollIntoView({ behavior:'smooth', block:'nearest' });
}

function closeReviewPanel() {
  document.getElementById('review-panel').classList.add('hidden');
  pendingReviewData = null;
}

function submitReview() {
  const sec = currentDetailId?.startsWith('my_') ? currentDetailId.slice(3) : null;
  if (!sec) return;
  const d = getData();
  const s = d.mySectors[sec];
  if (!s || !s.shares?.length) { showToast('입력된 지식이 없습니다'); return; }

  const userText = document.getElementById('review-text').value.trim();
  if (!userText) { shake('review-text'); return; }

  const origText = s.shares.map(e => e.text).join(' ');
  const sim      = calcSimilarity(origText, userText);

  let pts, label, icon, cls;
  if      (sim >= 0.5) { pts = REVIEW_PERFECT; label = '완벽히 기억!';   icon = '🟢'; cls = 'verdict-perfect'; }
  else if (sim >= 0.2) { pts = REVIEW_HAZY;   label = '흐릿하게 기억';  icon = '🟡'; cls = 'verdict-hazy'; }
  else                  { pts = REVIEW_FORGOT; label = '기억 안 남';     icon = '🔴'; cls = 'verdict-forgot'; }

  pendingReviewData = { sec, pts };
  document.getElementById('review-result').innerHTML = `
    <div class="verdict-card ${cls}">
      <div class="verdict-icon">${icon}</div>
      <div class="verdict-label">${label}</div>
      <div class="verdict-score">+${pts}pt</div>
      <div class="review-entries-reveal">
        <div class="rer-label">원본 지식</div>
        <div class="rer-orig">${esc(origText.slice(0, 200))}${origText.length > 200 ? '…' : ''}</div>
        <div class="rer-label">내 답변</div>
        <div class="rer-user">${esc(userText)}</div>
      </div>
    </div>`;
  document.getElementById('review-result').classList.remove('hidden');
  document.getElementById('confirm-review-btn').classList.remove('hidden');
  document.getElementById('review-submit-btn').classList.add('hidden');
}

function calcSimilarity(orig, user) {
  const tok = s => new Set(
    s.replace(/[^가-힣a-zA-Z0-9\s]/g, ' ').toLowerCase().split(/\s+/).filter(w => w.length >= 2)
  );
  const o = tok(orig), u = tok(user);
  if (!o.size) return 0;
  let cnt = 0;
  u.forEach(w => { if (o.has(w)) cnt++; });
  return cnt / o.size;
}

function confirmReview() {
  if (!pendingReviewData) return;
  const { sec, pts } = pendingReviewData;
  pendingReviewData = null;
  const d = getData();
  const s = d.mySectors[sec];
  if (!s) return;
  s.price      = Math.round((s.price + pts) * 10) / 10;
  s.lastReview = today();
  s.lastUpdate = Date.now();
  pushHistory(s, s.price);
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type: 'review', sector: sec });
  saveData(d);
  showToast(`✅ 복습 완료! +${pts}pt → C${s.price.toFixed(0)}`);
  updateStreak();
  document.getElementById('confirm-review-btn').classList.add('hidden');
  document.getElementById('review-submit-btn').classList.remove('hidden');
  openMarketDetail('my_' + sec);
  updateTicker();
}

/* ══ 화면 이동 ══ */
function navigateTo(name) {
  prevScreen    = currentScreen;
  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.sn-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');
  document.querySelector('.content-area')?.scrollTo(0, 0);
  if (name === 'home')         renderHome();
  if (name === 'myknowledge')  renderMyKnowledge();
  if (name === 'portfolio')    renderPortfolio();
  if (name === 'settings')     renderSettings();
}

function goBack() { navigateTo(prevScreen || 'home'); }

/* ══ 홈: 시장 ══ */
function renderHome() {
  updateBalanceDisplay();
  updateKospiBar();
  renderMarketList();
  renderHomeAside();
}

function updateKospiBar() {
  const d = getData();
  const allPrices = [
    ...DEMO_MARKET.map(s => s.price),
    ...Object.values(d.mySectors).map(s => s.price),
  ];
  const total = allPrices.reduce((a, p) => a + p, 0);
  const el = document.getElementById('kospi-full');
  if (el) el.textContent = total.toFixed(0);
  const el2 = document.getElementById('kospi-val');
  if (el2) el2.textContent = total.toFixed(0);
  const chip = document.getElementById('market-chip');
  if (chip) {
    const st = d.marketStatus;
    if (st === 'boom')      { chip.textContent = '🟢 호황'; chip.className = 'market-chip boom'; }
    else if (st === 'recession') { chip.textContent = '🔴 침체'; chip.className = 'market-chip recession'; }
    else                    { chip.textContent = '🟡 정상'; chip.className = 'market-chip'; }
  }
}

function renderMarketList() {
  const d       = getData();
  const myName  = getProfile()?.name || '나';

  let all = DEMO_MARKET.map(s => ({ ...s, isOwn: false }));
  Object.entries(d.mySectors).forEach(([sec, s]) => {
    all.push({ ...s, id: 'my_' + sec, uid: currentUserId, creatorName: myName, sector: sec, isOwn: true });
  });

  if (filterSector !== 'all') all = all.filter(s => s.sector === filterSector);
  if (filterQuery) {
    const q = filterQuery.toLowerCase();
    all = all.filter(s => s.creatorName.toLowerCase().includes(q) || s.sector.toLowerCase().includes(q));
  }
  all.sort((a, b) => b.price - a.price);

  const cntEl = document.getElementById('market-stock-count');
  if (cntEl) cntEl.textContent = `${all.length}개 종목`;

  const listEl  = document.getElementById('market-list');
  const emptyEl = document.getElementById('market-empty');
  if (!listEl) return;

  if (!all.length) {
    listEl.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }
  emptyEl?.classList.add('hidden');

  listEl.innerHTML = all.map(s => {
    const chg   = priceChgPct(s.priceHistory);
    const color = SECTOR_COLORS[s.sector] || '#6B7280';
    return `
      <div class="stock-card" onclick="openMarketDetail('${s.id}')">
        <div class="sc-left">
          <div class="sc-name">
            ${SECTOR_EMOJI[s.sector]||''} ${esc(s.sector)}주
            ${s.isOwn ? '<span class="sc-own-tag">내 발행</span>' : ''}
          </div>
          <div class="sc-meta">
            <span class="sc-creator" style="color:${color}">${esc(s.creatorName)}</span>
            <span class="sc-shares-cnt">· ${s.sharesIssued||0}주 발행</span>
          </div>
        </div>
        <div class="sc-right">
          <div class="sc-price" style="color:${priceColor(s.price)}">C${s.price.toFixed(0)}</div>
          <div class="sc-chg ${chg>=0?'green':'red'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
        </div>
      </div>`;
  }).join('');
}

function priceChgPct(h) {
  if (!h || h.length < 2) return 0;
  const p = h[h.length - 2], c = h[h.length - 1];
  const pv = typeof p === 'number' ? p : p.v;
  const cv = typeof c === 'number' ? c : c.v;
  return pv > 0 ? (cv - pv) / pv * 100 : 0;
}

function priceColor(p) {
  if (p >= 70) return 'var(--green)';
  if (p >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

function filterStocks() {
  filterQuery = document.getElementById('search-input').value.trim();
  renderMarketList();
}

function setSectorFilter(val) {
  filterSector = val;
  document.querySelectorAll('.filter-pill').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filter-pill[data-f="${val}"]`)?.classList.add('active');
  renderMarketList();
}

/* ── 홈 오른쪽 패널 ── */
function renderHomeAside() {
  const d      = getData();
  const todStr = today();

  // 보유 현황
  const sumEl = document.getElementById('aside-summary');
  if (sumEl) {
    const myCount  = Object.keys(d.mySectors).length;
    const holdCount = Object.keys(d.holdings).length;
    const holdVal  = Object.entries(d.holdings).reduce((a, [id, h]) => {
      const m = getMarketStock(id);
      return a + (m ? m.price * h.sharesOwned : 0);
    }, 0);
    sumEl.innerHTML = `
      <div class="aside-stat-row"><span class="aside-stat-lbl">💰 잔액</span><span class="aside-stat-val">C${Math.round(d.balance||0)}</span></div>
      <div class="aside-stat-row"><span class="aside-stat-lbl">✏️ 내 발행 섹터</span><span class="aside-stat-val">${myCount}개</span></div>
      <div class="aside-stat-row"><span class="aside-stat-lbl">📥 매입 보유</span><span class="aside-stat-val">${holdCount}종목</span></div>
      <div class="aside-stat-row"><span class="aside-stat-lbl">📊 보유 평가액</span><span class="aside-stat-val">C${Math.round(holdVal)}</span></div>`;
  }

  // 오늘의 등락
  const todEl = document.getElementById('aside-today');
  if (todEl) {
    const movers = DEMO_MARKET.map(s => {
      const chg = priceChgPct(s.priceHistory);
      return { name: `${s.creatorName}의 ${s.sector}주`, id: s.id, chg };
    }).filter(m => Math.abs(m.chg) > 0.05).sort((a, b) => Math.abs(b.chg) - Math.abs(a.chg));

    todEl.innerHTML = movers.length
      ? movers.slice(0, 4).map(m => `
          <div class="aside-mover" onclick="openMarketDetail('${m.id}')">
            <span class="aside-mover-name">${esc(m.name)}</span>
            <span class="aside-mover-chg ${m.chg>=0?'green':'red'}">${m.chg>=0?'▲':'▼'}${Math.abs(m.chg).toFixed(1)}%</span>
          </div>`).join('')
      : '<div class="aside-empty">오늘 변동 없음</div>';
  }

  // 이번 주 성과
  const wkEl = document.getElementById('aside-weekly');
  if (wkEl) {
    const now = new Date();
    const dow = now.getDay();
    const mon = new Date(now);
    mon.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const monStr = mon.toISOString().slice(0, 10);
    let writes = 0, buys = 0;
    (d.activityLog || []).forEach(l => {
      if (new Date(l.ts).toISOString().slice(0, 10) >= monStr) {
        if (l.type === 'write') writes++;
        if (l.type === 'buy')   buys++;
      }
    });
    wkEl.innerHTML = `
      <div class="aside-stat-row"><span class="aside-stat-lbl">✏️ 지식 입력</span><span class="aside-stat-val">${writes}건</span></div>
      <div class="aside-stat-row"><span class="aside-stat-lbl">📈 매수 거래</span><span class="aside-stat-val">${buys}건</span></div>`;
  }
}

/* ══ 내 지식 화면 ══ */
function renderMyKnowledge() {
  const d       = getData();
  const sectors = Object.entries(d.mySectors);
  const listEl  = document.getElementById('my-stocks-list');
  const emptyEl = document.getElementById('empty-myknowledge');
  if (!listEl) return;

  if (!sectors.length) {
    listEl.innerHTML = '';
    emptyEl?.classList.remove('hidden');
    return;
  }
  emptyEl?.classList.add('hidden');
  sectors.sort((a, b) => b[1].price - a[1].price);
  listEl.innerHTML = sectors.map(([sec, s]) => {
    const chg = priceChgPct(s.priceHistory);
    const urgentCls = s.price < URGENT_THRESHOLD ? 'sc-urgent' : '';
    return `
      <div class="stock-card ${urgentCls}" onclick="openMarketDetail('my_${sec}')">
        <div class="sc-left">
          <div class="sc-name">${SECTOR_EMOJI[sec]||''} ${esc(sec)}주</div>
          <div class="sc-meta">
            <span style="color:${SECTOR_COLORS[sec]||'#6B7280'};font-size:11px">${s.sharesIssued||0}주 발행</span>
            <span class="sc-shares-cnt">· 최근 입력 ${s.lastInput||'—'}</span>
          </div>
        </div>
        <div class="sc-right">
          <div class="sc-price" style="color:${priceColor(s.price)}">C${s.price.toFixed(0)}</div>
          <div class="sc-chg ${chg>=0?'green':'red'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
        </div>
      </div>`;
  }).join('');
}

/* ══ 상세 화면 ══ */
function openMarketDetail(stockId) {
  currentDetailId = stockId;
  prevScreen      = currentScreen;
  currentScreen   = 'detail';
  document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
  document.getElementById('screen-detail').classList.add('active');
  document.querySelectorAll('.sn-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.content-area')?.scrollTo(0, 0);

  const isOwn = stockId.startsWith('my_');
  const stock = getMarketStock(stockId);
  if (!stock) return;

  // 헤더
  const label = `${esc(stock.creatorName)}의 ${SECTOR_EMOJI[stock.sector]||''} ${esc(stock.sector)}주`;
  document.getElementById('d-name').innerHTML   = label;
  document.getElementById('d-sector').textContent = stock.sector;
  document.getElementById('d-sector').style.color = SECTOR_COLORS[stock.sector] || '#6B7280';
  document.getElementById('d-price').textContent  = `C${stock.price.toFixed(1)}`;
  document.getElementById('d-price').style.color  = priceColor(stock.price);
  const chg   = priceChgPct(stock.priceHistory);
  const chgEl = document.getElementById('d-chg');
  chgEl.textContent = (chg >= 0 ? '▲ +' : '▼ ') + chg.toFixed(1) + '%';
  chgEl.className   = 'd-chg ' + (chg >= 0 ? 'green' : 'red');

  // 발행 정보
  const siEl = document.getElementById('d-shares-issued');
  if (siEl) siEl.textContent = stock.sharesIssued || 0;
  const liEl = document.getElementById('d-last-input');
  if (liEl) liEl.textContent = stock.lastInput || '—';
  const lbEl = document.getElementById('d-last-bought');
  if (lbEl) lbEl.textContent = stock.lastBought || '없음';

  // 액션 영역
  if (isOwn) {
    document.getElementById('detail-buy-section').classList.add('hidden');
    document.getElementById('detail-own-section').classList.remove('hidden');
    document.getElementById('review-panel').classList.add('hidden');
    pendingReviewData = null;
    const rvSub = document.getElementById('review-submit-btn');
    const rvCon = document.getElementById('confirm-review-btn');
    if (rvSub) rvSub.classList.remove('hidden');
    if (rvCon) rvCon.classList.add('hidden');
    const rvRes = document.getElementById('review-result');
    if (rvRes) { rvRes.innerHTML = ''; rvRes.classList.add('hidden'); }
  } else {
    document.getElementById('detail-own-section').classList.add('hidden');
    document.getElementById('detail-buy-section').classList.remove('hidden');
    const d    = getData();
    const hold = d.holdings[stockId];
    const myShEl = document.getElementById('d-my-shares');
    if (myShEl) myShEl.textContent = hold ? `${hold.sharesOwned}주 보유` : '미보유';
    // 검색창 초기화 & 선택 초기화
    selectedBuyIndices.clear();
    const searchEl = document.getElementById('buy-search');
    if (searchEl) searchEl.value = '';
    renderBuyKnowledgeList('');
  }

  // 지식 항목
  const entries = stock.shares || [];
  const cntEl   = document.getElementById('d-entry-count');
  if (cntEl) cntEl.textContent = entries.length + '건';
  const entriesEl = document.getElementById('d-entries');
  if (entriesEl) {
    entriesEl.classList.add('hidden');
    const arrowEl = document.querySelector('#entry-toggle-btn .ds-arrow');
    if (arrowEl) arrowEl.textContent = '▼';
    entriesEl.innerHTML = !entries.length
      ? '<div class="entry-empty">아직 입력된 지식이 없습니다</div>'
      : entries.map((e, i) => {
          const ttl = e.title || '(제목 없음)';
          const attachBtn = e.attachment
            ? `<button class="port-kn-attach-btn" style="margin-top:6px" onclick="event.stopPropagation();openDetailEntryAttachment(${i})">📎 ${esc(e.attachment.name)}</button>`
            : '';
          return `
            <div class="ea-card" id="ea_${i}">
              <div class="ea-header" onclick="toggleEntry(${i})">
                <span class="ea-num">#${i+1}</span>
                <span class="ea-title">${esc(ttl)}</span>
                <span class="ea-date">${e.date}</span>
                <span class="ea-arrow">▼</span>
              </div>
              <div class="ea-body hidden">
                <p class="ea-full-text">${esc(e.text)}</p>
                ${attachBtn}
              </div>
            </div>`;
        }).join('');
  }

  // 차트
  chartZoom = 7;
  document.querySelectorAll('.cz-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.cz-btn[data-z="7"]')?.classList.add('active');
  drawDetailChart(stock.priceHistory || []);
}

function toggleEntry(i) {
  const bodies = document.querySelectorAll('.ea-body');
  const arrows = document.querySelectorAll('.ea-card .ea-arrow');
  if (!bodies[i]) return;
  const closed = bodies[i].classList.toggle('hidden');
  if (arrows[i]) arrows[i].textContent = closed ? '▼' : '▲';
}

function toggleEntryList() {
  const el  = document.getElementById('d-entries');
  const arr = document.querySelector('#entry-toggle-btn .ds-arrow');
  if (!el) return;
  const hidden = el.classList.toggle('hidden');
  if (arr) arr.textContent = hidden ? '▼' : '▲';
}

function setChartZoom(days) {
  chartZoom = days;
  const s = currentDetailId ? getMarketStock(currentDetailId) : null;
  if (s) drawDetailChart(s.priceHistory || []);
}

function drawDetailChart(rawHistory) {
  _currentChartHistory = rawHistory || [];
  const canvas = document.getElementById('price-chart');
  if (!canvas) return;
  if (priceChartInstance) { priceChartInstance.destroy(); priceChartInstance = null; }

  const values = historyValues(_currentChartHistory);
  if (values.length < 2) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--sub') || '#888';
    ctx.font = '12px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('데이터 축적 중...', canvas.width / 2, canvas.height / 2);
    return;
  }

  const isUp  = values[values.length - 1] >= values[0];
  const color = isUp ? '#3FB950' : '#F85149';

  // minimal thumbnail — no axes, no tooltips, no labels
  priceChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: color,
        backgroundColor: color + '22', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: {
        x: { display: false },
        y: { display: false }
      }
    }
  });
}

/* ── 차트 모달 ── */
function openChartModal() {
  const s = currentDetailId ? getMarketStock(currentDetailId) : null;
  if (!s) return;
  document.getElementById('chart-modal-title').textContent = `${s.sector} 주가 차트`;
  modalZoom = 7;
  document.querySelectorAll('.chart-modal-zoom-btns .cz-btn').forEach(b => b.classList.toggle('active', b.dataset.z === '7'));
  document.getElementById('chart-modal').classList.remove('hidden');
  drawModalChart(_currentChartHistory);
}

function closeChartModal(e) {
  if (e && e.target !== document.getElementById('chart-modal')) return;
  document.getElementById('chart-modal').classList.add('hidden');
  if (modalChartInstance) { modalChartInstance.destroy(); modalChartInstance = null; }
}

function setModalZoom(days) {
  modalZoom = days;
  document.querySelectorAll('.chart-modal-zoom-btns .cz-btn').forEach(b => b.classList.toggle('active', +b.dataset.z === days));
  drawModalChart(_currentChartHistory);
}

function drawModalChart(rawHistory) {
  const canvas = document.getElementById('modal-price-chart');
  if (!canvas) return;
  if (modalChartInstance) { modalChartInstance.destroy(); modalChartInstance = null; }

  let filtered = rawHistory || [];
  if (modalZoom < 9999 && filtered.length) {
    const cutStr = offset(-modalZoom);
    const byDate = filtered.filter(p => (typeof p === 'object' ? p.d : '0') >= cutStr);
    filtered = byDate.length >= 2 ? byDate : filtered.slice(-Math.max(modalZoom, 2));
  }

  const values = historyValues(filtered);
  const labels = historyLabels(filtered);

  if (values.length < 2) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--sub') || '#888';
    ctx.font = '14px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('데이터 축적 중...', canvas.width / 2, 150);
    return;
  }

  const isUp  = values[values.length - 1] >= values[0];
  const color = isUp ? '#3FB950' : '#F85149';
  const light = document.body.classList.contains('light-mode');
  const axis  = light ? '#656D76' : '#8B949E';
  const grid  = light ? '#D0D7DE44' : '#30363D88';

  modalChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels, datasets: [{ data: values, borderColor: color, backgroundColor: color + '22',
        fill: true, tension: 0.3, pointRadius: values.length > 30 ? 0 : 3,
        pointHoverRadius: 5, pointBackgroundColor: color, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 300 },
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `C${ctx.raw}` } } },
      scales: {
        x: { ticks: { color: axis, font: { size: 10 }, maxTicksLimit: 8, maxRotation: 0 }, grid: { color: grid } },
        y: { ticks: { color: axis, font: { size: 11 }, callback: v => `C${v}` }, grid: { color: grid } }
      }
    }
  });
}

/* ── 프리미엄 모달 ── */
function showPremiumModal() {
  document.getElementById('premium-modal').classList.remove('hidden');
}

function closePremiumModal(e) {
  if (e && e.target !== document.getElementById('premium-modal')) return;
  document.getElementById('premium-modal').classList.add('hidden');
}

function upgradePremium() {
  document.getElementById('premium-modal').classList.add('hidden');
  showToast('🚀 준비 중! 곧 결제 기능이 오픈됩니다 😊');
}

/* ── 지식 추가 (상세 화면에서) ── */
function addKnowledgeFromDetail() {
  const sec = currentDetailId?.startsWith('my_') ? currentDetailId.slice(3) : null;
  if (!sec) return;
  navigateTo('myknowledge');
  setTimeout(() => {
    openWriteKnowledge();
    selectWfSector(sec);
  }, 80);
}

/* ══ 포트폴리오 ══ */
function renderPortfolio() {
  const d      = getData();
  const myName = getProfile()?.name || '나';

  const holdVal = Object.entries(d.holdings).reduce((a, [id, h]) => {
    const m = getMarketStock(id);
    return a + (m ? m.price * h.sharesOwned : 0);
  }, 0);
  const myVal   = Object.values(d.mySectors).reduce((a, s) => a + s.price, 0);
  const balance = d.balance || 0;

  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('port-balance',      `C${Math.round(balance)}`);
  set('port-holdings-val', `C${Math.round(holdVal)}`);
  set('port-my-val',       `C${Math.round(myVal)}`);
  set('port-total-val',    `C${Math.round(balance + holdVal + myVal)}`);

  // 매입 보유 목록
  const holdEl   = document.getElementById('holdings-list');
  const holdings = Object.entries(d.holdings);
  if (holdEl) {
    if (!holdings.length) {
      holdEl.innerHTML = '<div class="port-empty-msg">아직 매입한 주식이 없습니다.<br>시장에서 다른 사람의 지식을 매수해 보세요!</div>';
    } else {
      holdEl.innerHTML = holdings.map(([id, h]) => {
        const m      = getMarketStock(id);
        const curP   = m ? m.price : 0;
        const curVal = curP * h.sharesOwned;
        const pnl    = curVal - (h.totalCost || 0);
        const pnlPct = h.totalCost > 0 ? pnl / h.totalCost * 100 : 0;
        const entries = h.boughtEntries || [];

        const blockId = `pkn-${id.replace(/[^a-z0-9]/gi,'_')}`;
        const entriesHtml = entries.length ? entries.map((e, i) => {
          const srcEntry  = (m?.shares || [])[e.idx] || {};
          const hasAttach = !!(srcEntry.attachment);
          const attachBtn = hasAttach
            ? `<button class="port-kn-attach-btn" onclick="event.stopPropagation();openPortfolioAttachment('${id}',${i})">📎 ${esc(srcEntry.attachment.name)}</button>`
            : '';
          const ttl = e.title || srcEntry.title || '(제목 없음)';
          return `
            <div class="port-kn-item" id="${blockId}_e${i}">
              <div class="port-kn-title-row" onclick="togglePortKnEntry('${blockId}_e${i}')">
                <span class="port-kn-tri">▶</span>
                <span class="port-kn-item-title">${esc(ttl)}</span>
                <span class="port-kn-item-date">${e.date}</span>
              </div>
              <div class="port-kn-content hidden">
                <div class="port-kn-text">${esc(e.text)}</div>
                ${attachBtn ? `<div class="port-kn-foot">${attachBtn}</div>` : ''}
              </div>
            </div>`;
        }).join('') : '<div class="port-kn-none">구매한 지식 항목 없음</div>';

        return `
          <div class="port-hold-block">
            <div class="port-hold-header" onclick="openMarketDetail('${id}')">
              <div class="port-hold-left">
                <div class="sc-name">${SECTOR_EMOJI[h.sector]||''} ${esc(h.sector)}주
                  <span class="sc-creator-small">· ${esc(h.creatorName)}</span>
                </div>
                <div class="sc-meta">${h.sharesOwned}주 · 평가액 C${Math.round(curVal)}</div>
              </div>
              <div class="sc-right">
                <div class="sc-price" style="color:${priceColor(curP)}">C${curP.toFixed(0)}</div>
                <div class="sc-chg ${pnl>=0?'green':'red'}">${pnl>=0?'▲':'▼'}${Math.abs(pnlPct).toFixed(1)}%</div>
              </div>
            </div>
            <div class="port-kn-section">
              <div class="port-kn-sec-header" onclick="togglePortKnSection('${blockId}')">
                <span class="port-kn-sec-tri" id="${blockId}_tri">▼</span>
                <span class="port-kn-sec-label">📚 구매한 지식 ${entries.length}건</span>
              </div>
              <div class="port-kn-entries" id="${blockId}_list">
                ${entriesHtml}
              </div>
            </div>
          </div>`;
      }).join('');
    }
  }

  // 내 발행 주식
  const issuedEl = document.getElementById('my-issued-list');
  const mySectors = Object.entries(d.mySectors);
  if (issuedEl) {
    if (!mySectors.length) {
      issuedEl.innerHTML = '<div class="port-empty-msg">아직 발행한 주식이 없습니다.<br>내 지식 탭에서 지식을 입력해 주식을 발행하세요!</div>';
    } else {
      issuedEl.innerHTML = mySectors.map(([sec, s]) => {
        const chg = priceChgPct(s.priceHistory);
        return `
          <div class="stock-card" onclick="openMarketDetail('my_${sec}')">
            <div class="sc-left">
              <div class="sc-name">${SECTOR_EMOJI[sec]||''} ${esc(sec)}주 <span class="sc-own-tag">내 발행</span></div>
              <div class="sc-meta"><span class="sc-shares-cnt">${s.sharesIssued||0}주 발행</span></div>
            </div>
            <div class="sc-right">
              <div class="sc-price" style="color:${priceColor(s.price)}">C${s.price.toFixed(0)}</div>
              <div class="sc-chg ${chg>=0?'green':'red'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
            </div>
          </div>`;
      }).join('');
    }
  }
}

/* ── 포트폴리오 지식 토글 ── */
function togglePortKnSection(blockId) {
  const list = document.getElementById(blockId + '_list');
  const tri  = document.getElementById(blockId + '_tri');
  if (!list) return;
  const collapsed = list.classList.toggle('port-kn-collapsed');
  if (tri) tri.textContent = collapsed ? '▶' : '▼';
}

function togglePortKnEntry(entryId) {
  const el = document.getElementById(entryId);
  if (!el) return;
  const content = el.querySelector('.port-kn-content');
  const tri     = el.querySelector('.port-kn-tri');
  if (!content) return;
  const hidden = content.classList.toggle('hidden');
  if (tri) tri.textContent = hidden ? '▶' : '▼';
}

/* ══ 설정 ══ */
function renderSettings() {
  const profile = getProfile();
  const el = document.getElementById('ss-email');
  if (el) el.textContent = currentUserEmail || 'demo@example.com';
  if (profile) {
    const nm = document.getElementById('ss-name');
    const ag = document.getElementById('ss-age');
    const pw = document.getElementById('ss-password');
    if (nm) nm.value = profile.name || '';
    if (ag) ag.value = profile.age  || '';
    if (pw) pw.value = '';
  }
  renderHeatmap();
}

function saveProfile() {
  const name = document.getElementById('ss-name').value.trim();
  const age  = parseInt(document.getElementById('ss-age').value);
  if (!name)         { shake('ss-name'); return; }
  if (!age || age<1) { shake('ss-age');  return; }
  const profile = getProfile() || {};
  profile.name = name; profile.age = age;
  const pw = document.getElementById('ss-password').value;
  if (pw) profile.sitePassword = pw;
  saveProfileData(profile);
  document.getElementById('sidebar-user-name').textContent   = name;
  document.getElementById('sidebar-user-avatar').textContent = name[0].toUpperCase();
  showToast('✅ 프로필이 저장되었습니다');
}

function renderHeatmap() {
  const d    = getData();
  const log  = d.activityLog || [];
  const grid = document.getElementById('heatmap-grid');
  if (!grid) return;
  const map = {};
  log.forEach(l => { const k = new Date(l.ts).toISOString().slice(0,10); map[k]=(map[k]||0)+1; });
  const cells = [];
  for (let i = 51; i >= 0; i--) {
    const dt = new Date(); dt.setDate(dt.getDate()-i);
    const k  = dt.toISOString().slice(0,10);
    const cnt = map[k]||0;
    const lvl = cnt===0?0:cnt<=1?1:cnt<=3?2:3;
    cells.push(`<div class="hm-cell hm-${lvl}" title="${k}: ${cnt}건"></div>`);
  }
  grid.innerHTML = cells.join('');
}

function exportData() {
  const d    = getData();
  const blob = new Blob([JSON.stringify(d,null,2)],{type:'application/json'});
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = `kse_backup_${today()}.json`;
  a.click();
  showToast('✅ 데이터 내보내기 완료');
}

function importData() { document.getElementById('import-file').click(); }

function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    try {
      const parsed = JSON.parse(ev.target.result);
      if (!parsed.mySectors && !parsed.stocks) throw new Error('Invalid');
      // 구버전 마이그레이션
      if (parsed.stocks && !parsed.mySectors) {
        parsed.mySectors = {};
        parsed.holdings  = {};
        parsed.balance   = STARTING_BALANCE;
      }
      saveData(parsed);
      showToast('✅ 데이터 가져오기 완료');
      renderHome();
    } catch { showToast('❌ 파일 형식이 올바르지 않습니다'); }
  };
  reader.readAsText(file);
}

/* ══ 티커 ══ */
function updateTicker() {
  const d   = getData();
  const all = [
    ...DEMO_MARKET.map(s => ({ name: `${s.creatorName}의 ${s.sector}주`, price: s.price, h: s.priceHistory })),
    ...Object.entries(d.mySectors).map(([sec, s]) => ({ name: `내 ${sec}주`, price: s.price, h: s.priceHistory })),
  ];
  if (!all.length) {
    document.getElementById('ticker-inner').textContent = '📊 지식 증권거래소에 오신 것을 환영합니다  |  지식을 입력해 주식을 발행해 보세요!';
    return;
  }
  const items = all.map(s => {
    const chg = priceChgPct(s.h);
    return `${s.name}  ${chg>=0?'▲':'▼'}C${s.price.toFixed(0)} (${chg>=0?'+':''}${chg.toFixed(1)}%)`;
  });
  const text = items.join('     |     ');
  document.getElementById('ticker-inner').textContent = text + '     |     ' + text;
}

/* ══ 프로필 설정 ══ */
function saveProfileSetup() {
  const name = document.getElementById('ps-name').value.trim();
  const age  = document.getElementById('ps-age').value.trim();
  const pw   = document.getElementById('ps-password').value;
  const pw2  = document.getElementById('ps-password2').value;
  if (!name)            { shake('ps-name');     return; }
  if (!age || +age < 1) { shake('ps-age');      return; }
  if (!pw)              { shake('ps-password'); return; }
  if (pw !== pw2)       {
    document.getElementById('ps-pw-error').classList.remove('hidden');
    return;
  }
  document.getElementById('ps-pw-error').classList.add('hidden');
  saveProfileData({ name, age: parseInt(age), sitePassword: pw, onboardingDone: false });
  showOverlay('onboarding');
}

function closeOnboarding() {
  const profile = getProfile() || {};
  profile.onboardingDone = true;
  saveProfileData(profile);
  document.getElementById('screen-onboarding').classList.add('hidden');
  if (document.getElementById('app').classList.contains('hidden')) launchApp();
}

function prefillProfileSetup(user) {
  document.getElementById('ps-google-email').textContent = user.email || '';
  document.getElementById('ps-name').value = user.displayName || '';
}

/* ══ 유틸 ══ */
function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.animation = 'none';
  el.offsetHeight;
  el.style.animation = 'shake 0.3s ease';
  setTimeout(() => el.style.animation = '', 400);
}

let toastTimer;
function showToast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2500);
}

function updateSidebarKospi() { updateKospiBar(); }
function updateCoinDisplay()  {}
