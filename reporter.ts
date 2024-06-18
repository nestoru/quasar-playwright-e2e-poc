import { Reporter } from '@playwright/test';
import fs from 'fs';
import path from 'path';

class JSONReporter implements Reporter {
    private results: any[] = [];
    private testFilePath: string | null = null;  // Initialize to null

    onTestBegin(test) {
        // Ensure we capture the test file path at the beginning of each test
        if (!this.testFilePath) {
            this.testFilePath = test.location.file;
        }
    }

    onTestEnd(test, result) {
        if (!this.testFilePath) {
            console.error('Test file path not set.');
            return;
        }
        const testFileName = path.basename(this.testFilePath, '.ts');
        // Clean the error message
        const cleanedErrorMessage = result.error?.message.replace(/\x1B\[[0-9;]*[JKmsu]/g, '');
        // Collect results
        const data = {
            title: test.title,
            status: result.status,
            error: cleanedErrorMessage, // Use the cleaned error message
            duration: result.duration,
            testFileName: testFileName  // Include the file name in the test result
        };
        this.results.push(data);
    }

    async onEnd() {
        if (!this.testFilePath) {
            console.error('No tests were run or test file path was not captured.');
            return; // Early exit if testFilePath was never set
        }

        const outputDir = './test-results/json';
        const testFileName = path.basename(this.testFilePath, '.ts');
        const reportFileName = `report-${testFileName}.json`;
        const filePath = path.join(outputDir, reportFileName);

        // Ensure the directory exists
        await fs.promises.mkdir(outputDir, { recursive: true }).catch(console.error);

        // Write the consolidated report for this test file
        await fs.promises.writeFile(filePath, JSON.stringify(this.results, null, 2))
            .then(() => console.log(`Consolidated report generated for: ${filePath}`))
            .catch(err => console.error(`Error writing report file: ${filePath}`, err));
    }
}

module.exports = JSONReporter;

