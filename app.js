'use strict';

/* ══ 상태 ══ */
let selColor    = '#CC2200';
let quizQueue   = [];
let curQuiz     = null;
let quizTimer   = null;
let timeLeft    = 30;
let qScore      = 0;
let qCur        = 0;
let qTotal      = 5;
let correctAns  = '';
let charTab     = 'hat';
let dateFilter  = 'year';

const CHAR_DATA = {
  hat:        ['🪖','🎩','👒','🧢','🎓','🪖','⛑️','👑'],
  clothes:    ['🥻','👕','👔','🧥','🦺','👘','🥼','🎽'],
  expression: ['😊','😎','🤩','😤','🤓','😄','🥳','😇'],
};
const SPEECHES = [
  '오늘도 지식을 불태워요! 🔥',
  '화재 진압을 위해 대기 중!',
  '공부한 내용을 입력하면 퀴즈로 복습할 수 있어요!',
  '지식이 쌓일수록 강해집니다! 💪',
  '퀴즈로 복습해볼까요? 🚒',
  '연속 정답 기록 갱신 중!',
];
const FEEDBACKS = [
  score => score >= 80 ? '완벽해요! 소방관 최고등급 인증 🏅' : null,
  score => score >= 60 ? '훌륭해요! 조금만 더 연습하면 완벽할 거예요!' : null,
  score => score >= 40 ? '잘 하고 있어요! 반복 학습이 도움이 될 거예요.' : null,
  score => '아직 갈 길이 있어요. 노트를 다시 읽어봐요! 📖',
];

/* ══ 초기화 ══ */
document.addEventListener('DOMContentLoaded', () => {
  updateHomeScreen();
  refreshSpeech();
  setInterval(refreshSpeech, 4500);

  document.getElementById('ans-input')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitAns();
  });
  renderCharItems();
  loadCharState();
  setTodayDate();
});

function setTodayDate() {
  const d = new Date();
  const s = `${d.getFullYear()}. ${String(d.getMonth()+1).padStart(2,'0')}. ${String(d.getDate()).padStart(2,'0')}.`;
  const el = document.getElementById('today-date');
  if (el) el.textContent = s;
}

/* ══ LocalStorage helpers ══ */
function getNotes()   { return JSON.parse(localStorage.getItem('kn2_notes')   || '[]'); }
function saveNotes(d) { localStorage.setItem('kn2_notes',   JSON.stringify(d)); }
function getStats()   { return JSON.parse(localStorage.getItem('kn2_stats')   || '{"c":0,"w":0,"streak":0,"tasks":0}'); }
function saveStats(d) { localStorage.setItem('kn2_stats',   JSON.stringify(d)); }
function getHistory() { return JSON.parse(localStorage.getItem('kn2_hist')    || '[]'); }
function saveHistory(d){ localStorage.setItem('kn2_hist',   JSON.stringify(d)); }
function getChar()    { return JSON.parse(localStorage.getItem('kn2_char')    || '{"hat":0,"clothes":0,"expression":0}'); }
function saveChar(d)  { localStorage.setItem('kn2_char',   JSON.stringify(d)); }

/* ══ 화면 이동 ══ */
function navigateTo(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`screen-${name}`)?.classList.add('active');
  const nb = document.getElementById(`nav-${name}`);
  if (nb) nb.classList.add('active');
  if (name === 'home')      updateHomeScreen();
  if (name === 'history')   renderHistory();
  if (name === 'character') { renderCharItems(); loadCharState(); }
  if (name === 'add')       resetAddForm();
}

/* ══ 홈 화면 ══ */
function updateHomeScreen() {
  const notes = getNotes();
  const st    = getStats();
  const tot   = st.c + st.w;
  const rate  = tot > 0 ? Math.round(st.c / tot * 100) : 0;

  setText('task-cnt',   st.tasks);
  updateHomeDynamic(notes, st);
  setText('stat-notes', notes.length);
  setText('stat-rate',  rate + '%');
  setText('stat-streak',st.streak);

  // 오늘 노트 목록
  const today    = todayStr();
  const todayNotes = notes.filter(n => n.date === today);
  const listEl   = document.getElementById('home-note-list');
  if (!listEl) return;

  if (todayNotes.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state-sm">
        <p>아직 오늘 공부 기록이 없어요</p>
        <button class="btn-link" onclick="navigateTo('add')">+ 추가하기</button>
      </div>`;
    return;
  }
  listEl.innerHTML = todayNotes.map(n => `
    <div class="note-row" style="border-left-color:${esc(n.color)}">
      <div class="note-row-dot" style="background:${esc(n.color)}"></div>
      <span class="note-row-text">${esc(n.title)}</span>
    </div>
  `).join('');
}

function refreshSpeech() {
  const el = document.getElementById('pai-speech');
  if (!el) return;
  const notes = getNotes();
  const pool  = notes.length > 0
    ? [`${notes.length}개의 노트가 저장됐어요!`, '퀴즈로 복습해볼까요? 🚒', ...SPEECHES]
    : SPEECHES;
  el.textContent = pool[Math.floor(Math.random() * pool.length)];
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

/* ══ 색상 선택 ══ */
function pickColor(btn) {
  document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  selColor = btn.dataset.c;
}

/* ══ 노트 저장 ══ */
function saveNote() {
  const title   = document.getElementById('note-title').value.trim();
  const content = document.getElementById('note-content').value.trim();
  const attach  = parseInt(document.getElementById('attach-count').value) || 0;

  if (!title)   { shakeEl('note-title',   '제목을 입력해주세요'); return; }
  if (!content) { shakeEl('note-content', '내용을 입력해주세요'); return; }

  const notes = getNotes();
  notes.unshift({
    id: Date.now(),
    date: todayStr(),
    title,
    content,
    color: selColor,
    attach,
    checked: false,
  });
  saveNotes(notes);

  const st = getStats();
  st.tasks++;
  saveStats(st);

  showToast('노트가 저장됐어요 🔥');
  resetAddForm();
  navigateTo('home');
}

function resetAddForm() {
  const t = document.getElementById('note-title');
  const c = document.getElementById('note-content');
  const a = document.getElementById('attach-count');
  if (t) t.value = '';
  if (c) c.value = '';
  if (a) a.value = '0';
  selColor = '#CC2200';
  document.querySelectorAll('.col-btn').forEach(b => b.classList.remove('sel'));
  const redBtn = document.querySelector('.col-btn[data-c="#CC2200"]');
  if (redBtn) redBtn.classList.add('sel');
}

/* ══ 학습 기록 ══ */
function filterDate(btn) {
  document.querySelectorAll('.dtag').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  dateFilter = btn.dataset.f;
  renderHistory();
}

function renderHistory() {
  const notes  = getNotes();
  const listEl = document.getElementById('history-list');
  if (!listEl) return;

  if (notes.length === 0) {
    listEl.innerHTML = `<div class="empty-state"><span class="empty-ico">📭</span>아직 저장된 노트가 없어요</div>`;
    return;
  }

  // 날짜별 그룹
  const groups = {};
  notes.forEach(n => {
    const key = groupKey(n.date, dateFilter);
    if (!groups[key]) groups[key] = [];
    groups[key].push(n);
  });

  const st = getStats();
  listEl.innerHTML = Object.entries(groups).map(([key, items]) => `
    <div class="hist-card">
      <div class="hist-card-header">
        <span class="hist-date">${key}</span>
        <span class="hist-title">${esc(items[0].title)}${items.length > 1 ? ` 외 ${items.length-1}건` : ''}</span>
      </div>
      <div class="hist-items">
        ${items.map(n => `
          <div class="hist-item">
            <div class="hist-item-dot" style="background:${esc(n.color)}"></div>
            <span>${esc(n.title)}</span>
            <span class="hist-check ${n.checked ? 'ok' : 'fail'}">${n.checked ? '✓' : '✗'}</span>
          </div>
        `).join('')}
      </div>
      <div class="hist-card-actions" style="margin-top:10px">
        <button class="btn-sm-gray" onclick="deleteGroup('${key}')">삭제</button>
        <button class="btn-sm-green" onclick="quizFromGroup('${key}')">이 노트로 퀴즈 🔥</button>
      </div>
    </div>
  `).join('');
}

function groupKey(dateStr, filter) {
  const [y, m, d] = dateStr.split('-');
  if (filter === 'year')  return `${y}년`;
  if (filter === 'month') return `${y}년 ${m}월`;
  return `${y}.${m}.${d}`;
}

function deleteGroup(key) {
  if (!confirm('이 그룹의 노트를 삭제하시겠어요?')) return;
  const notes   = getNotes();
  const remain  = notes.filter(n => groupKey(n.date, dateFilter) !== key);
  saveNotes(remain);
  renderHistory();
  updateHomeScreen();
}

function quizFromGroup(key) {
  const notes = getNotes().filter(n => groupKey(n.date, dateFilter) === key);
  if (notes.length === 0) return;
  startQuizWith(notes);
}

/* ══ 퀴즈 시작 ══ */
function goStartQuiz() {
  const notes = getNotes();
  if (notes.length === 0) {
    navigateTo('add');
    showToast('먼저 노트를 추가해주세요! 📝');
    return;
  }
  startQuizWith(notes);
}

function startQuizWith(notes) {
  // 버튼 초기화
  ['btn-next-overlay'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.textContent = '다음 문제 →'; el.onclick = nextQ; }
  });

  const shuffled = [...notes].sort(() => Math.random() - .5);
  quizQueue  = shuffled.slice(0, Math.min(5, shuffled.length));
  qTotal     = quizQueue.length;
  qCur       = 0;
  qScore     = 0;

  setText('q-tot',  qTotal);
  setText('q-score','0');

  buildFireBg();
  navigateTo('quiz');
  document.getElementById('nav-quiz')?.classList.add('active');
  showQuestion();
}

function buildFireBg() {
  const bg = document.getElementById('fire-bg');
  if (!bg) return;
  bg.innerHTML = '';
  const total = 18;
  for (let i = 0; i < total; i++) {
    const img = document.createElement('img');
    img.src   = 'assets/flame.svg';
    img.className = 'fbg-flame';
    const size = 28 + Math.random() * 36;
    const dur  = 1.2 + Math.random() * 1.2;
    img.style.cssText = `
      left:${Math.random()*92}%;
      top:${Math.random()*88}%;
      width:${size}px;
      height:${size}px;
      --dur:${dur}s;
      animation-delay:${Math.random()*1.5}s;
    `;
    bg.appendChild(img);
  }
}

/* ══ 문제 표시 ══ */
function showQuestion() {
  if (qCur >= quizQueue.length) { endQuiz(); return; }

  clearInterval(quizTimer);
  const note = quizQueue[qCur];
  curQuiz    = buildQuiz(note, getNotes());

  setText('q-cur',        qCur + 1);
  setText('quiz-subj',    note.title);
  setText('quiz-q',       curQuiz.question);
  document.getElementById('quiz-body').innerHTML = curQuiz.display;

  // 스타일 초기화
  const card = document.getElementById('quiz-card');
  const bar  = document.getElementById('timer-bar');
  const txt  = document.getElementById('timer-txt');
  if (card) card.className = 'quiz-card';
  if (bar)  { bar.style.width = '100%'; bar.className = 'qtimer-bar'; }
  if (txt)  { txt.textContent = '30'; txt.style.color = ''; }

  // 정답창 숨기기
  document.getElementById('ans-wrap')?.classList.add('hidden');
  document.getElementById('ans-input') && (document.getElementById('ans-input').value = '');

  correctAns = curQuiz.answer;
  startTimer();
}

function buildQuiz(note, allNotes) {
  const words = note.content.split(/\s+/);
  const cands = words.filter(w => clean(w).length >= 2);

  if (cands.length === 0) {
    return {
      question: '이 노트의 핵심 첫 단어를 입력하세요:',
      display:  esc(note.content),
      answer:   clean(words[0] || '?'),
    };
  }

  const pool   = cands.slice(0, Math.ceil(cands.length * .6));
  const target = pool[Math.floor(Math.random() * pool.length)];
  const ans    = clean(target);
  const blank  = `<span class="blank">${'&nbsp;'.repeat(Math.max(2, ans.length))}</span>`;
  const display = esc(note.content).replace(esc(target), blank);

  return {
    question: '빈칸에 들어갈 알맞은 단어를 입력하세요:',
    display,
    answer: ans,
  };
}

function clean(w) { return w.replace(/[^가-힣a-zA-Z0-9]/g, ''); }

/* ══ 타이머 ══ */
function startTimer() {
  clearInterval(quizTimer);
  timeLeft = 30;
  const bar  = document.getElementById('timer-bar');
  const txt  = document.getElementById('timer-txt');
  const card = document.getElementById('quiz-card');

  quizTimer = setInterval(() => {
    timeLeft--;
    const pct = timeLeft / 30 * 100;
    if (bar) bar.style.width = pct + '%';
    if (txt) txt.textContent = String(timeLeft);

    if (timeLeft <= 8) {
      bar?.classList.replace('qtimer-bar','qtimer-bar') || (bar.className = 'qtimer-bar crit');
      bar && (bar.className = 'qtimer-bar crit');
      card && (card.className = 'quiz-card crit');
      if (txt) txt.style.color = '#FF2D00';
    } else if (timeLeft <= 18) {
      bar && (bar.className = 'qtimer-bar warn');
      card && (card.className = 'quiz-card warn');
    }

    if (timeLeft <= 0) { clearInterval(quizTimer); onWrong(); }
  }, 1000);
}

/* ══ 정답 처리 ══ */
function openAnswer() {
  document.getElementById('ans-wrap')?.classList.remove('hidden');
  document.getElementById('ans-input')?.focus();
}

function submitAns() {
  const val = (document.getElementById('ans-input')?.value || '').trim();
  if (!val) return;
  clearInterval(quizTimer);
  if (val.toLowerCase() === correctAns.toLowerCase()) onCorrect();
  else onWrong();
}

function onCorrect() {
  qScore += 10 + Math.max(0, timeLeft);
  setText('q-score', qScore);
  const st = getStats(); st.c++; st.streak++; saveStats(st);

  const note = quizQueue[qCur];
  const notes = getNotes();
  const idx = notes.findIndex(n => n.id === note.id);
  if (idx >= 0) { notes[idx].checked = true; saveNotes(notes); }

  showOverlay(true);
}

function onWrong() {
  const st = getStats(); st.w++; st.streak = 0; saveStats(st);
  showOverlay(false);
}

function showOverlay(correct) {
  const ov   = document.getElementById('ans-overlay');
  const box  = document.getElementById('overlay-box');
  const ico  = document.getElementById('overlay-icon');
  const msg  = document.getElementById('overlay-msg');
  const ans  = document.getElementById('overlay-ans');
  if (!ov) return;

  if (correct) {
    box.className = 'overlay-box correct';
    ico.textContent = '🎉';
    msg.textContent = '정답!';
    msg.style.color = 'var(--green)';
    ans.textContent = '';
  } else {
    box.className = 'overlay-box wrong';
    ico.textContent = '💀';
    msg.textContent = '오답!';
    msg.style.color = 'var(--red)';
    ans.textContent = `정답: ${correctAns}`;
  }
  ov.classList.remove('hidden');
}

function nextQ() {
  document.getElementById('ans-overlay')?.classList.add('hidden');
  qCur++;
  showQuestion();
}

/* ══ 퀴즈 종료 ══ */
function endQuiz() {
  clearInterval(quizTimer);
  document.getElementById('ans-overlay')?.classList.add('hidden');

  const hist = getHistory();
  hist.unshift({ date: todayStr(), score: qScore, total: qTotal });
  if (hist.length > 30) hist.pop();
  saveHistory(hist);

  const st = getStats(); st.tasks++; saveStats(st);
  updateHomeScreen();

  // 결과 계산
  const correct = Math.round(qScore / (qTotal * (10 + 15)) * qTotal); // approximation
  const cRate   = Math.min(100, Math.round(qScore / (qTotal * 25) * 100));
  const wRate   = 100 - cRate;
  const prev    = hist[1];
  const improve = prev
    ? (qScore > prev.score
        ? `지난번(${prev.score}점)보다 ${qScore - prev.score}점 올랐어요! 🚀`
        : qScore === prev.score
          ? '지난번과 같은 점수예요. 조금만 더 연습해봐요!'
          : `지난번(${prev.score}점)보다 ${prev.score - qScore}점 낮아졌어요. 파이팅!`)
    : '이번이 첫 번째 퀴즈예요!';
  const fb = FEEDBACKS.reduce((acc, fn) => acc || fn(cRate), null);

  setText('big-score',   qScore);
  setText('pct-correct', cRate + '%');
  setText('pct-wrong',   wRate + '%');
  setText('r-improve',   improve);
  setText('r-feedback',  fb);

  setTimeout(() => {
    const bc = document.getElementById('bar-correct');
    const bw = document.getElementById('bar-wrong');
    if (bc) bc.style.width = cRate + '%';
    if (bw) bw.style.width = wRate + '%';
  }, 100);

  navigateTo('result');
}

/* ══ 캐릭터 ══ */
function renderCharItems() {
  const el = document.getElementById('char-items');
  if (!el) return;
  const items   = CHAR_DATA[charTab];
  const charSt  = getChar();
  const picked  = charSt[charTab] || 0;
  el.innerHTML  = items.map((item, i) => `
    <button class="char-item-btn ${i === picked ? 'picked' : ''}"
            onclick="pickCharItem(${i})">${item}</button>
  `).join('');
}

function switchTab(btn, tab) {
  document.querySelectorAll('.ctab2').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  charTab = tab;
  renderCharItems();
}

function pickCharItem(idx) {
  const charSt = getChar();
  charSt[charTab] = idx;
  saveChar(charSt);
  renderCharItems();
  loadCharState();
}

function loadCharState() {
  const charSt = getChar();
  const hatEl  = document.getElementById('char-hat-disp');
  if (hatEl) hatEl.textContent = CHAR_DATA.hat[charSt.hat] || '';
  // 업그레이드 카운트 (목표: 50건 처리)
  const st = getStats();
  const remaining = Math.max(0, 50 - st.tasks);
  setText('upgrade-cnt', remaining);
}

/* ══ 유틸 ══ */
function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = String(val);
}

function esc(s) {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;');
}

function shakeEl(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.borderColor = 'var(--red)';
  el.placeholder = msg;
  el.animate([{transform:'translateX(-4px)'},{transform:'translateX(4px)'},{transform:'translateX(0)'}], {duration:300});
  setTimeout(() => { el.style.borderColor = ''; }, 1500);
}

let toastTimer = null;
function showToast(msg) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.style.cssText = `
      position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
      background:#1A0500; color:#FFD700; font-weight:700; font-size:14px;
      padding:10px 22px; border-radius:20px; z-index:300;
      box-shadow:0 4px 18px rgba(0,0,0,.4); white-space:nowrap;
      transition:opacity .3s;
    `;
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.style.opacity = '0'; }, 2200);
}

/* ══ 홈 화면 동적 업데이트 ══ */
function updateHomeDynamic(notes, st) {
  // 날짜 표시
  const d = new Date();
  const days = ['일','월','화','수','목','금','토'];
  const times = d.getHours() < 12 ? '오전' : '오후';
  const dateEl = document.getElementById('home-date');
  if (dateEl) {
    const y = d.getFullYear(), m = String(d.getMonth()+1).padStart(2,'0'), day = String(d.getDate()).padStart(2,'0');
    dateEl.textContent = `${y}. ${m}. ${day} 일자 업무`;
  }
  const hudTime = document.getElementById('hud-time');
  if (hudTime) hudTime.textContent = `${days[d.getDay()]}요일 ${times}`;

  // EXP 계산 (누적 정답 기반)
  const exp = Math.min(100, st.c * 5);
  const expBar = document.getElementById('exp-bar');
  const expVal = document.getElementById('exp-val');
  if (expBar) expBar.style.width = exp + '%';
  if (expVal) expVal.textContent = `${exp}/100`;

  // 구조 수
  const rescueVal = document.getElementById('rescue-val');
  if (rescueVal) rescueVal.textContent = `${Math.min(st.c, 5)}/5`;

  // 대기 지식 수
  const today = todayStr();
  const todayNotes = notes.filter(n => n.date === today);
  setText('waiting-cnt', todayNotes.length);

  // 밀린 업무 (unchecked 노트)
  const overdue = notes.filter(n => !n.checked).length;
  const overdueBtn = document.getElementById('btn-overdue');
  if (overdueBtn) overdueBtn.textContent = `오늘 밀린 업무 (${overdue}건)`;
  setText('overdue-cnt', overdue);

  // 업무 보고 수
  setText('report-cnt', st.tasks);
}
