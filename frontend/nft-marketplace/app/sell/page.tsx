'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ethers } from 'ethers';
import { toast } from 'sonner';
import * as nftClient from '@/utils/nft.client';

interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  owner: string;
  selected?: boolean;
}

export default function SellNFTPage() {
  const { address } = useWalletContext();
  const [ownedNFTs, setOwnedNFTs] = useState<NFT[]>([]);
  const [batchSellDialogOpen, setBatchSellDialogOpen] = useState(false);
  const [singleSellDialogOpen, setSingleSellDialogOpen] = useState(false);
  const [selectedNFTForSale, setSelectedNFTForSale] = useState<NFT | null>(null);
  const [sellPrice, setSellPrice] = useState('');
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [isLoading, setIsLoading] = useState(false);

  // 获取用户拥有的 NFT
  const fetchOwnedNFTs = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      const { nfts } = await nftClient.getUserNFTs(address);
      setOwnedNFTs(nfts.map((nft) => ({ ...nft, selected: false })));
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

  // 选择/取消选择所有 NFT
  const toggleSelectAll = () => {
    const allSelected = ownedNFTs.every((nft) => nft.selected);
    setOwnedNFTs(ownedNFTs.map((nft) => ({ ...nft, selected: !allSelected })));
  };

  // 选择/取消选择单个 NFT
  const toggleSelectNFT = (id: number) => {
    setOwnedNFTs(ownedNFTs.map((nft) => (nft.id === id ? { ...nft, selected: !nft.selected } : nft)));
  };

  // 获取选中的 NFT 数量
  const selectedCount = ownedNFTs.filter((nft) => nft.selected).length;

  // 打开单个 NFT 出售对话框
  const openSingleSellDialog = (nft: NFT) => {
    setSelectedNFTForSale(nft);
    setSellPrice('');
    setSingleSellDialogOpen(true);
  };

  // 处理批量出售
  const handleBatchSell = async () => {
    if (!address || !window.ethereum) {
      toast.error('请连接 MetaMask');
      return;
    }

    try {
      const price = parseFloat(sellPrice);
      if (isNaN(price) || price <= 0) {
        toast.error('请输入有效的价格');
        return;
      }

      const selectedNFTs = ownedNFTs.filter((nft) => nft.selected);
      for (const nft of selectedNFTs) {
        await nftClient.sellNFT(address, nft.id, sellPrice);
      }

      toast.success(`已将 ${selectedCount} 个 NFT 上架出售`);
      setBatchSellDialogOpen(false);
      setOwnedNFTs(ownedNFTs.map((nft) => ({ ...nft, selected: false })));
      await fetchOwnedNFTs(); // 刷新 NFT 列表
    } catch (error) {
      console.error('批量出售失败:', error);
      toast.error('批量出售失败');
    }
  };

  // 处理单个 NFT 出售
  const handleSingleSell = async () => {
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

      await nftClient.sellNFT(address, selectedNFTForSale.id, sellPrice);
      toast.success(`已将 ${selectedNFTForSale.title} 上架出售`);
      setSingleSellDialogOpen(false);
      await fetchOwnedNFTs(); // 刷新 NFT 列表
    } catch (error) {
      console.error('出售失败:', error);
      toast.error('出售失败');
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
      const valueA = a.owner; // 使用 owner 作为 creator
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
          <p className="text-muted-foreground">选择并出售您的二手商品</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={toggleSelectAll}>
            {ownedNFTs.every((nft) => nft.selected) ? '取消全选' : '全选'}
          </Button>
          <Button disabled={selectedCount === 0} onClick={() => setBatchSellDialogOpen(true)}>
            批量出售 ({selectedCount})
          </Button>
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
                <TableCell className="w-[50px]">
                  <Checkbox
                    checked={ownedNFTs.every((nft) => nft.selected)}
                    onCheckedChange={toggleSelectAll}
                  />
                </TableCell>
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
                <TableRow key={nft.id} className={nft.selected ? 'bg-primary/5' : ''}>
                  <TableCell>
                    <Checkbox
                      checked={nft.selected}
                      onCheckedChange={() => toggleSelectNFT(nft.id)}
                    />
                  </TableCell>
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
                    <Button variant="outline" size="sm" onClick={() => openSingleSellDialog(nft)}>
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

      {/* 批量出售对话框 */}
      <Dialog open={batchSellDialogOpen} onOpenChange={setBatchSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>批量出售 {selectedCount} 个 NFT</DialogTitle>
            <DialogDescription>设置您希望出售这些数字商品的价格（以 cUSDT 为单位）</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="batch-price">出售价格 (cUSDT)</Label>
              <div className="relative">
                <Input
                  id="batch-price"
                  placeholder="输入价格"
                  value={sellPrice}
                  onChange={(e) => setSellPrice(e.target.value)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                  cUSDT
                </div>
              </div>
            </div>

            <Alert variant="outline">
              <Info className="h-4 w-4" />
              <AlertTitle>批量出售提示</AlertTitle>
              <AlertDescription>
                批量出售将为所有选中的 NFT 设置相同的价格。如需为每个 NFT 设置不同价格，请单独出售。
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBatchSellDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleBatchSell}>确认出售</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 单个 NFT 出售对话框 */}
      <Dialog open={singleSellDialogOpen} onOpenChange={setSingleSellDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>出售 {selectedNFTForSale?.title}</DialogTitle>
            <DialogDescription>设置您希望出售此数字商品的价格（以 cUSDT 为单位）</DialogDescription>
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
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                  cUSDT
                </div>
              </div>
            </div>

            <Alert variant="outline">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>市场提示</AlertTitle>
              <AlertDescription>
                设置合理的价格可以提高出售成功率。您可以参考市场上类似商品的价格来定价。
              </AlertDescription>
            </Alert>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSingleSellDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSingleSell}>确认出售</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}