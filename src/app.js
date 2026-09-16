import {
  calculateWeekProgress,
  classifyHomeBloodPressure,
  createEmptyState,
  getPlanForDay,
  getWeekKey,
  localDateKey,
  saveBloodPressure,
  toggleTask
} from './app-core.js';

const STORAGE_KEY = 'bp-exercise-checklist-v1-state';
const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const today = new Date();
const todayKey = localDateKey(today);
let activePeriod = 'morning';
let state = loadState();

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && saved.completions && saved.bloodPressure ? saved : createEmptyState();
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

function renderBloodPressure() {
  const readings = state.bloodPressure?.[todayKey] || {};
  const current = readings[activePeriod];
  const feedback = document.querySelector('#bp-feedback');
  document.querySelector('#bp-save').textContent = `${activePeriod === 'morning' ? '아침' : '저녁'} 혈압 저장`;
  document.querySelectorAll('[data-period]').forEach((button) => {
    const selected = button.dataset.period === activePeriod;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  if (current) {
    document.querySelector('#systolic').value = current.systolic;
    document.querySelector('#diastolic').value = current.diastolic;
    const category = classifyHomeBloodPressure(current.systolic, current.diastolic);
    feedback.innerHTML = `<div class="bp-result ${category.level}"><strong>${current.systolic} / ${current.diastolic}</strong><span>${category.label}</span></div>`;
  } else {
    document.querySelector('#systolic').value = '';
    document.querySelector('#diastolic').value = '';
    feedback.innerHTML = '';
  }

  const entries = Object.entries(state.bloodPressure)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7)
    .flatMap(([date, periods]) => ['morning', 'evening']
      .filter((period) => periods[period])
      .map((period) => ({date, period, ...periods[period]})));
  document.querySelector('#bp-history').innerHTML = entries.length
    ? entries.map((entry) => `<div class="history-item"><span>${entry.date.slice(5).replace('-', '.')} · ${entry.period === 'morning' ? '아침' : '저녁'}</span><strong>${entry.systolic} / ${entry.diastolic}</strong></div>`).join('')
    : '<div class="history-item"><span>아직 저장된 기록이 없습니다.</span></div>';
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
  renderBloodPressure();
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

document.querySelectorAll('[data-period]').forEach((button) => {
  button.addEventListener('click', () => {
    activePeriod = button.dataset.period;
    renderBloodPressure();
  });
});

document.querySelector('#bp-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const systolic = Number(document.querySelector('#systolic').value);
  const diastolic = Number(document.querySelector('#diastolic').value);
  if (!Number.isFinite(systolic) || !Number.isFinite(diastolic)) return;
  state = saveBloodPressure(state, todayKey, activePeriod, systolic, diastolic);
  const taskId = activePeriod === 'morning' ? 'morning-bp' : 'evening-bp';
  if (!state.completions?.[todayKey]?.[taskId]) state = toggleTask(state, todayKey, taskId);
  persist();
  renderAll();
});

renderAll();

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js'));
}
