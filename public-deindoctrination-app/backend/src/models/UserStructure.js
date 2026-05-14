const mongoose = require('mongoose');

const userStructureSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  structureId: {
    type: String,
    required: true
  },
  level: {
    type: Number,
    default: 1,
    min: 1
  },
  purchasedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
userStructureSchema.index({ userId: 1, structureId: 1 }, { unique: true });
userStructureSchema.index({ userId: 1 });

module.exports = mongoose.model('UserStructure', userStructureSchema);
