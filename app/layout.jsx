import { Bricolage_Grotesque } from "next/font/google";
import "./globals.css";

const font = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font" });

export const metadata = {
  title: "Calendrier des copains",
  description: "Indique tes disponibilités et trouve le meilleur jour pour se voir."
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body className={font.variable}>{children}</body>
    </html>
  );
}
