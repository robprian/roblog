const TelegramBot = require('node-telegram-bot-api');
const settings = require('../config/settings');
const tracker = require('./tracker');
const fs = require('fs');
const path = require('path');

class TelegramBotHandler {
  constructor() {
    this.bot = new TelegramBot(settings.telegram.token, { polling: true });
    this.setupCommands();
  }

  setupCommands() {
    // Command untuk mencatat aktivitas
    this.bot.onText(/\/log (.+)/, async (msg, match) => {
      if (!this.isAuthorizedUser(msg.from.id)) return;

      const activity = match[1];
      const result = await tracker.logActivity(activity);
      
      this.bot.sendMessage(msg.chat.id, `✅ Aktivitas tercatat:\n${activity}\n\nDisimpan di: ${result.file}`);
    });

    // Command untuk membuat post blog
    this.bot.onText(/\/post (.+)/, async (msg, match) => {
      if (!this.isAuthorizedUser(msg.from.id)) return;

      const content = match[1];
      const [title, ...bodyParts] = content.split(':');
      const body = bodyParts.join(':').trim();

      const fileName = `${new Date().toISOString().split('T')[0]}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
      const filePath = path.join(__dirname, '../data/blog', fileName);

      // Memastikan direktori blog ada
      const blogDir = path.join(__dirname, '../data/blog');
      if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
      }

      // Menyimpan post dalam format Markdown
      const postContent = `---\ntitle: ${title}\ndate: ${new Date().toISOString()}\n---\n\n${body}`;
      fs.writeFileSync(filePath, postContent);

      this.bot.sendMessage(msg.chat.id, `📝 Blog post tersimpan:\nJudul: ${title}\nFile: ${fileName}`);
    });

    // Command untuk mengupdate CV
    this.bot.onText(/\/cv update/, async (msg) => {
      if (!this.isAuthorizedUser(msg.from.id)) return;

      this.bot.sendMessage(msg.chat.id, '📄 Silakan kirim file CV baru dalam format Markdown');
      
      // Menunggu file CV baru
      this.bot.on('document', async (docMsg) => {
        if (docMsg.document.file_name.endsWith('.md')) {
          const file = await this.bot.getFile(docMsg.document.file_id);
          const cvPath = path.join(__dirname, '../data/cv.md');
          
          // Download dan simpan file CV
          const response = await fetch(file.file_path);
          const content = await response.text();
          fs.writeFileSync(cvPath, content);

          this.bot.sendMessage(msg.chat.id, '✅ CV berhasil diupdate!');
        }
      });
    });

    // Command untuk melihat airdrop terbaru
    this.bot.onText(/\/airdrop/, async (msg) => {
      if (!this.isAuthorizedUser(msg.from.id)) return;

      const airdropsPath = path.join(__dirname, '../data/airdrops.json');
      if (fs.existsSync(airdropsPath)) {
        const airdrops = JSON.parse(fs.readFileSync(airdropsPath, 'utf8'));
        const message = airdrops
          .map(a => `🎯 ${a.project}\nStatus: ${a.status}\nReward: ${a.reward}\nDeadline: ${a.deadline}\nLink: ${a.link}\n`)
          .join('\n');

        this.bot.sendMessage(msg.chat.id, `📢 Airdrop Terbaru:\n\n${message}`);
      } else {
        this.bot.sendMessage(msg.chat.id, '❌ Belum ada data airdrop tersedia.');
      }
    });
  }

  isAuthorizedUser(userId) {
    return settings.telegram.allowedUsers.includes(userId.toString());
  }
}

module.exports = new TelegramBotHandler();