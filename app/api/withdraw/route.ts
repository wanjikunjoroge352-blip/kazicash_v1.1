import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, amount } = body;

    if (!phone || !amount) {
      return NextResponse.json(
        { error: 'Phone number and amount are required' },
        { status: 400 }
      );
    }

    // 1. Credentials from environment variables
    const consumerKey = process.env.MPESA_CONSUMER_KEY;
    const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
    const shortCode = process.env.MPESA_SHORTCODE; // e.g., Paybill or Till
    
    if (!consumerKey || !consumerSecret) {
      // Fallback response if environment credentials are not yet added
      console.log(`Mock Withdrawal processed for ${phone}: KES ${amount}`);
      return NextResponse.json(
        { success: true, message: 'Mock withdrawal successful (Daraja keys pending)' },
        { status: 200 }
      );
    }

    // 2. Generate Daraja OAuth Token
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
    const tokenResponse = await fetch(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: {
          authorization: `Basic ${auth}`,
        },
      }
    );
    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Failed to authenticate with M-Pesa' },
        { status: 500 }
      );
    }

    // 3. Send Request to M-Pesa B2C / Payout Endpoint
    // (Ensure you configure your production URL when moving live)
    const mpesaResponse = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
      {
        method: 'POST',
        headers: {
          authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          InitiatorName: process.env.MPESA_INITIATOR_NAME,
          SecurityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
          CommandID: 'BusinessPayment',
          Amount: amount,
          PartyA: shortCode,
          PartyB: phone,
          Remarks: 'KaziCash Withdrawal',
          QueueTimeoutUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/withdraw/timeout`,
          ResultUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/api/withdraw/result`,
          Occasion: 'Payout',
        }),
      }
    );

    const mpesaResult = await mpesaResponse.json();

    return NextResponse.json(
      { success: true, data: mpesaResult },
      { status: 200 }
    );

  } catch (error) {
    console.error('Daraja API Error:', error);
    return NextResponse.json(
      { error: 'Internal Server Error during M-Pesa processing' },
      { status: 500 }
    );
  }
}
