/**
 * Task Helper — Generates AI hints and step-by-step guides for completing tasks
 */

const DOMAIN_HINTS = {
  'Critical Thinking': {
    steps: ['1. Read/watch the source material carefully', '2. Identify the main claim being made', '3. Look for evidence supporting and contradicting it', '4. Check for logical fallacies (ad hominem, straw man, appeal to authority)', '5. Find the original data or primary source', '6. Write your analysis with specific examples'],
    tips: ['Use the CRAAP test: Currency, Relevance, Authority, Accuracy, Purpose', 'Ask "who benefits?" from this narrative', 'Look for what is NOT being said', 'Check multiple independent sources', 'Separate facts from opinions and interpretations'],
    resources: ['yourlogicalfallacyis.com — Visual fallacy guide', 'allsides.com — Media bias comparison', 'scholar.google.com — Academic papers', 'factcheck.org — Claim verification']
  },
  'Sound Money': {
    steps: ['1. Define what you want to learn or track', '2. Gather your financial data (accounts, expenses, income)', '3. Use a spreadsheet or app to organize numbers', '4. Calculate the relevant metrics', '5. Compare against benchmarks or historical data', '6. Document your findings and action plan'],
    tips: ['Track every expense for awareness', 'Pay yourself first — save before spending', 'Understand the difference between assets and liabilities', 'Learn about compound interest — it works for and against you', 'Diversify income streams, not just investments'],
    resources: ['investopedia.com — Financial education', 'mises.org — Austrian economics', 'wtfhappenedin1971.com — Monetary history', 'Your bank statements — real data']
  },
  'Self-Reliance': {
    steps: ['1. Choose a specific skill to practice', '2. Watch a tutorial or read instructions', '3. Gather the materials or tools needed', '4. Practice the skill hands-on', '5. Note what worked and what didn\'t', '6. Repeat until you can do it without reference'],
    tips: ['Start with the simplest version of the skill', 'Practice in low-stakes situations first', 'Learn from someone experienced if possible', 'Keep a skills journal of what you learn', 'Focus on skills that compound — each one makes others easier'],
    resources: ['YouTube — Practical skill tutorials', 'Local library — How-to books', 'Community workshops and maker spaces', 'Experienced neighbors and friends']
  },
  'Accountability': {
    steps: ['1. Define the specific commitment clearly', '2. Set a measurable target and deadline', '3. Tell someone about your commitment', '4. Track your progress daily', '5. Review at the end — what worked, what didn\'t', '6. Adjust and recommit'],
    tips: ['Write it down — unwritten goals are wishes', 'Use a habit tracker app or journal', 'Start with just one habit at a time', 'Don\'t break the chain — consistency beats intensity', 'Forgive yourself for misses but get back on track immediately'],
    resources: ['Habit tracking apps (Loop, Streaks)', 'A physical journal or planner', 'An accountability partner', 'Timer apps for time-blocking']
  },
  'Space Expansion': {
    steps: ['1. Choose a specific space topic to study', '2. Read introductory material (Wikipedia, NASA)', '3. Watch educational videos or documentaries', '4. Take notes on key concepts and numbers', '5. Try to explain what you learned to someone', '6. Connect it to humanity\'s expansion goals'],
    tips: ['Start with the basics — orbital mechanics, rocket equation', 'Follow space news (SpaceX, NASA, ESA)', 'Learn the math — delta-v, Tsiolkovsky equation', 'Think about practical challenges, not just theory', 'Consider the economics — what makes space viable?'],
    resources: ['nasa.gov — Official space data', 'spacex.com — Current missions', 'Kerbal Space Program — Learn orbital mechanics by playing', 'Everyday Astronaut YouTube — Accessible explanations']
  },
  'Physical Mastery': {
    steps: ['1. Warm up for 5-10 minutes', '2. Perform the exercise with proper form', '3. Track your reps, sets, time, or distance', '4. Cool down and stretch', '5. Log your results', '6. Plan your next session with progressive overload'],
    tips: ['Form over weight — always', 'Consistency beats intensity', 'Sleep 7-9 hours for recovery', 'Hydrate before, during, and after', 'Listen to your body — rest when needed'],
    resources: ['YouTube — Form tutorials for any exercise', 'Strong app — Workout tracking', 'Couch to 5K — Running progression', 'Yoga with Adriene — Flexibility']
  },
  'Community Building': {
    steps: ['1. Identify a need in your community', '2. Find others who share the concern', '3. Propose a simple first action', '4. Organize a time and place', '5. Execute and document the results', '6. Plan the next step together'],
    tips: ['Start small — one neighbor, one project', 'Lead by example, not by telling', 'Make it easy for people to participate', 'Celebrate small wins publicly', 'Build trust through consistent follow-through'],
    resources: ['Nextdoor — Local community platform', 'Meetup.com — Find local groups', 'Your local library — Community hub', 'Facebook Groups — Neighborhood groups']
  },
  'Technology': {
    steps: ['1. Define what you want to build or learn', '2. Find a tutorial or documentation', '3. Set up your development environment', '4. Write code in small, testable pieces', '5. Test and debug', '6. Deploy or share your work'],
    tips: ['Start with the simplest working version', 'Read error messages carefully — they tell you what\'s wrong', 'Use version control (git) from day one', 'Don\'t copy-paste without understanding', 'Build projects, not just tutorials'],
    resources: ['freeCodeCamp.org — Free coding courses', 'MDN Web Docs — Web reference', 'Stack Overflow — Q&A', 'GitHub — Open source projects']
  },
  'Governance': {
    steps: ['1. Choose a governance topic to study', '2. Read primary sources (constitutions, philosophical texts)', '3. Compare different perspectives and systems', '4. Identify the principles at work', '5. Apply the concepts to current events', '6. Discuss with others to refine your understanding'],
    tips: ['Read the original texts, not just summaries', 'Study history — governance experiments have been tried', 'Follow the incentives — who benefits from each system?', 'Separate ideals from implementation', 'Consider unintended consequences'],
    resources: ['Constitution of your country — Primary source', 'Mises.org — Liberty-focused analysis', 'Stanford Encyclopedia of Philosophy', 'Local town hall meetings — Direct participation']
  },
  'Creative Expression': {
    steps: ['1. Choose your medium (writing, art, music, etc.)', '2. Set a time limit (30-60 minutes)', '3. Start creating without judging', '4. Focus on expressing the idea, not perfection', '5. Review and refine', '6. Share with someone for feedback'],
    tips: ['Done is better than perfect', 'Creativity is a muscle — exercise it daily', 'Steal like an artist — remix and combine ideas', 'Constraints breed creativity — limit your tools', 'Share your work — feedback accelerates growth'],
    resources: ['Canva — Design tool', 'Audacity — Audio editing', 'Blender — 3D modeling', 'Your hands and whatever materials are nearby']
  }
};

function getTaskHelp(category) {
  return DOMAIN_HINTS[category] || DOMAIN_HINTS['Critical Thinking'];
}

module.exports = { getTaskHelp, DOMAIN_HINTS };
