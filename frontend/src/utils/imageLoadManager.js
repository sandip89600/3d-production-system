/**
 * Client-Side Asset Load Balancer & Priority Connection Queue Manager
 * Limits concurrent network requests to prevent connection starvation and TCP connection throttling.
 */
class ImageLoadManager {
  constructor(maxConcurrent = 6) {
    this.maxConcurrent = maxConcurrent;
    this.activeCount = 0;
    this.queue = [];
  }

  /**
   * Request permission to load an image.
   * Returns a promise that resolves when it's this image's turn to load.
   * @param {number} priority higher number = loaded first (e.g. visible in viewport vs prefetch)
   */
  requestLoad(priority = 0) {
    return new Promise((resolve) => {
      this.queue.push({ resolve, priority });
      // Sort queue by priority descending (highest priority first)
      this.queue.sort((a, b) => b.priority - a.priority);
      this.next();
    });
  }

  /**
   * Release connection slot once image is loaded/errored.
   */
  release() {
    this.activeCount = Math.max(0, this.activeCount - 1);
    this.next();
  }

  /**
   * Process the next item in the queue.
   */
  next() {
    if (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      this.activeCount++;
      const { resolve } = this.queue.shift();
      resolve();
    }
  }
}

export const imageLoadManager = new ImageLoadManager(6);
export default imageLoadManager;
