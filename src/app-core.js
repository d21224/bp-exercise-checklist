const WORKDAY = [
  {id: 'stairs', title: '회사 계단 12층', detail: '대화 가능한 속도로'},
  {id: 'move-breaks', title: '근무 중 움직이기', detail: '점심 후 10분 걷기 + 틈틈이 일어나기'}
];

const WORKOUTS = {
  0: {
    id: 'recovery-sun', title: '산책 30분 + 스트레칭 10분', detail: '피곤하면 완전 휴식',
    steps: ['편한 속도로 산책 30분', '종아리·허벅지·등 스트레칭 10분']
  },
  1: {
    id: 'workout-walk-35', title: '빠르게 걷기 35분', detail: '대화 가능한 중강도',
    steps: ['천천히 걷기 5분', '빠르게 걷기 25분', '천천히 걷기 5분']
  },
  2: {
    id: 'strength-tue', title: '전신 근력운동 35~40분', detail: '각 10~15회 × 1~2세트 · 숨 참지 않기',
    steps: ['실내자전거 준비운동 5분', '레그프레스 10~15회 × 1~2세트', '랫풀다운 10~15회 × 1~2세트', '체스트프레스 10~15회 × 1~2세트', '시티드로우 10~15회 × 1~2세트', '레그컬 또는 맨몸 스쿼트 10~15회 × 1~2세트', '천천히 걷기·스트레칭 5분']
  },
  3: {
    id: 'workout-cardio-40', title: '자전거 또는 빠르게 걷기 35~40분', detail: '대화 가능한 중강도',
    steps: ['천천히 준비운동 5분', '평지 자전거 또는 빠르게 걷기 25~30분', '속도를 낮춰 마무리 5분']
  },
  4: {
    id: 'strength-thu', title: '전신 근력 30분 + 유산소 10분', detail: '중량보다 자세와 호흡',
    steps: ['실내자전거 준비운동 5분', '레그프레스 10~15회 × 1~2세트', '체스트프레스 10~15회 × 1~2세트', '랫풀다운 10~15회 × 1~2세트', '시티드로우 10~15회 × 1~2세트', '레그컬 또는 맨몸 스쿼트 10~15회 × 1~2세트', '실내자전거 또는 걷기 10분']
  },
  5: {
    id: 'recovery-fri', title: '회복 걷기 25~30분', detail: '피곤하면 천천히',
    steps: ['편한 속도로 걷기 20~25분', '종아리·허벅지 스트레칭 5분']
  },
  6: {
    id: 'workout-bike-60', title: '공원 자전거 50~60분', detail: '평지 위주 · 무리한 오르막 피하기',
    steps: ['가볍게 페달 돌리기 10분', '대화 가능한 속도로 30~40분', '속도를 낮춰 마무리 10분']
  }
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
  const items = [];
  if (day >= 1 && day <= 5) items.push(...WORKDAY);
  items.push(WORKOUTS[day]);
  return items.map((item) => ({...item}));
}

export function createEmptyState() {
  return {completions: {}, startDate: localDateKey(new Date())};
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
