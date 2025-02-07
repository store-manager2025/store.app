import "./globals.css";
import { ReactNode } from "react";
import Header from "../components/Header"; 

export const metadata = {
  title: "My POS App",
  description: "POS layout example in Next.js",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-800">
        {/* 헤더 영역 */}
        <Header />

        {/* 메인 컨테이너 (좌: Drawer, 우: 메인) */}
        <div className="flex"> 
          <main className="flex-1 p-4">{children}</main>
        </div>
      </body>
    </html>
  );
}
