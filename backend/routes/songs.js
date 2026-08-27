const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Song = require('../models/Song');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

// Files now go straight to Cloudinary instead of local disk — this means
// songs survive Render restarts/redeploys instead of disappearing.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'audio') {
      return {
        folder: 'kishore-kumar-player/songs',
        resource_type: 'video', // Cloudinary stores audio under "video"
        allowed_formats: ['mp3', 'wav', 'm4a', 'ogg']
      };
    }
    if (file.fieldname === 'cover') {
      return {
        folder: 'kishore-kumar-player/covers',
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp']
      };
    }
    return { folder: 'kishore-kumar-player/misc' };
  }
});

const upload = multer({ storage });

// GET all songs, sorted by order then title — public, no login needed
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().sort({ order: 1, title: 1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new song (upload audio + optional cover) — admin only
router.post('/', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, artist, order } = req.body;
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ error: 'Audio file is required' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const audioFile = req.files.audio[0];
    const coverFile = req.files.cover ? req.files.cover[0] : null;

    const song = new Song({
      title,
      artist: artist || 'Kishore Kumar',
      audioFile: audioFile.path, // full Cloudinary URL
      audioPublicId: audioFile.filename, // Cloudinary public_id, needed to delete later
      coverImage: coverFile ? coverFile.path : '',
      coverPublicId: coverFile ? coverFile.filename : '',
      order: order ? Number(order) : 0
    });
    await song.save();
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a song by id — admin only. Removes both the database entry and
// the actual files on Cloudinary, so nothing is left orphaned.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.audioPublicId) {
      await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: 'video' });
    }
    if (song.coverPublicId) {
      await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: 'image' });
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
