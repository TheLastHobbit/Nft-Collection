import { ethers } from 'ethers';
import cUSDTABI from '../contracts/cUSDT.json';

const contractAddress = '0x19872bECF513D7064ddDd33638E1CC097373af1c';

let provider: ethers.providers.Web3Provider | undefined;
let contract: ethers.Contract | undefined;

if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  contract = new ethers.Contract(contractAddress, cUSDTABI, provider);
}

export async function approve(spender: string, amount: string): Promise<string> {
  if (!contract || !provider) throw new Error('cUSDT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const signer = await provider.getSigner();
  const contractWithSigner = contract.connect(signer);
  const amountWei = ethers.utils.parseUnits(amount, 18); // cUSDT 为 18 位小数
  const tx = await contractWithSigner.approve(spender, amountWei);
  const receipt = await tx.wait();
  console.log('approve tx:', receipt.transactionHash);
  return receipt.transactionHash;
}

export async function getAllowance(owner: string, spender: string): Promise<number> {
  if (!contract) throw new Error('cUSDT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const result = await contract.allowance(owner, spender);
  return Number(ethers.utils.formatUnits(result, 18)); // 转换为 cUSDT
}

export async function balanceOf(address: string): Promise<number> {
  try {
    if (!contract) throw new Error('cUSDT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const result = await contract.balanceOf(address);
    return Number(ethers.utils.formatUnits(result, 18)); // 转换为 cUSDT
  } catch (error) {
    console.error('获取 cUSDT 余额失败:', error);
    throw error;
  }
}

export async function mint(address: string): Promise<string> {
  if (!contract || !provider) throw new Error('cUSDT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  try {
    const signer = provider.getSigner(address);
    const contractWithSigner = contract.connect(signer);
    const tx = await contractWithSigner.mint();
    const receipt = await tx.wait();
    console.log('mint tx:', receipt.transactionHash);
    return receipt.transactionHash;
  } catch (error) {
    console.error('铸造 cUSDT 失败:', error);
    throw error;
  }
}

export async function hasMinted(address: string): Promise<boolean> {
  if (!contract) throw new Error('cUSDT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  try {
    const result = await contract.hasMinted(address);
    return result;
  } catch (error) {
    console.error('检查铸造状态失败:', error);
    throw error;
  }
}