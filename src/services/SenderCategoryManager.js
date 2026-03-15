/**
 * SenderCategoryManager v2.6.0
 * 
 * Manages sender-based email categorization.
 * When a user manually categorizes an email, the sender is remembered
 * and future emails from the same sender are automatically categorized.
 */

class SenderCategoryManager {
  constructor() {
    this.storageKey = 'senderCategories';
    this.categories = this.loadCategories();
    this.listeners = [];
  }

  /**
   * Load categories from localStorage
   */
  loadCategories() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('[SenderCategoryManager] Failed to load categories:', e);
      return {};
    }
  }

  /**
   * Save categories to localStorage
   */
  saveCategories() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.categories));
      this.notifyListeners();
    } catch (e) {
      console.error('[SenderCategoryManager] Failed to save categories:', e);
    }
  }

  /**
   * Extract email address from "Name <email@domain.com>" format
   */
  extractEmail(fromString) {
    if (!fromString) return '';
    const match = fromString.match(/<(.+?)>/);
    return (match ? match[1] : fromString).toLowerCase().trim();
  }

  /**
   * Set category for a sender
   * @param {string} senderEmail - The sender's email address
   * @param {string|null} category - Category name or null to remove
   */
  setSenderCategory(senderEmail, category) {
    const normalizedEmail = this.extractEmail(senderEmail);
    if (!normalizedEmail) return;

    if (category === null) {
      delete this.categories[normalizedEmail];
    } else {
      this.categories[normalizedEmail] = {
        category: category,
        lastUpdated: new Date().toISOString(),
        count: (this.categories[normalizedEmail]?.count || 0) + 1
      };
    }

    this.saveCategories();
    console.log(`[SenderCategoryManager] ${category ? 'Set' : 'Removed'} category for ${normalizedEmail}: ${category}`);
  }

  /**
   * Get category for a sender
   * @param {string} senderEmail - The sender's email address
   * @returns {string|null} - Category name or null
   */
  getSenderCategory(senderEmail) {
    const normalizedEmail = this.extractEmail(senderEmail);
    return this.categories[normalizedEmail]?.category || null;
  }

  /**
   * Get all senders for a specific category
   * @param {string} category - Category name
   * @returns {string[]} - Array of email addresses
   */
  getSendersByCategory(category) {
    return Object.entries(this.categories)
      .filter(([_, data]) => data.category === category)
      .map(([email, _]) => email);
  }

  /**
   * Get all categorized senders
   * @returns {Array} - Array of {email, category, lastUpdated, count}
   */
  getAllSenders() {
    return Object.entries(this.categories).map(([email, data]) => ({
      email,
      ...data
    }));
  }

  /**
   * Get statistics
   * @returns {Object} - Category counts
   */
  getStats() {
    const stats = {
      werbung: 0,
      spam: 0,
      schaedlich: 0,
      virus: 0,
      total: 0
    };

    Object.values(this.categories).forEach(data => {
      if (stats.hasOwnProperty(data.category)) {
        stats[data.category]++;
      }
      stats.total++;
    });

    return stats;
  }

  /**
   * Remove a sender from categories
   * @param {string} senderEmail - The sender's email address
   */
  removeSender(senderEmail) {
    const normalizedEmail = this.extractEmail(senderEmail);
    delete this.categories[normalizedEmail];
    this.saveCategories();
  }

  /**
   * Clear all categories
   */
  clearAll() {
    this.categories = {};
    this.saveCategories();
  }

  /**
   * Export categories for backup
   * @returns {Object} - All categories data
   */
  export() {
    return {
      version: '2.6.0',
      exportDate: new Date().toISOString(),
      categories: this.categories
    };
  }

  /**
   * Import categories from backup
   * @param {Object} data - Exported data
   * @param {boolean} merge - Whether to merge with existing (default: replace)
   */
  import(data, merge = false) {
    if (!data || !data.categories) {
      throw new Error('Invalid import data');
    }

    if (merge) {
      this.categories = { ...this.categories, ...data.categories };
    } else {
      this.categories = data.categories;
    }

    this.saveCategories();
  }

  /**
   * Subscribe to changes
   * @param {Function} callback - Callback function
   * @returns {Function} - Unsubscribe function
   */
  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  /**
   * Notify all listeners of changes
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.categories);
      } catch (e) {
        console.error('[SenderCategoryManager] Listener error:', e);
      }
    });
  }
}

// Export singleton instance
const senderCategoryManager = new SenderCategoryManager();
export default senderCategoryManager;

// Also export class for testing
export { SenderCategoryManager };
