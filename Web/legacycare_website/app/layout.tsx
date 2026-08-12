import { Outfit } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/components/notifications/NotificationContext';
import ToastContainer from '@/components/notifications/ToastContainer';

const outfit = Outfit({
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
          <NotificationProvider>
            <ToastContainer />
            {children}
          </NotificationProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
