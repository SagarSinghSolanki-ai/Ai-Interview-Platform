import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

import Providers from "@/components/providers"
import AuthProvider from "@/components/auth-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "AI Interview Platform",
  description: "Evaluate your coding and communication skills with our Gemini AI-powered interview platform.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.className} antialiased min-h-screen bg-background text-foreground`} suppressHydrationWarning>
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
