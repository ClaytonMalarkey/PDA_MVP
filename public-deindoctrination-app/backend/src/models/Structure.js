const mongoose = require('mongoose');

const structureSchema = new mongoose.Schema({
  structureId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  baseCost: {
    type: Number,
    required: true,
    min: 0
  },
  baseProduction: {
    type: Number,
    required: true,
    min: 0
  },
  icon: {
    type: String,
    default: '🏛️'
  }
}, {
  timestamps: true
});

structureSchema.index({ structureId: 1 });

module.exports = mongoose.model('Structure', structureSchema);
