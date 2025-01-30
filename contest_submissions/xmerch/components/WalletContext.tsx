"use client";

import React, { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { Xumm } from "xumm";
import { toast } from "sonner";
import { useNetworkManager } from "./NetworkManager";

interface WalletContextType {
  account: string | null;
  abbreviatedAddress: string | null;
  isLoggedIn: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const { network, getApiConfig } = useNetworkManager();
  const [xummInstance, setXummInstance] = useState<Xumm | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [abbreviatedAddress, setAbbreviatedAddress] = useState<string | null>(null);

  // Reinitialize XUMM SDK whenever the network changes
  useEffect(() => {
    const apiConfig = getApiConfig(network);
    if (apiConfig) {
      const newXumm = new Xumm(apiConfig.apiKey, apiConfig.apiSecret);
      setXummInstance(newXumm);
      console.log(`[WalletProvider] XUMM SDK initialized for network: ${network}`);
    } else {
      console.error(`[WalletProvider] Missing API config for network: ${network}`);
    }
  }, [network, getApiConfig]);

  const connectWallet = async () => {
    if (!xummInstance) {
      toast.error("Failed to initialize XUMM. Please try again.");
      return;
    }

    try {
      await xummInstance.authorize();

      const userAccount = await xummInstance.user.account;
      const token = await xummInstance.user.token;

      if (userAccount && token) {
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/set-wallet`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ walletAddress: userAccount, token, network }),
        });

        setAccount(userAccount);
        setAbbreviatedAddress(
          `${userAccount.substring(0, 6)}...${userAccount.substring(userAccount.length - 4)}`
        );

        toast.success("Wallet connected successfully!");
      }
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet.");
    }
  };

  const disconnectWallet = async () => {
    if (xummInstance) {
      xummInstance.logout();
    }
    setAccount(null);
    setAbbreviatedAddress(null);

    await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/clear-wallet`, { method: "POST" });
  };

  useEffect(() => {
    const restoreSession = async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/set-wallet`);
      const data = await response.json();

      if (data.success && data.walletAddress) {
        setAccount(data.walletAddress);
        setAbbreviatedAddress(
          `${data.walletAddress.substring(0, 6)}...${data.walletAddress.substring(data.walletAddress.length - 4)}`
        );
      }
    };

    restoreSession();
  }, []);

  return (
    <WalletContext.Provider
      value={{
        account,
        abbreviatedAddress,
        isLoggedIn: !!account,
        connectWallet,
        disconnectWallet,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};
