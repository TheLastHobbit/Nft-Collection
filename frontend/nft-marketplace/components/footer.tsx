import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-primary"></span>
              <span className="font-bold text-xl">NFT藏品交易平台</span>
            </div>
            <p className="text-sm text-muted-foreground">发现、收集和交易稀有数字藏品的专业平台</p>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium">快速链接</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/explore">浏览藏品</Link>
              </li>
              <li>
                <Link href="/collections">热门系列</Link>
              </li>
              <li>
                <Link href="/artists">顶级创作者</Link>
              </li>
              <li>
                <Link href="/create">出售NFT</Link>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-base font-medium">帮助</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/faq">常见问题</Link>
              </li>
              <li>
                <Link href="/guide">使用指南</Link>
              </li>
              <li>
                <Link href="/contact">联系我们</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>© 2025 NFT藏品交易平台. 保留所有权利.</p>
        </div>
      </div>
    </footer>
  )
}
