const express = require('express');
const path = require('path');
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the 'public' folder (serves index.html, withdraw.html, etc.)
app.use(express.static(path.join(__dirname, 'public')));

// M-Pesa Withdrawal API Endpoint
app.post('/api/withdraw', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required.' });
  }

  try {
    // TODO: Add your Daraja API STK Push logic here
    console.log(`Processing withdrawal of KES ${amount} for ${phone}`);
    
    // Simulate successful response for now
    return res.status(200).json({ success: true, message: 'STK Push sent successfully!' });
  } catch (error) {
    console.error('Daraja API Error:', error);
    return res.status(500).json({ error: 'Internal server error during withdrawal.' });
  }
});

// Fallback route to serve index.html for any other frontend navigation
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Export app for Vercel serverless deployment (and support local testing if needed)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
