import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})
 
export const metadata: Metadata = {
  title: "Websocket Tic Tac Toe",
  description: "A simple tic tac toe game using websockets",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={fontSans.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
