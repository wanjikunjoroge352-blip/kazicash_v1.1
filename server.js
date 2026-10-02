const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const app = express();

app.use(express.json());
app.use(express.static(path.join(process.cwd(), 'public')));

// Supabase Credentials (Hardcoded for direct Vercel execution)
const supabaseUrl = 'https://najyoucexukhiuihntjh.supabase.co';
const supabaseSecretKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hanlvdWNleHVraGl1aWhudGpoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDc2MTk2OCwiZXhwIjoyMTA2MzM3OTY4fQ.WvgUXI_xUIH_M-acPMapF79RmAtcp--bZYtpbsgrJMQ';

const supabase = createClient(supabaseUrl, supabaseSecretKey);

// Helper: Standardize Kenyan Phone Numbers (+254...)
function formatPhoneNumber(phone) {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '254' + cleaned.substring(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    cleaned = '254' + cleaned;
  }
  return '+' + cleaned;
}

// 1. Registration Endpoint
app.post('/api/register', async (req, res) => {
  try {
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

    return res.status(200).json({ success: true, user: data[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 2. Fetch Single User by ID
app.get('/api/user/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// 3. Admin Endpoint: Fetch All Users
app.get('/api/admin/users', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// Serve frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
});

// Export Express app for Vercel execution
module.exports = app;
