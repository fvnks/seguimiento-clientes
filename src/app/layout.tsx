import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./custom-theme.scss";
import "./globals.css";
import NavigationBar from "@/components/NavigationBar";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Gestor de Clientes",
  description: "Aplicación para el seguimiento de clientes y ventas",
};

import Providers from './providers';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={inter.className}>
      <body>
        <Providers>
          <NavigationBar />
          <main className="py-4">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
