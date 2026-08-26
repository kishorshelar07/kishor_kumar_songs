const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: 'Kishore Kumar', trim: true },
    // filename of the mp3 inside backend/uploads/songs
    audioFile: { type: String, required: true },
    // filename of the cover image inside backend/uploads/covers (optional)
    coverImage: { type: String, default: '' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);
