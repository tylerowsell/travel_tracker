import "./globals.css";
import { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="max-w-5xl mx-auto p-4">
          <header className="mb-6 flex items-center justify-between">
            <h1 className="text-2xl font-semibold">Travel Tracker</h1>
            <a className="btn" href="/new-trip">New Trip</a>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
