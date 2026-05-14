require('dotenv').config();
const mongoose = require('mongoose');
const Task = require('../models/Task');

const categories = ['Critical Thinking', 'Media Literacy', 'Emotional Intelligence', 'Civic Engagement'];

const taskTemplates = {
  'Critical Thinking': [
    { title: 'Analyze News Article', description: 'Critically analyze a news article for bias and logical fallacies', xpReward: 60, currencyReward: 120, cooldown: 24 },
    { title: 'Debate Practice', description: 'Engage in a structured debate on a controversial topic', xpReward: 80, currencyReward: 160, cooldown: 48 },
    { title: 'Logic Puzzle', description: 'Solve a complex logic puzzle or riddle', xpReward: 50, currencyReward: 100, cooldown: 24 },
    { title: 'Fact-Check Claims', description: 'Fact-check 5 claims you encounter online', xpReward: 70, currencyReward: 140, cooldown: 24 },
    { title: 'Identify Fallacies', description: 'Identify and document 3 logical fallacies in media', xpReward: 55, currencyReward: 110, cooldown: 24 },
    { title: 'Question Assumptions', description: 'Challenge your own assumptions on a belief you hold', xpReward: 65, currencyReward: 130, cooldown: 48 },
    { title: 'Research Topic', description: 'Research a topic from multiple perspectives', xpReward: 75, currencyReward: 150, cooldown: 48 },
    { title: 'Socratic Questioning', description: 'Practice Socratic questioning with someone', xpReward: 60, currencyReward: 120, cooldown: 24 },
    { title: 'Evaluate Evidence', description: 'Evaluate the quality of evidence for a claim', xpReward: 70, currencyReward: 140, cooldown: 24 },
    { title: 'Problem Solving', description: 'Solve a real-world problem using critical thinking', xpReward: 85, currencyReward: 170, cooldown: 48 }
  ],
  'Media Literacy': [
    { title: 'Source Verification', description: 'Verify the credibility of 3 online sources', xpReward: 50, currencyReward: 100, cooldown: 24 },
    { title: 'Spot Deepfakes', description: 'Learn to identify deepfakes and manipulated media', xpReward: 70, currencyReward: 140, cooldown: 48 },
    { title: 'Media Bias Analysis', description: 'Analyze media bias in news coverage', xpReward: 65, currencyReward: 130, cooldown: 24 },
    { title: 'Propaganda Techniques', description: 'Identify propaganda techniques in advertisements', xpReward: 60, currencyReward: 120, cooldown: 24 },
    { title: 'Digital Footprint', description: 'Review and clean up your digital footprint', xpReward: 55, currencyReward: 110, cooldown: 168 },
    { title: 'Privacy Settings', description: 'Update privacy settings on all social media', xpReward: 45, currencyReward: 90, cooldown: 168 },
    { title: 'Misinformation Report', description: 'Report misinformation you find online', xpReward: 40, currencyReward: 80, cooldown: 24 },
    { title: 'Media Comparison', description: 'Compare how different outlets cover the same story', xpReward: 75, currencyReward: 150, cooldown: 48 },
    { title: 'Algorithm Awareness', description: 'Document how algorithms influence your feed', xpReward: 65, currencyReward: 130, cooldown: 48 },
    { title: 'Create Media', description: 'Create ethical and accurate media content', xpReward: 80, currencyReward: 160, cooldown: 48 }
  ],
  'Emotional Intelligence': [
    { title: 'Emotion Journal', description: 'Journal about your emotions and their triggers', xpReward: 40, currencyReward: 80, cooldown: 24 },
    { title: 'Active Listening', description: 'Practice active listening in a conversation', xpReward: 50, currencyReward: 100, cooldown: 24 },
    { title: 'Empathy Exercise', description: 'Put yourself in someone else\'s shoes', xpReward: 55, currencyReward: 110, cooldown: 24 },
    { title: 'Conflict Resolution', description: 'Resolve a conflict using emotional intelligence', xpReward: 75, currencyReward: 150, cooldown: 48 },
    { title: 'Self-Reflection', description: 'Reflect on your emotional responses today', xpReward: 45, currencyReward: 90, cooldown: 24 },
    { title: 'Mindful Communication', description: 'Communicate mindfully in difficult situations', xpReward: 60, currencyReward: 120, cooldown: 24 },
    { title: 'Recognize Emotions', description: 'Identify and name 5 different emotions you feel', xpReward: 35, currencyReward: 70, cooldown: 12 },
    { title: 'Stress Management', description: 'Practice healthy stress management techniques', xpReward: 50, currencyReward: 100, cooldown: 24 },
    { title: 'Gratitude Practice', description: 'Express gratitude to someone meaningfully', xpReward: 40, currencyReward: 80, cooldown: 24 },
    { title: 'Emotional Regulation', description: 'Practice regulating strong emotions', xpReward: 65, currencyReward: 130, cooldown: 24 }
  ],
  'Civic Engagement': [
    { title: 'Contact Representative', description: 'Contact your elected representative about an issue', xpReward: 70, currencyReward: 140, cooldown: 168 },
    { title: 'Attend Town Hall', description: 'Attend a town hall or community meeting', xpReward: 85, currencyReward: 170, cooldown: 168 },
    { title: 'Volunteer Locally', description: 'Volunteer for a local community organization', xpReward: 90, currencyReward: 180, cooldown: 168 },
    { title: 'Learn Civics', description: 'Learn about your local government structure', xpReward: 50, currencyReward: 100, cooldown: 48 },
    { title: 'Register to Vote', description: 'Ensure you\'re registered to vote', xpReward: 60, currencyReward: 120, cooldown: 8760 },
    { title: 'Research Candidates', description: 'Research candidates and their positions', xpReward: 65, currencyReward: 130, cooldown: 168 },
    { title: 'Community Service', description: 'Participate in community service', xpReward: 80, currencyReward: 160, cooldown: 168 },
    { title: 'Petition Signing', description: 'Research and sign a petition for a cause', xpReward: 40, currencyReward: 80, cooldown: 48 },
    { title: 'Civic Discussion', description: 'Have a respectful civic discussion', xpReward: 55, currencyReward: 110, cooldown: 24 },
    { title: 'Know Your Rights', description: 'Learn about your civil rights and responsibilities', xpReward: 60, currencyReward: 120, cooldown: 168 }
  ]
};

async function populateTasks() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected\n');

    // Clear existing tasks
    await Task.deleteMany({});
    console.log('Cleared existing tasks\n');

    const tasks = [];
    let taskIdCounter = 1;

    // Create tasks for each category
    for (const category of categories) {
      console.log(`Creating tasks for category: ${category}`);
      
      const categoryTasks = taskTemplates[category];
      
      for (const template of categoryTasks) {
        const task = {
          taskId: `task-${taskIdCounter}`,
          title: template.title,
          description: template.description,
          category: category,
          xpReward: template.xpReward,
          currencyReward: template.currencyReward,
          cooldown: template.cooldown,
          requiresVerification: template.xpReward >= 80, // High reward tasks require verification
          isActive: true
        };
        
        tasks.push(task);
        taskIdCounter++;
      }
    }

    // Insert all tasks
    await Task.insertMany(tasks);
    
    console.log(`\n✅ Successfully created ${tasks.length} tasks!`);
    console.log(`\nBreakdown by category:`);
    for (const category of categories) {
      const count = tasks.filter(t => t.category === category).length;
      console.log(`  ${category}: ${count} tasks`);
    }

    // Show sample tasks
    console.log('\nSample tasks:');
    for (const category of categories) {
      const sample = tasks.find(t => t.category === category);
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ${sample.title}`);
      console.log(`  ${sample.description}`);
      console.log(`  Rewards: ${sample.xpReward} XP, ${sample.currencyReward} currency`);
      console.log(`  Cooldown: ${sample.cooldown} hours`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error populating tasks:', error);
    process.exit(1);
  }
}

populateTasks();
