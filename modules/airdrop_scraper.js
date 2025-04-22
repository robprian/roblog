const cheerio = require('cheerio');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');
const settings = require('../config/settings');

class AirdropScraper {
  constructor() {
    this.dataPath = path.join(__dirname, '../data/airdrops.json');
    this.ensureDataFile();
  }

  ensureDataFile() {
    const dataDir = path.dirname(this.dataPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.dataPath)) {
      fs.writeFileSync(this.dataPath, '[]');
    }
  }

  async scrapeGalxe() {
    try {
      const response = await fetch('https://graphigo.prd.galaxy.eco/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{
            spaces(input: {first: 10, filter: {spaceStatus: [ACTIVE]}}) {
              nodes {
                name
                description
                thumbnail
                id
              }
            }
          }`
        })
      });

      const data = await response.json();
      return data.data.spaces.nodes.map(space => ({
        project: space.name,
        status: 'Active',
        reward: 'TBA',
        deadline: 'TBA',
        link: `https://galxe.com/${space.id}`,
        source: 'Galxe'
      }));
    } catch (error) {
      console.error('Error scraping Galxe:', error);
      return [];
    }
  }

  async scrapeCoinMarketCap() {
    try {
      const response = await fetch('https://coinmarketcap.com/airdrop/');
      const html = await response.text();
      const $ = cheerio.load(html);

      const airdrops = [];
      $('.cmc-airdrop-listing').each((i, elem) => {
        const project = $(elem).find('.title').text().trim();
        const status = $(elem).find('.status').text().trim();
        const reward = $(elem).find('.reward').text().trim();
        const deadline = $(elem).find('.deadline').text().trim();
        const link = $(elem).find('.link a').attr('href');

        airdrops.push({
          project,
          status,
          reward,
          deadline,
          link: `https://coinmarketcap.com${link}`,
          source: 'CoinMarketCap'
        });
      });

      return airdrops;
    } catch (error) {
      console.error('Error scraping CoinMarketCap:', error);
      return [];
    }
  }

  async updateAirdrops() {
    try {
      // Mengambil data dari berbagai sumber
      const galxeAirdrops = await this.scrapeGalxe();
      const cmcAirdrops = await this.scrapeCoinMarketCap();

      // Menggabungkan semua data
      const allAirdrops = [...galxeAirdrops, ...cmcAirdrops];

      // Filter airdrop yang aktif
      const activeAirdrops = allAirdrops.filter(airdrop => 
        airdrop.status.toLowerCase().includes('active') ||
        airdrop.status.toLowerCase().includes('launching')
      );

      // Menyimpan data ke file
      fs.writeFileSync(this.dataPath, JSON.stringify(activeAirdrops, null, 2));

      return activeAirdrops;
    } catch (error) {
      console.error('Error updating airdrops:', error);
      return [];
    }
  }

  getStoredAirdrops() {
    try {
      const data = fs.readFileSync(this.dataPath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error reading airdrops:', error);
      return [];
    }
  }
}

module.exports = new AirdropScraper();