# MongoDB Setup Guide

This guide explains how to set up MongoDB for storing municipality descriptions and data.

## 🗄️ Database Configuration

The application uses MongoDB to store municipality descriptions, tags, highlights, and fun facts. This prevents recreating content multiple times and provides persistent storage.

## 📋 Prerequisites

1. MongoDB Atlas account (free tier available) or MongoDB instance
2. Database name: `powersolarpr`
3. Collection name: `municipalities`

## 🚀 Setup Steps

### 1. Create MongoDB Atlas Cluster (Recommended)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Create a new cluster (free tier M0)
4. Create a database user:
   - Go to Database Access → Add New Database User
   - Choose "Password" authentication
   - Save the username and password
5. Whitelist IP addresses:
   - Go to Network Access → Add IP Address
   - Click "Allow Access from Anywhere" (for Vercel) or add specific IPs
6. Get your connection string:
   - Go to Clusters → Connect → Connect your application
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `powersolarpr` (optional, can be in connection string)

### 2. Local Development Setup

1. Create a `.env` file in the project root:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/powersolarpr?retryWrites=true&w=majority
```

2. The API routes will automatically use this connection string.

### 3. Vercel Production Setup

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add a new variable:
   - **Name**: `MONGODB_URI`
   - **Value**: Your MongoDB connection string
   - **Environment**: Production, Preview, Development (select all)

4. Redeploy your application for changes to take effect

## 📊 Database Schema

The `municipalities` collection stores documents with the following structure:

```javascript
{
  name: "Aguada",                    // Municipality name (unique)
  description: "Aguada is a...",      // Full description
  tags: ["Turismo", "Playas"],       // Array of tags
  highlights: [                      // Array of highlight strings
    "Beautiful beaches",
    "Historic lighthouse"
  ],
  funFact: "Aguada is home to...",   // Fun fact string
  updatedAt: "2024-01-15T10:30:00Z"  // ISO timestamp
}
```

## 🔌 API Endpoints

The application provides the following API endpoints:

### GET `/api/municipalities`
Get all municipalities or a specific one.

**Query Parameters:**
- `name` (optional): Municipality name to get specific data

**Response:**
```json
{
  "Aguada": {
    "name": "Aguada",
    "description": "...",
    "tags": [...],
    ...
  }
}
```

### POST `/api/municipalities`
Create or update municipality data.

**Body:**
```json
{
  "name": "Aguada",
  "description": "...",
  "tags": [...],
  "highlights": [...],
  "funFact": "..."
}
```

### DELETE `/api/municipalities?name=Aguada`
Delete municipality data.

## 🔄 Fallback to localStorage

The application includes a fallback mechanism:
- If MongoDB is unavailable, it falls back to localStorage
- Data is synced to localStorage as a backup
- This ensures the app works even if the database is temporarily unavailable

## 🧪 Testing the Connection

1. Start your development server:
```bash
npm start
```

2. Go to `/admin/dashboard`
3. Try saving a municipality description
4. Check your MongoDB Atlas dashboard to verify the data was saved

## 🔍 Verifying Data in MongoDB

### Using MongoDB Atlas UI:
1. Go to your cluster → Browse Collections
2. Select `powersolarpr` database
3. Select `municipalities` collection
4. View your documents

### Using MongoDB Compass:
1. Download [MongoDB Compass](https://www.mongodb.com/products/compass)
2. Connect using your connection string
3. Navigate to `powersolarpr.municipalities`
4. View and edit documents

## 🛠️ Troubleshooting

### Error: "MONGODB_URI environment variable not found"
- Make sure `.env` file exists in project root
- Verify the variable name is exactly `MONGODB_URI`
- Restart your development server after adding the variable

### Error: "Authentication failed"
- Check your database username and password
- Ensure special characters in password are URL-encoded
- Verify the user has read/write permissions

### Error: "Connection timeout"
- Check your IP whitelist in MongoDB Atlas
- For Vercel, use "Allow Access from Anywhere" (0.0.0.0/0)
- Verify your connection string is correct

### Data not saving
- Check browser console for errors
- Verify API endpoints are accessible
- Check MongoDB Atlas logs for connection issues

## 📝 Notes

- The database automatically creates collections when first used
- Documents are indexed by `name` field for fast lookups
- The `updatedAt` field is automatically set on save
- All operations are idempotent (safe to retry)

## 🔐 Security

- Never commit `.env` files to git (already in `.gitignore`)
- Use environment variables in Vercel for production
- MongoDB Atlas provides built-in security features
- Consider using MongoDB Atlas IP whitelisting for additional security

---

For more information, see the [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/).

