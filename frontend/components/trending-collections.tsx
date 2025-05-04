import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const trendingCollections = [
  {
    id: 1,
    name: "Bored Ape Yacht Club",
    creator: "yuga_labs",
    floorPrice: "70.5 ETH",
    volume: "12,345 ETH",
    items: 10000,
    owners: 6452,
    change: "+12.5%",
    mainImage: "/placeholder.svg?height=300&width=300",
    subImages: [
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
    ],
  },
  {
    id: 2,
    name: "Azuki",
    creator: "azuki_team",
    floorPrice: "15.2 ETH",
    volume: "8,765 ETH",
    items: 10000,
    owners: 5123,
    change: "+8.3%",
    mainImage: "/placeholder.svg?height=300&width=300",
    subImages: [
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
    ],
  },
  {
    id: 3,
    name: "Doodles",
    creator: "doodles_team",
    floorPrice: "8.7 ETH",
    volume: "5,432 ETH",
    items: 10000,
    owners: 4876,
    change: "+5.2%",
    mainImage: "/placeholder.svg?height=300&width=300",
    subImages: [
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
    ],
  },
  {
    id: 4,
    name: "CryptoPunks",
    creator: "larva_labs",
    floorPrice: "65.3 ETH",
    volume: "10,987 ETH",
    items: 10000,
    owners: 3542,
    change: "+3.8%",
    mainImage: "/placeholder.svg?height=300&width=300",
    subImages: [
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
      "/placeholder.svg?height=100&width=100",
    ],
  },
]

export default function TrendingCollections() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {trendingCollections.map((collection) => (
        <Link href={`/collection/${collection.id}`} key={collection.id}>
          <Card className="overflow-hidden transition-all hover:border-primary/50 hover:shadow-md h-full">
            <CardContent className="p-4">
              <div className="relative mb-4">
                <Image
                  src={collection.mainImage || "/placeholder.svg"}
                  alt={collection.name}
                  width={300}
                  height={300}
                  className="aspect-square object-cover w-full rounded-xl"
                />
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 h-8 w-8 rounded-full bg-primary border-4 border-background"></div>
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-semibold truncate">{collection.name}</h3>
                <p className="text-xs text-muted-foreground mb-3">by @{collection.creator}</p>
                <div className="grid grid-cols-3 gap-2 mt-4">
                  {collection.subImages.map((img, index) => (
                    <div key={index} className="aspect-square rounded-lg overflow-hidden">
                      <Image
                        src={img || "/placeholder.svg"}
                        alt={`${collection.name} item ${index + 1}`}
                        width={100}
                        height={100}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 grid grid-cols-2 gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Floor Price</p>
                <p className="font-medium">{collection.floorPrice}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Volume</p>
                <div className="flex items-center justify-end gap-1">
                  <p className="font-medium">{collection.volume}</p>
                  <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500 border-green-500/20">
                    {collection.change}
                  </Badge>
                </div>
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  )
}
