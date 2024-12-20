import { chromium } from 'playwright'
import pixelmatch from 'pixelmatch'
import { PNG } from 'pngjs'
import fs from 'fs-extra'
import cron from 'node-cron'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const CONFIG = {
  urls: [
    'https://www.okx.com/web3/build/docs/waas/dex-get-aggregator-supported-chains',
    'https://www.okx.com/web3/build/docs/waas/dex-get-tokens',
    'https://www.okx.com/web3/build/docs/waas/dex-get-liquidity',
    'https://www.okx.com/web3/build/docs/waas/dex-approve-transaction',
    'https://www.okx.com/web3/build/docs/waas/dex-get-quote',
    'https://www.okx.com/web3/build/docs/waas/dex-swap',
    'https://www.okx.com/web3/build/docs/waas/dex-get-supported-chains',
    'https://www.okx.com/web3/build/docs/waas/dex-crosschain-get-tokens',
    'https://www.okx.com/web3/build/docs/waas/dex-get-supported-tokens',
    'https://www.okx.com/web3/build/docs/waas/dex-get-supported-bridge-tokens-pairs',
    'https://www.okx.com/web3/build/docs/waas/dex-get-supported-bridges',
    'https://www.okx.com/web3/build/docs/waas/dex-get-route-information',
    'https://www.okx.com/web3/build/docs/waas/dex-crosschain-approve-transaction',
    'https://www.okx.com/web3/build/docs/waas/dex-crosschain-swap',
    'https://www.okx.com/web3/build/docs/waas/dex-get-transaction-status',
  ],
  screenshotDir: path.join(__dirname, 'screenshots'),
  diffDir: path.join(__dirname, 'diffs'),
  viewport: { width: 1280, height: 800 },
}

function getUrlIdentifier(url) {
  const urlObj = new URL(url);
  // Get the path without leading and trailing slashes, replace remaining slashes with dashes
  const path = urlObj.pathname.replace(/^\/|\/$/g, '').replace(/\//g, '-');
  // Combine hostname and path, replace dots with dashes
  return `${urlObj.hostname.replace(/\./g, '-')}_${path}`;
}

async function captureScreenshot(url) {
  const browser = await chromium.launch()
  const page = await browser.newPage()

  await page.setViewportSize(CONFIG.viewport)
  await page.goto(url, { waitUntil: 'networkidle' })

  // Wait for any animations to complete
  await page.waitForTimeout(2000)

  const timestamp = new Date().toISOString().split('T')[0]
  const urlId = getUrlIdentifier(url)
  const screenshotPath = path.join(CONFIG.screenshotDir, `${urlId}_${timestamp}.png`)

  await page.screenshot({ path: screenshotPath, fullPage: true })
  await browser.close()

  return screenshotPath
}

async function compareScreenshots(url) {
  const urlId = getUrlIdentifier(url)
  const files = await fs.readdir(CONFIG.screenshotDir)
  const urlFiles = files
    .filter((f) => f.startsWith(urlId) && f.endsWith('.png'))
    .sort()
    .reverse()

  if (urlFiles.length < 2) return null

  const newScreenshot = path.join(CONFIG.screenshotDir, urlFiles[0])
  const previousScreenshot = path.join(CONFIG.screenshotDir, urlFiles[1])

  const img1 = PNG.sync.read(await fs.readFile(previousScreenshot))
  const img2 = PNG.sync.read(await fs.readFile(newScreenshot))

  const { width, height } = img1
  const diff = new PNG({ width, height })

  const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 })

  if (numDiffPixels > 0) {
    const timestamp = path.basename(newScreenshot, '.png').split('_').pop()
    const diffPath = path.join(CONFIG.diffDir, `${urlId}_diff_${timestamp}.png`)
    await fs.writeFile(diffPath, PNG.sync.write(diff))
    return {
      diffPath,
      numDiffPixels,
      previousScreenshot,
      newScreenshot,
      url,
    }
  }

  return null
}

async function init() {
  await fs.ensureDir(CONFIG.screenshotDir)
  await fs.ensureDir(CONFIG.diffDir)
}

async function runVisualDiff() {
  try {
    console.log('Starting visual diff check...')

    for (const url of CONFIG.urls) {
      console.log(`Processing ${url}...`)
      const newScreenshot = await captureScreenshot(url)
      console.log(`Screenshot captured: ${newScreenshot}`)

      const diffResult = await compareScreenshots(url)
      if (diffResult) {
        console.log(`Visual differences detected for ${url}!`)
        console.log(`Number of different pixels: ${diffResult.numDiffPixels}`)
        console.log(`Diff image saved: ${diffResult.diffPath}`)
      } else {
        console.log(`No visual differences detected for ${url}`)
      }
    }
  } catch (error) {
    console.error('Error in visual diff process:', error)
  }
}

// Initialize directories
await init()

// Run immediately once
await runVisualDiff()

// Schedule to run daily at midnight
cron.schedule('0 0 * * *', runVisualDiff)

console.log('Visual diff service started. Running daily at midnight.')
