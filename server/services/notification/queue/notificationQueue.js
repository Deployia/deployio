const logger = require("../../../config/logger");

class NotificationQueue {
  constructor() {
    this.queue = [];
    this.processing = false;
    this.processingInterval = null;
    this.retryAttempts = 3;
    this.retryDelay = 5000; // 5 seconds
    this.batchSize = 10;
    this.processInterval = 1000; // 1 second

    // Start processing queue
    this.startProcessing();
  }

  /**
   * Add notification to processing queue
   * @param {string} notificationId - Notification ID
   * @param {Array} channels - Delivery channels
   * @param {Object} options - Additional options
   */
  async addNotification(notificationId, channels, options = {}) {
    try {
      const queueItem = {
        id: this.generateId(),
        notificationId,
        channels,
        priority: options.priority || "normal",
        attempts: 0,
        maxAttempts: options.maxAttempts || this.retryAttempts,
        addedAt: new Date(),
        scheduleFor: options.scheduleFor || new Date(),
        ...options,
      };

      // Insert based on priority
      const insertIndex = this.findInsertPosition(queueItem);
      this.queue.splice(insertIndex, 0, queueItem);

      logger.debug("Notification added to queue", {
        queueId: queueItem.id,
        notificationId,
        channels,
        priority: queueItem.priority,
        queueLength: this.queue.length,
      });

      // Trigger immediate processing if high priority
      if (queueItem.priority === "urgent") {
        this.processQueue();
      }

      return queueItem.id;
    } catch (error) {
      logger.error("Failed to add notification to queue", {
        notificationId,
        channels,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Add bulk notifications to queue
   * @param {Array} notifications - Array of notification objects
   */
  async addBulkNotifications(notifications) {
    try {
      const queueItems = notifications.map((notif) => ({
        id: this.generateId(),
        notificationId: notif.notificationId,
        channels: notif.channels,
        priority: notif.priority || "normal",
        attempts: 0,
        maxAttempts: notif.maxAttempts || this.retryAttempts,
        addedAt: new Date(),
        scheduleFor: notif.scheduleFor || new Date(),
        ...notif.options,
      }));

      // Sort by priority and add to queue
      queueItems.sort(this.priorityComparator);

      for (const item of queueItems) {
        const insertIndex = this.findInsertPosition(item);
        this.queue.splice(insertIndex, 0, item);
      }

      logger.info("Bulk notifications added to queue", {
        count: notifications.length,
        queueLength: this.queue.length,
      });

      return queueItems.map((item) => item.id);
    } catch (error) {
      logger.error("Failed to add bulk notifications to queue", {
        count: notifications.length,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Start queue processing
   */
  startProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, this.processInterval);

    logger.info("Notification queue processing started");
  }

  /**
   * Stop queue processing
   */
  stopProcessing() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    logger.info("Notification queue processing stopped");
  }

  /**
   * Process notifications in queue
   */
  async processQueue() {
    if (this.processing || this.queue.length === 0) {
      return;
    }

    this.processing = true;

    try {
      // Get items ready for processing
      const now = new Date();
      const readyItems = this.queue
        .filter((item) => item.scheduleFor <= now)
        .slice(0, this.batchSize);

      if (readyItems.length === 0) {
        this.processing = false;
        return;
      }

      logger.debug("Processing notification queue batch", {
        batchSize: readyItems.length,
        queueLength: this.queue.length,
      });

      // Process items in parallel
      const processingPromises = readyItems.map((item) =>
        this.processQueueItem(item)
      );

      await Promise.allSettled(processingPromises);

      // Remove processed items from queue
      this.queue = this.queue.filter(
        (item) => !readyItems.some((processed) => processed.id === item.id)
      );
    } catch (error) {
      logger.error("Queue processing error", {
        error: error.message,
      });
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process individual queue item
   * @param {Object} queueItem - Queue item to process
   */
  async processQueueItem(queueItem) {
    try {
      queueItem.attempts++;
      queueItem.lastAttemptAt = new Date();

      logger.debug("Processing queue item", {
        queueId: queueItem.id,
        notificationId: queueItem.notificationId,
        attempt: queueItem.attempts,
        channels: queueItem.channels,
      });

      // Get notification service
      const notificationService = require("../notificationService");

      // Send notification
      const result = await notificationService.sendNotification(
        queueItem.notificationId
      );

      logger.info("Queue item processed successfully", {
        queueId: queueItem.id,
        notificationId: queueItem.notificationId,
        result,
      });
    } catch (error) {
      logger.error("Queue item processing failed", {
        queueId: queueItem.id,
        notificationId: queueItem.notificationId,
        attempt: queueItem.attempts,
        error: error.message,
      });

      // Handle retry logic
      await this.handleRetry(queueItem, error);
    }
  }

  /**
   * Handle retry logic for failed queue items
   * @param {Object} queueItem - Failed queue item
   * @param {Error} error - Error that occurred
   */
  async handleRetry(queueItem, error) {
    if (queueItem.attempts >= queueItem.maxAttempts) {
      // Max attempts reached, mark as failed
      logger.error("Queue item permanently failed", {
        queueId: queueItem.id,
        notificationId: queueItem.notificationId,
        attempts: queueItem.attempts,
        error: error.message,
      });

      // TODO: Store failed notification for manual retry or analysis
      await this.handlePermanentFailure(queueItem, error);

      return;
    }

    // Schedule retry with exponential backoff
    const delay = this.retryDelay * Math.pow(2, queueItem.attempts - 1);
    queueItem.scheduleFor = new Date(Date.now() + delay);

    logger.info("Queue item scheduled for retry", {
      queueId: queueItem.id,
      notificationId: queueItem.notificationId,
      attempt: queueItem.attempts,
      nextAttempt: queueItem.scheduleFor,
      delay,
    });
  }

  /**
   * Handle permanent failure
   * @param {Object} queueItem - Failed queue item
   * @param {Error} error - Error that occurred
   */
  async handlePermanentFailure(queueItem, error) {
    try {
      // TODO: Store in failed notifications collection
      // const FailedNotification = require("../../../models/FailedNotification");
      //
      // await FailedNotification.create({
      //   queueId: queueItem.id,
      //   notificationId: queueItem.notificationId,
      //   channels: queueItem.channels,
      //   attempts: queueItem.attempts,
      //   finalError: error.message,
      //   queueData: queueItem,
      //   failedAt: new Date(),
      // });

      logger.info("Permanent failure recorded", {
        queueId: queueItem.id,
        notificationId: queueItem.notificationId,
      });
    } catch (storageError) {
      logger.error("Failed to store permanent failure", {
        queueId: queueItem.id,
        error: storageError.message,
      });
    }
  }

  /**
   * Find insertion position for priority queue
   * @param {Object} queueItem - Item to insert
   * @returns {number} Insert position
   */
  findInsertPosition(queueItem) {
    // Find position to maintain priority order
    for (let i = 0; i < this.queue.length; i++) {
      if (this.priorityComparator(queueItem, this.queue[i]) < 0) {
        return i;
      }
    }
    return this.queue.length;
  }

  /**
   * Priority comparator for sorting
   * @param {Object} a - First item
   * @param {Object} b - Second item
   * @returns {number} Comparison result
   */
  priorityComparator(a, b) {
    const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };

    const aPriority = priorityOrder[a.priority] || 2;
    const bPriority = priorityOrder[b.priority] || 2;

    if (aPriority !== bPriority) {
      return bPriority - aPriority; // Higher priority first
    }

    // Same priority, sort by scheduled time
    return a.scheduleFor.getTime() - b.scheduleFor.getTime();
  }

  /**
   * Generate unique queue ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get queue statistics
   * @returns {Object} Queue statistics
   */
  getQueueStats() {
    const now = new Date();
    const stats = {
      total: this.queue.length,
      ready: this.queue.filter((item) => item.scheduleFor <= now).length,
      scheduled: this.queue.filter((item) => item.scheduleFor > now).length,
      byPriority: {
        urgent: this.queue.filter((item) => item.priority === "urgent").length,
        high: this.queue.filter((item) => item.priority === "high").length,
        normal: this.queue.filter((item) => item.priority === "normal").length,
        low: this.queue.filter((item) => item.priority === "low").length,
      },
      processing: this.processing,
      oldestItem:
        this.queue.length > 0
          ? Math.min(...this.queue.map((item) => item.addedAt.getTime()))
          : null,
    };

    if (stats.oldestItem) {
      stats.oldestAge = now.getTime() - stats.oldestItem;
    }

    return stats;
  }

  /**
   * Clear all items from queue
   */
  clearQueue() {
    const clearedCount = this.queue.length;
    this.queue = [];

    logger.info("Queue cleared", { clearedCount });
    return clearedCount;
  }

  /**
   * Remove specific item from queue
   * @param {string} queueId - Queue item ID
   * @returns {boolean} Whether item was removed
   */
  removeFromQueue(queueId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter((item) => item.id !== queueId);

    const removed = this.queue.length < initialLength;

    if (removed) {
      logger.info("Item removed from queue", { queueId });
    }

    return removed;
  }

  /**
   * Get items from queue by notification ID
   * @param {string} notificationId - Notification ID
   * @returns {Array} Queue items
   */
  getQueueItemsForNotification(notificationId) {
    return this.queue.filter((item) => item.notificationId === notificationId);
  }

  /**
   * Schedule notification for later delivery
   * @param {string} notificationId - Notification ID
   * @param {Array} channels - Delivery channels
   * @param {Date} scheduleFor - When to deliver
   * @param {Object} options - Additional options
   */
  async scheduleNotification(
    notificationId,
    channels,
    scheduleFor,
    options = {}
  ) {
    return this.addNotification(notificationId, channels, {
      ...options,
      scheduleFor,
    });
  }

  /**
   * Cancel scheduled notification
   * @param {string} notificationId - Notification ID
   * @returns {number} Number of cancelled items
   */
  cancelScheduledNotification(notificationId) {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(
      (item) => item.notificationId !== notificationId
    );

    const cancelledCount = initialLength - this.queue.length;

    if (cancelledCount > 0) {
      logger.info("Scheduled notifications cancelled", {
        notificationId,
        cancelledCount,
      });
    }

    return cancelledCount;
  }
}

module.exports = NotificationQueue;
