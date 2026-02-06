# MongoDB Atlas Setup Guide

## Authentication Error Troubleshooting

If you're getting "bad auth : authentication failed" error, follow these steps:

### 1. Verify MongoDB Atlas Credentials

1. Go to [MongoDB Atlas](https://cloud.mongodb.com/)
2. Log in to your account
3. Navigate to **Database Access** (left sidebar)
4. Check if the user `kalisagad05_db_user` exists
5. If it doesn't exist, create a new database user:
   - Click **Add New Database User**
   - Choose **Password** authentication
   - Username: `kalisagad05_db_user` (or your preferred username)
   - Password: `Kigali20` (or generate a secure password)
   - Database User Privileges: **Atlas admin** (for development) or **Read and write to any database**
   - Click **Add User**

### 2. Whitelist Your IP Address

1. In MongoDB Atlas, go to **Network Access** (left sidebar)
2. Click **Add IP Address**
3. For development, you can add:
   - **0.0.0.0/0** (allows all IPs - use only for development)
   - Or your specific IP address
4. Click **Confirm**

### 3. Verify Connection String

Your connection string should be in this format:
```
mongodb+srv://<username>:<password>@cluster0.anfwvi8.mongodb.net/<database>?retryWrites=true&w=majority&appName=Cluster0
```

**Important Notes:**
- Replace `<username>` with your MongoDB Atlas username
- Replace `<password>` with your MongoDB Atlas password
- Replace `<database>` with your database name (e.g., `uzalogistics`)
- If your password contains special characters, they need to be URL-encoded:
  - `@` → `%40`
  - `#` → `%23`
  - `$` → `%24`
  - `%` → `%25`
  - `&` → `%26`
  - `+` → `%2B`
  - `=` → `%3D`

### 4. Get Your Connection String from MongoDB Atlas

1. Go to **Database** → **Connect**
2. Choose **Connect your application**
3. Select **Node.js** and version **5.5 or later**
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Replace `<database>` with your database name

### 5. Update Your .env File

Make sure your `.env` file in the `backend` directory contains:

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb+srv://kalisagad05_db_user:Kigali20@cluster0.anfwvi8.mongodb.net/uzalogistics?retryWrites=true&w=majority&appName=Cluster0
```

### 6. Test Connection

After updating your credentials and IP whitelist:
1. Wait 1-2 minutes for changes to propagate
2. Restart your server: `npm run dev`
3. You should see: `✅ MongoDB Connected: cluster0.anfwvi8.mongodb.net`

## Common Issues

### Issue: "authentication failed"
**Solution:** 
- Double-check username and password
- Ensure the database user exists in MongoDB Atlas
- Verify IP address is whitelisted

### Issue: "connection timeout"
**Solution:**
- Check your internet connection
- Verify IP address is whitelisted
- Check if MongoDB Atlas cluster is running

### Issue: "bad auth"
**Solution:**
- Verify username and password are correct
- Check if password needs URL encoding
- Ensure database user has proper permissions

## Need Help?

If you continue to have issues:
1. Verify your MongoDB Atlas account is active
2. Check MongoDB Atlas status page for outages
3. Try creating a new database user with fresh credentials
4. Ensure your cluster is running (not paused)
