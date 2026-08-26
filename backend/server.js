require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const connectDB = require('./config/db');
const songsRouter = require('./routes/songs');
const adminRouter = require('./routes/admin');

const app = express();

connectDB();

// Make sure upload folders exist before any upload happens, no matter
// how the project was copied/extracted.
const songsDir = path.join(__dirname, 'uploads', 'songs');
const coversDir = path.join(__dirname, 'uploads', 'covers');
fs.mkdirSync(songsDir, { recursive: true });
fs.mkdirSync(coversDir, { recursive: true });

app.use(cors());
app.use(express.json());

// Serve uploaded audio/cover files statically
app.use('/uploads/songs', express.static(path.join(__dirname, 'uploads', 'songs')));
app.use('/uploads/covers', express.static(path.join(__dirname, 'uploads', 'covers')));

app.use('/api/songs', songsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('Kishore Kumar Player API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
