# Testing Guide for Empire & Leaderboard

## Current Status

✅ Backend running on port 5000
✅ Admin dashboard running on port 5174
✅ Data verified in MongoDB (12 users, 27 buildings)
✅ Empire endpoint logic tested and working
✅ Leaderboard endpoint updated with better handling

## Step-by-Step Testing Instructions

### 1. Access the Admin Dashboard

1. Open your browser
2. Navigate to: `http://localhost:5174`
3. You should see the login page

### 2. Login as Admin

Use these credentials:
- **Email**: `admin@example.com`
- **Password**: `admin123`

After login, you should see the admin dashboard with the sidebar menu.

### 3. Test Leaderboard Page

1. Click on "🏆 Leaderboard" in the sidebar
2. **Expected Result**: You should see:
   - Stats cards showing Total Users, Total XP, Total Currency
   - A table with all 12 users
   - Each row showing: Position, Username, Email, Rank, XP, Currency, Tasks Completed, Joined date
   - A "Sort By" dropdown to filter by XP, Currency, or Rank

3. **If you see an error**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for the error message
   - Go to Network tab
   - Find the request to `/api/leaderboard`
   - Check the response

### 4. Test Empire Page

1. Click on "🏛️ Empire" in the sidebar
2. **Expected Result**: You should see:
   - Stats cards showing Total Empires (12), Total Buildings (27), Total Resources
   - A table with all 12 empires
   - Each row showing: Username, Email, Buildings count, Resources, Level, Last Updated

3. **If you see "User not found" or an error**:
   - Open browser DevTools (F12)
   - Go to Console tab
   - You should see logs like: `Empire response: [...]`
   - Look for any error messages
   - Go to Network tab
   - Find the request to `/api/admin/empires`
   - Check the response status and body

## Common Issues and Solutions

### Issue 1: "Failed to fetch" or Network Error

**Cause**: Backend is not running or not accessible

**Solution**:
```bash
# Check if backend is running
# You should see it on port 5000

# If not running, start it:
cd public-deindoctrination-app/backend
npm start
```

### Issue 2: "Authentication required" or 401 Error

**Cause**: Token is not being sent or is invalid

**Solution**:
1. Logout and login again
2. Check browser DevTools > Application > Local Storage
3. Verify `adminToken` exists
4. If not, clear storage and login again

### Issue 3: "User not found" on Leaderboard

**Cause**: Response format mismatch (should be fixed now)

**Solution**:
- The controller now returns a simple array for admin views
- Frontend handles both array and object responses
- If still seeing this, check the console logs

### Issue 4: Empty tables or "No data"

**Cause**: Database is empty

**Solution**:
```bash
cd public-deindoctrination-app/backend

# Verify data exists
node src/scripts/checkData.js

# If no data, populate it
node src/scripts/populateEmpireAndLeaderboard.js
```

### Issue 5: CORS errors

**Cause**: Backend CORS not configured for admin dashboard port

**Solution**:
- Backend should allow both ports 5173 and 5174
- Check `backend/src/server.js` CORS configuration
- Should include: `origin: ['http://localhost:5173', 'http://localhost:5174']`

## Debugging Steps

### 1. Check Backend Logs

Look at the terminal where backend is running. You should see:
```
✅ MongoDB Connected: localhost
🚀 Server running on port 5000
```

When you access Empire page, you should see:
```
Fetching all empires...
Found 12 users
Returning 12 empires
```

### 2. Check Frontend Console

Open browser DevTools (F12) > Console tab

When you access Empire page, you should see:
```
Empire response: [{...}, {...}, ...]
```

If you see an error, it will show the actual error message.

### 3. Check Network Requests

Open browser DevTools (F12) > Network tab

**For Leaderboard**:
- Request: `GET /api/leaderboard?sortBy=xp`
- Status: 200 OK
- Response: Array of user objects

**For Empire**:
- Request: `GET /api/admin/empires`
- Status: 200 OK
- Response: Array of empire objects

### 4. Test API Directly

You can test the API endpoints directly using curl or a tool like Postman:

```bash
# First, login to get a token
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'

# Copy the token from the response, then:

# Test leaderboard
curl http://localhost:5000/api/leaderboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test empire
curl http://localhost:5000/api/admin/empires \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Expected Data

### Leaderboard Response
```json
[
  {
    "_id": "...",
    "email": "user7@test.com",
    "username": "user7",
    "xp": 5331,
    "currency": 1946,
    "rank": 54,
    "streak": 1,
    "isPremium": false,
    "createdAt": "2024-...",
    "completedTasks": 0,
    "position": 1
  },
  ...
]
```

### Empire Response
```json
[
  {
    "userId": "...",
    "email": "specialkey2018@gmail.com",
    "username": "specialkey2018",
    "buildings": [
      {
        "_id": "...",
        "structureId": "training-grounds",
        "level": 1
      }
    ],
    "resources": 9657,
    "level": 43,
    "updatedAt": "2024-..."
  },
  ...
]
```

## What I Fixed

### Leaderboard Controller
- Added check for missing `userId` (admin view)
- Returns simple array instead of object with rankings
- Added `completedTasks` count for each user
- Added support for `sortBy` query parameter
- Added `username` field to response

### Empire Controller
- Added console logging for debugging
- Added fallback for missing username (uses email prefix)
- Added better error messages with details

### Frontend Pages
- Added console logging to see responses
- Added better error handling
- Added empty state handling
- Leaderboard handles both array and object responses

## Next Steps

Once both pages are working:

1. ✅ Verify all data displays correctly
2. ✅ Test sorting on leaderboard
3. ✅ Verify building counts match
4. ✅ Check that resources display correctly

Then you can:
- Add search/filter functionality
- Add pagination for large datasets
- Add detailed views for individual users
- Add charts and visualizations
- Add export functionality

## Contact Points

If you're still seeing issues:

1. **Check the exact error message** in browser console
2. **Check the network request** response in DevTools
3. **Check backend logs** for any errors
4. **Verify data exists** using `checkData.js` script

The most common issue is authentication - make sure you're logged in as admin and the token is being sent with requests.
