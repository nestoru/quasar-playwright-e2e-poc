import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../config.json'), 'utf-8'));
const logFile = config.E2E_LOG_FILE || '/tmp/e2e-log.txt';

// Function to log messages to a file
const logToFile = (message: string) => {
    fs.appendFileSync(logFile, `${new Date().toISOString()} - ${message}\n`);
};

test.describe('Authentication and Authorization E2E Tests', () => {
    test('should perform login and user role verifications', async ({ page }) => {
        // Go to the url specified by mandatory E2E_APP_URL environment var
        const appUrl = config.E2E_APP_URL;
        const userEmail = config.E2E_USER;
        const userPassword = config.E2E_PASSWORD;
        const uniqueContext = config.E2E_UNIQUE_CONTEXT;

        if (!appUrl || !userEmail || !userPassword || !uniqueContext) {
            throw new Error('Missing required environment variables in config.json');
        }

        logToFile('Starting test - navigating to app URL');
        await page.goto(appUrl);

        // Assert that Password and Email fields are visible and that the "Use SSO" checkbox is unchecked
        logToFile('Checking visibility of Email and Password fields');
        await expect(page.locator('input[aria-label="Email"]')).toBeVisible();
        await expect(page.locator('input[aria-label="Password"]')).toBeVisible();
        const ssoCheckbox = page.locator('.q-checkbox');
        await expect(ssoCheckbox).not.toHaveClass(/q-checkbox--checked/);

        // Click on "Login" button
        logToFile('Clicking on Login button without filling fields');
        await page.click('button:has-text("Login")');
        // Assert div with content "Password is required" shows up
        await expect(page.locator('.text-negative:has-text("Password is required")')).toBeVisible();

        // Check "Use SSO" checkbox
        logToFile('Checking Use SSO checkbox and verifying Password field hides');
        await ssoCheckbox.click();
        // Assert the Password input disappears
        await expect(page.locator('input[aria-label="Password"]')).toBeHidden();

        // Click on "Login" button
        logToFile('Clicking on Login button with SSO checked');
        await page.click('button:has-text("Login")');
        // Assert div with content "Invalid credentials or unsupported provider" shows up
        await expect(page.locator('.text-negative:has-text("Invalid credentials or unsupported provider")')).toBeVisible();

        // Enter "anything@sample.com" in the email field
        logToFile('Entering invalid email and clicking Login');
        await page.fill('input[aria-label="Email"]', 'anything@sample.com');
        // Click on "Login" button
        await page.click('button:has-text("Login")');
        // Assert div with content "Invalid credentials or unsupported provider" shows up
        await expect(page.locator('.text-negative:has-text("Invalid credentials or unsupported provider")')).toBeVisible();

        // Enter mandatory E2E_USER env var in the Email field and mandatory E2E_PASSWORD env var in the Password field
        logToFile('Entering valid email and password');
        await page.fill('input[aria-label="Email"]', userEmail);
        await ssoCheckbox.click(); // Uncheck the "Use SSO" checkbox
        await page.fill('input[aria-label="Password"]', userPassword);
        // Click on "Login" button
        await page.click('button:has-text("Login")');

        // Click on the menu item "Users"
        logToFile('Waiting for Users menu item and clicking it');
        await page.waitForSelector('div.q-item__section:has-text("Users")', { state: 'visible' });
        await page.click('div.q-item__section:has-text("Users")');

        const createUser = async (email: string, firstName: string, lastName: string, role: string) => {
            logToFile(`Creating user: ${email}`);

            // Search for user
            logToFile('Waiting for search bar to be visible');
            await page.waitForSelector('input.q-field__native[placeholder="Search"]', { state: 'visible' });
            await page.fill('input.q-field__native[placeholder="Search"]', email);

            // Wait for the loading spinner to disappear
            logToFile('Waiting for loading spinner to disappear');
            await page.waitForSelector('.blurred-form', { state: 'hidden' });

            // Assert that a form appears with "Email", "First Name", "Last Name", and "Password" input fields; a checkbox called "Use SSO"; and a multi select called "Roles"
            const userRow = page.locator(`tr:has-text("${email}")`);
            if (await userRow.count() === 0) {
                logToFile('User not found, clicking Add button');
                await page.click('button:has-text("Add")');
            } else {
                logToFile('User found, clicking Edit button');
                await userRow.locator('button:has-text("Edit")').click();
            }

            logToFile('Verifying user form fields are visible');
            await expect(page.locator('input[aria-label="Email"]')).toBeVisible();
            await expect(page.locator('input[aria-label="First Name"]')).toBeVisible();
            await expect(page.locator('input[aria-label="Last Name"]')).toBeVisible();
            const passwordInput = page.locator('input[aria-label="Password"]');
            await expect(passwordInput).toBeVisible();
            const formSsoCheckbox = page.locator('.q-checkbox');
            await expect(formSsoCheckbox).toBeVisible();
            await expect(page.locator('.q-select')).toBeVisible();

            // Log the page content before interacting with the roles dropdown
            const pageContent = await page.content();
            fs.appendFileSync(logFile, `\nPage content before roles dropdown:\n${pageContent}\n`);

            // Complete the form with email, First Name, Last Name, unchecked "Use SSO", and Roles
            logToFile('Filling user form fields');
            await page.fill('input[aria-label="Email"]', email);
            await page.fill('input[aria-label="First Name"]', firstName);
            await page.fill('input[aria-label="Last Name"]', lastName);
            if (await formSsoCheckbox.getAttribute('aria-checked') === 'true') {
                await formSsoCheckbox.click(); // Ensure it is unchecked
            }
            await page.fill('input[aria-label="Password"]', userPassword); // Fill the password field since SSO is unchecked

            // Press tab to navigate to the roles dropdown and press enter to expand it
            logToFile('Pressing Tab from Password field to navigate to roles dropdown');
            await page.press('input[aria-label="Password"]', 'Tab');
            logToFile('Pressing Enter to expand roles dropdown');
            await page.press('input[role="combobox"][aria-label="Roles"]', 'Enter');

            // Log the page content after attempting to expand the dropdown
            const pageContentAfterClick = await page.content();
            fs.appendFileSync(logFile, `\nPage content after roles dropdown expansion:\n${pageContentAfterClick}\n`);

            // Ensure the role is selected
            logToFile('Selecting role');
            const roleInput = page.locator('div.q-field__native span');
            const selectedRole = await roleInput.innerText();
            if (!selectedRole.includes(role)) {
                const roleOption = page.locator(`div[role="option"]:has-text("${role}")`);
                await roleOption.click();
                // Wait for the role to be added to the input field
                await page.waitForFunction(
                    (role) => {
                        const selectedRoles = document.querySelector('div.q-field__native span').innerText;
                        return selectedRoles.includes(role);
                    },
                    role,
                    { timeout: 5000 }
                );
            }

            // Ensure the dropdown is closed
            logToFile('Ensuring dropdown is closed');
            await page.click('body', { force: true });

            // Wait for the "Save" button to be interactable and click it
            logToFile('Clicking Save button');
            const saveButton = page.locator('button span.block:has-text("Save")');
            await saveButton.waitFor({ state: 'visible' });
            await saveButton.click();
        };

        // Create users
        logToFile('Creating first user');
        await createUser(`e2e+allreports+${uniqueContext}@sample.com`, 'e2e', 'allreports', 'REPORT_READ_ALL');
        logToFile('Creating second user');
        await createUser(`e2e+physician_all_fields+${uniqueContext}@sample.com`, 'e2e', 'physician_all_fields', 'REPORT_READ_PHYSICIAN-ALL-FIELDS');

        // Click "Logoff" button
        logToFile('Logging off');
        await page.waitForSelector('div.q-item__section:has-text("Logoff")', { state: 'visible' });
        await page.click('div.q-item__section:has-text("Logoff")');

        // Enter email e2e+physician_all_fields+{E2E_UNIQUE_CONTEXT}@sample.com, password={E2E_PASSWORD}
        logToFile('Logging in as the second user');
        await page.fill('input[aria-label="Email"]', `e2e+physician_all_fields+${uniqueContext}@sample.com`);
        await page.fill('input[aria-label="Password"]', userPassword);
        // Click "Login" button
        await page.click('button:has-text("Login")');
        // Assert that menu items "Reports" and "Profile" are visible but "Users" is not
        await expect(page.locator('div.q-item__section:has-text("Reports")')).toBeVisible();
        await expect(page.locator('div.q-item__section:has-text("Profile")')).toBeVisible();
        await expect(page.locator('div.q-item__section:has-text("Users")')).toBeHidden();

        // Click on the "Reports" menu item
        logToFile('Navigating to Reports');
        await page.click('div.q-item__section:has-text("Reports")');
        // Assert that a list of reports show up with just one row containing physician_all_fields as content
        await page.waitForSelector('.blurred-form', { state: 'hidden' });
        await expect(page.locator('td:has-text("physician_all_fields")')).toBeVisible();

        // Click on "Profile" menu item
        logToFile('Navigating to Profile');
        await page.click('div.q-item__section:has-text("Profile")');
        
        // Wait for the loading spinner to disappear
        logToFile('Waiting for profile loading spinner to disappear');
        await page.waitForSelector('.blurred-form', { state: 'hidden' });

        // Assert the field labeled "Email" is read only
        await expect(page.locator('input[aria-label="Email"]')).toHaveAttribute('readonly', '');

        // Type "e2e physician_all_fields" in the field labeled "First Name"
        logToFile('Updating Profile information');
        await page.fill('input[aria-label="First Name"]', 'e2e physician_all_fields');
        // Collect current date to the seconds as saved_at
        const savedAt = new Date().toISOString();
        // Type the value of saved_at in the field labeled "Last Name"
        await page.fill('input[aria-label="Last Name"]', savedAt);

        // Click on the plus sign of the file upload widget and pick the file e2e.png
        logToFile('Uploading file');
        await page.setInputFiles('input[type="file"]', 'resources/e2e.png');
        // Click the "Save" button
        await page.click('button:has-text("Save")');
        // Wait for the loading spinner to disappear
        await page.waitForSelector('.blurred-form', { state: 'hidden' });

        // Refresh the page
        logToFile('Refreshing page');
        await page.reload();

        // Wait for the loading spinner to disappear
        await page.waitForSelector('.blurred-form', { state: 'hidden' });

        // Assert that "Last Name" is the value of saved_at
        await expect(page.locator('input[aria-label="Last Name"]')).toHaveValue(savedAt);

        // Logoff
        logToFile('Logging off to end the test');
        await page.click('div.q-item__section:has-text("Logoff")');
    });
});

