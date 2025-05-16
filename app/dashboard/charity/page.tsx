"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useSearchParams, useRouter, useParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  TrendingUp,
  Users,
  ArrowRight,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ImagePlus,
  FileText,
  MessageSquare,
  Send,
  BarChart2,
  Eye,
  EyeOff,
  X,
  Globe,
  Lock,
  ChevronDown,
  Heart,
  Search,
  User,
  FilePlus,
  LogOut,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Textarea } from "@/components/ui/textarea"
import { PostCard } from "@/components/post-card"
import { DonorCard } from "@/components/donor-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { auth } from "@/app/firebase"
import { getCharityByEmail, getCharityById, getCharityPosts, initializeCharityMessages } from "@/services/apiService"
import { logout } from "@/services/authService"
import { CreatePostForm } from "@/components/create-post-form"

// Mock data
const mockUser = {
  name: "Charity Organization",
  email: "charity@example.com",
  role: "charity" as const
};

const mockStats = [
  { title: "Total Donations", value: "$12,450", icon: DollarSign, change: "+8%" },
  { title: "Supporters", value: "1,240", icon: Users, change: "+12%" },
  { title: "Engagement Rate", value: "24%", icon: TrendingUp, change: "+5%" },
]

const mockPosts = [
  {
    id: 1,
    charity: {
      name: "Clean Water Initiative",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
    },
    content: "Thanks to your donations, we've provided clean water to 5 more villages this month!",
    image: "/placeholder.svg?height=300&width=500",
    likes: 124,
    comments: 32,
    timeAgo: "2h ago",
    visibility: "public",
  },
  {
    id: 2,
    charity: {
      name: "Clean Water Initiative",
      avatar: "/placeholder.svg?height=40&width=40",
      verified: true,
    },
    content:
      "Our team is on the ground in Tanzania installing new water filtration systems. Your support makes this possible!",
    image: "/placeholder.svg?height=300&width=500",
    likes: 89,
    comments: 14,
    timeAgo: "2d ago",
    visibility: "public",
  },
]

const mockDonors = [
  {
    id: 1,
    name: "Alex Johnson",
    avatar: "/placeholder.svg?height=60&width=60",
    donated: "$350",
    since: "Jan 2023",
    lastDonation: "2 weeks ago",
  },
  {
    id: 2,
    name: "Sarah Williams",
    avatar: "/placeholder.svg?height=60&width=60",
    donated: "$250",
    since: "Mar 2023",
    lastDonation: "1 month ago",
  },
  {
    id: 3,
    name: "Michael Brown",
    avatar: "/placeholder.svg?height=60&width=60",
    donated: "$150",
    since: "Feb 2023",
    lastDonation: "3 weeks ago",
  },
]

const mockMessages = [
  {
    id: 1,
    sender: {
      name: "Alex Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    preview: "I'd like to know more about your water filtration project...",
    time: "2h ago",
    unread: true,
  },
  {
    id: 2,
    sender: {
      name: "Sarah Williams",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    preview: "Thank you for the update on the Tanzania project...",
    time: "1d ago",
    unread: false,
  },
  {
    id: 3,
    sender: {
      name: "Michael Brown",
      avatar: "/placeholder.svg?height=40&width=40",
    },
    preview: "Is there a way I can volunteer for your organization?",
    time: "3d ago",
    unread: false,
  },
]

export interface Charity {
  _id: string;
  name: string;
  email: string;
  address: string;
  phone?: string;
  followers: any[];
  posts: any[];
  paymentLinks: any[];
  messages?: any[];
}

export default function CharityDashboard() {
  const router = useRouter()
  const params = useParams()
  const charityId = params.id as string
  const searchParams = useSearchParams()
  const verificationStatus = searchParams.get("verification") || "verified" // pending, verified, rejected
  const [mounted, setMounted] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [isPostLoading, setIsPostLoading] = useState(false)
  const [postVisibility, setPostVisibility] = useState("public")
  const [selectedImages, setSelectedImages] = useState<File[]>([])
  const [selectedDocuments, setSelectedDocuments] = useState<File[]>([])
  const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([])
  const [documentNames, setDocumentNames] = useState<string[]>([])
  const [posts, setPosts] = useState<any[]>([])
  const [activeMessage, setActiveMessage] = useState<number | null>(null)
  const [quickReply, setQuickReply] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)
  const documentInputRef = useRef<HTMLInputElement>(null)
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [charity, setCharity] = useState<Charity | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const fetchCharityData = async () => {
      setLoading(true);
      
      // Check for charity ID in URL
      if (charityId) {
        try {
          console.log("Fetching charity with ID:", charityId);
          // Fetch charity data by ID from the API
          const charityData = await getCharityById(charityId);
          setCharity(charityData);
          
          // Check if messages field needs initialization
          if (!charityData.messages || charityData.messages.length === 0) {
            console.log("Initializing messages for charity:", charityId);
            try {
              await initializeCharityMessages(charityId);
              // Refresh charity data to get updated messages
              const refreshedCharity = await getCharityById(charityId);
              setCharity(refreshedCharity);
            } catch (msgError) {
              console.error("Error initializing charity messages:", msgError);
            }
          }
          
          setLoading(false);
          return;
        } catch (error) {
          console.error("Error fetching charity data by ID:", error);
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
        console.log("Fetching charity with email:", currentUser.email);
        const charityData = await getCharityByEmail(currentUser.email || "");
        setCharity(charityData);
        
        // Check if messages field needs initialization
        if (!charityData.messages || charityData.messages.length === 0) {
          console.log("Initializing messages for charity:", charityData._id);
          try {
            await initializeCharityMessages(charityData._id);
            // Refresh charity data to get updated messages
            const refreshedCharity = await getCharityById(charityData._id);
            setCharity(refreshedCharity);
          } catch (msgError) {
            console.error("Error initializing charity messages:", msgError);
          }
        }
        
        // If we found the charity by email but don't have it in the URL,
        // update the URL to include the charity ID for better bookmarking/sharing
        if (charityData && charityData._id && !charityId) {
          router.replace(`/dashboard/charity/${charityData._id}`);
        }
      } catch (error) {
        console.error("Error fetching charity data:", error);
        setError("Failed to load your profile data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (mounted) {
      fetchCharityData();
    }
  }, [mounted, router, charityId]);

  useEffect(() => {
    const fetchCharityPosts = async () => {
      if (!charity || !charity._id) return;
      
      try {
        const fetchedPosts = await getCharityPosts(charity._id);
        // Map posts data to include charity information
        const formattedPosts = fetchedPosts.map(post => ({
          ...post,
          charity: {
            id: charity._id,
            name: charity.name,
            avatar: "/placeholder.svg?height=40&width=40",
            verified: true,
          }
        }));
        setPosts(formattedPosts);
      } catch (error) {
        console.error("Error fetching charity posts:", error);
      }
    };

    if (charity) {
      fetchCharityPosts();
    }
  }, [charity]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedImages((prev) => [...prev, ...filesArray])

      // Create preview URLs
      const newPreviewUrls = filesArray.map((file) => URL.createObjectURL(file))
      setImagePreviewUrls((prev) => [...prev, ...newPreviewUrls])
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedDocuments((prev) => [...prev, ...filesArray])
      setDocumentNames((prev) => [...prev, ...filesArray.map((file) => file.name)])
    }
  }

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviewUrls[index])
    setImagePreviewUrls(imagePreviewUrls.filter((_, i) => i !== index))
    setSelectedImages(selectedImages.filter((_, i) => i !== index))
  }

  const removeDocument = (index: number) => {
    setDocumentNames(documentNames.filter((_, i) => i !== index))
    setSelectedDocuments(selectedDocuments.filter((_, i) => i !== index))
  }

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPostContent.trim() && selectedImages.length === 0) {
      return
    }

    setIsPostLoading(true)

    // Simulate post creation
    setTimeout(() => {
      // Ensure image is always defined
      const postImage = imagePreviewUrls.length > 0 ? imagePreviewUrls[0] : "/placeholder.svg?height=300&width=500";
      
      const newPost = {
        id: Date.now(),
        charity: {
          name: mockUser.name,
          avatar: "/placeholder.svg?height=40&width=40",
          verified: true,
        },
        content: newPostContent,
        image: postImage, // Always defined
        likes: 0,
        comments: 0,
        timeAgo: "Just now",
        visibility: postVisibility,
      }

      setPosts([newPost, ...posts])
      setIsPostLoading(false)
      setNewPostContent("")
      setSelectedImages([])
      setSelectedDocuments([])
      setImagePreviewUrls([])
      setDocumentNames([])
      setIsPreviewMode(false)
    }, 1000)
  }

  const handleQuickReply = (messageId: number) => {
    if (!quickReply.trim()) return

    // In a real app, this would send the message to the API
    console.log(`Sending reply to message ${messageId}: ${quickReply}`)

    // Reset and close the quick reply
    setQuickReply("")
    setActiveMessage(null)
  }

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const handlePostCreated = async () => {
    // Refresh posts after a new one is created
    if (charity && charity._id) {
      try {
        const fetchedPosts = await getCharityPosts(charity._id);
        // Map posts data to include charity information
        const formattedPosts = fetchedPosts.map(post => ({
          ...post,
          charity: {
            id: charity._id,
            name: charity.name,
            avatar: "/placeholder.svg?height=40&width=40",
            verified: true,
          }
        }));
        setPosts(formattedPosts);
      } catch (error) {
        console.error("Error refreshing posts:", error);
      }
    }
  };

  if (!mounted) {
    return null
  }

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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <MainNav />
          <UserNav user={charity ? {
            name: charity.name,
            email: charity.email,
            role: "charity"
          } : {
            name: "Loading...",
            email: "",
            role: "charity"
          }} />
        </div>
      </header>
      <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
        <aside className="hidden w-[200px] flex-col md:flex lg:w-[250px]">
          <nav className="grid items-start gap-2 px-2 py-4 text-sm">
            <Link
              href="/dashboard/charity"
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
              Posts
            </Link>
            <Link
              href={charity && charity._id ? `/messages/${charity._id}` : "/messages"}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="h-4 w-4" />
              Messages
            </Link>
            <Link
              href="/profile/charity"
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
              Welcome, {charity?.name || "Charity"}!
            </h1>
            <p className="text-gray-500">
              Manage your charity profile, create posts, and connect with donors.
            </p>
          </div>

          {/* Dashboard metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Followers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">{charity?.followers?.length || 0}</div>
                <p className="text-xs text-muted-foreground">
                  Donors following you
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Posts</CardTitle>
                <FilePlus className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">{charity?.posts?.length || 0}</div>
                <p className="text-xs text-muted-foreground">Total posts</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Donations</CardTitle>
                <Heart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">$0</div>
                <p className="text-xs text-muted-foreground">Total received</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-teal-600">0</div>
                <p className="text-xs text-muted-foreground">Unread messages</p>
              </CardContent>
            </Card>
          </div>

          {/* Main content sections */}
          <div className="mt-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-teal-700">Your Posts</h2>
            </div>
            
            {charity && (
              <CreatePostForm 
                charityId={charity._id}
                charityName={charity.name}
                charityAvatar="/placeholder.svg?height=40&width=40"
                onPostCreated={handlePostCreated}
              />
            )}
            
            {posts.length > 0 ? (
              <div className="space-y-6">
                {posts.map((post, index) => (
                  <PostCard key={post._id || index} post={post} userRole="charity" />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 border border-dashed rounded-lg">
                <div className="mb-4">
                  <FilePlus className="h-12 w-12 text-muted-foreground mx-auto" />
                </div>
                <h3 className="text-lg font-medium mb-2">No posts yet</h3>
                <p className="text-muted-foreground mb-6">
                  Share updates about your charity's work and impact
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
