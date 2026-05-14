# Quick Start Guide

Get the Public Deindoctrination App running in 5 minutes.

## Prerequisites

- Node.js v16+ installed
- MongoDB running (local or Atlas)

## Step 1: Install Dependencies

```bash
# Backend
cd public-deindoctrination-app/backend
npm install

# Frontend
cd ../frontend
npm install
```

## Step 2: Configure Environment

```bash
# In backend directory
cd ../backend
cp .env.example .env
```

Edit `.env` and set at minimum:
```env
MONGODB_URI=mongodb://localhost:27017/public-deindoctrination-app
JWT_SECRET=your-secret-key-here
```

## Step 3: Seed Database

```bash
# In backend directory
npm run seed
```

This creates:
- 4 empire structures
- 12 sample tasks
- Admin user (admin@example.com / Admin123!)

## Step 4: Start Servers

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

## Step 5: Access the App

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- Health Check: http://localhost:5000/health

## Login

**Admin Account:**
- Email: admin@example.com
- Password: Admin123!

**Or create a new user:**
- Click "Register" on the login page
- Password must be 8+ characters with at least one number

## What to Try

### As a User:
1. Complete tasks from the Tasks page
2. Build your empire with earned currency
3. Check your rank on the Leaderboard
4. View your profile and stats

### As an Admin:
1. Go to /admin
2. Create new tasks
3. Manage users
4. View system metrics
5. Configure UI settings dynamically

## Troubleshooting

**MongoDB Connection Error:**
- Make sure MongoDB is running
- Check MONGODB_URI in .env

**Port Already in Use:**
- Change PORT in backend/.env
- Change port in frontend/vite.config.js proxy

**CORS Error:**
- Check FRONTEND_URL in backend/.env matches your frontend URL

## Next Steps

- Read README.md for full documentation
- Check IMPLEMENTATION_STATUS.md for feature details
- Review API endpoints in README.md
- Explore the admin dashboard features

## Support

For issues or questions, refer to:
- README.md - Full documentation
- .kiro/specs/mvp-core-loop/ - Requirements and design docs
