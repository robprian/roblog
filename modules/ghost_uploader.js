const GhostContentAPI = require('@tryghost/content-api');
const { marked } = require('marked');
const settings = require('../config/settings');

class GhostUploader {
  constructor() {
    this.api = new GhostContentAPI({
      url: settings.ghost.url,
      key: settings.ghost.key,
      version: 'v5.0'
    });
  }

  async createPost(title, markdown) {
    try {
      // Konversi markdown ke HTML
      const html = marked.parse(markdown);

      // Membuat post di Ghost
      const response = await this.api.posts.add({
        title: title,
        html: html,
        status: 'published'
      });

      return {
        success: true,
        postId: response.id,
        url: response.url
      };
    } catch (error) {
      console.error('Error creating Ghost post:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async updatePost(postId, title, markdown) {
    try {
      const html = marked.parse(markdown);

      const response = await this.api.posts.edit({
        id: postId,
        title: title,
        html: html
      });

      return {
        success: true,
        url: response.url
      };
    } catch (error) {
      console.error('Error updating Ghost post:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async createDailyDigest(date, activities) {
    const title = `Daily Digest: ${date}`;
    const markdown = this.formatDailyDigest(activities);

    return await this.createPost(title, markdown);
  }

  formatDailyDigest(activities) {
    return `## Daily Activities\n\n${activities.map(activity => (
      `### ${activity.time}\n${activity.description}\n`
    )).join('\n')}`;
  }
}

module.exports = new GhostUploader();