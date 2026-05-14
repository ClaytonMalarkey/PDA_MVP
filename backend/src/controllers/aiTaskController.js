const Task = require('../models/Task');
const UserTask = require('../models/UserTask');

/**
 * AI Task Completion Controller
 * Handles AI-assisted task completion and verification
 */

/**
 * Generate AI prompt for task completion
 */
const generateTaskPrompt = (task) => {
  const prompts = {
    'Draft a constitution': `You are helping a user draft a constitution for the first human colony beyond Earth. 

Task: ${task.title}
Description: ${task.description}

Please provide:
1. A structured outline for the constitution (10-15 articles)
2. Key principles that should be included
3. Specific considerations for a space colony
4. Sample text for 3-5 critical articles

Format the response as a complete draft that the user can review and customize.`,
    
    'Design a futuristic city': `You are helping a user design a futuristic city.

Task: ${task.title}
Description: ${task.description}

Please provide:
1. City layout description
2. Key infrastructure elements
3. Sustainability features
4. Population capacity and zones
5. Transportation systems

Format as a detailed design document.`,
    
    'Map out a theoretical': `You are helping a user map out a theoretical route or system.

Task: ${task.title}
Description: ${task.description}

Please provide:
1. Route/system overview
2. Key waypoints or components
3. Reasoning for each decision
4. Potential challenges
5. Alternative options

Format as a comprehensive mapping document.`,
    
    'Invent a new tool': `You are helping a user invent a new tool or system.

Task: ${task.title}
Description: ${task.description}

Please provide:
1. Tool/system concept overview
2. Key features and functionality
3. Materials or components needed
4. Use cases and benefits
5. Implementation considerations

Format as a detailed invention proposal.`
  };

  // Find matching prompt template
  for (const [key, prompt] of Object.entries(prompts)) {
    if (task.title.includes(key) || task.description.includes(key)) {
      return prompt;
    }
  }

  // Default prompt
  return `You are helping a user complete a task.

Task: ${task.title}
Description: ${task.description}
Verification: ${task.taskCheck || 'Submit your completed work'}

Please provide detailed guidance and a template/example that the user can use to complete this task. Be specific and actionable.`;
};

/**
 * Get AI assistance for a task
 * POST /api/ai/tasks/:taskId/assist
 */
const getTaskAssistance = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;

    // Find the task
    const task = await Task.findOne({ taskId }).lean();
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Generate AI prompt
    const prompt = generateTaskPrompt(task);

    // For now, return a structured response
    // In production, this would call an actual AI service
    const assistance = {
      taskId: task.taskId,
      title: task.title,
      prompt: prompt,
      suggestions: generateSuggestions(task),
      template: generateTemplate(task),
      verificationCriteria: generateVerificationCriteria(task)
    };

    res.json(assistance);
  } catch (error) {
    console.error('Error getting task assistance:', error);
    res.status(500).json({ error: 'Failed to get task assistance' });
  }
};

/**
 * Generate suggestions based on task type
 */
const generateSuggestions = (task) => {
  if (task.title.includes('constitution')) {
    return [
      'Start with a preamble stating the colony\'s purpose and values',
      'Include articles on governance structure (executive, legislative, judicial)',
      'Address resource allocation and property rights',
      'Define citizenship and rights in a space environment',
      'Include emergency protocols for life-threatening situations',
      'Address relationship with Earth and other colonies',
      'Include amendment procedures for future changes'
    ];
  }

  if (task.title.includes('city') && task.title.includes('design')) {
    return [
      'Consider radiation shielding and atmospheric containment',
      'Plan for modular expansion as population grows',
      'Include redundant life support systems',
      'Design for psychological well-being (green spaces, natural light)',
      'Plan efficient transportation (minimize energy use)',
      'Include research and industrial zones',
      'Design for resource recycling and sustainability'
    ];
  }

  return [
    'Research similar real-world examples',
    'Consider practical constraints and requirements',
    'Think about scalability and future growth',
    'Include safety and backup systems',
    'Document your reasoning and decisions'
  ];
};

/**
 * Generate template based on task type
 */
const generateTemplate = (task) => {
  if (task.title.includes('constitution')) {
    return {
      type: 'document',
      sections: [
        { title: 'Preamble', description: 'State the purpose and founding principles' },
        { title: 'Article I: Governance Structure', description: 'Define the governmental system' },
        { title: 'Article II: Rights and Responsibilities', description: 'Enumerate citizen rights' },
        { title: 'Article III: Resource Management', description: 'Define resource allocation' },
        { title: 'Article IV: Emergency Powers', description: 'Define crisis management' },
        { title: 'Article V: Relations', description: 'Define external relationships' },
        { title: 'Article VI: Amendments', description: 'Define amendment process' }
      ],
      example: `PREAMBLE

We, the founding members of [Colony Name], establishing the first permanent human settlement beyond Earth, do hereby create this Constitution to ensure the survival, prosperity, and liberty of all colonists and their descendants.

ARTICLE I: GOVERNANCE STRUCTURE

Section 1: The colony shall be governed by a Council of [number] elected representatives.
Section 2: Elections shall be held every [timeframe] using [voting method].
Section 3: The Council shall have authority over [list powers].

[Continue with remaining articles...]`
    };
  }

  return {
    type: 'general',
    structure: 'Follow the task requirements and submit your completed work',
    tips: 'Be thorough, creative, and consider all aspects of the challenge'
  };
};

/**
 * Generate verification criteria
 */
const generateVerificationCriteria = (task) => {
  const criteria = [];

  if (task.title.includes('constitution')) {
    criteria.push(
      'Document is at least 500 words',
      'Includes a preamble or introduction',
      'Contains at least 5 distinct articles or sections',
      'Addresses governance structure',
      'Addresses rights and responsibilities',
      'Considers space-specific challenges',
      'Is well-organized and clearly written'
    );
  } else if (task.title.includes('design')) {
    criteria.push(
      'Includes visual or detailed written description',
      'Addresses key functional requirements',
      'Considers practical constraints',
      'Shows creativity and innovation',
      'Is feasible within stated parameters'
    );
  } else {
    criteria.push(
      'Meets the task requirements',
      'Shows effort and thoughtfulness',
      'Is complete and well-presented',
      'Demonstrates understanding of the topic'
    );
  }

  return criteria;
};

/**
 * Submit AI-assisted task completion
 * POST /api/ai/tasks/:taskId/submit
 */
const submitAIAssistedTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    const { content, aiAssisted } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    // Find the task
    const task = await Task.findOne({ taskId });
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check if user has already completed this task
    const existingUserTask = await UserTask.findOne({ userId, taskId: task._id });
    
    if (existingUserTask && existingUserTask.status === 'completed') {
      return res.status(400).json({ error: 'Task already completed' });
    }

    // Verify content meets minimum criteria
    const verification = verifyTaskCompletion(task, content);
    
    if (!verification.passed) {
      return res.status(400).json({ 
        error: 'Submission does not meet minimum criteria',
        details: verification.reasons
      });
    }

    // Determine if task should be auto-approved or require admin verification
    const autoApprove = !task.requiresVerification && verification.score >= 80;
    const status = autoApprove ? 'completed' : 'pending';

    // Create or update user task
    const userTask = await UserTask.findOneAndUpdate(
      { userId, taskId: task._id },
      {
        status: status,
        completedAt: autoApprove ? new Date() : null,
        submission: {
          content,
          aiAssisted: aiAssisted || false,
          submittedAt: new Date()
        },
        xpAwarded: autoApprove ? task.xpReward : 0,
        currencyAwarded: autoApprove ? task.currencyReward : 0
      },
      { upsert: true, new: true }
    );

    // If auto-approved, update user's XP and currency
    let rewards = null;
    if (autoApprove) {
      const User = require('../models/User');
      await User.findByIdAndUpdate(userId, {
        $inc: {
          xp: task.xpReward,
          currency: task.currencyReward
        }
      });
      
      rewards = {
        xp: task.xpReward,
        currency: task.currencyReward
      };
    }

    res.json({
      success: true,
      userTask,
      message: autoApprove 
        ? '🎉 Task completed successfully!' 
        : '📝 Task submitted for admin verification',
      verification,
      rewards,
      autoApproved: autoApprove
    });
  } catch (error) {
    console.error('Error submitting AI-assisted task:', error);
    res.status(500).json({ error: 'Failed to submit task' });
  }
};

/**
 * Verify task completion meets criteria
 */
const verifyTaskCompletion = (task, content) => {
  const reasons = [];
  let passed = true;
  let score = 100;

  // Minimum length check
  if (content.length < 100) {
    passed = false;
    score = 0;
    reasons.push('Content is too short (minimum 100 characters)');
    return { passed, reasons, score };
  }

  // Task-specific checks
  if (task.title.includes('constitution')) {
    if (content.length < 500) {
      passed = false;
      score = Math.max(0, (content.length / 500) * 100);
      reasons.push('Constitution should be at least 500 characters');
    }
    
    const hasStructure = content.includes('Article') || content.includes('Section') || content.includes('Chapter');
    if (!hasStructure) {
      passed = false;
      score = Math.min(score, 60);
      reasons.push('Constitution should have a clear structure (Articles/Sections)');
    }
    
    const hasPreamble = content.toLowerCase().includes('preamble') || content.toLowerCase().includes('we,');
    if (!hasPreamble && passed) {
      score = Math.min(score, 90);
      reasons.push('Consider adding a preamble for a stronger constitution');
    }
  } else if (task.title.includes('design')) {
    if (content.length < 300) {
      score = Math.max(60, (content.length / 300) * 100);
      reasons.push('Design description could be more detailed (recommended 300+ characters)');
    }
  } else {
    // General task validation
    if (content.length < 200) {
      score = Math.max(70, (content.length / 200) * 100);
      reasons.push('Submission could be more detailed');
    }
  }

  // Check for effort and thoughtfulness
  const wordCount = content.trim().split(/\s+/).length;
  if (wordCount < 50) {
    score = Math.min(score, 70);
    reasons.push('Submission seems brief. Consider adding more detail.');
  }

  if (passed && reasons.length === 0) {
    reasons.push('✅ All verification criteria met! Excellent work!');
  } else if (score >= 80) {
    passed = true;
    reasons.push('✅ Submission meets minimum requirements');
  }

  return { passed, reasons, score: Math.round(score) };
};

module.exports = {
  getTaskAssistance,
  submitAIAssistedTask
};
