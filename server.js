// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

// Database configuration - supports both SQLite (local) and PostgreSQL (cloud)
let db;
let isCloudDatabase = false;

async function initializeDatabase() {
    try {
        // Force SQLite for local development unless explicitly told otherwise
        const forceSQLite = process.env.FORCE_SQLITE === 'true' || 
                           !process.env.RAILWAY_ENVIRONMENT && 
                           !process.env.RENDER &&
                           !process.env.HEROKU;

        // More robust detection for cloud environment
        const hasValidDatabaseUrl = process.env.DATABASE_URL && 
                                  process.env.DATABASE_URL.startsWith('postgresql://') && 
                                  process.env.DATABASE_URL.includes('@') &&
                                  process.env.DATABASE_URL.length > 30;
        
        const isCloudEnvironment = process.env.RAILWAY_ENVIRONMENT || 
                                 process.env.RENDER || 
                                 process.env.HEROKU;

        console.log('🔍 Environment Detection:');
        console.log('  Force SQLite:', forceSQLite ? 'Yes' : 'No');
        console.log('  DATABASE_URL:', process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 25)}...` : 'Not set');
        console.log('  Valid PostgreSQL URL:', hasValidDatabaseUrl ? 'Yes' : 'No');
        console.log('  Cloud Environment:', isCloudEnvironment ? 'Yes' : 'No');
        console.log('  NODE_ENV:', process.env.NODE_ENV || 'development');

        // Use PostgreSQL only if we're in a confirmed cloud environment with valid URL
        if (hasValidDatabaseUrl && isCloudEnvironment && !forceSQLite) {
            console.log('🌐 Initializing PostgreSQL database for cloud deployment...');
            await initializePostgreSQL();
        } else {
            console.log('🖥️ Initializing SQLite database for local development...');
            await initializeSQLite();
        }
    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.log('🔄 Falling back to SQLite...');
        await initializeSQLite();
    }
}

// PostgreSQL initialization for Railway cloud
async function initializePostgreSQL() {
    try {
        const { Pool } = require('pg');
        
        // Railway provides DATABASE_URL automatically
        const pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        
        // Test connection with timeout
        const client = await Promise.race([
            pool.connect(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Connection timeout')), 5000)
            )
        ]);
        
        console.log('✅ Connected to PostgreSQL database');
        
        // Create table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS cvw_cases (
                id SERIAL PRIMARY KEY,
                cvw_code VARCHAR(20) UNIQUE NOT NULL,
                record_type VARCHAR(10) NOT NULL CHECK (record_type IN ('Victim', 'Witness')),
                date_reported DATE NOT NULL,
                district VARCHAR(50) NOT NULL,
                cvw_gender VARCHAR(10) NOT NULL CHECK (cvw_gender IN ('MALE', 'FEMALE')),
                cvw_age DECIMAL(4,2),
                cvw_age_months INTEGER,
                cvw_age_category VARCHAR(20),
                offender_gender VARCHAR(10) CHECK (offender_gender IN ('MALE', 'FEMALE')),
                offender_age INTEGER,
                crime_type VARCHAR(100) NOT NULL,
                crime_severity VARCHAR(20) DEFAULT 'MEDIUM' CHECK (crime_severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
                disability VARCHAR(20) DEFAULT 'NON' CHECK (disability IN ('NON', 'PHYSICAL', 'MENTAL', 'MENTAL+PHYSICAL')),
                services_rendered VARCHAR(100),
                relationship_to_cv VARCHAR(50),
                case_status VARCHAR(20) DEFAULT 'OPEN' CHECK (case_status IN ('OPEN', 'INVESTIGATING', 'CLOSED', 'REFERRED')),
                followup_required BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        
        // Check if we need to populate initial data
        const result = await client.query('SELECT COUNT(*) as count FROM cvw_cases');
        if (result.rows[0].count == 0) {
            console.log('📊 Populating initial data in PostgreSQL...');
            await populatePostgreSQLData(client);
        }
        
        client.release();
        db = pool;
        isCloudDatabase = true;
        
        console.log(`📊 PostgreSQL database ready with ${result.rows[0].count} records`);
        
    } catch (error) {
        console.error('❌ PostgreSQL connection failed:', error.message);
        throw error; // Let the caller handle fallback
    }
}

// SQLite initialization for local development
async function initializeSQLite() {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'cvw_database.db');
    
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening SQLite database:', err.message);
                reject(err);
                return;
            }
            console.log('✅ Connected to SQLite database');
            console.log('📁 Database file:', dbPath);
            
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS cvw_cases (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    cvw_code TEXT UNIQUE NOT NULL,
                    record_type TEXT NOT NULL,
                    date_reported TEXT NOT NULL,
                    district TEXT NOT NULL,
                    cvw_gender TEXT NOT NULL,
                    cvw_age REAL,
                    cvw_age_months INTEGER,
                    cvw_age_category TEXT,
                    offender_gender TEXT,
                    offender_age INTEGER,
                    crime_type TEXT NOT NULL,
                    crime_severity TEXT DEFAULT 'MEDIUM',
                    disability TEXT DEFAULT 'NON',
                    services_rendered TEXT,
                    relationship_to_cv TEXT,
                    case_status TEXT DEFAULT 'OPEN',
                    followup_required INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;
            
            db.run(createTableSQL, (err) => {
                if (err) {
                    console.error('Error creating SQLite table:', err.message);
                    reject(err);
                    return;
                }
                console.log('✅ SQLite table ready');
                
                // Check and populate data
                db.get("SELECT COUNT(*) as count FROM cvw_cases", (err, row) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    
                    if (row.count === 0) {
                        console.log('📊 Populating SQLite initial data...');
                        populateSQLiteData();
                    }
                    
                    console.log(`📊 SQLite database ready with ${row.count} records`);
                    resolve();
                });
            });
        });
    });
}

// Populate PostgreSQL with initial data
async function populatePostgreSQLData(client) {
    const initialData = [
        ['NPA-CV1', 'Victim', '2025-01-04', 'Lusaka', 'MALE', 5.00, 'FEMALE', 25, 'ASSAULT ON A CHILD', 'NON', 'MEDICAL REPORT', 'STRANGER'],
        ['NPA-CV2', 'Victim', '2025-02-02', 'Lusaka', 'FEMALE', 0.67, 'MALE', 30, 'PHYSICAL ABUSE', 'PHYSICAL', 'MEDICAL + COUNSELLING', 'STRANGER'],
        ['NPA-CV3', 'Victim', '2025-01-27', 'Solwezi', 'FEMALE', 0.50, 'MALE', 40, 'SEXUAL ASSAULT', 'MENTAL', 'MEDICAL + COUNSELLING', 'LANDLOARD'],
        ['NPA-CV4', 'Victim', '2025-03-11', 'Lusaka', 'FEMALE', 0.25, 'MALE', 50, 'RAPE', 'MENTAL+PHYSICAL', 'MEDICAL + COUNSELLING', 'FATHER'],
        ['NPA-CV5', 'Victim', '2025-02-07', 'Katete', 'MALE', 15.00, 'FEMALE', 60, 'RAPE', 'NON', 'COUNSELLING', 'FRIEND'],
        ['NPA-CV6', 'Victim', '2025-01-07', 'Chipata', 'FEMALE', 1.50, 'FEMALE', 20, 'CHILD NEGLECT', 'NON', 'COUNSELLING', 'FRIEND'],
        ['NPA-CV7', 'Victim', '2025-02-10', 'Mansa', 'MALE', 0.75, 'MALE', 30, 'DEFILEMENT', 'PHYSICAL', 'MEDICAL + COUNSELLING', 'STRANGER']
    ];
    
    for (const record of initialData) {
        // Auto-assign crime severity
        let crime_severity = 'MEDIUM';
        if (['RAPE', 'SEXUAL ASSAULT', 'DEFILEMENT'].includes(record[8])) {
            crime_severity = 'CRITICAL';
        } else if (['PHYSICAL ABUSE', 'ASSAULT ON A CHILD'].includes(record[8])) {
            crime_severity = 'HIGH';
        }
        
        // Calculate age in months and category
        const age_months = Math.round(record[5] * 12);
        let age_category = 'Child';
        if (record[5] < 1) age_category = 'Infant';
        else if (record[5] < 3) age_category = 'Toddler';
        else if (record[5] >= 13) age_category = 'Teen';
        
        const followup_required = record[5] < 1 || crime_severity === 'CRITICAL';
        
        try {
            await client.query(`
                INSERT INTO cvw_cases (
                    cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
                    cvw_age_months, cvw_age_category, offender_gender, offender_age, crime_type, 
                    disability, services_rendered, relationship_to_cv, crime_severity, followup_required
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                ON CONFLICT (cvw_code) DO NOTHING
            `, [...record, age_months, age_category, crime_severity, followup_required]);
        } catch (error) {
            console.error('Error inserting PostgreSQL data:', error.message);
        }
    }
}

// Populate SQLite with initial data
function populateSQLiteData() {
    const initialData = [
        ['NPA-CV1', 'Victim', '2025-01-04', 'Lusaka', 'MALE', 5.00, 'FEMALE', 25, 'ASSAULT ON A CHILD', 'NON', 'MEDICAL REPORT', 'STRANGER'],
        ['NPA-CV2', 'Victim', '2025-02-02', 'Lusaka', 'FEMALE', 0.67, 'MALE', 30, 'PHYSICAL ABUSE', 'PHYSICAL', 'MEDICAL + COUNSELLING', 'STRANGER'],
        ['NPA-CV3', 'Victim', '2025-01-27', 'Solwezi', 'FEMALE', 0.50, 'MALE', 40, 'SEXUAL ASSAULT', 'MENTAL', 'MEDICAL + COUNSELLING', 'LANDLOARD'],
        ['NPA-CV4', 'Victim', '2025-03-11', 'Lusaka', 'FEMALE', 0.25, 'MALE', 50, 'RAPE', 'MENTAL+PHYSICAL', 'MEDICAL + COUNSELLING', 'FATHER'],
        ['NPA-CV5', 'Victim', '2025-02-07', 'Katete', 'MALE', 15.00, 'FEMALE', 60, 'RAPE', 'NON', 'COUNSELLING', 'FRIEND'],
        ['NPA-CV6', 'Victim', '2025-01-07', 'Chipata', 'FEMALE', 1.50, 'FEMALE', 20, 'CHILD NEGLECT', 'NON', 'COUNSELLING', 'FRIEND'],
        ['NPA-CV7', 'Victim', '2025-02-10', 'Mansa', 'MALE', 0.75, 'MALE', 30, 'DEFILEMENT', 'PHYSICAL', 'MEDICAL + COUNSELLING', 'STRANGER']
    ];
    
    const insertSQL = `INSERT OR IGNORE INTO cvw_cases (
        cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
        cvw_age_months, cvw_age_category, offender_gender, offender_age, crime_type, 
        disability, services_rendered, relationship_to_cv, crime_severity, followup_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    initialData.forEach(record => {
        // Auto-assign crime severity
        let crime_severity = 'MEDIUM';
        if (['RAPE', 'SEXUAL ASSAULT', 'DEFILEMENT'].includes(record[8])) {
            crime_severity = 'CRITICAL';
        } else if (['PHYSICAL ABUSE', 'ASSAULT ON A CHILD'].includes(record[8])) {
            crime_severity = 'HIGH';
        }
        
        // Calculate age in months and category
        const age_months = Math.round(record[5] * 12);
        let age_category = 'Child';
        if (record[5] < 1) age_category = 'Infant';
        else if (record[5] < 3) age_category = 'Toddler';
        else if (record[5] >= 13) age_category = 'Teen';
        
        const followup_required = record[5] < 1 || crime_severity === 'CRITICAL' ? 1 : 0;
        
        db.run(insertSQL, [...record, age_months, age_category, crime_severity, followup_required], (err) => {
            if (err) {
                console.error('Error inserting SQLite data:', err.message);
            }
        });
    });
}

// API Routes
app.get('/api/cases', async (req, res) => {
    try {
        if (isCloudDatabase) {
            // PostgreSQL query
            const result = await db.query(`
                SELECT * FROM cvw_cases 
                ORDER BY date_reported DESC, created_at DESC
            `);
            res.json(result.rows);
        } else {
            // SQLite query
            const sql = `
                SELECT * FROM cvw_cases 
                ORDER BY date_reported DESC, created_at DESC
            `;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching cases:', err.message);
                    res.status(500).json({ error: 'Database error' });
                    return;
                }
                res.json(rows);
            });
        }
    } catch (error) {
        console.error('Error fetching cases:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Database status endpoint
app.get('/api/status', async (req, res) => {
    try {
        if (isCloudDatabase) {
            const result = await db.query(`
                SELECT 
                    COUNT(*) as count,
                    COUNT(CASE WHEN cvw_age_category = 'Infant' THEN 1 END) as infant_count,
                    COUNT(CASE WHEN crime_severity = 'CRITICAL' THEN 1 END) as critical_count
                FROM cvw_cases
            `);
            
            const row = result.rows[0];
            res.json({ 
                status: 'connected', 
                message: 'PostgreSQL database is operational',
                totalRecords: parseInt(row.count),
                infantCases: parseInt(row.infant_count),
                criticalCases: parseInt(row.critical_count),
                databaseType: 'PostgreSQL (Cloud)',
                features: ['Age Categories', 'Crime Severity', 'Infant Analytics', 'Risk Assessment', 'Cloud Storage']
            });
        } else {
            // SQLite status
            db.get(`
                SELECT 
                    COUNT(*) as count,
                    COUNT(CASE WHEN cvw_age_category = 'Infant' THEN 1 END) as infant_count,
                    COUNT(CASE WHEN crime_severity = 'CRITICAL' THEN 1 END) as critical_count
                FROM cvw_cases
            `, (err, row) => {
                if (err) {
                    res.status(500).json({ 
                        status: 'error', 
                        message: 'Database connection failed',
                        error: err.message 
                    });
                    return;
                }
                
                res.json({ 
                    status: 'connected', 
                    message: 'Enhanced SQLite database is operational',
                    totalRecords: row.count,
                    infantCases: row.infant_count,
                    criticalCases: row.critical_count,
                    databaseType: 'Enhanced SQLite',
                    features: ['Age Categories', 'Crime Severity', 'Infant Analytics', 'Risk Assessment']
                });
            });
        }
    } catch (error) {
        console.error('Database status error:', error);
        res.status(500).json({ 
            status: 'error', 
            message: 'Database connection failed',
            error: error.message 
        });
    }
});

// Analytics endpoint
app.get('/api/analytics', async (req, res) => {
    try {
        if (isCloudDatabase) {
            const result = await db.query(`
                SELECT 
                    district,
                    COUNT(*) as total_cases,
                    COUNT(CASE WHEN crime_severity = 'CRITICAL' THEN 1 END) as critical_cases,
                    COUNT(CASE WHEN cvw_age_category = 'Infant' THEN 1 END) as infant_cases,
                    COUNT(CASE WHEN followup_required = true THEN 1 END) as followup_cases
                FROM cvw_cases 
                GROUP BY district
                ORDER BY total_cases DESC
            `);
            res.json(result.rows);
        } else {
            const sql = `
                SELECT 
                    district,
                    COUNT(*) as total_cases,
                    COUNT(CASE WHEN crime_severity = 'CRITICAL' THEN 1 END) as critical_cases,
                    COUNT(CASE WHEN cvw_age_category = 'Infant' THEN 1 END) as infant_cases,
                    COUNT(CASE WHEN followup_required = 1 THEN 1 END) as followup_cases
                FROM cvw_cases 
                GROUP BY district
                ORDER BY total_cases DESC
            `;
            
            db.all(sql, [], (err, rows) => {
                if (err) {
                    console.error('Error fetching analytics:', err.message);
                    res.status(500).json({ error: 'Database error' });
                    return;
                }
                res.json(rows);
            });
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Add new case endpoint
app.post('/api/cases', async (req, res) => {
    const {
        cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
        offender_gender, offender_age, crime_type, disability, services_rendered,
        relationship_to_cv
    } = req.body;

    // Auto-calculate fields
    const age_months = Math.round(cvw_age * 12);
    let age_category = 'Child';
    if (cvw_age < 1) age_category = 'Infant';
    else if (cvw_age < 3) age_category = 'Toddler';
    else if (cvw_age >= 13) age_category = 'Teen';

    let crime_severity = 'MEDIUM';
    if (['RAPE', 'SEXUAL ASSAULT', 'DEFILEMENT'].includes(crime_type.toUpperCase())) {
        crime_severity = 'CRITICAL';
    } else if (['PHYSICAL ABUSE', 'ASSAULT ON A CHILD'].includes(crime_type.toUpperCase())) {
        crime_severity = 'HIGH';
    }

    const followup_required = cvw_age < 1 || crime_severity === 'CRITICAL';

    try {
        if (isCloudDatabase) {
            const result = await db.query(`
                INSERT INTO cvw_cases (
                    cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
                    cvw_age_months, cvw_age_category, offender_gender, offender_age, crime_type,
                    disability, services_rendered, relationship_to_cv, crime_severity, followup_required
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `, [
                cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
                age_months, age_category, offender_gender, offender_age, crime_type,
                disability || 'NON', services_rendered, relationship_to_cv, crime_severity, followup_required
            ]);
            
            res.status(201).json({ 
                message: 'Case added successfully', 
                case: result.rows[0] 
            });
        } else {
            const sql = `
                INSERT INTO cvw_cases (
                    cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
                    cvw_age_months, cvw_age_category, offender_gender, offender_age, crime_type,
                    disability, services_rendered, relationship_to_cv, crime_severity, followup_required
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            db.run(sql, [
                cvw_code, record_type, date_reported, district, cvw_gender, cvw_age,
                age_months, age_category, offender_gender, offender_age, crime_type,
                disability || 'NON', services_rendered, relationship_to_cv, crime_severity, followup_required ? 1 : 0
            ], function(err) {
                if (err) {
                    console.error('Error adding case:', err.message);
                    res.status(500).json({ error: 'Database error' });
                    return;
                }
                
                res.status(201).json({ 
                    message: 'Case added successfully', 
                    caseId: this.lastID 
                });
            });
        }
    } catch (error) {
        console.error('Error adding case:', error);
        res.status(500).json({ error: 'Database error' });
    }
});

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        database: isCloudDatabase ? 'PostgreSQL' : 'SQLite',
        environment: process.env.NODE_ENV || 'development'
    });
});

// Initialize database and start server
initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🚀 CVW Dashboard server running on port ${PORT}`);
            console.log(`📊 Database Type: ${isCloudDatabase ? 'PostgreSQL (Cloud)' : 'SQLite (Local)'}`);
            console.log(`🌐 Access: http://localhost:${PORT}`);
            console.log(`🔍 API Status: http://localhost:${PORT}/api/status`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
        });
    })
    .catch((error) => {
        console.error('❌ Failed to initialize database:', error.message);
        console.log('🔄 Starting server with fallback mode...');
        
        // Start server even if database fails
        app.listen(PORT, () => {
            console.log(`🚀 CVW Dashboard server running on port ${PORT} (FALLBACK MODE)`);
            console.log(`🌐 Access: http://localhost:${PORT}`);
        });
    });