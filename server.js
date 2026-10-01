const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

app.post('/api/register', async (req, res) => {
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone are required' });
  }

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, phone }]);

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.status(200).json({ message: 'User registered successfully', data });
});
// Endpoint to fetch a single user by ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json(data);
});
// Endpoint to fetch a single user by ID
app.get('/api/user/:id', async (req, res) => {
  const { id } = req.params;
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

let supabase;
if (supabaseUrl && supabaseSecretKey) {
  supabase = createClient(supabaseUrl, supabaseSecretKey);
}

// Helper: Standardize Kenyan Phone Numbers (+254...)
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, ''); // remove non-digits
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return '+' + cleaned;
}

// 1. Registration Endpoint with Phone Formatting
app.post('/api/register', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'KaziCash database is not configured yet' });
  }

  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  const formattedPhone = formatPhoneNumber(phone);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, phone: formattedPhone }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json({ success: true, user: data[0] });
});

// 2. Fetch Single User by ID
app.get('/api/user/:id', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'KaziCash database is not configured yet' });
  }

  const { id } = req.params;
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json(data);
});

// 3. Admin Endpoint: Fetch All Registered Users
app.get('/api/admin/users', async (req, res) => {
  if (!supabase) {
    return res.status(500).json({ error: 'KaziCash database is not configured yet' });
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  res.status(200).json(data);
});

// Fallback to Serve Frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.status(200).json(data);
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
