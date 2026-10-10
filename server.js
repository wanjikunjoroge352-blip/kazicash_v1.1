const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// Initialize Supabase client using environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Example Withdrawal Route with Supabase logging
app.post('/api/withdraw', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required.' });
  }

  try {
    // Example: Save withdrawal request to a Supabase table named 'withdrawals'
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([{ phone, amount, status: 'pending' }]);

    if (error) {
      console.error('Supabase Error:', error.message);
      return res.status(500).json({ error: 'Failed to save withdrawal request.' });
    }

    return res.status(200).json({ success: true, message: 'Withdrawal request submitted successfully!', data });
  } catch (err) {
    console.error('Server Error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// Fallback route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

module.exports = app;
