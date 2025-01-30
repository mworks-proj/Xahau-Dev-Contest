"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  getShippingAddress,
  setShippingAddress,
} from "@/lib/actions";
import ShippingAddress from "./ShippingAddress";

interface ShippingCardProps {
  walletAddress: string;
}

export default function ShippingCard({ walletAddress }: ShippingCardProps) {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const [shippingAddress, setLocalShippingAddress] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);

  // Fetch shipping address on component mount
  useEffect(() => {
    const fetchAddress = async () => {
      if (!walletAddress) return; // Ensure walletAddress is available

      const address = await getShippingAddress(walletAddress); // Pass walletAddress
      if (address) {
        setLocalShippingAddress(address);
      } else {
        setShowModal(true);
      }
    };

    fetchAddress();
  }, [walletAddress]);

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const handleSaveAddress = async (newAddress: any) => {
    if (!walletAddress) {
      console.error("Wallet address is required to save shipping address.");
      return;
    }

    await setShippingAddress(newAddress, walletAddress); // Pass walletAddress
    setLocalShippingAddress(newAddress);
    setShowModal(false); // Close the modal after saving
  };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal without saving
  };

  return (
    <Card className="bg-gray-100">
      <CardHeader>
        <CardTitle>Shipping</CardTitle>
      </CardHeader>
      <CardContent>
        {shippingAddress ? (
          <div>
            <p>{shippingAddress.address}</p>
            <p>
              {shippingAddress.city}, {shippingAddress.state}
            </p>
            <p>{shippingAddress.zip}</p>
          </div>
        ) : (
          <p>No shipping address found. Please update your address.</p>
        )}
      </CardContent>
      <CardFooter>
        {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
        <button
          className="text-blue-500 underline"
          onClick={() => setShowModal(true)}
        >
          {shippingAddress ? "Update Address" : "Add Address"}
        </button>
      </CardFooter>
      {showModal && (
        <ShippingAddress
          rAddress={walletAddress}
          onSave={handleSaveAddress} // Save the address and close the modal
          onClose={handleCloseModal} // Close the modal without saving
        />
      )}
    </Card>
  );
}