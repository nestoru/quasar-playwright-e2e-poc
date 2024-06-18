import { FullConfig } from '@playwright/test';
import fs from 'fs';

async function globalSetup(config: FullConfig) {
    const cfg = JSON.parse(fs.readFileSync('./config.json', 'utf-8'));

    process.env.E2E_APP_URL = cfg.E2E_APP_URL;
    process.env.E2E_USER = cfg.E2E_USER;
    process.env.E2E_PASSWORD = cfg.E2E_PASSWORD;
    process.env.E2E_UNIQUE_CONTEXT = cfg.E2E_UNIQUE_CONTEXT;
}

export default globalSetup;

