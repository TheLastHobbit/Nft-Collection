"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Menu, Wallet, Coins } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { useWalletContext } from './wallet-provider'
import * as usdtClient from '@/utils/usdt.client'

// 定义钱包状态接口
interface WalletState {
  address: string;
  isConnecting: boolean;
  error: string | null;
}

const routes = [
  { name: "申请创建商品NFT", path: "/create" },
  { name: "实物验证大厅", path: "/arbitration" },
  { name: "出售NFT", path: "/sell" },
  { name: "仲裁大厅", path: "/arbitration" },
  { name: "我的商品", path: "/my-collections" },
  
]

// 创建一个自定义 hook 来管理钱包状态
export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: "",
    isConnecting: false,
    error: null
  });

  // 添加一个安全的以太坊提供者检查函数
  const getEthereumProvider = () => {
    // 确保在浏览器环境中运行
    if (typeof window === 'undefined') return null;
    
    // 等待一小段时间确保 ethereum 注入完成
    return new Promise((resolve) => {
      if (window.ethereum) {
        resolve(window.ethereum);
      } else {
        // 如果没有立即找到 ethereum，等待一下再检查
        window.addEventListener('ethereum#initialized', () => {
          resolve(window.ethereum);
        }, { once: true });
        
        // 设置超时，避免无限等待
        setTimeout(() => {
          resolve(null);
        }, 3000); // 3秒超时
      }
    });
  };

  // 修改检查钱包连接状态函数
  const checkWalletConnection = async () => {
    try {
      const provider = await getEthereumProvider();
      
      if (!provider) {
        setWalletState(prev => ({ ...prev, error: "请安装 MetaMask!" }));
        return;
      }

      // 使用 try-catch 包装请求，以防止可能的错误
      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts && accounts.length > 0) {
          setWalletState(prev => ({ 
            ...prev, 
            address: accounts[0],
            error: null 
          }));
        }
      } catch (requestError) {
        console.error("请求账户时出错:", requestError);
      }
    } catch (err) {
      console.error("检查钱包状态出错:", err);
      setWalletState(prev => ({ 
        ...prev, 
        error: "检查钱包状态时出错" 
      }));
    }
  };

  // 处理账户变更
  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length > 0) {
      setWalletState(prev => ({
        ...prev,
        address: accounts[0],
        error: null
      }));
      toast.success("钱包已连接");
    } else {
      setWalletState(prev => ({
        ...prev,
        address: "",
        error: "请连接钱包"
      }));
      toast.error("钱包已断开连接");
    }
  };

  // 修改连接钱包函数
  const connectWallet = async () => {
    try {
      setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));

      const provider = await getEthereumProvider();
      
      if (!provider) {
        throw new Error("请安装 MetaMask!");
      }

      // 使用 try-catch 包装所有与钱包的交互
      try {
        const accounts = await provider.request({
          method: 'eth_requestAccounts'
        });

        // 检查网络
        const chainId = await provider.request({ method: 'eth_chainId' });
        if (chainId !== '0xaa36a7') { // Sepolia
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0xaa36a7' }],
            });
          } catch (switchError: any) {
            // 处理用户拒绝切换网络的情况
            if (switchError.code === 4902) {
              throw new Error("请添加 Sepolia 网络");
            }
            throw new Error("请切换到 Sepolia 网络");
          }
        }

        if (accounts && accounts.length > 0) {
          setWalletState(prev => ({
            ...prev,
            address: accounts[0],
            error: null
          }));
          toast.success("钱包连接成功");
        }
      } catch (requestError: any) {
        // 处理用户拒绝连接的情况
        if (requestError.code === 4001) {
          throw new Error("用户拒绝连接钱包");
        }
        throw requestError;
      }
    } catch (err: any) {
      console.error("连接钱包出错:", err);
      setWalletState(prev => ({
        ...prev,
        error: err.message || "连接钱包时出错"
      }));
      toast.error(err.message || "连接钱包时出错");
    } finally {
      setWalletState(prev => ({ ...prev, isConnecting: false }));
    }
  };

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletState({
      address: "",
      isConnecting: false,
      error: null
    });
    toast.info("钱包已断开连接");
  };

  // 修改 useEffect，使用更安全的事件监听方式
  useEffect(() => {
    let mounted = true;

    const initWallet = async () => {
      if (mounted) {
        await checkWalletConnection();
      }
    };

    initWallet();

    const setupListeners = async () => {
      const provider = await getEthereumProvider();
      if (provider && mounted) {
        provider.on('accountsChanged', handleAccountsChanged);
        provider.on('chainChanged', () => {
          window.location.reload();
        });
      }
    };

    setupListeners();

    return () => {
      mounted = false;
      // 清理监听器
      const cleanup = async () => {
        const provider = await getEthereumProvider();
        if (provider) {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', () => {});
        }
      };
      cleanup();
    };
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet
  };
};

export default function Header() {
  const pathname = usePathname()
  const { address, isConnecting, error, connectWallet, disconnectWallet } = useWalletContext()
  const [hasMinted, setHasMinted] = useState(false)
  const [isMinting, setIsMinting] = useState(false)

  // 检查是否已铸造
  useEffect(() => {
    async function checkMinted() {
      if (address) {
        try {
          const minted = await usdtClient.hasMinted(address);
          setHasMinted(minted);
        } catch (error) {
          console.error('检查铸造状态失败:', error);
          toast.error('无法检查铸造状态');
        }
      }
    }
    checkMinted();
  }, [address]);

  // 处理铸造
  const handleMint = async () => {
    if (!address) {
      toast.error('请先连接钱包');
      return;
    }
    setIsMinting(true);
    try {
      const txHash = await usdtClient.mint(address);
      toast.success(`铸造 100 cUSDT 成功，交易哈希: ${txHash}`);
      setHasMinted(true);
    } catch (error: any) {
      console.error('铸造失败:', error);
      toast.error(error.message || '铸造失败，请稍后重试');
    } finally {
      setIsMinting(false);
    }
  };

  // 格式化钱包地址显示
  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const WalletButton = () => (
    <Button 
      variant="outline" 
      className="gap-2"
      onClick={address ? disconnectWallet : connectWallet}
      disabled={isConnecting}
    >
      <Wallet className="h-4 w-4" />
      <span>
        {isConnecting 
          ? "连接中..." 
          : address 
            ? formatAddress(address)
            : "连接钱包"
        }
      </span>
    </Button>
  )

  const MintButton = () => (
    <Button
      variant="outline"
      className="gap-2"
      onClick={handleMint}
      disabled={!address || isMinting || hasMinted}
    >
      <Coins className="h-4 w-4" />
      <span>
        {isMinting ? "铸造中..." : hasMinted ? "已铸造" : "铸造 cUSDT"}
      </span>
    </Button>
  )

  return (
    <header className="w-full border-b border-border bg-background">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-full bg-primary"></span>
            <span className="font-bold text-xl">NFT二手商品交易系统</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            {routes.map((route) => (
              <Link
                key={route.path}
                href={route.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  pathname === route.path ? "text-primary" : "text-muted-foreground",
                )}
              >
                {route.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">


          <div className="hidden md:flex items-center gap-2">
            <WalletButton />
            <MintButton />
          </div>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">菜单</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {routes.map((route) => (
                  <Link
                    key={route.path}
                    href={route.path}
                    className={cn(
                      "text-base font-medium transition-colors hover:text-primary",
                      pathname === route.path ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {route.name}
                  </Link>
                ))}
                <div className="h-px bg-border my-2" />
                <WalletButton />
                <MintButton />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}