"use client"

//forgot password : app/auth/forgot-password/page.tsx

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { resetPassword } from "@/services/authService"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate email
    if (!email.trim()) {
      setError("Please enter your email address")
      return
    }

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    try {
      // Use Firebase resetPassword function
      await resetPassword(email)
      setIsLoading(false)
      setIsSubmitted(true)
    } catch (error) {
      setIsLoading(false)
      
      if (error.code === 'auth/user-not-found') {
        setError("No account found with this email address")
      } else if (error.code === 'auth/invalid-email') {
        setError("Please enter a valid email address")
      } else {
        setError("An error occurred. Please try again later.")
      }
    }
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8">
      <div className="flex items-center gap-2 font-bold text-xl text-teal-600 mb-8">
        <Heart className="h-6 w-6 fill-teal-600" />
        <span>CharityConnect</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-700">Reset Password</CardTitle>
          <CardDescription>Enter your email address and we'll send you a link to reset your password.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
                {isLoading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Sending Reset Link...
                  </span>
                ) : (
                  "Send Reset Link"
                )}
              </Button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-700">Check Your Email</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the
                instructions to reset your password.
              </p>
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Mail className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                If you don't see the email, please check your spam folder or{" "}
                <button onClick={handleSubmit} className="text-teal-600 hover:underline">
                  click here to resend
                </button>
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button variant="ghost" asChild className="w-full">
            <Link href="/auth/login" className="flex items-center justify-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}