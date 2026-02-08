require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { parseAppleHealth } = require('./parsers/apple_health');
const { parseCSVHealth } = require('./parsers/csv_parser');
const { parseExcelHealth } = require('./parsers/excel_parser');
const { parseECG } = require('./parsers/ecg_parser');
const { parseCDA } = require('./parsers/cda_parser');
const { analyzeReport } = require('./services/ai_service');

const app = express();
const port = process.env.PORT || 3001;

console.log("App using API Key starting with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "UNDEFINED");

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
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(morgan('dev'));

// Debug all API requests
app.use('/api', (req, res, next) => {
    console.log(`[API DEBUG] ${req.method} ${req.url}`);
    next();
});

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

// Bulk process route
app.post('/api/upload', upload.array('files'), async (req, res) => {
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
    }

    const results = [];
    const errors = [];

    for (const file of req.files) {
        const fileName = file.originalname.toLowerCase();
        const filePath = file.path;
        const isAppleHealth = fileName.endsWith('.xml') || fileName.includes('apple_health');

        try {
            let result;
            let type;

            if (isAppleHealth) {
                // Check if it's a CDA file or standard export
                const content = fs.readFileSync(filePath, 'utf-8');
                if (content.includes('ClinicalDocument')) {
                    type = 'cda_document';
                    result = await parseCDA(filePath);
                } else {
                    type = 'apple_health';
                    result = await parseAppleHealth(filePath);
                }
            } else if (fileName.endsWith('.csv')) {
                const content = fs.readFileSync(filePath, 'utf-8');
                if (content.includes('Classification,') || content.includes('Sinus Rhythm')) {
                    type = 'electrocardiogram';
                    result = await parseECG(filePath);
                } else {
                    type = 'csv_data';
                    result = await parseCSVHealth(filePath);
                }
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                type = 'excel_data';
                result = await parseExcelHealth(filePath);
            } else if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf' || fileName.endsWith('.pdf') || fileName.endsWith('.txt')) {
                type = 'medical_report';
                result = await analyzeReport(filePath, file.mimetype);
            } else {
                errors.push({ file: fileName, error: 'Unsupported file type' });
                continue;
            }

            // Save to DB
            const savedItem = await new Promise((resolve, reject) => {
                db.run("INSERT INTO health_data (type, data) VALUES (?, ?)", [type, JSON.stringify(result)], function (err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID, type, result });
                });
            });
            results.push(savedItem);

        } catch (error) {
            console.error(`Error processing ${fileName}:`, error);
            errors.push({ file: fileName, error: error.message });
        }
    }

    res.json({
        message: 'Processing complete',
        uploadedCount: results.length,
        results,
        errors: errors.length > 0 ? errors : undefined
    });
});

// Get latest data
app.get('/api/data', (req, res) => {
    db.all("SELECT * FROM health_data ORDER BY created_at DESC LIMIT 50", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        const parsedRows = rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
        res.json(parsedRows);
    });
});

// Bulk delete records
app.post('/api/data/delete-bulk', (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });

    const placeholders = ids.map(() => '?').join(',');
    db.run(`DELETE FROM health_data WHERE id IN (${placeholders})`, ids, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Bulk deletion successful', deletedCount: this.changes });
    });
});

// Comprehensive AI Coach Synthesis
app.post('/api/ai/coach', async (req, res) => {
    const { metrics, medicalHistory, ecgHistory, cdaHistory } = req.body;

    try {
        const { GoogleGenerativeAI } = require("@google/generative-ai");
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

        const prompt = `
            Act as a highly experienced personal health AI coach. 
            I have a comprehensive health dataset including metrics, clinical reports, ECG rhythms, and structured CDA data.
            
            1. CLINICAL HISTORY (Clinical Reports & Prescriptions):
            ${JSON.stringify(medicalHistory)}
            
            2. HEART RHYTHM HISTORY (ECG):
            ${JSON.stringify((ecgHistory || []).map(e => e.metadata))}
            
            3. STRUCTURED CLINICAL DATA (CDA Documents):
            ${JSON.stringify((cdaHistory || []).map(c => ({ title: c.title, observations: c.observations.slice(0, 10) })))}
            
            4. DAILY ACTIVITY METRICS:
            ${JSON.stringify(metrics)}
            
            OBJECTIVE:
            1. Synthesize a comprehensive, "True Picture" health status. 
            2. Cross-reference clinical findings with activity AND ECG rhythms. 
               (e.g., if ECG shows Sinus Tachycardia, check Daily Heart Rate and activity).
            3. If reports show a deficiency (like Vitamin D) and activity is low, highlight the lifestyle link.
            4. Provide 4 highly specific "Deep Insights" based on cross-referencing.
            5. Provide 3 prioritized actions.
            
            FORMAT: Return ONLY JSON:
            {
              "summary": "Full narrative text...",
              "highlights": [{"title": "...", "desc": "...", "color": "rose/emerald/indigo/purple"}],
              "actions": ["..."]
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        } else {
            throw new Error("Invalid AI format");
        }
    } catch (error) {
        console.error("Coach Synthesis error:", error);
        res.status(500).json({ error: error.message });
    }
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
