import "./globals.css";

export const metadata = {
  title: "Deployio — Next.js Dashboard",
  description: "Example Next.js application deployed via Deployio platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
