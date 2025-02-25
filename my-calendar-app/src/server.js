require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();

// Configuration - set to 'sqlite' or 'mysql'
const DB_TYPE = process.env.DB_TYPE || 'sqlite';

// Database connection setup
let db;
if (DB_TYPE === 'sqlite') {
  const sqlite3 = require('sqlite3').verbose();
  db = new sqlite3.Database(path.join(__dirname, 'calendar_database.db'));
  console.log('Using SQLite database');
} else if (DB_TYPE === 'mysql') {
  const mysql = require('mysql2');
  db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'calendar_db'
  });
  db.connect(err => {
    if (err) {
      console.error('Error connecting to MySQL:', err);
      process.exit(1);
    }
    console.log('Connected to MySQL database');
  });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Database operations helper (abstracts SQLite/MySQL differences)
const dbOps = {
  run: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        db.run(query, params, function(err) {
          if (err) return reject(err);
          resolve({ lastID: this.lastID, changes: this.changes });
        });
      } else {
        db.query(query, params, (err, results) => {
          if (err) return reject(err);
          resolve({ 
            lastID: results.insertId, 
            changes: results.affectedRows 
          });
        });
      }
    });
  },
  get: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        db.get(query, params, (err, row) => {
          if (err) return reject(err);
          resolve(row);
        });
      } else {
        db.query(query, params, (err, results) => {
          if (err) return reject(err);
          resolve(results[0] || null);
        });
      }
    });
  },
  all: (query, params = []) => {
    return new Promise((resolve, reject) => {
      if (DB_TYPE === 'sqlite') {
        db.all(query, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows);
        });
      } else {
        db.query(query, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      }
    });
  }
};

// Create tables based on database type
const createTables = async () => {
  try {
    // Events table
    if (DB_TYPE === 'sqlite') {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS events (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          start TEXT NOT NULL,
          end TEXT NOT NULL,
          extendedProps TEXT,
          rrule TEXT,
          duration TEXT,
          backgroundColor TEXT
        )
      `);
    } else {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS events (
          id VARCHAR(255) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          start VARCHAR(255) NOT NULL,
          end VARCHAR(255) NOT NULL,
          extendedProps TEXT,
          rrule TEXT,
          duration TEXT,
          backgroundColor VARCHAR(50)
        )
      `);
    }

    // Courses table
    if (DB_TYPE === 'sqlite') {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          color TEXT
        )
      `);
    } else {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          color TEXT
        )
      `);
    }

    // Trainers table
    if (DB_TYPE === 'sqlite') {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS trainers (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL
        )
      `);
    } else {
      await dbOps.run(`
        CREATE TABLE IF NOT EXISTS trainers (
          id VARCHAR(255) PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        )
      `);
    }
    
    console.log('Database tables created or verified');
    return true;
  } catch (err) {
    console.error('Error creating tables:', err);
    return false;
  }
};

// API Routes

// Event Routes
// Get all events
app.get('/api/events', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM events');
    
    // Parse JSON strings back to objects
    const formattedEvents = rows.map(event => ({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      extendedProps: event.extendedProps ? JSON.parse(event.extendedProps) : {},
      rrule: event.rrule ? JSON.parse(event.rrule) : null,
      duration: event.duration ? JSON.parse(event.duration) : null,
      backgroundColor: event.backgroundColor
    }));
    
    res.json(formattedEvents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single event
app.get('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const row = await dbOps.get('SELECT * FROM events WHERE id = ?', [id]);
    
    if (!row) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Parse JSON strings back to objects
    const event = {
      id: row.id,
      title: row.title,
      start: row.start,
      end: row.end,
      extendedProps: row.extendedProps ? JSON.parse(row.extendedProps) : {},
      rrule: row.rrule ? JSON.parse(row.rrule) : null,
      duration: row.duration ? JSON.parse(row.duration) : null,
      backgroundColor: row.backgroundColor
    };
    
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new event
app.post('/api/events', async (req, res) => {
  try {
    const { 
      id, 
      title, 
      start, 
      end, 
      extendedProps, 
      rrule, 
      duration, 
      backgroundColor 
    } = req.body;
    
    const eventId = id || Date.now().toString();
    
    const query = `
      INSERT INTO events (id, title, start, end, extendedProps, rrule, duration, backgroundColor) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const params = [
      eventId, 
      title, 
      start, 
      end, 
      extendedProps || null, 
      rrule || null, 
      duration || null, 
      backgroundColor || null
    ];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id: eventId,
      title,
      start,
      end,
      extendedProps: extendedProps ? JSON.parse(extendedProps) : {},
      rrule: rrule ? JSON.parse(rrule) : null,
      duration: duration ? JSON.parse(duration) : null,
      backgroundColor
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an event
app.put('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, 
      start, 
      end, 
      extendedProps, 
      rrule, 
      duration, 
      backgroundColor 
    } = req.body;
    
    const query = `
      UPDATE events 
      SET title = ?, start = ?, end = ?, extendedProps = ?, rrule = ?, duration = ?, backgroundColor = ?
      WHERE id = ?
    `;
    
    const params = [
      title, 
      start, 
      end, 
      extendedProps || null, 
      rrule || null, 
      duration || null, 
      backgroundColor || null,
      id
    ];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json({
      id,
      title,
      start,
      end,
      extendedProps: extendedProps ? JSON.parse(extendedProps) : {},
      rrule: rrule ? JSON.parse(rrule) : null,
      duration: duration ? JSON.parse(duration) : null,
      backgroundColor
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an event
app.delete('/api/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM events WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Course Routes
app.get('/api/courses', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM courses');
    
    // Parse JSON strings back to objects
    const formattedCourses = rows.map(course => ({
      id: course.id,
      name: course.name,
      color: course.color ? JSON.parse(course.color) : null
    }));
    
    res.json(formattedCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/courses', async (req, res) => {
  try {
    const { name, color } = req.body;
    const id = Date.now().toString();
    
    const query = 'INSERT INTO courses (id, name, color) VALUES (?, ?, ?)';
    const params = [id, name, color];
    
    await dbOps.run(query, params);
    
    res.status(201).json({
      id,
      name,
      color: color ? JSON.parse(color) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;
    
    const query = 'UPDATE courses SET name = ?, color = ? WHERE id = ?';
    const params = [name, color, id];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.json({
      id,
      name,
      color: color ? JSON.parse(color) : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/courses/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM courses WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    res.status(200).json({ message: 'Course deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Trainer Routes
app.get('/api/trainers', async (req, res) => {
  try {
    const rows = await dbOps.all('SELECT * FROM trainers');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/trainers', async (req, res) => {
  try {
    const { name } = req.body;
    const id = 't' + Date.now().toString();
    
    const query = 'INSERT INTO trainers (id, name) VALUES (?, ?)';
    const params = [id, name];
    
    await dbOps.run(query, params);
    
    res.status(201).json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/trainers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const query = 'UPDATE trainers SET name = ? WHERE id = ?';
    const params = [name, id];
    
    const result = await dbOps.run(query, params);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.json({ id, name });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/trainers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await dbOps.run('DELETE FROM trainers WHERE id = ?', [id]);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trainer not found' });
    }
    
    res.status(200).json({ message: 'Trainer deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Initialize default data
const initializeDefaultData = async () => {
  try {
    // Check if courses table is empty
    const courseCountResult = await dbOps.get('SELECT COUNT(*) as count FROM courses');
    const courseCount = courseCountResult?.count || 0;
    
    if (courseCount === 0) {
      // Insert default courses
      const defaultCourses = [
        { 
          id: '1', 
          name: 'מתמטיקה', 
          color: JSON.stringify({ bg: '#FF6B6B', text: '#FFFFFF' }) 
        },
        { 
          id: '2', 
          name: 'פיזיקה', 
          color: JSON.stringify({ bg: '#4ECDC4', text: '#FFFFFF' }) 
        }
      ];
      
      const courseInsertQuery = 'INSERT INTO courses (id, name, color) VALUES (?, ?, ?)';
      for (const course of defaultCourses) {
        await dbOps.run(courseInsertQuery, [course.id, course.name, course.color]);
      }
      
      console.log('Default courses initialized');
    }
    
    // Check if trainers table is empty
    const trainerCountResult = await dbOps.get('SELECT COUNT(*) as count FROM trainers');
    const trainerCount = trainerCountResult?.count || 0;
    
    if (trainerCount === 0) {
      // Insert default trainers
      const defaultTrainers = [
        { id: 't1', name: 'אדם' },
        { id: 't2', name: 'שרה' }
      ];
      
      const trainerInsertQuery = 'INSERT INTO trainers (id, name) VALUES (?, ?)';
      for (const trainer of defaultTrainers) {
        await dbOps.run(trainerInsertQuery, [trainer.id, trainer.name]);
      }
      
      console.log('Default trainers initialized');
    }
    
    // Check if events table is empty
    const eventCountResult = await dbOps.get('SELECT COUNT(*) as count FROM events');
    const eventCount = eventCountResult?.count || 0;
    
    if (eventCount === 0) {
      // Insert a default event
      const defaultEvent = {
        id: '1',
        title: 'מתמטיקה',
        start: '2025-02-24T10:00:00',
        end: '2025-02-24T11:30:00',
        extendedProps: JSON.stringify({
          description: 'שיעור מתמטיקה שבועי',
          location: 'כיתה 101',
          courseId: '1',
          trainerId: 't1'
        }),
        rrule: JSON.stringify({
          freq: 'weekly',
          dtstart: '2025-02-24T10:00:00',
          until: '2025-06-24T23:59:59',
          interval: 1
        }),
        duration: JSON.stringify({
          hours: 1,
          minutes: 30
        }),
        backgroundColor: '#FF6B6B'
      };
      
      const eventInsertQuery = `
        INSERT INTO events (id, title, start, end, extendedProps, rrule, duration, backgroundColor) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await dbOps.run(eventInsertQuery, [
        defaultEvent.id,
        defaultEvent.title,
        defaultEvent.start,
        defaultEvent.end,
        defaultEvent.extendedProps,
        defaultEvent.rrule,
        defaultEvent.duration,
        defaultEvent.backgroundColor
      ]);
      
      console.log('Default event initialized');
    }
  } catch (err) {
    console.error('Error initializing default data:', err);
  }
};

// Start server and initialize database
const startServer = async () => {
  try {
    const tablesCreated = await createTables();
    
    if (tablesCreated) {
      await initializeDefaultData();
      
      const PORT = process.env.PORT || 5001;
      app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
      });
    } else {
      console.error('Failed to create database tables. Server not started.');
    }
  } catch (err) {
    console.error('Error starting server:', err);
    process.exit(1);
  }
};

startServer();