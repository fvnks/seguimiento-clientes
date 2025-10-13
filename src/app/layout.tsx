import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "./custom-theme.scss";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import NavigationBar from "@/components/NavigationBar";
import AnnouncementToast from "@/components/AnnouncementToast"; // Import the component

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
    <html lang="es" className={`${inter.className} h-100`}>
      <body className="d-flex flex-column h-100">
        <Providers>
          <AnnouncementToast /> {/* Add the component here */}
          <NavigationBar />
          <main className="py-4 flex-grow-1">
            {children}
          </main>
          <footer className="py-3 mt-auto text-center text-muted bg-light">
            <p className="mb-0">Hecho con <span className="heart">♥</span> por Rodrigo Droguett Stahr</p>
          </footer>
        </Providers>
      </body>
    </html>
  );
}