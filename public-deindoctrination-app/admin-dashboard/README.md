# Admin Dashboard - Standalone Module

A separate, independent admin dashboard for the Public Deindoctrination App.

## Features

- **Separate Application**: Runs independently from the main user app
- **Dedicated Port**: Runs on port 5174 (user app on 5173)
- **Admin-Only Access**: Requires admin role for login
- **Full Admin Features**: All admin functionality in one place

## Pages

1. **Dashboard** - System overview and metrics
2. **Tasks** - Create, edit, delete tasks
3. **Users** - Manage users and roles
4. **Verifications** - Approve/reject task submissions
5. **Metrics** - Detailed analytics
6. **UI Config** - Dynamic UI configuration

## Setup

```bash
cd admin-dashboard
npm install
```

## Running

```bash
npm run dev
```

Access at: 196.75.153.172:5174

## Login

Use admin credentials:
- Email: admin@example.com
- Password: Admin123!

## Architecture

- **Frontend**: React + Vite (port 5174)
- **Backend API**: Connects to same backend as user app (port 5000)
- **Authentication**: Separate JWT storage for admin sessions
- **Routing**: Independent routing system

## Benefits of Separate Module

1. **Security**: Admin panel isolated from user app
2. **Performance**: No admin code loaded in user app
3. **Deployment**: Can deploy admin panel separately
4. **Development**: Independent development and testing
5. **Scalability**: Can scale admin panel independently

## API Endpoints

All admin endpoints are at `/api/admin/*`:
- GET `/api/admin/metrics` - System metrics
- GET `/api/admin/tasks` - All tasks
- POST `/api/admin/tasks` - Create task
- PUT `/api/admin/tasks/:id` - Update task
- DELETE `/api/admin/tasks/:id` - Delete task
- GET `/api/admin/users` - All users
- PUT `/api/admin/users/:userId/role` - Update role
- POST `/api/admin/users/:userId/ban` - Ban user
- GET `/api/admin/verifications` - Pending verifications
- POST `/api/admin/verifications/:id/approve` - Approve
- POST `/api/admin/verifications/:id/reject` - Reject
- GET `/api/admin/ui-config` - Get UI config
- PUT `/api/admin/ui-config` - Update UI config

## Development

The admin dashboard is a complete standalone React application with its own:
- Package.json
- Vite configuration
- Routing system
- Authentication context
- Component library
- Styling

## Production Deployment

Can be deployed separately from the main app:
- Build: `npm run build`
- Deploy dist folder to separate subdomain (e.g., admin.yourapp.com)
- Configure CORS on backend to allow admin domain
