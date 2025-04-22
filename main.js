const express = require('express');
const path = require('path');
const cron = require('node-cron');
const settings = require('./config/settings');

// Import modul-modul
const telegramBot = require('./modules/telegram_bot');
const airdropScraper = require('./modules/airdrop_scraper');
const tracker = require('./modules/tracker');
const ghostUploader = require('./modules/ghost_uploader');

// Inisialisasi Express
const app = express();

// Konfigurasi view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware untuk static files
app.use(express.static(path.join(__dirname, 'public')));

// Route untuk halaman utama (CV/Resume)
app.get('/', (req, res) => {
  const cvPath = path.join(__dirname, 'data/cv.md');
  res.render('cv', { cv: require('fs').readFileSync(cvPath, 'utf8') });
});

// Route untuk halaman airdrop
app.get('/airdrop', (req, res) => {
  const airdrops = airdropScraper.getStoredAirdrops();
  res.render('airdrop', { airdrops });
});

// Route untuk halaman blog
app.get('/blog', (req, res) => {
  const blogDir = path.join(__dirname, 'data/blog');
  const posts = require('fs').readdirSync(blogDir)
    .filter(file => file.endsWith('.md'))
    .map(file => {
      const content = require('fs').readFileSync(path.join(blogDir, file), 'utf8');
      const [, frontMatter, body] = content.split('---');
      const metadata = frontMatter.split('\n')
        .reduce((acc, line) => {
          const [key, value] = line.split(': ');
          if (key && value) acc[key.trim()] = value.trim();
          return acc;
        }, {});
      return { ...metadata, body, file };
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.render('blog', { posts });
});

// Route untuk halaman project
app.get('/project', (req, res) => {
  const projectsDir = path.join(__dirname, 'projects');
  const projects = [];

  if (require('fs').existsSync(projectsDir)) {
    const categories = require('fs').readdirSync(projectsDir);
    categories.forEach(category => {
      const categoryPath = path.join(projectsDir, category);
      if (require('fs').statSync(categoryPath).isDirectory()) {
        const items = require('fs').readdirSync(categoryPath)
          .map(item => ({
            name: item,
            path: path.join(category, item),
            updated: require('fs').statSync(path.join(categoryPath, item)).mtime
          }));
        projects.push({ category, items });
      }
    });
  }

  res.render('project', { projects });
});

// Cron job untuk update airdrop setiap 6 jam
cron.schedule('0 */6 * * *', async () => {
  console.log('Updating airdrops...');
  await airdropScraper.updateAirdrops();
});

// Cron job untuk daily digest setiap malam
cron.schedule('0 22 * * *', async () => {
  const today = new Date().toISOString().split('T')[0];
  const logs = tracker.getDailyLogs(today);
  if (logs) {
    await ghostUploader.createDailyDigest(today, logs);
  }
});

// Mulai server
const PORT = settings.server.port;
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});