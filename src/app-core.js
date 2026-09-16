const DAILY = [
  {id: 'morning-bp', title: '아침 혈압 기록', detail: '화장실 후 · 커피와 식사 전'},
  {id: 'evening-bp', title: '저녁 혈압 기록', detail: '앉아서 5분 쉰 뒤'}
];

const WORKDAY = [
  {id: 'stairs', title: '회사 계단 12층', detail: '대화 가능한 속도로'},
  {id: 'move-breaks', title: '근무 중 움직이기', detail: '점심 후 10분 걷기 + 틈틈이 일어나기'}
];

const WORKOUTS = {
  0: {id: 'recovery-sun', title: '산책 30분 + 스트레칭 10분', detail: '피곤하면 완전 휴식'},
  1: {id: 'workout-walk-35', title: '빠르게 걷기 35분', detail: '준비 5분 · 빠르게 25분 · 정리 5분'},
  2: {id: 'strength-tue', title: '전신 근력운동 35~40분', detail: '각 10~15회 × 1~2세트 · 숨 참지 않기'},
  3: {id: 'workout-cardio-40', title: '자전거 또는 빠르게 걷기 35~40분', detail: '대화 가능한 중강도'},
  4: {id: 'strength-thu', title: '전신 근력 30분 + 가벼운 유산소 10분', detail: '중량보다 자세와 호흡'},
  5: {id: 'recovery-fri', title: '회복 걷기 25~30분', detail: '피곤하면 천천히'},
  6: {id: 'workout-bike-60', title: '공원 자전거 50~60분', detail: '준비 10분 · 중강도 30~40분 · 정리 10분'}
};

function localDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekKey(date) {
  const monday = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (monday.getDay() + 6) % 7;
  monday.setDate(monday.getDate() - offset);
  return localDateKey(monday);
}

export function getPlanForDay(date) {
  const day = date.getDay();
  const items = [DAILY[0]];
  if (day >= 1 && day <= 5) items.push(...WORKDAY);
  items.push(WORKOUTS[day], DAILY[1]);
  return items.map((item) => ({...item}));
}

export function createEmptyState() {
  return {completions: {}, bloodPressure: {}, startDate: localDateKey(new Date())};
}

export function toggleTask(state, dateKey, taskId) {
  const current = Boolean(state.completions?.[dateKey]?.[taskId]);
  return {
    ...state,
    completions: {
      ...state.completions,
      [dateKey]: {...state.completions?.[dateKey], [taskId]: !current}
    }
  };
}

export function saveBloodPressure(state, dateKey, period, systolic, diastolic) {
  return {
    ...state,
    bloodPressure: {
      ...state.bloodPressure,
      [dateKey]: {
        ...state.bloodPressure?.[dateKey],
        [period]: {systolic: Number(systolic), diastolic: Number(diastolic)}
      }
    }
  };
}

export function classifyHomeBloodPressure(systolic, diastolic) {
  if (systolic >= 180 || diastolic >= 120) {
    return {level: 'urgent', label: '매우 높음 · 재측정 후 의료기관 문의'};
  }
  if (systolic >= 135 || diastolic >= 85) {
    return {level: 'high', label: '가정혈압 기준보다 높음'};
  }
  return {level: 'ok', label: '가정혈압 기준 범위'};
}

export function calculateWeekProgress(state, date) {
  const mondayKey = getWeekKey(date);
  const monday = new Date(`${mondayKey}T12:00:00`);
  let done = 0;
  let total = 0;
  for (let index = 0; index < 7; index += 1) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const dateKey = localDateKey(current);
    const plan = getPlanForDay(current);
    total += plan.length;
    done += plan.filter((item) => state.completions?.[dateKey]?.[item.id]).length;
  }
  return {done, total, percent: total ? Math.round((done / total) * 100) : 0};
}

export {localDateKey};
