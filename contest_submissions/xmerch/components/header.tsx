"use client";

import type React from "react";
import { useState, useRef, useEffect, useCallback } from "react";
import { CodeXml, MenuIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "@nextui-org/react";
import { motion, AnimatePresence } from "framer-motion";
import XummIntegration from "../components/xumm/Xumm";
import NetworkSelector, { useNetworkManager } from "./NetworkManager"; // Updated to use NetworkManager

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const { network, updateNetwork, allowedNetworks } = useNetworkManager(); // Access NetworkManager

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        closeMenu();
      }
    };

    const handleScroll = () => {
      closeMenu();
    };

    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScroll);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [closeMenu]);

  const handleNetworkChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedNetwork = event.target.value as "xrpl" | "xahau";

    try {
      console.log(`[Header] Switching network to: ${selectedNetwork}`);
      await updateNetwork(selectedNetwork);
    } catch (error) {
      console.error("[Header] Error switching network:", error);
    }
  };

  return (
    <header className="top-0 z-50  text-white shadow-md">
      <div className="flex items-center justify-between p-4 max-w-7xl mx-auto">
        {/* Logo */}
        <Link
          className="flex items-center gap-2 font-semibold text-lg"
          prefetch={true}
          href="/"
        >
          <CodeXml className="h-6 w-6" />
          <span className="hidden sm:block">xMERCH</span>
          {/* Desktop Network Selector */}
          <NetworkSelector className="ml-3 hidden sm:block" />
        </Link>

        {/* Centered Connect Button */}
        <nav className="flex items-center gap-4 mr-10">
          <XummIntegration />
        </nav>

        {/* Right Navigation Links */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/cart" className="hover:text-gray-300">
            CART
          </Link>
          <Link href="/orders" className="hover:text-gray-300">
            ORDERS
          </Link>
        </div>

        {/* Mobile Hamburger Icon */}
        <div className="md:hidden">
          <Button
            isIconOnly
            variant="ghost"
            aria-label="Menu"
            onPress={toggleMenu}
            ref={buttonRef}
          >
            <MenuIcon size={24} />
          </Button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-black text-white shadow-md md:hidden overflow-hidden"
          >
            <div className="flex flex-col gap-4 p-4">
              {/* Mobile Network Selector */}
              <NetworkSelector />

              <Link
                href="/"
                className="hover:text-gray-100"
                onClick={closeMenu}
              >
                HOME
              </Link>
              <Link
                href="/cart"
                className="hover:text-gray-300"
                onClick={closeMenu}
              >
                CART
              </Link>
              <Link
                href="/orders"
                className="hover:text-gray-300"
                onClick={closeMenu}
              >
                ORDERS
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
