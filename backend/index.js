require('dotenv').config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const { initDb, all, run, isPostgres } = require('./db');
const { parseAppleHealth } = require('./parsers/apple_health');
const { parseCSVHealth } = require('./parsers/csv_parser');
const { parseExcelHealth } = require('./parsers/excel_parser');
const { parseECG } = require('./parsers/ecg_parser');
const { parseCDA } = require('./parsers/cda_parser');
const { analyzeReport } = require('./services/ai_service');

const app = express();
const port = process.env.PORT || 3001;

console.log("App using API Key starting with:", process.env.GEMINI_API_KEY ? process.env.GEMINI_API_KEY.substring(0, 5) : "UNDEFINED");

const sniffFileForCDA = (filePath) => {
    try {
        const fd = fs.openSync(filePath, 'r');
        const buffer = Buffer.alloc(8192);
        const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
        fs.closeSync(fd);
        const head = buffer.toString('utf-8', 0, bytesRead);
        return head.includes('ClinicalDocument');
    } catch (err) {
        console.warn('CDA sniff failed, defaulting to Apple Health parser:', err.message);
        return false;
    }
};

const buildSqlPlaceholders = (count) => {
    if (isPostgres()) {
        return Array.from({ length: count }, (_, i) => `$${i + 1}`).join(',');
    }
    return Array.from({ length: count }, () => '?').join(',');
};

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
        const baseName = path.basename(file.originalname || 'upload');
        const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
        cb(null, `${Date.now()}-${safeName}`);
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
        const isImage = (file.mimetype || '').startsWith('image/') || ['.jpg', '.jpeg', '.png', '.heic', '.heif', '.webp', '.gif'].some(ext => fileName.endsWith(ext));

        try {
            let result;
            let type;

            if (isAppleHealth) {
                // Check if it's a CDA file or standard export
                if (sniffFileForCDA(filePath)) {
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
            } else if (
                isImage ||
                file.mimetype === 'application/pdf' ||
                file.mimetype === 'text/plain' ||
                fileName.endsWith('.pdf') ||
                fileName.endsWith('.txt')
            ) {
                type = 'medical_report';
                result = await analyzeReport(filePath, file.mimetype);
            } else {
                errors.push({ file: fileName, error: 'Unsupported file type' });
                continue;
            }

            // Save to DB
            let savedItem;
            if (isPostgres()) {
                const saved = await run("INSERT INTO health_data (type, data) VALUES ($1, $2) RETURNING id", [type, JSON.stringify(result)]);
                savedItem = { id: saved.rows[0].id, type, result };
            } else {
                const saved = await run("INSERT INTO health_data (type, data) VALUES (?, ?)", [type, JSON.stringify(result)]);
                savedItem = { id: saved.lastID, type, result };
            }
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
app.get('/api/data', async (req, res) => {
    try {
        const rows = await all("SELECT * FROM health_data ORDER BY created_at DESC LIMIT 50", []);
        const parsedRows = rows.map(row => ({
            ...row,
            data: JSON.parse(row.data)
        }));
        res.json(parsedRows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Single delete record
app.delete('/api/data/:id', async (req, res) => {
    const id = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(id)) return res.status(400).json({ error: 'Invalid id' });

    try {
        const result = isPostgres()
            ? await run("DELETE FROM health_data WHERE id = $1", [id])
            : await run("DELETE FROM health_data WHERE id = ?", [id]);
        const deleted = isPostgres() ? result.rowCount : result.changes;
        if (!deleted) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Deletion successful', deletedCount: deleted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Bulk delete records
app.post('/api/data/delete-bulk', async (req, res) => {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) return res.status(400).json({ error: 'IDs array required' });
    if (ids.length === 0) return res.json({ message: 'No records selected', deletedCount: 0 });

    try {
        if (isPostgres()) {
            const result = await run("DELETE FROM health_data WHERE id = ANY($1::int[])", [ids]);
            return res.json({ message: 'Bulk deletion successful', deletedCount: result.rowCount });
        }

        const placeholders = buildSqlPlaceholders(ids.length);
        const result = await run(`DELETE FROM health_data WHERE id IN (${placeholders})`, ids);
        res.json({ message: 'Bulk deletion successful', deletedCount: result.changes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Daily notes
app.get('/api/notes', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '30', 10), 200);
    try {
        const rows = isPostgres()
            ? await all("SELECT * FROM daily_notes ORDER BY created_at DESC LIMIT $1", [limit])
            : await all("SELECT * FROM daily_notes ORDER BY created_at DESC LIMIT ?", [limit]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/notes', async (req, res) => {
    const text = (req.body.text || '').trim();
    if (!text) return res.status(400).json({ error: 'Note text required' });
    try {
        if (isPostgres()) {
            const saved = await run("INSERT INTO daily_notes (note_text) VALUES ($1) RETURNING *", [text]);
            return res.json(saved.rows[0]);
        }
        const saved = await run("INSERT INTO daily_notes (note_text) VALUES (?)", [text]);
        const rows = await all("SELECT * FROM daily_notes WHERE id = ?", [saved.lastID]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Medical timeline
app.get('/api/timeline', async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || '50', 10), 200);
    try {
        const rows = isPostgres()
            ? await all("SELECT * FROM medical_timeline ORDER BY event_date DESC, created_at DESC LIMIT $1", [limit])
            : await all("SELECT * FROM medical_timeline ORDER BY event_date DESC, created_at DESC LIMIT ?", [limit]);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/timeline', async (req, res) => {
    const eventDate = req.body.eventDate;
    const title = (req.body.title || '').trim();
    const details = (req.body.details || '').trim();
    const category = (req.body.category || '').trim();
    if (!eventDate || !title) return res.status(400).json({ error: 'eventDate and title required' });

    try {
        if (isPostgres()) {
            const saved = await run(
                "INSERT INTO medical_timeline (event_date, category, title, details) VALUES ($1, $2, $3, $4) RETURNING *",
                [eventDate, category || null, title, details || null]
            );
            return res.json(saved.rows[0]);
        }
        const saved = await run(
            "INSERT INTO medical_timeline (event_date, category, title, details) VALUES (?, ?, ?, ?)",
            [eventDate, category || null, title, details || null]
        );
        const rows = await all("SELECT * FROM medical_timeline WHERE id = ?", [saved.lastID]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Comprehensive AI Coach Synthesis
app.post('/api/ai/coach', async (req, res) => {
    const { metrics, medicalHistory, ecgHistory, cdaHistory, dailyNote, timeline } = req.body;

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

            5. DAILY SYMPTOMS / FEELINGS (Latest note):
            ${JSON.stringify(dailyNote)}

            6. MEDICAL TIMELINE (Most recent events):
            ${JSON.stringify((timeline || []).slice(0, 15))}
            
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

const startServer = async () => {
    try {
        await initDb();
        console.log(`Database initialized (${isPostgres() ? 'Postgres' : 'SQLite'})`);
        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
};

startServer();
