import "../styles/globals.css";
import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { Header } from "../@/components/ui/header";
import Footer from "../@/components/ui/footer";
import { Toaster } from "../@/components/ui/toaster";
import UserAccountProvider from "../@/components/UserAccountProvider";

export const metadata: Metadata = {
  title: "Blackjack PoC by zk-poker",
  description: "built during Istanbul Hackerhouse 2023",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <html lang="en" className="dark">
      <body className={GeistSans.className}>
        <Toaster />
        <UserAccountProvider>
          <div className="flex h-screen w-screen overflow-x-hidden dark flex-col px-32 items-center py-4 bg-black text-gray-200">
            <Header />
            <hr className="border border-gray-800/40 w-screen my-4" />
            <main className="w-full h-full">{children}</main>
            <hr className="border border-gray-800/40 w-screen my-4" />
            <Footer />
          </div>{" "}
        </UserAccountProvider>
      </body>
    </html>
  );
}
