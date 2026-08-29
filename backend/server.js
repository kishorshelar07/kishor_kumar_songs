require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const songsRouter = require('./routes/songs');
const adminRouter = require('./routes/admin');

// Safety net: without these, one uncaught error anywhere (e.g. deep inside
// a library during a large upload) can kill the whole Node process — which
// looks like ERR_CONNECTION_ABORTED in the browser with zero explanation.
// Logging instead of crashing keeps the server alive and tells us the real
// cause the next time this happens.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

const app = express();

connectDB();

// Restrict CORS to your deployed frontend when FRONTEND_URL is set (e.g. on
// Render). Falls back to allowing all origins for local development.
const allowedOrigin = process.env.FRONTEND_URL;
app.use(
  cors(
    allowedOrigin
      ? { origin: allowedOrigin }
      : {} // no restriction — fine for local dev
  )
);

app.use(express.json());

// Audio/cover files live on Cloudinary, so no local static file serving or
// upload-folder setup is needed.
app.use('/api/songs', songsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('Kishore Kumar Player API is running');
});

// Global error handler — catches multer errors (too many files, bad file
// type, etc.) and anything else that throws, and always replies with clean
// JSON instead of the connection just dropping (which looked like
// ERR_CONNECTION_ABORTED in the browser before this existed).
app.use((err, req, res, next) => {
  if (!err) return next();
  console.error('Unhandled error:', err.message);
  if (res.headersSent) return next(err);

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    return res.status(400).json({
      error: 'Too many files in one batch. Try uploading fewer files at once (max 50).'
    });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'One of the files is too large.' });
  }

  res.status(500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Bulk-uploading many mp3 files can legitimately take several minutes
// depending on upload speed, since each file is streamed to Cloudinary in
// turn. Node's defaults (5 min request timeout) are too short for that and
// would silently abort the connection mid-upload — this raises the ceiling
// so a slow-but-successful bulk upload isn't cut off partway through.
server.requestTimeout = 20 * 60 * 1000; // 20 minutes
server.headersTimeout = 20 * 60 * 1000 + 5000; // must be greater than requestTimeout
server.keepAliveTimeout = 20 * 60 * 1000;
