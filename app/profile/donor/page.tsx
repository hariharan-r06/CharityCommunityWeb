"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  User, 
  FilePlus, 
  MessageSquare, 
  LogOut, 
  Heart, 
  Pencil, 
  Save, 
  X, 
  Building2
} from "lucide-react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { auth } from "@/app/firebase"
import { getDonorByEmail, getUserProfile } from "@/services/apiService"
import { logout } from "@/services/authService"

export interface Donor {
  _id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  following: any[];
  donations: any[];
  messages?: any[];
  createdAt?: string;
  updatedAt?: string;
}

export default function DonorProfilePage() {
  const router = useRouter()
  const [donor, setDonor] = useState<Donor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    phone: "",
    address: ""
  })
  
  useEffect(() => {
    const fetchDonorData = async () => {
      setLoading(true)
      const currentUser = auth.currentUser
      
      if (!currentUser || !currentUser.email) {
        console.log("No authenticated user found, redirecting to login")
        router.push("/auth/login")
        return
      }
      
      try {
        console.log("Fetching donor with email:", currentUser.email)
        const donorData = await getDonorByEmail(currentUser.email)
        setDonor(donorData)
        
        // Initialize edit form with current values
        setEditForm({
          name: donorData.name || "",
          phone: donorData.phone || "",
          address: donorData.address || ""
        })
      } catch (error) {
        console.error("Error fetching donor data:", error)
        setError("Failed to load your profile data. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    
    fetchDonorData()
  }, [router])
  
  const handleLogout = async () => {
    try {
      await logout()
      router.push("/")
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }
  
  const handleEditToggle = () => {
    setIsEditMode(!isEditMode)
    
    // Reset form values when entering edit mode
    if (!isEditMode && donor) {
      setEditForm({
        name: donor.name || "",
        phone: donor.phone || "",
        address: donor.address || ""
      })
    }
  }
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditForm({ ...editForm, [name]: value })
  }
  
  const handleProfileUpdate = async () => {
    // In a real implementation, this would call an API to update the profile
    try {
      // Mock update - in a real app, this would be an API call
      setDonor(prev => {
        if (!prev) return null
        return {
          ...prev,
          name: editForm.name,
          phone: editForm.phone,
          address: editForm.address
        }
      })
      setIsEditMode(false)
    } catch (error) {
      console.error("Error updating profile:", error)
      setError("Failed to update profile. Please try again.")
    }
  }
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading your profile...</p>
        </div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Button onClick={() => router.push("/")}>Return Home</Button>
        </div>
      </div>
    )
  }
  
  const initials = donor?.name
    ? donor.name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "U"
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav user={donor ? {
            name: donor.name,
            email: donor.email,
            role: "donor"
          } : {
            name: "Loading...",
            email: "",
            role: "donor"
          }} />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex lg:w-[250px]">
          <nav className="grid items-start gap-2 px-2 py-4 text-sm">
            <Link
              href="/dashboard/donor"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <User className="h-4 w-4" />
              Dashboard
            </Link>
            <Link
              href="/feed"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <FilePlus className="h-4 w-4" />
              Feed
            </Link>
            <Link
              href={donor && donor._id ? `/messages/${donor._id}` : "/messages"}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href="/profile/donor"
              className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2 text-teal-800"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 mt-6"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </nav>
        </aside>
        <main className="py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-teal-700 mb-2">
              Your Profile
            </h1>
            <p className="text-gray-500">
              View and manage your personal information
            </p>
          </div>
          
          <div className="grid gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src="/placeholder.svg" alt={donor?.name || "User"} />
                    <AvatarFallback className="bg-teal-100 text-teal-800">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-2xl">{donor?.name}</CardTitle>
                    <CardDescription>{donor?.email}</CardDescription>
                  </div>
                </div>
                <Button 
                  variant={isEditMode ? "destructive" : "outline"} 
                  size="sm" 
                  onClick={handleEditToggle}
                >
                  {isEditMode ? (
                    <>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </>
                  ) : (
                    <>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent className="pt-6">
                {isEditMode ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label htmlFor="name" className="text-sm font-medium">Name</label>
                      <Input 
                        id="name" 
                        name="name"
                        value={editForm.name} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="phone" className="text-sm font-medium">Phone</label>
                      <Input 
                        id="phone" 
                        name="phone"
                        value={editForm.phone} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <div className="grid gap-2">
                      <label htmlFor="address" className="text-sm font-medium">Address</label>
                      <Textarea 
                        id="address" 
                        name="address"
                        value={editForm.address} 
                        onChange={handleInputChange} 
                      />
                    </div>
                    <Button className="mt-4" onClick={handleProfileUpdate}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Role</h3>
                        <p className="flex items-center">
                          <Heart className="h-4 w-4 mr-2 text-teal-600" />
                          Donor
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Email</h3>
                        <p>{donor?.email}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Phone</h3>
                        <p>{donor?.phone || "Not provided"}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Address</h3>
                        <p>{donor?.address || "Not provided"}</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-2">Account Statistics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Following</p>
                                <p className="text-2xl font-bold text-teal-600">{donor?.following?.length || 0}</p>
                              </div>
                              <Building2 className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Donations</p>
                                <p className="text-2xl font-bold text-teal-600">{donor?.donations?.length || 0}</p>
                              </div>
                              <Heart className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm text-gray-500">Joined</p>
                                <p className="text-sm font-medium">
                                  {donor?.createdAt 
                                    ? new Date(donor.createdAt).toLocaleDateString() 
                                    : "Unknown"}
                                </p>
                              </div>
                              <User className="h-8 w-8 text-teal-200" />
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 