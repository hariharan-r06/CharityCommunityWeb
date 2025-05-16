"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { ImagePlus, X, Loader2 } from "lucide-react"
import { createPost } from "@/services/apiService"
import { auth } from "@/app/firebase"
import { useToast } from "@/components/ui/use-toast"

interface CreatePostFormProps {
  charityId: string;
  charityName: string;
  charityAvatar?: string;
  onPostCreated?: () => void;
}

export function CreatePostForm({ charityId, charityName, charityAvatar, onPostCreated }: CreatePostFormProps) {
  const [text, setText] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Function to convert selected image file to base64 with size and quality checks
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Create a canvas element to resize/compress the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      // Create a FileReader to read the image
      const reader = new FileReader();
      reader.readAsDataURL(file);
      
      reader.onload = function(event) {
        if (!event.target || !event.target.result) {
          reject(new Error('Failed to read file'));
          return;
        }
        
        img.src = event.target.result as string;
        
        img.onload = function() {
          // Set maximum dimensions for the image
          const MAX_WIDTH = 1200;
          const MAX_HEIGHT = 1200;
          
          let width = img.width;
          let height = img.height;
          
          // Resize the image if it's too large
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
          
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
          
          // Set canvas dimensions and draw the resized image
          canvas.width = width;
          canvas.height = height;
          
          if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with reduced quality
          const quality = 0.7; // Adjust as needed, lower = smaller file size
          const base64 = canvas.toDataURL('image/jpeg', quality);
          
          console.log(`Original file size: ${Math.round(file.size / 1024)}KB`);
          console.log(`Compressed image base64 length: ${base64.length} characters`);
          
          resolve(base64);
        };
        
        img.onerror = function() {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = function(error) {
        reject(error);
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Post content cannot be empty",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    try {
      let finalImageUrl = imageUrl;
      
      // If a file was selected, convert it to base64 for transmission
      if (selectedImage) {
        try {
          console.log("Converting image to base64...");
          finalImageUrl = await getBase64(selectedImage);
          console.log("Image conversion complete. Base64 string length:", finalImageUrl.length);
        } catch (error) {
          console.error("Error converting image to base64:", error);
          toast({
            title: "Error",
            description: "Failed to process image. Please try again.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create post data with the image (either URL or base64)
      const postData = {
        text,
        image: finalImageUrl || undefined
      }

      console.log("Creating post with image:", finalImageUrl ? `Image included (${Math.round(finalImageUrl.length / 1024)}KB)` : "No image");
      
      // Send the post data to the API
      const result = await createPost(charityId, postData)
      
      console.log("Post created successfully:", result);
      
      // Reset form
      setText("")
      setImageUrl("")
      setSelectedImage(null)
      setImagePreviewUrl(null)
      
      // Notify parent component
      if (onPostCreated) {
        onPostCreated()
      }

      toast({
        title: "Success",
        description: "Post created successfully",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to create post:", error)
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value)
    // Clear file selection if URL is entered
    if (e.target.value) {
      setSelectedImage(null)
      setImagePreviewUrl(null)
    }
  }

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      
      // Check file size (limit to 3MB)
      if (file.size > 3 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image size should be less than 3MB",
          variant: "destructive"
        });
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Error",
          description: "Please select an image file",
          variant: "destructive"
        });
        return;
      }
      
      console.log(`Selected file: ${file.name}, size: ${Math.round(file.size / 1024)}KB, type: ${file.type}`);
      setSelectedImage(file)
      
      // Create preview URL
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
      
      // Clear URL input if file is selected
      setImageUrl("")
    }
  }

  const removeImage = () => {
    setImageUrl("")
    setSelectedImage(null)
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl)
      setImagePreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Card className="mb-6">
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={charityAvatar || "/placeholder.svg"} alt={charityName} />
            <AvatarFallback>{charityName[0]}</AvatarFallback>
          </Avatar>
          <form onSubmit={handleSubmit} className="flex-1">
            <Textarea
              placeholder={`Share an update as ${charityName}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              className="mb-3 min-h-[100px]"
            />
            
            {imagePreviewUrl ? (
              <div className="relative mb-3">
                <img
                  src={imagePreviewUrl}
                  alt="Post image preview"
                  className="w-full h-auto max-h-[300px] object-cover rounded-md"
                  onError={() => {
                    toast({
                      title: "Error",
                      description: "Invalid image file",
                      variant: "destructive"
                    })
                    removeImage()
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : imageUrl ? (
              <div className="relative mb-3">
                <img
                  src={imageUrl}
                  alt="Post image preview"
                  className="w-full h-auto max-h-[300px] object-cover rounded-md"
                  onError={() => {
                    toast({
                      title: "Error",
                      description: "Invalid image URL",
                      variant: "destructive"
                    })
                    removeImage()
                  }}
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-7 w-7 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="mb-3">
                <div className="flex gap-2 items-center">
                  <Input
                    type="url"
                    placeholder="Image URL (optional)"
                    value={imageUrl}
                    onChange={handleImageUrlChange}
                    disabled={isSubmitting}
                  />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={triggerFileInput}
                    disabled={isSubmitting}
                  >
                    <ImagePlus className="h-4 w-4 mr-2" />
                    Upload Image
                  </Button>
                </div>
              </div>
            )}
            
            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-teal-600 hover:bg-teal-700"
                disabled={!text.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Post Update"
                )}
              </Button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  )
} 