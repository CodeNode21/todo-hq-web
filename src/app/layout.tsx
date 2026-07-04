import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "to-do HQ",
  description: "Second-monitor command board for weekly freelance priorities."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const liveClockScript = `
(() => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit"
  });

  function updateClocks() {
    const time = formatter.format(new Date());
    document.querySelectorAll("[data-live-clock]").forEach((clock) => {
      clock.textContent = time;
    });
  }

  updateClocks();
  window.setInterval(updateClocks, 1000);
})();
`;

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {children}
        <script dangerouslySetInnerHTML={{ __html: liveClockScript }} />
      </body>
    </html>
  );
}
