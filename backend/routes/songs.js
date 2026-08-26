const express = require('express');
const multer = require('multer');
const path = require('path');
const Song = require('../models/Song');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

// Storage config: audio -> uploads/songs, cover -> uploads/covers
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (file.fieldname === 'audio') {
      cb(null, path.join(__dirname, '..', 'uploads', 'songs'));
    } else if (file.fieldname === 'cover') {
      cb(null, path.join(__dirname, '..', 'uploads', 'covers'));
    } else {
      cb(new Error('Unknown field'), null);
    }
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + file.originalname.replace(/\s+/g, '_');
    cb(null, unique);
  }
});

const upload = multer({ storage });

// GET all songs, sorted by order then title
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
    const song = new Song({
      title,
      artist: artist || 'Kishore Kumar',
      audioFile: req.files.audio[0].filename,
      coverImage: req.files.cover ? req.files.cover[0].filename : '',
      order: order ? Number(order) : 0
    });
    await song.save();
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a song by id (metadata only; files remain on disk) — admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
