import { defineConfig } from '@playwright/test';
import JSONReporter from './reporter';
import fs from 'fs';

// Load environment variables from config.json
const config = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

export default defineConfig({
    reporter: [
        ['line'],
        ['./reporter.ts']
    ],
    use: {
        headless: false,
        launchOptions: {
            slowMo: 0,
        },
        video: {
            mode: 'retain-on-failure',
            dir: './test-results/videos'
        },
        screenshot: {
            mode: 'only-on-failure',
            path: './test-results/screenshots'
        },
        baseURL: config.E2E_APP_URL // Use baseURL for your app URL
    },
    timeout: 600000, // Global test timeout
    expect: {
        timeout: 10000 // Default expect timeout
    },
    globalSetup: './global-setup.ts' // Add global setup to load config
});

