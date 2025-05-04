import Link from "next/link"

export default function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background">
      <div className="container px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="h-8 w-8 rounded-full bg-primary"></span>
              <span className="font-bold text-xl">NFT二手商品交易系统</span>
            </div>
          </div>
          <div className="mt-8 pt-4 border-t border-border/40 text-center text-sm text-muted-foreground">
          <p>Author: CUIT BlockChain Engineering 214: 刘骐宁</p>
          </div>

    
        </div>
      </div>
    </footer>
  )
}
