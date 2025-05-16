"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/app/firebase"
import { getUserProfile } from "@/services/apiService"

export default function ProfileRedirectPage() {
  const router = useRouter()
  
  useEffect(() => {
    const redirectToRoleBasedProfile = async () => {
      const currentUser = auth.currentUser
      
      if (!currentUser || !currentUser.email) {
        // If user is not logged in, redirect to login
        router.push("/auth/login")
        return
      }
      
      try {
        // Fetch user profile to determine role
        const userProfile = await getUserProfile(currentUser.email)
        
        if (userProfile.role === "charity") {
          router.push("/profile/charity")
        } else if (userProfile.role === "donor") {
          router.push("/profile/donor")
        } else {
          // If role is not recognized, default to login
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Error fetching user profile:", error)
        router.push("/auth/login")
      }
    }
    
    redirectToRoleBasedProfile()
  }, [router])
  
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-teal-700">Redirecting to your profile...</p>
      </div>
    </div>
  )
} 