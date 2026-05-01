import "./globals.css";

export const metadata = {
  title: "Real-time Todo App",
  description: "A modern real-time todo application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
