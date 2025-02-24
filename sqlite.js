const sqlite3 = require('sqlite3').verbose();

// Connect to the SQLite database (or create it if it doesn't exist)
let db = new sqlite3.Database('my_database.db', (err) => {
    if (err) {
        console.error('Error opening database', err);
    } else {
        console.log('Connected to SQLite database');
    }
});

// SQL command to create the table if it doesn't exist
const createTableQuery = `
CREATE TABLE IF NOT EXISTS employees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    age INTEGER,
    position TEXT
);
`;

// Execute the SQL command to create the table
db.run(createTableQuery, function(err) {
    if (err) {
        console.error('Error creating table', err);
    } else {
        console.log("Table 'employees' created successfully!");

        // Insert a new employee after the table is created
        const insertQuery = `INSERT INTO employees (name, age, position) VALUES (?, ?, ?)`;
        const employee = ["John Doe", 30, "Software Engineer"];

        db.run(insertQuery, employee, function(err) {
            if (err) {
                console.error('Error inserting data', err);
            } else {
                console.log(`New employee added with ID: ${this.lastID}`);
            }

            // Close the database connection after inserting the data
            db.close((err) => {
                if (err) {
                    console.error('Error closing the database', err);
                } else {
                    console.log('Database connection closed');
                }
            });
        });
    }
});
