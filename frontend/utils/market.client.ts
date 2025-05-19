import { ethers } from 'ethers';
import MarketABI from '../contracts/Market.json';
import * as nftClient from './nft.client';
import * as cUSDTClient from './usdt.client';

const contractAddress = '0x5B27ceDe277D7d5aE4bAd94568161dd70d4dA8E1';

let provider: ethers.providers.Web3Provider | undefined;
let contract: ethers.Contract | undefined;

if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(contractAddress, MarketABI, provider);
}

export async function buy(tokenId: number, buyer: string): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);

    // 获取订单价格
    const order = await getOrder(tokenId);
    if (!order.seller || order.price <= 0) {
      throw new Error('Order does not exist or price is invalid');
    }

    // 检查 cUSDT 授权额度
    const allowance = await cUSDTClient.getAllowance(buyer, contractAddress);
    if (allowance < order.price) {
      console.log(`Authorizing cUSDT: ${order.price} to Market`);
      await cUSDTClient.approve(contractAddress, order.price.toString());
    }

    // 执行购买（锁定资金并下架）
    const tx = await contractWithSigner.buy(tokenId);
    const receipt = await tx.wait();
    console.log('buy tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to buy NFT:', error);
    throw error;
  }
}

export async function confirmTransaction(tokenId: number): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.confirmTransaction(tokenId);
    const receipt = await tx.wait();
    console.log('confirm transaction tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to confirm transaction:', error);
    throw error;
  }
}

export async function createDispute(tokenId: number): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.createDispute(tokenId);
    const receipt = await tx.wait();
    console.log('create dispute tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to create dispute:', error);
    throw error;
  }
}

export async function voteDispute(requestId: number, approveBuyer: boolean): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.voteDispute(requestId, approveBuyer);
    const receipt = await tx.wait();
    console.log('vote dispute tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to vote on dispute:', error);
    throw error;
  }
}

export async function getDisputeVoteDetails(requestId: number): Promise<{
  tokenId: number;
  requester: string;
  votes: Array<{ voter: string; hasVoted: boolean; approveBuyer: boolean }>;
  voteCount: number;
  approveBuyerCount: number;
  result: number; // 0: Pending, 1: BuyerWins, 2: SellerWins
}> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    console.log("requestId:", requestId);
    const voteRequest = await contract.getDisputeVoteDetails(requestId);
    console.log("voteRequest:", voteRequest);
    return {
      tokenId: Number(voteRequest.tokenId),
      requester: voteRequest.requester,
      votes: voteRequest.votes.map((vote: any) => ({
        voter: vote.voter,
        hasVoted: vote.hasVoted,
        approveBuyer: vote.approveBuyer,
      })),
      voteCount: Number(voteRequest.voteCount),
      approveBuyerCount: Number(voteRequest.approveBuyerCount),
      result: Number(voteRequest.result),
    };
  } catch (error) {
    console.error('Failed to get dispute vote details:', error);
    throw error;
  }
}

export async function executeDisputeTransaction(tokenId: number): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.executeDisputeTransaction(tokenId);
    const receipt = await tx.wait();
    console.log('execute dispute transaction tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to execute dispute transaction:', error);
    throw error;
  }
}

export async function getDispute(tokenId: number): Promise<{
  seller: string;
  buyer: string;
  amount: number;
  timestamp: number;
  result: number; // 0: Pending, 1: BuyerWins, 2: SellerWins
  voteRequestId: number;
  tokenId: number;
}> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const dispute = await contract.getDispute(tokenId);
    return {
      seller: dispute.seller,
      buyer: dispute.buyer,
      amount: Number(ethers.utils.formatUnits(dispute.amount, 18)),
      timestamp: Number(dispute.timestamp),
      result: Number(dispute.result),
      voteRequestId: Number(dispute.voteRequestId),
      tokenId: Number(dispute.tokenId),
    };
  } catch (error) {
    console.error('Failed to get dispute:', error);
    throw error;
  }
}

export async function getAllDisputes(): Promise<Array<{
  seller: string;
  buyer: string;
  amount: number;
  timestamp: number;
  result: number; // 0: Pending, 1: BuyerWins, 2: SellerWins
  voteRequestId: number;
  tokenId: number;
}>> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const disputes = await contract.getAllDisputes();
    return disputes.map((d: any) => ({
      seller: d.seller,
      buyer: d.buyer,
      amount: Number(ethers.utils.formatUnits(d.amount, 18)),
      timestamp: Number(d.timestamp),
      result: Number(d.result),
      voteRequestId: Number(d.voteRequestId),
      tokenId: Number(d.tokenId),
    }));
  } catch (error) {
    console.error('Failed to get all disputes:', error);
    throw error;
  }
}

export async function changePrice(tokenId: number, price: string): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const priceWei = ethers.utils.parseUnits(price, 18);
    const tx = await contractWithSigner.changePrice(tokenId, priceWei);
    const receipt = await tx.wait();
    console.log('change price tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to change price:', error);
    throw error;
  }
}

export async function cancelOrder(tokenId: number): Promise<string> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.cancelOrder(tokenId);
    const receipt = await tx.wait();
    console.log('cancel order tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('Failed to cancel order:', error);
    throw error;
  }
}

export async function getAllNFTs(): Promise<Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }>> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
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
    console.error('Failed to get all listed NFTs:', error);
    throw error;
  }
}

export async function getMyNFTs(): Promise<Array<{ id: number; title: string; description: string; image: string; seller: string; price: number }>> {
  try {
    if (!contract || !provider) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
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
    console.error('Failed to get my listed NFTs:', error);
    throw error;
  }
}

export async function getOrder(tokenId: number): Promise<{ seller: string; tokenId: number; price: number }> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    const result = await contract.orderOfId(tokenId);
    return {
      seller: result.seller,
      tokenId: Number(result.tokenId),
      price: Number(ethers.utils.formatUnits(result.price, 18)),
    };
  } catch (error) {
    console.error('Failed to get order:', error);
    throw error;
  }
}

export async function hasDisputeVoted(requestId: number, voter: string): Promise<boolean> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    return await contract.hasDisputeVoted(requestId, voter);
  } catch (error) {
    console.error('Failed to check if voted:', error);
    throw error;
  }
}

export async function getTransactionConfirmations(tokenId: number, confirmer: string): Promise<boolean> {
  try {
    if (!contract) throw new Error('Market contract not initialized, ensure running in browser with MetaMask');
    return await contract.transactionConfirmations(tokenId, confirmer);
  } catch (error) {
    console.error('Failed to get transaction confirmations:', error);
    throw error;
  }
}

// 订阅争议事件
export function subscribeToDisputeEvents(
  callback: (event: string, data: any) => void,
  requestId?: number
): () => void {
  if (!contract || !window.ethereum) {
    console.error('Cannot subscribe to events: Contract or Ethereum not initialized');
    return () => {};
  }

  const handleDisputeVoted = (reqId: number, voter: string, approveBuyer: boolean) => {
    if (!requestId || reqId === requestId) {
      callback('DisputeVoted', { requestId: reqId, voter, approveBuyer });
    }
  };

  const handleDisputeVoteFinalized = (reqId: number, result: number) => {
    if (!requestId || reqId === requestId) {
      callback('DisputeVoteFinalized', { requestId: reqId, result });
    }
  };

  contract.on('DisputeVoted', handleDisputeVoted);
  contract.on('DisputeVoteFinalized', handleDisputeVoteFinalized);

  return () => {
    contract.off('DisputeVoted', handleDisputeVoted);
    contract.off('DisputeVoteFinalized', handleDisputeVoteFinalized);
  };
}