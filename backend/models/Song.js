const mongoose = require('mongoose');

const songSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    artist: { type: String, default: 'Kishore Kumar', trim: true },
    // Full Cloudinary URL for the audio file
    audioFile: { type: String, required: true },
    // Cloudinary public_id for the audio file, needed to delete it later
    audioPublicId: { type: String, default: '' },
    // Full Cloudinary URL for the cover image (optional)
    coverImage: { type: String, default: '' },
    // Cloudinary public_id for the cover image, needed to delete it later
    coverPublicId: { type: String, default: '' },
    order: { type: Number, default: 0 }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Song', songSchema);
