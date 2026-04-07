import "./globals.css";

export const metadata = {
  title: "GSU Chatbot",
  description: "AI Assistant for GSU Faculty",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}