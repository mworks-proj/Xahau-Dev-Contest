'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ShippingAddressProps {
  rAddress: string;
  savedAddress?: ShippingAddressType; // Optional prop for pre-populating fields
  onSave: (newAddress: ShippingAddressType) => void;
  onClose: () => void;
}

interface ShippingAddressType {
  email?: string;
  address: string;
  city: string;
  state: string;
  zip: string;
}

export default function ShippingAddress({
  rAddress,
  savedAddress,
  onSave,
  onClose,
}: ShippingAddressProps) {
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Populate fields if savedAddress is provided
    if (savedAddress) {
      setEmail(savedAddress.email || '');
      setAddress(savedAddress.address || '');
      setCity(savedAddress.city || '');
      setState(savedAddress.state || '');
      setZip(savedAddress.zip || '');
    }
  }, [savedAddress]);

  const handleSave = async () => {
    if (!email || !address || !city || !state || !zip) {
      toast.error('Please fill out all fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/save-shipping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ rAddress, email, address, city, state, zip }),
      });

      if (!response.ok) {
        throw new Error('Failed to save shipping address');
      }

      const savedAddress: ShippingAddressType = { email, address, city, state, zip };
      toast.success('Shipping address saved!');
      onSave(savedAddress);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An unexpected error occurred'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 text-slate-800 p-4 m-4 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-bold">Enter Shipping Address</h2>
      <p>Where should we send shipment or delivery updates? P.O. Box is okay for parcels.</p>

      <input
        className="border p-2 w-full"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        disabled={loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="Address"
        value={address}
        onChange={(e) => setAddress(e.target.value)}
        disabled={loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        disabled={loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="State"
        value={state}
        onChange={(e) => setState(e.target.value)}
        disabled={loading}
      />
      <input
        className="border p-2 w-full"
        placeholder="ZIP Code"
        value={zip}
        onChange={(e) => setZip(e.target.value)}
        disabled={loading}
      />

      <Button
        type="button"
        onClick={handleSave}
        className="w-full"
        disabled={loading}
      >
        {loading ? 'Saving...' : 'Save Address'}
      </Button>
      <Button
        type="button"
        onClick={onClose}
        className="w-full mt-2 bg-red-500 text-white"
        disabled={loading}
      >
        Close
      </Button>
    </div>
  );
}
