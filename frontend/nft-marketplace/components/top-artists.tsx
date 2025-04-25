import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { VerifiedIcon } from "lucide-react"

const topArtists = [
  {
    id: 1,
    name: "Alex Maxwell",
    username: "cosmic_artist",
    verified: true,
    volume: "1,245 ETH",
    change: "+12.5%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 2,
    name: "Sophia Chen",
    username: "future_labs",
    verified: true,
    volume: "987 ETH",
    change: "+8.3%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 3,
    name: "Marcus Johnson",
    username: "art_collective",
    verified: false,
    volume: "765 ETH",
    change: "+5.2%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 4,
    name: "Olivia Kim",
    username: "cyber_visuals",
    verified: true,
    volume: "654 ETH",
    change: "+3.8%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 5,
    name: "Daniel Lee",
    username: "neon_dreams",
    verified: false,
    volume: "543 ETH",
    change: "+2.7%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 6,
    name: "Emma Wilson",
    username: "digital_emma",
    verified: true,
    volume: "432 ETH",
    change: "+1.9%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 7,
    name: "James Rodriguez",
    username: "crypto_james",
    verified: false,
    volume: "321 ETH",
    change: "+1.5%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
  {
    id: 8,
    name: "Mia Thompson",
    username: "mia_creates",
    verified: true,
    volume: "210 ETH",
    change: "+0.8%",
    avatar: "/placeholder.svg?height=100&width=100",
  },
]

export default function TopArtists() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {topArtists.map((artist, index) => (
        <Link href={`/artist/${artist.id}`} key={artist.id}>
          <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full overflow-hidden">
                    <Image
                      src={artist.avatar || "/placeholder.svg"}
                      alt={artist.name}
                      width={100}
                      height={100}
                      className="object-cover"
                    />
                  </div>
                  <div className="absolute -top-1 -right-1 bg-background rounded-full p-0.5">
                    <Badge className="h-5 w-5 p-0 flex items-center justify-center rounded-full bg-primary text-white">
                      {index + 1}
                    </Badge>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="font-semibold">{artist.name}</h3>
                    {artist.verified && <VerifiedIcon className="h-4 w-4 text-primary" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{artist.username}</p>
                </div>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">Volume</p>
                  <div className="flex items-center gap-1">
                    <p className="font-medium">{artist.volume}</p>
                    <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                      {artist.change}
                    </Badge>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="rounded-full">
                  Follow
                </Button>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
