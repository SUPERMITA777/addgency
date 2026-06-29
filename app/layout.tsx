import type { Metadata } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-inter",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "500", "700"],
  variable: "--font-cormorant",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jetbrains",
});

export const metadata: Metadata = {
  title: "ADDGENCY | Agencia de Diseño & Marketing Premium",
  description: "Plataforma premium de diseño y marketing. Gestión de clientes, revisión de trabajos interactivos con marcas de agua seguras, tickets de soporte y mensajería en tiempo real.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable} ${jetbrains.variable}`}>
      <body className="antialiased bg-bg text-text">
        {children}
      </body>
    </html>
  );
}
