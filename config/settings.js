// Konfigurasi untuk Roblog 2.0

require('dotenv').config();

module.exports = {
  // Telegram Bot
  telegram: {
    token: process.env.TELEGRAM_BOT_TOKEN,
    allowedUsers: process.env.ALLOWED_TELEGRAM_USERS?.split(',') || []
  },

  // Ghost Blog
  ghost: {
    url: process.env.GHOST_URL,
    key: process.env.GHOST_API_KEY
  },

  // GitHub
  github: {
    token: process.env.GITHUB_TOKEN,
    repo: process.env.GITHUB_REPO,
    owner: process.env.GITHUB_OWNER
  },

  // Airdrop Sources
  airdropSources: [
    {
      name: 'Galxe',
      url: 'https://galxe.com',
      type: 'api'
    },
    {
      name: 'CoinMarketCap',
      url: 'https://coinmarketcap.com/airdrop',
      type: 'scrape'
    }
  ],

  // Web Server
  server: {
    port: process.env.PORT || 3000
  }
};