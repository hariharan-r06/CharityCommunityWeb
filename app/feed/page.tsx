"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PostCard } from "@/components/post-card"
import { Search, Filter, Loader2 } from "lucide-react"
import { getFeed, Post, PostComment } from "@/services/apiService"
import { auth } from "@/app/firebase"

export default function FeedPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [followingOnly, setFollowingOnly] = useState(false)

  useEffect(() => {
    setMounted(true)

    // Get the current user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    // Fetch posts
    fetchPosts();

    return () => unsubscribe();
  }, [])

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const fetchedPosts = await getFeed();
      console.log("Fetched posts:", fetchedPosts);
      
      // Format posts to ensure they have all required fields
      const formattedPosts = fetchedPosts.map(post => {
        // Ensure charity property has the required fields
        const charity = {
          id: post.charity?.id || post._id,
          name: post.charity?.name || "Unknown Charity",
          avatar: post.charity?.avatar || "/placeholder.svg",
          verified: post.charity?.verified !== undefined ? post.charity.verified : true
        };
        
        // Process comments count
        const commentsCount = post.comments?.length || post.comments || 0;
        
        // Format the post
        return {
          ...post,
          charity,
          comments: commentsCount,
          commentsList: Array.isArray(post.comments) ? post.comments : post.commentsList || [],
          likes: post.likes || 0,
          timeAgo: post.timeAgo || "Recently"
        };
      });
      
      setPosts(formattedPosts);
      setFilteredPosts(formattedPosts);
    } catch (err) {
      console.error("Error fetching posts:", err);
      setError("Failed to load posts. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (posts.length > 0) {
      let filtered = [...posts];
      
      if (searchQuery) {
        filtered = filtered.filter(
          (post) =>
            post.charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (post.text || post.content || "").toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      // For now, we're not implementing the following filter since we don't have that data yet
      // This would be implemented based on the logged-in user's following list
      
      setFilteredPosts(filtered);
    }
  }, [searchQuery, posts]);

  const handleCommentAdded = (postId: string, comment: PostComment) => {
    // Update the posts state to reflect the new comment
    setPosts(prevPosts => 
      prevPosts.map(post => {
        if (post._id === postId || post.id === postId) {
          const updatedComments = post.commentsList ? [...post.commentsList, comment] : [comment];
          return {
            ...post,
            comments: (post.comments || 0) + 1,
            commentsList: updatedComments
          };
        }
        return post;
      })
    );
  };

  if (!mounted) {
    return null;
  }

  const userRole = currentUser?.displayName?.includes("Charity") ? "charity" : "donor";

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav role={userRole || "donor"} />
      <div className="container flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-teal-700">Feed</h2>
            <p className="text-muted-foreground">Stay updated with the latest from charities</p>
          </div>
          {currentUser && (
            <UserNav user={{ 
              name: currentUser.displayName || "User", 
              email: currentUser.email || "",
              role: userRole || "donor",
              image: currentUser.photoURL || undefined
            }} />
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline" 
            size="icon"
            title="Refresh feed"
            onClick={fetchPosts}
            disabled={loading}
          >
            <Loader2 className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Posts</TabsTrigger>
            <TabsTrigger value="following">Following</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
                <Button 
                  variant="outline" 
                  onClick={fetchPosts} 
                  className="mt-2"
                >
                  Try Again
                </Button>
              </div>
            ) : filteredPosts.length > 0 ? (
              filteredPosts.map((post) => (
                <PostCard 
                  key={post._id?.toString() || post.id?.toString() || Math.random().toString()} 
                  post={post} 
                  userRole={userRole || "donor"} 
                  onCommentAdded={handleCommentAdded}
                />
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No posts found matching your search.</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="following" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div>
                {/* This would be implemented based on the user's following list */}
                {filteredPosts.slice(0, 3).map((post) => (
                  <PostCard 
                    key={post._id?.toString() || post.id?.toString() || Math.random().toString()} 
                    post={post} 
                    userRole={userRole || "donor"} 
                    onCommentAdded={handleCommentAdded}
                  />
                ))}
                {filteredPosts.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">You're not following any charities yet.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
              </div>
            ) : (
              <div>
                {/* This would show posts with most likes/comments */}
                {filteredPosts.slice(0, 5).map((post) => (
                  <PostCard 
                    key={post._id?.toString() || post.id?.toString() || Math.random().toString()} 
                    post={post} 
                    userRole={userRole || "donor"} 
                    onCommentAdded={handleCommentAdded}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
