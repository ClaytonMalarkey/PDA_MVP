const fs = require('fs');
const path = require('path');

// 20 job families x 5 tiers x 10 specializations = 1000 jobs
const families = [
  {id:'developer',name:'Developer',icon:'💻',color:'#3b82f6',stat:'code',desc:'Build software and systems',
    tiers:['Junior Dev','Developer','Senior Dev','Lead Engineer','CTO','Tech Visionary'],
    specs:['Frontend','Backend','Mobile','DevOps','AI/ML','Security','Blockchain','Game Dev','Data','Cloud']},
  {id:'farmer',name:'Farmer',icon:'🌾',color:'#22c55e',stat:'harvest',desc:'Grow food and sustain life',
    tiers:['Gardener','Farmer','Rancher','Agricultural Engineer','Food Scientist','Terraformer'],
    specs:['Crops','Livestock','Aquaponics','Permaculture','Hydroponics','Forestry','Beekeeping','Mushrooms','Herbs','Soil Science']},
  {id:'teacher',name:'Teacher',icon:'📚',color:'#8b5cf6',stat:'wisdom',desc:'Educate and uplift others',
    tiers:['Tutor','Teacher','Professor','Dean','Education Architect','Civilization Educator'],
    specs:['Math','Science','Language','History','Philosophy','Technology','Arts','Physical','Special Ed','Leadership']},
  {id:'engineer',name:'Engineer',icon:'⚙️',color:'#f59e0b',stat:'build',desc:'Design and build infrastructure',
    tiers:['Technician','Engineer','Senior Engineer','Principal','Chief Engineer','Megastructure Architect'],
    specs:['Mechanical','Electrical','Civil','Aerospace','Chemical','Nuclear','Robotics','Materials','Environmental','Space']},
  {id:'medic',name:'Medic',icon:'🏥',color:'#ef4444',stat:'heal',desc:'Heal and protect human life',
    tiers:['First Aider','Paramedic','Nurse','Doctor','Surgeon','Medical Pioneer'],
    specs:['Emergency','Surgery','Pediatrics','Neurology','Cardiology','Oncology','Psychiatry','Sports Med','Genetics','Longevity']},
  {id:'creator',name:'Creator',icon:'🎨',color:'#ec4899',stat:'create',desc:'Create art, content, and culture',
    tiers:['Hobbyist','Creator','Artist','Master Artist','Cultural Icon','Civilization Artist'],
    specs:['Visual Art','Music','Writing','Film','Photography','Design','Animation','Sculpture','Architecture','Fashion']},
  {id:'investor',name:'Investor',icon:'📈',color:'#14b8a6',stat:'wealth',desc:'Grow and allocate capital wisely',
    tiers:['Saver','Investor','Portfolio Manager','Fund Manager','Venture Capitalist','Economic Architect'],
    specs:['Stocks','Real Estate','Crypto','Commodities','Startups','Angel','Value','Growth','Income','Macro']},
  {id:'scientist',name:'Scientist',icon:'🔬',color:'#6366f1',stat:'research',desc:'Discover truth through research',
    tiers:['Student','Researcher','Scientist','Lead Scientist','Director','Nobel Laureate'],
    specs:['Physics','Chemistry','Biology','Astronomy','Geology','Mathematics','Computer Science','Neuroscience','Ecology','Quantum']},
  {id:'leader',name:'Leader',icon:'👑',color:'#d97706',stat:'influence',desc:'Guide and inspire communities',
    tiers:['Volunteer','Coordinator','Manager','Director','Executive','Civilization Leader'],
    specs:['Community','Corporate','Political','Military','Nonprofit','Religious','Educational','Startup','Cultural','Global']},
  {id:'builder',name:'Builder',icon:'🏗️',color:'#78716c',stat:'construct',desc:'Build physical structures',
    tiers:['Laborer','Apprentice','Journeyman','Master Builder','Architect','Megastructure Builder'],
    specs:['Carpentry','Masonry','Plumbing','Electrical','Welding','Concrete','Roofing','HVAC','Solar','3D Printing']},
  {id:'trader',name:'Trader',icon:'🤝',color:'#0ea5e9',stat:'trade',desc:'Exchange goods and create markets',
    tiers:['Vendor','Merchant','Trader','Broker','Market Maker','Economic Sovereign'],
    specs:['Retail','Wholesale','Import/Export','Digital','Barter','Commodities','Services','Luxury','Food','Technology']},
  {id:'warrior',name:'Warrior',icon:'⚔️',color:'#dc2626',stat:'combat',desc:'Protect and defend civilization',
    tiers:['Recruit','Soldier','Veteran','Commander','General','Supreme Defender'],
    specs:['Infantry','Tactics','Logistics','Intelligence','Cyber','Naval','Air','Special Ops','Defense','Strategy']},
  {id:'explorer',name:'Explorer',icon:'🧭',color:'#059669',stat:'discovery',desc:'Discover new frontiers',
    tiers:['Hiker','Explorer','Adventurer','Expedition Leader','Pioneer','Cosmic Explorer'],
    specs:['Mountain','Ocean','Desert','Arctic','Cave','Urban','Space','Deep Sea','Jungle','Subterranean']},
  {id:'healer',name:'Healer',icon:'💚',color:'#10b981',stat:'restore',desc:'Restore mind, body, and spirit',
    tiers:['Helper','Counselor','Therapist','Healer','Master Healer','Soul Architect'],
    specs:['Physical','Mental','Spiritual','Nutritional','Herbal','Energy','Massage','Yoga','Meditation','Holistic']},
  {id:'craftsman',name:'Craftsman',icon:'🔨',color:'#a16207',stat:'craft',desc:'Create with hands and tools',
    tiers:['Novice','Apprentice','Journeyman','Master Craftsman','Grand Master','Legendary Artisan'],
    specs:['Woodwork','Metalwork','Leather','Pottery','Glass','Textile','Jewelry','Blacksmith','Clockwork','Instrument']},
  {id:'communicator',name:'Communicator',icon:'📡',color:'#7c3aed',stat:'reach',desc:'Connect and inform humanity',
    tiers:['Blogger','Journalist','Editor','Publisher','Media Director','Information Architect'],
    specs:['Writing','Broadcasting','Social Media','Podcasting','Public Speaking','Translation','PR','Advertising','Documentary','Investigative']},
  {id:'athlete',name:'Athlete',icon:'🏃',color:'#ea580c',stat:'fitness',desc:'Push physical human limits',
    tiers:['Beginner','Amateur','Competitor','Professional','Champion','Transcendent Athlete'],
    specs:['Running','Swimming','Martial Arts','Weightlifting','Gymnastics','Cycling','Team Sports','Climbing','Yoga','Endurance']},
  {id:'chef',name:'Chef',icon:'👨‍🍳',color:'#b91c1c',stat:'nourish',desc:'Nourish humanity through food',
    tiers:['Home Cook','Line Cook','Sous Chef','Head Chef','Executive Chef','Culinary Master'],
    specs:['Baking','Grilling','Fermentation','Pastry','Sushi','BBQ','Vegan','Farm-to-Table','Preservation','Molecular']},
  {id:'pilot',name:'Pilot',icon:'✈️',color:'#0284c7',stat:'navigate',desc:'Navigate air, sea, and space',
    tiers:['Student Pilot','Private Pilot','Commercial Pilot','Captain','Test Pilot','Space Pilot'],
    specs:['Fixed Wing','Helicopter','Drone','Spacecraft','Submarine','Sailing','Racing','Cargo','Fighter','Orbital']},
  {id:'philosopher',name:'Philosopher',icon:'🧠',color:'#4f46e5',stat:'think',desc:'Seek truth and meaning',
    tiers:['Thinker','Student','Scholar','Philosopher','Sage','Civilization Philosopher'],
    specs:['Ethics','Logic','Metaphysics','Political','Epistemology','Aesthetics','Eastern','Western','Existential','Natural Law']},
];

let code = '// Auto-generated: 1000+ Job System\n';
code += 'var JOB_FAMILIES = ' + JSON.stringify(families) + ';\n\n';

code += `
function generateAbilities(family, tierIdx, specIdx) {
  var abilities = [];
  for (var i = 0; i <= tierIdx; i++) {
    abilities.push({
      name: family.tiers[Math.min(i, family.tiers.length-1)] + ' ' + family.specs[specIdx] + ' Skill',
      power: 10 + i * 15 + tierIdx * 5,
      cost: 5 + i * 3,
      type: family.id === 'healer' || family.id === 'medic' ? 'heal' : family.id === 'leader' ? 'buff' : 'action',
      description: 'Level ' + (i+1) + ' ability for ' + family.specs[specIdx] + ' ' + family.name
    });
  }
  return abilities;
}

function getJob(familyId, tierIdx, specIdx) {
  var family = JOB_FAMILIES.find(function(f) { return f.id === familyId; });
  if (!family) return null;
  tierIdx = Math.max(0, Math.min(tierIdx || 0, family.tiers.length - 1));
  specIdx = Math.max(0, Math.min(specIdx || 0, family.specs.length - 1));
  var jobId = familyId + '-' + tierIdx + '-' + specIdx;
  return {
    jobId: jobId, familyId: family.id, familyName: family.name, familyIcon: family.icon, familyColor: family.color,
    tier: tierIdx, spec: specIdx, specName: family.specs[specIdx],
    name: family.tiers[tierIdx] + ' (' + family.specs[specIdx] + ')',
    stats: { hp: 100 + tierIdx * 30, atk: 10 + tierIdx * 5, def: 5 + tierIdx * 3, spd: 5 + tierIdx * 2 },
    abilities: generateAbilities(family, tierIdx, specIdx),
    unlockCost: tierIdx === 0 ? 0 : Math.floor(100 * Math.pow(1.8, tierIdx)),
    xpRequired: tierIdx * 500,
    description: family.desc + '. Tier ' + (tierIdx + 1) + ': ' + family.tiers[tierIdx] + ', specializing in ' + family.specs[specIdx] + '.',
    evolutionPath: tierIdx < family.tiers.length - 1 ? family.tiers[tierIdx + 1] : 'MAX'
  };
}

function getAllJobs() {
  var jobs = [];
  JOB_FAMILIES.forEach(function(family) {
    for (var t = 0; t < family.tiers.length; t++) {
      for (var s = 0; s < family.specs.length; s++) {
        jobs.push(getJob(family.id, t, s));
      }
    }
  });
  return jobs;
}

function getJobsByFamily(familyId) {
  var family = JOB_FAMILIES.find(function(f) { return f.id === familyId; });
  if (!family) return [];
  var jobs = [];
  for (var t = 0; t < family.tiers.length; t++) {
    for (var s = 0; s < family.specs.length; s++) {
      jobs.push(getJob(family.id, t, s));
    }
  }
  return jobs;
}

function getJobFamilies() { return JOB_FAMILIES; }

function getJobCount() {
  var total = 0;
  JOB_FAMILIES.forEach(function(f) { total += f.tiers.length * f.specs.length; });
  return total;
}

function getHybridJobs(familyId1, familyId2) {
  var f1 = JOB_FAMILIES.find(function(f) { return f.id === familyId1; });
  var f2 = JOB_FAMILIES.find(function(f) { return f.id === familyId2; });
  if (!f1 || !f2) return null;
  return {
    hybridId: familyId1 + '+' + familyId2,
    name: f1.name + '-' + f2.name + ' Hybrid',
    icon: f1.icon + f2.icon,
    description: 'A hybrid combining ' + f1.name + ' and ' + f2.name + ' disciplines.',
    bonusStats: { hp: 50, atk: 8, def: 5, spd: 3 },
    requirements: { [familyId1]: 3, [familyId2]: 3 }
  };
}

module.exports = {
  getJob: getJob, getAllJobs: getAllJobs, getJobsByFamily: getJobsByFamily,
  getJobFamilies: getJobFamilies, getJobCount: getJobCount, getHybridJobs: getHybridJobs,
  JOB_FAMILIES: JOB_FAMILIES
};
`;

const outPath = path.join(__dirname, '..', 'services', 'jobSystem.js');
fs.writeFileSync(outPath, code, 'utf8');

// Test
delete require.cache[require.resolve('../services/jobSystem')];
const js = require('../services/jobSystem');
console.log('Total jobs:', js.getJobCount());
console.log('Families:', js.getJobFamilies().length);
const sample = js.getJob('developer', 2, 0);
console.log('Sample:', sample.name, '-', sample.description.substring(0, 60));
const hybrid = js.getHybridJobs('developer', 'scientist');
console.log('Hybrid:', hybrid.name);
