
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SilverMove",
  description: "AI-powered exercise tracking for older adults",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body>
        {children}
      </body>
    </html>
  );
}
