import { ethers } from 'ethers';
import MyNFTABI from '../contracts/MyNFT.json';
import MarketABI from '../contracts/Market.json';
import cUSDTABI from '../contracts/cUSDT.json';
import axios from 'axios';

const myNFTAddress = '0x2C3a706039846849107c17cDFD22F6BbC753d764';
const marketAddress = '0x7d18D936F6a734AA60890f23313FaF2012B65377';
const cUSDTAddress = '0x19872bECF513D7064ddDd33638E1CC097373af1c'; // 替换为实际 cUSDT 地址
const pinataGateway = 'https://gateway.pinata.cloud';

let provider: ethers.providers.Web3Provider | undefined;
let myNFTContract: ethers.Contract | undefined;
let marketContract: ethers.Contract | undefined;
let cUSDTContract: ethers.Contract | undefined;

if (typeof window !== 'undefined' && window.ethereum) {
  provider = new ethers.providers.Web3Provider(window.ethereum);
  myNFTContract = new ethers.Contract(myNFTAddress, MyNFTABI, provider);
  marketContract = new ethers.Contract(marketAddress, MarketABI, provider);
  cUSDTContract = new ethers.Contract(cUSDTAddress, cUSDTABI, provider);
}

export async function balanceOf(address: string): Promise<string> {
  if (!myNFTContract) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const result = await myNFTContract.balanceOf(address);
  return ethers.utils.formatUnits(result, 0);
}

export async function tokenOfOwnerByIndex(owner: string, index: number): Promise<number> {
  if (!myNFTContract) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  const result = await myNFTContract.tokenOfOwnerByIndex(owner, index);
  return Number(result);
}

export async function tokenURI(tokenId: number): Promise<string> {
  if (!myNFTContract) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
  return await myNFTContract.tokenURI(tokenId);
}

export async function getMetadata(tokenId: number): Promise<{ title: string; description: string; imageURL: string }> {
  try {
    if (!myNFTContract) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const result = await tokenURI(tokenId);
    console.log('tokenURI:', result);
    let metadataUrl = result;
    if (result.startsWith('ipfs://')) {
      metadataUrl = `${pinataGateway}/ipfs/${result.replace('ipfs://', '')}`;
    }
    const response = await axios.get(metadataUrl);
    console.log('metadata:', response.data);
    let imageURL = response.data.image || response.data.imageURL || response.data.image_url || '';
    if (imageURL.startsWith('ipfs://')) {
      imageURL = `${pinataGateway}/ipfs/${imageURL.replace('ipfs://', '')}`;
    }
    return {
      title: response.data.name || response.data.title || 'Unknown',
      description: response.data.description || '',
      imageURL,
    };
  } catch (error) {
    console.error('获取元数据失败:', error);
    throw error;
  }
}

export async function getUserNFTs(address: string): Promise<{ nfts: Array<{ id: number; title: string; description: string; image: string; owner: string }>; balance: string }> {
  try {
    if (!myNFTContract || !provider) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const signer = await provider.getSigner();
    const contractWithSigner = myNFTContract.connect(signer);

    const balance = await balanceOf(address);
    const nfts: Array<{ id: number; title: string; description: string; image: string; owner: string }> = [];

    for (let i = 0; i < Number(balance); i++) {
      const tokenId = await tokenOfOwnerByIndex(address, i);
      const metadata = await getMetadata(tokenId);
      nfts.push({
        id: tokenId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.imageURL,
        owner: address,
      });
    }

    return { nfts, balance };
  } catch (error) {
    console.error('获取 NFT 失败:', error);
    throw error;
  }
}

export async function getSellingNFTs(address: string): Promise<{ nfts: Array<{ id: number; title: string; description: string; image: string; owner: string }>; balance: string }> {
  try {
    if (!marketContract || !myNFTContract || !provider) throw new Error('合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const signer = await provider.getSigner();
    const marketWithSigner = marketContract.connect(signer);

    const orders = await marketWithSigner.getMyNFTs();
    console.log('Market orders:', orders);

    const nfts: Array<{ id: number; title: string; description: string; image: string; owner: string }> = [];

    for (const order of orders) {
      const tokenId = Number(order.tokenId);
      if (tokenId === 0 && order.seller === ethers.constants.AddressZero) continue;
      const metadata = await getMetadata(tokenId);
      nfts.push({
        id: tokenId,
        title: metadata.title,
        description: metadata.description,
        image: metadata.imageURL,
        owner: order.seller,
      });
    }

    return { nfts, balance: String(nfts.length) };
  } catch (error) {
    console.error('获取在售 NFT 失败:', error);
    throw error;
  }
}

export async function sellNFT(seller: string, tokenId: number, price: string): Promise<void> {
  try {
    if (!myNFTContract || !provider) throw new Error('MyNFT 合约未初始化，请确保在浏览器中运行并安装 MetaMask');
    const signer = await provider.getSigner();
    const myNFTWithSigner = myNFTContract.connect(signer);

    const priceWei = ethers.utils.parseUnits(price, 18); // 假设 cUSDT 为 18 位小数
    const priceData = ethers.utils.hexZeroPad(priceWei.toHexString(), 32);

    const tx = await myNFTWithSigner['safeTransferFrom(address,address,uint256,bytes)'](
      seller,
      marketAddress,
      tokenId,
      priceData
    );
    await tx.wait();
  } catch (error) {
    console.error('上架 NFT 失败:', error);
    throw error;
  }
}