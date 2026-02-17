import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "ToolIndex — WebMCP Registry",
  description: "Discover and verify WebMCP tool manifests",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <nav>
          <Link href="/" className="logo">
            ToolIndex
          </Link>
          <Link href="/">Search</Link>
          <Link href="/submit">Submit</Link>
        </nav>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
