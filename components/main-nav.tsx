"use client"


// components/main-nav.tsx
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Heart, Search, Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

export function MainNav({ role }: { role?: "donor" | "charity" }) {
  const pathname = usePathname()
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2 font-bold text-xl text-teal-600">
          <Link href={role ? `/dashboard/${role}` : "/"} className="flex items-center gap-2">
            <Heart className="h-6 w-6 fill-teal-600" />
            <span>CharityConnect</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-4 flex-1 justify-end">
          {role && (
            <>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input type="search" placeholder="Search..." className="w-full bg-background pl-8 pr-4" />
              </div>
              <nav className="flex items-center gap-4">
                <Link
                  href={`/dashboard/${role}`}
                  className={`text-sm font-medium ${
                    pathname === `/dashboard/${role}` ? "text-teal-600" : "text-gray-500 hover:text-teal-600"
                  }`}
                >
                  Dashboard
                </Link>
                <Link
                  href="/feed"
                  className={`text-sm font-medium ${
                    pathname === "/feed" ? "text-teal-600" : "text-gray-500 hover:text-teal-600"
                  }`}
                >
                  Feed
                </Link>
                <Link
                  href="/messages"
                  className={`text-sm font-medium ${
                    pathname.startsWith("/messages") ? "text-teal-600" : "text-gray-500 hover:text-teal-600"
                  }`}
                >
                  Messages
                </Link>
                {role === "donor" && (
                  <Link
                    href="/discover"
                    className={`text-sm font-medium ${
                      pathname === "/discover" ? "text-teal-600" : "text-gray-500 hover:text-teal-600"
                    }`}
                  >
                    Discover
                  </Link>
                )}
              </nav>
            </>
          )}
          {!role && (
            <div className="flex items-center gap-4">
              <Link href="/auth/login" className="text-sm font-medium hover:underline">
                Log in
              </Link>
              <Button asChild>
                <Link href="/auth/register">Sign up</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <Button variant="ghost" size="icon" onClick={toggleMenu} aria-label="Toggle Menu">
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4 space-y-4">
            {role && (
              <>
                <div className="relative w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input type="search" placeholder="Search..." className="w-full bg-background pl-8 pr-4" />
                </div>
                <nav className="flex flex-col space-y-2">
                  <Link
                    href={`/dashboard/${role}`}
                    className={`text-sm font-medium p-2 rounded-md ${
                      pathname === `/dashboard/${role}`
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/feed"
                    className={`text-sm font-medium p-2 rounded-md ${
                      pathname === "/feed"
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Feed
                  </Link>
                  <Link
                    href="/messages"
                    className={`text-sm font-medium p-2 rounded-md ${
                      pathname.startsWith("/messages")
                        ? "bg-teal-50 text-teal-600"
                        : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Messages
                  </Link>
                  {role === "donor" && (
                    <Link
                      href="/discover"
                      className={`text-sm font-medium p-2 rounded-md ${
                        pathname === "/discover"
                          ? "bg-teal-50 text-teal-600"
                          : "text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Discover
                    </Link>
                  )}
                </nav>
              </>
            )}
            {!role && (
              <div className="flex flex-col space-y-2">
                <Link
                  href="/auth/login"
                  className="text-sm font-medium p-2 rounded-md text-gray-500 hover:bg-teal-50 hover:text-teal-600"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Log in
                </Link>
                <Button asChild className="w-full" onClick={() => setIsMenuOpen(false)}>
                  <Link href="/auth/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
