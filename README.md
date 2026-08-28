# Kishore Kumar — Full-Screen Music Player (MERN)

A single-page, full-screen music player website built with MongoDB, Express,
React (Vite), and Node.js. Add your own downloaded songs one at a time —
they show up automatically in the player and song list.

## Folder structure

```
kishore-kumar-mern/
├── backend/
│   ├── config/db.js
│   ├── config/cloudinary.js
│   ├── middleware/auth.js
│   ├── models/Song.js
│   ├── routes/songs.js
│   ├── routes/admin.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── public/
    │   └── kishore-bg.jpg   <- ADD YOUR OWN Kishore Kumar photo here
    ├── src/
    │   ├── components/Player.jsx
    │   ├── components/SongList.jsx
    │   ├── App.jsx
    │   ├── main.jsx
    │   └── index.css
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## 1. Prerequisites

- Node.js 18+
- MongoDB running locally (or a MongoDB Atlas connection string)

## 2. Backend setup

```bash
cd backend
cp .env.example .env      # edit MONGO_URI if needed
npm install
npm run dev                # starts on http://localhost:5000
```

## 3. Frontend setup

```bash
cd frontend
npm install
npm run dev                # starts on http://localhost:5173
```

Open http://localhost:5173 in your browser.

## 4. Add a background photo

Put a Kishore Kumar photo (your own downloaded image) at:

```
frontend/public/kishore-bg.jpg
```

The full-screen background is already wired to this file — just drop it in
and refresh.

## 4. Cloudinary setup (required — this is where songs/covers are stored)

1. Create a free account at cloudinary.com
2. From your Dashboard, copy: Cloud Name, API Key, API Secret
3. Add them to `backend/.env`:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Restart the backend

Every song/cover uploaded through the admin panel now goes straight to
Cloudinary and stays there — Render restarting or redeploying won't
delete them anymore.

## 5. Admin panel — add/delete songs (password protected)

Regular visitors only see the player at `/` — they cannot add or delete
songs. Only the admin can, after logging in.

**Set your admin password** in `backend/.env`:
```
ADMIN_PASSWORD=your_own_secret_password
JWT_SECRET=any_long_random_string
```
Restart the backend after changing `.env`.

**Log in as admin:**
Open `http://localhost:5173/admin/login`, enter `ADMIN_PASSWORD`, and you'll
be taken to `http://localhost:5173/admin` — a dashboard where you can:
- Add a new song (title, artist, mp3 file, optional cover image) via a form
- See every song currently in the app
- Delete any song with one click

This replaces the old curl/Postman workflow — you no longer need to run
manual commands to add songs, just use the `/admin` page.

The admin session is stored as a token in the browser; "Logout" clears it.

## 6. Adding a background photo

## 7. Deploying later (optional)

- Backend: deploy to Render/Railway, point `MONGO_URI` at MongoDB Atlas.
  Songs/covers are stored on Cloudinary (see step 5 below), so no
  persistent disk is needed on the host — this also means Render's free
  tier restarts/sleeps no longer wipe your songs.
- Frontend: `npm run build` in `frontend/`, deploy the `dist/` folder to
  Vercel/Netlify, and update the API base URL/proxy for production.

## Notes on content

This project only provides the player infrastructure. You'll need to supply
the actual audio files and photo yourself, from sources you have the rights
to use.
