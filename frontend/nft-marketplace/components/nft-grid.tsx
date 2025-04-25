'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { useWalletContext } from '@/components/wallet-provider';
import * as marketClient from '@/utils/market.client';
import { toast } from 'sonner';
import { ethers } from 'ethers';

// 定义 NFT 接口，与 explore/page.tsx 和 my-collections/page.tsx 一致
interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  seller: string;
  price: number;
}

// 定义组件 props
interface NFTGridProps {
  nfts: NFT[];
}

export default function NFTGrid({ nfts }: NFTGridProps) {
  const { address } = useWalletContext();

  // 处理购买 NFT
  const handleBuy = async (tokenId: number) => {
    if (!address || !window.ethereum) {
      toast.error('请连接 MetaMask 钱包');
      return;
    }

    try {
      const txHash = await marketClient.buy(tokenId, address);
      toast.success(`购买 NFT 成功，交易哈希: ${txHash}`);
    } catch (error) {
      console.error(`购买 NFT 失败 (tokenId: ${tokenId}, 地址: ${address}):`, error);
      toast.error('购买 NFT 失败，请稍后重试');
    }
  };

  // 处理点赞（占位功能）
  const handleLike = (tokenId: number) => {
    console.warn(`点赞功能尚未实现 (tokenId: ${tokenId})`);
    toast.info('点赞功能即将推出');
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {nfts.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">暂无上架的 NFT</p>
        </div>
      ) : (
        nfts.map((nft) => (
          <Link href={`/nft/${nft.id}`} key={nft.id}>
            <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md h-full">
              <div className="relative">
                <Image
                  src={nft.image || '/placeholder.png'}
                  alt={nft.title || 'NFT'}
                  width={400}
                  height={400}
                  className="aspect-square object-cover w-full"
                  onError={(e) => {
                    console.error('图片加载失败:', nft.image);
                    e.currentTarget.src = '/placeholder.png';
                  }}
                />
                <div className="absolute top-3 right-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full bg-background/80 backdrop-blur-sm hover:bg-background"
                    onClick={(e) => {
                      e.preventDefault(); // 防止点击 Heart 触发 Link
                      handleLike(nft.id);
                    }}
                  >
                    <Heart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary"></div>
                  <span className="text-xs text-muted-foreground">
                    @{nft.seller ? truncateAddress(nft.seller) : '未知作者'}
                  </span>
                </div>
                <h3 className="font-semibold truncate">{nft.title || '无标题'}</h3>
              </CardContent>
              <CardFooter className="p-4 pt-0 flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">价格</p>
                  <p className="font-medium">{nft.price ? `${nft.price.toFixed(2)} cUSDT` : '未知'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.preventDefault(); // 防止点击购买触发 Link
                    handleBuy(nft.id);
                  }}
                  disabled={
                    !address ||
                    !ethers.utils.isAddress(nft.seller) ||
                    nft.seller.toLowerCase() === address?.toLowerCase()
                  }
                >
                  购买
                </Button>
              </CardFooter>
            </Card>
          </Link>
        ))
      )}
    </div>
  );
}

// 截断地址显示
function truncateAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}