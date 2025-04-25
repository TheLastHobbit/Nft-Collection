/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config) => {
        config.resolve.fallback = {
            fs: false,
            net: false,
            tls: false,
            crypto: false,
        };
        return config;
    },
    images: {
        domains: ['ipfs.io', 'gateway.pinata.cloud'], // 添加你的 IPFS 网关
    }
}

module.exports = nextConfig 
 