# Public Deindoctrination App - MVP

A gamified platform for developing critical thinking, media literacy, emotional intelligence, and civic engagement skills.

## Features

### User Features
- Task completion system with rewards (XP and currency)
- Streak tracking with multipliers
- Empire building with passive income structures
- Global leaderboard with time-based filtering
- User profile and progress tracking

### Admin Features
- Task management (CRUD operations)
- User management (role assignment, banning)
- Task verification system
- System metrics and analytics
- Dynamic UI configuration (CMS-style control)

## Tech Stack

- **Frontend**: React + Vite (JavaScript)
- **Backend**: Node.js + Express (JavaScript)
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT tokens
- **Styling**: CSS3 with custom properties

## Project Structure

```
public-deindoctrination-app/
├── backend/
│   ├── src/
│   │   ├── config/         # Database configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API routes
│   │   ├── scripts/        # Utility scripts (seed)
│   │   ├── utils/          # Helper functions
│   │   └── server.js       # Entry point
│   ├── .env.example        # Environment variables template
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/     # Reusable components
    │   ├── context/        # React context (Auth)
    │   ├── pages/          # Page components
    │   │   ├── admin/      # Admin dashboard pages
    │   │   ├── auth/       # Authentication pages
    │   │   └── user/       # User pages
    │   ├── App.jsx         # Main app component
    │   └── main.jsx        # Entry point
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

### Installation

1. Clone the repository
2. Set up the backend:

```bash
cd public-deindoctrination-app/backend
npm install
cp .env.example .env
# Edit .env with your configuration
```

3. Set up the frontend:

```bash
cd ../frontend
npm install
```

### Database Setup

1. Make sure MongoDB is running
2. Seed the database with initial data:

```bash
cd backend
npm run seed
```

This will create:
- 4 empire structures (Library, Training Grounds, Research Lab, Trade Hub)
- 12 sample tasks across 4 categories
- An admin user (credentials in .env)

### Running the Application

1. Start the backend server:

```bash
cd backend
npm run dev
```

Server will run on 196.75.153.172:5000

2. Start the frontend development server:

```bash
cd frontend
npm run dev
```

Frontend will run on 196.75.153.172:5173

### Default Admin Credentials

- Email: admin@example.com
- Password: Admin123!

(Change these in .env before seeding)

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user
- POST `/api/auth/reset-password` - Request password reset
- POST `/api/auth/reset-password-confirm` - Confirm password reset

### Tasks
- GET `/api/tasks` - Get all active tasks
- POST `/api/tasks/:taskId/complete` - Complete a task
- GET `/api/tasks/history` - Get user's task history

### Empire
- GET `/api/empire/structures` - Get all structures
- GET `/api/empire/user-structures` - Get user's structures
- POST `/api/empire/structures/:structureId/purchase` - Purchase structure
- POST `/api/empire/structures/:structureId/upgrade` - Upgrade structure
- POST `/api/empire/collect-idle` - Collect idle income

### Leaderboard
- GET `/api/leaderboard?period=all|daily|weekly` - Get leaderboard

### User Profile
- GET `/api/user/profile` - Get user profile
- PUT `/api/user/profile` - Update profile
- POST `/api/user/change-password` - Change password
- DELETE `/api/user/account` - Delete account

### Admin (requires admin role)
- GET `/api/admin/tasks` - Get all tasks
- POST `/api/admin/tasks` - Create task
- PUT `/api/admin/tasks/:id` - Update task
- DELETE `/api/admin/tasks/:id` - Delete task
- GET `/api/admin/users` - Get all users
- PUT `/api/admin/users/:userId/role` - Update user role
- POST `/api/admin/users/:userId/ban` - Ban user
- GET `/api/admin/verifications` - Get pending verifications
- POST `/api/admin/verifications/:id/approve` - Approve verification
- POST `/api/admin/verifications/:id/reject` - Reject verification
- GET `/api/admin/metrics?range=24h|7d|30d|all` - Get system metrics
- GET `/api/admin/ui-config` - Get UI configuration
- PUT `/api/admin/ui-config` - Update UI configuration

## Environment Variables

See `.env.example` in the backend directory for all required environment variables.

Key variables:
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT tokens
- `ADMIN_EMAIL` - Admin user email for seeding
- `ADMIN_PASSWORD` - Admin user password for seeding
- `FRONTEND_URL` - Frontend URL for CORS

## Development Notes

### Task Categories
1. Critical Thinking
2. Media Literacy
3. Emotional Intelligence
4. Civic Engagement

### Reward System
- Base rewards: XP and currency from tasks
- Streak multiplier: 1 + (streak × 0.05), max 1.5×
- Premium multiplier: 1.5× for premium users
- Total multiplier = streak × premium

### Empire System
- Structures generate passive income
- Production formula: baseProduction × level × 1.15
- Upgrade cost: baseCost × 1.15^level
- Idle income capped at 12 hours (free) or 24 hours (premium)

### Rank Progression
Ranks are based on total XP earned. The system automatically promotes users when they reach XP thresholds.

## Next Steps

- [ ] Implement Stripe payment integration
- [ ] Add email service for password reset
- [ ] Implement ad system
- [ ] Add property-based tests
- [ ] Set up CI/CD pipeline
- [ ] Deploy to production

## License

MIT
