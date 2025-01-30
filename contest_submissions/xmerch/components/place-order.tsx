'use client';

import { useWallet } from '@/components/WalletContext';
import { placeOrder } from '@/lib/payload';
import { Button } from './ui/button';
import { toast } from 'sonner';

export default function PlaceOrderButton() {
  const { isLoggedIn, connectWallet } = useWallet();

  const handlePlaceOrder = async () => {
    if (!isLoggedIn) {
      toast.warning("Please connect your wallet to place an order.");
      await connectWallet();
      return;
    }

    try {
      toast.info("Preparing your order...");

      // Call placeOrder from server-side actions
      const { tx_hash, nextUrl } = await placeOrder();

      if (!nextUrl) {
        throw new Error("Missing redirection URL from XUMM response.");
      }

      // Check if the user is on a mobile device
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile) {
        // Redirect directly for mobile
        window.location.href = nextUrl;
      } else {
        // Open in new tab for desktop
        window.open(nextUrl, "_blank");
      }

      toast.success("Redirecting to XUMM Wallet...");
    } catch (error) {
      console.error("Error placing order:", error);
      toast.error("Failed to place order. Please try again.");
    }
  };

  return (
    <Button onClick={handlePlaceOrder} className="w-full">
      {isLoggedIn ? "Place Order" : "Connect Wallet"}
    </Button>
  );
}
