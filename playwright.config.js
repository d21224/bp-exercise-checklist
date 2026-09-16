import {defineConfig, devices} from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  webServer: {
    command: 'python3 -m http.server 56280 --bind 127.0.0.1',
    port: 56280,
    reuseExistingServer: false
  },
  use: {
    baseURL: 'http://127.0.0.1:56280',
    ...devices['iPhone 13']
  }
});
