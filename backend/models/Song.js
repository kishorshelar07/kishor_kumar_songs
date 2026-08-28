const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: 'Kishore Kumar', trim: true },
    // Full Cloudinary URL for the audio file
    audioFile: { type: String, required: true },
    // Cloudinary public_id for the audio file, needed to delete it later
    audioPublicId: { type: String, default: '' },
    // Full URL for the cover image (Cloudinary upload OR an auto-fetched
    // external artwork URL — coverPublicId stays blank for the latter)
    coverImage: { type: String, default: '' },
    coverPublicId: { type: String, default: '' },
    // Free-text tag for grouping — e.g. "Romantic", "Sad", "70s Classics"
    category: { type: String, default: '', trim: true },
    // Optional plain-text lyrics, admin-entered
    lyrics: { type: String, default: '' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);
