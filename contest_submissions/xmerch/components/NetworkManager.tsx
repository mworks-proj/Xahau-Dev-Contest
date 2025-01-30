"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import Image from "next/image";
import clsx from "clsx";

// Define the shape of the context
interface NetworkManagerType {
  network: "xrpl" | "xahau";
  updateNetwork: (newNetwork: "xrpl" | "xahau") => Promise<void>;
  allowedNetworks: string[];
  setAllowedNetworks: (networks: string[]) => void;
  getApiConfig: (network: "xrpl" | "xahau") => { apiKey: string; apiSecret: string } | null;
  getConfig: () => NetworkManagerConfig;
}

// Define the shape of the config
interface NetworkManagerConfig {
  defaultNetwork: "xrpl" | "xahau";
  allowedNetworks: string[];
  apiConfig: {
    xrpl: { apiKey: string; apiSecret: string };
    xahau: { apiKey: string; apiSecret: string };
  };
}

// Configuration object (can also be moved to an external file)
const networkManagerConfig: NetworkManagerConfig = {
  defaultNetwork: process.env.NEXT_PUBLIC_DEFAULT_NETWORK === "xahau" ? "xahau" : "xrpl", // Default network
  allowedNetworks: ["xrpl", "xahau"], // Networks allowed by the app
  apiConfig: {
    xrpl: {
      apiKey: process.env.NEXT_PUBLIC_XUMM_XRPL_API_KEY || "",
      apiSecret: process.env.XUMM_XRPL_API_SECRET || "",
    },
    xahau: {
      apiKey: process.env.NEXT_PUBLIC_XUMM_XAHAU_API_KEY || "",
      apiSecret: process.env.XUMM_XAHAU_API_SECRET || "",
    },
  },
};

// Create the context
const NetworkManagerContext = createContext<NetworkManagerType | undefined>(undefined);

export const NetworkManagerProvider = ({ children }: { children: ReactNode }) => {
  const [network, setNetwork] = useState<"xrpl" | "xahau">(networkManagerConfig.defaultNetwork); // Default network
  const [allowedNetworks, setAllowedNetworks] = useState<string[]>(networkManagerConfig.allowedNetworks);

  // Function to update the current network
  const updateNetwork = useCallback(async (newNetwork: "xrpl" | "xahau") => {
    console.log(`[NetworkManager] Attempting to update network to: ${newNetwork}`);
  
    // Prevent selection of XRPL
    if (newNetwork !== "xahau") {
      console.warn("[NetworkManager] Only Xahau network is allowed.");
      return;
    }
  
    setNetwork(newNetwork);
  
    try {
      // Notify the server of the network update
      const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/set-wallet`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ network: newNetwork }),
      });
  
      const data = await response.json();
  
      if (!data.success) {
        console.error("[NetworkManager] Failed to update network on the server:", data.error);
      } else {
        console.log(`[NetworkManager] Network updated successfully to: ${newNetwork}`);
      }
    } catch (error) {
      console.error("[NetworkManager] Error updating network:", error);
    }
  }, []);
  

  // Function to fetch the API configuration for the current network
  const getApiConfig = useCallback((network: "xrpl" | "xahau") => {
    console.log(`[NetworkManager] Fetching API config for network: ${network}`);
    return networkManagerConfig.apiConfig[network] || null;
  }, []);

  // Function to fetch the entire config (can be used for debugging or UI display)
  const getConfig = useCallback(() => networkManagerConfig, []);

  return (
    <NetworkManagerContext.Provider
      value={{
        network,
        updateNetwork,
        allowedNetworks,
        setAllowedNetworks,
        getApiConfig,
        getConfig,
      }}
    >
      {children}
    </NetworkManagerContext.Provider>
  );
};

// Export getApiConfig for standalone use
export const getApiConfig = (network: "xrpl" | "xahau") => {
  console.log(`[NetworkManager] Fetching API config for network: ${network}`);
  return networkManagerConfig.apiConfig[network] || null;
};

// Hook to access the context
export const useNetworkManager = (): NetworkManagerType => {
  const context = useContext(NetworkManagerContext);
  if (!context) {
    throw new Error("useNetworkManager must be used within a NetworkManagerProvider");
  }
  return context;
};

// Network Selector Component
const NetworkSelector = ({ className }: { className?: string }) => {
  const { network, updateNetwork } = useNetworkManager();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const toggleDropdown = useCallback(() => {
    setIsDropdownOpen((prev) => !prev);
  }, []);

  const handleNetworkChange = useCallback(
    async (selectedNetwork: "xahau") => {
      try {
        await updateNetwork(selectedNetwork);
        setIsDropdownOpen(false);
      } catch (error) {
        console.error("[NetworkSelector] Error changing network:", error);
      }
    },
    [updateNetwork]
  );

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        aria-expanded={isDropdownOpen}
        aria-label={`Select network, current network is ${network}`}
        className={clsx(
          "network-selector__button flex items-center justify-between w-32 px-4 py-2 text-white font-bold rounded-lg shadow-md",
          {
            "bg-yellow-500": network === "xahau",
            "bg-purple-600": network === "xrpl",
          }
        )}
      >
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 flex items-center justify-center rounded-full">
            <Image
              src="https://raw.githubusercontent.com/Xahau/Graphics/main/xahau-icon-yellow.svg"
              alt="Xahau Ledger Icon"
              width={16}
              height={16}
            />
          </div>
          {network.toUpperCase()}
        </div>
        {/*<span className="text-lg">$</span>*/}
      </button>

      {isDropdownOpen && (
        <div className="absolute mt-2 w-32 bg-black text-white rounded-lg shadow-lg z-50">
          {/* Only Xahau option */}
          {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          <div
            className="flex items-center gap-2 px-4 py-2 cursor-pointer hover:bg-yellow-400"
            onClick={() => handleNetworkChange("xahau")}
          >
            <div className="h-6 w-6 flex items-center justify-center rounded-full bg-yellow-400">
              <Image
                src="https://raw.githubusercontent.com/Xahau/Graphics/main/xahau-icon-yellow.svg"
                alt="Xahau Ledger Icon"
                width={16}
                height={16}
              />
            </div>
            {/*<span>Xahau</span>*/}
          </div>
        </div>
      )}
    </div>
  );
};


export default NetworkSelector;
