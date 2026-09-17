import {
  calculateWeekProgress,
  createEmptyState,
  getPlanForDay,
  getWeekKey,
  localDateKey,
  toggleTask
} from './app-core.js?v=1.2.0';

const STORAGE_KEY = 'bp-exercise-checklist-v1-state';
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const today = new Date();
const todayKey = localDateKey(today);
let state = loadState();
persist();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved?.completions
      ? {completions: saved.completions, startDate: saved.startDate || todayKey}
      : createEmptyState();
  } catch {
    return createEmptyState();
  }
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('ko-KR', options).format(date);
}

function renderToday() {
  const plan = getPlanForDay(today);
  const completions = state.completions?.[todayKey] || {};
  const done = plan.filter((item) => completions[item.id]).length;
  document.querySelector('#today-label').textContent = formatDate(today, {month: 'long', day: 'numeric', weekday: 'long'});
  document.querySelector('#today-progress').textContent = `${done} / ${plan.length}`;
  document.querySelector('#progress-fill').style.width = `${Math.round((done / plan.length) * 100)}%`;
  document.querySelector('#task-list').innerHTML = plan.map((item) => `
    <button class="task ${item.steps ? 'has-steps' : ''}" type="button" data-task-id="${item.id}" data-completed="${Boolean(completions[item.id])}" aria-pressed="${Boolean(completions[item.id])}">
      <span class="task-check" aria-hidden="true">${completions[item.id] ? '✓' : ''}</span>
      <span><strong>${item.title}</strong><small>${item.detail}</small>${item.steps ? `<ol class="task-steps">${item.steps.map((step) => `<li>${step}</li>`).join('')}</ol>` : ''}</span>
    </button>
  `).join('');
}


function renderWeek() {
  const mondayKey = getWeekKey(today);
  const monday = new Date(`${mondayKey}T12:00:00`);
  const progress = calculateWeekProgress(state, today);
  document.querySelector('#week-progress').innerHTML = `<strong>이번 주 ${progress.percent}% 완료</strong><span>${progress.done}개 완료 · 총 ${progress.total}개</span>`;
  const days = [];
  for (let index = 0; index < 7; index += 1) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + index);
    const key = localDateKey(date);
    const plan = getPlanForDay(date);
    const done = plan.filter((item) => state.completions?.[key]?.[item.id]).length;
    const workout = plan.find((item) => item.id.startsWith('workout') || item.id.startsWith('strength') || item.id.startsWith('recovery'));
    days.push(`<article class="week-day ${key === todayKey ? 'today' : ''}" data-week-day>
      <header><strong>${DAY_NAMES[date.getDay()]}요일 ${date.getDate()}일${key === todayKey ? ' · 오늘' : ''}</strong><span>${done}/${plan.length}</span></header>
      <p><strong>${workout.title}</strong><br>${workout.detail}</p>
      <ol class="week-steps">${workout.steps.map((step) => `<li>${step}</li>`).join('')}</ol>
    </article>`);
  }
  document.querySelector('#week-list').innerHTML = days.join('');
}

function renderAll() {
  renderToday();
  renderWeek();
}

function switchView(name) {
  document.querySelectorAll('[data-view-button]').forEach((button) => {
    const selected = button.dataset.viewButton === name;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('.view').forEach((view) => {
    const selected = view.id === `${name}-view`;
    view.hidden = !selected;
    view.classList.toggle('is-active', selected);
  });
}

document.querySelector('#task-list').addEventListener('click', (event) => {
  const task = event.target.closest('[data-task-id]');
  if (!task) return;
  state = toggleTask(state, todayKey, task.dataset.taskId);
  persist();
  renderToday();
  renderWeek();
});

document.querySelectorAll('[data-view-button]').forEach((button) => {
  button.addEventListener('click', () => switchView(button.dataset.viewButton));
});


renderAll();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
