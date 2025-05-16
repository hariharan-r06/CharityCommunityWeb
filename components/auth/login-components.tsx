"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Mail } from "lucide-react"
import { 
  loginWithEmailAndPassword, 
  signInWithGoogle, 
  signInWithGithub, 
  resetPassword 
} from "@/services/authService"
import { 
  getDonorByEmail,
  getCharityByEmail 
} from "@/services/apiService"
import { useRouter } from "next/navigation"

interface FirebaseError extends Error {
  code: string;
}

export function DonorLoginComponent() {
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
        // Fetch donor data directly from donor collection
        const donorData = await getDonorByEmail(email)
        
        // Redirect to donor dashboard with donor ID
        router.push(`/dashboard/donor/${donorData._id}`)
      } catch (profileError) {
        console.error("Error fetching donor profile:", profileError)
        // If donor profile fetch fails, redirect to generic dashboard 
        router.push(`/dashboard/donor`)
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

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const userCredential = await signInWithGoogle()
      const user = userCredential.user
      
      try {
        // Fetch donor data directly from donor collection 
        const donorData = await getDonorByEmail(user.email || "")
        
        // Redirect to donor dashboard with donor ID
        router.push(`/dashboard/donor/${donorData._id}`)
      } catch (profileError) {
        console.error("Error fetching donor profile:", profileError)
        // If donor profile fetch fails, redirect to generic dashboard
        router.push(`/dashboard/donor`)
      }
    } catch (error) {
      setError("Failed to sign in with Google. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setIsLoading(true)
    setError("")
    
    try {
      const userCredential = await signInWithGithub()
      const user = userCredential.user
      
      try {
        // Fetch donor data directly from donor collection
        const donorData = await getDonorByEmail(user.email || "")
        
        // Redirect to donor dashboard with donor ID
        router.push(`/dashboard/donor/${donorData._id}`)
      } catch (profileError) {
        console.error("Error fetching donor profile:", profileError)
        // If donor profile fetch fails, redirect to generic dashboard
        router.push(`/dashboard/donor`)
      }
    } catch (error) {
      setError("Failed to sign in with Github. Please try again.")
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={handleResetPassword}
              className="text-xs text-teal-600 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
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
      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="outline" className="w-full" onClick={handleGithubSignIn} disabled={isLoading}>
            <Github className="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
            <Mail className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </div>
    </>
  )
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