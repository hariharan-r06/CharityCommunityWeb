"use client"

import { ReactNode, useEffect } from "react"
import { useAuth0 } from "@auth0/auth0-react"
import { useRouter } from "next/navigation"

interface ProtectedRouteProps {
  children: ReactNode
  requiredRole?: string | null
}

export function ProtectedRoute({ children, requiredRole = null }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, loginWithRedirect } = useAuth0()
  const router = useRouter()
  
  useEffect(() => {
    const checkAuth = async () => {
      if (!isLoading && !isAuthenticated) {
        await loginWithRedirect({
          appState: { returnTo: window.location.pathname }
        })
        return
      }
      
      // Check for role if required
      if (!isLoading && isAuthenticated && requiredRole && user) {
        const userRoles = user["https://charityconnect.app/roles"] as string[] || []
        if (!userRoles.includes(requiredRole)) {
          router.push("/unauthorized")
        }
      }
    }
    
    checkAuth()
  }, [isLoading, isAuthenticated, requiredRole, user, loginWithRedirect, router])
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading...</p>
        </div>
      </div>
    )
  }
  
  return isAuthenticated ? <>{children}</> : null
}