"use client"

// app/auth/login/page.tsx
import type React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Heart } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DonorLoginComponent, CharityLoginComponent } from "@/components/auth/login-components"

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get("role") || "donor"

  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-teal-600" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <Heart className="mr-2 h-6 w-6 fill-white" />
          CharityConnect
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">"Alone we can do so little; together we can do so much."</p>
            <footer className="text-sm">Helen Keller</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-teal-700">Welcome back</h1>
            <p className="text-sm text-muted-foreground">Enter your credentials to sign in to your account</p>
          </div>
          
          <Tabs defaultValue={role} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="donor" onClick={() => router.push("/auth/login?role=donor")}>
                Donor
              </TabsTrigger>
              <TabsTrigger value="charity" onClick={() => router.push("/auth/login?role=charity")}>
                Charity
              </TabsTrigger>
            </TabsList>
            <TabsContent value="donor" className="mt-4">
              <DonorLoginComponent />
            </TabsContent>
            <TabsContent value="charity" className="mt-4">
              <CharityLoginComponent />
            </TabsContent>
          </Tabs>
          <p className="px-8 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href={`/auth/register?role=${role}`} className="underline underline-offset-4 hover:text-teal-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}