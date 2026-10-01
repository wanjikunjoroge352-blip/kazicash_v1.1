
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Lines 10–16: Direct Supabase Client Initialization
// Replace these two values with your actual keys from Supabase Settings -> API
const supabaseUrl =https://najyoucexukhiuihntjh.supabase.co/rest/v1/
const supabaseSecretKey =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanlvdWNleHVraGl1aWhudGpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc2MTk2OCwiZXhwIjoyMTA2MzM3OTY4fQ.WvgUXI_xUIH_M-acPMapF79RmAtcp--bZYtpbsgrJMQ
const supabase = createClient(supabaseUrl, supabaseSecretKey);

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
  const { name, phone } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: 'Name and phone number are required.' });
  }

  // Format phone number to +254...
  const formattedPhone = formatPhoneNumber(phone);

  // Save to Supabase 'users' table
  const { data, error } = await supabase
    .from('users')
    .insert([{ name, phone: formattedPhone }])
    .select();

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // Send back registered user object (contains id, name, phone)
  res.status(200).json({ success: true, user: data[0] });
});

// 2. Fetch Single User by ID
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

// 3. Admin Endpoint: Fetch All Registered Users
app.get('/api/admin/users', async (req, res) => {
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

  
