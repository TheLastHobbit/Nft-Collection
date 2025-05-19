"use client"

import React, { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, Clock, Users, ThumbsUp, ArrowLeft, CheckCircle2, XCircle, Info } from "lucide-react"
import * as marketClient from "@/utils/market.client"
import * as nftClient from "@/utils/nft.client"
import { toast } from "sonner"
import { useWalletContext } from "@/components/wallet-provider"
import { ethers } from "ethers"

export default function ArbitrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { address } = useWalletContext()
  const [dispute, setDispute] = useState<any>(null)
  const [tokenid, setTokenid] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userVote, setUserVote] = useState<string | null>(null)
  const [voteSubmitted, setVoteSubmitted] = useState(false)
  const [confirmationSubmitted, setConfirmationSubmitted] = useState(false)
  const [voteDetails, setVoteDetails] = useState<Array<{ voter: string; voted: string }>>([])
  const [confirming, setConfirming] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [isDisputeExecuted, setIsDisputeExecuted] = useState(false)

  // 解包 params
  const resolvedParams = React.use(params)

  // 加载纠纷详情
  const fetchDispute = async () => {
    if (!address) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const tokenId = Number(resolvedParams.id)
      console.log("tokenId:", tokenId)
      setTokenid(tokenId)
      const disputeData = await marketClient.getDispute(tokenId)
      console.log("disputeData:", disputeData)

      // 检查争议是否已执行（buyer 为 address(0) 表示已清除）
      const isExecuted = disputeData.buyer === ethers.constants.AddressZero
      setIsDisputeExecuted(isExecuted)

      if (isExecuted) {
        setDispute(null)
        return
      }

      const requestId = disputeData.voteRequestId
      console.log("requestId:", requestId)
      const voteStatus = requestId > 0 ? await marketClient.getDisputeVoteDetails(requestId) : null
      const nftMetadata = await nftClient.getMetadata(tokenId)
      const hasVoted = requestId > 0 ? await marketClient.hasDisputeVoted(requestId, address) : false
      const transactionConfirmed = await marketClient.getTransactionConfirmations(tokenId, address)

      const disputeDetails = {
        id: tokenId,
        nftTitle: nftMetadata.title || "未知 NFT",
        nftImage: nftMetadata.imageURL || "/placeholder.png",
        seller: {
          username: truncateAddress(disputeData.seller),
          avatar: "/placeholder.svg?height=100&width=100",
          argument: "卖家坚持商品符合描述，功能正常，交易应继续。",
        },
        buyer: {
          username: truncateAddress(disputeData.buyer),
          avatar: "/placeholder.svg?height=100&width=100",
          argument: "买家认为商品与描述不符，要求退款或更换。",
        },
        transaction: {
          txHash: "未知",
          amount: `${disputeData.amount.toFixed(2)} cUSDT`,
          date: new Date(disputeData.timestamp * 1000).toLocaleString(),
          blockNumber: "未知",
        },
        disputeDate: new Date(disputeData.timestamp * 1000).toLocaleDateString(),
        status: disputeData.result === 0 ? "进行中" : disputeData.result === 1 ? "买家胜" : "卖家胜",
        votes: voteStatus
          ? { seller: voteStatus.voteCount - voteStatus.approveBuyerCount, buyer: voteStatus.approveBuyerCount }
          : { seller: 0, buyer: 0 },
        requiredVotes: 3,
        description: "争议涉及 NFT 交易，双方对商品描述一致性有分歧。",
        timeLeft: disputeData.result === 0 ? calculateTimeLeft(disputeData.timestamp) : "已结束",
        evidence: [
          {
            title: "描述截图",
            description: "NFT 上架时的描述",
            type: "image",
            url: "/placeholder.svg?height=300&width=300",
            submittedBy: "seller",
          },
          {
            title: "商品照片",
            description: "买家提供的商品照片",
            type: "image",
            url: "/placeholder.svg?height=300&width=300",
            submittedBy: "buyer",
          },
        ],
        updates: [
          {
            date: new Date(disputeData.timestamp * 1000).toLocaleDateString(),
            content: "争议已提交，等待仲裁",
          },
        ],
        voteRequestId: requestId,
      }

      const voteDetailsData = voteStatus
        ? voteStatus.votes.map((vote: any) => ({
            voter: vote.voter,
            voted: vote.hasVoted ? (vote.approveBuyer ? "支持买家" : "支持卖家") : "未投票",
          }))
        : Array(3).fill({ voter: "未投票", voted: "未投票" })

      setDispute(disputeDetails)
      setVoteSubmitted(hasVoted)
      setConfirmationSubmitted(transactionConfirmed)
      setVoteDetails(voteDetailsData)
    } catch (error) {
      console.error("加载纠纷失败:", error)
      toast.error("加载纠纷失败，请稍后重试")
      setDispute(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDispute()
  }, [address, resolvedParams.id])

  // 订阅事件
  useEffect(() => {
    if (!dispute) return

    const handleEvent = (event: string, data: any) => {
      if (data.requestId === dispute.voteRequestId || (event === 'TransactionCompleted' && data.tokenId === dispute.id)) {
        fetchDispute()
        toast.info(
          event === 'DisputeVoted' ? "投票已更新" :
          event === 'DisputeVoteFinalized' ? "投票已结束，争议结果已确定" :
          "争议已执行"
        )
      }
    }

    const unsubscribe = marketClient.subscribeToDisputeEvents(handleEvent, dispute.voteRequestId)

    return () => unsubscribe()
  }, [dispute])

  // 计算剩余时间
  const calculateTimeLeft = (timestamp: number) => {
    const disputeEndTime = timestamp * 1000 + 7 * 24 * 60 * 60 * 1000
    const now = Date.now()
    const timeLeftMs = disputeEndTime - now
    if (timeLeftMs <= 0) return "已结束"
    const days = Math.floor(timeLeftMs / (24 * 60 * 60 * 1000))
    const hours = Math.floor((timeLeftMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    return `${days}天${hours}小时`
  }

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
  const handleVote = async (party: string) => {
    if (!address || !window.ethereum) {
      toast.error("请连接 MetaMask")
      return
    }
    if (voteSubmitted || dispute.status !== "进行中") return
    if (!dispute.voteRequestId || dispute.voteRequestId === 0) {
      toast.error("此争议暂无投票请求")
      return
    }

    try {
      toast.info("投票将提交至区块链，一旦确认无法更改。")
      const requestId = dispute.voteRequestId
      console.log("requestId:", requestId)
      const approveBuyer = party === "buyer"
      const txHash = await marketClient.voteDispute(requestId, approveBuyer)
      toast.success(`投票成功，交易哈希: ${txHash}`)
      await fetchDispute()
      setUserVote(party)
      setVoteSubmitted(true)
    } catch (error) {
      console.error("投票失败:", error)
      toast.error(`投票失败: ${error.message || "未知错误"}`)
    }
  }

  // 处理交易确认
  const handleConfirmTransaction = async () => {
    if (!address || !window.ethereum) {
      toast.error("请连接 MetaMask")
      return
    }
    if (confirmationSubmitted || (dispute.seller !== address && dispute.buyer !== address)) {
      return
    }

    setConfirming(true)
    try {
      toast.info("确认交易将结束纠纷并执行交易，请确认您的决定。")
      const txHash = await marketClient.confirmTransaction(dispute.id)
      toast.success(`交易确认成功，交易哈希: ${txHash}`)
      await fetchDispute()
      setConfirmationSubmitted(true)
    } catch (error) {
      console.error("确认交易失败:", error)
      toast.error(`确认交易失败: ${error.message || "未知错误"}`)
    } finally {
      setConfirming(false)
    }
  }

  // 处理执行交易
  const handleExecuteDispute = async () => {
    if (!address || !window.ethereum) {
      toast.error("请连接 MetaMask")
      return
    }
    // console.log("___________________")
    // console.log("seller:",dispute.seller.username)
    // console.log("buyer:",dispute.buyer.username)
    
    // const temp = address.toUpperCase()
    // console.log("address:",temp)
    // if (dispute.seller.username !== temp && dispute.buyer.username !== temp) {
    //   toast.error("仅买家或卖家可执行争议")
    //   return
    // }

    setExecuting(true)
    try {
      toast.info("正在执行争议结果...")
      const txHash = await marketClient.executeDisputeTransaction(dispute.id)
      toast.success(`争议执行成功，交易哈希: ${txHash}`)
      await fetchDispute()
      setIsDisputeExecuted(true)
    } catch (error) {
      console.error("执行争议失败:", error)
      toast.error(`执行争议失败: ${error.message || "未知错误"}`)
    } finally {
      setExecuting(false)
    }
  }

  // 判断争议结果
  const getDisputeResult = () => {
    if (!dispute || dispute.status === "进行中") return null

    if (dispute.status === "买家胜") {
      return {
        winner: "buyer",
        message: "仲裁结果支持买家，交易已撤销。",
      }
    } else {
      return {
        winner: "seller",
        message: "仲裁结果支持卖家，交易有效。",
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
                dispute.status === "进行中"
                  ? "bg-amber-500 hover:bg-amber-500"
                  : dispute.status === "买家胜"
                  ? "bg-blue-500 hover:bg-blue-500"
                  : "bg-green-500 hover:bg-green-500"
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
                  src={dispute.nftImage}
                  alt={dispute.nftTitle}
                  fill
                  className="object-cover"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.png"
                  }}
                  priority
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

        {/* 中间 - 双方观点和投票详情 */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full overflow-hidden">
                  <Image
                    src={dispute.seller.avatar}
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
                    src={dispute.buyer.avatar}
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
              <CardTitle>投票详情</CardTitle>
              <CardDescription>当前投票情况</CardDescription>
            </CardHeader>
            <CardContent>
              {voteDetails.map((vote, index) => (
                <p key={index} className="text-sm">
                  投票者 {index + 1}: {vote.voter === "未投票" ? "未投票" : truncateAddress(vote.voter)} - {vote.voted}
                </p>
              ))}
            </CardContent>
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
                            src={evidence.url}
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
                              src={evidence.url}
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
                              src={evidence.url}
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

        {/* 右侧 - 投票和确认区域 */}
        <div>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>参与投票或执行交易</CardTitle>
              <CardDescription>投票或执行将决定争议结果。请仔细阅读信息后再操作。</CardDescription>
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

                {/* 投票区域 */}
                {dispute.status === "进行中" && !voteSubmitted && address !== dispute.seller && address !== dispute.buyer ? (
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
                        disabled={voteSubmitted || !dispute.voteRequestId}
                      >
                        <ThumbsUp className="h-6 w-6 mb-2" />
                        <span className="font-medium">支持卖家</span>
                        <span className="text-xs text-muted-foreground mt-1">@{dispute.seller.username}</span>
                      </Button>

                      <Button
                        onClick={() => handleVote("buyer")}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center"
                        disabled={voteSubmitted || !dispute.voteRequestId}
                      >
                        <ThumbsUp className="h-6 w-6 mb-2" />
                        <span className="font-medium">支持买家</span>
                        <span className="text-xs text-muted-foreground mt-1">@{dispute.buyer.username}</span>
                      </Button>
                    </div>
                  </>
                ) : voteSubmitted ? (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>投票已提交</AlertTitle>
                    <AlertDescription>
                      感谢您的参与！您支持了{userVote === "seller" ? "卖家" : "买家"}的观点。
                    </AlertDescription>
                  </Alert>
                ) : null}

                {/* 交易确认区域 */}
                {dispute.status === "进行中" && (address === dispute.seller || address === dispute.buyer) && !confirmationSubmitted ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>交易确认</AlertTitle>
                      <AlertDescription>
                        如果双方同意交易，可提前结束争议并执行交易。确认后无法撤销。
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleConfirmTransaction}
                      className="w-full"
                      disabled={confirming}
                    >
                      {confirming ? "确认中..." : "确认交易"}
                    </Button>
                  </div>
                ) : confirmationSubmitted && dispute.status === "进行中" ? (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>交易已确认</AlertTitle>
                    <AlertDescription>您已确认交易，等待另一方确认。</AlertDescription>
                  </Alert>
                ) : null}

                {/* 执行交易区域 */}
                {!isDisputeExecuted ? (
                  <div className="space-y-4">
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertTitle>执行争议</AlertTitle>
                      <AlertDescription>
                        投票已结束，请执行争议结果以完成交易（退款或转移 NFT）。执行后无法撤销。
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleExecuteDispute}
                      className="w-full"
                      disabled={executing}
                    >
                      {executing ? "执行中..." : "执行交易"}
                    </Button>
                  </div>
                ) : isDisputeExecuted ? (
                  <Alert className="bg-green-500/10 border-green-500/20">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertTitle>争议已执行</AlertTitle>
                    <AlertDescription>争议结果已执行，交易已完成。</AlertDescription>
                  </Alert>
                ) : null}

                {dispute.status !== "进行中" && dispute.votes.seller + dispute.votes.buyer >= dispute.requiredVotes && !isDisputeExecuted && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>投票已完成</AlertTitle>
                    <AlertDescription>
                      争议投票已结束，请执行争议结果以完成交易。
                    </AlertDescription>
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
              <p>• 争议需 3 票结束，多数票决定结果</p>
              <p>• 仅非交易方可投票</p>
              <p>• 投票不可更改</p>
              <p>• 双方确认可提前结束争议</p>
              <p>• 争议结束后需执行结果以完成交易</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// 截断地址显示
function truncateAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
}