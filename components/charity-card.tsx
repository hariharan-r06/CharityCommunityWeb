import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Users, Heart, HeartOff } from "lucide-react"

interface Charity {
  id: number | string
  name: string
  category: string
  avatar: string
  coverImage: string
  description: string
  verified: boolean
  followers: number
  donated: string
}

interface CharityCardProps {
  charity: Charity
  userRole: "donor" | "charity"
  isFollowing?: boolean
  onFollow?: () => void
  onUnfollow?: () => void
}

export function CharityCard({ 
  charity, 
  userRole, 
  isFollowing = false, 
  onFollow, 
  onUnfollow 
}: CharityCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative h-24">
        <Image
          src={charity.coverImage || "/placeholder.svg"}
          alt={`${charity.name} cover`}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-between -mt-8">
          <Avatar className="h-16 w-16 border-4 border-background">
            <AvatarImage src={charity.avatar || "/placeholder.svg"} alt={charity.name} />
            <AvatarFallback>{charity.name[0]}</AvatarFallback>
          </Avatar>
          <Badge variant="outline" className="mt-10 bg-background">
            {charity.category}
          </Badge>
        </div>
        <div className="mt-2">
          <div className="flex items-center">
            <Link href={`/charity/${charity.id}`} className="font-bold hover:underline">
              {charity.name}
            </Link>
            {charity.verified && <CheckCircle className="h-4 w-4 ml-1 text-teal-600 fill-white" />}
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{charity.description}</p>
        </div>
        <div className="flex items-center mt-4 text-sm text-muted-foreground">
          <Users className="h-4 w-4 mr-1" />
          <span>{charity.followers} followers</span>
          <span className="mx-2">•</span>
          <span>You donated: {charity.donated}</span>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex gap-2">
        {userRole === "donor" && (
          <>
            {isFollowing ? (
              <Button 
                variant="outline" 
                className="flex-1 border-red-300 hover:bg-red-50 hover:text-red-600"
                onClick={onUnfollow}
              >
                <HeartOff className="mr-2 h-4 w-4" />
                Unfollow
              </Button>
            ) : (
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={onFollow}
              >
                <Heart className="mr-2 h-4 w-4" />
                Follow
              </Button>
            )}
            <Button className="flex-1 bg-teal-600 hover:bg-teal-700">Donate</Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
