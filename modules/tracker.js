const fs = require('fs');
const path = require('path');
const { Octokit } = require('octokit');
const settings = require('../config/settings');

class ActivityTracker {
  constructor() {
    this.logsDir = path.join(__dirname, '../data/logs');
    this.octokit = new Octokit({ auth: settings.github.token });
    
    // Memastikan direktori logs ada
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  async logActivity(activity) {
    const today = new Date();
    const fileName = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}.md`;
    const filePath = path.join(this.logsDir, fileName);
    
    const timestamp = today.toLocaleTimeString();
    const logEntry = `\n### ${timestamp}\n${activity}\n`;

    // Menambahkan log ke file
    fs.appendFileSync(filePath, logEntry);

    // Sync ke GitHub
    await this.syncToGitHub(filePath, fileName);

    return {
      date: today.toISOString(),
      activity,
      file: fileName
    };
  }

  async syncToGitHub(filePath, fileName) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const contentEncoded = Buffer.from(content).toString('base64');

      // Cek apakah file sudah ada di GitHub
      let sha;
      try {
        const { data } = await this.octokit.rest.repos.getContent({
          owner: settings.github.owner,
          repo: settings.github.repo,
          path: `data/logs/${fileName}`
        });
        sha = data.sha;
      } catch (error) {
        // File belum ada di GitHub
      }

      // Update atau buat file di GitHub
      await this.octokit.rest.repos.createOrUpdateFileContents({
        owner: settings.github.owner,
        repo: settings.github.repo,
        path: `data/logs/${fileName}`,
        message: `Update log: ${fileName}`,
        content: contentEncoded,
        sha: sha
      });
    } catch (error) {
      console.error('Error syncing to GitHub:', error);
    }
  }

  getDailyLogs(date) {
    const fileName = `${date}.md`;
    const filePath = path.join(this.logsDir, fileName);

    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath, 'utf8');
    }
    return null;
  }
}

module.exports = new ActivityTracker();