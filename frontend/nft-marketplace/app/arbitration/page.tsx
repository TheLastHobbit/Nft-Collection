"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle, Clock, Users } from "lucide-react"

export default function ArbitrationPage() {
  // 模拟争议列表数据
  const [disputes, setDisputes] = useState([
    {
      id: 1,
      nftTitle: "宇宙视角 #31",
      nftImage: "/placeholder.svg?height=400&width=400",
      seller: "cosmic_artist",
      buyer: "art_collector",
      amount: "2.5 ETH",
      disputeDate: "2024-04-20",
      status: "进行中",
      votes: { seller: 12, buyer: 8 },
      requiredVotes: 25,
      description: "买家声称NFT与描述不符，卖家坚持认为描述准确。",
      timeLeft: "2天12小时",
    },
    {
      id: 2,
      nftTitle: "数字梦境 #08",
      nftImage: "/placeholder.svg?height=400&width=400",
      seller: "future_labs",
      buyer: "nft_enthusiast",
      amount: "1.8 ETH",
      disputeDate: "2024-04-18",
      status: "进行中",
      votes: { seller: 15, buyer: 10 },
      requiredVotes: 31,
      description: "交易完成后，买家发现NFT的元数据有问题。",
      timeLeft: "1天8小时",
    },
    {
      id: 3,
      nftTitle: "抽象领域",
      nftImage: "/placeholder.svg?height=400&width=400",
      seller: "art_collective",
      buyer: "digital_collector",
      amount: "3.2 ETH",
      disputeDate: "2024-04-15",
      status: "已解决",
      votes: { seller: 18, buyer: 25 },
      requiredVotes: 43,
      description: "买家认为NFT是抄袭作品，仲裁结果支持买家。",
      timeLeft: "已结束",
    },
    {
      id: 4,
      nftTitle: "霓虹创世 #12",
      nftImage: "/placeholder.svg?height=400&width=400",
      seller: "cyber_visuals",
      buyer: "meta_investor",
      amount: "1.4 ETH",
      disputeDate: "2024-04-12",
      status: "已解决",
      votes: { seller: 22, buyer: 11 },
      requiredVotes: 33,
      description: "买家声称没有收到NFT，但交易记录显示已转移。仲裁结果支持卖家。",
      timeLeft: "已结束",
    },
  ])

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 筛选争议
  const filteredDisputes = disputes.filter((dispute) => {
    // 状态筛选
    if (statusFilter !== "all" && dispute.status !== statusFilter) return false

    // 搜索筛选
    if (
      searchQuery &&
      !dispute.nftTitle.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !dispute.seller.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !dispute.buyer.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    return true
  })

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">仲裁大厅</h1>
          <p className="text-muted-foreground">参与解决交易争议，维护平台公正</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="搜索争议..."
              className="pl-8 w-[200px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部</SelectItem>
              <SelectItem value="进行中">进行中</SelectItem>
              <SelectItem value="已解决">已解决</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredDisputes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisputes.map((dispute) => (
            <Link href={`/arbitration/${dispute.id}`} key={dispute.id}>
              <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md h-full">
                <div className="relative">
                  <Image
                    src={dispute.nftImage || "/placeholder.svg"}
                    alt={dispute.nftTitle}
                    width={400}
                    height={400}
                    className="aspect-square object-cover w-full"
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      dispute.status === "进行中"
                        ? "bg-amber-500/90 hover:bg-amber-500/90"
                        : "bg-green-500/90 hover:bg-green-500/90"
                    }`}
                  >
                    {dispute.status}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold truncate">{dispute.nftTitle}</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">卖家:</span>
                      <span>@{dispute.seller}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">买家:</span>
                      <span>@{dispute.buyer}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">金额:</span>
                      <span className="font-medium">{dispute.amount}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2">{dispute.description}</p>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex justify-between items-center">
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{dispute.timeLeft}</span>
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {dispute.votes.seller + dispute.votes.buyer}/{dispute.requiredVotes}
                    </span>
                  </div>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">没有找到符合条件的争议</h3>
          <p className="text-muted-foreground">尝试更改筛选条件或稍后再查看</p>
        </div>
      )}
    </div>
  )
}
