import { ethers } from 'ethers';
import NFTMarketVotingABI from '../contracts/Vote.json';

const contractAddress = '0x4354006F438a08c6E9786a35Cc6f920b1a51C9AD';

let provider;
let contract;

if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(contractAddress, NFTMarketVotingABI, provider);
}

/**
 * 创建投票请求
 * @param tokenId NFT的ID
 * @returns { txHash, requestId }
 */
export async function createVoteRequest(tokenId) {
  if (!contract || !provider) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.createVoteRequest(tokenId);
    const receipt = await tx.wait();
    const event = receipt.events.find((e) => e.event === 'VoteRequestCreated');
    if (!event) {
      throw new Error('未找到 VoteRequestCreated 事件');
    }
    console.log('createVoteRequest tx:', receipt.transactionHash);
    return { txHash: receipt.transactionHash, requestId: Number(event.args.requestId) };
  } catch (error) {
    console.error('创建投票请求失败:', error);
    throw error;
  }
}

/**
 * 对投票请求进行投票
 * @param requestId 投票请求ID
 * @param approve 是否赞同（true/false）
 * @returns 交易哈希
 */
export async function vote(requestId, approve) {
  if (!contract || !provider) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    const signer = provider.getSigner();
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.vote(requestId, approve);
    const receipt = await tx.wait();
    console.log('vote tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('投票失败:', error);
    throw error;
  }
}

/**
 * 查询投票状态
 * @param requestId 投票请求ID
 * @returns 投票状态对象
 */
export async function getVoteStatus(requestId) {
  if (!contract) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    const result = await contract.getVoteStatus(requestId);
    return {
      tokenId: Number(result.tokenId),
      requester: result.requester,
      voteCount: Number(result.voteCount),
      approveCount: Number(result.approveCount),
      result: Number(result.result), // 0: Pending, 1: Approved, 2: Rejected
    };
  } catch (error) {
    console.error('查询投票状态失败:', error);
    throw error;
  }
}

/**
 * 获取所有投票请求ID
 * @returns 投票请求ID数组
 */
export async function getAllVoteRequests() {
  if (!contract) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    const requestIds = await contract.getAllVoteRequests();
    return requestIds.map((id) => Number(id));
  } catch (error) {
    console.error('获取投票请求列表失败:', error);
    throw error;
  }
}

/**
 * 检查用户是否已投票
 * @param requestId 投票请求ID
 * @param voter 投票者地址
 * @returns 是否已投票
 */
export async function checkVoteStatus(requestId, voter) {
  if (!contract) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    return await contract.checkVoteStatus(requestId, voter);
  } catch (error) {
    console.error('检查投票状态失败:', error);
    throw error;
  }
}

/**
 * 通过 tokenId 获取 requestId
 * @param tokenId NFT的ID
 * @returns 投票请求ID（若无则为0）
 */
export async function getRequestIdByTokenId(tokenId) {
  if (!contract) {
    throw new Error('NFTMarketVoting 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  }
  try {
    const requestId = await contract.getRequestIdByTokenId(tokenId);
    return Number(requestId);
  } catch (error) {
    console.error('获取 tokenId 的 requestId 失败:', error);
    throw error;
  }
}