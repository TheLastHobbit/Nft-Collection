"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, Users, ThumbsUp, ArrowLeft, CheckCircle2, XCircle, Info } from "lucide-react"

export default function ArbitrationDetailPage({ params }: { params: { id: string } }) {
  // 模拟争议详情数据
  const [dispute, setDispute] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)

  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      const disputeData = {
        id: Number.parseInt(params.id),
        nftTitle: "二手苹果充电宝",
        nftImage: "/1.png",
        seller: {
          username: "0x01f93051A949971c812E57b9802B7749f53534B6",
          avatar: "/placeholder.svg?height=100&width=100",
          argument:
            "我提供的充电宝完全符合描述，功能全部正常。买家在购买前已经查看了完整的预览和详细信息，并同意了交易条款。这是一个有效的交易，应该维持原状。",
        },
        buyer: {
          username: "0xb5B60f020d741069C28b84EeA3Ad8D08385eD4D3",
          avatar: "/placeholder.svg?height=100&width=100",
          argument:
            "我购买的二手充电宝与卖家描述的有重大差异。元数据中承诺的功能完好并不存在，这严重影响了二手商品的价值。我要求退款或者卖家提供符合原始描述的二手商品。",
        },
        transaction: {
          txHash: "0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t",
          amount: "2.5 ETH",
          date: "2025-04-15 14:30:22",
          blockNumber: "18245367",
        },
        disputeDate: "2025-04-20",
        status: "进行中",
        votes: { seller: 12, buyer: 8 },
        requiredVotes: 25,
        description: "买家声称充电宝功能损坏与描述不符，卖家坚持功能正常。",
        timeLeft: "2天12小时",
        evidence: [
          {
            title: "原始描述截图",
            description: "NFT上架时的原始描述和特性列表",
            type: "image",
            url: "/placeholder.svg?height=300&width=300",
            submittedBy: "buyer",
          },
          {
            title: "交易确认截图",
            description: "买家确认交易的截图，显示了同意条款",
            type: "image",
            url: "/placeholder.svg?height=300&width=300",
            submittedBy: "seller",
          },
          {
            title: "元数据比较",
            description: "原始承诺的元数据与实际交付的元数据比较",
            type: "document",
            url: "#",
            submittedBy: "buyer",
          },
        ],
        updates: [
          {
            date: "2025-04-20",
            content: "争议已提交，等待仲裁",
          },
          {
            date: "2025-04-21",
            content: "卖家提交了回应和证据",
          },
          {
            date: "2025-04-22",
            content: "买家提交了额外证据",
          },
        ],
      }

      setDispute(disputeData)
      setLoading(false)
    }, 1000)
  }, [params.id])

  // 计算投票进度
  const calculateProgress = () => {
    if (!dispute) return { seller: 0, buyer: 0, total: 0 }

    const totalVotes = dispute.votes.seller + dispute.votes.buyer
    const sellerPercentage = totalVotes > 0 ? (dispute.votes.seller / totalVotes) * 100 : 0
    const buyerPercentage = totalVotes > 0 ? (dispute.votes.buyer / totalVotes) * 100 : 0

    return {
      seller: sellerPercentage,
      buyer: buyerPercentage,
      total: (totalVotes / dispute.requiredVotes) * 100,
    }
  }

  // 处理投票
  const handleVote = (party: string) => {
    if (voteSubmitted) return

    setUserVote(party)

    // 模拟投票提交
    setTimeout(() => {
      setDispute((prev) => {
        const updatedVotes = { ...prev.votes }
        updatedVotes[party] += 1

        // 检查是否达到所需票数
        const totalVotes = updatedVotes.seller + updatedVotes.buyer
        let updatedStatus = prev.status

        if (totalVotes >= prev.requiredVotes) {
          updatedStatus = "已解决"
        }

        return {
          ...prev,
          votes: updatedVotes,
          status: updatedStatus,
          timeLeft: updatedStatus === "已解决" ? "已结束" : prev.timeLeft,
        }
      })

      setVoteSubmitted(true)
    }, 1000)
  }

  // 判断争议结果
  const getDisputeResult = () => {
    if (!dispute || dispute.status !== "已解决") return null

    if (dispute.votes.seller > dispute.votes.buyer) {
      return {
        winner: "seller",
        message: "仲裁结果支持卖家，交易有效。",
      }
    } else {
      return {
        winner: "buyer",
        message: "仲裁结果支持买家，交易已撤销。",
      }
    }
  }

  if (loading) {
    return (
      <div className="container px-4 py-8 text-center">
        <p>加载中...</p>
      </div>
    )
  }

  if (!dispute) {
    return (
      <div className="container px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">未找到争议</h3>
        <p className="text-muted-foreground mb-6">该争议可能已被删除或不存在</p>
        <Link href="/arbitration">
          <Button>返回仲裁大厅</Button>
        </Link>
      </div>
    )
  }

  const progress = calculateProgress()
  const disputeResult = getDisputeResult()

  return (
    <div className="container px-4 py-8">
      <div className="mb-6">
        <Link href="/arbitration" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>返回仲裁大厅</span>
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{dispute.nftTitle} 争议</h1>
            <Badge
              className={
                dispute.status === "进行中" ? "bg-amber-500 hover:bg-amber-500" : "bg-green-500 hover:bg-green-500"
              }
            >
              {dispute.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{dispute.description}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{dispute.timeLeft}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>
              {dispute.votes.seller + dispute.votes.buyer}/{dispute.requiredVotes} 票
            </span>
          </div>
        </div>
      </div>

      {disputeResult && (
        <Alert
          className={`mb-6 ${disputeResult.winner === "seller" ? "bg-green-500/10 border-green-500/20" : "bg-blue-500/10 border-blue-500/20"}`}
        >
          {disputeResult.winner === "seller" ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <XCircle className="h-4 w-4 text-blue-500" />
          )}
          <AlertTitle>争议已解决</AlertTitle>
          <AlertDescription>{disputeResult.message}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 左侧 - NFT和交易信息 */}
        <div>
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-4">
                <Image
                  src={dispute.nftImage || "/placeholder.svg"}
                  alt={dispute.nftTitle}
                  fill
                  className="object-cover"
                />
              </div>
              <h3 className="font-semibold text-lg mb-4">交易信息</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">交易金额</p>
                  <p className="font-medium">{dispute.transaction.amount}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">交易日期</p>
                  <p>{dispute.transaction.date}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">交易哈希</p>
                  <p className="text-sm font-mono truncate">{dispute.transaction.txHash}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">区块高度</p>
                  <p>{dispute.transaction.blockNumber}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>争议进度</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dispute.updates.map((update: any, index: number) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative">
                      <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-xs text-white">
                        {index + 1}
                      </div>
                      {index < dispute.updates.length - 1 && (
                        <div className="absolute top-6 bottom-0 left-1/2 w-px -translate-x-1/2 bg-border h-full"></div>
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium">{update.date}</p>
                      <p className="text-sm text-muted-foreground">{update.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 中间 - 双方观点 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <Image
                    src={dispute.seller.avatar || "/placeholder.svg"}
                    alt={dispute.seller.username}
                    width={100}
                    height={100}
                    className="object-cover"
                  />
                </div>
                <div>
                  <CardTitle className="text-base">卖家观点</CardTitle>
                  <CardDescription>@{dispute.seller.username}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{dispute.seller.argument}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>支持率: {progress.seller.toFixed(1)}%</span>
                  <span>{dispute.votes.seller} 票</span>
                </div>
                <Progress value={progress.seller} className="h-2" />
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <Image
                    src={dispute.buyer.avatar || "/placeholder.svg"}
                    alt={dispute.buyer.username}
                    width={100}
                    height={100}
                    className="object-cover"
                  />
                </div>
                <div>
                  <CardTitle className="text-base">买家观点</CardTitle>
                  <CardDescription>@{dispute.buyer.username}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm">{dispute.buyer.argument}</p>
            </CardContent>
            <CardFooter className="pt-0">
              <div className="w-full">
                <div className="flex justify-between text-sm mb-1">
                  <span>支持率: {progress.buyer.toFixed(1)}%</span>
                  <span>{dispute.votes.buyer} 票</span>
                </div>
                <Progress value={progress.buyer} className="h-2" />
              </div>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>证据材料</CardTitle>
              <CardDescription>双方提交的证据</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="all">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="all">全部</TabsTrigger>
                  <TabsTrigger value="seller">卖家</TabsTrigger>
                  <TabsTrigger value="buyer">买家</TabsTrigger>
                </TabsList>
                <TabsContent value="all" className="mt-4 space-y-4">
                  {dispute.evidence.map((evidence: any, index: number) => (
                    <div key={index} className="flex gap-3">
                      {evidence.type === "image" ? (
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                          <Image
                            src={evidence.url || "/placeholder.svg"}
                            alt={evidence.title}
                            width={100}
                            height={100}
                            className="object-cover h-full w-full"
                          />
                        </div>
                      ) : (
                        <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                          <Info className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{evidence.title}</p>
                        <p className="text-xs text-muted-foreground">{evidence.description}</p>
                        <p className="text-xs mt-1">
                          提交者:{" "}
                          <span className="text-primary">
                            @{evidence.submittedBy === "seller" ? dispute.seller.username : dispute.buyer.username}
                          </span>
                        </p>
                      </div>
                    </div>
                  ))}
                </TabsContent>
                <TabsContent value="seller" className="mt-4 space-y-4">
                  {dispute.evidence
                    .filter((e: any) => e.submittedBy === "seller")
                    .map((evidence: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        {evidence.type === "image" ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={evidence.url || "/placeholder.svg"}
                              alt={evidence.title}
                              width={100}
                              height={100}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                            <Info className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{evidence.title}</p>
                          <p className="text-xs text-muted-foreground">{evidence.description}</p>
                        </div>
                      </div>
                    ))}
                </TabsContent>
                <TabsContent value="buyer" className="mt-4 space-y-4">
                  {dispute.evidence
                    .filter((e: any) => e.submittedBy === "buyer")
                    .map((evidence: any, index: number) => (
                      <div key={index} className="flex gap-3">
                        {evidence.type === "image" ? (
                          <div className="h-16 w-16 rounded-md overflow-hidden bg-muted">
                            <Image
                              src={evidence.url || "/placeholder.svg"}
                              alt={evidence.title}
                              width={100}
                              height={100}
                              className="object-cover h-full w-full"
                            />
                          </div>
                        ) : (
                          <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center">
                            <Info className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-sm">{evidence.title}</p>
                          <p className="text-xs text-muted-foreground">{evidence.description}</p>
                        </div>
                      </div>
                    ))}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - 投票区域 */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>参与投票</CardTitle>
              <CardDescription>您的投票将帮助解决此争议。请仔细阅读双方观点和证据后再投票。</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>总投票进度</span>
                    <span>
                      {dispute.votes.seller + dispute.votes.buyer}/{dispute.requiredVotes}
                    </span>
                  </div>
                  <Progress value={progress.total} className="h-2" />
                </div>

                {dispute.status === "进行中" ? (
                  <div className="space-y-4 pt-4">
                    {!voteSubmitted ? (
                      <>
                        <Alert>
                          <AlertTriangle className="h-4 w-4" />
                          <AlertTitle>投票提示</AlertTitle>
                          <AlertDescription>投票一旦提交无法更改。请确保您已仔细阅读所有信息。</AlertDescription>
                        </Alert>

                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            onClick={() => handleVote("seller")}
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center"
                          >
                            <ThumbsUp className="h-6 w-6 mb-2" />
                            <span className="font-medium">支持卖家</span>
                            <span className="text-xs text-muted-foreground mt-1">@{dispute.seller.username}</span>
                          </Button>

                          <Button
                            onClick={() => handleVote("buyer")}
                            variant="outline"
                            className="h-auto py-4 flex flex-col items-center"
                          >
                            <ThumbsUp className="h-6 w-6 mb-2" />
                            <span className="font-medium">支持买家</span>
                            <span className="text-xs text-muted-foreground mt-1">@{dispute.buyer.username}</span>
                          </Button>
                        </div>
                      </>
                    ) : (
                      <Alert className="bg-green-500/10 border-green-500/20">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        <AlertTitle>投票已提交</AlertTitle>
                        <AlertDescription>
                          感谢您的参与！您支持了{userVote === "seller" ? "卖家" : "买家"}的观点。
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>争议已解决</AlertTitle>
                    <AlertDescription>此争议已经结束，不再接受新的投票。</AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>仲裁规则</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• 所有争议需要达到规定票数才能结束</p>
              <p>• 参与人数由交易金额决定，始终为奇数</p>
              <p>• 一个账户只能投票一次</p>
              <p>• 投票一旦提交无法更改</p>
              <p>• 争议结束后，系统将自动执行结果</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
