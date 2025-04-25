import { ethers } from 'ethers';
import NFTAbi from '../contracts/MyNFT.json';

// 使用你部署的合约地址
const NFT_CONTRACT_ADDRESS = "0x2C3a706039846849107c17cDFD22F6BbC753d764";

export async function mintNFT(address: string, tokenURI: string) {
    try {
        // 检查是否有 window.ethereum
        if (!window.ethereum) {
            throw new Error("请安装 MetaMask!");
        }


        // 创建 provider 和 signer
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        
        // 创建合约实例
        const nftContract = new ethers.Contract(
            NFT_CONTRACT_ADDRESS,
            NFTAbi,
            signer
        );

        // 调用合约的 mint 函数
        const tx = await nftContract.safeMint(address, tokenURI);
        console.log("Minting transaction hash:", tx.hash);
        
        // 等待交易确认
        await tx.wait();
        console.log("NFT minted successfully!");
        
        return tx.hash;
    } catch (error: any) {
        console.error("Error minting NFT:", error);
        // 处理用户拒绝交易的情况
        if (error.code === 4001) {
            throw new Error("用户取消了交易");
        }
        // 处理网络错误
        if (error.code === 'NETWORK_ERROR') {
            throw new Error("网络错误，请检查您是否连接到正确的网络");
        }
        // 处理其他错误
        throw new Error(error.message || "铸造 NFT 失败");
    }
}

// 声明全局 window 类型
declare global {
    interface Window {
        ethereum: any;
    }
}