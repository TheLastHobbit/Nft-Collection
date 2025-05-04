import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Heart, Clock } from "lucide-react"

const featuredNFTs = [
  {
    id: 1,
    title: "Cosmic Perspective #31",
    creator: "cosmic_artist",
    price: "2.5 ETH",
    bid: "2.3 ETH",
    timeLeft: "3h 50m",
    likes: 159,
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 2,
    title: "Digital Dreams #08",
    creator: "future_labs",
    price: "1.8 ETH",
    bid: "1.65 ETH",
    timeLeft: "6h 20m",
    likes: 94,
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 3,
    title: "Abstract Realms",
    creator: "art_collective",
    price: "3.2 ETH",
    bid: "3.0 ETH",
    timeLeft: "1h 15m",
    likes: 210,
    image: "/placeholder.svg?height=400&width=400",
  },
  {
    id: 4,
    title: "Neon Genesis #12",
    creator: "cyber_visuals",
    price: "1.4 ETH",
    bid: "1.2 ETH",
    timeLeft: "4h 10m",
    likes: 87,
    image: "/placeholder.svg?height=400&width=400",
  },
]

export default function FeaturedNFTs() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {featuredNFTs.map((nft) => (
        <Link href={`/nft/${nft.id}`} key={nft.id}>
          <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
            <div className="relative">
              <Image
                src={nft.image || "/placeholder.svg"}
                alt={nft.title}
                width={400}
                height={400}
                className="aspect-square object-cover w-full"
              />
              <div className="absolute top-3 right-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                >
                  <Heart className="h-4 w-4" />
                  <span className="sr-only">Like</span>
                </Button>
              </div>
              <div className="absolute bottom-3 left-3">
                <Badge variant="secondary" className="bg-background/80 backdrop-blur-sm">
                  <Clock className="h-3 w-3 mr-1" />
                  {nft.timeLeft}
                </Badge>
              </div>
            </div>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-6 w-6 rounded-full bg-primary"></div>
                <span className="text-xs text-muted-foreground">@{nft.creator}</span>
              </div>
              <h3 className="font-semibold truncate">{nft.title}</h3>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Current Bid</p>
                <p className="font-medium">{nft.bid}</p>
              </div>
              <Button size="sm" variant="outline" className="rounded-full">
                Place Bid
              </Button>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
