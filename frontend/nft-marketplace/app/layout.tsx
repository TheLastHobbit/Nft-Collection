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
  title: "NFT藏品交易平台",
  description: "发现、收集与交易稀有数字藏品的专业NFT交易平台",
    generator: 'v0.dev'
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