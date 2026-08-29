const express = require('express');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');
const Song = require('../models/Song');
const requireAdmin = require('../middleware/auth');

const router = express.Router();

// Files go straight to Cloudinary instead of local disk — songs survive
// Render restarts/redeploys instead of disappearing. Both the single-song
// field name ("audio") and the bulk field name ("audios") are treated the
// same way — audio resource type — so one storage config covers both forms.
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    if (file.fieldname === 'audio' || file.fieldname === 'audios') {
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

// Turn "kishore_kumar_-_mere_sapno_ki_rani.mp3" into "Mere Sapno Ki Rani"
function titleFromFilename(filename) {
  const base = filename.replace(/\.[^/.]+$/, ''); // strip extension
  const cleaned = base.replace(/[_-]+/g, ' ').trim();
  return cleaned
    .split(' ')
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

// GET all songs, sorted by order then title — public, no login needed
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().sort({ order: 1, title: 1 });
    res.json(songs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/songs/suggest-cover?title=...&artist=...
// Looks up artwork via Apple's public iTunes Search API (no key needed,
// legal public metadata lookup) so the admin can pick a cover without
// manually finding/uploading an image. Admin-only to avoid this being used
// as an open proxy by strangers.
router.get('/suggest-cover', requireAdmin, async (req, res) => {
  try {
    const { title, artist } = req.query;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'title query param is required' });
    }
    const term = encodeURIComponent(`${artist || 'Kishore Kumar'} ${title}`);
    const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=5`;
    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Cover lookup service unavailable' });
    }
    const data = await response.json();
    const suggestions = (data.results || []).map((r) => ({
      trackName: r.trackName,
      artistName: r.artistName,
      // Upscale iTunes' default small thumbnail to a bigger version
      artwork: r.artworkUrl100 ? r.artworkUrl100.replace('100x100', '600x600') : null
    })).filter((s) => s.artwork);

    res.json({ suggestions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add a new song (upload audio + optional cover) — admin only
router.post('/', requireAdmin, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, artist, order, category, lyrics, coverUrl } = req.body;
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
      // Either an uploaded file, OR a URL picked via "suggest cover"
      // (e.g. from the iTunes lookup) — never both.
      coverImage: coverFile ? coverFile.path : (coverUrl || ''),
      coverPublicId: coverFile ? coverFile.filename : '',
      category: category || '',
      lyrics: lyrics || '',
      order: order ? Number(order) : 0
    });
    await song.save();
    res.status(201).json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/songs/bulk — upload many mp3s at once. Titles are derived from
// each file's name; artist/category apply to the whole batch. No per-song
// cover here — add/edit one at a time afterwards if you want custom art.
router.post('/bulk', requireAdmin, upload.array('audios', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one audio file is required' });
    }
    const { artist, category } = req.body;

    const created = [];
    for (const file of req.files) {
      const song = new Song({
        title: titleFromFilename(file.originalname),
        artist: artist || 'Kishore Kumar',
        audioFile: file.path,
        audioPublicId: file.filename,
        category: category || ''
      });
      await song.save();
      created.push(song);
    }

    res.status(201).json({ created: created.length, songs: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/songs/:id — edit metadata, optionally replace the cover image.
// Audio file itself is never replaced here — delete + re-add for that.
router.put('/:id', requireAdmin, upload.single('cover'), async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    const { title, artist, category, lyrics, order, coverUrl, removeCover } = req.body;

    if (title !== undefined) song.title = title;
    if (artist !== undefined) song.artist = artist;
    if (category !== undefined) song.category = category;
    if (lyrics !== undefined) song.lyrics = lyrics;
    if (order !== undefined) song.order = Number(order);

    // Replacing the cover with a newly uploaded file
    if (req.file) {
      if (song.coverPublicId) {
        try {
          await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('Cloudinary old-cover delete failed (continuing anyway):', cloudErr.message);
        }
      }
      song.coverImage = req.file.path;
      song.coverPublicId = req.file.filename;
    } else if (coverUrl !== undefined && coverUrl !== '') {
      // Replacing with a picked external URL (e.g. from suggest-cover)
      if (song.coverPublicId) {
        try {
          await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('Cloudinary old-cover delete failed (continuing anyway):', cloudErr.message);
        }
      }
      song.coverImage = coverUrl;
      song.coverPublicId = '';
    } else if (removeCover === 'true') {
      if (song.coverPublicId) {
        try {
          await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: 'image' });
        } catch (cloudErr) {
          console.error('Cloudinary old-cover delete failed (continuing anyway):', cloudErr.message);
        }
      }
      song.coverImage = '';
      song.coverPublicId = '';
    }

    await song.save();
    res.json(song);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/songs/reorder — batch update sort order after a drag-and-drop.
// Body: { items: [{ id, order }, ...] }
router.put('/reorder/batch', requireAdmin, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' });
    }
    await Promise.all(
      items.map((item) =>
        Song.findByIdAndUpdate(item.id, { order: item.order })
      )
    );
    res.json({ message: 'Order updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE a song by id — admin only. Always removes the database entry;
// also tries to clean up the files on Cloudinary, but a Cloudinary error
// (stale public_id, already-deleted file, etc.) never blocks the delete —
// the song still disappears from the list either way.
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const song = await Song.findById(req.params.id);
    if (!song) {
      return res.status(404).json({ error: 'Song not found' });
    }

    if (song.audioPublicId) {
      try {
        await cloudinary.uploader.destroy(song.audioPublicId, { resource_type: 'video' });
      } catch (cloudErr) {
        console.error('Cloudinary audio delete failed (continuing anyway):', cloudErr.message);
      }
    }
    if (song.coverPublicId) {
      try {
        await cloudinary.uploader.destroy(song.coverPublicId, { resource_type: 'image' });
      } catch (cloudErr) {
        console.error('Cloudinary cover delete failed (continuing anyway):', cloudErr.message);
      }
    }

    await Song.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
