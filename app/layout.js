import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './globals.css';

export const metadata = {
  title: 'BookNook',
  description: 'Streamline your book club experience',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
