"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useWallet } from "@/components/WalletContext";

interface CartItem {
  title: string;
  quantity: number;
  productId: string;
  totalPrice: number;
  selectedSize: string;
  selectedColor: string;
}

interface Fees {
  subtotal: number;
  totalUSD: number;
  handlingFee: number;
  shippingFee: number;
}

interface Order {
  tx_hash: string;
  created_at: string;
  dollars_spent: number; // Total XRP or XAH value
  status: string;
  fulfilment_status: string;
  items_ordered: { cart: CartItem[]; fees: Fees }[];
  network_id: number; // Added network_id field
}

export default function OrdersPage() {
  const { account, connectWallet } = useWallet();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wrap getCookie in useCallback to ensure it is stable across renders
  const getCookie = useCallback((name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(";").shift();
    return null;
  }, []);

  useEffect(() => {
    const walletAddress = getCookie("wallet_address");
    const xummToken = getCookie("xumm_token");

    if (!account && walletAddress && xummToken) {
      console.log("Restoring session from cookies...");
      connectWallet();
    } else if (!account && !walletAddress) {
      console.warn("No wallet address found in cookies.");
    }
  }, [account, connectWallet, getCookie]);

  useEffect(() => {
    if (!account) return;

    const fetchOrders = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/get-orders?wallet_address=${account}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch orders");
        }

        setOrders(data.orders || []);
      } catch (err) {
        if (err instanceof Error) {
          console.error("Error fetching orders:", err.message);
          setError(err.message);
        } else {
          console.error("Unknown error occurred:", err);
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [account]);

  if (!account) {
    return <h1 className="text-center mt-8">Connect Your Wallet</h1>;
  }

  if (loading) {
    return <p className="text-center mt-8">Loading orders...</p>;
  }

  if (error) {
    return <p className="text-center mt-8 text-red-500">{error}</p>;
  }

  if (orders.length === 0) {
    return <h1 className="text-center mt-8">No orders yet. Start shopping!</h1>;
  }

  return (
    <div className="container mx-auto p-4 mt-6">
      <h1 className="text-3xl font-bold mb-6">Recent Orders</h1>
      <div className="space-y-6">
        {orders.map((order) => {
          // Determine explorer URL and currency based on network_id
          const isXahau = order.network_id === 21337;
          const explorerUrl = isXahau
            ? `https://xahau.xrpl.org/#/transactions/${order.tx_hash}`
            : `https://xrpcharts.ripple.com/#/transactions/${order.tx_hash}`;
          const currency = isXahau ? "XAH" : "XRP";

          return (
            <div
              key={order.tx_hash}
              className="border square-lg p-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">
                  txHash #{order.tx_hash.slice(0, 4)}...{order.tx_hash.slice(-2)}
                </h2>
                <span
                  className={`inline-block px-3 py-1 sq-full text-sm font-small ${
                    order.status === "Confirmed"
                      ? "bg-green-400 text-black-600"
                      : "bg-gree-500 text-black-900"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              <p className="text-gray-600">
                Placed on: {new Date(order.created_at).toLocaleDateString()}
              </p>
              <p className="text-gray-600 mb-2">
                Total:{" "}
                <span className="font-medium">
                  {order.dollars_spent.toFixed(2)} {currency}
                </span>
              </p>
              <p className="text-gray-600 mb-2">
                Order Status:{" "}
                <span
                  className={`font-medium ${
                    order.fulfilment_status === "Awaiting Fulfillment"
                      ? "text-yellow-200"
                      : order.fulfilment_status === "In Progress"
                      ? "text-blue-600"
                      : order.fulfilment_status === "Shipped"
                      ? "text-green-600"
                      : "text-slate-300"
                  }`}
                >
                  {order.fulfilment_status}
                </span>
              </p>

              <p className="text-blue-600 mb-2">
                <a
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  🔎 explorer
                </a>
              </p>

              <div className="border-t pt-4 mt-4 space-y-2">
                {order.items_ordered[0]?.cart.map((item, index) => (
                  <div
                    key={`${item.productId}-${index}`}
                    className="flex justify-between text-sm text-gray-600"
                  >
                    <span>
                      ({item.quantity}) {item.title}{" "}
                      <span className="opacity-20">|</span> {item.selectedSize}{" "}
                      <span className="opacity-20">|</span> {item.selectedColor}
                    </span>
                    <span>
                      ${order.items_ordered[0]?.fees.totalUSD.toFixed(2)} USD
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
