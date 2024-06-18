# Portal E2E (portal-e2e)
The Portal E2E project tests the portal-ui project and through it all endpoints of the portal-api project.
```
.
├── README.md
├── global-setup.ts
├── package.json
├── playwright.config.ts
├── reporter.ts
├── resources
│   └── e2e.png
└── tests
    └── s1-authentication-and-authorization.spec.ts
```

- config.json is not committed to git but its structure is below
```
{
    "E2E_APP_URL": "http://localhost:9000",
    "E2E_USER": "<admin user here>",
    "E2E_PASSWORD": "<password here>",
    "E2E_UNIQUE_CONTEXT": "<initials here>",
    "E2E_LOG_FILE": "/tmp/e2e-log.txt"
}
```
- global-setup.ts extracts config.json definitions and create environment variables with them
- package.json contains the dependencies of the project
- playwright.config.ts contains the details on how playwright should run like screenshot if fails, video if fails etc.
- reporter.ts is a custom reporter that compiles in a json file in the test-results directory the result of the run, screenshot if fails, video if fails etc.
- resources/ is a directory to add any assets a test needs like it is the case of files to upload.
- tests/ is a directory that contains the tests whcih should be named starting with the scenario name with ".spec.ts" as extension.
 
# Preconditions
```
npm install @playwright/test
npx playwright install
```

# Run tests
```
npx playwright test 
```

# share content of the project
```
tree --gitignore
find ./ -type f -name "*" -not -path '*node_modules*' -not -path '*test-results*' -not -path '*resources*' -not -path '.git' -not -path '.gitignore' -exec sh -c 'echo "File: {}"; cat {}' \;
```
