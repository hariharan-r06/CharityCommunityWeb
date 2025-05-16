"use client"

//app/dashboard/donor/page.tsx

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { Heart, Search, Building2, User, MessageSquare, FilePlus, LogOut } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { CharityCard } from "@/components/charity-card"
import { PostCard } from "@/components/post-card"
import { auth } from "@/app/firebase"
import { 
  getDonorById, 
  getDonorByEmail, 
  getAllCharities, 
  getDonorFeed, 
  followCharity, 
  unfollowCharity,
  initializeDonorMessages,
  Post 
} from "@/services/apiService"
import { logout } from "@/services/authService"

// Mock data for components that require props
const mockUser = {
  name: "Donor User",
  email: "donor@example.com",
  role: "donor" as const
};

const mockPost = {
  id: "1",
  charity: {
    name: "Example Charity",
    avatar: "/placeholder.svg?height=40&width=40",
    verified: true,
  },
  content: "This is a sample post content showing charity updates.",
  image: "/placeholder.svg?height=300&width=500",
  likes: 45,
  comments: 12,
  timeAgo: "2h ago",
  visibility: "public"
};

// Modify the APICharity interface to match CharityProfile
interface APICharity {
  _id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  followers: any[];
  posts: any[];  // Instead of postsCount
  paymentLinks: any[];
  createdAt: string;
  updatedAt: string;
}

// Modify the Post interface to handle the mock post
interface MockPost {
  id: number | string;
  charity: {
    name: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  image: string;
  likes: number;
  comments: number;
  timeAgo: string;
  visibility: string;
}

// Modify the CharityCard charity interface
interface CardCharity {
  id: string | number;
  name: string;
  category: string;
  avatar: string;
  coverImage: string;
  description: string;
  verified: boolean;
  followers: number;
  donated: string;
}

export interface Donor {
  _id: string;
  name: string;
  email: string;
  address?: string;
  phone?: string;
  following: any[];
  donations: any[];
  messages?: any[]; // Make messages optional and array type
}

export default function DonorDashboard() {
  const router = useRouter()
  const params = useParams()
  const donorId = params.id as string
  const [donor, setDonor] = useState<Donor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [charities, setCharities] = useState<APICharity[]>([])
  const [isLoadingCharities, setIsLoadingCharities] = useState(false)
  const [feedPosts, setFeedPosts] = useState<Post[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(false);

  useEffect(() => {
    const fetchDonorData = async () => {
      setLoading(true);
      
      // Check for donor ID in URL
      if (donorId) {
        try {
          console.log("Fetching donor with ID:", donorId);
          // Fetch donor data by ID from the API
          const donorData = await getDonorById(donorId);
          setDonor(donorData);
          
          // Check if messages field needs initialization
          if (!donorData.messages || donorData.messages.length === 0) {
            console.log("Initializing messages for donor:", donorId);
            try {
              await initializeDonorMessages(donorId);
              // Refresh donor data to get updated messages
              const refreshedDonor = await getDonorById(donorId);
              setDonor(refreshedDonor);
            } catch (msgError) {
              console.error("Error initializing donor messages:", msgError);
            }
          }
          
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error fetching donor data by ID:", error);
          // If fetching by ID fails, fallback to current user
        }
      }
      
      // Fallback: Check for current authenticated user
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.log("No authenticated user found, redirecting to login");
        router.push("/auth/login");
        return;
      }

      try {
        console.log("Fetching donor with email:", currentUser.email);
        const donorData = await getDonorByEmail(currentUser.email || "");
        setDonor(donorData);
        
        // Check if messages field needs initialization
        if (!donorData.messages || donorData.messages.length === 0) {
          console.log("Initializing messages for donor:", donorData._id);
          try {
            await initializeDonorMessages(donorData._id);
            // Refresh donor data to get updated messages
            const refreshedDonor = await getDonorById(donorData._id);
            setDonor(refreshedDonor);
          } catch (msgError) {
            console.error("Error initializing donor messages:", msgError);
          }
        }
        
        // If we found the donor by email but don't have it in the URL,
        // update the URL to include the donor ID for better bookmarking/sharing
        if (donorData && donorData._id && !donorId) {
          router.replace(`/dashboard/donor/${donorData._id}`);
        }
      } catch (error) {
        console.error("Error fetching donor data:", error);
        setError("Failed to load your profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchDonorData();
  }, [router, donorId]);

  useEffect(() => {
    const fetchCharitySuggestions = async () => {
      setIsLoadingCharities(true);
      try {
        const charitiesData = await getAllCharities();
        setCharities(charitiesData as unknown as APICharity[]);
      } catch (error) {
        console.error("Error fetching charity suggestions:", error);
      } finally {
        setIsLoadingCharities(false);
      }
    };

    fetchCharitySuggestions();
  }, []);

  // Fetch donor's feed (posts from followed charities)
  useEffect(() => {
    const fetchDonorFeed = async () => {
      if (!donor || !donor._id) return;
      
      setIsLoadingFeed(true);
      try {
        const feed = await getDonorFeed(donor._id);
        setFeedPosts(feed);
      } catch (error) {
        console.error("Error fetching donor feed:", error);
      } finally {
        setIsLoadingFeed(false);
      }
    };

    if (donor) {
      fetchDonorFeed();
    }
  }, [donor]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle follow functionality
  const handleFollow = async (charityId: string) => {
    if (!donor || !donor._id) return;
    
    try {
      await followCharity(donor._id, charityId);
      
      // Update the donor state with new following list
      setDonor(prevDonor => {
        if (!prevDonor) return null;
        
        return {
          ...prevDonor,
          following: [...prevDonor.following, charityId]
        };
      });
      
      // Refresh the charity suggestions
      // This could be optimized to just update the specific charity
      const charitiesData = await getAllCharities();
      setCharities(charitiesData as unknown as APICharity[]);
      
      // Refresh the feed
      const feed = await getDonorFeed(donor._id);
      setFeedPosts(feed);
    } catch (error) {
      console.error("Error following charity:", error);
    }
  };

  // Handle unfollow functionality
  const handleUnfollow = async (charityId: string) => {
    if (!donor || !donor._id) return;
    
    try {
      await unfollowCharity(donor._id, charityId);
      
      // Update the donor state with new following list
      setDonor(prevDonor => {
        if (!prevDonor) return null;
        
        return {
          ...prevDonor,
          following: prevDonor.following.filter(id => id.toString() !== charityId)
        };
      });
      
      // Refresh the charity suggestions
      // This could be optimized to just update the specific charity
      const charitiesData = await getAllCharities();
      setCharities(charitiesData as unknown as APICharity[]);
      
      // Refresh the feed
      const feed = await getDonorFeed(donor._id);
      setFeedPosts(feed);
    } catch (error) {
      console.error("Error unfollowing charity:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-teal-700">Loading your dashboard...</p>
        </div>
      </div>
    );
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
    );
  }

  // Convert API charity format to CharityCard format
  const formatCharityForCard = (charity: APICharity) => {
    return {
      id: charity._id,
      name: charity.name,
      category: "Charity", // Default category
      avatar: "/placeholder.svg?height=60&width=60",
      coverImage: "/placeholder.svg?height=100&width=300",
      description: charity.address,
      verified: true,
      followers: charity.followers?.length || 0,
      donated: "$0" // Default value
    };
  };

  // Get charity suggestions (excluding those the donor is already following)
  const charitySuggestions = charities
    .filter(charity => 
      !donor?.following?.some(followedId => 
        followedId.toString() === charity._id.toString()
      )
    )
    .slice(0, 3) // Limit to 3 suggestions
    .map(formatCharityForCard);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav user={donor ? {
            name: donor.name,
            email: donor.email,
            role: "donor"
          } : mockUser} />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex lg:w-[250px]">
          <nav className="grid items-start gap-2 px-2 py-4 text-sm">
            <Link
              href="/dashboard/donor"
              className="flex items-center gap-3 rounded-lg bg-teal-50 px-3 py-2 text-teal-800"
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
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
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
        <main className="flex flex-col gap-8 py-8">
          <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight text-teal-700">
              Welcome, {donor?.name || "Donor"}!
            </h1>
            <p className="text-gray-500">
              Explore our platform, discover charities, and make a difference.
            </p>
          </div>

          {/* Dashboard metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Following</CardTitle>
                <Building2 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">{donor?.following?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Charitable organizations
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Donations</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">{donor?.donations?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total contributions</p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <h2 className="mb-4 text-xl font-semibold text-teal-700">Recent Updates</h2>
              <div className="space-y-4">
                {isLoadingFeed ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading feed...</p>
                  </div>
                ) : feedPosts.length > 0 ? (
                  feedPosts.slice(0, 3).map((post) => (
                    <PostCard key={post._id?.toString() || post.id?.toString()} post={post} userRole="donor" />
                  ))
                ) : (
                  <div className="text-center py-8 border border-dashed rounded-lg">
                    <p className="text-muted-foreground mb-2">No updates from charities you follow yet</p>
                    <p className="text-sm text-muted-foreground mb-4">Follow charities from the suggestions to see their updates here</p>
                  </div>
                )}
                {feedPosts.length > 0 && (
                  <div className="mt-6 text-center">
                    <Button variant="outline" onClick={() => router.push('/feed')}>View More</Button>
                  </div>
                )}
              </div>
            </div>
            <div>
              <h2 className="mb-4 text-xl font-semibold text-teal-700">Charity Suggestions</h2>
              {isLoadingCharities ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-4 border-t-teal-600 border-teal-200 rounded-full animate-spin mx-auto"></div>
                  <p className="mt-2 text-sm text-muted-foreground">Loading suggestions...</p>
                </div>
              ) : charitySuggestions.length > 0 ? (
                <div className="space-y-4">
                  {charitySuggestions.map((charity) => (
                    <CharityCard 
                      key={charity.id.toString()} 
                      charity={charity as any} 
                      userRole="donor" 
                      isFollowing={donor?.following?.some(id => id.toString() === charity.id.toString())} 
                      onFollow={() => handleFollow(charity.id.toString())}
                      onUnfollow={() => handleUnfollow(charity.id.toString())}
                    />
                  ))}
                  <div className="mt-2 text-center">
                    <Link href="/discover" className="text-teal-600 text-sm hover:underline">
                      Discover more charities
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 border border-dashed rounded-lg">
                  <p className="text-muted-foreground mb-2">No charity suggestions available</p>
                  <Link href="/discover">
                    <Button variant="outline" size="sm">
                      Explore Charities
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
