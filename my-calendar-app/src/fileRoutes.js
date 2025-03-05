const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Define file path
const CONTENT_FILE_PATH = path.join(__dirname, '../data/editor-content.txt');

// Ensure data directory exists
const ensureDataDirectoryExists = () => {
  const dataDir = path.dirname(CONTENT_FILE_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
};

// Get content from file
router.get('/api/file-content', (req, res) => {
  try {
    ensureDataDirectoryExists();
    
    if (fs.existsSync(CONTENT_FILE_PATH)) {
      const content = fs.readFileSync(CONTENT_FILE_PATH, 'utf-8');
      res.json({ content, timestamp: new Date().toISOString() });
    } else {
      res.status(404).json({ error: 'File does not exist yet' });
    }
  } catch (error) {
    console.error('Error reading file:', error);
    res.status(500).json({ error: 'Failed to read file' });
  }
});

// Save content to file
router.post('/api/file-content', (req, res) => {
  try {
    ensureDataDirectoryExists();
    
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }
    
    fs.writeFileSync(CONTENT_FILE_PATH, content, 'utf-8');
    res.json({ success: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('Error writing to file:', error);
    res.status(500).json({ error: 'Failed to write to file' });
  }
});

module.exports = router;
