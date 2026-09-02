import { categories } from './questions.js';

const app = document.querySelector('#app');
const state = { set: [], index: 0, step: 1, step1Tries: 0, step2Tries: 0, scores: { habits: 0, connection: 0 }, selected: { body: '', mind: '' } };

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
const escapeHtml = (value) => value.replace(/[&<>'"]/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));

async function prepareSceneImage() {
  try {
    const response = await fetch('./assets/healthy-scenes.png');
    const bytes = new Uint8Array(await response.arrayBuffer());
    const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const imageUrl = isPng
      ? URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
      : `data:image/png;base64,${new TextDecoder().decode(bytes).trim()}`;
    document.documentElement.style.setProperty('--scene-image', `url("${imageUrl}")`);
  } catch {
    document.documentElement.style.setProperty('--scene-image', 'linear-gradient(135deg,#eadffc,#fff1e8)');
  }
}

function newSet() {
  let previous = [];
  try { previous = JSON.parse(sessionStorage.getItem('healthyDetectivePrevious') || '[]'); } catch {}
  state.set = categories.map((category, index) => {
    const available = category.questions.filter((question) => question.id !== previous[index]);
    const question = available[Math.floor(Math.random() * available.length)];
    return { ...question, category };
  });
  sessionStorage.setItem('healthyDetectivePrevious', JSON.stringify(state.set.map((q) => q.id)));
  Object.assign(state, { index: 0, step: 1, step1Tries: 0, step2Tries: 0, scores: { habits: 0, connection: 0 }, selected: { body: '', mind: '' } });
}

function focusMain() { app.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'smooth' }); }
function sceneStyle(question) { return `--scene-position:${question.category.imagePosition};--accent:${question.category.color}`; }

function renderStart() {
  app.innerHTML = `
    <section class="start-card">
      <div class="start-art" role="img" aria-label="잠자리 준비, 손 씻기, 골고루 먹기, 몸 움직이기, 마음 나누기 장면"></div>
      <div class="start-copy">
        <p class="kicker">🌱 몸과 마음이 건강한 하루</p>
        <h1>건강한 하루<br><em>탐정</em></h1>
        <p>생활 장면을 살펴보고 더 건강한 선택을 찾아봐요. 그 선택이 몸과 마음에 어떤 도움을 주는지도 연결해 볼 거예요.</p>
        <div class="mission"><span>오늘의 탐정 질문</span><strong>🔗 생활습관은 몸과 마음에 무엇을 줄까요?</strong></div>
        <button class="primary-button" id="start-button">탐정 활동 시작하기 <span aria-hidden="true">→</span></button>
        <small>5개 영역 · 5문제 · 약 10~15분</small>
      </div>
    </section>
    <section class="route-preview" aria-label="오늘 살펴볼 다섯 영역">
      ${categories.map((c, i) => `<div><b>${i + 1}</b><span>${c.icon}</span><strong>${c.name}</strong></div>`).join('')}
    </section>`;
  document.querySelector('#start-button').addEventListener('click', () => { newSet(); renderQuestion(); focusMain(); });
}

function progressMarkup() {
  return `<div class="progress-row" aria-label="문제 진행 상황">${categories.map((c, i) => `<div class="progress-item ${i < state.index ? 'done' : ''} ${i === state.index ? 'current' : ''}"><span>${i < state.index ? '✓' : c.icon}</span><small>${i + 1}. ${c.name}</small></div>`).join('')}</div>`;
}

function renderQuestion() {
  const question = state.set[state.index];
  const stepText = state.step === 1 ? '장면을 바꿔주세요!' : '몸과 마음에는 어떤 도움을 줄까요?';
  app.innerHTML = `
    ${progressMarkup()}
    <section class="question-card" style="${sceneStyle(question)}">
      <div class="question-topline"><span>${question.category.icon} 문제 ${state.index + 1} · ${question.category.name}</span><strong>STEP ${state.step}</strong></div>
      <div class="step-heading"><span>${state.step === 1 ? '🎭' : '🔗'}</span><div><small>STEP ${state.step}</small><h1>${stepText}</h1></div></div>
      ${state.step === 1 ? stepOneMarkup(question) : stepTwoMarkup(question)}
    </section>`;
  bindQuestionEvents(question);
}

function stepOneMarkup(question) {
  const choices = shuffle(question.options.map((text) => ({ text, correct: text === question.answer })));
  const correctText = question.answer;
  return `
    <div class="scene-layout">
      <div class="scene-visual" role="img" aria-label="${escapeHtml(question.category.name)} 생활 장면"><div class="scene-emoji">${question.emoji}</div></div>
      <div class="scene-copy"><p class="scene-label">탐정이 발견한 장면</p><h2>${escapeHtml(question.title)}</h2><p>${escapeHtml(question.desc)}</p></div>
    </div>
    <div class="choice-area"><h2>어떻게 바꾸면 건강한 생활습관이 될까요?</h2>
      <div class="choices" data-correct="${escapeHtml(correctText)}">${choices.map((choice, i) => `<button class="choice" data-value="${escapeHtml(choice.text)}" data-correct="${choice.correct}"><span>${i + 1}</span>${escapeHtml(choice.text)}</button>`).join('')}</div>
      <div id="feedback" class="feedback" aria-live="polite"></div>
    </div>`;
}

function stepTwoMarkup(question) {
  const makeChoices = (kind, options) => shuffle(options).map((text) => `<button class="benefit-choice" data-kind="${kind}" data-value="${escapeHtml(text)}">${escapeHtml(text)}</button>`).join('');
  return `
    <div class="habit-banner"><span>${question.emoji}</span><div><small>우리가 찾은 건강한 생활습관</small><h2>${escapeHtml(question.habit)}</h2></div></div>
    <p class="connection-question">🔗 <strong>${escapeHtml(question.habit)}</strong>은<br>몸과 마음에 무엇을 줄까요?</p>
    <div class="benefit-grid">
      <section class="benefit-panel body-panel"><h3>💪 몸</h3><p>몸에 주는 도움을 골라요.</p><div>${makeChoices('body', question.body)}</div></section>
      <section class="benefit-panel mind-panel"><h3>❤️ 마음</h3><p>마음에 주는 도움을 골라요.</p><div>${makeChoices('mind', question.mind)}</div></section>
    </div>
    <button class="primary-button check-button" id="check-connection" disabled>연결 확인하기</button>
    <div id="feedback" class="feedback" aria-live="polite"></div>`;
}

function bindQuestionEvents(question) {
  if (state.step === 1) {
    document.querySelectorAll('.choice').forEach((button) => button.addEventListener('click', () => handleStepOne(button, question)));
  } else {
    document.querySelectorAll('.benefit-choice').forEach((button) => button.addEventListener('click', () => {
      const kind = button.dataset.kind;
      document.querySelectorAll(`[data-kind="${kind}"]`).forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected'); state.selected[kind] = button.dataset.value;
      document.querySelector('#check-connection').disabled = !(state.selected.body && state.selected.mind);
    }));
    document.querySelector('#check-connection').addEventListener('click', () => handleStepTwo(question));
  }
}

function handleStepOne(button, question) {
  const feedback = document.querySelector('#feedback');
  if (button.dataset.correct === 'true') {
    if (state.step1Tries === 0) state.scores.habits++;
    document.querySelectorAll('.choice').forEach((item) => item.disabled = true);
    button.classList.add('correct');
    feedback.innerHTML = `<div class="success-feedback">🌟 <strong>잘 찾았어요!</strong> ${escapeHtml(question.success)}</div><button class="primary-button" id="next-step">몸·마음과 연결하기 →</button>`;
    document.querySelector('#next-step').addEventListener('click', () => { state.step = 2; state.selected = { body: '', mind: '' }; renderQuestion(); focusMain(); });
  } else {
    state.step1Tries++; button.disabled = true; button.classList.add('wrong');
    if (state.step1Tries === 1) {
      feedback.innerHTML = `<div class="hint-feedback">🔎 <strong>다시 생각해볼까요?</strong><br>${escapeHtml(question.hint)}</div>`;
    } else {
      document.querySelectorAll('.choice').forEach((item) => { if (item.dataset.correct === 'true') item.classList.add('reveal'); });
      feedback.innerHTML = `<div class="hint-feedback">💡 건강한 선택에 보라색 테두리가 생겼어요. 천천히 다시 골라보세요.</div>`;
    }
  }
}

function handleStepTwo(question) {
  const bodyCorrect = state.selected.body === question.body[0];
  const mindCorrect = state.selected.mind === question.mind[0];
  const feedback = document.querySelector('#feedback');
  if (bodyCorrect && mindCorrect) {
    if (state.step2Tries === 0) state.scores.connection++;
    document.querySelectorAll('.benefit-choice').forEach((item) => item.disabled = true);
    document.querySelector('#check-connection').remove();
    feedback.innerHTML = `<div class="connection-result"><div><span>${question.emoji}</span><strong>${escapeHtml(question.habit)}</strong></div><i>↙</i><i>↘</i><div><span>💪</span><strong>${escapeHtml(question.body[0])}</strong></div><div><span>❤️</span><strong>${escapeHtml(question.mind[0])}</strong></div></div><div class="success-feedback">🌟 몸과 마음의 연결을 잘 찾았어요!</div><button class="primary-button" id="continue-button">${state.index === 4 ? '탐정 결과 보기' : '다음 장면 살펴보기'} →</button>`;
    document.querySelector('#continue-button').addEventListener('click', () => {
      if (state.index === 4) renderResult(); else { state.index++; state.step = 1; state.step1Tries = 0; state.step2Tries = 0; state.selected = { body: '', mind: '' }; renderQuestion(); }
      focusMain();
    });
  } else {
    state.step2Tries++;
    if (!bodyCorrect) document.querySelector('[data-kind="body"].selected')?.classList.add('wrong');
    if (!mindCorrect) document.querySelector('[data-kind="mind"].selected')?.classList.add('wrong');
    feedback.innerHTML = `<div class="hint-feedback">🔎 <strong>한 번 더 연결해볼까요?</strong><br>몸에 생기는 변화와 마음에 느껴지는 변화를 나누어 생각해요.</div>`;
    if (state.step2Tries >= 2) {
      document.querySelectorAll('.benefit-choice').forEach((item) => {
        if ((item.dataset.kind === 'body' && item.dataset.value === question.body[0]) || (item.dataset.kind === 'mind' && item.dataset.value === question.mind[0])) item.classList.add('reveal');
      });
      feedback.innerHTML = `<div class="hint-feedback">💡 알맞은 연결에 보라색 테두리가 생겼어요. 다시 골라보세요.</div>`;
    }
  }
}

function achievement(score) {
  if (score >= 5) return { stars: '★★★★★', title: '잘 이해했어요', text: '대부분 스스로 해결했어요!' };
  if (score >= 3) return { stars: '★★★★☆', title: '잘 알아가고 있어요', text: '다시 생각하며 답을 찾아냈어요!' };
  return { stars: '★★★☆☆', title: '한 번 더 살펴봐요', text: '도움을 활용해 끝까지 해결했어요!' };
}

function renderResult() {
  const habits = achievement(state.scores.habits); const connection = achievement(state.scores.connection);
  app.innerHTML = `<section class="result-card">
    <div class="celebration">✦　🌟　✦</div><p class="kicker">탐정 임무 성공</p><h1>건강한 하루 탐정 완료!</h1><p>다섯 가지 생활 장면을 모두 살펴봤어요.</p>
    <div class="achievement-grid">
      <article><span>🔎</span><h2>건강한 생활습관 찾기</h2><div class="stars">${habits.stars}</div><strong>${habits.title}</strong><p>${habits.text}</p></article>
      <article><span>🔗</span><h2>몸과 마음의 연결 알아보기</h2><div class="stars">${connection.stars}</div><strong>${connection.title}</strong><p>${connection.text}</p></article>
    </div>
    <div class="result-actions"><button class="secondary-button" id="new-set">🔄 새로운 문제 풀기</button><button class="primary-button" id="practice-button">🌱 내가 실천할 생활습관 고르기</button></div>
  </section>`;
  document.querySelector('#new-set').addEventListener('click', () => { newSet(); renderQuestion(); focusMain(); });
  document.querySelector('#practice-button').addEventListener('click', () => { renderPractice(); focusMain(); });
}

function renderPractice() {
  app.innerHTML = `<section class="practice-card"><p class="kicker">마지막 탐정 활동</p><h1>건강한 나를 위해<br>내가 실천해보고 싶은 것은 무엇인가요?</h1><p>이번에 만난 생활습관 중 하나를 골라 나의 약속으로 만들어봐요.</p>
    <div class="practice-grid">${state.set.map((q) => `<button class="practice-choice" data-habit="${escapeHtml(q.habit)}"><span>${q.emoji}</span><strong>${escapeHtml(q.habit)}</strong><small>${q.category.icon} ${q.category.name}</small></button>`).join('')}</div>
    <div id="practice-message" class="practice-message" aria-live="polite"></div><button class="text-button" id="back-result">← 탐정 결과로 돌아가기</button></section>`;
  document.querySelectorAll('.practice-choice').forEach((button) => button.addEventListener('click', () => {
    document.querySelectorAll('.practice-choice').forEach((item) => item.classList.remove('selected'));
    button.classList.add('selected');
    document.querySelector('#practice-message').innerHTML = `🌟 <strong>좋아요!</strong> “${escapeHtml(button.dataset.habit)}”를 실천 학습지에 나의 약속으로 적어보세요.`;
  }));
  document.querySelector('#back-result').addEventListener('click', () => { renderResult(); focusMain(); });
}

document.querySelector('.brand').addEventListener('click', (event) => { event.preventDefault(); renderStart(); focusMain(); });
prepareSceneImage();
renderStart();

