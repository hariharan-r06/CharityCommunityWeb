"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Heart, MessageSquare, Share2, MoreHorizontal, CheckCircle, Loader2 } from "lucide-react"
import { DonateDialog } from "@/components/donate-dialog"
import { Post, PostComment, addComment, likePost } from "@/services/apiService"
import { auth } from "@/app/firebase"

interface ProcessedComment {
  id: string;
  from: string;
  message: string;
  timeAgo: string;
}

interface PostCardProps {
  post: Post;
  userRole: "donor" | "charity";
  onCommentAdded?: (postId: string, comment: PostComment) => void;
}

export function PostCard({ post, userRole, onCommentAdded }: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(post.likes)
  const [isLiking, setIsLiking] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isDonateOpen, setIsDonateOpen] = useState(false)
  const [comments, setComments] = useState<PostComment[]>([])
  const [processedComments, setProcessedComments] = useState<ProcessedComment[]>([])
  const [commentCount, setCommentCount] = useState(post.comments)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    // Get the current user
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Initialize comments from post data
    const rawComments = post.commentsList || [];
    setComments(rawComments);
    
    // Process comments for safe rendering
    const processed = rawComments.map(processComment);
    setProcessedComments(processed);
    
    // For debugging
    if (rawComments.length > 0) {
      console.log('Raw comments:', JSON.stringify(rawComments, null, 2));
    }
  }, [post]);

  // Function to safely process a comment object
  const processComment = (comment: any): ProcessedComment => {
    return {
      id: String(comment._id || comment.id || Math.random()),
      from: typeof comment.from === 'string' ? comment.from : 'Anonymous',
      message: typeof comment.message === 'string' ? comment.message : 
              typeof comment.text === 'string' ? comment.text : 'No message',
      timeAgo: typeof comment.timeAgo === 'string' ? comment.timeAgo : 'Just now'
    };
  };

  const handleLike = async () => {
    if (!currentUser || !post.charity.id) {
      console.warn('Missing required data for like action:', { currentUser, charityId: post.charity.id });
      return;
    }

    const postId = post._id || post.id;
    if (!postId) {
      console.warn('Missing post ID for like action');
      return;
    }

    setIsLiking(true);
    try {
      const result = await likePost(
        post.charity.id.toString(), 
        postId.toString(), 
        currentUser.email
      );
      
      setLikeCount(result.likes);
      setLiked(result.liked);
    } catch (error) {
      console.error('Error liking post:', error);
    } finally {
      setIsLiking(false);
    }
  }

  const handleComment = () => {
    setShowComments(!showComments)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!commentText.trim() || !currentUser) return
    
    setIsSubmittingComment(true)
    
    try {
      // Safely check for charity properties
      const charityId = post.charity && typeof post.charity === 'object' ? 
        (typeof post.charity.id === 'string' ? post.charity.id : 
         (post.charity as any)._id ? (post.charity as any)._id.toString() : '') : '';

      const postId = typeof post._id === 'string' ? post._id : 
                    typeof post.id === 'string' ? post.id : '';

      if (!charityId || !postId) {
        console.error('Missing charity ID or post ID');
        return;
      }
      
      const commentData = {
        from: currentUser.email || "anonymous",
        to: post.charity.name,
        message: commentText
      }
      
      // Make API call to add comment
      const response = await addComment(
        charityId,
        postId,
        commentData
      )
      
      // Add new comment to the post's comments
      if (response) {
        setComments(prev => [...prev, response])
        setCommentText("")
      }
      
      // Call onCommentAdded callback if provided
      if (onCommentAdded) {
        onCommentAdded(postId, response);
      }
    } catch (error) {
      console.error("Error posting comment:", error)
    } finally {
      setIsSubmittingComment(false)
    }
  }

  // Content might be stored in text or content field depending on the source
  const postContent = post.content || post.text || "";

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 mr-2">
              <AvatarImage src={post.charity.avatar || "/placeholder.svg"} alt={post.charity.name} />
              <AvatarFallback>{post.charity.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <Link 
                  href={`/charity/${post.charity.id || ""}`} 
                  className="font-medium hover:underline"
                >
                  {post.charity.name}
                </Link>
                {post.charity.verified && <CheckCircle className="h-4 w-4 ml-1 text-teal-600 fill-white" />}
              </div>
              <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        <div className="mb-4">
          <p className="text-sm">{postContent}</p>
        </div>

        {post.image && (
          <div className="mb-4 rounded-md overflow-hidden">
            <Image
              src={post.image || "/placeholder.svg"}
              alt="Post image"
              width={500}
              height={300}
              className="w-full object-cover"
            />
          </div>
        )}

        <div className="flex items-center text-sm text-muted-foreground">
          <div className="flex items-center mr-4">
            <Heart className="h-4 w-4 mr-1 fill-red-100" />
            <span>{likeCount}</span>
          </div>
          <div className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-1" />
            <span>{commentCount} comments</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex justify-between p-2 pt-0">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 ${liked ? "text-red-500" : ""}`} 
          onClick={handleLike}
          disabled={isLiking || !currentUser}
        >
          {isLiking ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Heart className={`h-4 w-4 mr-2 ${liked ? "fill-red-500" : ""}`} />
          )}
          Like
        </Button>
        <Button variant="ghost" size="sm" className="flex-1" onClick={handleComment}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Comment
        </Button>
        <Button variant="ghost" size="sm" className="flex-1">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
        {userRole === "donor" && (
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 text-teal-600 hover:text-teal-700 hover:bg-teal-50"
            onClick={() => setIsDonateOpen(true)}
          >
            Donate
          </Button>
        )}
      </CardFooter>

      {showComments && (
        <div className="px-4 pb-4">
          <div className="border-t pt-4">
            {/* Existing comments */}
            {processedComments.length > 0 && (
              <div className="space-y-4 mb-4">
                {processedComments.map((comment, index) => (
                  <div key={comment.id || index} className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="/placeholder.svg?height=32&width=32" alt={comment.from} />
                      <AvatarFallback>{comment.from?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">{comment.from}</span>
                          <span className="text-xs text-muted-foreground">{comment.timeAgo}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.message}</p>
                      </div>
                      <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                        <button className="hover:text-foreground">Like</button>
                        <button className="hover:text-foreground">Reply</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment form */}
            {currentUser ? (
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{currentUser.email?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    placeholder="Write a comment..."
                    className="min-h-[80px]"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    disabled={isSubmittingComment}
                  />
                  <div className="mt-2 flex justify-end">
                    <Button 
                      type="submit" 
                      size="sm" 
                      disabled={!commentText.trim() || isSubmittingComment}
                    >
                      {isSubmittingComment ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Posting...
                        </>
                      ) : (
                        'Post'
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="text-center p-4 text-muted-foreground">
                <p>Please log in to leave a comment</p>
              </div>
            )}
          </div>
        </div>
      )}

      {userRole === "donor" && (
        <DonateDialog 
          open={isDonateOpen} 
          onOpenChange={setIsDonateOpen} 
          charity={post.charity.name} 
          charityId={post.charity.id?.toString()}
        />
      )}
    </Card>
  )
}
