"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post-card"
import { Heart, Users, Building, MapPin, Mail, Phone, CreditCard } from "lucide-react"
import { getCharityById, getCharityPosts, followCharity, unfollowCharity } from "@/services/apiService"
import { auth } from "@/app/firebase"

export default function CharityProfilePage() {
  const params = useParams()
  const charityId = params?.id as string
  const [charity, setCharity] = useState<any>(null)
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [isFollowingLoading, setIsFollowingLoading] = useState(false)
  const [bankDetails, setBankDetails] = useState<any>(null)

  useEffect(() => {
    // Get the current user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchCharityData = async () => {
      setLoading(true)
      try {
        // Fetch charity data
        const charityData = await getCharityById(charityId)
        setCharity(charityData)
        setFollowersCount(charityData.followers?.length || 0)
        
        // Check if current user is following this charity
        if (currentUser) {
          const isUserFollowing = charityData.followers?.some(
            (followerId: any) => followerId.toString() === currentUser.uid
          )
          setIsFollowing(isUserFollowing)
        }
        
        // Fetch charity posts
        const charityPosts = await getCharityPosts(charityId)
        
        // Format posts with charity info
        const formattedPosts = charityPosts.map((post: any) => ({
          ...post,
          charity: {
            id: charityData._id,
            name: charityData.name,
            avatar: "/placeholder.svg?height=40&width=40",
            verified: true,
          }
        }))
        
        setPosts(formattedPosts)

        // Fetch bank details from ngo_data.json
        try {
          const response = await fetch(`/api/bank-details?email=${encodeURIComponent(charityData.email)}`);
          if (response.ok) {
            const data = await response.json();
            setBankDetails(data.bankDetails);
          }
        } catch (err) {
          console.error("Error fetching bank details:", err);
        }
      } catch (err) {
        console.error("Error fetching charity data:", err)
        setError("Failed to load charity profile. Please try again later.")
      } finally {
        setLoading(false)
      }
    }
    
    if (charityId) {
      fetchCharityData()
    }
  }, [charityId, currentUser])

  const handleFollow = async () => {
    if (!currentUser || !currentUser.uid) {
      // Redirect to login or show login prompt
      return
    }
    
    setIsFollowingLoading(true)
    try {
      if (isFollowing) {
        await unfollowCharity(currentUser.uid, charityId)
        setIsFollowing(false)
        setFollowersCount(prev => Math.max(0, prev - 1))
      } else {
        await followCharity(currentUser.uid, charityId)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
      }
    } catch (err) {
      console.error("Error updating follow status:", err)
    } finally {
      setIsFollowingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading charity profile...</p>
        </div>
      </div>
    )
  }

  if (error || !charity) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700 mb-6">{error || "Charity not found"}</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    )
  }

  const initials = charity.name
    ? charity.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : "C"

  // Extract payment links
  const paymentLinks = charity.paymentLinks && charity.paymentLinks.length > 0 
    ? charity.paymentLinks[0] 
    : {}
  
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          {currentUser && (
            <UserNav user={{ 
              name: currentUser.displayName || "User", 
              email: currentUser.email || "",
              role: currentUser.displayName?.includes("Charity") ? "charity" : "donor",
              image: currentUser.photoURL || undefined
            }} />
          )}
        </div>
      </header>
      
      <main className="container py-8">
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-shrink-0">
                  <Avatar className="h-24 w-24 border-2 border-teal-100">
                    <AvatarImage src="/placeholder.svg" alt={charity.name} />
                    <AvatarFallback className="bg-teal-100 text-teal-800 text-2xl">{initials}</AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-teal-700 flex items-center">
                        {charity.name}
                      </h1>
                      <p className="text-muted-foreground">{charity.email}</p>
                    </div>
                    
                    <div className="mt-4 md:mt-0">
                      <Button 
                        onClick={handleFollow}
                        disabled={isFollowingLoading || !currentUser}
                        variant={isFollowing ? "outline" : "default"}
                        className={isFollowing ? "border-teal-600 text-teal-600" : ""}
                      >
                        {isFollowing ? "Following" : "Follow"}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-teal-600" />
                      <span><strong>{followersCount}</strong> Followers</span>
                    </div>
                    <div className="flex items-center">
                      <Heart className="h-5 w-5 mr-2 text-teal-600" />
                      <span><strong>{posts.length}</strong> Posts</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {charity.address && (
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 text-teal-600 mt-0.5" />
                        <span>{charity.address}</span>
                      </div>
                    )}
                    
                    {charity.phone && (
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-2 text-teal-600" />
                        <span>{charity.phone}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-teal-600" />
                      <span>{charity.email}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs defaultValue="posts" className="space-y-6">
          <TabsList>
            <TabsTrigger value="posts">Posts</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="donate">Donate</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-6">
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard 
                  key={post._id?.toString() || post.id?.toString()} 
                  post={post} 
                  userRole={currentUser?.displayName?.includes("Charity") ? "charity" : "donor"}
                />
              ))
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <p className="text-muted-foreground">This charity hasn't posted any updates yet.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle>About {charity.name}</CardTitle>
                <CardDescription>Organization information and mission</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-medium mb-2">Address</h3>
                  <p className="text-muted-foreground">{charity.address || "Not provided"}</p>
                </div>
                
                <div>
                  <h3 className="font-medium mb-2">Contact Information</h3>
                  <div className="space-y-2">
                    <p className="flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                      {charity.email}
                    </p>
                    {charity.phone && (
                      <p className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                        {charity.phone}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="donate">
            <Card>
              <CardHeader>
                <CardTitle>Support {charity.name}</CardTitle>
                <CardDescription>Make a donation to support this charity's work</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {(paymentLinks.gpayNo || paymentLinks.razorpay || bankDetails) ? (
                  <>
                    {paymentLinks.gpayNo && (
                      <div>
                        <h3 className="font-medium mb-2">Google Pay</h3>
                        <p className="text-muted-foreground">{paymentLinks.gpayNo}</p>
                      </div>
                    )}
                    
                    {paymentLinks.razorpay && (
                      <div>
                        <h3 className="font-medium mb-2">Razorpay</h3>
                        <a 
                          href={paymentLinks.razorpay}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:underline"
                        >
                          Donate via Razorpay
                        </a>
                      </div>
                    )}
                    
                    {bankDetails && (
                      <div>
                        <h3 className="font-medium mb-2">Bank Transfer</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="font-medium">Bank:</span> {bankDetails["Bank Name"]}</p>
                          <p><span className="font-medium">Account Holder:</span> {bankDetails["Account Holder Name"]}</p>
                          <p><span className="font-medium">Account Number:</span> {bankDetails["Account Number"]}</p>
                          <p><span className="font-medium">IFSC Code:</span> {bankDetails["IFSC Code"]}</p>
                          <p><span className="font-medium">Account Type:</span> {bankDetails["Account Type"]}</p>
                          {bankDetails["Branch"] && (
                            <p><span className="font-medium">Branch:</span> {bankDetails["Branch"]}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">This charity hasn't provided payment information yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
} 