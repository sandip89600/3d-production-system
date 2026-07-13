const mongoose = require('mongoose');

/**
 * SearchHistory Model
 * Tracks per-user search queries (capped at 10 most recent)
 */
const searchHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    query: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for fast lookup and deduplication
searchHistorySchema.index({ user: 1, query: 1 });
searchHistorySchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('SearchHistory', searchHistorySchema);
