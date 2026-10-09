const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/withdraw', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'withdraw.html'));
});

app.post('/api/withdraw', async (req, res) => {
  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required.' });
  }

  try {
    const consumerKey = process.env.MPESA_CONSUMER_KEY || 'YOUR_CONSUMER_KEY';
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET || 'YOUR_CONSUMER_SECRET';
    const shortCode = process.env.MPESA_SHORTCODE || '174379';
    const passkey = process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';

    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const accessToken = tokenResponse.data.access_token;

    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      String(date.getMonth() + 1).padStart(2, '0') +
      String(date.getDate()).padStart(2, '0') +
      String(date.getHours()).padStart(2, '0') +
      String(date.getMinutes()).padStart(2, '0') +
      String(date.getSeconds()).padStart(2, '0');

    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

    let formattedPhone = phone.toString().trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '254' + formattedPhone.slice(1);
    } else if (formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.slice(1);
    }

    const stkPayload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: parseInt(amount, 10),
      PartyA: formattedPhone,
      PartyB: shortCode,
      PhoneNumber: formattedPhone,
      CallBackURL: 'https://mydomain.com/api/callback',
      AccountReference: 'KaziCash',
      TransactionDesc: 'KaziCash Withdrawal'
    };

    const stkResponse = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      stkPayload,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    return res.status(200).json({
      success: true,
      message: 'STK push sent successfully',
      data: stkResponse.data
    });

  } catch (error) {
    console.error('Daraja Error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to process M-Pesa withdrawal.'
    });
  }
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;

