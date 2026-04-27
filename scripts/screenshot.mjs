/**
 * Takes screenshots of all app views using Puppeteer.
 * Run inside Docker: docker run --rm -v $(pwd):/app ...
 */
import puppeteer from "puppeteer"
import { mkdir } from "fs/promises"
import { existsSync } from "fs"

const BASE = process.env.APP_URL || "http://host-gateway:3000"
const OUT  = "/app/docs/screenshots"

await mkdir(OUT, { recursive: true })

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
})

const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 800 })

async function shot(name, fn) {
  console.log(`📸  ${name}`)
  await fn()
  await page.waitForNetworkIdle({ idleTime: 800, timeout: 10000 }).catch(() => {})
  await new Promise(r => setTimeout(r, 600))
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: true })
}

// 1. Overview tab (default)
await shot("01-overview", async () => {
  await page.goto(BASE, { waitUntil: "networkidle2" })
})

// 2. Add Expense form
await shot("02-add-expense", async () => {
  await page.click('[data-state="inactive"][id*="trigger-add"]')
  await page.waitForSelector("form")
})

// 3. Add Expense form — filled in
await shot("03-add-expense-filled", async () => {
  await page.type('input[id="amount"]', "42.50")
  await page.click('[id*="trigger-category"], button[role="combobox"]')
  await page.waitForSelector('[role="option"]')
  await page.click('[role="option"]:first-child')
  await page.type('textarea[id="description"]', "Team lunch")
})

// 4. Analytics tab
await shot("04-analytics", async () => {
  await page.goto(BASE, { waitUntil: "networkidle2" })
  await page.click('[id*="trigger-analytics"]')
  await new Promise(r => setTimeout(r, 1200))
})

// 5. Tests tab
await shot("05-tests", async () => {
  await page.goto(BASE, { waitUntil: "networkidle2" })
  await page.click('[id*="trigger-tests"]')
  await page.waitForSelector('button:has-text("Run Tests"), button')
})

// 6. Tests tab — running
await shot("06-tests-running", async () => {
  // Click Run Tests button
  const btn = await page.$('button')
  const buttons = await page.$$('button')
  for (const b of buttons) {
    const text = await b.evaluate(el => el.textContent)
    if (text?.includes("Run Tests")) {
      await b.click()
      await new Promise(r => setTimeout(r, 800))
      break
    }
  }
})

// 7. Tests tab — results
await shot("07-tests-results", async () => {
  await new Promise(r => setTimeout(r, 6000)) // wait for all tests to complete
})

// 8. Mobile view — overview
await shot("08-mobile-overview", async () => {
  await page.setViewport({ width: 390, height: 844 })
  await page.goto(BASE, { waitUntil: "networkidle2" })
})

await browser.close()
console.log(`\n✅  Screenshots saved to docs/screenshots/`)
