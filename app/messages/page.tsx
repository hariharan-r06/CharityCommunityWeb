"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { auth } from "@/app/firebase"
import { getUserProfile } from "@/services/apiService"

export default function MessagesRedirectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          // Get user profile to determine ID
          const userProfile = await getUserProfile(user.email || "");
          const id = userProfile.donorId || userProfile.charityId;
          
          // Redirect to the proper messages page with ID
          if (id) {
            router.replace(`/messages/${id}`);
          } else {
            // If we can't determine the ID, redirect to dashboard
            const role = userProfile.role || "donor";
            router.replace(`/dashboard/${role}`);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          router.replace("/");
        } finally {
          setLoading(false);
        }
      } else {
        // Not logged in, redirect to login
        router.replace("/auth/login");
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-teal-700">Redirecting to messages page...</p>
      </div>
    </div>
  );
}
