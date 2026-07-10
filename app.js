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
const WRITE_REWARD     = 5;
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

// 학교급별 섹터 분류
const SCHOOL_LEVELS = {
  elementary:  ['국어','수학','과학','역사'],
  middle:      ['국어','수학','과학','역사','영어','기타'],
  high:        ['국어','수학','과학','역사','영어','기타','프로그래밍'],
  university:  ['국어','수학','과학','역사','영어','기타','프로그래밍','철학','의학','경제','법학','물리','화학','언어'],
};

// 금칙어 목록
const BANNED_WORDS = ['shit','fuck','damn','bitch','ass','bastard','crap','욕','바보','멍청','개새','씨발','병신','미친'];

/* ── 데모 시장 ── */
// [Feature 2] mkHist 365일 지원: startPrice = finalPrice * 0.25, 노이즈 포함 상승 곡선
function mkHist(days, finalPrice) {
  const h = [];
  const startPrice = finalPrice * 0.25;
  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const t     = (days - i) / Math.max(days, 1);
    const trend = startPrice + (finalPrice - startPrice) * t;
    const noise = (Math.random() * 0.1 - 0.05) * trend;
    const p     = Math.max(MIN_PRICE, Math.round((trend + noise) * 10) / 10);
    h.push({ v: p, d: d.toISOString().slice(0, 10) });
  }
  // 마지막 값을 finalPrice로 고정
  if (h.length) h[h.length - 1].v = finalPrice;
  return h;
}

const DEMO_MARKET = [
  {
    id: 'demo_1', uid: 'u_alice', creatorName: '김민준', sector: '수학',
    price: 48, pricePerBuy: 15, sharesIssued: 9,
    lastInput: offset(-2), lastBought: offset(-1),
    rating: 4.2,
    priceHistory: mkHist(365, 48),
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
    rating: 3.8,
    priceHistory: mkHist(365, 24),
    shares: [
      { title: '가정법 과거', text: 'If + 주어 + were/과거동사, 주어 + would/could + 동사원형. 현재 사실의 반대를 가정할 때 사용.', date: offset(-3) },
      { title: '관계대명사 정리', text: '선행사가 사람→who/that, 사물→which/that. 소유격은 whose. 목적격은 생략 가능.', date: offset(-1) },
    ]
  },
  {
    id: 'demo_3', uid: 'u_carol', creatorName: '박지호', sector: '프로그래밍',
    price: 73, pricePerBuy: 20, sharesIssued: 15,
    lastInput: offset(0), lastBought: offset(0),
    rating: 4.7,
    priceHistory: mkHist(365, 73),
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
    rating: 4.0,
    priceHistory: mkHist(365, 32),
    shares: [
      { title: '산화-환원 반응', text: '산화=전자 잃음/수소 잃음/산소 얻음. 환원=그 반대. 산화와 환원은 항상 동시에 발생(산화환원 동시성).', date: offset(-4) },
      { title: '뉴턴 운동 3법칙', text: '1법칙=관성(힘 없으면 등속직선운동), 2법칙=F=ma(가속도 법칙), 3법칙=작용·반작용(크기 같고 방향 반대).', date: offset(-2) },
    ]
  },
  {
    id: 'demo_5', uid: 'u_eve', creatorName: '정우진', sector: '역사',
    price: 11, pricePerBuy: 10, sharesIssued: 2,
    lastInput: offset(-6), lastBought: offset(-5),
    rating: 3.5,
    priceHistory: mkHist(365, 11),
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
let currentUserId    = null;
let currentUserEmail = null;
let db = null;

function isFirebaseConfigured() {
  return typeof firebaseConfig !== 'undefined' && !firebaseConfig.apiKey.startsWith('YOUR_');
}

function initAuth() {
  const session = LS.get('kse2_session');
  if (session?.userId) {
    currentUserId = session.userId;
    launchApp();
  } else {
    showOverlay('login');
  }
}

function showOverlay(name) {
  ['login','login-form','profile-setup','onboarding'].forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.toggle('hidden', s !== name);
  });
  document.getElementById('app').classList.toggle('hidden', name !== 'app');
}

function showLanding()    { showOverlay('login'); }
function showLoginForm()  {
  document.getElementById('login-nick-input').value = '';
  document.getElementById('login-pw-input').value = '';
  document.getElementById('login-form-error').classList.add('hidden');
  showOverlay('login-form');
}
function showSignupForm() {
  document.getElementById('signup-name-input').value = '';
  document.getElementById('signup-nickname-input').value = '';
  document.getElementById('signup-pw-input').value = '';
  document.getElementById('signup-error').classList.add('hidden');
  showOverlay('profile-setup');
}

function tryLogin() {
  const nickname = document.getElementById('login-nick-input').value.trim();
  const password = document.getElementById('login-pw-input').value;
  const errEl    = document.getElementById('login-form-error');
  const users    = LS.get('kse2_users') || [];
  const user     = users.find(u => u.nickname === nickname && u.password === password);
  if (!user) { errEl.classList.remove('hidden'); return; }
  currentUserId = nickname;
  LS.set('kse2_session', { userId: nickname, name: user.name });
  const profile = getProfile();
  if (!profile || !profile.onboardingDone) { showOverlay('onboarding'); } else { launchApp(); }
}

function trySignup() {
  const name     = document.getElementById('signup-name-input').value.trim();
  const nickname = document.getElementById('signup-nickname-input').value.trim();
  const password = document.getElementById('signup-pw-input').value;
  const errEl    = document.getElementById('signup-error');
  if (!name || !nickname || !password) {
    errEl.textContent = '모든 항목을 입력해주세요.';
    errEl.classList.remove('hidden'); return;
  }
  const users = LS.get('kse2_users') || [];
  if (users.find(u => u.nickname === nickname)) {
    errEl.textContent = '이미 사용 중인 닉네임입니다.';
    errEl.classList.remove('hidden'); return;
  }
  users.push({ name, nickname, password });
  LS.set('kse2_users', users);
  currentUserId = nickname;
  LS.set('kse2_session', { userId: nickname, name });
  saveProfileData({ name, nickname, onboardingDone: false });
  showOverlay('onboarding');
}

function showAdminLogin() {
  ['login','login-form','profile-setup','onboarding'].forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) el.classList.add('hidden');
  });
  document.getElementById('screen-admin-login').classList.remove('hidden');
}

function tryAdminLogin() {
  const name = document.getElementById('admin-name-input').value.trim();
  const pw   = document.getElementById('admin-pw-input').value;
  const errEl = document.getElementById('admin-login-error');
  if (name === '노서현' && pw === '0908') {
    isAdmin = true;
    currentUserId = 'admin';
    localStorage.removeItem('kse2_session'); // 혹시 남은 유저 세션 제거
    document.getElementById('screen-admin-login').classList.add('hidden');
    document.getElementById('admin-pw-input').value = '';
    document.getElementById('admin-name-input').value = '';
    if (errEl) errEl.classList.add('hidden');
    launchApp();
  } else {
    if (errEl) errEl.classList.remove('hidden');
  }
}

function skipAdminLogin() {
  isAdmin = false;
  document.getElementById('screen-admin-login').classList.add('hidden');
  document.getElementById('admin-pw-input').value = '';
  document.getElementById('admin-name-input').value = '';
  document.getElementById('admin-login-error').classList.add('hidden');
  showOverlay('login');
}

function launchApp() {
  showOverlay('app');
  const profile = getProfile();
  const displayName = isAdmin ? '노서현' : (profile?.nickname || profile?.name || currentUserId || '사용자');
  document.getElementById('sidebar-user-name').textContent   = isAdmin ? '노서현 👑' : displayName;
  document.getElementById('sidebar-user-avatar').textContent = displayName[0].toUpperCase();
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
  updatePremiumUI();
  checkFollowNotifications();
  initSidebarState();
}

function signInWithGoogle() {
  if (!isFirebaseConfigured()) return;
  const provider = new firebase.auth.GoogleAuthProvider();
  firebase.auth().signInWithPopup(provider).catch(() => {
    document.getElementById('login-error').classList.remove('hidden');
  });
}

function signOutUser() {
  isAdmin = false;
  currentUserId = null;
  localStorage.removeItem('kse2_session');
  showOverlay('login');
}

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
    mySectors:    {},
    holdings:     {},
    balance:      STARTING_BALANCE,
    activityLog:  [],
    marketStatus: 'normal',
    marketExpiry: null,
    ratings:      {},
    isPremium:    false,
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
let currentScreen       = 'home';
let prevScreen          = null;
let isAdmin             = false;
let currentDetailId     = null;
let filterSector        = 'all';
let filterQuery         = '';
let pendingReviewData   = null;
let chartZoom           = 7;
let priceChartInstance  = null;
let modalChartInstance  = null;
let modalZoom           = 7;
let _currentChartHistory = [];
let wfSector            = '수학';
let wfInitialPrice      = 10;
let wfAttachment        = null;
let wfStockKey          = null; // null = new stock, string key = existing stock
let boardSector         = '수학';
let selectedBuyIndices  = new Set();
let sectorGroupMode     = false;   // [Feature 10]
let currentSchoolLevel  = 'elementary'; // [Feature 8]
let _reportText         = '';      // [Feature 13]

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
  const d       = getData();
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
  const stockNameEl = document.getElementById('wf-stock-name');
  if (stockNameEl) stockNameEl.value = '';
  document.getElementById('wf-title').focus();
  selectWfSector('수학');
  wfInitialPrice = 10;
  clearAttachment();
  const ipInput = document.getElementById('wf-init-price-input');
  if (ipInput) ipInput.value = 10;
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
  wfStockKey = null;
  document.querySelectorAll('.wf-sec-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.s === sec);
  });
  updateWfStockChoice();
}

function pickWfSector(btn) { selectWfSector(btn.dataset.s); }

function updatePpbVisibility() { updateWfStockChoice(); }

function updateWfStockChoice() {
  const d        = getData();
  const existing = Object.entries(d.mySectors)
    .filter(([k, s]) => (s.sector || k) === wfSector);

  const choiceEl = document.getElementById('wf-stock-choice');
  const nameRow  = document.getElementById('wf-stock-name-row');
  const initRow  = document.getElementById('wf-init-price-row');

  if (!existing.length) {
    if (choiceEl) choiceEl.classList.add('hidden');
    if (nameRow)  nameRow.classList.remove('hidden');
    if (initRow)  initRow.style.display = '';
    wfStockKey = null;
    return;
  }

  if (choiceEl) {
    choiceEl.classList.remove('hidden');
    choiceEl.innerHTML = `
      <div class="wf-stock-choice-label">이 섹터에 발행한 종목이 있습니다:</div>
      <div class="wf-stock-choice-list">
        ${existing.map(([k, s]) => `
          <button class="wf-stock-choice-btn${wfStockKey === k ? ' active' : ''}"
                  onclick="chooseExistingStock('${k}')">
            📈 ${esc(s.stockName || (s.sector || k) + '주')} · ${s.sharesIssued||0}주
          </button>`).join('')}
        <button class="wf-stock-choice-btn wf-stock-choice-new${wfStockKey === null ? ' active' : ''}"
                onclick="chooseNewStock()">
          ➕ 새 종목 만들기
        </button>
      </div>`;
  }

  const isNew = (wfStockKey === null);
  if (nameRow)  nameRow.classList.toggle('hidden', !isNew);
  if (initRow)  initRow.style.display = isNew ? '' : 'none';
}

function chooseExistingStock(key) {
  wfStockKey = key;
  updateWfStockChoice();
}

function chooseNewStock() {
  wfStockKey = null;
  updateWfStockChoice();
}

function calcAutoPricePerBuy(sector) {
  const d      = getData();
  const status = d.marketStatus || 'normal';
  const base   = status === 'boom' ? 18 : status === 'recession' ? 6 : 10;
  const demoStock = DEMO_MARKET.find(m => m.sector === sector);
  const popularity = demoStock ? Math.min(demoStock.sharesIssued / 10, 1) : 0;
  const bonus = Math.round(popularity * 5);
  const jitter = Math.round((Math.random() * 4) - 2);
  return Math.max(3, base + bonus + jitter);
}

function pickWfInitPriceInput(input) {
  const val = parseInt(input.value) || 1;
  if (val < 1)   { input.value = 1;  wfInitialPrice = 1; }
  else if (val > 20) { input.value = 20; wfInitialPrice = 20; }
  else wfInitialPrice = val;
}

/* ── [Feature 3] AI 지식 검토 ── */
const SECTOR_KEYWORDS = {
  '수학':      ['방정식','함수','미분','적분','행렬','수열','확률','통계','기하','증명','집합','삼각','계산','공식','풀이','수식','변수','그래프','부등식','인수분해','극한','벡터','로그','지수','다항식','계수','차수','근','해','최솟값','최댓값'],
  '영어':      ['문법','단어','문장','어휘','독해','작문','발음','숙어','표현','번역','vocabulary','grammar','sentence','word','reading','writing','speaking','listening','tense','verb','noun','adjective','preposition','conjunction','영어','영작','회화'],
  '과학':      ['물질','에너지','반응','실험','원소','화합물','힘','운동','전기','자기','빛','파동','생물','세포','진화','유전','생태','지구','원자','분자','온도','압력','밀도','속도','가속도','중력','산소','이산화탄소','광합성','호흡'],
  '역사':      ['시대','왕','왕조','전쟁','혁명','문화','조선','고려','삼국','제국','문명','사건','인물','연대','근대','고대','중세','독립','식민','정치','사회','경제','유물','유적','조약','개혁','운동','봉기','항쟁'],
  '국어':      ['문학','소설','시','수필','문법','맞춤법','어휘','표현','글쓰기','독해','문장','단락','주제','요약','작가','작품','문체','어법','서술','묘사','비유','상징','주인공','배경','갈등','해설','감상','분석'],
  '프로그래밍':['코드','함수','변수','반복','조건','알고리즘','데이터','클래스','객체','배열','리스트','api','서버','데이터베이스','python','javascript','java','c언어','html','css','for','while','if','return','import','output','input','정렬','탐색','재귀'],
  '철학':      ['논리','윤리','존재','인식','가치','진리','자유','도덕','사상','개념','이론','비판','관념','명제','사유','본질','현상','이성','감성','칸트','플라톤','아리스토텔레스','소크라테스','형이상학','인식론','존재론'],
  '의학':      ['신체','질병','치료','약물','수술','진단','증상','건강','해부','생리','면역','세포','혈액','신경','뇌','바이러스','세균','감염','장기','심장','폐','간','신장','뼈','근육','혈압','당뇨','암','백신','항생제'],
  '경제':      ['시장','수요','공급','가격','화폐','금리','인플레이션','gdp','무역','투자','소비','생산','기업','주식','채권','경제','금융','환율','물가','실업','성장','분배','세금','재정','통화','환경','자본','노동'],
  '법학':      ['법률','헌법','형법','민법','판례','권리','의무','계약','소송','재판','법원','검사','변호사','처벌','규정','조항','범죄','형사','민사','불법','합법','피고','원고','증거','선고','구속','배상','손해','위반'],
  '물리':      ['힘','운동','에너지','전기','자기','광학','파동','핵','양자','열역학','입자','질량','속도','가속도','마찰','중력','전류','전압','저항','진동','공명','빛','굴절','반사','렌즈','자기장','전자기'],
  '화학':      ['원소','화합물','반응','분자','원자','산','염기','산화','환원','결합','이온','주기율','물질','용액','농도','촉매','전해질','유기','무기','산화수','몰','분자량','에탄올','포도당','단백질','지방','탄수화물'],
  '언어':      ['문법','어휘','음운','형태','통사','의미','언어학','방언','사투리','번역','단어','표현','소통','발음','문자','습득','한국어','외국어','언어','모국어','이중언어','화용','담화','텍스트'],
  '기타':      [],
};

function aiReviewKnowledge(title, text, callback) {
  const submitBtn = document.querySelector('.wf-actions .btn-primary');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = '🔍 AI 검토 중...'; }
  showToast('🔍 AI 검토 중...');

  setTimeout(() => {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = '📋 지식 등록 (1주 발행)'; }

    const combined    = (title + ' ' + text).toLowerCase();
    const textNoSpace = text.replace(/\s/g, '');

    // ① 금칙어
    if (BANNED_WORDS.some(w => combined.includes(w.toLowerCase()))) {
      showToast('❌ 부적절한 표현이 포함되어 있습니다.'); callback(false); return;
    }

    // ② 반복 문자 스팸 (같은 글자 5번 이상 연속: ㅇㅇㅇㅇㅇ, aaaaa 등)
    if (/(.)\1{4,}/.test(textNoSpace)) {
      showToast('❌ 의미 없는 반복 입력이 감지됐습니다. 실제 지식을 작성해주세요.'); callback(false); return;
    }

    // ③ 고유 문자 비율 — 스팸 탐지 (전체 글자 중 종류가 12% 미만이면 의미없는 나열)
    if (textNoSpace.length > 0 && new Set(textNoSpace).size / textNoSpace.length < 0.12) {
      showToast('❌ 내용이 너무 단조롭습니다. 실제 지식을 입력해주세요.'); callback(false); return;
    }

    // ④ 최소 분량: 공백 제외 30자 + 단어 5개 이상
    const wordCount = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (textNoSpace.length < 30 || wordCount < 5) {
      showToast('❌ 내용이 너무 부족합니다. 더 자세히 서술해주세요.'); callback(false); return;
    }

    // ⑤ 섹터 연관성 — 선택한 섹터 키워드가 하나 이상 포함돼야 함
    const sectorKws = SECTOR_KEYWORDS[wfSector] || [];
    if (sectorKws.length > 0 && !sectorKws.some(kw => combined.includes(kw))) {
      showToast(`❌ 내용이 '${wfSector}' 섹터와 맞지 않아 보입니다. 섹터를 확인하거나 관련 내용을 추가해주세요.`);
      callback(false); return;
    }

    // ⑥ 제목-내용 일관성 — 제목 단어(2자 이상)의 30% 이상이 본문에 등장해야 함
    const titleWords = title.split(/[\s,\.!?·]+/).filter(w => w.length >= 2);
    if (titleWords.length >= 2) {
      const matchRatio = titleWords.filter(w => text.includes(w)).length / titleWords.length;
      if (matchRatio < 0.3) {
        showToast('❌ 제목과 내용의 연관성이 낮습니다. 제목에 맞는 내용을 작성해주세요.');
        callback(false); return;
      }
    }

    showToast('✅ AI 검토 완료! 교육적 내용으로 확인됐습니다.');
    callback(true);
  }, 800);
}

function submitKnowledge() {
  const title     = document.getElementById('wf-title').value.trim();
  const text      = document.getElementById('wf-text').value.trim();
  const stockName = (document.getElementById('wf-stock-name')?.value || '').trim();
  if (!title) { shake('wf-title'); showToast('❌ 제목을 입력해주세요'); return; }
  if (!text)  { shake('wf-text');  showToast('❌ 내용을 입력해주세요');  return; }

  // 새 종목 생성 시: 종목명 필수 + 섹터명 포함 확인
  if (!wfStockKey) {
    if (!stockName) { shake('wf-stock-name'); showToast('❌ 종목명을 입력해주세요'); return; }
    if (!stockName.includes(wfSector)) {
      shake('wf-stock-name');
      showToast(`❌ 종목명에 섹터명 '${wfSector}'이(가) 포함되어야 합니다`);
      return;
    }
  }

  // AI 검토 후 저장
  aiReviewKnowledge(title, text, (approved) => {
    if (!approved) return;
    _doSaveKnowledge(title, text, stockName);
  });
}

function _doSaveKnowledge(title, text, stockName) {
  const d   = getData();
  const sec = wfSector;

  let stockKey;
  if (wfStockKey) {
    stockKey = wfStockKey;
  } else {
    // 새 종목 생성 — 같은 섹터에 이미 주식이 있으면 복합 키 사용
    stockKey = d.mySectors[sec] ? `${sec}_${Date.now()}` : sec;
    d.mySectors[stockKey] = {
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
      stockName:       stockName || null,
    };
    // 복합 키인 경우 sector 필드 저장
    if (stockKey !== sec) d.mySectors[stockKey].sector = sec;
  }

  const s = d.mySectors[stockKey];
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
    .filter(({ entry }) => !q || entry.title?.toLowerCase().includes(q) || entry.text.toLowerCase().includes(q));

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

/* [Feature 9] 전체 선택 */
function selectAllBuyEntries() {
  const mktStock = getMarketStock(currentDetailId);
  if (!mktStock) return;
  const d = getData();
  const hold = d.holdings[currentDetailId];
  const ownedIdxs = new Set((hold?.boughtEntries || []).map(e => e.idx));
  const shares = mktStock.shares || [];
  shares.forEach((_, idx) => {
    if (!ownedIdxs.has(idx)) selectedBuyIndices.add(idx);
  });
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
    stockId:      currentDetailId,
    uid:          mktStock.uid,
    creatorName:  mktStock.creatorName,
    sector:       mktStock.sector,
    sharesOwned:  0,
    totalCost:    0,
    boughtEntries: [],
  };
  h.sharesOwned   += count;
  h.totalCost     += totalCost;
  h.boughtEntries  = h.boughtEntries || [];
  const shares = mktStock.shares || [];
  selectedBuyIndices.forEach(idx => {
    const src = shares[idx] || {};
    h.boughtEntries.push({ idx, title: src.title || '', text: src.text || '', date: today() });
  });
  d.holdings[currentDetailId] = h;
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type: 'buy', stockId: currentDetailId, count });
  saveData(d);

  // 데모 시장: 주가 상승
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
  if (!stockId) return null;
  const demo = DEMO_MARKET.find(m => m.id === stockId);
  if (demo) return demo;
  if (stockId.startsWith('my_')) {
    const sec = stockId.slice(3);
    const d   = getData();
    const s   = d.mySectors[sec];
    if (s) {
      const profile = getProfile();
      return { ...s, id: stockId, uid: currentUserId, creatorName: profile?.name || '나', sector: s.sector || sec, isOwn: true };
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
  if (name === 'home')          renderHome();
  if (name === 'myknowledge')   renderMyKnowledge();
  if (name === 'portfolio')     renderPortfolio();
  if (name === 'settings')      renderSettings();
  if (name === 'school-level')  renderSchoolLevel();
  if (name === 'board')         renderBoard();
}

/* ══ 토론방 ══ */
const ALL_SECTORS     = ['수학','영어','과학','역사','국어','프로그래밍','철학','의학','경제','법학','물리','화학','언어','기타'];
const PREMIUM_SECTORS = ['철학','의학','경제','법학','물리','화학','언어'];

function getBoard()    { return LS.get('kse2_board') || { posts: [] }; }
function saveBoard(b)  { LS.set('kse2_board', b); }

function isPremiumActive() {
  const d = getData();
  return isAdmin && (d.isPremium || false);
}

function renderBoard() {
  const b     = getBoard();
  const d     = getData();
  const likes = d.boardLikes || [];

  const premium = isPremiumActive();
  const visibleSectors = ALL_SECTORS.filter(s => premium || !PREMIUM_SECTORS.includes(s));

  // 섹터 탭 (비프리미엄은 프리미엄 섹터 잠금 표시)
  const tabEl = document.getElementById('board-sector-tabs');
  if (tabEl) {
    tabEl.innerHTML = visibleSectors.map(sec => {
      const locked = !premium && PREMIUM_SECTORS.includes(sec);
      return `<button class="board-sec-tab${sec === boardSector ? ' active' : ''}${locked ? ' locked' : ''}"
               onclick="${locked ? 'showPremiumModal()' : `selectBoardSector('${sec}')`}">
         ${locked ? '🔒' : (SECTOR_EMOJI[sec]||'')} ${sec}
       </button>`;
    }).join('');
  }

  // 선택된 섹터가 비프리미엄에게 잠긴 경우 기본 섹터로 리셋
  if (!premium && PREMIUM_SECTORS.includes(boardSector)) boardSector = '수학';

  // 포스트 목록 (아코디언) — 비프리미엄은 프리미엄 섹터 글 미노출
  const posts = (b.posts || [])
    .filter(p => p.sector === boardSector && (premium || !PREMIUM_SECTORS.includes(p.sector)))
    .sort((a, bPost) => bPost.id - a.id);

  const postsEl = document.getElementById('board-posts');
  if (postsEl) {
    if (!posts.length) {
      postsEl.innerHTML = '<div class="board-empty">아직 글이 없습니다. 첫 글을 남겨보세요!</div>';
    } else {
      postsEl.innerHTML = posts.map(p => _renderPostRow(p, likes)).join('');
    }
  }

  // 글쓰기 버튼
  const writeWrap = document.getElementById('board-write-wrap');
  const hintEl    = document.getElementById('board-readonly-hint');
  if (isPremiumActive()) {
    writeWrap?.classList.remove('hidden');
    hintEl?.classList.add('hidden');
  } else {
    writeWrap?.classList.add('hidden');
    hintEl?.classList.remove('hidden');
  }

  // 프로필 패널
  renderBoardProfile(b, likes);
  updateFollowNotifBadge();
}

// 아코디언 행: 제목만 표시
function _renderPostRow(p, likes) {
  const liked   = likes.includes(p.id);
  const title   = esc(p.title || '(제목 없음)');
  const replyCount = (p.replies||[]).length;
  return `
    <div class="board-post-row" id="post-${p.id}">
      <div class="bpr-summary" onclick="togglePostExpand(${p.id})">
        <span class="bpr-title">${title}</span>
        <span class="bpr-meta">
          <span class="bpr-author">${esc(p.authorName)}</span>
          <span class="bpr-date">${p.date}</span>
          ${replyCount ? `<span class="bpr-replies">💬${replyCount}</span>` : ''}
          <span class="bpr-likes ${liked ? 'liked' : ''}">❤️${p.likes||0}</span>
        </span>
        <span class="bpr-arrow" id="arrow-${p.id}">▶</span>
      </div>
      <div class="bpr-detail hidden" id="detail-${p.id}">
        <div class="bp-body">${p.html || esc(p.text||'').replace(/\n/g,'<br>')}</div>
        <div class="bp-footer-actions">
          <button class="bp-like-btn${liked ? ' liked' : ''}" onclick="toggleLike(${p.id})">
            ${liked ? '❤️' : '🤍'} <span class="bp-like-count">${p.likes||0}</span> 찜하기
          </button>
          ${isAdmin ? `<button class="bp-delete-btn" onclick="deleteBoardPost(${p.id})">🗑 삭제</button>` : ''}
        </div>
        <div class="bp-replies">
          ${(p.replies||[]).map(r => `
            <div class="bp-reply">
              <span class="bp-reply-author">${esc(r.authorName)}</span>
              <span class="bp-reply-text">${r.html || esc(r.text||'').replace(/\n/g,'<br>')}</span>
              <span class="bp-reply-date">${r.date}</span>
            </div>`).join('')}
        </div>
        ${isPremiumActive() ? `
          <div class="bp-reply-form">
            <input type="text" class="bp-reply-input" id="reply-input-${p.id}"
                   placeholder="댓글 달기..." onkeydown="if(event.key==='Enter')submitBoardReply(${p.id})">
            <button class="bp-reply-btn" onclick="submitBoardReply(${p.id})">↑</button>
          </div>` : `
          <div class="bp-reply-lock" onclick="showPremiumModal()">🔒 댓글은 프리미엄 전용</div>`}
      </div>
    </div>`;
}

function togglePostExpand(postId) {
  const detail = document.getElementById(`detail-${postId}`);
  const arrow  = document.getElementById(`arrow-${postId}`);
  if (!detail) return;
  const isOpen = !detail.classList.contains('hidden');
  detail.classList.toggle('hidden', isOpen);
  if (arrow) arrow.textContent = isOpen ? '▶' : '▼';
}

/* 글쓰기 오버레이 */
function openBoardWrite() {
  if (!isPremiumActive()) { showPremiumModal(); return; }
  const overlay = document.getElementById('board-write-overlay');
  const tagEl   = document.getElementById('bwo-sector-tag');
  if (tagEl) tagEl.textContent = `${SECTOR_EMOJI[boardSector]||''} ${boardSector}`;
  const titleEl = document.getElementById('bwo-title');
  const editor  = document.getElementById('bwo-editor');
  if (titleEl) titleEl.value = '';
  if (editor)  editor.innerHTML = '';
  overlay?.classList.remove('hidden');
  titleEl?.focus();
}

function closeBoardWrite() {
  document.getElementById('board-write-overlay')?.classList.add('hidden');
}

function execFmt(cmd, val) {
  document.getElementById('bwo-editor')?.focus();
  document.execCommand(cmd, false, val || null);
}

function renderBoardProfile(b, likes) {
  const allPosts = b.posts || [];

  const myPosts     = allPosts.filter(p => p.authorId === currentUserId);
  const repliedPosts = allPosts.filter(p =>
    (p.replies || []).some(r => r.authorId === currentUserId)
  );
  const likedPosts  = allPosts.filter(p => likes.includes(p.id));

  function miniItem(p) {
    const preview = p.text.length > 30 ? p.text.slice(0, 30) + '…' : p.text;
    return `<div class="bpp-item" onclick="jumpToPost(${p.id}, '${p.sector}')">
      <span class="bpp-item-sec">${SECTOR_EMOJI[p.sector]||''} ${p.sector}</span>
      <span class="bpp-item-text">${esc(preview)}</span>
    </div>`;
  }

  const countEl = (id, arr) => {
    const el = document.getElementById(id);
    if (el) el.textContent = arr.length;
  };
  countEl('bpp-my-count',    myPosts);
  countEl('bpp-reply-count', repliedPosts);
  countEl('bpp-like-count',  likedPosts);

  const render = (elId, arr) => {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = arr.length
      ? arr.slice(0, 5).map(miniItem).join('')
      : '<div class="bpp-empty">없음</div>';
  };
  render('bpp-my-posts',      myPosts);
  render('bpp-replied-posts', repliedPosts);
  render('bpp-liked-posts',   likedPosts);
}

function jumpToPost(postId, sector) {
  boardSector = sector;
  renderBoard();
  setTimeout(() => {
    const el = document.getElementById(`post-${postId}`);
    if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.classList.add('bp-highlight'); setTimeout(() => el.classList.remove('bp-highlight'), 1500); }
  }, 100);
}

function selectBoardSector(sec) {
  boardSector = sec;
  renderBoard();
}

function toggleLike(postId) {
  const d = getData();
  d.boardLikes = d.boardLikes || [];
  const b = getBoard();
  const post = (b.posts || []).find(p => p.id === postId);
  if (!post) return;

  if (d.boardLikes.includes(postId)) {
    d.boardLikes = d.boardLikes.filter(id => id !== postId);
    post.likes = Math.max(0, (post.likes || 1) - 1);
  } else {
    d.boardLikes.push(postId);
    post.likes = (post.likes || 0) + 1;
  }
  saveData(d);
  saveBoard(b);
  renderBoard();
}

function submitBoardPost() {
  if (!isPremiumActive()) { showPremiumModal(); return; }
  const titleEl  = document.getElementById('bwo-title');
  const editor   = document.getElementById('bwo-editor');
  const title    = (titleEl?.value || '').trim();
  const html     = editor?.innerHTML?.trim() || '';
  const textOnly = editor?.innerText?.trim() || '';
  if (!title)    { shake('bwo-title'); showToast('❌ 제목을 입력해주세요'); return; }
  if (!textOnly) { showToast('❌ 내용을 입력해주세요'); return; }

  const profile    = getProfile();
  const authorName = isAdmin ? '노서현' : (profile?.nickname || profile?.name || currentUserId);
  const b = getBoard();
  b.posts = b.posts || [];
  b.posts.push({
    id:         Date.now(),
    authorId:   currentUserId,
    authorName,
    sector:     boardSector,
    title,
    html,
    text:       textOnly,
    date:       today(),
    replies:    [],
    likes:      0,
  });
  saveBoard(b);
  closeBoardWrite();
  renderBoard();
  showToast('✅ 글이 등록됐습니다');
}

function submitBoardReply(postId) {
  if (!isPremiumActive()) { showToast('🔒 프리미엄 전용 기능입니다'); return; }
  const input = document.getElementById(`reply-input-${postId}`);
  const text  = (input?.value || '').trim();
  if (!text) return;

  const profile = getProfile();
  const b = getBoard();
  const post = (b.posts || []).find(p => p.id === postId);
  if (!post) return;
  post.replies = post.replies || [];
  post.replies.push({
    authorId:   currentUserId,
    authorName: profile?.name || profile?.nickname || currentUserId,
    text,
    date:       today(),
  });
  saveBoard(b);
  renderBoard();
  showToast('💬 댓글이 등록됐습니다');
}

function deleteBoardPost(postId) {
  if (!isAdmin) return;
  if (!confirm('이 글을 삭제하시겠습니까?')) return;
  const b = getBoard();
  b.posts = (b.posts || []).filter(p => p.id !== postId);
  saveBoard(b);
  renderBoard();
  showToast('🗑 글이 삭제됐습니다');
}

/* ══ 팔로우 / 알림 ══ */
function toggleFollow() {
  if (!isPremiumActive()) { showPremiumModal(); return; }
  const d   = getData();
  const uid = currentDetailId?.replace(/^my_/, '');
  if (!uid || uid === currentUserId) return;
  d.following = d.following || {};
  if (d.following[uid]) {
    delete d.following[uid];
    showToast('🔕 알림을 해제했습니다');
  } else {
    d.following[uid] = today();
    showToast('🔔 새 지식 발행 시 알림을 받습니다');
  }
  saveData(d);
  renderFollowBtn(uid);
}

function renderFollowBtn(uid) {
  const btn = document.getElementById('btn-follow-bell');
  if (!btn) return;
  const d = getData();
  const isFollowing = !!(d.following && d.following[uid]);
  btn.textContent = isFollowing ? '🔔 알림 ON' : '🔔 알림받기';
  btn.classList.toggle('active', isFollowing);
}

function checkFollowNotifications() {
  const d = getData();
  if (!d.following || !Object.keys(d.following).length) return;
  let newCount = 0;
  Object.entries(d.following).forEach(([uid, lastSeen]) => {
    const userData = LS.get(`kse2_data_${uid}`);
    if (!userData) return;
    Object.values(userData.mySectors || {}).forEach(s => {
      if (s.lastInput && s.lastInput > lastSeen) newCount++;
    });
  });
  const badge = document.getElementById('board-notif-badge');
  if (badge) {
    badge.classList.toggle('hidden', newCount === 0);
    badge.textContent = newCount;
  }
}

function updateFollowNotifBadge() {
  checkFollowNotifications();
}

function goBack() { navigateTo(prevScreen || 'home'); }

/* ══ 사이드바 토글 ══ */
function toggleMainSidebar() {
  const nav = document.getElementById('main-sidebar');
  const btn = document.getElementById('sn-collapse-btn');
  if (!nav) return;
  const collapsed = nav.classList.toggle('collapsed');
  if (btn) btn.textContent = collapsed ? '▶' : '◀';
  localStorage.setItem('kse2_sidebar_collapsed', collapsed ? '1' : '');
}

function initSidebarState() {
  if (localStorage.getItem('kse2_sidebar_collapsed')) {
    const nav = document.getElementById('main-sidebar');
    const btn = document.getElementById('sn-collapse-btn');
    if (nav) nav.classList.add('collapsed');
    if (btn) btn.textContent = '▶';
  }
}

/* ══ 보드 프로필 패널 토글 ══ */
function toggleBoardPanel() {
  const panel   = document.getElementById('board-profile-panel');
  const openBtn = document.getElementById('bpp-open-btn');
  if (!panel) return;
  const hidden = panel.classList.toggle('hidden');
  openBtn?.classList.toggle('hidden', !hidden);
}

function toggleBppSection(name) {
  const list  = document.getElementById(`bpp-${name === 'my' ? 'my-posts' : name === 'reply' ? 'replied-posts' : 'liked-posts'}`);
  const arrow = document.getElementById(`bpp-arrow-${name}`);
  if (!list) return;
  const closed = list.classList.toggle('hidden');
  if (arrow) arrow.textContent = closed ? '▶' : '▼';
}

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
    if (st === 'boom')           { chip.textContent = '🟢 호황'; chip.className = 'market-chip boom'; }
    else if (st === 'recession') { chip.textContent = '🔴 침체'; chip.className = 'market-chip recession'; }
    else                          { chip.textContent = '🟡 정상'; chip.className = 'market-chip'; }
  }
}

/* [Feature 10] 섹터별 모아보기 토글 */
function toggleSectorGroupMode() {
  sectorGroupMode = !sectorGroupMode;
  const btn = document.getElementById('sector-group-toggle');
  if (btn) btn.textContent = sectorGroupMode ? '전체 목록' : '섹터별 모아보기';
  renderMarketList();
}

function renderMarketList() {
  const d       = getData();
  const myName  = getProfile()?.name || '나';

  let all = DEMO_MARKET.map(s => ({ ...s, isOwn: false }));
  Object.entries(d.mySectors).forEach(([sec, s]) => {
    all.push({ ...s, id: 'my_' + sec, uid: currentUserId, creatorName: myName, sector: s.sector || sec, isOwn: true });
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

  if (sectorGroupMode) {
    // 섹터별 그룹핑
    const grouped = {};
    all.forEach(s => {
      if (!grouped[s.sector]) grouped[s.sector] = [];
      grouped[s.sector].push(s);
    });
    listEl.innerHTML = Object.entries(grouped).map(([sector, stocks]) => `
      <div class="sector-group-header">${SECTOR_EMOJI[sector]||''} ${esc(sector)} (${stocks.length}개)</div>
      ${stocks.map(s => renderStockCardHtml(s)).join('')}
    `).join('');
  } else {
    listEl.innerHTML = all.map(s => renderStockCardHtml(s)).join('');
  }
}

function renderStockCardHtml(s) {
  const chg   = priceChgPct(s.priceHistory);
  const color = SECTOR_COLORS[s.sector] || '#6B7280';
  // [Feature 11] stockName 표시
  const displayName = s.stockName
    ? `${SECTOR_EMOJI[s.sector]||''} ${esc(s.stockName)}`
    : `${SECTOR_EMOJI[s.sector]||''} ${esc(s.sector)}주`;
  return `
    <div class="stock-card" onclick="openMarketDetail('${s.id}')">
      <div class="sc-left">
        <div class="sc-name">
          ${displayName}
          ${s.isOwn ? '<span class="sc-own-tag">내 발행</span>' : ''}
        </div>
        <div class="sc-meta">
          <span class="sc-creator" style="color:${color}">${esc(s.creatorName)}</span>
          <span class="sc-shares-cnt">· ${s.sharesIssued||0}주 발행</span>
        </div>
      </div>
      <div class="sc-right">
        <div class="sc-price" style="color:${priceColor(s.price)}">C${s.price.toFixed(0)}</div>
        <div class="sc-chg ${chg>=0?'red':'blue'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
      </div>
    </div>`;
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
  // filter-pill-premium 버튼은 active 처리하지 않음
  document.querySelectorAll('.filter-pill:not(.filter-pill-premium)').forEach(b => b.classList.remove('active'));
  document.querySelector(`.filter-pill[data-f="${val}"]`)?.classList.add('active');
  renderMarketList();
}

/* ── [Feature 5] 홈 오른쪽 패널 ── */
function renderHomeAside() {
  const d      = getData();

  // 보유 현황
  const sumEl = document.getElementById('aside-summary');
  if (sumEl) {
    const myCount   = Object.keys(d.mySectors).length;
    const holdCount = Object.keys(d.holdings).length;
    const holdVal   = Object.entries(d.holdings).reduce((a, [id, h]) => {
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
            <span class="aside-mover-chg ${m.chg>=0?'red':'blue'}">${m.chg>=0?'▲':'▼'}${Math.abs(m.chg).toFixed(1)}%</span>
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

  // [Feature 5] 핫 종목 / 핫 섹터
  renderHotSection();
  // [Feature 6] AI 추천 버튼
  renderAiRecommendSection();
}

function renderHotSection() {
  // 기존 핫 카드가 있으면 제거 후 재생성
  let hotCard = document.getElementById('aside-hot-card');
  if (!hotCard) {
    hotCard = document.createElement('div');
    hotCard.id = 'aside-hot-card';
    hotCard.className = 'aside-card';
    const asideEl = document.querySelector('.home-aside');
    if (asideEl) asideEl.appendChild(hotCard);
  }

  const d      = getData();
  const myName = getProfile()?.name || '나';
  let all = DEMO_MARKET.map(s => ({ ...s }));
  Object.entries(d.mySectors).forEach(([sec, s]) => {
    all.push({ ...s, id: 'my_' + sec, creatorName: myName, sector: s.sector || sec });
  });

  // 핫 종목 TOP 3
  const top3 = [...all].sort((a, b) => (b.sharesIssued||0) - (a.sharesIssued||0)).slice(0, 3);

  // 핫 섹터 TOP 1
  const sectorMap = {};
  all.forEach(s => {
    sectorMap[s.sector] = (sectorMap[s.sector] || 0) + (s.sharesIssued || 0);
  });
  const topSector = Object.entries(sectorMap).sort((a, b) => b[1] - a[1])[0];

  hotCard.innerHTML = `
    <div class="aside-ttl">🔥 지금 핫한 종목</div>
    ${top3.map((s, i) => `
      <div class="aside-mover" onclick="openMarketDetail('${s.id}')">
        <span class="aside-mover-name">${i+1}. ${esc(s.creatorName)}의 ${s.sector}주</span>
        <span class="aside-stat-val" style="font-size:11px">${s.sharesIssued||0}주</span>
      </div>`).join('')}
    <div class="aside-ttl" style="margin-top:10px">📈 핫한 섹터</div>
    ${topSector ? `<div class="aside-stat-row">
      <span class="aside-stat-lbl">${SECTOR_EMOJI[topSector[0]]||''} ${topSector[0]}</span>
      <span class="aside-stat-val">${topSector[1]}주 총 발행</span>
    </div>` : '<div class="aside-empty">—</div>'}`;
}

/* [Feature 6] AI 추천 버튼 */
function renderAiRecommendSection() {
  let aiCard = document.getElementById('aside-ai-card');
  if (!aiCard) {
    aiCard = document.createElement('div');
    aiCard.id = 'aside-ai-card';
    aiCard.className = 'aside-card';
    const asideEl = document.querySelector('.home-aside');
    if (asideEl) asideEl.appendChild(aiCard);
  }
  aiCard.innerHTML = `
    <div class="aside-ttl">🎯 AI 추천</div>
    <button class="btn-ghost-sm" style="width:100%;margin-top:4px" onclick="requestAiRecommend()">
      🎯 AI 추천 받기 <span class="premium-badge">PRO</span>
    </button>`;
}

function requestAiRecommend() {
  const d = getData();
  if (!isAdmin || !d.isPremium) { showPremiumModal(); return; }

  const btn = document.querySelector('#aside-ai-card .btn-ghost-sm');
  if (btn) { btn.disabled = true; btn.textContent = '분석 중...'; }

  setTimeout(() => {
    if (btn) { btn.disabled = false; btn.textContent = '🎯 AI 추천 받기'; }
    const top2 = [...DEMO_MARKET].sort((a, b) => (b.sharesIssued||0) - (a.sharesIssued||0)).slice(0, 2);
    showToast(`🎯 추천: ${top2.map(s => s.creatorName + '의 ' + s.sector + '주').join(', ')}`);
  }, 800);
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
    const realSec = s.sector || sec;
    const displayName = s.stockName ? esc(s.stockName) : `${SECTOR_EMOJI[realSec]||''} ${esc(realSec)}주`;
    return `
      <div class="stock-card ${urgentCls}" onclick="openMarketDetail('my_${sec}')">
        <div class="sc-left">
          <div class="sc-name">${displayName}</div>
          <div class="sc-meta">
            <span style="color:${SECTOR_COLORS[realSec]||'#6B7280'};font-size:11px">${s.sharesIssued||0}주 발행</span>
            <span class="sc-shares-cnt">· 최근 입력 ${s.lastInput||'—'}</span>
          </div>
        </div>
        <div class="sc-right">
          <div class="sc-price" style="color:${priceColor(s.price)}">C${s.price.toFixed(0)}</div>
          <div class="sc-chg ${chg>=0?'red':'blue'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
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

  // [Feature 11] stockName 표시
  const displayName = stock.stockName
    ? `${esc(stock.stockName)} <span style="font-size:14px;color:var(--sub)">(${esc(stock.creatorName)})</span>`
    : `${esc(stock.creatorName)}의 ${SECTOR_EMOJI[stock.sector]||''} ${esc(stock.sector)}주`;
  document.getElementById('d-name').innerHTML = displayName;
  document.getElementById('d-sector').textContent = stock.sector;
  document.getElementById('d-sector').style.color = SECTOR_COLORS[stock.sector] || '#6B7280';
  document.getElementById('d-price').textContent  = `C${stock.price.toFixed(1)}`;
  document.getElementById('d-price').style.color  = priceColor(stock.price);
  const chg   = priceChgPct(stock.priceHistory);
  const chgEl = document.getElementById('d-chg');
  chgEl.textContent = (chg >= 0 ? '▲ +' : '▼ ') + chg.toFixed(1) + '%';
  chgEl.className   = 'd-chg ' + (chg >= 0 ? 'red' : 'blue');

  // 발행 정보
  const siEl = document.getElementById('d-shares-issued');
  if (siEl) siEl.textContent = stock.sharesIssued || 0;
  const liEl = document.getElementById('d-last-input');
  if (liEl) liEl.textContent = stock.lastInput || '—';
  const lbEl = document.getElementById('d-last-bought');
  if (lbEl) lbEl.textContent = stock.lastBought || '없음';

  // [Feature 14] 판매자 프로필 카드
  const sellerCard = document.getElementById('seller-profile-card');
  const ratingPanel = document.getElementById('rating-panel');
  if (!isOwn && sellerCard) {
    sellerCard.classList.remove('hidden');
    document.getElementById('sp-avatar').textContent = (stock.creatorName || '?')[0].toUpperCase();
    document.getElementById('sp-name').textContent   = stock.creatorName || '—';
    document.getElementById('sp-sector').textContent = stock.sector || '—';
    document.getElementById('sp-issued').textContent = `${stock.sharesIssued||0}주 발행`;
    const d = getData();
    const ratings = d.ratings || {};
    const myRating = ratings[stockId];
    const baseRating = stock.rating || 4.0;
    const displayRating = myRating ? ((baseRating + myRating) / 2).toFixed(1) : baseRating.toFixed(1);
    document.getElementById('sp-rating').textContent = `★ ${displayRating}`;
    if (ratingPanel) ratingPanel.classList.add('hidden');
    // 팔로우 버튼 (자기 자신 제외, 모두에게 표시)
    const followBtn = document.getElementById('btn-follow-bell');
    const uid = stockId.replace(/^my_/, '');
    if (followBtn && uid !== currentUserId) {
      followBtn.classList.remove('hidden');
      renderFollowBtn(uid);
    } else if (followBtn) {
      followBtn.classList.add('hidden');
    }
  } else if (sellerCard) {
    sellerCard.classList.add('hidden');
    if (ratingPanel) ratingPanel.classList.add('hidden');
    document.getElementById('btn-follow-bell')?.classList.add('hidden');
  }

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

/* [Feature 14] 평가 패널 */
function openRatingPanel() {
  const panel = document.getElementById('rating-panel');
  if (panel) panel.classList.toggle('hidden');
}

function submitRating(stars) {
  const d = getData();
  d.ratings = d.ratings || {};
  d.ratings[currentDetailId] = stars;
  saveData(d);
  document.getElementById('rating-panel').classList.add('hidden');
  showToast(`⭐ ${stars}점 평가 완료!`);
  // 평점 업데이트
  const stock = getMarketStock(currentDetailId);
  if (stock) {
    const baseRating = stock.rating || 4.0;
    const displayRating = ((baseRating + stars) / 2).toFixed(1);
    const ratingEl = document.getElementById('sp-rating');
    if (ratingEl) ratingEl.textContent = `★ ${displayRating}`;
  }
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

  priceChartInstance = new Chart(canvas, {
    type: 'line',
    data: { labels: values.map((_, i) => i), datasets: [{ data: values, borderColor: color,
        backgroundColor: color + '22', fill: true, tension: 0.3, pointRadius: 0, borderWidth: 2 }] },
    options: {
      responsive: true, maintainAspectRatio: false,
      animation: { duration: 200 },
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: { display: false }, y: { display: false } }
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

function contactGroup() {
  document.getElementById('premium-modal').classList.add('hidden');
  showToast('📧 noseohyeon079@gmail.com 으로 문의해 주세요!');
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

  // [Feature 1] 수익률 계산
  let holdCurrentVal = 0;
  let holdTotalCost  = 0;
  Object.entries(d.holdings).forEach(([id, h]) => {
    const m = getMarketStock(id);
    if (m) {
      holdCurrentVal += m.price * h.sharesOwned;
      holdTotalCost  += h.totalCost || 0;
    }
  });
  const myVal   = Object.values(d.mySectors).reduce((a, s) => a + s.price, 0);
  const balance = d.balance || 0;

  const set = (id, txt) => { const el = document.getElementById(id); if (el) el.textContent = txt; };
  set('port-balance',      `C${Math.round(balance)}`);
  set('port-holdings-val', `C${Math.round(holdCurrentVal)}`);
  set('port-my-val',       `C${Math.round(myVal)}`);
  set('port-total-val',    `C${Math.round(balance + holdCurrentVal + myVal)}`);

  // [Feature 1] 수익률 표시
  const roiEl = document.getElementById('port-roi-val');
  if (roiEl) {
    if (holdTotalCost > 0) {
      const roi = (holdCurrentVal - holdTotalCost) / holdTotalCost * 100;
      roiEl.textContent = (roi >= 0 ? '+' : '') + roi.toFixed(1) + '%';
      roiEl.style.color = roi >= 0 ? 'var(--red)' : 'var(--blue)';
    } else {
      roiEl.textContent = '—%';
      roiEl.style.color = '';
    }
  }

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

        // [Feature 4] 매입가 vs 현재가
        const avgCost  = h.sharesOwned > 0 ? (h.totalCost || 0) / h.sharesOwned : 0;
        const diff     = curP - avgCost;
        const diffStr  = (diff >= 0 ? '+' : '') + diff.toFixed(1);
        const diffColor = diff >= 0 ? 'var(--red)' : 'var(--blue)';
        const pnlPctStr = (pnlPct >= 0 ? '+' : '') + pnlPct.toFixed(1);

        const blockId = `pkn-${id.replace(/[^a-z0-9]/gi,'_')}`;
        const entriesHtml = entries.length ? entries.map((e, i) => {
          const srcEntry  = (m?.shares || [])[e.idx] || {};
          const hasAttach = !!(srcEntry.attachment);
          const attachBtn = hasAttach
            ? `<button class="port-kn-attach-btn" onclick="event.stopPropagation();openPortfolioAttachment('${id}',${i})">📎 ${esc(srcEntry.attachment.name)}</button>`
            : '';
          const ttl = e.title || srcEntry.title || '(제목 없음)';
          // [Feature 7] AI 요약 버튼
          const aiSumBtn = `<button class="btn-ai-summary" onclick="event.stopPropagation();aiSummarize('${id}',${i},'${blockId}_e${i}_summary')">✨ AI 요약</button>`;
          return `
            <div class="port-kn-item" id="${blockId}_e${i}">
              <div class="port-kn-title-row" onclick="togglePortKnEntry('${blockId}_e${i}')">
                <span class="port-kn-tri">▶</span>
                <span class="port-kn-item-title">${esc(ttl)}</span>
                <span class="port-kn-item-date">${e.date}</span>
              </div>
              <div class="port-kn-content hidden">
                <div class="port-kn-text">${esc(e.text)}</div>
                <div class="port-kn-foot">
                  ${attachBtn ? attachBtn : ''}
                  ${aiSumBtn}
                </div>
                <div class="ai-summary-result hidden" id="${blockId}_e${i}_summary"></div>
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
                <div class="sc-meta" style="margin-top:2px;color:${diffColor}">
                  매입평균 C${avgCost.toFixed(1)} → 현재 C${curP.toFixed(1)}&nbsp;
                  <strong>${diffStr}C (${pnlPctStr}%)</strong>
                </div>
              </div>
              <div class="sc-right">
                <div class="sc-price" style="color:${priceColor(curP)}">C${curP.toFixed(0)}</div>
                <div class="sc-chg ${pnl>=0?'red':'blue'}">${pnl>=0?'▲':'▼'}${Math.abs(pnlPct).toFixed(1)}%</div>
                <button class="btn-sell-holding" onclick="event.stopPropagation();sellHolding('${id}')">매도</button>
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
  const issuedEl  = document.getElementById('my-issued-list');
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
              <div class="sc-chg ${chg>=0?'red':'blue'}">${chg>=0?'▲':'▼'}${Math.abs(chg).toFixed(1)}%</div>
            </div>
          </div>`;
      }).join('');
    }
  }
}

/* [Feature 12] 매도 기능 */
function sellHolding(stockId) {
  const d = getData();
  const h = d.holdings[stockId];
  if (!h) return;
  const m = getMarketStock(stockId);
  const curP = m ? m.price : 0;
  const proceeds = curP * h.sharesOwned;
  d.balance = (d.balance || 0) + proceeds;
  delete d.holdings[stockId];
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type: 'sell', stockId });
  saveData(d);
  showToast(`💰 ${h.sector}주 전체 매도 완료! +C${Math.round(proceeds)}`);
  updateBalanceDisplay();
  renderPortfolio();
}

/* [Feature 7] AI 요약 */
function aiSummarize(stockId, entryIdx, summaryElId) {
  const d = getData();
  if (!isAdmin || !d.isPremium) { showPremiumModal(); return; }

  const h = d.holdings[stockId];
  if (!h) return;
  const m = getMarketStock(stockId);
  const entry = (h.boughtEntries || [])[entryIdx];
  if (!entry) return;
  const srcEntry = (m?.shares || [])[entry.idx] || {};
  const text = entry.text || srcEntry.text || '';

  const summaryEl = document.getElementById(summaryElId);
  if (!summaryEl) return;

  // 시뮬레이션: 앞 50자 + "..."
  const summary = text.slice(0, 50) + (text.length > 50 ? '...' : '');
  summaryEl.innerHTML = `<div class="ai-summary-box">✨ <strong>핵심:</strong> ${esc(summary)}</div>`;
  summaryEl.classList.remove('hidden');
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

/* ══ [Feature 13] 보유 지식 리포트 ══ */
function openReportModal() {
  const d = getData();
  const holdings = Object.entries(d.holdings);
  if (!holdings.length) {
    showToast('매입한 지식이 없습니다');
    return;
  }

  // 섹터별 정리
  const bySector = {};
  holdings.forEach(([id, h]) => {
    const sec = h.sector || '기타';
    if (!bySector[sec]) bySector[sec] = [];
    const m = getMarketStock(id);
    (h.boughtEntries || []).forEach((e, i) => {
      const srcEntry = (m?.shares || [])[e.idx] || {};
      bySector[sec].push({
        stockId: id,
        creator: h.creatorName,
        title:   e.title || srcEntry.title || '(제목 없음)',
        text:    e.text  || srcEntry.text  || '',
        date:    e.date,
        entryIdx: i,
      });
    });
  });

  _reportText = Object.entries(bySector).map(([sec, items]) => {
    return `[${sec}]\n` + items.map(it => `  - ${it.title} (${it.creator}, ${it.date})\n    ${it.text}`).join('\n');
  }).join('\n\n');

  const contentEl = document.getElementById('report-content');
  if (contentEl) {
    contentEl.innerHTML = Object.entries(bySector).map(([sec, items]) => `
      <div class="report-sector-block">
        <div class="report-sector-title">${SECTOR_EMOJI[sec]||''} ${esc(sec)}</div>
        ${items.map(it => `
          <div class="report-item">
            <div class="report-item-title">${esc(it.title)}</div>
            <div class="report-item-meta">${esc(it.creator)} · ${it.date}</div>
            <div class="report-item-text" id="ri_${it.stockId}_${it.entryIdx}">${esc(it.text)}</div>
          </div>`).join('')}
      </div>`).join('');
  }

  document.getElementById('report-modal').classList.remove('hidden');
}

function closeReportModal(e) {
  if (e && e.target !== document.getElementById('report-modal')) return;
  document.getElementById('report-modal').classList.add('hidden');
}

function copyReport() {
  if (!_reportText) return;
  navigator.clipboard.writeText(_reportText).then(() => {
    showToast('📋 리포트가 클립보드에 복사됐습니다');
  }).catch(() => {
    showToast('복사 실패 — 브라우저 권한을 확인하세요');
  });
}

function aiEnhanceReport() {
  const d = getData();
  if (!isAdmin || !d.isPremium) { showPremiumModal(); return; }

  const contentEl = document.getElementById('report-content');
  if (!contentEl) return;
  // 각 report-item-text에 "핵심:" 접두사 붙여 요약
  contentEl.querySelectorAll('.report-item-text').forEach(el => {
    const txt     = el.textContent || '';
    const summary = txt.slice(0, 50) + (txt.length > 50 ? '...' : '');
    el.innerHTML  = `<span style="color:var(--accent);font-weight:700">핵심:</span> ${esc(summary)}`;
  });
  showToast('✨ AI 도움 완료! 핵심 요약이 적용됐습니다');
}

/* ══ [Feature 8] 학교급별 ══ */
function setSchoolLevel(level) {
  currentSchoolLevel = level;
  document.querySelectorAll('.sl-tab').forEach(b => b.classList.toggle('active', b.dataset.level === level));
  renderSchoolLevel();
}

function renderSchoolLevel() {
  const d      = getData();
  const myName = getProfile()?.name || '나';

  const allowedSectors = SCHOOL_LEVELS[currentSchoolLevel] || [];
  let all = DEMO_MARKET.map(s => ({ ...s, isOwn: false }));
  Object.entries(d.mySectors).forEach(([sec, s]) => {
    all.push({ ...s, id: 'my_' + sec, creatorName: myName, sector: sec, isOwn: true });
  });

  const filtered = all.filter(s => allowedSectors.includes(s.sector));

  const listEl = document.getElementById('school-level-list');
  if (!listEl) return;

  if (!filtered.length) {
    listEl.innerHTML = '<div class="port-empty-msg">해당 학교급 종목이 없습니다</div>';
    return;
  }

  listEl.innerHTML = filtered.map(s => renderStockCardHtml(s)).join('');
}

/* ══ [Feature — 프리미엄 테스트 토글] ══ */
function togglePremiumTest() {
  const d = getData();
  d.isPremium = !d.isPremium;
  saveData(d);
  updatePremiumUI();
  showToast(d.isPremium ? '✨ 프리미엄 모드 활성화!' : '프리미엄 모드 비활성화');
}

function updatePremiumUI() {
  const d = getData();
  const isPremium = isAdmin && (d.isPremium || false);

  // 토글 버튼 상태 (관리자만 표시)
  const adminPremSection = document.getElementById('admin-premium-section');
  const adminStatsSection = document.getElementById('admin-stats-section');
  if (adminPremSection)  adminPremSection.classList.toggle('hidden', !isAdmin);
  if (adminStatsSection) adminStatsSection.classList.toggle('hidden', !isAdmin);

  const toggleBtn   = document.getElementById('premium-toggle-btn');
  const toggleLabel = document.getElementById('premium-toggle-label');
  if (toggleBtn)   { toggleBtn.textContent = isPremium ? 'ON' : 'OFF'; toggleBtn.className = isPremium ? 'toggle-btn on' : 'toggle-btn'; }
  if (toggleLabel) toggleLabel.textContent = isPremium ? '프리미엄 활성' : '프리미엄 비활성';

  // 학교급별 버튼 표시/숨김
  const schoolBtn = document.getElementById('nav-school-level');
  if (schoolBtn) schoolBtn.classList.toggle('hidden', !isPremium);

  // 잠긴 섹터 버튼 업데이트
  const PREMIUM_EMOJI = { '철학':'🧠','의학':'🩺','경제':'💹','법학':'⚖️','물리':'⚛️','화학':'🧪','언어':'🗣️' };
  document.querySelectorAll('.wf-sec-btn[data-s]').forEach(btn => {
    const sec = btn.dataset.s;
    if (!sec) return;
    const isLocked = ['철학','의학','경제','법학','물리','화학','언어'].includes(sec);
    if (!isLocked) return;
    if (isPremium) {
      btn.classList.remove('wf-sec-locked');
      btn.textContent = `${PREMIUM_EMOJI[sec]||''} ${sec}`;
      btn.onclick = function() { pickWfSector(this); };
    } else {
      btn.classList.add('wf-sec-locked');
      btn.textContent = `🔒 ${sec}`;
      btn.onclick = function() { pickWfSectorOrPremium(this); };
    }
  });

  // 프리미엄 잠금 힌트 표시/숨김
  document.querySelectorAll('.wf-premium-unlock-hint').forEach(el => {
    el.classList.toggle('hidden', isPremium);
  });

  // "숨겨진 과목" 필터 버튼 — 프리미엄이면 숨김
  const hiddenSectorBtn = document.querySelector('.filter-pill-premium');
  if (hiddenSectorBtn) hiddenSectorBtn.classList.toggle('hidden', isPremium);

  // AI 추천 PRO 뱃지 숨김
  document.querySelectorAll('.premium-badge').forEach(el => {
    el.classList.toggle('hidden', isPremium);
  });

  // 홈 AI 추천 카드 표시/숨김
  const aiCard = document.getElementById('aside-ai-card');
  if (aiCard) aiCard.classList.toggle('hidden', !isPremium);

  // 유저 현황 렌더
  if (isAdmin) renderUserStats();
}

function pickWfSectorOrPremium(btn) {
  const d = getData();
  if (!isAdmin || !d.isPremium) { showPremiumModal(); return; }
  pickWfSector(btn);
}

function renderUserStats() {
  const el = document.getElementById('admin-user-stats');
  if (!el) return;
  const d = getData();
  const holdings = Object.values(d.holdings || {});
  const sectors  = Object.entries(d.mySectors || {});
  const totalBought = holdings.reduce((a, h) => a + h.sharesOwned, 0);
  const totalKnowledge = sectors.reduce((a, [, s]) => a + (s.shares?.length || 0), 0);
  const holdVal = holdings.reduce((a, h) => {
    const m = getMarketStock(h.stockId);
    return a + (m ? m.price * h.sharesOwned : 0);
  }, 0);
  const myVal = sectors.reduce((a, [, s]) => a + s.price, 0);
  const recentLogs = (d.activityLog || []).slice(-5).reverse();

  el.innerHTML = `
    <div class="admin-stats-grid">
      <div class="admin-stat"><span class="admin-stat-lbl">섹터 수</span><span class="admin-stat-val">${sectors.length}</span></div>
      <div class="admin-stat"><span class="admin-stat-lbl">지식 항목</span><span class="admin-stat-val">${totalKnowledge}</span></div>
      <div class="admin-stat"><span class="admin-stat-lbl">총 매수</span><span class="admin-stat-val">${totalBought}주</span></div>
      <div class="admin-stat"><span class="admin-stat-lbl">잔액</span><span class="admin-stat-val">C${Math.round(d.balance||0)}</span></div>
      <div class="admin-stat"><span class="admin-stat-lbl">매입평가</span><span class="admin-stat-val">C${Math.round(holdVal)}</span></div>
      <div class="admin-stat"><span class="admin-stat-lbl">발행주가</span><span class="admin-stat-val">C${Math.round(myVal)}</span></div>
    </div>
    <div class="admin-stat-lbl" style="margin:10px 0 6px">최근 활동</div>
    ${recentLogs.length ? recentLogs.map(l => {
      const time = new Date(l.ts).toLocaleString('ko-KR',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'});
      const typeLabel = l.type==='buy'?'📈 매수':l.type==='write'?'✏️ 입력':'🔄 기타';
      return `<div class="admin-log-row"><span class="admin-log-type">${typeLabel}</span><span class="admin-log-time">${time}</span></div>`;
    }).join('') : '<div style="font-size:12px;color:var(--sub)">활동 없음</div>'}
  `;
}

/* ══ 설정 ══ */
function togglePwSection() {
  const sec   = document.getElementById('ss-pw-section');
  const arrow = document.getElementById('ss-pw-arrow');
  if (!sec) return;
  const open = sec.classList.toggle('hidden');
  if (arrow) arrow.textContent = open ? '▶' : '▼';
}

function renderSettings() {
  const nameEl  = document.getElementById('ss-real-name');
  const nickEl  = document.getElementById('ss-nickname');
  const curPwEl = document.getElementById('ss-cur-password');
  const newPwEl = document.getElementById('ss-new-password');

  if (isAdmin) {
    if (nameEl)  nameEl.textContent = '노서현';
    if (nickEl)  { nickEl.value = '노서현'; nickEl.disabled = true; }
    if (curPwEl) curPwEl.disabled = true;
    if (newPwEl) newPwEl.disabled = true;
  } else {
    const profile = getProfile();
    if (nameEl)  nameEl.textContent = profile?.name || '—';
    if (nickEl)  { nickEl.value = profile?.nickname || currentUserId || ''; nickEl.disabled = false; }
    if (curPwEl) { curPwEl.value = ''; curPwEl.disabled = false; }
    if (newPwEl) { newPwEl.value = ''; newPwEl.disabled = false; }
  }
  renderHeatmap();
  updatePremiumUI();
}

function changePassword() {
  if (isAdmin) { showToast('❌ 관리자 계정은 비밀번호를 변경할 수 없습니다'); return; }
  const users  = LS.get('kse2_users') || [];
  const curPw  = document.getElementById('ss-cur-password').value;
  const newPw  = document.getElementById('ss-new-password').value;
  if (!curPw) { shake('ss-cur-password'); showToast('❌ 현재 비밀번호를 입력해주세요'); return; }
  if (!newPw) { shake('ss-new-password'); showToast('❌ 새 비밀번호를 입력해주세요'); return; }
  const me = users.find(u => u.nickname === currentUserId);
  if (!me || me.password !== curPw) { shake('ss-cur-password'); showToast('❌ 현재 비밀번호가 틀렸습니다'); return; }
  me.password = newPw;
  LS.set('kse2_users', users);
  document.getElementById('ss-cur-password').value = '';
  document.getElementById('ss-new-password').value = '';
  showToast('✅ 비밀번호가 변경되었습니다');
}

function saveProfile() {
  const nickname = document.getElementById('ss-nickname').value.trim();
  if (!nickname) { shake('ss-nickname'); return; }

  const users = LS.get('kse2_users') || [];
  const profile = getProfile() || {};

  // 닉네임 중복 체크 (본인 제외)
  if (users.find(u => u.nickname === nickname && u.nickname !== currentUserId)) {
    showToast('❌ 이미 사용 중인 닉네임입니다'); return;
  }

  // 닉네임 변경
  const oldId = currentUserId;
  const me = users.find(u => u.nickname === oldId);
  if (me && !isAdmin) me.nickname = nickname;
  LS.set('kse2_users', users);

  if (!isAdmin) {
    currentUserId = nickname;
    LS.set('kse2_session', { userId: nickname, name: profile.name });
  }
  profile.nickname = nickname;
  saveProfileData(profile);

  const displayName = isAdmin ? '노서현' : nickname;
  document.getElementById('sidebar-user-name').textContent   = isAdmin ? '노서현 👑' : displayName;
  document.getElementById('sidebar-user-avatar').textContent = displayName[0].toUpperCase();
  showToast('✅ 저장되었습니다');
}

function deleteAccount() {
  if (isAdmin) { showToast('❌ 관리자 계정은 탈퇴할 수 없습니다'); return; }
  if (!confirm('정말 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.')) return;
  const users = (LS.get('kse2_users') || []).filter(u => u.nickname !== currentUserId);
  LS.set('kse2_users', users);
  localStorage.removeItem(dataKey());
  localStorage.removeItem(profileKey());
  localStorage.removeItem('kse2_session');
  currentUserId = null;
  isAdmin = false;
  showOverlay('login');
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
  launchApp();
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
