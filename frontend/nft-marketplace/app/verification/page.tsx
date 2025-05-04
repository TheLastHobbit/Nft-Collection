'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import * as voteClient from '@/utils/vote.client';
import { toast } from 'sonner';

interface VerificationItem {
  id: number;
  seller: string;
  status: string;
  verifications: { approved: number; rejected: number; pending: number };
}

export default function VerificationPage() {
  const [items, setItems] = useState<VerificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 获取投票列表
  const fetchVoteRequests = async () => {
    setIsLoading(true);
    try {
      const requestIds = await voteClient.getAllVoteRequests();
      const votePromises = requestIds.map((id: number) => voteClient.getVoteStatus(id));
      const voteStatuses = await Promise.all(votePromises);

      const items = voteStatuses.map((status, index) => ({
        id: requestIds[index],
        seller: status.requester.substring(0, 6) + '...' + status.requester.substring(status.requester.length - 4),
        status: status.result === 0 ? '待验证' : status.result === 1 ? '验证通过' : '验证失败',
        verifications: {
          approved: status.approveCount,
          rejected: status.voteCount - status.approveCount,
          pending: 3 - status.voteCount, // 假设最多 3 人投票
        },
      }));

      setItems(items);
    } catch (error) {
      console.error('获取投票列表失败:', error);
      toast.error('获取投票列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteRequests();
  }, []);

  return (
    <div className="container px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">实物验证大厅</h1>
        <p className="text-muted-foreground">帮助验证二手商品信息，确保交易安全</p>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">加载中...</div>
      ) : items.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground">没有待验证的投票</div>
      ) : (
        <div className="border rounded-md">
          <div className="grid grid-cols-12 gap-4 p-4 font-medium border-b">
            <div className="col-span-3">投票ID</div>
            <div className="col-span-4">卖家</div>
            <div className="col-span-3">状态</div>
            <div className="col-span-2">操作</div>
          </div>

          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-4 p-4 border-b hover:bg-muted/50">
              <div className="col-span-3 font-medium">{item.id}</div>
              <div className="col-span-4 text-muted-foreground">@{item.seller}</div>
              <div className="col-span-3">
                <Badge
                  className={
                    item.status === '待验证'
                      ? 'bg-amber-500 hover:bg-amber-500'
                      : item.status === '验证通过'
                      ? 'bg-green-500 hover:bg-green-500'
                      : 'bg-red-500 hover:bg-red-500'
                  }
                >
                  {item.status}
                </Badge>
              </div>
              <div className="col-span-2">
                <Link href={`/verification/${item.id}`}>
                  <Button variant="outline" size="sm">
                    验证
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}