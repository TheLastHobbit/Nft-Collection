'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { PlusCircle, Copy, ExternalLink } from 'lucide-react';
import { useWalletContext } from '@/components/wallet-provider';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import * as nftClient from '@/utils/nft.client';
import * as marketClient from '@/utils/market.client';
import * as cUSDTClient from '@/utils/usdt.client';

interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  seller: string; // 改为 seller，与 marketClient.getMyNFTs() 一致
  price?: number;
}

export default function MyCollectionsPage() {
  const { address } = useWalletContext();
  const [ethBalance, setEthBalance] = useState<string>('0');
  const [cUSDTBalance, setCUSDTBalance] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [userNFTs, setUserNFTs] = useState<NFT[]>([]);
  const [sellingNFTs, setSellingNFTs] = useState<NFT[]>([]);

  const fetchBalance = async () => {
    if (!address || !window.ethereum) {
      toast.error('请安装 MetaMask 并连接钱包');
      return;
    }

    setIsLoading(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      console.log(`调用 fetchBalance，网络: ${network.name} (chainId: ${network.chainId}), 地址: ${address}`);
      await provider.send('eth_requestAccounts', []);
      const balance = await provider.getBalance(address);
      console.log(`ETH 余额: ${balance}`);
      setEthBalance(ethers.utils.formatEther(balance));
      const cUSDT = await cUSDTClient.balanceOf(address);
      console.log(`cUSDT 余额: ${cUSDT}`);
      setCUSDTBalance(cUSDT);
    } catch (error) {
      console.error(`获取余额失败 (地址: ${address}):`, error);
      toast.error('获取余额失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserNFTs = async () => {
    if (!address || !ethers.utils.isAddress(address)) {
      console.warn('无效或未提供钱包地址:', address);
      return;
    }

    setIsLoading(true);
    try {
      const { nfts } = await nftClient.getUserNFTs(address);
      console.log('获取到的 NFTs:', nfts);
      console.log('第一个 NFT 的图片 URL:', nfts[0]?.image);
      setUserNFTs(nfts);
    } catch (error) {
      console.error(`获取 NFT 失败 (地址: ${address}):`, error);
      toast.error('获取 NFT 失败');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSellingNFTs = async () => {
    if (!address || !ethers.utils.isAddress(address)) {
      console.warn('无效或未提供钱包地址:', address);
      return;
    }

    setIsLoading(true);
    try {
      const nfts = await marketClient.getMyNFTs();
      console.log('获取到的在售 NFTs:', nfts);
      // 过滤无效 NFT
      const validNFTs = nfts.filter(
        (nft) =>
          nft.seller &&
          ethers.utils.isAddress(nft.seller) &&
          nft.seller !== ethers.constants.AddressZero
      );
      console.log('过滤后的在售 NFTs:', validNFTs);
      setSellingNFTs(validNFTs);
    } catch (error) {
      console.error(`获取在售 NFT 失败 (地址: ${address}):`, error);
      toast.error('获取在售 NFT 失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuy = async (tokenId: number) => {
    if (!address || !window.ethereum || !ethers.utils.isAddress(address)) {
      toast.error('请连接 MetaMask 或检查钱包地址');
      return;
    }

    try {
      await marketClient.buy(tokenId, address);
      toast.success('购买 NFT 成功');
      await fetchUserNFTs();
      await fetchSellingNFTs();
      await fetchBalance();
    } catch (error) {
      console.error(`购买 NFT 失败 (tokenId: ${tokenId}, 地址: ${address}):`, error);
      toast.error('购买 NFT 失败');
    }
  };

  useEffect(() => {
    if (address && ethers.utils.isAddress(address)) {
      fetchBalance();
      fetchUserNFTs();
      fetchSellingNFTs();
    } else {
      console.warn('无效或未提供钱包地址:', address);
    }
  }, [address]);

  const copyWalletAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success('钱包地址已复制');
  };

  const truncateAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const viewOnEtherscan = () => {
    if (!address) return;
    window.open(`https://sepolia.etherscan.io/address/${address}`, '_blank'); // 假设使用 Sepolia
  };

  if (!address) {
    return (
      <div className="container px-4 py-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium mb-2">请先连接钱包</h3>
          <p className="text-muted-foreground mb-6">连接钱包以查看您的 NFT 商品</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8">
      <div className="mb-8 p-6 bg-background border border-border rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">我的商品</h1>
            <p className="text-muted-foreground">管理您购买和创建的二手商品</p>
          </div>
          <Link href="/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              创建 NFT
            </Button>
          </Link>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">钱包地址</p>
              <div className="flex items-center gap-2">
                <p className="font-mono">{truncateAddress(address)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={copyWalletAddress}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">复制地址</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={viewOnEtherscan}
                >
                  <ExternalLink className="h-4 w-4" />
                  <span className="sr-only">查看区块浏览器</span>
                </Button>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-background p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">ETH 余额</p>
                <p className="font-bold text-xl">
                  {isLoading ? '加载中...' : `${Number(ethBalance).toFixed(4)} ETH`}
                </p>
              </div>
              <div className="bg-background p-3 rounded-lg border border-border">
                <p className="text-sm text-muted-foreground mb-1">cUSDT 余额</p>
                <p className="font-bold text-xl">
                  {isLoading ? '加载中...' : `${cUSDTBalance.toFixed(2)} cUSDT`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="my-nfts" className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-nfts">我的 NFT</TabsTrigger>
          <TabsTrigger value="selling">在出售的 NFT</TabsTrigger>
        </TabsList>

        <TabsContent value="my-nfts">
          {isLoading ? (
            <div className="text-center py-12">
              <p>加载中...</p>
            </div>
          ) : userNFTs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">暂无 NFT</h3>
              <p className="text-muted-foreground mb-6">您还没有任何 NFT 商品</p>
              <Link href="/marketplace">
                <Button>浏览市场</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {userNFTs.map((nft) => (
                <Card key={nft.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-4">
                      {nft.image ? (
                        <Image
                          src={nft.image}
                          alt={nft.title || 'NFT'}
                          fill
                          className="rounded-lg object-cover"
                          onError={(e) => {
                            console.error('图片加载失败:', nft.image);
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                          <p className="text-muted-foreground">暂无图片</p>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{nft.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{nft.description}</p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Token ID: {nft.id}</p>
                      <Link href={`/nft/${nft.id}`}>
                        <Button variant="outline" size="sm">
                          查看详情
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="selling">
          {isLoading ? (
            <div className="text-center py-12">
              <p>加载中...</p>
            </div>
          ) : sellingNFTs.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">暂无在售 NFT</h3>
              <p className="text-muted-foreground mb-6">您当前没有正在出售的 NFT</p>
              <Link href="/sell">
                <Button>出售 NFT</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sellingNFTs.map((nft) => (
                <Card key={nft.id}>
                  <CardContent className="p-4">
                    <div className="aspect-square relative mb-4">
                      {nft.image ? (
                        <Image
                          src={nft.image}
                          alt={nft.title || 'NFT'}
                          fill
                          className="rounded-lg object-cover"
                          onError={(e) => {
                            console.error('图片加载失败:', nft.image);
                            e.currentTarget.src = '/placeholder.png';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
                          <p className="text-muted-foreground">暂无图片</p>
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">{nft.title}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{nft.description}</p>
                    <p className="text-sm font-medium mb-4">
                      价格: {nft.price ? nft.price.toFixed(2) : 'N/A'} cUSDT
                    </p>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-muted-foreground">Token ID: {nft.id}</p>
                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => handleBuy(nft.id)}
                          disabled={
                            !nft.seller ||
                            !ethers.utils.isAddress(nft.seller) ||
                            nft.seller.toLowerCase() === address?.toLowerCase()
                          }
                        >
                          购买
                        </Button>
                        <Link href={`/nft/${nft.id}`}>
                          <Button variant="outline" size="sm">
                            查看详情
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}