/**
 * AI Task Verification Service — Multi-Layer
 * Layer 1: Text analysis (keyword matching, length, specificity)
 * Layer 2: Photo/media metadata analysis
 * Layer 3: Behavioral signals (time spent, patterns)
 * Layer 4: Peer verification bonus
 * Layer 5: Confidence scoring with reward scaling
 */

const DOMAIN_KEYWORDS = {
  'Critical Thinking': ['analyzed','questioned','evaluated','researched','compared','identified','fallacy','bias','evidence','source','logic','argument','perspective','data','conclusion','found','discovered','realized','noticed','understood'],
  'Sound Money': ['budget','saved','invested','calculated','tracked','inflation','interest','asset','income','expense','wealth','currency','financial','compound','return','spent','earned','reduced','increased','planned'],
  'Self-Reliance': ['built','grew','cooked','repaired','learned','practiced','prepared','harvested','crafted','fixed','survival','garden','tool','skill','emergency','made','created','completed','finished','succeeded'],
  'Accountability': ['tracked','committed','completed','measured','reviewed','improved','journaled','woke','exercised','meditated','streak','habit','goal','progress','discipline','maintained','achieved','kept','held','followed'],
  'Space Expansion': ['studied','designed','calculated','researched','orbit','mars','rocket','propulsion','habitat','radiation','gravity','launch','colony','terraform','asteroid','learned','understood','modeled','planned','explored'],
  'Physical Mastery': ['exercised','ran','lifted','stretched','trained','pushups','squats','walked','hiked','swam','climbed','held','balanced','sprinted','recovered','completed','finished','achieved','beat','improved'],
  'Community Building': ['organized','helped','taught','mentored','volunteered','connected','collaborated','shared','supported','led','community','neighbor','group','team','local','met','gathered','coordinated','facilitated','united'],
  'Technology': ['coded','built','deployed','automated','configured','programmed','designed','debugged','learned','created','script','app','server','database','api','wrote','implemented','fixed','shipped','launched'],
  'Governance': ['studied','debated','proposed','analyzed','participated','advocated','rights','freedom','law','governance','constitution','vote','policy','ethics','sovereignty','read','discussed','wrote','attended','organized'],
  'Creative Expression': ['created','wrote','designed','drew','painted','composed','built','crafted','performed','expressed','art','story','music','poem','design','made','finished','shared','published','completed'],
  // CSV task categories
  'Spiritual': ['meditated','reflected','prayed','contemplated','journaled','felt','experienced','connected','centered','peaceful','mindful','aware','present','grateful','calm'],
  'Creative': ['designed','drew','painted','built','created','made','crafted','sketched','modeled','illustrated','wrote','composed','filmed','photographed','sculpted'],
  'Fitness': ['trained','ran','walked','lifted','exercised','completed','finished','achieved','pushed','endured','stretched','recovered','improved','beat','hit'],
  'Exploration': ['mapped','researched','studied','explored','discovered','planned','designed','calculated','theorized','modeled','investigated','analyzed','documented','charted','surveyed'],
  'Governance': ['drafted','studied','debated','proposed','analyzed','participated','advocated','wrote','discussed','organized','attended','researched','evaluated','examined','defended'],
  'Engineering': ['built','designed','modeled','constructed','assembled','tested','prototyped','engineered','fabricated','demonstrated','created','made','completed','finished','submitted'],
  'Education': ['learned','studied','passed','completed','researched','read','watched','practiced','understood','mastered','reviewed','summarized','explained','taught','demonstrated'],
  'Survival': ['grew','harvested','preserved','prepared','built','practiced','learned','cooked','stored','collected','planted','tended','maintained','completed','showed'],
  'Social': ['educated','shared','recorded','posted','taught','connected','reached','organized','volunteered','helped','collaborated','communicated','presented','explained','inspired'],
  'Innovation': ['invented','built','designed','created','prototyped','submitted','developed','engineered','made','completed','tested','improved','solved','implemented','launched'],
};

// Abuse detection patterns
const SPAM_PATTERNS = [
  /^done$/i, /^yes$/i, /^completed$/i, /^ok$/i, /^finished$/i,
  /^(.)\1{4,}$/, // repeated characters
];

function detectSpam(text) {
  if (!text || text.trim().length < 10) return true;
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(text.trim())) return true;
  }
  // Check for copy-paste (same word repeated many times)
  const words = text.toLowerCase().split(/\s+/);
  const wordFreq = {};
  words.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
  const maxFreq = Math.max(...Object.values(wordFreq));
  if (maxFreq > words.length * 0.4 && words.length > 5) return true;
  return false;
}

function verifyTaskCompletion(task, proof, metadata) {
  if (!proof || proof.trim().length < 10) {
    return { verified: false, score: 0, feedback: 'Provide more detail (at least 10 characters).', layers: [] };
  }

  // Spam detection
  if (detectSpam(proof)) {
    return { verified: false, score: 0, feedback: 'Response appears to be spam or too generic. Describe specifically what you did.', layers: [] };
  }

  const words = proof.toLowerCase().split(/\s+/);
  const category = task.category || '';
  const keywords = DOMAIN_KEYWORDS[category] || [];
  const layers = [];
  let score = 0;

  // === LAYER 1: TEXT ANALYSIS ===
  let textScore = 0;

  // Length scoring
  if (words.length >= 5)  { textScore += 8; }
  if (words.length >= 15) { textScore += 10; }
  if (words.length >= 30) { textScore += 8; }
  if (words.length >= 60) { textScore += 5; }

  // Keyword matching
  let keywordHits = 0;
  keywords.forEach(kw => { if (proof.toLowerCase().includes(kw)) keywordHits++; });
  if (keywordHits >= 1) { textScore += 12; }
  if (keywordHits >= 3) { textScore += 10; }
  if (keywordHits >= 5) { textScore += 8; }

  // Task title word matching
  const titleWords = (task.title || '').toLowerCase().split(/\s+/).filter(w => w.length > 4);
  let titleHits = 0;
  titleWords.forEach(tw => { if (proof.toLowerCase().includes(tw)) titleHits++; });
  if (titleHits >= 1) { textScore += 8; }
  if (titleHits >= 3) { textScore += 7; }

  // Specificity signals
  if (/\d+/.test(proof)) { textScore += 5; } // numbers = specific
  if (/today|yesterday|morning|tonight|hours|minutes|seconds/i.test(proof)) { textScore += 4; }
  if (/because|therefore|result|outcome|learned|realized|discovered/i.test(proof)) { textScore += 5; }
  if (/felt|noticed|observed|found|saw|heard/i.test(proof)) { textScore += 3; }

  // Sentence structure (multiple sentences = more detail)
  const sentences = proof.split(/[.!?]+/).filter(s => s.trim().length > 5);
  if (sentences.length >= 2) { textScore += 5; }
  if (sentences.length >= 4) { textScore += 5; }

  textScore = Math.min(textScore, 60);
  score += textScore;
  layers.push({ name: 'Text Analysis', score: textScore, max: 60, icon: '📝' });

  // === LAYER 2: MEDIA EVIDENCE ===
  let mediaScore = 0;
  if (metadata?.hasPhoto) {
    mediaScore += 20;
    if (metadata.photoTimestamp) { mediaScore += 5; } // timestamped photo
  }
  if (metadata?.hasVideo) { mediaScore += 25; }
  if (metadata?.hasAudio) { mediaScore += 15; }
  mediaScore = Math.min(mediaScore, 30);
  score += mediaScore;
  if (mediaScore > 0) layers.push({ name: 'Media Evidence', score: mediaScore, max: 30, icon: '📸' });

  // === LAYER 3: BEHAVIORAL SIGNALS ===
  let behaviorScore = 0;
  if (metadata?.timeSpent) {
    const mins = metadata.timeSpent / 60;
    if (mins >= 5)  { behaviorScore += 3; }
    if (mins >= 15) { behaviorScore += 4; }
    if (mins >= 30) { behaviorScore += 5; }
    if (mins >= 60) { behaviorScore += 3; }
  }
  if (metadata?.gpsVerified) { behaviorScore += 5; }
  if (metadata?.deviceConsistent) { behaviorScore += 2; }
  behaviorScore = Math.min(behaviorScore, 15);
  score += behaviorScore;
  if (behaviorScore > 0) layers.push({ name: 'Behavioral Signals', score: behaviorScore, max: 15, icon: '📊' });

  // === LAYER 4: SOCIAL VERIFICATION ===
  let socialScore = 0;
  if (metadata?.peerVerified) { socialScore += 15; }
  if (metadata?.publiclyShared) { socialScore += 5; }
  socialScore = Math.min(socialScore, 20);
  score += socialScore;
  if (socialScore > 0) layers.push({ name: 'Social Verification', score: socialScore, max: 20, icon: '👥' });

  // === LAYER 5: GPS / LOCATION ===
  let locationScore = 0;
  if (metadata?.hasGPS) { locationScore += 10; }
  locationScore = Math.min(locationScore, 10);
  score += locationScore;
  if (locationScore > 0) layers.push({ name: 'Location Verified', score: locationScore, max: 10, icon: '📍' });

  score = Math.min(score, 100);
  const verified = score >= 25;

  // Reward multiplier: 1.0 at 25%, scales to 1.5 at 100%
  const multiplier = verified ? (1 + (score - 25) / 150) : 0;

  // Generate feedback
  let feedback;
  if (!verified) {
    feedback = `Not verified (${score}/100). Add more specific detail about what you actually did.`;
  } else if (score < 50) {
    feedback = `Partially verified (${score}/100). Good start — add more detail for higher rewards.`;
  } else if (score < 75) {
    feedback = `Verified (${score}/100)! ${layers.map(l => l.icon).join('')} Good evidence provided.`;
  } else {
    feedback = `Strongly verified (${score}/100)! ${layers.map(l => l.icon).join('')} Excellent proof — maximum bonus applied.`;
  }

  return { verified, score, multiplier: parseFloat(multiplier.toFixed(2)), layers, feedback };
}

// Batch verify multiple proofs (for admin review)
function batchVerify(submissions) {
  return submissions.map(s => ({
    ...s,
    verification: verifyTaskCompletion(s.task, s.proof, s.metadata)
  }));
}

module.exports = { verifyTaskCompletion, batchVerify, DOMAIN_KEYWORDS };
