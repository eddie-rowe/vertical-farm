const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // show the browser
  const page = await browser.newPage();

  // 1. Go to your Instruqt course URL
  await page.goto('https://play.instruqt.com/your-course-path');

  // 2. Start the course
  await page.click('text=Start Track'); // adjust text if needed
  await page.waitForSelector('text=Step 1'); // wait for course to load

  // 3. Simulate terminal input (if terminal is available)
  await page.click('.xterm-helper-textarea'); // focuses terminal
  await page.keyboard.type('ls');
  await page.keyboard.press('Enter');

  // 4. Wait and evaluate output (e.g., check for expected file)
  await page.waitForTimeout(2000); // let command run
  const output = await page.locator('.xterm-accessibility-tree div').innerText();
  console.log('Terminal Output:', output);

  // 5. Check for progress (optional)
  const progressText = await page.textContent('.progress-bar-label');
  console.log('Progress:', progressText);

  await browser.close();
})();
