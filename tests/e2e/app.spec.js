import {test, expect} from '@playwright/test';

test.beforeEach(async ({page}) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('today checklist persists after reload', async ({page}) => {
  await expect(page.getByRole('heading', {name: '오늘의 혈압 운동'})).toBeVisible();
  const firstTask = page.locator('[data-task-id]').first();
  await firstTask.click();
  await expect(firstTask).toHaveAttribute('data-completed', 'true');
  await page.reload();
  await expect(page.locator('[data-task-id]').first()).toHaveAttribute('data-completed', 'true');
});

test('blood pressure record saves and reports home threshold', async ({page}) => {
  await page.getByRole('button', {name: '혈압 기록', exact: true}).click();
  await page.getByLabel('수축기 혈압').fill('127');
  await page.getByLabel('이완기 혈압').fill('91');
  await page.getByRole('button', {name: '아침 혈압 저장'}).click();
  await expect(page.locator('#bp-feedback').getByText('127 / 91')).toBeVisible();
  await expect(page.getByText('가정혈압 기준보다 높음')).toBeVisible();
});

test('weekly view shows all seven days and progress', async ({page}) => {
  await page.getByRole('button', {name: '주간 보기'}).click();
  await expect(page.locator('[data-week-day]')).toHaveCount(7);
  await expect(page.getByText(/이번 주 \d+% 완료/)).toBeVisible();
});

test('mobile layout does not overflow horizontally', async ({page}) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
