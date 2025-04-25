'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';
import NFTGrid from '@/components/nft-grid';
import * as marketClient from '@/utils/market.client';
import { toast } from 'sonner';
import { useWalletContext } from '@/components/wallet-provider';
import { ethers } from 'ethers';

interface NFT {
  id: number;
  title: string;
  description: string;
  image: string;
  seller: string;
  price: number;
}

export default function ExplorePage() {
  const { address } = useWalletContext();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 9; // 每页显示 9 个 NFT (3x3 网格)

  // 获取所有上架的 NFT
  const fetchNfts = async () => {
    setIsLoading(true);
    try {
      const fetchedNfts = await marketClient.getAllNFTs();
      console.log('获取到的在售 NFTs:', fetchedNfts);
      // 过滤无效 NFT
      const validNfts = fetchedNfts.filter(
        (nft) =>
          nft.id >= 0 &&
          ethers.utils.isAddress(nft.seller) &&
          nft.seller !== ethers.constants.AddressZero &&
          nft.price > 0
      );
      console.log('过滤后的在售 NFTs:', validNfts);
      setNfts(validNfts);
      applyFiltersAndSort(validNfts, category, sortBy, minPrice, maxPrice);
    } catch (error) {
      console.error('获取在售 NFT 失败:', error);
      toast.error('获取 NFT 失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 应用过滤和排序
  const applyFiltersAndSort = (
    nftsToFilter: NFT[],
    categoryVal: string,
    sortVal: string,
    min: string,
    max: string
  ) => {
    let filtered = [...nftsToFilter];

    // 价格范围过滤
    const minPriceNum = min ? parseFloat(min) : 0;
    const maxPriceNum = max ? parseFloat(max) : Infinity;
    filtered = filtered.filter(
      (nft) => nft.price >= minPriceNum && nft.price <= maxPriceNum
    );

    // 分类过滤（占位，假设未来 NFT 包含 category 字段）
    if (categoryVal !== 'all') {
      console.warn('分类过滤尚未实现，需添加 category 字段到 NFT 元数据');
      // filtered = filtered.filter((nft) => nft.category === categoryVal);
    }

    // 排序
    filtered.sort((a, b) => {
      if (sortVal === 'price-low') {
        return a.price - b.price;
      } else if (sortVal === 'price-high') {
        return b.price - a.price;
      } else if (sortVal === 'recent') {
        return b.id - a.id; // 假设更高的 tokenId 表示更新的 NFT
      } else if (sortVal === 'most-liked') {
        console.warn('most-liked 排序尚未实现，需添加 likes 字段');
        return 0;
      }
      return 0;
    });

    setFilteredNfts(filtered);
  };

  // 处理分类变化
  const handleCategoryChange = (value: string) => {
    setCategory(value);
    applyFiltersAndSort(nfts, value, sortBy, minPrice, maxPrice);
  };

  // 处理排序变化
  const handleSortChange = (value: string) => {
    setSortBy(value);
    applyFiltersAndSort(nfts, category, value, minPrice, maxPrice);
  };

  // 处理价格范围应用
  const handlePriceFilter = () => {
    if (minPrice && maxPrice && parseFloat(minPrice) > parseFloat(maxPrice)) {
      toast.error('最低价格不能高于最高价格');
      return;
    }
    applyFiltersAndSort(nfts, category, sortBy, minPrice, maxPrice);
  };

  // 加载更多 NFT
  const loadMore = () => {
    setPage((prev) => prev + 1);
  };

  // 初始化加载 NFT
  useEffect(() => {
    fetchNfts();
  }, []);

  // 计算当前页的 NFT
  const paginatedNfts = filteredNfts.slice(0, page * itemsPerPage);
  const hasMore = paginatedNfts.length < filteredNfts.length;

  return (
    <div className="container px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold">浏览 NFT</h1>
          <p className="text-muted-foreground">发现最新的数字收藏品</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={category} onValueChange={handleCategoryChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="分类" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有分类</SelectItem>
              <SelectItem value="art">艺术</SelectItem>
              <SelectItem value="collectibles">收藏品</SelectItem>
              <SelectItem value="photography">摄影</SelectItem>
              <SelectItem value="music">音乐</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="排序方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">最新添加</SelectItem>
              <SelectItem value="price-low">价格: 从低到高</SelectItem>
              <SelectItem value="price-high">价格: 从高到低</SelectItem>
              <SelectItem value="most-liked">最受欢迎</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* 筛选侧边栏 */}
        <div className="hidden md:block space-y-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="搜索 NFT..." className="pl-8" />
          </div>

          <div>
            <h3 className="font-medium mb-3">状态</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="buy-now" className="rounded text-primary" disabled />
                <label htmlFor="buy-now" className="text-sm">
                  立即购买
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="on-auction" className="rounded text-primary" disabled />
                <label htmlFor="on-auction" className="text-sm">
                  拍卖中
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="new" className="rounded text-primary" disabled />
                <label htmlFor="new" className="text-sm">
                  新品
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">价格范围</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  placeholder="最低"
                  className="h-8"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                />
                <span className="text-muted-foreground">至</span>
                <Input
                  type="number"
                  placeholder="最高"
                  className="h-8"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" className="w-full" onClick={handlePriceFilter}>
                应用
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">收藏品</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="collection-1" className="rounded text-primary" disabled />
                <label htmlFor="collection-1" className="text-sm">
                  宇宙系列
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="collection-2" className="rounded text-primary" disabled />
                <label htmlFor="collection-2" className="text-sm">
                  数字梦境
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="collection-3" className="rounded text-primary" disabled />
                <label htmlFor="collection-3" className="text-sm">
                  抽象领域
                </label>
              </div>
              <Button variant="link" size="sm" className="px-0" disabled>
                + 显示更多
              </Button>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-3">区块链</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ethereum" className="rounded text-primary" checked disabled />
                <label htmlFor="ethereum" className="text-sm">
                  以太坊
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="polygon" className="rounded text-primary" disabled />
                <label htmlFor="polygon" className="text-sm">
                  Polygon
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="solana" className="rounded text-primary" disabled />
                <label htmlFor="solana" className="text-sm">
                  Solana
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* NFT 网格 */}
        <div className="md:col-span-3">
          {isLoading ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto" />
              <p className="mt-2">加载中...</p>
            </div>
          ) : paginatedNfts.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">暂无 NFT</h3>
              <p className="text-muted-foreground mb-6">当前没有上架的 NFT</p>
            </div>
          ) : (
            <NFTGrid nfts={paginatedNfts} />
          )}

          {hasMore && !isLoading && (
            <div className="mt-8 flex justify-center">
              <Button variant="outline" onClick={loadMore}>
                加载更多
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}