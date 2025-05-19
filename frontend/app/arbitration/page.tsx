"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, AlertTriangle, Clock, Users } from "lucide-react"
import * as marketClient from "@/utils/market.client"
import * as nftClient from "@/utils/nft.client"
import { toast } from "sonner"
import { useWalletContext } from "@/components/wallet-provider"

export default function ArbitrationPage() {
  const { address } = useWalletContext()
  const [disputes, setDisputes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  // 获取合约中的纠纷列表
  const fetchDisputes = async () => {
    setLoading(true)
    try {
      const fetchedDisputes = await marketClient.getAllDisputes()
      console.log("fetchedDisputes:",fetchedDisputes)
      const disputesWithDetails = await Promise.all(
        fetchedDisputes.map(async (dispute: any) => {
          const requestId = dispute.voteRequestId
          const voteStatus = requestId > 0 ? await marketClient.getDisputeVoteDetails(requestId) : null
          console.log("dispute.tokenId:",dispute.tokenId)
          const nftMetadata = await nftClient.getMetadata(dispute.tokenId)
          return {
            id: dispute.tokenId,
            nftTitle: nftMetadata.title || "未知 NFT",
            nftImage: nftMetadata.imageURL || "/placeholder.png",
            seller: dispute.seller,
            buyer: dispute.buyer,
            amount: `${dispute.amount.toFixed(2)} cUSDT`,
            disputeDate: new Date(dispute.timestamp * 1000).toLocaleDateString(),
            status: dispute.result === 0 ? "进行中" : dispute.result === 1 ? "买家胜" : "卖家胜",
            votes: voteStatus
              ? { seller: voteStatus.approveBuyerCount, buyer: voteStatus.voteCount - voteStatus.approveBuyerCount }
              : { seller: 0, buyer: 0 },
            requiredVotes: 3, // 假设需要 3 票
            description: "争议涉及 NFT 交易，双方对商品描述一致性有分歧。",
            timeLeft: dispute.result === 0 ? calculateTimeLeft(dispute.timestamp) : "已结束",
          }
        })
      )
      setDisputes(disputesWithDetails)
    } catch (error) {
      console.error("获取纠纷失败:", error)
      toast.error("获取纠纷失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  // 计算剩余时间
  const calculateTimeLeft = (timestamp: number) => {
    const disputeEndTime = timestamp * 1000 + 7 * 24 * 60 * 60 * 1000 // 假设 7 天截止
    const now = Date.now()
    const timeLeftMs = disputeEndTime - now
    if (timeLeftMs <= 0) return "已结束"
    const days = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${days}天${hours}小时`
  }

  useEffect(() => {
    fetchDisputes()
  }, [address])

  // 筛选争议
  const filteredDisputes = disputes.filter((dispute) => {
    if (statusFilter !== "all" && dispute.status !== statusFilter) return false
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
              placeholder="搜索 NFT 标题或地址..."
              className="pl-8 w-[200px] md:w-[250px]"
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
              <SelectItem value="买家胜">买家胜</SelectItem>
              <SelectItem value="卖家胜">卖家胜</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <p>加载中...</p>
        </div>
      ) : filteredDisputes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDisputes.map((dispute) => (
            <Link href={`/arbitration/${dispute.id}`} key={dispute.id}>
              <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md h-full">
                <div className="relative">
                  <Image
                    src={dispute.nftImage}
                    alt={dispute.nftTitle}
                    width={400}
                    height={400}
                    className="aspect-square object-cover w-full"
                   
                  />
                  <Badge
                    className={`absolute top-2 right-2 ${
                      dispute.status === "进行中"
                        ? "bg-amber-500/90 hover:bg-amber-500/90"
                        : dispute.status === "买家胜"
                        ? "bg-blue-500/90 hover:bg-blue-500/90"
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
                      <span>{truncateAddress(dispute.seller)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">买家:</span>
                      <span>{truncateAddress(dispute.buyer)}</span>
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

// 截断地址显示
function truncateAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}