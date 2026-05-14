# Login Credentials & Access Information

## Application URLs

- **User Frontend**: http://localhost:5173
- **Admin Dashboard**: http://localhost:5174
- **Backend API**: http://localhost:5000

## Default Admin Account

**Email:** admin@example.com  
**Password:** Admin123!

This account has admin privileges and can access both the user frontend and admin dashboard.

## Registered User Accounts

**Email:** specialkey2018@gmail.com  
**Password:** (the password you set during registration)

This is a regular user account with standard user privileges.

## How to Login

### User Frontend (http://localhost:5173)
1. Go to http://localhost:5173/login
2. Enter your email and password
3. Click "Login"
4. You'll be redirected to the dashboard

### Admin Dashboard (http://localhost:5174)
1. Go to http://localhost:5174
2. Enter admin credentials (admin@example.com / Admin123!)
3. Click "Login"
4. You'll be redirected to the admin dashboard

## Troubleshooting

### "Invalid credentials" error
- Make sure you're using the correct email address
- Passwords are case-sensitive
- If you forgot your password, use the "Forgot password?" link

### Can't access after login
- Clear your browser's localStorage (F12 → Application → Local Storage → Clear)
- Refresh the page
- Try logging in again

### Need to reset the database
Run this command in the backend directory:
```bash
npm run seed
```

This will recreate the admin user and sample data.

## Creating New Accounts

### Register a New User
1. Go to http://localhost:5173/register
2. Enter your email
3. Enter a password (minimum 8 characters with at least one number)
4. Confirm your password
5. Click "Register"

### Password Requirements
- Minimum 8 characters
- Must contain at least one number
- Example valid passwords: Password123, MyPass2024, Test1234

## Notes

- All passwords are securely hashed using bcrypt
- JWT tokens expire after 24 hours
- Admin users can access both user and admin interfaces
- Regular users can only access the user interface
