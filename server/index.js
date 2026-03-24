const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(express.json());

// ============================================================
// IN-MEMORY DATA STORE (Production: swap with PostgreSQL/Supabase)
// ============================================================
const store = {
  users: new Map(),
  workers: new Map(),
  customers: new Map(),
  jobs: new Map(),
  notifications: new Map(),
  reviews: new Map(),
  conversations: new Map(),
};

// Skill definitions
const SKILLS = [
  { id: 'plumber', name: 'Plumber', nameHi: 'प्लंबर', icon: '🔧', color: '#2196F3' },
  { id: 'electrician', name: 'Electrician', nameHi: 'इलेक्ट्रीशियन', icon: '⚡', color: '#FF9800' },
  { id: 'painter', name: 'Painter', nameHi: 'पेंटर', icon: '🎨', color: '#9C27B0' },
  { id: 'carpenter', name: 'Carpenter', nameHi: 'बढ़ई', icon: '🪚', color: '#795548' },
  { id: 'mason', name: 'Mason', nameHi: 'मिस्त्री', icon: '🧱', color: '#F44336' },
  { id: 'cleaner', name: 'Cleaner', nameHi: 'सफाईकर्मी', icon: '🧹', color: '#4CAF50' },
  { id: 'driver', name: 'Driver', nameHi: 'ड्राइवर', icon: '🚗', color: '#607D8B' },
  { id: 'helper', name: 'Helper', nameHi: 'हेल्पर', icon: '💪', color: '#FF5722' },
  { id: 'gardener', name: 'Gardener', nameHi: 'माली', icon: '🌱', color: '#8BC34A' },
  { id: 'cook', name: 'Cook', nameHi: 'रसोइया', icon: '👨‍🍳', color: '#E91E63' },
  { id: 'welder', name: 'Welder', nameHi: 'वेल्डर', icon: '🔥', color: '#FF6F00' },
  { id: 'tailor', name: 'Tailor', nameHi: 'दर्जी', icon: '🧵', color: '#AB47BC' },
];

// Fair price ranges per skill per day (INR)
const PRICE_RANGES = {
  plumber: { min: 400, max: 700 },
  electrician: { min: 500, max: 800 },
  painter: { min: 350, max: 600 },
  carpenter: { min: 500, max: 900 },
  mason: { min: 500, max: 800 },
  cleaner: { min: 300, max: 500 },
  driver: { min: 500, max: 800 },
  helper: { min: 300, max: 500 },
  gardener: { min: 300, max: 500 },
  cook: { min: 400, max: 700 },
  welder: { min: 600, max: 1000 },
  tailor: { min: 400, max: 700 },
};

// Trust levels
const TRUST_LEVELS = {
  bronze: { min: 0, label: 'Bronze', color: '#CD7F32' },
  silver: { min: 10, label: 'Silver', color: '#C0C0C0' },
  gold: { min: 25, label: 'Gold', color: '#FFD700' },
};

function getTrustLevel(jobsCompleted) {
  if (jobsCompleted >= TRUST_LEVELS.gold.min) return 'gold';
  if (jobsCompleted >= TRUST_LEVELS.silver.min) return 'silver';
  return 'bronze';
}

// Haversine distance in km
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Seed demo data
function seedData() {
  const demoWorkers = [
    { name: 'Ramesh Kumar', phone: '9876543210', skills: ['plumber', 'mason'], lat: 19.076, lng: 72.8777, rating: 4.8, jobsCompleted: 127, dailyRate: 500, aadhaarVerified: true, available: true },
    { name: 'Suresh Yadav', phone: '9876543211', skills: ['electrician'], lat: 19.08, lng: 72.88, rating: 4.6, jobsCompleted: 89, dailyRate: 600, aadhaarVerified: true, available: true },
    { name: 'Mohan Sharma', phone: '9876543212', skills: ['painter', 'helper'], lat: 19.072, lng: 72.875, rating: 4.9, jobsCompleted: 203, dailyRate: 450, aadhaarVerified: true, available: true },
    { name: 'Ajay Patil', phone: '9876543213', skills: ['carpenter'], lat: 19.078, lng: 72.882, rating: 4.5, jobsCompleted: 56, dailyRate: 700, aadhaarVerified: false, available: true },
    { name: 'Dinesh Gupta', phone: '9876543214', skills: ['electrician', 'plumber'], lat: 19.074, lng: 72.873, rating: 4.7, jobsCompleted: 145, dailyRate: 550, aadhaarVerified: true, available: false },
    { name: 'Vikram Singh', phone: '9876543215', skills: ['mason', 'helper'], lat: 19.082, lng: 72.885, rating: 4.3, jobsCompleted: 34, dailyRate: 400, aadhaarVerified: true, available: true },
    { name: 'Prakash Joshi', phone: '9876543216', skills: ['cook'], lat: 19.069, lng: 72.871, rating: 4.9, jobsCompleted: 178, dailyRate: 500, aadhaarVerified: true, available: true },
    { name: 'Santosh More', phone: '9876543217', skills: ['driver'], lat: 19.085, lng: 72.889, rating: 4.4, jobsCompleted: 67, dailyRate: 600, aadhaarVerified: true, available: true },
    { name: 'Manoj Pawar', phone: '9876543218', skills: ['welder', 'carpenter'], lat: 19.071, lng: 72.878, rating: 4.6, jobsCompleted: 92, dailyRate: 800, aadhaarVerified: true, available: true },
    { name: 'Raju Chauhan', phone: '9876543219', skills: ['cleaner', 'gardener'], lat: 19.079, lng: 72.876, rating: 4.2, jobsCompleted: 15, dailyRate: 350, aadhaarVerified: false, available: true },
    { name: 'Ganesh Sawant', phone: '9876543220', skills: ['plumber'], lat: 19.083, lng: 72.872, rating: 4.8, jobsCompleted: 210, dailyRate: 550, aadhaarVerified: true, available: true },
    { name: 'Amit Deshmukh', phone: '9876543221', skills: ['tailor'], lat: 19.068, lng: 72.880, rating: 4.7, jobsCompleted: 156, dailyRate: 500, aadhaarVerified: true, available: true },
  ];

  demoWorkers.forEach((w) => {
    const id = uuidv4();
    const worker = {
      id,
      ...w,
      type: 'worker',
      trustLevel: getTrustLevel(w.jobsCompleted),
      responseTime: Math.floor(Math.random() * 10) + 1,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(w.name)}&backgroundColor=22c55e&textColor=ffffff`,
    };
    store.workers.set(id, worker);
    store.users.set(id, { ...worker, role: 'worker' });
  });

  // Demo jobs
  const demoJobs = [
    { title: 'Fix Kitchen Sink Leak', skill: 'plumber', description: 'Kitchen sink leaking from pipe joint', budget: 500, lat: 19.077, lng: 72.879, customerName: 'Priya Mehta', urgent: true },
    { title: 'Install Ceiling Fan', skill: 'electrician', description: 'New ceiling fan installation in bedroom', budget: 600, lat: 19.075, lng: 72.881, customerName: 'Rahul Verma', urgent: false },
    { title: 'Paint 2BHK Flat', skill: 'painter', description: 'Full flat painting - 2 bedrooms, hall, kitchen', budget: 8000, lat: 19.073, lng: 72.876, customerName: 'Anita Singh', urgent: false },
    { title: 'Build Kitchen Shelf', skill: 'carpenter', description: 'Custom wooden shelf for kitchen storage', budget: 2000, lat: 19.081, lng: 72.884, customerName: 'Sanjay Patel', urgent: true },
    { title: 'Bathroom Tiling Work', skill: 'mason', description: 'Retiling bathroom floor and walls', budget: 5000, lat: 19.070, lng: 72.874, customerName: 'Meena Devi', urgent: false },
    { title: 'Deep Clean 3BHK', skill: 'cleaner', description: 'Full house deep cleaning required', budget: 1500, lat: 19.084, lng: 72.887, customerName: 'Kiran Desai', urgent: true },
  ];

  demoJobs.forEach((j) => {
    const id = uuidv4();
    const customerId = uuidv4();
    store.customers.set(customerId, {
      id: customerId,
      name: j.customerName,
      type: 'customer',
      phone: '98' + Math.floor(10000000 + Math.random() * 90000000),
      lat: j.lat,
      lng: j.lng,
      rating: (4 + Math.random()).toFixed(1),
    });
    store.jobs.set(id, {
      id,
      ...j,
      customerId,
      status: 'open',
      applicants: [],
      createdAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    });
  });

  console.log(`Seeded: ${store.workers.size} workers, ${store.jobs.size} jobs`);
}

seedData();

// ============================================================
// REST API ENDPOINTS
// ============================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    connectedClients: io.engine.clientsCount,
    workers: store.workers.size,
    jobs: store.jobs.size,
  });
});

// Get all skills
app.get('/api/skills', (req, res) => {
  res.json(SKILLS);
});

// Get price ranges
app.get('/api/prices', (req, res) => {
  res.json(PRICE_RANGES);
});

// Auth - OTP Login (simulated)
app.post('/api/auth/send-otp', (req, res) => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    return res.status(400).json({ error: 'Invalid phone number' });
  }
  // In production: integrate with SMS gateway (MSG91, Twilio, etc.)
  const otp = '123456'; // Demo OTP
  console.log(`OTP for ${phone}: ${otp}`);
  res.json({ success: true, message: 'OTP sent successfully', demo_otp: otp });
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { phone, otp, role, name } = req.body;
  if (otp !== '123456') {
    return res.status(401).json({ error: 'Invalid OTP' });
  }

  // Find existing user or create new
  let user = null;
  const userStore = role === 'worker' ? store.workers : store.customers;
  for (const [id, u] of userStore) {
    if (u.phone === phone) {
      user = u;
      break;
    }
  }

  if (!user) {
    const id = uuidv4();
    user = {
      id,
      name: name || 'User',
      phone,
      type: role || 'worker',
      skills: [],
      lat: 19.076,
      lng: 72.8777,
      rating: 5.0,
      jobsCompleted: 0,
      dailyRate: 0,
      aadhaarVerified: false,
      available: true,
      trustLevel: 'bronze',
      responseTime: 0,
      createdAt: new Date().toISOString(),
      lastActive: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name || 'User')}&backgroundColor=22c55e&textColor=ffffff`,
    };
    userStore.set(id, user);
    store.users.set(id, { ...user, role });
  }

  res.json({ success: true, user, token: `token_${user.id}` });
});

// Workers API
app.get('/api/workers', (req, res) => {
  const { skill, lat, lng, radius = 10, available } = req.query;
  let workers = Array.from(store.workers.values());

  if (skill) {
    workers = workers.filter((w) => w.skills.includes(skill));
  }
  if (available === 'true') {
    workers = workers.filter((w) => w.available);
  }
  if (lat && lng) {
    workers = workers
      .map((w) => ({
        ...w,
        distance: getDistance(parseFloat(lat), parseFloat(lng), w.lat, w.lng),
      }))
      .filter((w) => w.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);
  }

  res.json(workers);
});

app.get('/api/workers/:id', (req, res) => {
  const worker = store.workers.get(req.params.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  res.json(worker);
});

app.put('/api/workers/:id', (req, res) => {
  const worker = store.workers.get(req.params.id);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  const updated = { ...worker, ...req.body, lastActive: new Date().toISOString() };
  if (req.body.jobsCompleted !== undefined) {
    updated.trustLevel = getTrustLevel(req.body.jobsCompleted);
  }
  store.workers.set(req.params.id, updated);

  // Broadcast availability change
  if (req.body.available !== undefined) {
    io.emit('worker:availability', { workerId: req.params.id, available: req.body.available });
  }

  res.json(updated);
});

// Jobs API
app.get('/api/jobs', (req, res) => {
  const { skill, status = 'open', lat, lng, radius = 10 } = req.query;
  let jobs = Array.from(store.jobs.values());

  if (skill) {
    jobs = jobs.filter((j) => j.skill === skill);
  }
  if (status) {
    jobs = jobs.filter((j) => j.status === status);
  }
  if (lat && lng) {
    jobs = jobs
      .map((j) => ({
        ...j,
        distance: getDistance(parseFloat(lat), parseFloat(lng), j.lat, j.lng),
      }))
      .filter((j) => j.distance <= parseFloat(radius))
      .sort((a, b) => a.distance - b.distance);
  }

  // Add customer info and skill info
  jobs = jobs.map((j) => ({
    ...j,
    skillInfo: SKILLS.find((s) => s.id === j.skill),
    priceRange: PRICE_RANGES[j.skill],
  }));

  res.json(jobs);
});

app.post('/api/jobs', (req, res) => {
  const { title, skill, description, budget, lat, lng, customerId, customerName, urgent } = req.body;

  const id = uuidv4();
  const job = {
    id,
    title,
    skill,
    description,
    budget,
    lat: lat || 19.076,
    lng: lng || 72.8777,
    customerId,
    customerName,
    urgent: urgent || false,
    status: 'open',
    applicants: [],
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 86400000).toISOString(),
  };
  store.jobs.set(id, job);

  // Real-time: notify nearby workers with matching skill
  const nearbyWorkers = Array.from(store.workers.values()).filter((w) => {
    if (!w.available || !w.skills.includes(skill)) return false;
    const dist = getDistance(job.lat, job.lng, w.lat, w.lng);
    return dist <= 5;
  });

  const skillInfo = SKILLS.find((s) => s.id === skill);
  nearbyWorkers.forEach((w) => {
    const dist = getDistance(job.lat, job.lng, w.lat, w.lng).toFixed(1);
    const notification = {
      id: uuidv4(),
      type: 'new_job',
      title: `New ${skillInfo?.name || skill} job ${dist}km away!`,
      body: `${title} - ₹${budget}`,
      jobId: id,
      workerId: w.id,
      createdAt: new Date().toISOString(),
      read: false,
    };
    const workerNotifs = store.notifications.get(w.id) || [];
    workerNotifs.unshift(notification);
    store.notifications.set(w.id, workerNotifs);
    io.to(`user:${w.id}`).emit('notification', notification);
  });

  io.emit('job:new', { ...job, skillInfo });
  res.status(201).json(job);
});

app.post('/api/jobs/:id/apply', (req, res) => {
  const { workerId } = req.body;
  const job = store.jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  const worker = store.workers.get(workerId);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });

  if (!job.applicants.includes(workerId)) {
    job.applicants.push(workerId);
    store.jobs.set(req.params.id, job);

    // Notify customer
    const notification = {
      id: uuidv4(),
      type: 'job_application',
      title: `${worker.name} applied for your job`,
      body: `${job.title} - Rating: ${worker.rating}⭐`,
      jobId: job.id,
      workerId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    io.to(`user:${job.customerId}`).emit('notification', notification);
    io.emit('job:application', { jobId: job.id, worker: { id: worker.id, name: worker.name, rating: worker.rating } });
  }

  res.json({ success: true, job });
});

app.post('/api/jobs/:id/hire', (req, res) => {
  const { workerId } = req.body;
  const job = store.jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = 'hired';
  job.hiredWorkerId = workerId;
  store.jobs.set(req.params.id, job);

  const worker = store.workers.get(workerId);
  const notification = {
    id: uuidv4(),
    type: 'hired',
    title: '🎉 You are hired!',
    body: `${job.title} - ₹${job.budget}`,
    jobId: job.id,
    createdAt: new Date().toISOString(),
    read: false,
  };
  const workerNotifs = store.notifications.get(workerId) || [];
  workerNotifs.unshift(notification);
  store.notifications.set(workerId, workerNotifs);
  io.to(`user:${workerId}`).emit('notification', notification);
  io.emit('job:hired', { jobId: job.id, workerId });

  res.json({ success: true, job });
});

app.post('/api/jobs/:id/complete', (req, res) => {
  const { rating, review } = req.body;
  const job = store.jobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });

  job.status = 'completed';
  store.jobs.set(req.params.id, job);

  // Update worker stats
  if (job.hiredWorkerId) {
    const worker = store.workers.get(job.hiredWorkerId);
    if (worker) {
      worker.jobsCompleted += 1;
      worker.trustLevel = getTrustLevel(worker.jobsCompleted);
      if (rating) {
        worker.rating = parseFloat(((worker.rating * (worker.jobsCompleted - 1) + rating) / worker.jobsCompleted).toFixed(1));
      }
      store.workers.set(job.hiredWorkerId, worker);
    }
  }

  io.emit('job:completed', { jobId: job.id });
  res.json({ success: true, job });
});

// Notifications
app.get('/api/notifications/:userId', (req, res) => {
  const notifs = store.notifications.get(req.params.userId) || [];
  res.json(notifs);
});

app.put('/api/notifications/:userId/read', (req, res) => {
  const notifs = store.notifications.get(req.params.userId) || [];
  notifs.forEach((n) => (n.read = true));
  store.notifications.set(req.params.userId, notifs);
  res.json({ success: true });
});

// Stats
app.get('/api/stats', (req, res) => {
  const workers = Array.from(store.workers.values());
  const jobs = Array.from(store.jobs.values());
  res.json({
    totalWorkers: workers.length,
    availableWorkers: workers.filter((w) => w.available).length,
    totalJobs: jobs.length,
    openJobs: jobs.filter((j) => j.status === 'open').length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
    connectedClients: io.engine.clientsCount,
  });
});

// ============================================================
// SOCKET.IO REAL-TIME
// ============================================================

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  // Join user room for targeted notifications
  socket.on('join', ({ userId }) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} joined room`);
  });

  // Worker location update
  socket.on('worker:location', ({ workerId, lat, lng }) => {
    const worker = store.workers.get(workerId);
    if (worker) {
      worker.lat = lat;
      worker.lng = lng;
      worker.lastActive = new Date().toISOString();
      store.workers.set(workerId, worker);
      io.emit('worker:moved', { workerId, lat, lng });
    }
  });

  // Worker availability toggle
  socket.on('worker:toggle-availability', ({ workerId, available }) => {
    const worker = store.workers.get(workerId);
    if (worker) {
      worker.available = available;
      worker.lastActive = new Date().toISOString();
      store.workers.set(workerId, worker);
      io.emit('worker:availability', { workerId, available });
    }
  });

  // Real-time chat
  socket.on('message:send', ({ senderId, receiverId, content, jobId }) => {
    const msgId = uuidv4();
    const message = {
      id: msgId,
      senderId,
      receiverId,
      content,
      jobId,
      createdAt: new Date().toISOString(),
      read: false,
    };

    const convKey = [senderId, receiverId].sort().join(':');
    const conv = store.conversations.get(convKey) || [];
    conv.push(message);
    store.conversations.set(convKey, conv);

    io.to(`user:${receiverId}`).emit('message:received', message);
    socket.emit('message:sent', message);
  });

  // Typing indicator
  socket.on('typing:start', ({ senderId, receiverId }) => {
    io.to(`user:${receiverId}`).emit('typing:indicator', { userId: senderId, typing: true });
  });

  socket.on('typing:stop', ({ senderId, receiverId }) => {
    io.to(`user:${receiverId}`).emit('typing:indicator', { userId: senderId, typing: false });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// ============================================================
// PERIODIC: Simulate real-time activity for demo
// ============================================================

setInterval(() => {
  const workers = Array.from(store.workers.values()).filter((w) => w.available);
  if (workers.length > 0) {
    const randomWorker = workers[Math.floor(Math.random() * workers.length)];
    // Slight location drift to simulate movement
    randomWorker.lat += (Math.random() - 0.5) * 0.001;
    randomWorker.lng += (Math.random() - 0.5) * 0.001;
    randomWorker.lastActive = new Date().toISOString();
    store.workers.set(randomWorker.id, randomWorker);
    io.emit('worker:moved', {
      workerId: randomWorker.id,
      lat: randomWorker.lat,
      lng: randomWorker.lng,
    });
  }
}, 15000);

// ============================================================
// START SERVER
// ============================================================

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🤝 RozgarSaathi Server v2.0         ║
  ║     Running on http://localhost:${PORT}     ║
  ║     WebSocket: ws://localhost:${PORT}       ║
  ╚══════════════════════════════════════════╝
  `);
});
