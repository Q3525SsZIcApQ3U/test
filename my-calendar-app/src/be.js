const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const db = new sqlite3.Database('./local_database.db');

// Middleware
app.use(cors()); // Enable CORS for frontend requests
app.use(bodyParser.json()); // Parse JSON data from requests

// Create events table if not exists
const createTableQuery = `
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL
);
`;

db.run(createTableQuery);

// Get all events
app.get('/api/events', (req, res) => {
  db.all('SELECT * FROM events', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      // Ensure the events' start and end times are in ISO format
      const formattedRows = rows.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start_time).toISOString(),
        end: new Date(event.end_time).toISOString(),
      }));
      res.json(formattedRows);
    }
  });
});

// Create a new event
app.post('/api/events', (req, res) => {
  const { title, start, end } = req.body;
  const query = `INSERT INTO events (title, start_time, end_time) VALUES (?, ?, ?)`;
  const params = [title, start, end];

  db.run(query, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        id: this.lastID,
        title,
        start: start,
        end: end,
      });
    }
  });
});

// Update an event
app.put('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const { title, start, end } = req.body;
  const query = `UPDATE events SET title = ?, start_time = ?, end_time = ? WHERE id = ?`;
  const params = [title, start, end, id];

  db.run(query, params, function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ id, title, start, end });
    }
  });
});

// Delete an event
app.delete('/api/events/:id', (req, res) => {
  const { id } = req.params;
  const query = `DELETE FROM events WHERE id = ?`;

  db.run(query, [id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(200).json({ message: 'Event deleted successfully' });
    }
  });
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
