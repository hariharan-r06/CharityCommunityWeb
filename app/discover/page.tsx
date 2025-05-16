"use client"

import { useState, useEffect } from "react"
import { MainNav } from "@/components/main-nav"
import { UserNav } from "@/components/user-nav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CharityCard } from "@/components/charity-card"
import { Search, Filter } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Mock data
const mockUser = {
  name: "Alex Johnson",
  email: "alex@example.com",
  role: "donor" as const,
}

const mockCharities = [
  {
    id: 1,
    name: "Clean Water Initiative",
    category: "Environment",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Providing clean water solutions to communities in need around the world.",
    verified: true,
    followers: 1240,
    donated: "$350",
  },
  {
    id: 2,
    name: "Education For All",
    category: "Education",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Building schools and providing educational resources to underserved communities.",
    verified: true,
    followers: 980,
    donated: "$250",
  },
  {
    id: 3,
    name: "Wildlife Protection Fund",
    category: "Animal Welfare",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Protecting endangered species and their habitats through conservation efforts.",
    verified: true,
    followers: 1560,
    donated: "$150",
  },
  {
    id: 4,
    name: "Hunger Relief Network",
    category: "Humanitarian",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Fighting hunger through food banks and meal programs for those in need.",
    verified: true,
    followers: 2100,
    donated: "$0",
  },
  {
    id: 5,
    name: "Mental Health Alliance",
    category: "Health",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Providing mental health resources and support to communities worldwide.",
    verified: true,
    followers: 1850,
    donated: "$0",
  },
  {
    id: 6,
    name: "Arts & Culture Foundation",
    category: "Arts",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Supporting artists and cultural programs to enrich communities through the arts.",
    verified: true,
    followers: 920,
    donated: "$0",
  },
  {
    id: 7,
    name: "Disaster Relief Team",
    category: "Humanitarian",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Providing immediate assistance to communities affected by natural disasters.",
    verified: true,
    followers: 1750,
    donated: "$0",
  },
  {
    id: 8,
    name: "Children's Health Fund",
    category: "Health",
    avatar: "/placeholder.svg?height=60&width=60",
    coverImage: "/placeholder.svg?height=100&width=300",
    description: "Ensuring all children have access to quality healthcare and medical treatments.",
    verified: true,
    followers: 1320,
    donated: "$0",
  },
]

export default function DiscoverPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [filteredCharities, setFilteredCharities] = useState(mockCharities)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let filtered = mockCharities

    if (searchQuery) {
      filtered = filtered.filter(
        (charity) =>
          charity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          charity.description.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter((charity) => charity.category === categoryFilter)
    }

    setFilteredCharities(filtered)
  }, [searchQuery, categoryFilter])

  if (!mounted) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <MainNav role="donor" />
      <div className="container flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-teal-700">Discover Charities</h2>
            <p className="text-muted-foreground">Find and support verified charitable organizations</p>
          </div>
          <UserNav user={mockUser} />
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search charities..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Environment">Environment</SelectItem>
                <SelectItem value="Education">Education</SelectItem>
                <SelectItem value="Animal Welfare">Animal Welfare</SelectItem>
                <SelectItem value="Humanitarian">Humanitarian</SelectItem>
                <SelectItem value="Health">Health</SelectItem>
                <SelectItem value="Arts">Arts & Culture</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Charities</TabsTrigger>
            <TabsTrigger value="trending">Trending</TabsTrigger>
            <TabsTrigger value="recommended">Recommended</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredCharities.length > 0 ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredCharities.map((charity) => (
                  <CharityCard key={charity.id} charity={charity} userRole="donor" />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No charities found matching your search.</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("")
                    setCategoryFilter("all")
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trending" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharities.slice(0, 4).map((charity) => (
                <CharityCard key={charity.id} charity={charity} userRole="donor" />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="recommended" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredCharities.slice(3, 7).map((charity) => (
                <CharityCard key={charity.id} charity={charity} userRole="donor" />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
