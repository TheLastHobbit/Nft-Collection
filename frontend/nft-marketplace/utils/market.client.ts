import { ethers } from 'ethers';
import MarketABI from '../contracts/Market.json';
import * as nftClient from './nft.client';
import * as cUSDTClient from './usdt.client';

const contractAddress = '0x7d18D936F6a734AA60890f23313FaF2012B65377';

let provider: ethers.providers.Web3Provider | undefined;
let contract: ethers.Contract | undefined;

if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(contractAddress, MarketABI, provider);
}

export async function buy(tokenId: number, buyer: string): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    // 获取订单价格
    const order = await getOrder(tokenId);
    if (!order.seller || order.price <= 0) {
      throw new Error('订单不存在或价格无效');
    }

    // 检查 cUSDT 授权额度
    const allowance = await cUSDTClient.getAllowance(buyer, contractAddress);
    if (allowance < order.price) {
      console.log(`授权 cUSDT: ${order.price} 到 Market`);
      await cUSDTClient.approve(contractAddress, order.price.toString());
    }

    // 执行购买
    const tx = await contractWithSigner.buy(tokenId);
    const receipt = await tx.wait();
    console.log('buy tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('购买 NFT 失败:', error);
    throw error;
  }
}

export async function changePrice(tokenId: number, price: string): Promise<string> {
  if (!contract || !provider) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer);
  const priceWei = ethers.utils.parseUnits(price, 18);
  const tx = await contractWithSigner.changePrice(tokenId, priceWei);
  const receipt = await tx.wait();
  console.log('change price tx:', receipt.transactionHash);
  return receipt.transactionHash;
}

export async function cancelOrder(tokenId: number): Promise<string> {
  if (!contract || !provider) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer);
  const tx = await contractWithSigner.cancelOrder(tokenId);
  const receipt = await tx.wait();
  console.log('cancel order tx:', receipt.transactionHash);
  return receipt.transactionHash;
}

export async function getAllNFTs(): Promise<Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }>> {
  try {
    if (!contract) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const orders = await contract.getAllNFTs();
    console.log('All market orders:', orders);

    const nfts: Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }> = [];

    for (const order of orders) {
      const tokenId = Number(order.tokenId);
      if (tokenId === 0 && order.seller === ethers.constants.AddressZero) continue;
      const metadata = await nftClient.getMetadata(tokenId);
      nfts.push({
        id: tokenId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.imageURL,
        seller: order.seller,
        price: Number(ethers.utils.formatUnits(order.price, 18)),
      });
    }

    return nfts;
  } catch (error) {
    console.error('获取所有在售 NFT 失败:', error);
    throw error;
  }
}

export async function getMyNFTs(): Promise<Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }>> {
  try {
    if (!contract || !provider) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const orders = await contractWithSigner.getMyNFTs();
    console.log('My market orders:', orders);

    const nfts: Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }> = [];

    for (const order of orders) {
      const tokenId = Number(order.tokenId);
      if (tokenId === 0 && order.seller === ethers.constants.AddressZero) continue;
      const metadata = await nftClient.getMetadata(tokenId);
      nfts.push({
        id: tokenId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.imageURL,
        seller: order.seller,
        price: Number(ethers.utils.formatUnits(order.price, 18)),
      });
    }

    return nfts;
  } catch (error) {
    console.error('获取我的在售 NFT 失败:', error);
    throw error;
  }
}

export async function getOrder(tokenId: number): Promise<{ seller: string; tokenId: number; price: number }> {
  try {
    if (!contract) throw new Error('Market 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const result = await contract.orderOfId(tokenId);
    return {
      seller: result.seller,
      tokenId: Number(result.tokenId),
      price: Number(ethers.utils.formatUnits(result.price, 18)),
    };
  } catch (error) {
    console.error('获取订单失败:', error);
    throw error;
  }
}