const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure persistent upload directories exist
const galleryDir = path.join(__dirname, 'public', 'uploads', 'gallery');
const schematicsDir = path.join(__dirname, 'public', 'uploads', 'schematics');
const metaFile = path.join(__dirname, 'metadata.json');

[galleryDir, schematicsDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

function getMetadata() {
  if (!fs.existsSync(metaFile)) return { gallery: [], schematics: [] };
  try {
    return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  } catch (e) {
    return { gallery: [], schematics: [] };
  }
}

function saveMetadata(data) {
  fs.writeFileSync(metaFile, JSON.stringify(data, null, 2));
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === 'image') cb(null, galleryDir);
    else if (file.fieldname === 'schematic') cb(null, schematicsDir);
    else cb(new Error('Invalid field name'), null);
  },
  filename: (req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    cb(null, Date.now() + '-' + safeName);
  }
});
const upload = multer({ storage: storage });

app.use(express.json());

// Explicitly route root URL "/" to your main index.html page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Serve all other static files (CSS, JS, images, gallery.html, admin.html, etc.) from public/
app.use(express.static(path.join(__dirname, 'public')));

// Passcode Check Endpoint
app.post('/api/login', (req, res) => {
  const { passcode } = req.body;
  if (passcode === '9294') {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, message: 'Invalid passcode' });
  }
});

// Public API: Get all server-stored items
app.get('/api/content', (req, res) => {
  res.json(getMetadata());
});

// Admin API: Upload Gallery Image
app.post('/api/upload/gallery', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No image uploaded' });
  
  const meta = getMetadata();
  const newItem = {
    id: Date.now(),
    title: req.body.title || 'Server Snapshot',
    filename: req.file.filename,
    image: `/uploads/gallery/${req.file.filename}`
  };
  
  meta.gallery.push(newItem);
  saveMetadata(meta);
  res.json({ success: true, item: newItem });
});

// Admin API: Upload Schematic File
app.post('/api/upload/schematic', upload.single('schematic'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No schematic uploaded' });
  
  const meta = getMetadata();
  const kbSize = (req.file.size / 1024).toFixed(1) + ' KB';
  const newItem = {
    id: Date.now(),
    title: req.body.title || 'Server Build',
    description: req.body.description || 'Official StoneSMP build schematic.',
    fileName: req.file.originalname,
    fileSize: kbSize,
    fileData: `/uploads/schematics/${req.file.filename}`,
    storedFilename: req.file.filename
  };
  
  meta.schematics.push(newItem);
  saveMetadata(meta);
  res.json({ success: true, item: newItem });
});

// Admin API: Delete Item
app.delete('/api/delete', (req, res) => {
  const { type, id } = req.body;
  const meta = getMetadata();
  
  if (type === 'gallery') {
    const idx = meta.gallery.findIndex(item => item.id == id);
    if (idx !== -1) {
      const file = meta.gallery[idx];
      const filePath = path.join(galleryDir, file.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      meta.gallery.splice(idx, 1);
      saveMetadata(meta);
      return res.json({ success: true });
    }
  } else if (type === 'schematics') {
    const idx = meta.schematics.findIndex(item => item.id == id);
    if (idx !== -1) {
      const file = meta.schematics[idx];
      const filePath = path.join(schematicsDir, file.storedFilename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      meta.schematics.splice(idx, 1);
      saveMetadata(meta);
      return res.json({ success: true });
    }
  }
  
  res.status(404).json({ success: false, message: 'Item not found' });
});

app.listen(PORT, () => {
  console.log(`StoneSMP Server running on http://localhost:${PORT}`);
});
