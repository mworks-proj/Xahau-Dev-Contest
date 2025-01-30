import { supabase } from '@/lib/supabaseClient'; // Use centralized Supabase client
import { NextResponse } from 'next/server';



interface ShippingAddress {
  address: string;
  city: string;
  state: string;
  zip: string;
}

interface GetCustomerResponse {
  exists: boolean;
  shipping_address: ShippingAddress | null;
  error?: string;
}


export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const wallet = searchParams.get('wallet');

    // Check for wallet parameter
    if (!wallet) {
      return NextResponse.json(
        { error: 'Wallet address is required', exists: false, shipping_address: null },
        { status: 400 }
      );
    }

    // Query Supabase for the customer's shipping address
    const { data, error } = await supabase
      .from('customers')
      .select('wallet_address, shipping_address')
      .eq('wallet_address', wallet)
      .limit(1);

    if (error) {
      console.error('Error fetching customer data:', error.message);
      return NextResponse.json(
        { error: 'Error fetching customer data', exists: false, shipping_address: null },
        { status: 500 }
      );
    }

    // Handle case where no matching record is found
    if (!data || data.length === 0) {
      // Return a response indicating no customer details found
      return NextResponse.json(
        { exists: false, redirect: true, message: 'Welcome to xMerch! Start by adding items to your cart.' },
        { status: 200 }
      );
    }

    // Respond with the shipping address
    return NextResponse.json({
      exists: true,
      shipping_address: data[0].shipping_address || null,
    });
  } catch (error) {
    console.error('Unexpected server error:', error);
    return NextResponse.json(
      { error: 'Internal server error', exists: false, shipping_address: null },
      { status: 500 }
    );
  }
}
