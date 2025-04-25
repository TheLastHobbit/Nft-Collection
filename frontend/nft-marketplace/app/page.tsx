'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2 } from 'lucide-react';
import * as marketClient from '@/utils/market.client';
import { toast } from 'sonner';
import { useWalletContext } from '@/components/wallet-provider';
import { ethers } from 'ethers';

// 定义 NFT 接口，与其他页面一致
interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  seller: string;
  price: number;
}

export default function Home() {
  const { address } = useWalletContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [featuredNFT, setFeaturedNFT] = useState<NFT | null>(null);
  const itemsPerPage = 12; // 每页 12 个 NFT（4x3 网格）

  // 获取上架的 NFT
  const fetchNfts = async () => {
    setIsLoading(true);
    try {
      const fetchedNfts = await marketClient.getAllNFTs();
      console.log('首页获取到的在售 NFTs:', fetchedNfts);
      // 过滤无效 NFT
      const validNfts = fetchedNfts.filter(
        (nft) =>
          nft.id >= 0 &&
          ethers.utils.isAddress(nft.seller) &&
          nft.seller !== ethers.constants.AddressZero &&
          nft.price > 0
      );
      console.log('首页过滤后的在售 NFTs:', validNfts);
      setNfts(validNfts);
    } catch (error) {
      console.error('首页获取在售 NFT 失败:', error);
      toast.error('获取 NFT 失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 随机选择一个 NFT 作为精选展示
  const selectRandomNFT = () => {
    if (nfts.length === 0) {
      setFeaturedNFT(null);
      return;
    }
    const validNfts = nfts.filter((nft) => nft.image && nft.title && nft.seller);
    if (validNfts.length === 0) {
      setFeaturedNFT(null);
      return;
    }
    const randomIndex = Math.floor(Math.random() * validNfts.length);
    setFeaturedNFT(validNfts[randomIndex]);
  };

  // 初始化加载 NFT
  useEffect(() => {
    fetchNfts();
  }, []);

  // 每 5 秒轮换精选 NFT
  useEffect(() => {
    selectRandomNFT(); // 初始选择
    const interval = setInterval(() => {
      selectRandomNFT();
    }, 5000); // 每 5 秒切换
    return () => clearInterval(interval); // 清理定时器
  }, [nfts]);

  return (
    <div className="flex flex-col gap-12 pb-12">
      {/* 英雄区域 */}
      <section className="w-full py-12 md:py-20">
        <div className="container px-4">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl xl:text-5xl">
                  发现、收集与交易 <span className="text-primary">稀有数字藏品</span>
                </h1>
                <p className="text-muted-foreground md:text-lg">专业的 NFT 藏品交易平台，连接创作者与收藏家</p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Button
                  size="lg"
                  onClick={() => {
                    const marketplaceSection = document.getElementById('marketplace');
                    if (marketplaceSection) {
                      marketplaceSection.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                >
                  浏览藏品
                </Button>
                <Link href="/create">
                  <Button size="lg" variant="outline">
                    创建 NFT 藏品
                  </Button>
                </Link>
              </div>
            </div>
            <div className="mx-auto lg:mx-0">
              <div className="bg-muted border border-border rounded-lg p-2">
                <div className="aspect-square w-full max-w-[500px] rounded overflow-hidden relative">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  ) : featuredNFT ? (
                    <Link href={`/nft/${featuredNFT.id}`}>
                      <Image
                        src={featuredNFT.image || '/placeholder.png'}
                        alt={featuredNFT.title || '精选藏品'}
                        width={500}
                        height={500}
                        className="object-cover"
                        onError={(e) => {
                          console.error('英雄区域图片加载失败:', featuredNFT.image);
                          e.currentTarget.src = '/placeholder.png';
                        }}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <h3 className="text-lg font-bold text-white">{featuredNFT.title || '无标题'}</h3>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-6 w-6 rounded-full bg-primary"></div>
                          <span className="text-sm text-white">
                            @{featuredNFT.seller ? truncateAddress(featuredNFT.seller) : '未知作者'}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ) : (
                    <Image
                      src="/placeholder.png"
                      alt="精选藏品"
                      width={500}
                      height={500}
                      className="object-cover"
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 藏品市场 */}
      <section id="marketplace" className="w-full py-8">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold">藏品市场</h2>
              <p className="text-muted-foreground">探索精选的数字藏品</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href="/create">
                <Button className="gap-1">出售 NFT</Button>
              </Link>
              <Link href="/explore">
                <Button variant="outline" className="gap-1">
                  高级筛选 <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* NFT 藏品网格 */}
          <MarketplaceNFTGrid
            nfts={nfts}
            isLoading={isLoading}
            page={page}
            setPage={setPage}
            address={address}
            setNfts={setNfts} // 传递 setNfts
          />

          {/* 加载更多按钮 */}
          {nfts.length > page * itemsPerPage && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" size="lg" onClick={() => setPage((prev) => prev + 1)}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* 号召性区域 */}
      <section className="w-full py-8 md:py-12">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-lg">
            <div className="absolute inset-0 bg-primary opacity-90"></div>
            <div className="relative p-6 md:p-8 text-center">
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">开始出售您的数字藏品</h2>
              <p className="text-white/90 mb-6 max-w-2xl mx-auto">
                加入专业的 NFT 藏品交易平台，与数千名创作者和收藏家一起探索数字藏品的无限可能
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/create">
                  <Button size="lg" variant="secondary">
                    出售 NFT
                  </Button>
                </Link>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-transparent text-white border-white hover:bg-white hover:text-primary"
                >
                  了解更多
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

// NFT 藏品网格组件
function MarketplaceNFTGrid({
  nfts,
  isLoading,
  page,
  setPage,
  address,
  setNfts, // 添加 setNfts 到 props
}: {
  nfts: NFT[];
  isLoading: boolean;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  address: string | undefined;
  setNfts: React.Dispatch<React.SetStateAction<NFT[]>>; // 定义类型
}) {
  const itemsPerPage = 12; // 每页 12 个 NFT（4x3 网格）

  // 处理购买 NFT
  const handleBuy = async (tokenId: number) => {
    if (!address || !window.ethereum) {
      toast.error('请连接 MetaMask 钱包');
      return;
    }

    try {
      const txHash = await marketClient.buy(tokenId, address);
      toast.success(`购买 NFT 成功，交易哈希: ${txHash}`);
      // 刷新 NFT 列表
      const fetchedNfts = await marketClient.getAllNFTs();
      const validNfts = fetchedNfts.filter(
        (nft) =>
          nft.id >= 0 &&
          ethers.utils.isAddress(nft.seller) &&
          nft.seller !== ethers.constants.AddressZero &&
          nft.price > 0
      );
      setNfts(validNfts); // 使用传递的 setNfts
    } catch (error) {
      console.error(`购买 NFT 失败 (tokenId: ${tokenId}, 地址: ${address}):`, error);
      toast.error('购买 NFT 失败，请稍后重试');
    }
  };

  // 分页显示 NFT
  const paginatedNfts = nfts.slice(0, page * itemsPerPage);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {isLoading ? (
        <div className="col-span-full text-center py-8">
          <Loader2 className="h-8 w-8 animate-spin mx-auto" />
          <p className="mt-2">加载中...</p>
        </div>
      ) : nfts.length === 0 ? (
        <div className="col-span-full text-center py-8">
          <p className="text-muted-foreground">暂无上架的 NFT</p>
        </div>
      ) : (
        paginatedNfts.map((nft) => (
          <Link href={`/nft/${nft.id}`} key={nft.id}>
            <div className="overflow-hidden rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all">
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
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-full bg-primary"></div>
                  <span className="text-xs text-muted-foreground">
                    @{nft.seller ? truncateAddress(nft.seller) : '未知作者'}
                  </span>
                </div>
                <h3 className="font-semibold truncate">{nft.title || '无标题'}</h3>
                <div className="flex justify-between items-center mt-2">
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
                </div>
              </div>
            </div>
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