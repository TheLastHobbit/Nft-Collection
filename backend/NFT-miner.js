import { ethers } from 'ethers';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';

dotenv.config();

// 合约 ABI
const contractABI = JSON.parse(readFileSync(path.join(process.cwd(), '../contract/artifacts/contracts/erc721-nft.sol/MyNFT.json'))).abi;

// Sepolia 网络的合约地址（替换为你部署后的地址）
const NFT_CONTRACT_ADDRESS = "0x59E21E500069AeDf0544bba0C630d06836859AAa";

// 配置 provider 和 wallet
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const nftContract = new ethers.Contract(NFT_CONTRACT_ADDRESS, contractABI, wallet);

export async function mint(to, tokenURI) {
    try {
        console.log(`Minting NFT to ${to} with tokenURI: ${tokenURI}`);
        const tx = await nftContract.safeMint(to, tokenURI);
        console.log("Transaction hash:", tx.hash);
        await tx.wait();
        console.log("NFT minted successfully!");
        return tx.hash;
    } catch (error) {
        console.error("Error minting NFT:", error);
        throw error;
    }
}
