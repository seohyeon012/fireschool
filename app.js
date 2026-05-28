'use strict';

/* ══════════════════════════════
   지식 증권거래소  ·  app.js
   ══════════════════════════════ */

/* ── 상수 ── */
const DECAY_NORMAL    = 0.045;   // 일 기본 하락률 4.5%
const DECAY_BOOM      = 0.025;   // 호황 시 2.5%
const DECAY_RECESSION = 0.07;    // 침체 시 7%
const DIVIDEND_THRESHOLD = 70;   // 배당 기준 주가
const ETF_COST        = 10;      // ETF 생성 코인
const ETF_BONUS       = 3;       // ETF 연결 종목 복습 보너스
const REVIEW_BOOST    = 35;      // 복습 주가 상승폭

const SECTOR_COLORS = {
  '수학':'#3B82F6','영어':'#10B981','과학':'#8B5CF6',
  '역사':'#F59E0B','국어':'#EC4899','프로그래밍':'#06B6D4','기타':'#6B7280'
};

/* ── 상태 ── */
let currentScreen = 'home';
let prevScreen    = null;
let currentStockId= null;
let sellTargetId  = null;
let selSector     = '수학';
let etfChosenIds  = [];

/* ── LocalStorage helpers ── */
const LS = {
  get: k  => JSON.parse(localStorage.getItem(k) || 'null'),
  set: (k,v) => localStorage.setItem(k, JSON.stringify(v)),
};

function getData() {
  return LS.get('kse_data') || {
    stocks: [],
    etfs: [],
    coins: 0,
    marketStatus: 'normal',       // normal | boom | recession
    marketExpiry: null,
    lastEarning: null,            // YYYY-MM
    earningHistory: [],
    activityLog: [],              // { date, type, stockId }
  };
}
function saveData(d) { LS.set('kse_data', d); }

/* ── 초기화 ── */
document.addEventListener('DOMContentLoaded', () => {
  applyDecay();
  checkEarningSeason();
  renderHome();
  updateTicker();
  setInterval(updateTicker, 30000);
});

/* ── 화면 이동 ── */
function navigateTo(name) {
  prevScreen = currentScreen;
  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  document.getElementById(`nav-${name}`)?.classList.add('active');
  if (name === 'home')      renderHome();
  if (name === 'portfolio') renderPortfolio();
  if (name === 'ipo')       resetIpoForm();
}

function goBack() {
  navigateTo(prevScreen || 'home');
}

/* ══ 주가 하락 (시간 기반) ══ */
function applyDecay() {
  const d = getData();
  const now = Date.now();
  const status = d.marketStatus;

  let changed = false;
  d.stocks.forEach(s => {
    const lastUpdate = s.lastUpdate || now;
    const daysPassed = (now - lastUpdate) / (1000 * 60 * 60 * 24);
    if (daysPassed < 0.01) return; // 15분 미만 무시
    const rate = status === 'boom' ? DECAY_BOOM : status === 'recession' ? DECAY_RECESSION : DECAY_NORMAL;
    const newPrice = Math.max(1, s.price * Math.pow(1 - rate, daysPassed));
    s.priceHistory = s.priceHistory || [];
    // 하루에 한 번만 히스토리 기록
    const todayKey = new Date().toISOString().slice(0, 10);
    if (s.lastHistoryDate !== todayKey) {
      s.priceHistory.push(Math.round(newPrice));
      if (s.priceHistory.length > 7) s.priceHistory.shift();
      s.lastHistoryDate = todayKey;
    }
    s.price = Math.round(newPrice * 10) / 10;
    s.lastUpdate = now;
    changed = true;
  });

  // 시장 호황/침체 만료 체크
  if (d.marketExpiry && now > d.marketExpiry) {
    d.marketStatus = 'normal';
    d.marketExpiry = null;
    changed = true;
  }

  if (changed) saveData(d);
}

/* ══ 어닝 시즌 체크 ══ */
function checkEarningSeason() {
  const d = getData();
  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  if (d.lastEarning === monthKey) return;

  // 첫 실행은 스킵
  if (!d.lastEarning || d.stocks.length === 0) {
    d.lastEarning = monthKey;
    saveData(d);
    return;
  }

  generateEarningReport(d, monthKey);
}

function generateEarningReport(d, monthKey) {
  const stocks = d.stocks;
  if (stocks.length === 0) return;

  // 점수 계산: 평균 주가 기반
  const avgPrice  = stocks.reduce((a,s) => a+s.price, 0) / stocks.length;
  const score     = Math.round(avgPrice * 10);
  const topGainer = [...stocks].sort((a,b) => b.price - a.price)[0];
  const topLoser  = [...stocks].sort((a,b) => a.price - b.price)[0];

  // 시장 상태 결정
  let newStatus, announce;
  if (avgPrice >= 70) {
    newStatus = 'boom';
    announce  = '🟢 시장 호황 발령!\n다음 달 전 종목 하락 속도가 느려집니다.';
  } else if (avgPrice <= 40) {
    newStatus = 'recession';
    announce  = '🔴 시장 침체 경고!\n복습을 더 자주 해야 합니다.';
  } else {
    newStatus = 'normal';
    announce  = '🟡 시장 안정 유지.\n꾸준히 복습을 이어가세요!';
  }

  const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
  d.marketStatus = newStatus;
  d.marketExpiry = expiry;

  // 배당 지급
  let dividend = 0;
  stocks.forEach(s => {
    if (s.price >= DIVIDEND_THRESHOLD) {
      const d_amt = Math.round(s.price / 10);
      dividend += d_amt;
    }
  });
  d.coins = (d.coins || 0) + dividend;
  d.lastEarning = monthKey;
  d.earningHistory = d.earningHistory || [];
  d.earningHistory.push({ month: monthKey, score, avgPrice: Math.round(avgPrice), dividend });

  saveData(d);

  // 리포트 팝업 표시
  const months = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  const mNum   = parseInt(monthKey.split('-')[1]) - 1;
  document.getElementById('earning-month').textContent = `${months[mNum]} 성과 리포트`;
  document.getElementById('earning-score').textContent = score.toLocaleString();
  document.getElementById('earning-rows').innerHTML = `
    <div class="earning-row"><span class="er-label">평균 주가</span><span class="er-val">₩${Math.round(avgPrice)}</span></div>
    <div class="earning-row"><span class="er-label">최고 종목</span><span class="er-val green">▲ ${topGainer?.name || '-'}</span></div>
    <div class="earning-row"><span class="er-label">최저 종목</span><span class="er-val red">▼ ${topLoser?.name || '-'}</span></div>
    <div class="earning-row"><span class="er-label">배당 수령</span><span class="er-val yellow">🪙 +${dividend}</span></div>
  `;
  document.getElementById('market-announce').textContent = announce;
  document.getElementById('earning-popup').classList.remove('hidden');
}

function closeEarning() {
  document.getElementById('earning-popup').classList.add('hidden');
  applyDecay();
  renderHome();
  updateTicker();
}

/* ══ 홈 화면 ══ */
function renderHome() {
  const d = getData();
  const stocks = d.stocks;

  // KOSPI 지수
  const totalVal = stocks.reduce((a, s) => a + s.price, 0);
  const avg = stocks.length ? (totalVal / stocks.length).toFixed(1) : 0;
  document.getElementById('kospi-val').textContent = (totalVal).toFixed(1);
  document.getElementById('coin-val').textContent  = d.coins || 0;

  // KOSPI 변화 (어제와 비교 — 간단히 마지막 히스토리)
  if (stocks.length > 0) {
    const prevTotal = stocks.reduce((a,s) => {
      const h = s.priceHistory || [];
      return a + (h.length > 1 ? h[h.length-2] : s.price);
    }, 0);
    const chg = totalVal - prevTotal;
    const chgEl = document.getElementById('kospi-chg');
    chgEl.textContent = (chg >= 0 ? '▲' : '▼') + ' ' + Math.abs(chg).toFixed(1);
    chgEl.className   = 'kospi-chg ' + (chg >= 0 ? 'green' : 'red');
  }

  // 시장 상태 칩
  const chip = document.getElementById('market-chip');
  if (d.marketStatus === 'boom') {
    chip.textContent = '🟢 시장 호황'; chip.className = 'market-chip boom';
  } else if (d.marketStatus === 'recession') {
    chip.textContent = '🔴 시장 침체'; chip.className = 'market-chip recession';
  } else {
    chip.textContent = '🟡 정상'; chip.className = 'market-chip';
  }

  // 복습 필요 종목
  const urgent = stocks.filter(s => s.price < 50).sort((a,b) => a.price - b.price);
  const urgentWrap = document.getElementById('urgent-wrap');
  if (urgent.length > 0) {
    urgentWrap.innerHTML = `
      <div class="urgent-card">
        <div class="urgent-title">⚠️ 복습 필요 — 주가 위험 구간</div>
        ${urgent.slice(0,3).map(s => `
          <div class="urgent-item" onclick="openDetail(${s.id})">
            <span class="ui-name">${esc(s.name)}</span>
            <div class="ui-bar-wrap"><div class="ui-bar" style="width:${s.price}%"></div></div>
            <span class="ui-price">₩${s.price.toFixed(0)}</span>
          </div>
        `).join('')}
      </div>`;
  } else {
    urgentWrap.innerHTML = '';
  }

  // 전체 종목
  const listEl  = document.getElementById('stock-list');
  const emptyEl = document.getElementById('empty-home');
  document.getElementById('stock-cnt').textContent = stocks.length + '개';

  if (stocks.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');

  const sorted = [...stocks].sort((a,b) => b.price - a.price);
  listEl.innerHTML = sorted.map(s => {
    const chg  = getPriceChange(s);
    const etf  = findEtfForStock(s.id, d);
    const spark = drawSparkline(s.priceHistory || [s.price]);
    return `
      <div class="stock-card" onclick="openDetail(${s.id})">
        <div class="sc-left">
          <div class="sc-name">${esc(s.name)}${etf ? `<span class="sc-etf-tag">ETF</span>` : ''}</div>
          <div class="sc-sector" style="color:${SECTOR_COLORS[s.sector]||'#6B7280'}">${esc(s.sector)}</div>
        </div>
        <svg class="sc-spark" viewBox="0 0 60 28">${spark}</svg>
        <div class="sc-right">
          <div class="sc-price" style="color:${priceColor(s.price)}">₩${s.price.toFixed(0)}</div>
          <div class="sc-chg ${chg >= 0 ? 'green' : 'red'}">${chg >= 0 ? '▲' : '▼'}${Math.abs(chg).toFixed(1)}%</div>
        </div>
      </div>`;
  }).join('');
}

function getPriceChange(s) {
  const h = s.priceHistory || [];
  if (h.length < 2) return 0;
  const prev = h[h.length - 2];
  return prev ? ((s.price - prev) / prev * 100) : 0;
}

function priceColor(p) {
  if (p >= 70) return 'var(--green)';
  if (p >= 40) return 'var(--yellow)';
  return 'var(--red)';
}

function findEtfForStock(stockId, d) {
  return (d.etfs || []).find(e => e.stockIds.includes(stockId));
}

/* ── 스파크라인 SVG ── */
function drawSparkline(history) {
  if (!history || history.length < 2) {
    return `<line x1="0" y1="14" x2="60" y2="14" stroke="var(--border)" stroke-width="1.5"/>`;
  }
  const min = Math.min(...history);
  const max = Math.max(...history, min + 1);
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * 56 + 2;
    const y = 26 - ((v - min) / (max - min)) * 22;
    return `${x},${y}`;
  });
  const last  = history[history.length - 1];
  const first = history[0];
  const color = last >= first ? 'var(--green)' : 'var(--red)';
  return `<polyline points="${pts.join(' ')}" fill="none" stroke="${color}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/>`;
}

/* ── 티커 테이프 ── */
function updateTicker() {
  const d = getData();
  if (d.stocks.length === 0) {
    document.getElementById('ticker-inner').textContent = '📊 지식 증권거래소에 오신 것을 환영합니다  |  IPO로 첫 종목을 상장해보세요!';
    return;
  }
  const items = d.stocks.map(s => {
    const chg = getPriceChange(s);
    const arrow = chg >= 0 ? '▲' : '▼';
    return `${s.name}  ${arrow}₩${s.price.toFixed(0)} (${chg >= 0?'+':''}${chg.toFixed(1)}%)`;
  });
  const text = items.join('     |     ');
  document.getElementById('ticker-inner').textContent = text + '     |     ' + text;
}

/* ══ 종목 상세 ══ */
function openDetail(id) {
  currentStockId = id;
  const d = getData();
  const s = d.stocks.find(x => x.id === id);
  if (!s) return;

  prevScreen = currentScreen;
  currentScreen = 'detail';
  document.querySelectorAll('.screen').forEach(x => x.classList.remove('active'));
  document.getElementById('screen-detail').classList.add('active');
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

  const chg    = getPriceChange(s);
  document.getElementById('d-name').textContent   = s.name;
  document.getElementById('d-sector').textContent = s.sector;
  document.getElementById('d-sector').style.color = SECTOR_COLORS[s.sector] || '#6B7280';
  document.getElementById('d-price').textContent  = `₩${s.price.toFixed(1)}`;
  document.getElementById('d-price').style.color  = priceColor(s.price);

  const chgEl = document.getElementById('d-chg');
  chgEl.textContent = (chg >= 0 ? '▲ +' : '▼ ') + chg.toFixed(1) + '%';
  chgEl.className   = 'd-chg ' + (chg >= 0 ? 'green' : 'red');

  document.getElementById('d-content').textContent = s.content;
  document.getElementById('d-added').textContent   = s.addedDate || '—';
  document.getElementById('d-review').textContent  = s.lastReview || '아직 복습 없음';

  // ETF 연결 뱃지
  const etf = findEtfForStock(id, d);
  const badgeEl = document.getElementById('etf-link-badge');
  if (etf) {
    document.getElementById('etf-link-name').textContent = etf.name;
    badgeEl.classList.remove('hidden');
  } else {
    badgeEl.classList.add('hidden');
  }

  // 차트
  drawDetailChart(s.priceHistory || [s.price]);

  // 리뷰 입력 숨김
  document.getElementById('review-wrap').classList.add('hidden');
  document.getElementById('review-text').value = '';
}

function drawDetailChart(history) {
  const svg = document.getElementById('price-chart');
  if (!svg) return;
  if (history.length < 2) {
    svg.innerHTML = `<line x1="0" y1="45" x2="320" y2="45" stroke="var(--border)" stroke-width="1"/>`;
    return;
  }
  const min = Math.min(...history);
  const max = Math.max(...history, min + 1);
  const pts = history.map((v, i) => {
    const x = (i / (history.length - 1)) * 316 + 2;
    const y = 86 - ((v - min) / (max - min)) * 80;
    return [x, y];
  });
  const last  = history[history.length - 1];
  const first = history[0];
  const color = last >= first ? 'var(--green)' : 'var(--red)';

  // 영역 fill
  const areaPath = `M${pts[0][0]},88 ` + pts.map(p => `L${p[0]},${p[1]}`).join(' ') + ` L${pts[pts.length-1][0]},88 Z`;
  const linePath = `M` + pts.map(p => `${p[0]},${p[1]}`).join(' L');

  svg.innerHTML = `
    <defs>
      <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.25"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <path d="${areaPath}" fill="url(#cg)"/>
    <path d="${linePath}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
    <circle cx="${pts[pts.length-1][0]}" cy="${pts[pts.length-1][1]}" r="3.5" fill="${color}"/>
  `;
}

function toggleReviewInput() {
  const wrap = document.getElementById('review-wrap');
  wrap.classList.toggle('hidden');
}

function submitReview() {
  const d = getData();
  const s = d.stocks.find(x => x.id === currentStockId);
  if (!s) return;

  const extra = document.getElementById('review-text').value.trim();
  if (extra) s.content += '\n\n[복습 ' + today() + ']\n' + extra;

  // 주가 상승
  const oldPrice = s.price;
  s.price = Math.min(100, s.price + REVIEW_BOOST);
  s.lastReview  = today();
  s.lastUpdate  = Date.now();
  const todayKey = today();
  s.priceHistory = s.priceHistory || [];
  s.priceHistory.push(Math.round(s.price));
  if (s.priceHistory.length > 7) s.priceHistory.shift();
  s.lastHistoryDate = todayKey;

  // ETF 연결 종목 보너스
  const etf = findEtfForStock(s.id, d);
  if (etf) {
    etf.stockIds.forEach(sid => {
      if (sid === s.id) return;
      const linked = d.stocks.find(x => x.id === sid);
      if (linked) {
        linked.price = Math.min(100, linked.price + ETF_BONUS);
        linked.priceHistory = linked.priceHistory || [];
        linked.priceHistory.push(Math.round(linked.price));
        if (linked.priceHistory.length > 7) linked.priceHistory.shift();
      }
    });
  }

  logActivity(d, 'review', s.id);
  saveData(d);
  showToast(`📈 ₩${oldPrice.toFixed(0)} → ₩${s.price.toFixed(0)} (+${REVIEW_BOOST}pt)${etf ? '  🔗 ETF 연결 종목 +3' : ''}`);
  openDetail(currentStockId);
  updateTicker();
}

/* ══ 매도 ══ */
function openSellPopup() {
  if (!currentStockId) return;
  const d = getData();
  const s = d.stocks.find(x => x.id === currentStockId);
  if (!s) return;
  sellTargetId = currentStockId;
  document.getElementById('sell-popup-title').textContent = `${s.name} 매도`;
  document.getElementById('sell-popup-desc').textContent  = `이 종목을 포트폴리오에서 완전히 제거합니다.\n현재가 ₩${s.price.toFixed(0)}`;
  document.getElementById('sell-popup').classList.remove('hidden');
}

function confirmSell() {
  if (!sellTargetId) return;
  const d = getData();
  d.stocks = d.stocks.filter(s => s.id !== sellTargetId);
  d.etfs.forEach(e => { e.stockIds = e.stockIds.filter(id => id !== sellTargetId); });
  d.etfs = d.etfs.filter(e => e.stockIds.length >= 2);
  saveData(d);
  document.getElementById('sell-popup').classList.add('hidden');
  sellTargetId = null;
  showToast('📉 종목이 매도되었습니다');
  navigateTo('home');
}

/* ══ IPO ══ */
function pickSector(btn) {
  document.querySelectorAll('.sec-pill').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  selSector = btn.dataset.s;
}

function resetIpoForm() {
  document.getElementById('ipo-name').value    = '';
  document.getElementById('ipo-content').value = '';
  selSector = '수학';
  document.querySelectorAll('.sec-pill').forEach(b => b.classList.remove('active'));
  document.querySelector('.sec-pill[data-s="수학"]')?.classList.add('active');
}

function listStock() {
  const name    = document.getElementById('ipo-name').value.trim();
  const content = document.getElementById('ipo-content').value.trim();
  if (!name)    { shake('ipo-name');    return; }
  if (!content) { shake('ipo-content'); return; }

  const d  = getData();
  const id = Date.now();
  const todayKey = today();

  d.stocks.push({
    id,
    name,
    sector: selSector,
    content,
    price: 100,
    priceHistory: [100],
    lastHistoryDate: todayKey,
    addedDate: todayKey,
    lastReview: null,
    lastUpdate: Date.now(),
  });

  logActivity(d, 'ipo', id);
  saveData(d);
  showToast(`🚀 ${name} 상장 완료! 공모가 ₩100`);
  navigateTo('home');
  updateTicker();
}

/* ══ 포트폴리오 ══ */
function renderPortfolio() {
  const d = getData();
  const stocks = d.stocks;

  const total = stocks.reduce((a,s) => a+s.price, 0);
  const avg   = stocks.length ? total / stocks.length : 0;
  document.getElementById('port-total').textContent = `₩${total.toFixed(0)}`;
  document.getElementById('port-avg').textContent   = `${avg.toFixed(1)}%`;
  document.getElementById('port-coin').textContent  = d.coins || 0;

  // ETF
  renderEtfList(d);

  // AI 추천
  renderAiRecommendations(d);

  // 섹터 분포
  renderSectorDist(d);
}

function renderEtfList(d) {
  const listEl  = document.getElementById('etf-list');
  const emptyEl = document.getElementById('etf-empty');
  if (!d.etfs || d.etfs.length === 0) {
    listEl.innerHTML = '';
    emptyEl.classList.remove('hidden');
    return;
  }
  emptyEl.classList.add('hidden');
  listEl.innerHTML = d.etfs.map(etf => {
    const names = etf.stockIds.map(id => {
      const s = d.stocks.find(x => x.id === id);
      return s ? `<span class="etf-stock-tag">${esc(s.name)}</span>` : '';
    }).join('');
    return `
      <div class="etf-card">
        <div class="etf-card-header">
          <span class="etf-card-name">🔗 ${esc(etf.name)}</span>
          <span class="etf-cnt">${etf.stockIds.length}개 종목</span>
        </div>
        <div class="etf-stocks">${names}</div>
      </div>`;
  }).join('');
}

function renderAiRecommendations(d) {
  const listEl = document.getElementById('ai-list');
  const recs   = generateAiRecs(d);
  if (recs.length === 0) {
    listEl.innerHTML = '<div class="ps-empty">AI 분석 완료 — 현재 매도 추천 종목 없음 ✅</div>';
    return;
  }
  listEl.innerHTML = recs.map(r => `
    <div class="ai-card">
      <div class="ai-reason">${r.reason}</div>
      <div class="ai-stock">${esc(r.stock.name)} · ₩${r.stock.price.toFixed(0)}</div>
      <div class="ai-desc">${r.desc}</div>
      <button class="btn-ai-sell" onclick="aiSell(${r.stock.id})">📉 매도하기</button>
    </div>
  `).join('');
}

function generateAiRecs(d) {
  const recs   = [];
  const stocks = d.stocks;
  const now    = Date.now();
  const log    = d.activityLog || [];

  // 최근 14일 활동 섹터
  const recentDate = now - 14 * 24 * 60 * 60 * 1000;
  const recentLog  = log.filter(l => l.ts > recentDate);
  const recentIds  = new Set(recentLog.map(l => l.stockId));
  const recentSectors = new Set(
    [...recentIds].map(id => stocks.find(s => s.id === id)?.sector).filter(Boolean)
  );

  stocks.forEach(s => {
    // 30일 이상 방치 + 해당 섹터 최근 활동 없음
    const sectorActive = recentSectors.has(s.sector);
    const lastAct = log.filter(l => l.stockId === s.id).sort((a,b) => b.ts - a.ts)[0];
    const daysSince = lastAct ? (now - lastAct.ts) / (1000*60*60*24) : 999;

    if (!sectorActive && daysSince > 30 && stocks.length > 1) {
      recs.push({
        stock: s,
        reason: '📊 섹터 공부 경향 변화',
        desc: `${s.sector} 섹터를 ${Math.round(daysSince)}일간 공부하지 않았습니다. 학습 방향이 바뀐 것 같아요.`,
      });
    }
    // 주가 D등급 (30 이하) 60일 이상
    if (s.price <= 30 && daysSince > 60 && stocks.length > 1) {
      recs.push({
        stock: s,
        reason: '📉 장기 저가 종목',
        desc: `주가가 ₩${s.price.toFixed(0)}로 ${Math.round(daysSince)}일째 위험 구간입니다.`,
      });
    }
  });

  // 중복 제거
  const seen = new Set();
  return recs.filter(r => {
    if (seen.has(r.stock.id)) return false;
    seen.add(r.stock.id);
    return true;
  }).slice(0, 3);
}

function aiSell(id) {
  sellTargetId = id;
  const d = getData();
  const s = d.stocks.find(x => x.id === id);
  document.getElementById('sell-popup-title').textContent = `${s?.name || ''} 매도 (AI 추천)`;
  document.getElementById('sell-popup-desc').textContent  = 'AI가 매도를 추천한 종목입니다.\n정말 제거하시겠어요?';
  document.getElementById('sell-popup').classList.remove('hidden');
}

function renderSectorDist(d) {
  const counts = {};
  d.stocks.forEach(s => { counts[s.sector] = (counts[s.sector]||0) + 1; });
  const total  = d.stocks.length || 1;
  const el     = document.getElementById('sector-dist');
  if (Object.keys(counts).length === 0) { el.innerHTML = '<div class="ps-empty">종목을 추가하면 섹터 분포가 표시됩니다</div>'; return; }
  el.innerHTML = `<div class="sector-bar-wrap">${
    Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([sec, cnt]) => {
      const pct = Math.round(cnt/total*100);
      return `
        <div class="sector-bar-row">
          <span class="sb-label" style="color:${SECTOR_COLORS[sec]||'#6B7280'}">${sec}</span>
          <div class="sb-track"><div class="sb-fill" style="width:${pct}%;background:${SECTOR_COLORS[sec]||'#6B7280'}"></div></div>
          <span class="sb-val">${cnt}개</span>
        </div>`;
    }).join('')
  }</div>`;
}

/* ══ ETF ══ */
function openEtfPopup() {
  const d = getData();
  if ((d.coins || 0) < ETF_COST) { showToast(`🪙 코인이 부족해요 (필요: ${ETF_COST}코인)`); return; }
  if (d.stocks.length < 2)       { showToast('종목이 2개 이상 있어야 ETF를 만들 수 있어요'); return; }

  etfChosenIds = [];
  document.getElementById('etf-name-input').value = '';
  const listEl = document.getElementById('etf-select-list');
  listEl.innerHTML = d.stocks.map(s => `
    <div class="etf-sel-item" id="etf-sel-${s.id}" onclick="toggleEtfSel(${s.id})">
      <div class="etf-sel-check"></div>
      <span class="etf-sel-name">${esc(s.name)}</span>
      <span class="etf-sel-price">₩${s.price.toFixed(0)}</span>
    </div>
  `).join('');
  document.getElementById('etf-popup').classList.remove('hidden');
}

function toggleEtfSel(id) {
  const el  = document.getElementById(`etf-sel-${id}`);
  const idx = etfChosenIds.indexOf(id);
  if (idx >= 0) { etfChosenIds.splice(idx,1); el.classList.remove('chosen'); }
  else          { etfChosenIds.push(id);       el.classList.add('chosen'); }
}

function createEtf() {
  if (etfChosenIds.length < 2) { showToast('2개 이상의 종목을 선택해주세요'); return; }
  const name = document.getElementById('etf-name-input').value.trim();
  if (!name) { shake('etf-name-input'); return; }

  const d = getData();
  d.coins = (d.coins || 0) - ETF_COST;
  d.etfs  = d.etfs || [];
  d.etfs.push({ id: Date.now(), name, stockIds: [...etfChosenIds] });
  saveData(d);

  document.getElementById('etf-popup').classList.add('hidden');
  showToast(`🔗 ${name} ETF 생성 완료!`);
  renderPortfolio();
}

/* ══ 유틸 ══ */
function logActivity(d, type, stockId) {
  d.activityLog = d.activityLog || [];
  d.activityLog.push({ ts: Date.now(), type, stockId });
  if (d.activityLog.length > 200) d.activityLog = d.activityLog.slice(-200);
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

function esc(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function shake(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--red)';
  el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}],{duration:280});
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

let toastTimer;
function showToast(msg) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.style.cssText = `position:fixed;bottom:74px;left:50%;transform:translateX(-50%);
      background:#1A2235;color:#E2E8F0;font-size:13px;font-weight:700;
      padding:10px 20px;border-radius:20px;z-index:300;
      border:1px solid var(--border);box-shadow:0 4px 16px rgba(0,0,0,.5);
      white-space:nowrap;transition:opacity .3s;max-width:90vw;`;
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.style.opacity = '0'; }, 2500);
}
