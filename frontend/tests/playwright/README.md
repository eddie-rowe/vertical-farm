# Instruqt tests

## Lab functionality test

Simulates a user starting and completing a track by validating that the challenge life cycle scripts (setup, check and solve) have been implemented correctly.

When you run this command, Instruqt starts a new instance of your track and simulates a learner going through the track by executing all challenge lifecycle scripts. 

```sh
instruqt track test
```

## 



npx playwright codegen https://play.instruqt.com/your-course-path --output script.js

This will:
- Open a browser window to the given URL.
- Record clicks, typing, navigation, etc.
- Output code in real time to the terminal (and optionally a file).
- Default to JavaScript, but can output other languages with a flag.


Inside this directory, you can run several commands:

  npx playwright test
    Runs the end-to-end tests.

  npx playwright test --ui
    Starts the interactive UI mode.

  npx playwright test --project=chromium
    Runs the tests only on Desktop Chrome.

  npx playwright test example
    Runs the tests in a specific file.

  npx playwright test --debug
    Runs the tests in debug mode.

  npx playwright codegen
    Auto generate tests with Codegen.

We suggest that you begin by typing:

    npx playwright test

And check out the following files:
  - ./tests/example.spec.ts - Example end-to-end test
  - ./tests-examples/demo-todo-app.spec.ts - Demo Todo App end-to-end tests
  - ./playwright.config.ts - Playwright Test configuration