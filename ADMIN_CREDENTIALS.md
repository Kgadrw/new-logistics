# Admin Credentials

## Default Admin Account

An admin account has been created in the database with the following credentials:

```
Email: admin@uzalogistics.com
Password: admin123
Role: admin
```

## ⚠️ Security Note

**IMPORTANT**: This is a default password for initial setup. Please change it after your first login for security purposes.

## How to Login

1. Start the backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Start the frontend:
   ```bash
   npm run dev
   ```

3. Navigate to the application in your browser

4. Click on "Admin" card

5. Click "Login as Admin"

6. Enter the credentials:
   - Email: `admin@uzalogistics.com`
   - Password: `admin123`

7. You will be redirected to the Admin Dashboard

## Creating Additional Admin Accounts

To create additional admin accounts, you can:

### Option 1: Using the Script (Recommended)

Modify `backend/scripts/createAdmin.js` to use different credentials, then run:

```bash
cd backend
npm run create-admin
```

### Option 2: Direct Database Access

Connect to MongoDB and create a user document with:
- `role: 'admin'`
- `email`: Your desired email
- `password`: Your desired password (plain text)
- `name`: Admin name
- `active: true`

### Option 3: Through Admin Dashboard (Future)

Once logged in as admin, you can create additional admin accounts through the Admin Dashboard (if this feature is implemented).

## Admin Dashboard Features

Once logged in, admins can:
- View all shipments
- Manage users (clients and warehouses)
- Set pricing rules
- View audit logs
- Manage system settings
- View statistics and overview

## Troubleshooting

If you cannot login:
1. Verify MongoDB is running and connected
2. Check that the admin user exists in the database
3. Verify the email and password are correct
4. Check server logs for any errors

## Resetting Admin Password

To reset the admin password, you can:
1. Connect to MongoDB
2. Find the admin user: `db.users.findOne({ email: 'admin@uzalogistics.com' })`
3. Update the password: `db.users.updateOne({ email: 'admin@uzalogistics.com' }, { $set: { password: 'newpassword' } })`
