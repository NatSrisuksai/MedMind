import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medmind Data - ระบบจัดการยา",
  description: "ระบบจัดการข้อมูลยาและการแจ้งเตือนผู้ป่วย",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js" 
          strategy="beforeInteractive" 
        />
        <Script 
          src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js" 
          strategy="beforeInteractive" 
        />
        <Script 
          src="https://static.line-scdn.net/liff/edge/2/sdk.js" 
          strategy="beforeInteractive" 
        />
      </head>
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}