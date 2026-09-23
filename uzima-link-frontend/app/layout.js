import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import AssistantWidget from "@/components/AssistantWidget";

export const metadata = {
  title: "Uzima Link",
  description: "AI-Powered health records that follow you, in any language.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="antialiased min-h-screen">
        <AuthProvider>{children}</AuthProvider>
        <AssistantWidget />
      </body>
    </html>
  );
}