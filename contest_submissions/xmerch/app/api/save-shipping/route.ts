import { supabase } from '@/lib/supabaseClient'; // Use centralized Supabase client

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json();
    const { email, address, city, state, zip, rAddress } = body;

    // Validate required fields
    if (!email || !address || !city || !state || !zip || !rAddress) {
      console.error('Missing required fields:', body);
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Construct the shipping address object
    const shipping_address = { address, city, state, zip };

    // Step 1: Upsert customer details
    const { error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          wallet_address: rAddress,
          email,
          shipping_address,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'wallet_address' } // Prevent duplicate wallet addresses
      );

    if (customerError) {
      console.error('Error upserting customer data:', customerError.message);
      return new Response(
        JSON.stringify({ error: 'Failed to save customer details.' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    //console.log('Customer data saved successfully.');

    // Success response
    return new Response(
      JSON.stringify({ success: true, message: 'Shipping address saved successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Unexpected server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
