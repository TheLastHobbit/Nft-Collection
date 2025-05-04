'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, Share2, ArrowRight, Loader2 } from 'lucide-react';
import * as marketClient from '@/utils/market.client';
import * as nftClient from '@/utils/nft.client';
import { toast } from 'sonner';
import { useWalletContext } from '@/components/wallet-provider';
import { ethers } from 'ethers';

// 定义 NFT 接口
interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  seller: string;
  price: number;
  contractAddress: string;
  tokenStandard: string;
  blockchain: string;
}

export default function NFTDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { address } = useWalletContext();
  const [nft, setNft] = useState<NFT | null>(null);
  const [relatedNfts, setRelatedNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 使用 React.use 解包 params
  const { id } = React.use(params);

  // 获取 NFT 详情
  const fetchNFT = async () => {
    setIsLoading(true);
    try {
      // 假设 marketClient.getOrder 返回单个 NFT 详情
      const fetchedNft = await marketClient.getOrder(parseInt(id));
      const nftMetaData = await nftClient.getMetadata(parseInt(id));
      console.log('获取到的 NFT 详情:', fetchedNft);
      console.log('nftMetaData:', nftMetaData);
      if (!fetchedNft || fetchedNft.tokenId <= 0) {
        throw new Error('NFT 不存在');
      }
      setNft({
        id: fetchedNft.tokenId,
        title: nftMetaData.title || '无标题',
        description: nftMetaData.description || '无描述',
        image: nftMetaData.imageURL,
        seller: fetchedNft.seller,
        price: fetchedNft.price,
        contractAddress: '0xe8f9CfFAcAEFdaFb11Cfd216113dC75AC93b685A', // MyNFT 合约地址
        tokenStandard: 'ERC-721',
        blockchain: 'Ethereum',
      });

      // 获取相关 NFT（同一卖家的其他 NFT）
      const allNfts = await marketClient.getAllNFTs();
      const related = allNfts
        .filter(
          (n) =>
            n.seller.toLowerCase() === fetchedNft.seller.toLowerCase() &&
            n.id !== fetchedNft.id &&
            n.id > 0 &&
            ethers.utils.isAddress(n.seller) &&
            n.seller !== ethers.constants.AddressZero
        )
        .slice(0, 4); // 最多显示 4 个
      console.log('相关 NFT:', related);
      setRelatedNfts(related);
    } catch (error) {
      console.error(`获取 NFT 失败 (id: ${id}):`, error);
      toast.error('获取 NFT 详情失败，请稍后重试');
      setNft(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理购买 NFT
  const handleBuy = async () => {
    if (!address || !window.ethereum) {
      toast.error('请连接 MetaMask 钱包');
      return;
    }
    if (!nft) {
      toast.error('NFT 数据未加载');
      return;
    }

    try {
      const txHash = await marketClient.buy(nft.id, address);
      toast.success(`购买 NFT 成功，交易哈希: ${txHash}`);
    } catch (error) {
      console.error(`购买 NFT 失败 (id: ${nft.id}, 地址: ${address}):`, error);
      toast.error('购买 NFT 失败，请稍后重试');
    }
  };

  // 处理点赞（占位）
  const handleLike = () => {
    toast.info('点赞功能即将推出');
  };

  // 处理分享（占位）
  const handleShare = () => {
    toast.info('分享功能即将推出');
  };

  useEffect(() => {
    fetchNFT();
  }, [id]);

  if (isLoading) {
    return (
      <div className="container px-4 py-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="mt-2">加载中...</p>
      </div>
    );
  }

  if (!nft) {
    return (
      <div className="container px-4 py-8 text-center">
        <h2 className="text-xl font-bold mb-4">NFT 不存在</h2>
        <p className="text-muted-foreground">无法找到 ID 为 {id} 的 NFT</p>
        <Link href="/explore">
          <Button className="mt-4">浏览其他 NFT</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 左侧 - NFT 图片 */}
        <div>
          <div className="rounded-lg overflow-hidden border border-border">
            <Image
              src={nft.image}
              alt={nft.title}
              width={600}
              height={600}
              className="w-full aspect-square object-cover"
              onError={(e) => {
                console.error('图片加载失败:', nft.image);
                e.currentTarget.src = '/placeholder.png';
              }}
            />
          </div>

          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={handleLike}>
                <Heart className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Card className="mt-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">详细信息</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">合约地址</p>
                  <p className="text-sm font-medium truncate">{truncateAddress(nft.contractAddress)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">代币 ID</p>
                  <p className="text-sm font-medium">{nft.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">代币标准</p>
                  <p className="text-sm font-medium">{nft.tokenStandard}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">区块链</p>
                  <p className="text-sm font-medium">{nft.blockchain}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">收藏品</p>
                  <p className="text-sm font-medium">未知</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 右侧 - NFT 信息 */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-sm text-muted-foreground">未知收藏</p>
          </div>

          <h1 className="text-2xl font-bold mb-4">{nft.title}</h1>

          <div className="flex items-center gap-6 mb-6">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary"></div>
              <div>
                <p className="text-xs text-muted-foreground">卖家</p>
                <p className="text-sm font-medium">{truncateAddress(nft.seller)}</p>
              </div>
            </div>
          </div>

          <p className="text-muted-foreground mb-6">{nft.description}</p>

          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">当前价格</p>
                  <p className="text-2xl font-bold">{nft.price.toFixed(2)} cUSDT</p>
                </div>
              </div>

              <div className="flex gap-4">
                <Button
                  className="flex-1"
                  onClick={handleBuy}
                  disabled={
                    !address ||
                    !ethers.utils.isAddress(nft.seller) ||
                    nft.seller.toLowerCase() === address?.toLowerCase()
                  }
                >
                  立即购买
                </Button>
                <Button variant="outline" className="flex-1" disabled>
                  出价
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 相关 NFT */}
      <section className="mt-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">来自同一卖家的更多作品</h2>
          <Button variant="ghost" className="gap-1" disabled>
            查看更多 <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {relatedNfts.length === 0 ? (
            <p className="text-muted-foreground">暂无相关 NFT</p>
          ) : (
            relatedNfts.map((related) => (
              <Link href={`/nft/${related.id}`} key={related.id}>
                <Card className="overflow-hidden hover:border-primary/50 hover:shadow-md">
                  <div className="aspect-square relative">
                    <Image
                      src={related.image || '/placeholder.png'}
                      alt={related.title || 'NFT'}
                      width={300}
                      height={300}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        console.error('相关 NFT 图片加载失败:', related.image);
                        e.currentTarget.src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold truncate">{related.title || '无标题'}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-sm font-medium">{related.price.toFixed(2)} cUSDT</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

// 截断地址显示
function truncateAddress(address: string) {
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}