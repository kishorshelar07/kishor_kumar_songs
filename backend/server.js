require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const songsRouter = require('./routes/songs');
const adminRouter = require('./routes/admin');

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
