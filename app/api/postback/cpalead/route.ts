import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase admin client (requires Service Role Key for writing balances)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // CPALead Postback Query Parameters
    const subid = searchParams.get('subid');          // User ID passed from app
    const leadId = searchParams.get('lead_id');        // Unique CPALead conversion transaction ID
    const campaignId = searchParams.get('campaign_id');// Task / Campaign ID
    const payoutUsd = searchParams.get('payout');      // Payout amount in USD
    const password = searchParams.get('password');    // Postback secret key

    // 1. Verify Secret Password to prevent unauthorized calls
    const expectedPassword = process.env.CPALEAD_POSTBACK_PASSWORD;
    if (expectedPassword && password !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized invalid secret' }, { status: 401 });
    }

    // 2. Validate essential fields
    if (!subid || !leadId || !payoutUsd) {
      return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
    }

    // 3. Convert USD payout to KES (e.g. 1 USD = ~130 KES, adjust multiplier as preferred)
    const usdAmount = parseFloat(payoutUsd);
    const conversionRate = 130; 
    const kesAmount = Math.round(usdAmount * conversionRate);

    // 4. Check for duplicate conversions (Idempotency)
    const { data: existingLead } = await supabase
      .from('task_completions')
      .select('id')
      .eq('lead_id', leadId)
      .single();

    if (existingLead) {
      // Already credited, respond HTTP 200 so CPALead stops retrying
      return NextResponse.json({ message: 'Lead already processed' }, { status: 200 });
    }

    // 5. Record the task completion in Supabase
    const { error: insertError } = await supabase.from('task_completions').insert([
      {
        user_id: subid,
        lead_id: leadId,
        campaign_id: campaignId,
        payout_usd: usdAmount,
        payout_kes: kesAmount,
        status: 'completed',
      },
    ]);

    if (insertError) {
      console.error('Error inserting transaction:', insertError);
      return NextResponse.json({ error: 'Failed to record task' }, { status: 500 });
    }

    // 6. Update User's Account Balance in Supabase
    const { error: updateError } = await supabase.rpc('increment_user_balance', {
      user_id_input: subid,
      amount_input: kesAmount,
    });

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return NextResponse.json({ error: 'Failed to update user wallet' }, { status: 500 });
    }

    return NextResponse.json({ success: true, credited_kes: kesAmount }, { status: 200 });
  } catch (error) {
    console.error('Postback Handler Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { userId, amountKes, phoneNumber } = await request.json();

    if (!userId || !amountKes || !phoneNumber) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Minimum withdrawal threshold (e.g., 50 KES)
    if (amountKes < 50) {
      return NextResponse.json({ error: 'Minimum withdrawal is KES 50' }, { status: 400 });
    }

    // Check user balance
    const { data: profile } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!profile || profile.balance < amountKes) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Deduct balance and record withdrawal request
    const { error: deductError } = await supabase.rpc('increment_user_balance', {
      user_id_input: userId,
      amount_input: -amountKes,
    });

    if (deductError) {
      return NextResponse.json({ error: 'Failed to process balance deduction' }, { status: 500 });
    }

    // Record request in DB
    await supabase.from('withdrawals').insert([
      {
        user_id: userId,
        phone_number: phoneNumber,
        amount_kes: amountKes,
        status: 'pending',
      },
    ]);

    return NextResponse.json({ success: true, message: 'Withdrawal request submitted successfully' });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
