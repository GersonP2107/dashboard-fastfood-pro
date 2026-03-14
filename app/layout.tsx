import type { Metadata } from "next";
import "./globals.css";
import '@fontsource-variable/plus-jakarta-sans';
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Dashboard | FoodFast Pro",
  description: "Sistema de gestión para restaurantes y menús digitales",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  }
};

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MotionProvider } from "@/components/providers/motion-provider";

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
          <MotionProvider>
            <TooltipProvider delayDuration={0}>
              {children}
              <Toaster richColors position="top-right" />
            </TooltipProvider>
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
