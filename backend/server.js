require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const songsRouter = require('./routes/songs');
const adminRouter = require('./routes/admin');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Audio/cover files now live on Cloudinary, so no local static file
// serving or upload-folder setup is needed anymore.
app.use('/api/songs', songsRouter);
app.use('/api/admin', adminRouter);

app.get('/', (req, res) => {
  res.send('Kishore Kumar Player API is running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
