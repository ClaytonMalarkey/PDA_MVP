const fs = require('fs');
const path = require('path');

const code = `
const DOMAINS = {
  critical_thinking: { name:'Critical Thinking', icon:'🧠',
    verbs:['Analyze','Question','Evaluate','Deconstruct','Research','Investigate','Challenge','Debate','Compare','Assess','Examine','Critique','Verify','Dissect','Review'],
    subjects:['a mainstream media narrative and identify logical fallacies','a government policy and its actual vs stated outcomes','the difference between correlation and causation','a popular belief and find the original source data','both sides of a controversial topic without bias','a historical event from 3 different perspectives','incentive structures behind corporate statements','a scientific paper methodology and conclusions','the difference between propaganda and education','how cognitive biases affect daily decisions','the logical structure of an argument you disagree with','funding sources behind a research institution','how language manipulates public opinion','the difference between authority and expertise','a news article for missing context and assumptions','the Socratic method by questioning your beliefs','a political speech for rhetorical manipulation','the difference between facts opinions and interpretations','how groupthink affects organizational decisions','the steel-man version of an opposing viewpoint','a product advertisement for psychological tricks','the difference between skepticism and cynicism','how confirmation bias shapes your information diet','a historical propaganda campaign and its techniques','the Dunning-Kruger effect in your knowledge areas','how appeal to emotion replaces logical argument','the difference between anecdotal and statistical evidence','how framing effects change perception of facts','a social media algorithm effect on your worldview','the sunk cost fallacy in a personal decision','how survivorship bias distorts success narratives','the difference between necessary and sufficient conditions','how anchoring bias affects negotiation','a charity for actual impact vs marketing','the bandwagon effect in cultural trends','how availability heuristic distorts risk assessment','the difference between deductive and inductive reasoning','how false dichotomies limit solution thinking','the naturalistic fallacy in health claims','how selection bias affects research conclusions']
  },
  sound_money: { name:'Sound Money', icon:'💰',
    verbs:['Study','Calculate','Track','Research','Implement','Practice','Teach','Document','Build','Analyze','Master','Optimize','Plan','Audit','Design'],
    subjects:['the history of money from barter to digital','how inflation erodes purchasing power','the difference between saving and investing','your budget and eliminate unnecessary expenses','compound interest with real numbers','how central banks create money from nothing','properties that make something good money','a basic investment strategy and paper-trade','the difference between assets and liabilities','how debt-based monetary systems work','gold as money across civilizations','your net worth and plan to increase it','opportunity cost in daily decisions','how to build multiple income streams','the difference between price and value','hyperinflation in Weimar Germany','fractional reserve banking money multiplication','Austrian vs Keynesian economics debate','your spending patterns for 30 days','time preference in economics','how to read a balance sheet','nominal vs real interest rates','currency debasement and the Roman Empire','purchasing power parity between countries','the true cost of debt including interest','the difference between speculation and investment','monetary policy and wealth inequality','sound money vs fiat currency concepts','a personal financial independence plan','history of the gold standard','risk vs reward evaluation','dollar-cost averaging strategy','how taxes affect real returns','active vs passive income streams','salary negotiation techniques','financial sovereignty and self-custody','building a 6-month emergency fund','good debt vs bad debt','reducing cost of living by 20 percent','generational wealth building strategies']
  },
  self_reliance: { name:'Self-Reliance', icon:'🏋️',
    verbs:['Learn','Practice','Build','Master','Develop','Create','Grow','Fix','Cook','Prepare','Craft','Forage','Construct','Repair','Harvest'],
    subjects:['a practical skill usable without electricity','basic first aid and emergency response','growing food from seeds in any environment','a meal from scratch with whole ingredients','home or vehicle repair without professionals','water purification with available materials','fire-starting without modern tools','navigation using stars sun and landmarks','a 72-hour emergency preparedness kit','food preservation canning drying fermenting','sewing and clothing repair skills','generating electricity from renewables','self-defense and situational awareness','basic carpentry or construction','negotiation and barter skills','identifying edible wild plants in your region','10 essential knots for practical use','sharpening and maintaining cutting tools','rainwater collection and storage','animal husbandry or beekeeping basics','making soap candles or cleaning products','basic electrical wiring and circuits','reading weather patterns without technology','basic metalworking or welding','meat preservation through smoking and curing','plumbing repair and water systems','natural medicines from common plants','leather working and hide tanning','shelter building from natural materials','blacksmithing and tool-making','processing grain into flour and baking bread','rope-making from natural fibers','basic pottery and clay working','composting system building and maintenance','fermentation for food and beverages','medicinal herb identification and collection','spinning and weaving natural fibers','root cellar construction for food storage','seed saving and plant propagation','solar dehydrator construction for food drying']
  },
  accountability: { name:'Accountability', icon:'⚖️',
    verbs:['Commit','Track','Document','Review','Measure','Report','Own','Improve','Set','Complete','Maintain','Establish','Honor','Uphold','Strengthen'],
    subjects:['a 30-day challenge with daily progress logging','daily habits identifying which serve your goals','a mistake you made and what you learned','progress toward a goal set last month','time usage for one day in 15-minute blocks','a promise and follow through completely','physical fitness metrics with improvement targets','financial decisions this week honestly','a personal standard held publicly','screen time replacing 1 hour with productivity','energy levels identifying drains vs fuel','a weekly review of goals wins and growth','your word saying what you mean doing what you say','health metrics sleep nutrition exercise hydration','a failure without excuses extracting the lesson','a daily journaling practice for reflection','morning routine optimized for peak performance','a public commitment with weekly progress reports','relationships identifying where to give more','a 5AM wake-up routine for 7 days','media consumption eliminating low-value content','a gratitude practice listing 3 things daily','stress response patterns and improvements','a no-complaint challenge for 24 hours','procrastination triggers with countermeasures','a digital detox for one full weekend','personal values aligned with daily actions','cold shower practice every morning for 30 days','30 minutes non-fiction reading daily','1 hour daily skill practice for 30 days','eliminating processed food for one week','10 minutes daily meditation for 21 days','workspace organization for productivity','weekly planning session every Sunday','active listening practice in conversations','30 minutes daily exercise without exception','recording every expense for financial tracking','a bedtime routine ensuring 7-8 hours sleep','social media under 30 minutes daily','one personal development book per month']
  },
  space_expansion: { name:'Space Expansion', icon:'🚀',
    verbs:['Study','Design','Research','Calculate','Simulate','Plan','Build','Prototype','Explore','Envision','Model','Engineer','Theorize','Map','Develop'],
    subjects:['sustaining human life on Mars','orbital mechanics and spacecraft navigation','radiation protection in deep space','a self-sustaining space habitat concept','lunar mining operation requirements','growing food in zero or low gravity','asteroid mining economics and resources','propulsion systems chemical ion nuclear solar','psychological challenges of long space missions','terraforming concepts for Mars and Venus','space elevator engineering challenges','the Kardashev scale and energy future','closed-loop life support for stations','legal framework for space resources','interplanetary communication systems','in-situ resource utilization on Moon and Mars','delta-v budgets for planetary missions','artificial gravity through rotation','space debris mitigation and cleanup','nuclear thermal propulsion systems','O Neill cylinder space habitats','Mars atmospheric oxygen production','solar power satellites for Earth','Hohmann transfer orbits and launch windows','regolith processing for construction','water ice extraction on Moon and Mars','heavy payload Mars landing challenges','space medicine and body adaptation','reusable launch vehicle economics','magnetic radiation shielding concepts','bioregenerative life support with plants','Lagrange points strategic importance','microgravity manufacturing','generation ship interstellar concepts','fusion propulsion for deep space','Dyson sphere stellar energy capture','space tourism market development','planetary defense against asteroids','the Drake equation and SETI','interstellar probe design for nearby stars']
  },
  physical_mastery: { name:'Physical Mastery', icon:'💪',
    verbs:['Complete','Practice','Train','Perform','Master','Endure','Push','Stretch','Run','Lift','Swim','Climb','Sprint','Hold','Balance'],
    subjects:['30 minutes cardiovascular exercise','full-body strength training with proper form','flexibility and mobility for all joints','cold exposure for resilience building','a new physical skill handstand or martial arts','breath work box breathing or Wim Hof','a long walk or hike in nature','posture exercises counteracting desk work','balance and coordination drills','a fasting protocol for metabolic health','sleep optimization consistent schedule','a sport or game with others','grip strength exercises','progressive overload beating records','recovery foam rolling stretching meditation','100 pushups throughout the day','a 5K run or walk without stopping','a 20-minute yoga flow sequence','a plank hold working toward 3 minutes','200 bodyweight squats in a day','10 minutes continuous jump rope','farmers carry with heavy objects','20 floors stair climbing','dead hang working toward 2 minutes','50 burpees for time','wall sit working toward 3 minutes','bear crawl for 100 meters','Turkish get-up with progressive weight','pistol squat progression each leg','handstand practice 5 minutes total','30 minutes rowing or cycling','martial arts technique practice 20 minutes','sprint intervals 8 rounds of 30 seconds','pull-up progression toward 10 strict','hip and shoulder mobility routine','100 kettlebell swings','box jump explosive power practice','10 minutes battle rope session','sandbag carry functional strength','30 minutes calisthenics skill work']
  },
  community: { name:'Community Building', icon:'🤝',
    verbs:['Organize','Connect','Teach','Help','Mentor','Lead','Volunteer','Create','Support','Collaborate','Unite','Empower','Inspire','Facilitate','Coordinate'],
    subjects:['a skill-sharing session with neighbors','a local group working on real problems','someone a practical skill you mastered','a neighbor with a task they struggle with','a younger person where you have experience','a group project improving your local area','time for a cause that directly helps people','a network of people with complementary skills','a local business with your skills','a project bigger than any individual','a community emergency preparedness plan','a local barter or trade network','a study group for practical knowledge','a community garden or shared space','a mentorship chain learn master teach repeat','a neighborhood safety communication system','a tool library or equipment sharing program','a community cooking or meal event','a local skills inventory mapping capabilities','a community first aid training session','a book club focused on self-improvement','a community fitness group meeting regularly','a repair cafe fixing things together','a community seed bank for food security','a communication network without internet','a local youth mentorship program','a community renewable energy project','a local emergency water supply plan','a workshop teaching practical trades','a mutual aid network for times of need','a debate club for civil discourse','a local history documentation project','a community newsletter for local news','a composting and waste reduction program','an entrepreneurship support group','a community art project bringing people together','a local disaster preparedness drill','a technology education program','a food preservation workshop','a neighborhood conflict resolution process']
  },
  technology: { name:'Technology', icon:'💻',
    verbs:['Code','Build','Design','Automate','Learn','Create','Deploy','Optimize','Debug','Architect','Program','Develop','Configure','Integrate','Secure'],
    subjects:['a script automating a repetitive task','a website or app solving a real problem','a new programming concept in a project','a system reducing centralized dependence','encryption and digital privacy basics','a home automation with open-source tools','a data backup and recovery system','networking and internet fundamentals','a simple AI model for practical use','a contribution to open-source','a personal knowledge management system','blockchain and decentralization basics','a prototype using available materials','a personal data tracking system','a communication system without internet','a Linux server hosting a personal service','a password manager securing all accounts','a personal VPN for privacy','a Raspberry Pi home automation project','DNS and domain fundamentals','a static site generator for a blog','a basic API serving database data','a mobile-responsive web application','a basic chatbot with NLP','a home network security audit','containerization with Docker basics','a CI/CD pipeline for deployment','cloud computing service fundamentals','a mesh network for decentralized comms','cryptographic principles understanding','a web scraper for useful public data','operating system internals understanding','a personal dashboard for important data','radio communication and HAM basics','a solar-powered computing setup','3D printing and CAD design basics','a home media server with open-source','satellite communication understanding','a personal finance tracking app','quantum computing concept basics']
  },
  governance: { name:'Governance', icon:'🏛️',
    verbs:['Study','Debate','Propose','Analyze','Draft','Evaluate','Participate','Organize','Advocate','Examine','Defend','Question','Reform','Establish','Protect'],
    subjects:['individual rights and natural law principles','governance models and historical outcomes','a policy increasing individual freedom','incentive structures in local government','a personal code of ethics lived for a week','voluntary association vs coercion','a local decision-making process','a discussion group on governance philosophy','a cause protecting individual sovereignty','the difference between rights and privileges','how power structures maintain themselves','consent of the governed concept','historical decentralized governance','economic freedom and prosperity relationship','subsidiarity in governance','constitutional republics vs democracies','jury nullification and citizen power','regulatory capture undermining public interest','non-aggression principle in politics','civil disobedience history and effectiveness','polycentric law and competing governance','term limits effect on governance quality','legislation vs natural law','transparency reducing government corruption','secession and self-determination','common law vs civil law systems','property rights enabling prosperity','sortition as election alternative','federalism distributing power across levels','Magna Carta principles','free speech protections enabling progress','constitutional constraints on power','sound money limiting government overreach','American founding principles','voluntary community self-governance','exit rights in political systems','technology enabling new governance forms','Swiss direct democracy history','dispute resolution without state courts','panarchy and governance choice freedom']
  },
  creativity: { name:'Creative Expression', icon:'🎨',
    verbs:['Create','Write','Design','Compose','Build','Draw','Perform','Craft','Invent','Express','Paint','Sculpt','Film','Photograph','Illustrate'],
    subjects:['art representing humanity future vision','a story about civilization 500 years ahead','a logo for a pro-humanity movement','a poem or spoken word about self-reliance','an object from recycled natural materials','a sketch of a space habitat design','a presentation teaching something learned','something beautiful with 200-year-old tools','a solution using unconventional thinking','your philosophy in a single page manifesto','a board game teaching critical thinking','a short film about personal accountability','a map of your ideal civilization','a time capsule message for 1000 years ahead','a children story teaching independence','a comic about Mars colonization journey','a blueprint for off-grid homestead','music inspired by the vastness of space','a sculpture of human resilience','a documentary script about sound money','posters promoting critical thinking','an animation about human progress history','a recipe book from local ingredients','a journal design for accountability tracking','a card game teaching economics','a mural celebrating community self-reliance','a podcast script about space colonization','a zine about practical survival skills','a photo essay of community strengths','a theatrical scene about standing for principles','calligraphy of an inspiring freedom quote','a Mars habitat model from household items','a song about thinking independently','a graphic novel about building civilization','a movement piece expressing human aspiration','pottery symbolizing growth from adversity','a woodworking project with hand tools','digital art of Earth from Mars colony','spoken word about breaking from conformity','a collaborative community art project']
  }
};

const TIERS = [
  { name:'Micro', xpRange:[10,30], currRange:[5,15], prefix:'Quick: ', cooldown:300000 },
  { name:'Small', xpRange:[30,75], currRange:[15,40], prefix:'', cooldown:1800000 },
  { name:'Medium', xpRange:[75,200], currRange:[40,100], prefix:'Challenge: ', cooldown:3600000 },
  { name:'Large', xpRange:[200,500], currRange:[100,250], prefix:'Epic: ', cooldown:14400000 },
  { name:'Mega', xpRange:[500,1500], currRange:[250,750], prefix:'Legendary: ', cooldown:86400000 },
];

const REAL_REWARDS = [null,null,null,null,null,null,null,'Personal growth milestone','Skill certification progress','Community impact credit'];

function hash(seed) { return ((seed * 2654435761) >>> 0) / 4294967296; }

function generateTask(seed) {
  const dk = Object.keys(DOMAINS);
  const di = seed % dk.length;
  const domain = DOMAINS[dk[di]];
  const ti = Math.floor(hash(seed * 7 + 1) * TIERS.length);
  const tier = TIERS[ti];
  const vi = Math.floor(hash(seed * 13 + 2) * domain.verbs.length);
  const si = Math.floor(hash(seed * 31 + 3) * domain.subjects.length);
  const verb = domain.verbs[vi];
  const subject = domain.subjects[si];
  const title = tier.prefix + verb + ' ' + subject.substring(0, 65) + (subject.length > 65 ? '...' : '');
  const description = verb + ' ' + subject + '. This builds your ' + domain.name.toLowerCase() + ' toward a spacefaring civilization.';
  const r = hash(seed * 47 + 5);
  const xp = tier.xpRange[0] + Math.floor(r * (tier.xpRange[1] - tier.xpRange[0]));
  const curr = tier.currRange[0] + Math.floor(r * (tier.currRange[1] - tier.currRange[0]));
  const realReward = REAL_REWARDS[Math.floor(hash(seed * 59 + 7) * REAL_REWARDS.length)] || null;
  return { taskId:'gen-'+seed, title:title, description:description, category:domain.name, categoryIcon:domain.icon, xpReward:xp, currencyReward:curr, cooldown:tier.cooldown, tier:tier.name, realReward:realReward, isActive:true, requiresVerification:ti>=3, isGenerated:true };
}

function generateRandomBatch(count) {
  count = count || 30;
  var tasks = []; var used = {};
  var attempts = 0;
  while (tasks.length < count && attempts < count * 3) {
    var seed = Math.floor(Math.random() * 1000000);
    if (!used[seed]) { used[seed] = true; tasks.push(generateTask(seed)); }
    attempts++;
  }
  return tasks;
}

function generateByDomain(domainName, count) {
  count = count || 20;
  var dk = Object.keys(DOMAINS);
  var di = dk.findIndex(function(k) { return DOMAINS[k].name === domainName; });
  if (di === -1) return generateRandomBatch(count);
  var tasks = []; var used = {}; var attempts = 0;
  while (tasks.length < count && attempts < count * 5) {
    var seed = di + dk.length * Math.floor(Math.random() * 100000);
    if (!used[seed]) { used[seed] = true; var t = generateTask(seed); if (t.category === domainName) tasks.push(t); }
    attempts++;
  }
  return tasks;
}

function getDomainInfo() {
  return Object.values(DOMAINS).map(function(d) {
    return { name:d.name, icon:d.icon, totalPossible:d.verbs.length * d.subjects.length * TIERS.length };
  });
}

function getTotalTaskCount() {
  var total = 0;
  Object.values(DOMAINS).forEach(function(d) { total += d.verbs.length * d.subjects.length * TIERS.length; });
  return total;
}

module.exports = { generateTask:generateTask, generateRandomBatch:generateRandomBatch, generateByDomain:generateByDomain, getDomainInfo:getDomainInfo, getTotalTaskCount:getTotalTaskCount, DOMAINS:DOMAINS, TIERS:TIERS };
`;

fs.writeFileSync(path.join(__dirname, '..', 'services', 'taskGenerator.js'), code, 'utf8');
console.log('taskGenerator.js written successfully');

// Test it
delete require.cache[require.resolve('../services/taskGenerator')];
const tg = require('../services/taskGenerator');
console.log('Total unique tasks:', tg.getTotalTaskCount());
const info = tg.getDomainInfo();
info.forEach(d => console.log('  ' + d.icon + ' ' + d.name + ': ' + d.totalPossible));
const sample = tg.generateRandomBatch(3);
sample.forEach(t => console.log('  Sample:', t.category, '-', t.title.substring(0, 60)));
