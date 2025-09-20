const express = require('express')
const cors = require('cors')
const path = require('path')

const dicoha = require('./scrapers/dicoha')
const mundodulces = require('./scrapers/mundodulces')

const app = express()
app.use(cors())
app.use(express.json())

// Simple in-memory cache to avoid scraping on every request
const CACHE_TTL_MS = 60 * 1000
let cache = { ts: 0, data: null }

app.get('/api/prices', async (req, res) => {
  if (Date.now() - cache.ts < CACHE_TTL_MS && cache.data) {
    return res.json(cache.data)
  }

  try {
    // Run scrapers in parallel
    const [r1, r2] = await Promise.all([
      dicoha.scrape(),
      mundodulces.scrape()
    ])
    const merged = [...r1, ...r2]
    cache = { ts: Date.now(), data: merged }
    res.json(merged)
  } catch (err) {
    console.error('Scrape error', err)
    res.status(500).send('Error scraping sites: ' + err.message)
  }
})

// Serve frontend in production if built
app.use(express.static(path.join(__dirname, '..', 'frontend', 'dist')))
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'dist', 'index.html'))
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`Backend listening on ${PORT}`))