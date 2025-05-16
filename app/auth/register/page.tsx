"use client"

// app/auth/register/page.tsx

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Github, Mail, Building } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  registerWithEmailAndPassword, 
  signInWithGoogle, 
  signInWithGithub 
} from "@/services/authService"
import { createCharityProfile, createDonorProfile, createUserProfile } from "@/services/apiService"

interface FirebaseError extends Error {
  code: string;
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [address, setAddress] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required")
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters")
      setIsLoading(false)
      return
    }

    try {
      // Register the user with Firebase
      const userCredential = await registerWithEmailAndPassword(email, password, name)
      
      // Create profile in backend with donor's data including address
      const donorResponse = await createDonorProfile({
        name,
        email,
        phone,
        address
      })
      
      // Extract the donor ID from the response
      const donorId = donorResponse.data._id;

      // Create a user record
      try {
        await createUserProfile({
          name,
          email,
          phone,
          role: 'donor',
          address
        });
      } catch (profileError) {
        console.error("Error creating user profile:", profileError);
        // Continue even if there's an error with user profile creation
      }

      // Redirect to donor dashboard with ID
      router.push(`/dashboard/donor/${donorId}`)
    } catch (error) {
      const firebaseError = error as FirebaseError;
      // Handle specific Firebase auth errors
      if (firebaseError.code === 'auth/email-already-in-use') {
        setError("Email is already in use")
      } else if (firebaseError.code === 'auth/invalid-email') {
        setError("Invalid email format")
      } else {
        setError(firebaseError.message || "Failed to register. Please try again.")
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
      const user = userCredential.user;
      
      // Create donor profile if it doesn't exist
      try {
        const donorResponse = await createDonorProfile({
          name: user.displayName || "Google User",
          email: user.email || "",
          phone: user.phoneNumber || ""
        })
        
        const donorId = donorResponse.data._id;
        router.push(`/dashboard/donor/${donorId}`)
      } catch (profileError) {
        console.error("Error creating donor profile:", profileError);
        setError("Failed to create donor profile. Please try again.")
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
      const user = userCredential.user;
      
      // Create donor profile if it doesn't exist
      try {
        const donorResponse = await createDonorProfile({
          name: user.displayName || "Github User",
          email: user.email || "",
          phone: user.phoneNumber || ""
        })
        
        const donorId = donorResponse.data._id;
        router.push(`/dashboard/donor/${donorId}`)
      } catch (profileError) {
        console.error("Error creating donor profile:", profileError);
        setError("Failed to create donor profile. Please try again.")
      }
    } catch (error) {
      setError("Failed to sign in with Github. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleCharityRedirect = () => {
    router.push("/auth/charity-verification")
  }

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
            <p className="text-lg">"The best way to find yourself is to lose yourself in the service of others."</p>
            <footer className="text-sm">Mahatma Gandhi</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-2xl font-semibold tracking-tight text-teal-700">Create an account</h1>
            <p className="text-sm text-muted-foreground">Enter your information to create your account</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="border-red-500 text-red-500">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
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
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                type="text"
                placeholder="123 Main St, City, Country"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
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
            <Button type="submit" className="w-full bg-teal-600 hover:bg-teal-700" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
          </form>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="w-full" onClick={handleGithubSignIn} disabled={isLoading}>
              <Github className="mr-2 h-4 w-4" />
              Github
            </Button>
            <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
              <Mail className="mr-2 h-4 w-4" />
              Google
            </Button>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Are you a charity?</span>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            className="w-full border-teal-600 text-teal-600 hover:bg-teal-50" 
            onClick={handleCharityRedirect}
          >
            <Building className="mr-2 h-4 w-4" />
            Register as a Charity
          </Button>
          
          <p className="px-8 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/auth/login" className="underline underline-offset-4 hover:text-teal-600">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}