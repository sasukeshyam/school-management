# EduCore School Management System
## Complete Setup, Testing & Deployment Guide

School ID:   6a04e1b97a11863cd0e9e6de
Session ID:  6a04e1ba7a11863cd0e9e6e1
Super Admin: superadmin@demoschool.com
Admin:       admin@demoschool.com
Password:    Admin@123456


═══════════════════════════════════════════════════
  ✅  New School Created Successfully!
═══════════════════════════════════════════════════
  School Name : Delhi Public School
  School ID   : 6a077be1e880d5b640ea69f3
  Session     : 2026-2027
  Admin Email : admin@dps.com
  Password    : DPS@2024
═══════════════════════════════════════════════════
  Share these credentials with the school admin.
  They must change the password after first login.
═══════════════════════════════════════════════════


---

## What You Have

```
school-management-backend/   ← Node.js + Express + MongoDB API
school-management-frontend/  ← React + Vite SPA
```

---

## Prerequisites — Install These First

Before doing anything, install the following on your machine:

### 1. Node.js (v18 or higher)
Download from: https://nodejs.org  
Choose the **LTS** version. After installing, verify:
```bash
node --version    # should show v18.x.x or higher
npm --version     # should show 9.x.x or higher
```

### 2. MongoDB (Local)
Download from: https://www.mongodb.com/try/download/community  
**Or** use MongoDB Atlas (free cloud) — easier for beginners: https://cloud.mongodb.com

If installing locally, start MongoDB after install:
```bash
# Mac (with Homebrew)
brew services start mongodb-community

# Windows — run as administrator
net start MongoDB

# Linux (Ubuntu)
sudo systemctl start mongod
```

Verify MongoDB is running:
```bash
mongosh        # should open MongoDB shell
exit           # type this to close the shell
```

### 3. Redis (Required for JWT refresh tokens)
**Mac:**
```bash
brew install redis
brew services start redis
```

**Windows:** Download from https://github.com/microsoftproject/redis/releases  
Or use the Windows Subsystem for Linux (WSL).

**Linux (Ubuntu):**
```bash
sudo apt-get install redis-server
sudo systemctl start redis
```

Verify Redis is running:
```bash
redis-cli ping   # should print: PONG
```

### 4. Git (optional but recommended)
Download from: https://git-scm.com

---

## Part 1 — Setting Up the Backend

### Step 1: Open Terminal in the backend folder
```bash
cd school-management-backend
```

### Step 2: Install dependencies
```bash
npm install
```
This will download ~200MB of packages. Wait for it to finish.

### Step 3: Create your environment file
```bash
# Copy the example file
cp .env.example .env
```

Now open `.env` in any text editor (Notepad, VS Code, etc.) and fill in these values:

```env
# ─── Required — change these ───────────────────────────────────────────────
NODE_ENV=development
PORT=5000

# MongoDB — if running locally, keep this as-is
MONGO_URI=mongodb://localhost:27017/school_management

# If using MongoDB Atlas, replace with your connection string:
# MONGO_URI=mongodb+srv://youruser:yourpassword@cluster.mongodb.net/school_management

# JWT secrets — change these to any long random strings
JWT_ACCESS_SECRET=my_super_secret_access_key_change_this_12345
JWT_REFRESH_SECRET=my_super_secret_refresh_key_change_this_67890
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Redis — if running locally with default settings, keep as-is
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

# ─── Optional — fill later ──────────────────────────────────────────────────
# Cloudinary (for file uploads — get free account at cloudinary.com)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (for sending welcome emails — use Gmail app password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@yourschool.com

# Frontend URL
CLIENT_URL=http://localhost:3000
```

### Step 4: Seed the database
This creates the school, all permissions, all roles, and a super admin account:
```bash
npm run seed
```

You should see output like:
```
✓ MongoDB connected
✓ Seeding 110 permissions...
✓ Permissions seeded
✓ School created: Demo School
✓ Session created: 2025-2026
✓ Role seeded: super_admin (1 permissions)
✓ Role seeded: admin (89 permissions)
✓ Role seeded: teacher (28 permissions)
✓ Role seeded: student (16 permissions)
✓ Role seeded: parent (12 permissions)
✓ Super Admin created: superadmin@demoschool.com / Admin@123456

═══════════════════════════════════════
  Database seeded successfully!
  School ID:   65abc123...
  Super Admin: superadmin@demoschool.com
  Admin:       admin@demoschool.com
  Password:    Admin@123456
═══════════════════════════════════════
```

**Save the School ID** — you will need it to log in.

### Step 5: Start the backend server
```bash
npm run dev
```

You should see:
```
Server running in development mode on port 5000
MongoDB connected: localhost
Redis connected
```

**The backend is now running at: http://localhost:5000**

### Step 6: Test the backend is working
Open your browser and go to:
```
http://localhost:5000/health
```

You should see:
```json
{
  "status": "OK",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "env": "development"
}
```

If you see this — **the backend is working correctly**.

---

## Part 2 — Testing the Backend API (with Postman)

Download Postman (free): https://www.postman.com/downloads/

### Test 1: Login
- **Method:** POST  
- **URL:** `http://localhost:5000/api/v1/auth/login`  
- **Body (JSON):**
```json
{
  "school_id": "PASTE_YOUR_SCHOOL_ID_HERE",
  "email": "superadmin@demoschool.com",
  "password": "Admin@123456"
}
```

Expected response:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": { "name": "Super Admin", "email": "superadmin@demoschool.com" },
    "roles": ["super_admin"],
    "access_token": "eyJhbGciOiJIUz..."
  }
}
```

**Copy the `access_token`** — you need it for protected routes.

### Test 2: Get current user
- **Method:** GET  
- **URL:** `http://localhost:5000/api/v1/auth/me`  
- **Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

Expected response:
```json
{
  "success": true,
  "data": { "user": { "name": "Super Admin", ... } }
}
```

### Test 3: Get all students
- **Method:** GET  
- **URL:** `http://localhost:5000/api/v1/students`  
- **Headers:** `Authorization: Bearer YOUR_ACCESS_TOKEN`

Expected response:
```json
{
  "success": true,
  "data": [],
  "pagination": { "total": 0, "page": 1, "limit": 10, "pages": 0 }
}
```

If all 3 tests pass — **your backend is 100% working**.

---

## Part 3 — Setting Up the Frontend

### Step 1: Open a NEW terminal window
Keep the backend terminal running. Open a new terminal:
```bash
cd school-management-frontend
```

### Step 2: Install dependencies
```bash
npm install
```

### Step 3: Create environment file
Create a file called `.env` in the frontend folder:
```bash
# Mac/Linux
touch .env

# Windows — create manually in Notepad, save as .env (not .env.txt)
```

Add this content to `.env`:
```env
VITE_API_URL=http://localhost:5000
```

### Step 4: Start the frontend
```bash
npm run dev
```

You should see:
```
  VITE v5.0.x  ready in 500ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: http://192.168.x.x:3000/
```

**The frontend is now running at: http://localhost:3000**

### Step 5: Test the frontend
Open your browser and go to: `http://localhost:3000`

You should see the **EduCore login page**.

---

## Part 4 — Connecting Frontend to Backend

The connection happens automatically via the **Vite proxy** in `vite.config.js`:

```js
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',  // ← all /api requests go to backend
      changeOrigin: true,
    },
  },
},
```

This means when the frontend calls `/api/v1/auth/login`, Vite automatically forwards it to `http://localhost:5000/api/v1/auth/login`.

### Test the connection — Log in:
1. Go to `http://localhost:3000`
2. Enter:
   - **School ID:** your School ID from the seed output
   - **Email:** `superadmin@demoschool.com`
   - **Password:** `Admin@123456`
3. Click **Sign in**

If you see the dashboard — **frontend and backend are connected and working**.

### If login fails — check these:
| Problem | Fix |
|---------|-----|
| "Network Error" | Backend is not running. Run `npm run dev` in backend folder |
| "Invalid credentials" | Wrong School ID. Check seed output for the correct ID |
| "MongoDB connection failed" | MongoDB is not running. Start it (see Prerequisites) |
| "Redis connection failed" | Redis is not running. Start it (see Prerequisites) |
| CORS error in browser console | Make sure `CLIENT_URL=http://localhost:3000` is set in backend `.env` |

---

## Part 5 — Running Both Together (Quick Reference)

Every time you want to work on the project, open **two terminal windows**:

**Terminal 1 — Backend:**
```bash
cd school-management-backend
npm run dev
```

**Terminal 2 — Frontend:**
```bash
cd school-management-frontend
npm run dev
```

Then open: `http://localhost:3000`

---

## Part 6 — Default Login Accounts

After seeding, these accounts are available:

| Role        |     Email                 | Password     | What they see                |
|-------------|---------------------------|--------------|------------------------------| 
| Super Admin | superadmin@demoschool.com | Admin@123456 | Everything, can manage roles |
| Admin       | admin@demoschool.com      | Admin@123456 | Full school management       | 

To create Teacher, Student, Parent accounts — log in as Admin and add them through the system.

---

## Part 7 — Project Folder Structure

```
school-management-backend/
├── .env                    ← Your config (never share this)
├── .env.example            ← Template (safe to share)
├── server.js               ← Entry point
├── package.json
└── src/
    ├── app.js              ← Express setup + all routes
    ├── config/
    │   ├── db.js           ← MongoDB connection
    │   ├── redis.js        ← Redis connection
    │   ├── logger.js       ← Winston logging
    │   ├── cloudinary.js   ← File uploads
    │   ├── socket.js       ← Real-time notifications
    │   └── seeder.js       ← Run once to setup DB
    ├── models/             ← 10 files, 35 MongoDB collections
    ├── routes/             ← 45 route files
    ├── controllers/        ← 26 request handlers
    ├── services/           ← 26 business logic files
    ├── middlewares/        ← Auth guard, error handler
    └── utils/              ← JWT, email, pagination helpers

school-management-frontend/
├── .env                    ← Frontend config
├── vite.config.js          ← Dev server + API proxy
├── tailwind.config.js      ← UI theme
├── index.html
└── src/
    ├── api/                ← All backend API calls
    ├── store/              ← Zustand state (auth, UI)
    ├── hooks/              ← useAuth, useSocket, useToast
    ├── components/
    │   ├── layout/         ← Sidebar, Topbar, AppLayout
    │   ├── shared/         ← StatCard, DataTable, PageHeader
    │   └── ui/             ← Button, Input, Card, Modal, Table
    ├── pages/              ← 28 pages (login, dashboards, modules)
    ├── routes/             ← React Router with auth guards
    └── utils/              ← formatters, class name helper
```

---

## Part 8 — Delivering to Client

### Option A: Local Network (for demo on same WiFi)

Find your computer's IP address:
```bash
# Mac/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.100)
```

Update frontend `.env`:
```env
VITE_API_URL=http://192.168.1.100:5000
```

Update backend `.env`:
```env
CLIENT_URL=http://192.168.1.100:3000
```

Restart both servers. Client can access at `http://192.168.1.100:3000` from any device on the same WiFi.

---

### Option B: Deploy to Cloud (Recommended for client delivery)

#### Step 1: Deploy Backend to Render (free tier available)

1. Create account at https://render.com
2. Click **New → Web Service**
3. Connect your GitHub repo (or upload code)
4. Fill in settings:
   - **Name:** `educore-backend`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
5. Add Environment Variables (same as your `.env` file):
   - `NODE_ENV` = `production`
   - `MONGO_URI` = your MongoDB Atlas connection string
   - `REDIS_HOST` = your Redis cloud host (use Redis Cloud free tier: https://redis.com/try-free/)
   - `JWT_ACCESS_SECRET` = strong random string
   - `JWT_REFRESH_SECRET` = strong random string
   - `CLIENT_URL` = your frontend URL (add after deploying frontend)
6. Click **Deploy**

Your backend URL will be: `https://educore-backend.onrender.com`

After first deploy, run the seeder:
- Go to Render dashboard → your service → **Shell**
- Run: `npm run seed`

#### Step 2: Deploy Frontend to Vercel (free)

1. Create account at https://vercel.com
2. Click **New Project → Import Git Repository**
3. Select your frontend repo
4. Add Environment Variable:
   - `VITE_API_URL` = `https://educore-backend.onrender.com`
5. Click **Deploy**

Your frontend URL will be: `https://educore-frontend.vercel.app`

#### Step 3: Update CORS on backend
Go back to Render → Environment Variables → update:
```
CLIENT_URL = https://educore-frontend.vercel.app
```
Redeploy the backend.

#### Step 4: Test the live deployment
Go to your Vercel URL, log in — everything should work.

---

### Option C: Deploy to VPS/Server (for production)

If client provides a Linux server (Ubuntu):

```bash
# 1. Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install PM2 (keeps app running)
sudo npm install -g pm2

# 3. Install Nginx (serves frontend, proxies backend)
sudo apt-get install nginx

# 4. Clone/upload your code to server
# Upload to /var/www/educore/

# 5. Setup backend
cd /var/www/educore/school-management-backend
npm install
cp .env.example .env
nano .env   # fill in production values
npm run seed
pm2 start server.js --name "educore-backend"
pm2 save
pm2 startup   # makes it start on server reboot

# 6. Build frontend
cd /var/www/educore/school-management-frontend
npm install
npm run build   # creates dist/ folder

# 7. Configure Nginx
sudo nano /etc/nginx/sites-available/educore
```

Nginx config:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Serve frontend
    root /var/www/educore/school-management-frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy Socket.IO
    location /socket.io {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Enable and start Nginx
sudo ln -s /etc/nginx/sites-available/educore /etc/nginx/sites-enabled/
sudo nginx -t        # test config
sudo systemctl restart nginx

# Add SSL (HTTPS) with Let's Encrypt — free
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

Your app is now live at `https://your-domain.com`.

---

## Part 9 — Checklist Before Client Delivery

### Backend checklist
- [ ] `.env` file is filled in (all required values)
- [ ] `npm run seed` was run successfully
- [ ] `npm run dev` starts without errors
- [ ] `http://localhost:5000/health` returns `{"status":"OK"}`
- [ ] Login API works in Postman
- [ ] MongoDB Atlas connected (not local MongoDB) for production

### Frontend checklist
- [ ] `.env` has `VITE_API_URL` set correctly
- [ ] `npm run dev` starts without errors
- [ ] Login page loads at `http://localhost:3000`
- [ ] Can log in with Super Admin credentials
- [ ] Dashboard loads data from backend

### Security checklist (before going live)
- [ ] Change default admin password `Admin@123456`
- [ ] Set strong `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (at least 32 random characters)
- [ ] Set `NODE_ENV=production` on server
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set correct `CLIENT_URL` to prevent unauthorized CORS access
- [ ] Keep `.env` file private — never commit to Git

---

## Part 10 — Common Problems & Fixes

### Backend won't start
```bash
# Check if port 5000 is already in use
lsof -i :5000          # Mac/Linux
netstat -ano | findstr :5000   # Windows

# Kill process using port 5000 (Mac/Linux)
kill -9 $(lsof -t -i:5000)
```

### MongoDB connection error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
MongoDB is not running. Start it:
```bash
# Mac
brew services start mongodb-community

# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
```

### Redis connection error
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```
Redis is not running. Start it:
```bash
# Mac
brew services start redis

# Windows
redis-server

# Linux
sudo systemctl start redis
```

### Frontend shows blank page
```bash
# Check browser console for errors (F12)
# Usually means API URL is wrong

# Make sure VITE_API_URL in .env is correct
# Must restart frontend after changing .env
npm run dev
```

### Login says "School ID required" but I have it
Make sure you are copying the `_id` field from the seed output, not the school name. It looks like: `65abc1234def5678ghij9012`

### CORS error in browser console
```
Access to XMLHttpRequest has been blocked by CORS policy
```
Update backend `.env`:
```env
CLIENT_URL=http://localhost:3000
```
Restart backend: `Ctrl+C` then `npm run dev`

### "Too many requests" error
You hit the rate limit (100 requests per 15 minutes). Wait 15 minutes or increase limit in `.env`:
```env
RATE_LIMIT_MAX=500
```

---

## Part 11 — Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | React 18 + Vite | UI framework |
| UI Library | Tailwind CSS + shadcn/ui | Styling |
| State | Zustand + React Query | Global state + API cache |
| Routing | React Router v6 | Page navigation |
| Forms | React Hook Form + Zod | Form handling + validation |
| Charts | Recharts | Dashboard charts |
| Real-time | Socket.IO client | Live notifications |
| Backend | Node.js + Express.js | REST API server |
| Database | MongoDB + Mongoose | Data storage |
| Auth | JWT + Refresh Tokens | Authentication |
| Cache | Redis | Token store + permission cache |
| File Upload | Cloudinary + Multer | Images and documents |
| Email | Nodemailer | Welcome emails, notifications |
| Real-time | Socket.IO | Push notifications |
| Logging | Winston | Server logs |
| Security | Helmet, CORS, Rate Limit | API protection |

---

## Quick Start Commands — Summary

```bash
# ── Backend ──────────────────────────────────────────────
cd school-management-backend
npm install              # first time only
cp .env.example .env    # first time only, then edit .env
npm run seed             # first time only
npm run dev              # start backend → http://localhost:5000

# ── Frontend ─────────────────────────────────────────────
cd school-management-frontend
npm install              # first time only
# create .env with: VITE_API_URL=http://localhost:5000
npm run dev              # start frontend → http://localhost:3000

# ── Production build ─────────────────────────────────────
cd school-management-frontend
npm run build            # creates dist/ folder for deployment
```

---

*EduCore School Management System — Built with Node.js, React, MongoDB*






for creating a new user of client 

npm run create-school "Delhi Public School" "Rajesh Kumar" "admin@dps.com" "DPS@2024" "9876543210" "Delhi"

