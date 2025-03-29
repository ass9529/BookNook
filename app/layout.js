"use client";

import Navbar from './components/Navbar';
import AppNavBar from './components/AppNavBar';
import Footer from './components/Footer';
import './globals.css';

// export const metadata = {
//   title: 'BookNook',
//   description: 'Streamline your book club experience',
// };

import { usePathname } from "next/navigation";

export default function RootLayout({ children }) {
  const pathname = usePathname(); // Get current route

  // Check if we're in the dashboard section
  

  return pathname === '/' ? (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  ) : (
    <html lang="en">
      <body>
        <AppNavBar/>
        <main>{children}</main>
      </body>
    </html>
  );
}