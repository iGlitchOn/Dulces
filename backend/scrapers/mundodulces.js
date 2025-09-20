// Heurístico con Puppeteer — ajusta selectores según páginas reales
const puppeteer = require('puppeteer')

async function scrape() {
  const base = 'https://mundodulces17.com'
  const results = []

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  try {
    const page = await browser.newPage()
    await page.goto(base, { waitUntil: 'networkidle2', timeout: 30000 })

    const cards = await page.$$(
      'article, .product, .product-item, .producto, .card'
    )

    for (let i = 0; i < Math.min(cards.length, 12); i++) {
      try {
        const el = cards[i]
        const name = (await el.$eval('h2, .product-title, .woocommerce-loop-product__title, .title', n => n.innerText).catch(()=>'')).trim()
        const price = (await el.$eval('.price, .amount, .woocommerce-Price-amount', p => p.innerText).catch(()=>'')) || ''
        const url = (await el.$eval('a', a => a.href).catch(()=>base))
        if (name || price) {
          results.push({ name: name || 'sin-nombre', price: price || 'sin-precio', url, source: 'mundodulces' })
        }
      } catch (e) {
        // ignora tarjeta
      }
    }
  } finally {
    await browser.close()
  }
  return results
}

module.exports = { scrape }