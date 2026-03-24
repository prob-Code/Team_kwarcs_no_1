-- Run this in your Supabase SQL Editor

-- Enable PostGIS for geospatial queries (if needed)
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. USERS & PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('worker', 'customer')),
    avatar TEXT,
    lat NUMERIC,
    lng NUMERIC,
    rating NUMERIC DEFAULT 5.0,
    jobs_completed INTEGER DEFAULT 0,
    daily_rate INTEGER DEFAULT 0,
    aadhaar_verified BOOLEAN DEFAULT false,
    available BOOLEAN DEFAULT true,
    trust_level TEXT DEFAULT 'bronze',
    skills TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    skill TEXT NOT NULL,
    description TEXT,
    budget INTEGER NOT NULL,
    lat NUMERIC,
    lng NUMERIC,
    customer_id UUID REFERENCES profiles(id),
    customer_name TEXT,
    hired_worker_id UUID REFERENCES profiles(id),
    urgent BOOLEAN DEFAULT false,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'hired', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() + INTERVAL '1 day'
);

-- 3. JOB APPLICANTS (Many-to-Many relation)
CREATE TABLE IF NOT EXISTS job_applicants (
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    worker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (job_id, worker_id)
);

-- 4. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT,
    title TEXT,
    body TEXT,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. MESSAGES
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- REALTIME LOGIC
-- To use Supabase realtime effectively, you need to turn it on for these tables
alter publication supabase_realtime add table profiles;
alter publication supabase_realtime add table jobs;
alter publication supabase_realtime add table notifications;
alter publication supabase_realtime add table messages;
