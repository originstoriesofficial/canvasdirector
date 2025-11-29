import "./globals.css";
import LemonLoader from "../components/LemonLoader";

export const metadata = {
  title: "VPM Studio – Canvas Director",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body>
        {children}
        {/* ✅ client-side script + listener */}
        <LemonLoader />
      </body>
    </html>
  );
}
