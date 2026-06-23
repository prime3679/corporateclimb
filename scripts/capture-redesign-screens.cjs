const { chromium } = require('@playwright/test')
;(async () => {
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  })
  await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle' })
  await page.screenshot({ path: 'artifacts/redesign-title-mobile.png', fullPage: true })
  await page.getByRole('button', { name: /START CLIMB|PRESS START|NEW CLIMB/i }).click()
  await page.screenshot({ path: 'artifacts/redesign-class-mobile.png', fullPage: true })
  await browser.close()
})()
