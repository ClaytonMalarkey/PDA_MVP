# AI Task Completion System

## Overview

The AI Task Completion System allows users to get AI-powered assistance for completing complex tasks. This is particularly useful for creative, writing, and planning tasks.

## Task 4998: Draft a Constitution

**Task Details:**
- **Task ID:** 4998
- **Title:** Governance Task 4998: Draft a constitution for the first human colony beyond Earth
- **Category:** Governance
- **Description:** Draft a constitution for the first human colony beyond Earth
- **Rewards:** 148 XP, 28 Currency
- **Requires Verification:** Yes

## How It Works

### For Users

1. **Browse Tasks**: Navigate to the Tasks page in the user dashboard
2. **Find AI-Eligible Tasks**: Look for tasks with the "🤖 Use AI" button
3. **Get AI Assistance**: Click the "Use AI" button to open the AI Task Assistant
4. **Receive Guidance**: The AI provides:
   - Structured document outline
   - Key principles and suggestions
   - Sample templates and examples
   - Verification criteria
5. **Complete Task**: Write or paste your work in the provided text area
6. **Submit**: Submit your completed work for verification

### AI-Eligible Tasks

Tasks are eligible for AI assistance if their title contains any of these keywords:
- draft
- design
- create
- write
- plan
- map
- invent

### For Task 4998 Specifically

The AI Assistant provides:

**Document Structure:**
1. Preamble - State the purpose and founding principles
2. Article I: Governance Structure - Define the governmental system
3. Article II: Rights and Responsibilities - Enumerate citizen rights
4. Article III: Resource Management - Define resource allocation
5. Article IV: Emergency Powers - Define crisis management
6. Article V: Relations - Define external relationships
7. Article VI: Amendments - Define amendment process

**Suggestions:**
- Start with a preamble stating the colony's purpose and values
- Include articles on governance structure (executive, legislative, judicial)
- Address resource allocation and property rights
- Define citizenship and rights in a space environment
- Include emergency protocols for life-threatening situations
- Address relationship with Earth and other colonies
- Include amendment procedures for future changes

**Verification Criteria:**
- Document is at least 500 words
- Includes a preamble or introduction
- Contains at least 5 distinct articles or sections
- Addresses governance structure
- Addresses rights and responsibilities
- Considers space-specific challenges
- Is well-organized and clearly written

## API Endpoints

### Get AI Assistance
```
GET /api/ai/tasks/:taskId/assist
Authorization: Bearer <token>
```

**Response:**
```json
{
  "taskId": "4998",
  "title": "Governance Task 4998: Draft a constitution...",
  "prompt": "...",
  "suggestions": [...],
  "template": {...},
  "verificationCriteria": [...]
}
```

### Submit AI-Assisted Task
```
POST /api/ai/tasks/:taskId/submit
Authorization: Bearer <token>
Content-Type: application/json

{
  "content": "Your completed work...",
  "aiAssisted": true
}
```

**Response:**
```json
{
  "success": true,
  "userTask": {...},
  "message": "Task submitted for verification",
  "verification": {
    "passed": true,
    "reasons": ["All verification criteria met"],
    "score": 100
  }
}
```

## Technical Implementation

### Backend Components

1. **aiTaskController.js** - Handles AI assistance and submission logic
2. **aiTasks.js** - API routes for AI task operations
3. **UserTask Model** - Extended with `submission` field for AI-assisted completions

### Frontend Components

1. **AITaskAssistant.jsx** - React component for AI assistance UI
2. **AITaskAssistant.css** - Styling for the AI assistant
3. **Tasks.jsx** - Updated to include AI assistant integration

### Database Schema

**UserTask.submission:**
```javascript
{
  content: String,        // User's completed work
  aiAssisted: Boolean,    // Whether AI was used
  submittedAt: Date       // Submission timestamp
}
```

## Future Enhancements

1. **Real AI Integration**: Connect to actual AI services (OpenAI, Anthropic, etc.)
2. **Quality Scoring**: Implement automated quality assessment
3. **Peer Review**: Allow other users to review AI-assisted submissions
4. **Learning Path**: Track user progress and suggest related tasks
5. **Custom Templates**: Allow admins to create custom AI templates per task
6. **Multi-language Support**: Provide AI assistance in multiple languages

## Testing

Run the test script to verify task 4998 configuration:

```bash
cd public-deindoctrination-app/backend
node src/scripts/testAITask.js
```

## Usage Example

1. User logs in and navigates to Tasks page
2. User finds task 4998 "Draft a constitution for the first human colony beyond Earth"
3. User clicks "🤖 Use AI" button
4. AI Assistant modal opens with:
   - Task overview
   - 7 suggestions for constitution drafting
   - Document structure with 7 articles
   - Example template text
   - 7 verification criteria
5. User writes their constitution (500+ characters)
6. User clicks "Submit Task"
7. System verifies the submission meets criteria
8. Task is marked as "pending" for admin verification
9. User receives 148 XP and 28 Currency upon approval

## Notes

- AI-assisted submissions are clearly marked in the database
- Tasks requiring verification must be approved by admins
- Minimum content length: 100 characters (500 for constitutions)
- All submissions are stored for review and audit purposes
