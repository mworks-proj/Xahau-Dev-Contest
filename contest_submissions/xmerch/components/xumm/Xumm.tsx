'use client';

import type React from 'react';
import { useEffect } from 'react';
import { Button } from '@nextui-org/react';
import { useWallet } from '@/components/WalletContext';
//import ShippingAddress from '@/components/ShippingAddress';
import { LogOut } from 'lucide-react';
//import Modal from '@/components/modal';

interface XummIntegrationProps {
  onAccountChange?: (account: string | null, abbreviated: string | null) => void;
}

const XummIntegration: React.FC<XummIntegrationProps> = ({ onAccountChange }) => {
  const {
    account,
    abbreviatedAddress,
    connectWallet,
    disconnectWallet,
  } = useWallet();

  // Notify parent component of account changes
  useEffect(() => {
    if (onAccountChange) {
      onAccountChange(account, abbreviatedAddress);
    }
  }, [account, abbreviatedAddress, onAccountChange]);

  return (
    <div>
      {account ? (
        <div className="flex items-center gap-2">
          {abbreviatedAddress && (
            <span className="text-green-500 p-2 m-2">{abbreviatedAddress}</span>
          )}
          {/* Replace SIGN OUT text with LogOut icon */}
          <Button
            isIconOnly
            variant="ghost"
            color="danger"
            aria-label="Signout"
            onPress={disconnectWallet}
          >
            <LogOut size={20} />
          </Button>
        </div>
      ) : (
        <Button color="primary" variant="ghost" onPress={connectWallet}  >
          CONNECT
        </Button>
      )}
    </div>
  );
};

export default XummIntegration;
