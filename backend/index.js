require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { parseAppleHealth } = require('./parsers/apple_health');
const { analyzeReport } = require('./services/ai_service');

const app = express();
const port = process.env.PORT || 3001;

// Database setup
const db = new sqlite3.Database('./health.db', (err) => {
    if (err) console.error('Error opening database', err);
    else {
        db.run(`CREATE TABLE IF NOT EXISTS health_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT,
      data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
        console.log('Database initialized');
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Upload configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(__dirname, 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Routes
app.get('/api/health-check', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

// Login Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === 'admin123') {
        res.json({ success: true, token: 'mock-jwt-token' });
    } else {
        res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
});

// Main Upload & Process Route
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = req.file.originalname.toLowerCase();
    const isAppleHealth = fileName.endsWith('.xml') || fileName.includes('apple_health');

    // Robust check for Gemini Key
    if (!process.env.GEMINI_API_KEY && !isAppleHealth) {
        return res.status(503).json({
            error: 'Gemini API Key is missing. Please add GEMINI_API_KEY to your Railway environment variables.'
        });
    }

    const filePath = req.file.path;
    // fileName is already declared above

    try {
        let result;
        let type;

        if (fileName.endsWith('.xml') || fileName.includes('apple_health')) {
            // Process Apple Health Export
            type = 'apple_health';
            result = await parseAppleHealth(filePath);
        } else if (req.file.mimetype.startsWith('image/') || req.file.mimetype === 'application/pdf') {
            // Process Medical Report with Gemini
            type = 'medical_report';
            result = await analyzeReport(filePath, req.file.mimetype);
        } else {
            return res.status(400).json({ error: 'Unsupported file type' });
        }

        // Save to DB
        const stmt = db.prepare("INSERT INTO health_data (type, data) VALUES (?, ?)");
        stmt.run(type, JSON.stringify(result));
        stmt.finalize();

        res.json({
            message: 'File processed successfully',
            type,
            result
        });
    } catch (error) {
        console.error('Processing error:', error);
        res.status(500).json({ error: 'Failed to process file', details: error.message });
    }
});

// Get latest data
app.get('/api/data', (req, res) => {
    db.all("SELECT * FROM health_data ORDER BY created_at DESC LIMIT 10", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsedRows = rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
        res.json(parsedRows);
    });
});

// Serve static files from the React frontend app
const frontendPath = path.join(__dirname, '../frontend/dist');
if (fs.existsSync(frontendPath)) {
    app.use(express.static(frontendPath));

    // The "catchall" handler: for any request that doesn't
    // match one above, send back React's index.html file.
    app.use((req, res, next) => {
        if (!req.path.startsWith('/api') && req.method === 'GET') {
            res.sendFile(path.join(frontendPath, 'index.html'));
        } else {
            next();
        }
    });
}

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
