import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import Header from "@/components/header"
import Footer from "@/components/footer"
import { useWallet } from '@/components/header'
import { Toaster } from 'sonner'
import { WalletProvider } from '@/components/wallet-provider'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "二手商品交易平台",
  description: "专业二手商品NFT交易平台",
    generator: 'CUIT'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <WalletProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </WalletProvider>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}


import './globals.css'