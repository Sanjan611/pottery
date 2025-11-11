import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Pottery - Project Visualization',
  description: 'Interactive visualization of Pottery project graphs',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
