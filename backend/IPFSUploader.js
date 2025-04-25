import pinataSDK from '@pinata/sdk';
import fs from 'fs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const pinata = new pinataSDK(
    process.env.PINATA_API_KEY,
    process.env.PINATA_SECRET_KEY
);

// 定义支持的文件类型
const SUPPORTED_FILE_TYPES = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg'
};

export async function uploadFileToIPFS(filepath) {
    try {
        // 检查文件是否存在
        if (!fs.existsSync(filepath)) {
            throw new Error('File not found');
        }

        // 读取文件并检查文件类型
        const fileBuffer = fs.readFileSync(filepath);
        const fileType = await import('file-type');
        const fileInfo = await fileType.fileTypeFromBuffer(fileBuffer);

        if (!fileInfo || !SUPPORTED_FILE_TYPES[fileInfo.mime]) {
            throw new Error(`Unsupported file type. Supported types are: ${Object.keys(SUPPORTED_FILE_TYPES).join(', ')}`);
        }

        // 准备上传选项
        const options = {
            pinataMetadata: {
                name: path.basename(filepath)
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        // 创建可读流
        const readableStreamForFile = fs.createReadStream(filepath);
        const result = await pinata.pinFileToIPFS(readableStreamForFile, options);

        // 清理临时文件
        fs.unlinkSync(filepath);

        return {
            cid: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            fallbackUrls: [
                `https://ipfs.io/ipfs/${result.IpfsHash}`,
                `https://cloudflare-ipfs.com/ipfs/${result.IpfsHash}`
            ]
        };
    } catch (error) {
        console.error('Error uploading file to IPFS:', error);
        throw new Error(`Failed to upload file to IPFS: ${error.message}`);
    }
}

export async function uploadJsonDataToIPFS(jsonData) {
    try {
        const options = {
            pinataMetadata: {
                name: 'NFT Metadata'
            },
            pinataOptions: {
                cidVersion: 0
            }
        };

        const result = await pinata.pinJSONToIPFS(jsonData, options);

        return {
            cid: result.IpfsHash,
            url: `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`,
            fallbackUrls: [
                `https://ipfs.io/ipfs/${result.IpfsHash}`,
                `https://cloudflare-ipfs.com/ipfs/${result.IpfsHash}`
            ]
        };
    } catch (error) {
        console.error('Error uploading JSON to IPFS:', error);
        throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
    }
}