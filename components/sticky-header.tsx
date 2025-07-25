"use client"

import Link from "next/link"
import { Cpu, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useState, useEffect } from "react"

export function StickyHeader() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const navItems = [
    { href: "#features", label: "Features" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#pricing", label: "Pricing" },
    { href: "#faq", label: "FAQ" },
  ]

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 
                  ${isScrolled ? "bg-slate-950/80 backdrop-blur-md shadow-lg" : "bg-transparent"}`}
    >
      <div className="container mx-auto flex h-20 items-center justify-between px-4 md:px-6">
        <Link href="#" className="flex items-center gap-2" prefetch={false}>
          <Cpu className="h-8 w-8 text-electric-blue" />
          <span className="text-2xl font-bold text-slate-100">Zenith.</span>
          <span className="text-2xl font-bold text-electric-blue">engineer</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-slate-300 hover:text-electric-blue transition-colors"
              prefetch={false}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-4 md:flex">
          <Button
            variant="outline"
            className="border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-slate-900 bg-transparent"
          >
            See Demo
          </Button>
          <Button className="bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold shadow-md hover:shadow-lg transition-all">
            Start Free Trial
          </Button>
        </div>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden text-slate-100 hover:bg-slate-800">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle navigation menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="bg-slate-950 border-slate-800 text-slate-100">
            <div className="grid gap-4 p-6">
              <Link href="#" className="flex items-center gap-2 mb-6" prefetch={false}>
                <Cpu className="h-7 w-7 text-electric-blue" />
                <span className="text-xl font-bold">Zenith.engineer</span>
              </Link>
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="text-base font-medium hover:text-electric-blue transition-colors py-2"
                  prefetch={false}
                >
                  {item.label}
                </Link>
              ))}
              <Button
                variant="outline"
                className="w-full mt-4 border-electric-blue text-electric-blue hover:bg-electric-blue hover:text-slate-900 bg-transparent"
              >
                See Demo
              </Button>
              <Button className="w-full bg-electric-blue hover:bg-cyan-500 text-slate-900 font-semibold">
                Start Free Trial
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
