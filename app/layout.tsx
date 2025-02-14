"use client";

import { AnimatePresence, motion } from "framer-motion";
import "./globals.css";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pathname = usePathname();

  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"
        />
      </head>
      <body style={{ overflowX: "hidden" }}>
        <div style={{ position: "relative", minHeight: "100vh" }}>
              {children}
        </div>
      </body>
    </html>
  );
}
