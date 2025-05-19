'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useWalletContext } from '@/components/wallet-provider';
import * as voteClient from '@/utils/vote.client';
import { toast } from 'sonner';

export default function VerificationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { address } = useWalletContext();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userVerification, setUserVerification] = useState<string | null>(null);
  const [verificationSubmitted, setVerificationSubmitted] = useState(false);

  // 解包 params
  const resolvedParams = React.use(params);

  // 加载投票数据
  const fetchVoteData = async () => {
    if (!address) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const requestId = Number(resolvedParams.id); // 使用解包后的 params
      const status = await voteClient.getVoteStatus(requestId);

      const itemData = {
        id: requestId,
        seller: status.requester,
        status: status.result === 0 ? '待验证' : status.result === 1 ? '验证通过' : '验证失败',
        verifications: {
          approved: status.approveCount,
          rejected: status.voteCount - status.approveCount,
          pending: 3 - status.voteCount, // 假设最多 3 人投票
        },
      };

      setItem(itemData);

      // 检查用户是否已投票
      const hasVoted = await voteClient.checkVoteStatus(requestId, address);
      if (hasVoted) {
        setVerificationSubmitted(true);
        setUserVerification('unknown'); // 无法知道具体投票结果
      }
    } catch (error) {
      console.error('加载投票数据失败:', error);
      toast.error('加载投票数据失败');
      setItem(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVoteData();
  }, [address, resolvedParams.id]); // 更新依赖项

  // 处理验证提交
  const handleVerification = async (approve: boolean) => {
    if (!address || !window.ethereum) {
      toast.error('请连接 MetaMask');
      return;
    }

    if (verificationSubmitted || item.status !== '待验证') return;

    try {
      setVerificationSubmitted(true); // 防止重复提交
      const txHash = await voteClient.vote(Number(resolvedParams.id), approve); // 使用解包后的 params
      toast.success(`投票已提交，交易哈希: ${txHash}`);

      // 更新投票状态
      const status = await voteClient.getVoteStatus(Number(resolvedParams.id));
      setItem((prev: any) => ({
        ...prev,
        status: status.result === 0 ? '待验证' : status.result === 1 ? '验证通过' : '验证失败',
        verifications: {
          approved: status.approveCount,
          rejected: status.voteCount - status.approveCount,
          pending: 3 - status.voteCount,
        },
      }));

      setUserVerification(approve ? 'approved' : 'rejected');
    } catch (error) {
      console.error('投票失败:', error);
      toast.error(`投票失败: ${error.message || '未知错误'}`);
      setVerificationSubmitted(false); // 允许重试
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 text-center">
        <p>加载中...</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="container px-4 py-8 text-center">
        <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium mb-2">未找到投票</h3>
        <p className="text-muted-foreground mb-6">该投票可能已被删除或不存在</p>
        <Link href="/verification">
          <Button>返回验证大厅</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/verification" className="flex items-center text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4 mr-1" />
          <span>返回验证大厅</span>
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">投票 #{item.id}</h1>
          <p className="text-muted-foreground">投票验证</p>
        </div>
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

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>投票信息</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">卖家</p>
            <p>@{item.seller.substring(0, 6)}...{item.seller.substring(item.seller.length - 4)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>验证状态</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">通过</p>
              <p className="text-xl font-bold text-green-500">{item.verifications.approved}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">拒绝</p>
              <p className="text-xl font-bold text-red-500">{item.verifications.rejected}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">待验证</p>
              <p className="text-xl font-bold text-amber-500">{item.verifications.pending}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {item.status === '待验证' && !verificationSubmitted ? (
        <div className="grid grid-cols-2 gap-4">
          <Button onClick={() => handleVerification(true)} className="bg-green-500 hover:bg-green-600">
            <CheckCircle2 className="h-4 w-4 mr-2" />
            通过验证
          </Button>

          <Button onClick={() => handleVerification(false)} className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-4 w-4 mr-2" />
            拒绝验证
          </Button>
        </div>
      ) : verificationSubmitted ? (
        <Alert className="bg-green-500/10 border-green-500/20">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertTitle>验证已提交</AlertTitle>
          <AlertDescription>感谢您的参与！您已为此投票提交了验证。</AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>验证已结束</AlertTitle>
          <AlertDescription>此投票的验证已经结束，不再接受新的验证。</AlertDescription>
        </Alert>
      )}
    </div>
  );
}