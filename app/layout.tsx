import type { Metadata } from "next";
import "./globals.css";
import '@fontsource-variable/plus-jakarta-sans';
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Dashboard | FoodFast Pro",
  description: "Sistema de gestión para restaurantes y menús digitales",
};

import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className="antialiased"
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
