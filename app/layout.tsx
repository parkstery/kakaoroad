
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kakao Map Route Explorer",
  description: "Advanced route planning with Kakao Maps",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Use the environment variable for the JS Key
  const KAKAO_SDK_URL = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_JS_KEY}&libraries=services&autoload=false`;

  return (
    <html lang="ko">
      <head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body>
        {/* Load Kakao Maps SDK globally with afterInteractive strategy to ensure DOM is ready */}
        <Script 
          src={KAKAO_SDK_URL} 
          strategy="afterInteractive"
        />
        {children}
      </body>
    </html>
  );
}
