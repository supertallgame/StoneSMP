const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload folders exist
['public/uploads/gallery', 'public/uploads/schematics'].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const folder = file.fieldname === 'image' ? 'public/uploads/gallery' : 'public/uploads/schematics';
    cb(null, folder);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(express.static('public'));
app.use(express.json());

// Simple password verification middleware / route
app.post('/api/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode === '9294') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid passcode' });
  }
});

// Get all uploaded items
app.api = {};
app.get('/api/content', (req, res) => {
  const galleryFiles = fs.existsSync('public/uploads/gallery') ? fs.readdirSync('public/uploads/gallery') : [];
  const schemFiles = fs.existsSync('public/uploads/schematics') ? fs.readdirSync('public/uploads/schematics') : [];
  
  res.json({
    gallery: galleryFiles.map(f => ({ title: f, url: `/uploads/gallery/${f}` })),
    schematics: schemFiles.map(f => ({ fileName: f, url: `/uploads/schematics/${f}` }))
  });
});

// Upload Gallery Image
app.post('/api/upload/gallery', upload.single('image'), (req, res) => {
  res.json({ success: true, file: req.file });
});

// Upload Schematic File
app.post('/api/upload/schematic', upload.single('schematic'), (req, res) => {
  res.json({ success: true, file: req.file });
});

// Delete file endpoint
app.delete('/api/delete', (req, res) => {
  const { type, filename } = req.body;
  const filePath = path.join(__dirname, 'public', 'uploads', type, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, message: 'File not found' });
});

app.listen(PORT, () => {
  console.log(`StoneSMP server running on http://localhost:${PORT}`);
});
