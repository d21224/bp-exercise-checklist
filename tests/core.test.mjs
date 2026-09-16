import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getWeekKey,
  getPlanForDay,
  calculateWeekProgress,
  classifyHomeBloodPressure,
  createEmptyState,
  toggleTask,
  saveBloodPressure
} from '../src/app-core.js';

test('week key starts on Monday in local calendar', () => {
  assert.equal(getWeekKey(new Date(2026, 8, 17)), '2026-09-14');
  assert.equal(getWeekKey(new Date(2026, 8, 20)), '2026-09-14');
});

test('weekday plan includes daily habits and the correct main workout', () => {
  const monday = getPlanForDay(new Date(2026, 8, 14));
  assert.equal(monday.some((item) => item.id === 'morning-bp'), true);
  assert.equal(monday.some((item) => item.id === 'stairs'), true);
  assert.equal(monday.some((item) => item.id === 'workout-walk-35'), true);

  const saturday = getPlanForDay(new Date(2026, 8, 19));
  assert.equal(saturday.some((item) => item.id === 'stairs'), false);
  assert.equal(saturday.some((item) => item.id === 'workout-bike-60'), true);
});

test('every main workout includes concrete step-by-step actions', () => {
  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date(2026, 8, 14 + offset);
    const workout = getPlanForDay(date).find((item) =>
      item.id.startsWith('workout') || item.id.startsWith('strength') || item.id.startsWith('recovery')
    );
    assert.ok(Array.isArray(workout.steps));
    assert.ok(workout.steps.length >= 2);
  }

  const thursday = getPlanForDay(new Date(2026, 8, 17)).find((item) => item.id === 'strength-thu');
  assert.ok(thursday.steps.some((step) => step.includes('레그프레스')));
  assert.ok(thursday.steps.some((step) => step.includes('체스트프레스')));
  assert.ok(thursday.steps.some((step) => step.includes('실내자전거')));
});

test('task completion persists as a date-scoped boolean', () => {
  const state = createEmptyState();
  const changed = toggleTask(state, '2026-09-17', 'strength-thu');
  assert.equal(changed.completions['2026-09-17']['strength-thu'], true);
  const reverted = toggleTask(changed, '2026-09-17', 'strength-thu');
  assert.equal(reverted.completions['2026-09-17']['strength-thu'], false);
});

test('weekly progress counts only planned tasks', () => {
  const state = createEmptyState();
  state.completions['2026-09-14'] = {'morning-bp': true};
  const progress = calculateWeekProgress(state, new Date(2026, 8, 14));
  assert.equal(progress.done, 1);
  assert.ok(progress.total > 1);
  assert.equal(progress.percent, Math.round(100 / progress.total));
});

test('blood pressure values save by date and period', () => {
  const saved = saveBloodPressure(createEmptyState(), '2026-09-17', 'morning', 127, 91);
  assert.deepEqual(saved.bloodPressure['2026-09-17'].morning, {systolic: 127, diastolic: 91});
});

test('home blood pressure classification flags diastolic 85 or higher', () => {
  assert.equal(classifyHomeBloodPressure(127, 91).level, 'high');
  assert.equal(classifyHomeBloodPressure(127, 79).level, 'ok');
  assert.equal(classifyHomeBloodPressure(181, 121).level, 'urgent');
});
