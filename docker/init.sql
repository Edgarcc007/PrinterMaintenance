CREATE TABLE locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE printers (
    id SERIAL PRIMARY KEY,
    brand VARCHAR(50) NOT NULL CHECK (brand IN ('Zebra', 'Honeywell')),
    model VARCHAR(100) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    asset_tag VARCHAR(50),
    ip_address VARCHAR(45),
    location_id INTEGER REFERENCES locations(id),
    production_line VARCHAR(100),
    installation_date DATE,
    status VARCHAR(20) DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive', 'In Repair', 'Decommissioned')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TYPE maintenance_type AS ENUM ('Preventive', 'Corrective');

CREATE TABLE maintenance_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    type maintenance_type NOT NULL,
    description VARCHAR(255),
    estimated_minutes INTEGER DEFAULT 30,
    frequency_days INTEGER,
    applies_to VARCHAR(50) DEFAULT 'Both' CHECK (applies_to IN ('Zebra', 'Honeywell', 'Both'))
);

CREATE TABLE maintenance_records (
    id SERIAL PRIMARY KEY,
    printer_id INTEGER NOT NULL REFERENCES printers(id),
    category_id INTEGER NOT NULL REFERENCES maintenance_categories(id),
    type maintenance_type NOT NULL,
    performed_by VARCHAR(100) NOT NULL,
    performed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    next_due_date DATE,
    duration_minutes INTEGER,
    findings TEXT,
    actions_taken TEXT,
    parts_replaced TEXT,
    status VARCHAR(20) DEFAULT 'Completed' CHECK (status IN ('Scheduled', 'In Progress', 'Completed', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_schedule (
    id SERIAL PRIMARY KEY,
    printer_id INTEGER NOT NULL REFERENCES printers(id),
    category_id INTEGER NOT NULL REFERENCES maintenance_categories(id),
    frequency_days INTEGER NOT NULL,
    last_performed DATE,
    next_due_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed locations
INSERT INTO locations (name, description) VALUES
    ('Warehouse', 'Main warehouse area'),
    ('Production Line 1', 'SMT Line 1'),
    ('Production Line 2', 'SMT Line 2'),
    ('Production Line 3', 'Assembly Line 3'),
    ('Production Line 4', 'Assembly Line 4'),
    ('Shipping', 'Shipping and receiving dock'),
    ('Quality Lab', 'Quality control laboratory'),
    ('IT Room', 'IT server and equipment room');

-- Seed maintenance categories
INSERT INTO maintenance_categories (name, type, description, estimated_minutes, frequency_days, applies_to) VALUES
    ('Printhead Cleaning', 'Preventive', 'Clean printhead with IPA and lint-free cloth', 15, 14, 'Both'),
    ('Platen Roller Cleaning', 'Preventive', 'Clean platen roller to remove debris and adhesive', 15, 30, 'Both'),
    ('Sensor Cleaning', 'Preventive', 'Clean media and ribbon sensors with compressed air', 10, 30, 'Both'),
    ('Ribbon Path Cleaning', 'Preventive', 'Clean ribbon path and guides', 10, 30, 'Both'),
    ('Calibration', 'Preventive', 'Full media and ribbon sensor calibration', 20, 30, 'Both'),
    ('Firmware Update', 'Preventive', 'Check and apply firmware updates', 30, 180, 'Both'),
    ('Full Preventive Service', 'Preventive', 'Complete PM: clean, calibrate, inspect', 60, 90, 'Both'),
    ('Printhead Replacement', 'Corrective', 'Replace worn or damaged printhead', 45, NULL, 'Both'),
    ('Platen Roller Replacement', 'Corrective', 'Replace worn platen roller', 30, NULL, 'Both'),
    ('Power Supply Repair', 'Corrective', 'Diagnose and repair power supply issues', 60, NULL, 'Both'),
    ('Connectivity Issue', 'Corrective', 'Troubleshoot network or USB connectivity', 30, NULL, 'Both'),
    ('Paper Jam Resolution', 'Corrective', 'Clear paper jam and inspect feed mechanism', 15, NULL, 'Both'),
    ('Print Quality Issue', 'Corrective', 'Fix print quality problems (fading, smearing, gaps)', 30, NULL, 'Both'),
    ('Ribbon Break Repair', 'Corrective', 'Fix ribbon break and realign ribbon path', 20, NULL, 'Both'),
    ('General Repair', 'Corrective', 'General troubleshooting and repair', 60, NULL, 'Both');

-- Indexes
CREATE INDEX idx_records_printer ON maintenance_records(printer_id);
CREATE INDEX idx_records_date ON maintenance_records(performed_at);
CREATE INDEX idx_schedule_due ON maintenance_schedule(next_due_date);
CREATE INDEX idx_printers_status ON printers(status);
