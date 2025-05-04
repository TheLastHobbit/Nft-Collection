'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Info, ArrowUpDown } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useWalletContext } from '@/components/wallet-provider';
import { toast } from 'sonner';
import * as nftClient from '@/utils/nft.client';
import * as voteClient from '@/utils/vote.client';

interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  owner: string;
}

export default function SellNFTPage() {
  const { address } = useWalletContext();
  const router = useRouter();
  const [ownedNFTs, setOwnedNFTs] = useState<NFT[]>([]);
  const [singleSellDialogOpen, setSingleSellDialogOpen] = useState(false);
  const [selectedNFTForSale, setSelectedNFTForSale] = useState<NFT | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [voteStatus, setVoteStatus] = useState<{
    requestId: number;
    result: number; // -1: 未创建, 0: Pending, 1: Approved, 2: Rejected
    message: string;
  } | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // 检查投票状态（轮询）
  const waitForVoteApproval = async (requestId: number, timeoutMs = 300000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      try {
        const status = await voteClient.getVoteStatus(requestId);
        if (status.result === 1) { // Approved
          return true;
        } else if (status.result === 2) { // Rejected
          return false;
        }
        // 等待 10 秒后再次检查
        await new Promise((resolve) => setTimeout(resolve, 10000));
      } catch (error) {
        console.error('检查投票状态失败:', error);
        return false;
      }
    }
    return false; // 超时
  };

  // 获取用户拥有的 NFT
  const fetchOwnedNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const { nfts } = await nftClient.getUserNFTs(address);
      setOwnedNFTs(nfts);
    } catch (error) {
      console.error('获取 NFT 失败:', error);
      toast.error('获取 NFT 失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchOwnedNFTs();
    }
  }, [address]);

  // 打开单个 NFT 出售对话框并检查投票状态
  const openSingleSellDialog = async (nft: NFT) => {
    setSelectedNFTForSale(nft);
    setSellPrice('');
    setVoteStatus(null);
    setIsProcessing(true);

    try {
      const tokenId = nft.id; // 直接使用 nft.id 作为 tokenId
      const requestId = await voteClient.getRequestIdByTokenId(tokenId);

      if (requestId > 0) {
        const status = await voteClient.getVoteStatus(requestId);
        if (status.result === 1) {
          setVoteStatus({
            requestId,
            result: 1,
            message: '投票已通过，可以上架商品',
          });
        } else if (status.result === 0) {
          setVoteStatus({
            requestId,
            result: 0,
            message: `投票（ID: ${requestId}）仍在进行中，请等待投票结果`,
          });
        } else {
          setVoteStatus({
            requestId,
            result: 2,
            message: `投票（ID: ${requestId}）未通过，请联系管理员`,
          });
        }
      } else {
        setVoteStatus({
          requestId: 0,
          result: -1,
          message: '未创建投票请求，请创建投票',
        });
      }
    } catch (error) {
      console.error('检查投票状态失败:', error);
      toast.error('检查投票状态失败');
      setVoteStatus(null);
    } finally {
      setIsProcessing(false);
      setSingleSellDialogOpen(true);
    }
  };

  // 创建投票请求
  const handleCreateVote = async () => {
    if (!address || !window.ethereum || !selectedNFTForSale) {
      toast.error('请连接 MetaMask');
      return;
    }

    setIsProcessing(true);
    try {
      const tokenId = selectedNFTForSale.id; // 直接使用 nft.id
      toast.info(`为 NFT ${selectedNFTForSale.title} 创建投票请求...`);
      const { txHash, requestId } = await voteClient.createVoteRequest(tokenId);
      toast.success(`NFT ${selectedNFTForSale.title} 的投票请求已创建，交易哈希: ${txHash}`);

      // 更新投票状态
      setVoteStatus({
        requestId,
        result: 0,
        message: `投票（ID: ${requestId}）已创建，请等待投票结果`,
      });

      // 跳转到验证大厅
      toast.info('投票请求已创建，正在跳转到验证大厅...');
      router.push('/verification');

      // 异步等待投票结果
      const isApproved = await waitForVoteApproval(requestId);
      if (isApproved) {
        setVoteStatus({
          requestId,
          result: 1,
          message: '投票已通过，可以上架商品',
        });
      } else {
        setVoteStatus({
          requestId,
          result: 2,
          message: `投票（ID: ${requestId}）未通过，请联系管理员`,
        });
      }
    } catch (error) {
      console.error('创建投票失败:', error);
      toast.error(`创建投票失败: ${error.message || '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理上架 NFT
  const handleSellNFT = async () => {
    if (!address || !window.ethereum || !selectedNFTForSale) {
      toast.error('请连接 MetaMask');
      return;
    }

    try {
      const price = parseFloat(sellPrice);
      if (isNaN(price) || price <= 0) {
        toast.error('请输入有效的价格');
        return;
      }

      setIsProcessing(true);
      await nftClient.sellNFT(address, selectedNFTForSale.id, sellPrice);
      toast.success(`NFT ${selectedNFTForSale.title} 已上架出售`);
      setSingleSellDialogOpen(false);
      await fetchOwnedNFTs();
    } catch (error) {
      console.error('上架失败:', error);
      toast.error(`上架失败: ${error.message || '未知错误'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // 处理排序
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // 排序 NFT 列表
  const sortedNFTs = [...ownedNFTs].sort((a, b) => {
    if (!sortField) return 0;

    if (sortField === 'title') {
      const valueA = a.title;
      const valueB = b.title;
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    } else if (sortField === 'creator') {
      const valueA = a.owner;
      const valueB = b.owner;
      return sortDirection === 'asc' ? valueA.localeCompare(valueB) : valueB.localeCompare(valueA);
    }
    return 0;
  });

  if (!address) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">请先连接钱包</h3>
          <p className="text-muted-foreground mb-6">连接钱包以出售您的 NFT 商品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">出售 NFT</h1>
          <p className="text-muted-foreground">选择并出售您的二手商品（需通过社区投票）</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p>加载中...</p>
        </div>
      ) : ownedNFTs.length > 0 ? (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="w-[80px]">预览</TableCell>
                <TableCell className="cursor-pointer" onClick={() => handleSort('title')}>
                  <div className="flex items-center">
                    商品名称
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableCell>
                <TableCell className="cursor-pointer" onClick={() => handleSort('creator')}>
                  <div className="flex items-center">
                    拥有者
                    <ArrowUpDown className="ml-2 h-4 w-4" />
                  </div>
                </TableCell>
                <TableHead className="w-[100px] pr-0">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedNFTs.map((nft) => (
                <TableRow key={nft.id}>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md overflow-hidden">
                      <Image
                        src={nft.image || '/placeholder.svg'}
                        alt={nft.title}
                        width={40}
                        height={40}
                        className="object-cover"
                        onError={(e) => {
                          console.error('图片加载失败:', nft.image);
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link href={`/nft/${nft.id}`} className="hover:text-primary">
                      {nft.title}
                    </Link>
                  </TableCell>
                  <TableCell>{nft.owner.substring(0, 6)}...{nft.owner.substring(nft.owner.length - 4)}</TableCell>
                  <TableCell className="flex justify-start pl-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openSingleSellDialog(nft)}
                      disabled={isProcessing}
                    >
                      出售
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">您还没有任何可出售的商品</h3>
          <p className="text-muted-foreground mb-6">浏览市场并购买您喜欢的数字商品，或创建您自己的商品</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/marketplace">
              <Button>浏览市场</Button>
            </Link>
            <Link href="/create">
              <Button variant="outline">创建 NFT</Button>
            </Link>
          </div>
        </div>
      )}

      {/* 单个 NFT 出售对话框 */}
      <Dialog open={singleSellDialogOpen} onOpenChange={setSingleSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出售 {selectedNFTForSale?.title}</DialogTitle>
            <DialogDescription>
              {voteStatus ? voteStatus.message : '检查投票状态中...'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="single-price">出售价格 (cUSDT)</Label>
              <div className="relative">
                <Input
                  id="single-price"
                  placeholder="输入价格"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                  disabled={isProcessing || voteStatus?.result !== 1}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                  cUSDT
                </div>
              </div>
            </div>

            <Alert variant="outline">
              <Info className="h-4 w-4" />
              <AlertTitle>投票和上架提示</AlertTitle>
              <AlertDescription>
                NFT 需通过社区投票（3 人投票，至少 2 人赞同）才能上架。{voteStatus?.result === 0 ? '投票正在进行中，请在验证大厅查看进度。' : ''}
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleSellDialogOpen(false)} disabled={isProcessing}>
              取消
            </Button>
            {voteStatus?.result === 1 ? (
              <Button onClick={handleSellNFT} disabled={isProcessing}>
                {isProcessing ? '处理中...' : '上架'}
              </Button>
            ) : voteStatus?.result === -1 ? (
              <Button onClick={handleCreateVote} disabled={isProcessing}>
                {isProcessing ? '处理中...' : '创建投票'}
              </Button>
            ) : (
              <Button disabled>
                {voteStatus?.result === 0 ? '投票进行中' : '投票未通过'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}