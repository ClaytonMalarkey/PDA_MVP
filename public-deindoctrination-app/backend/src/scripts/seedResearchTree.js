#!/usr/bin/env node
/**
 * Seeds the 1,000-node research tree (10 domains × 10 subdomains × 10 tiers)
 */
require('dotenv').config();
const mongoose = require('mongoose');
const ResearchNode = require('../models/ResearchNode');

const BASE_COST = 100;
const BASE_TIME = 60;

const DOMAINS = [
  { name: 'Personal Discipline', icon: '🧠', code: 'PD', mult: 1.0 },
  { name: 'Physical Optimization', icon: '🏋', code: 'PO', mult: 1.02 },
  { name: 'Mental Mastery', icon: '🧬', code: 'MM', mult: 1.05 },
  { name: 'Economic Growth', icon: '💰', code: 'EG', mult: 1.08 },
  { name: 'Technical Innovation', icon: '🛠', code: 'TI', mult: 1.12 },
  { name: 'Governance & Stability', icon: '🏛', code: 'GS', mult: 1.15 },
  { name: 'Social Cooperation', icon: '🤝', code: 'SC', mult: 1.18 },
  { name: 'Infrastructure Scaling', icon: '🏗', code: 'IS', mult: 1.22 },
  { name: 'Exploration & Expansion', icon: '🚀', code: 'EE', mult: 1.25 },
  { name: 'Civilization Legacy', icon: '🏆', code: 'CL', mult: 1.30 }
];

const TIER_NAMES = [
  'Foundations', 'Optimization', 'Systems', 'Advanced', 'Mastery',
  'Civilization', 'Stellar', 'Galactic', 'Cosmic', 'Singularity'
];

const NODE_TEMPLATES = {
  'Personal Discipline': [
    'Baseline Awareness', 'Routine Initiation', 'Micro-Commitment', 'Distraction Logging',
    'Time Block Construction', 'Standard Declaration', 'Environment Optimization',
    'Accountability Trigger', 'Daily Closure Ritual', 'Discipline Index'
  ],
  'Economic Growth': [
    'Income Awareness', 'Expense Categorization', 'Value Recognition', 'Budget Discipline',
    'Opportunity Logging', 'Resource Flow', 'Micro-Investment', 'Delayed Gratification',
    'Asset Framework', 'Economic Index'
  ],
  'Technical Innovation': [
    'Systems Thinking', 'Data Structuring', 'Process Mapping', 'Task Automation',
    'Computational Literacy', 'Version Control', 'Efficiency Benchmarking',
    'Digital Integration', 'Optimization Loop', 'Innovation Index'
  ],
  'default': [
    'Foundation', 'Awareness', 'Structuring', 'Optimization', 'Integration',
    'Scaling', 'Automation', 'Mastery', 'Synthesis', 'Apex'
  ]
};

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  await ResearchNode.deleteMany({});
  console.log('Cleared existing research nodes');

  const nodes = [];

  for (let d = 0; d < DOMAINS.length; d++) {
    const domain = DOMAINS[d];
    const templates = NODE_TEMPLATES[domain.name] || NODE_TEMPLATES['default'];

    for (let t = 1; t <= 10; t++) {
      const tierName = TIER_NAMES[t - 1];
      const subdomain = `${domain.name} - ${tierName}`;

      for (let n = 0; n < 10; n++) {
        const nodeNum = (t - 1) * 10 + n + 1;
        const nodeId = `${domain.code}-${String(nodeNum).padStart(3, '0')}`;
        const baseName = templates[n] || `Node ${n + 1}`;
        const name = t === 1 ? baseName : `${tierName} ${baseName}`;

        const cost = Math.floor(BASE_COST * Math.pow(1.18, t) * domain.mult);
        const researchTime = Math.floor(BASE_TIME * Math.pow(1.12, t));
        const xpReward = Math.floor(50 * t * domain.mult);

        const dependencies = [];
        if (n > 0) {
          dependencies.push(`${domain.code}-${String((t - 1) * 10 + n).padStart(3, '0')}`);
        }
        if (t > 1 && n === 0) {
          dependencies.push(`${domain.code}-${String((t - 2) * 10 + 5).padStart(3, '0')}`);
        }

        nodes.push({
          nodeId, name, domain: domain.name, subdomain, tier: t, cost, researchTime, xpReward,
          dependencies,
          unlocks: {
            globalMultiplier: 1 + (t * 0.005 + n * 0.001),
            productionBoost: t * 0.01 + n * 0.002,
            description: `+${(t * 0.5 + n * 0.1).toFixed(1)}% ${domain.name} efficiency`
          }
        });
      }
    }
  }

  await ResearchNode.insertMany(nodes);
  console.log(`✅ Seeded ${nodes.length} research nodes across ${DOMAINS.length} domains`);

  // Print summary
  for (const domain of DOMAINS) {
    const count = nodes.filter(n => n.domain === domain.name).length;
    console.log(`  ${domain.icon} ${domain.name}: ${count} nodes`);
  }

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
