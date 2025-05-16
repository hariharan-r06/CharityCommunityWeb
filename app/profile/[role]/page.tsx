"use client"
//app/profile/[role]/page.tsx

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Pencil } from "lucide-react"
import { useRouter } from "next/navigation"

interface UserProfile {
  name: string
  email: string
  image?: string
  role: "donor" | "charity"
  bio: string
  createdAt: string
}

export default function ProfilePage() {
  const { user, error, isLoading } = useUser()
  const router = useRouter()
  const { role } = useParams()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [editedBio, setEditedBio] = useState("")

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/api/auth/login")
    }
  }, [isLoading, user, router])

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          const mockProfile: UserProfile = {
            name: user.name || "Anonymous",
            email: user.email || "",
            image: user.picture || "/placeholder.svg",
            role: role as "donor" | "charity",
            bio: "Passionate about making a difference in the community through charitable work.",
            createdAt: new Date().toISOString()
          }
          
          setProfile(mockProfile)
          setEditedBio(mockProfile.bio)
        } catch (error) {
          console.error("Failed to fetch profile:", error)
        } finally {
          setLoading(false)
        }
      }

      fetchProfile()
    }
  }, [user, role])

  const handleSaveBio = () => {
    if (profile) {
      setProfile({ ...profile, bio: editedBio })
      setIsEditingBio(false)
      // Here you would typically make an API call to save the bio
    }
  }

  if (isLoading || loading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-[200px]" />
            <Skeleton className="h-4 w-[300px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>Unable to load profile information</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const initials = profile.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.image} alt={profile.name} />
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{profile.name}</CardTitle>
            <CardDescription>{profile.email}</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="space-y-1">
              <h3 className="font-medium">Role</h3>
              <p className="text-sm text-muted-foreground capitalize">{profile.role}</p>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Bio</h3>
                {!isEditingBio && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditingBio(true)}
                    className="h-8 px-2"
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                )}
              </div>
              
              {isEditingBio ? (
                <div className="space-y-2">
                  <Textarea
                    value={editedBio}
                    onChange={(e) => setEditedBio(e.target.value)}
                    className="min-h-[100px]"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSaveBio}>
                      Save
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setIsEditingBio(false)
                        setEditedBio(profile.bio)
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <h3 className="font-medium">Member Since</h3>
              <p className="text-sm text-muted-foreground">
                {new Date(profile.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 