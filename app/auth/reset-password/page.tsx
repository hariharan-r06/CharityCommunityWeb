"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Heart, ArrowLeft, CheckCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState("")
  const [passwordStrength, setPasswordStrength] = useState(0)

  // Check if token is valid
  const isValidToken = token && token.length > 10

  // Calculate password strength
  const calculatePasswordStrength = (password: string) => {
    let strength = 0

    if (password.length >= 8) strength += 25
    if (/[A-Z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 25
    if (/[^A-Za-z0-9]/.test(password)) strength += 25

    setPasswordStrength(strength)
  }

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value
    setPassword(newPassword)
    calculatePasswordStrength(newPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Validate password
    if (password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (passwordStrength < 75) {
      setError("Please create a stronger password")
      return
    }

    setIsLoading(true)

    // Simulate API call to reset password
    try {
      // In a real app, this would be an API call to reset the password
      setTimeout(() => {
        setIsLoading(false)
        setIsSubmitted(true)
      }, 1500)
    } catch (err) {
      setIsLoading(false)
      setError("An error occurred. Please try again later.")
    }
  }

  const getStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getStrengthText = () => {
    if (passwordStrength < 25) return "Weak"
    if (passwordStrength < 50) return "Fair"
    if (passwordStrength < 75) return "Good"
    return "Strong"
  }

  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8">
      <div className="flex items-center gap-2 font-bold text-xl text-teal-600 mb-8">
        <Heart className="h-6 w-6 fill-teal-600" />
        <span>CharityConnect</span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-teal-700">Create New Password</CardTitle>
          <CardDescription>Enter a new password for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {!isValidToken ? (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-amber-100 p-3 mb-4">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="text-lg font-medium text-amber-700">Invalid or Expired Link</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <Button asChild className="mt-2 bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/forgot-password">Request New Link</Link>
              </Button>
            </div>
          ) : !isSubmitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">New Password</Label>
                <Input id="password" type="password" value={password} onChange={handlePasswordChange} required />
                {password && (
                  <div className="space-y-1">
                    <div className="flex justify-between items-center">
                      <Progress value={passwordStrength} className={`h-2 ${getStrengthColor()}`} />
                      <span className="text-xs ml-2">{getStrengthText()}</span>
                    </div>
                    <ul className="text-xs space-y-1 text-muted-foreground">
                      <li className={password.length >= 8 ? "text-green-600" : ""}>• At least 8 characters</li>
                      <li className={/[A-Z]/.test(password) ? "text-green-600" : ""}>
                        • At least one uppercase letter
                      </li>
                      <li className={/[0-9]/.test(password) ? "text-green-600" : ""}>• At least one number</li>
                      <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-600" : ""}>
                        • At least one special character
                      </li>
                    </ul>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                    Resetting Password...
                  </span>
                ) : (
                  "Reset Password"
                )}
              </Button>
            </form>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-green-100 p-3 mb-4">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-green-700">Password Reset Successful</h3>
              <p className="text-sm text-muted-foreground mt-2 mb-4">
                Your password has been reset successfully. You can now log in with your new password.
              </p>
              <Button asChild className="mt-2 bg-teal-600 hover:bg-teal-700">
                <Link href="/auth/login">Go to Login</Link>
              </Button>
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
