const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { phone, amount } = req.body;

  if (!phone || !amount) {
    return res.status(400).json({ error: 'Phone number and amount are required.' });
  }

  try {
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([{ phone, amount, status: 'pending' }]);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ 
      success: true, 
      message: 'Withdrawal request submitted successfully!', 
      data 
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
