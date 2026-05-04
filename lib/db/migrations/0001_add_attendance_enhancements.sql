-- Add new columns to time_entries table
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS method TEXT DEFAULT 'manual';
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS device_id INTEGER REFERENCES attendance_devices(id);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS late_minutes INTEGER DEFAULT 0;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS is_regularized BOOLEAN DEFAULT false;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS original_clock_in TIMESTAMP;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS original_clock_out TIMESTAMP;
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS shift_id INTEGER;

-- Create shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  grace_minutes INTEGER DEFAULT 10,
  break_minutes INTEGER DEFAULT 30,
  working_days JSON,
  overtime_threshold NUMERIC(4,2) DEFAULT 8,
  color TEXT DEFAULT '#84cc16',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create shift_assignments table
CREATE TABLE IF NOT EXISTS shift_assignments (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER,
  department_id INTEGER,
  shift_id INTEGER NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create regularization_requests table
CREATE TABLE IF NOT EXISTS regularization_requests (
  id SERIAL PRIMARY KEY,
  employee_id INTEGER NOT NULL,
  date DATE NOT NULL,
  requested_clock_in TIME NOT NULL,
  requested_clock_out TIME NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  approved_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
