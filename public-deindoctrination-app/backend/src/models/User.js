const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    unique: true,
    sparse: true,
    trim: true
  },
  bio: {
    type: String,
    default: '',
    maxlength: 300
  },
  avatarUrl: {
    type: String,
    default: null
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  xp: {
    type: Number,
    default: 0
  },
  rank: {
    type: Number,
    default: 1
  },
  currency: {
    type: Number,
    default: 0
  },
  influencePoints: {
    type: Number,
    default: 0
  },
  innovationTokens: {
    type: Number,
    default: 0
  },
  legacyStones: {
    type: Number,
    default: 0
  },
  knowledgePoints: {
    type: Number,
    default: 0
  },
  globalMultiplier: {
    type: Number,
    default: 1
  },
  civilizationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Civilization',
    default: null
  },
  dominantDomain: {
    type: String,
    default: null
  },
  researchTier: {
    type: Number,
    default: 0
  },
  // === GAMEPLAY LOOP FIELDS ===
  energy: { type: Number, default: 100 },
  maxEnergy: { type: Number, default: 100 },
  lastEnergyRefill: { type: Date, default: Date.now },
  hubLevel: { type: Number, default: 1 },  // 1=Room, 2=Apartment, 3=Office, 4=Facility, 5=Station
  skills: {
    coding: { type: Number, default: 0 },
    business: { type: Number, default: 0 },
    fitness: { type: Number, default: 0 },
    creativity: { type: Number, default: 0 },
    survival: { type: Number, default: 0 },
    spaceTech: { type: Number, default: 0 }
  },
  incomePerHour: { type: Number, default: 0 },
  automationSlots: { type: Number, default: 0 },
  totalTasksCompleted: { type: Number, default: 0 },
  dailyTasksCompleted: { type: Number, default: 0 },
  lastDailyReset: { type: Date, default: Date.now },
  questsCompleted: { type: Number, default: 0 },
  streak: {
    type: Number,
    default: 0
  },
  lastActivityDate: {
    type: Date,
    default: Date.now
  },
  lastIdleCollection: {
    type: Date,
    default: Date.now
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  premiumExpiresAt: {
    type: Date
  },
  // === SOCIAL IDENTITY ===
  presence: {
    type: String,
    enum: ['online', 'offline', 'idle', 'dnd'],
    default: 'offline'
  },
  reputation: {
    type: Number,
    default: 0
  },
  followerCount: {
    type: Number,
    default: 0
  },
  followingCount: {
    type: Number,
    default: 0
  },
  lastOnline: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function() {
  if (this.isModified('passwordHash')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 10);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
};

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ xp: -1 });

module.exports = mongoose.model('User', userSchema);
