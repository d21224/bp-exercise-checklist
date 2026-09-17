import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('today checklist persists after reload', async ({page}) => {
  await expect(page.getByRole('heading', {name: '오늘의 운동 루틴'})).toBeVisible();
  const firstTask = page.locator('[data-task-id]').first();
  await firstTask.click();
  await expect(firstTask).toHaveAttribute('data-completed', 'true');
  await page.reload();
  await expect(page.locator('[data-task-id]').first()).toHaveAttribute('data-completed', 'true');
});

test('app contains exercise and activity only with no blood pressure UI', async ({page}) => {
  await expect(page.getByText('혈압 기록')).toHaveCount(0);
  await expect(page.getByText('회사 계단 12층')).toBeVisible();
  await expect(page.locator('#task-list').getByText(/전신 근력 30분/)).toBeVisible();
  await expect(page.locator('#task-list').getByText(/레그프레스/)).toBeVisible();
});

test('weekly view shows all seven days and progress', async ({page}) => {
  await page.getByRole('button', {name: '주간 보기'}).click();
  await expect(page.locator('[data-week-day]')).toHaveCount(7);
  await expect(page.getByText(/이번 주 \d+% 완료/)).toBeVisible();
  const thursday = page.locator('[data-week-day]').filter({hasText: '목요일'});
  await expect(thursday.getByText(/레그프레스/)).toBeVisible();
  await expect(thursday.getByText(/체스트프레스/)).toBeVisible();
});

test('mobile layout does not overflow horizontally', async ({page}) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
