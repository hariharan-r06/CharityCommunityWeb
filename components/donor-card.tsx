import Link from "next/link"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { MessageSquare, DollarSign, Clock } from "lucide-react"

interface Donor {
  id: number
  name: string
  avatar: string
  donated: string
  since: string
  lastDonation: string
}

interface DonorCardProps {
  donor: Donor
}

export function DonorCard({ donor }: DonorCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={donor.avatar || "/placeholder.svg"} alt={donor.name} />
            <AvatarFallback>{donor.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <Link href={`/donor/${donor.id}`} className="font-bold hover:underline">
              {donor.name}
            </Link>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <DollarSign className="h-4 w-4 mr-1" />
              <span>Total donated: {donor.donated}</span>
            </div>
            <div className="flex items-center text-sm text-muted-foreground mt-1">
              <Clock className="h-4 w-4 mr-1" />
              <span>Supporter since {donor.since}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Last donation: {donor.lastDonation}</div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button variant="outline" className="w-full">
          <MessageSquare className="h-4 w-4 mr-2" />
          Send Message
        </Button>
      </CardFooter>
    </Card>
  )
}
