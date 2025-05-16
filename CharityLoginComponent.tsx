import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  loginWithEmailAndPassword, 
  resetPassword 
} from "@/services/authService"
import { getCharityByEmail } from "@/services/apiService"
import { useRouter } from "next/navigation"

interface FirebaseError extends Error {
  code: string;
}

export function CharityLoginComponent() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [resetSent, setResetSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required")
      setIsLoading(false)
      return
    }

    try {
      await loginWithEmailAndPassword(email, password)
      
      try {
        // Fetch charity data directly from charity collection
        const charityData = await getCharityByEmail(email)
        
        // Redirect to charity dashboard with charity ID
        router.push(`/dashboard/charity/${charityData._id}`)
      } catch (profileError) {
        console.error("Error fetching charity profile:", profileError)
        // If charity profile fetch fails, redirect to generic dashboard
        router.push(`/dashboard/charity`)
      }
    } catch (error) {
      const firebaseError = error as FirebaseError;
      // Handle specific Firebase auth errors
      if (firebaseError.code === 'auth/user-not-found' || firebaseError.code === 'auth/wrong-password') {
        setError("Invalid email or password")
      } else if (firebaseError.code === 'auth/too-many-requests') {
        setError("Too many failed login attempts. Please try again later or reset your password")
      } else {
        setError("Failed to sign in. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (!email.trim()) {
      setError("Please enter your email address to reset your password")
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(email)
      setResetSent(true)
      setError("")
    } catch (error) {
      const firebaseError = error as FirebaseError;
      if (firebaseError.code === 'auth/user-not-found') {
        setError("No account found with this email address")
      } else {
        setError("Failed to send password reset email. Please try again.")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {error && (
        <Alert variant="destructive" className="border-red-500 text-red-500">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {resetSent && (
        <Alert className="border-green-500 text-green-500">
          <AlertDescription>Password reset email sent! Check your inbox.</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="charity-email">Email</Label>
          <Input
            id="charity-email"
            type="email"
            placeholder="organization@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="charity-password">Password</Label>
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-teal-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="charity-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </>
  )
}