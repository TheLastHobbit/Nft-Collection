"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Upload, Info, AlertCircle, CheckCircle2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { uploadNFT } from '../../utils/api.ts'
import { useWalletContext } from "@/components/wallet-provider"
import { toast } from "sonner"
import { mintNFT } from '../../utils/contracts'

// 第一步表单验证
const step1Schema = z.object({
  name: z.string().min(3, {
    message: "名称至少需要3个字符",
  }),
  description: z.string().min(10, {
    message: "描述至少需要10个字符",
  }),
  price: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "请输入有效的价格",
  }),
})

// 第二步表单验证
const step2Schema = z.object({
  blockchain: z.string({
    required_error: "请选择区块链网络",
  }),
})

// 在文件顶部添加类型定义
interface Metadata {
  name: string;
  description: string;
  price: string;
  image: string;
  ipfsHash: string;
  metadataURL: string;
}

export default function CreateNFTPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [metadata, setMetadata] = useState<Metadata | null>(null)
  const { address } = useWalletContext()
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)

  // 第一步表单
  const step1Form = useForm<z.infer<typeof step1Schema>>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      name: "",
      description: "",
      price: "",
    },
  })

  // 第二步表单
  const step2Form = useForm<z.infer<typeof step2Schema>>({
    resolver: zodResolver(step2Schema),
    defaultValues: {
      blockchain: "",
    },
  })

  // 处理第一步提交
  async function onSubmitStep1(values: z.infer<typeof step1Schema>) {
    if (!imagePreview || !uploadedFile) {
      toast.error("请上传商品图片")
      return
    }

    if (!address) {
      toast.error("请先连接钱包")
      return
    }

    setIsSubmitting(true)

    try {
      // 创建 FormData
      const formData = new FormData()
      formData.append('file', uploadedFile)
      formData.append('title', values.name)
      formData.append('description', values.description)
      formData.append('address', address)

      // 调用后端接口
      const result = await uploadNFT(formData)

      // 保存元数据
      const metadataObj = {
        ...values,
        image: result.imageURL,
        ipfsHash: result.metadataCid,
        metadataURL: result.metadataURL,
      }
      setMetadata(metadataObj)
      
      toast.success("NFT 元数据上传成功！")
      setCurrentStep(2)
    } catch (error) {
      console.error('Upload error:', error)
      toast.error("上传失败，请重试")
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理第二步提交
  async function onSubmitStep2(values: z.infer<typeof step2Schema>) {
    if (!address || !metadata) {
      toast.error("缺少必要信息");
      return;
    }

    setIsSubmitting(true);

    try {
      // 调用合约进行铸造
      const txHash = await mintNFT(address, metadata.metadataURL);
      
      toast.success("NFT 铸造成功！");
      console.log("Transaction hash:", txHash);

      // 延迟跳转
      setTimeout(() => {
        window.location.href = "/my-collections";
      }, 2000);
    } catch (error) {
      console.error('Mint error:', error);
      if (error.message?.includes('user rejected transaction')) {
        toast.error("用户取消了交易");
      } else {
        toast.error("NFT 铸造失败，请重试");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error("请上传图片文件")
      return
    }

    // 验证文件大小（10MB）
    if (file.size > 10 * 1024 * 1024) {
      toast.error("文件大小不能超过10MB")
      return
    }

    setIsUploading(true)
    setUploadedFile(file)

    // 创建预览
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
      setIsUploading(false)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="container px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">创建二手商品NFT</h1>
        <p className="text-muted-foreground mt-2">填写信息并上传图片来创建二手商品的NFT</p>
      </div>

      <div className="mb-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute left-0 right-0 h-1 bg-muted"></div>
          <div className="relative flex justify-between w-full max-w-md mx-auto">
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${currentStep >= 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                1
              </div>
              <span className="text-sm mt-2">上传元数据</span>
            </div>
            <div className="flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center z-10 ${currentStep >= 2 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
              >
                2
              </div>
              <span className="text-sm mt-2">铸造商品</span>
            </div>
          </div>
        </div>
      </div>

      {currentStep === 1 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Form {...step1Form}>
              <form onSubmit={step1Form.handleSubmit(onSubmitStep1)} className="space-y-6">
                <FormField
                  control={step1Form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>商品名称 *</FormLabel>
                      <FormControl>
                        <Input placeholder="输入商品名称" {...field} />
                      </FormControl>
                      <FormDescription>命名您的二手商品</FormDescription>
                      <FormDescription>    </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

<FormField
                  control={step1Form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>价格 (cUSDT) *</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input placeholder="输入价格" {...field} />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-muted-foreground">
                            cUSDT
                          </div>
                        </div>
                      </FormControl>
                      <FormDescription>设置您的二手商品价格（以cUSDT为单位）</FormDescription>
                      <FormDescription> </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={step1Form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述 *</FormLabel>
                      <FormControl>
                        <Textarea placeholder="描述您的商品..." className="min-h-[120px]" {...field} />
                      </FormControl>
                      <FormDescription>详细描述您的商品，包括其成色、购买渠道等</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel className="block mb-2">上传图片 *</FormLabel>
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {!imagePreview ? (
                      <>
                        <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-2">拖放图片或点击上传</p>
                        <div className="relative">
                          <Input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={handleImageUpload}
                          />
                          <Button variant="outline" disabled={isUploading}>
                            {isUploading ? "上传中..." : "选择文件"}
                          </Button>
                        </div>
                      </>
                    ) : (
                      <div className="relative">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="商品预览"
                          width={300}
                          height={300}
                          className="mx-auto rounded-lg max-h-[300px] w-auto object-contain"
                        />
                        <Button variant="outline" size="sm" className="mt-4" onClick={() => setImagePreview(null)}>
                          更换图片
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <Button type="button" variant="outline">
                    保存草稿
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "处理中..." : "继续"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>

          <div>
            <div className="sticky top-20 space-y-6">
              <Link href="/my-collections">
                <Button className="w-full py-6 text-lg" size="lg">
                  查看我的商品
                </Button>
              </Link>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">创建商品指南</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>• 上传高质量的图片以吸引买家</p>
                  <p>• 详细描述您的二手商品以增加其可信度</p>
                  <p>• 设置合理的价格以提高销售机会</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Alert className="mb-6 bg-green-500/10 text-green-500 border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>元数据已保存</AlertTitle>
              <AlertDescription>您的数字商品元数据已上传保存在IPFS，哈希值: {metadata?.ipfsHash}</AlertDescription>
            </Alert>

            <Card className="mb-6">
              <CardHeader>
                <CardTitle>商品铸造</CardTitle>
                <CardDescription>选择区块链网络并铸造您的数字商品</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...step2Form}>
                  <form onSubmit={step2Form.handleSubmit(onSubmitStep2)} className="space-y-6">
                    <FormField
                      control={step2Form.control}
                      name="blockchain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>选择区块链网络 *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择区块链" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="ethereum">以太坊 (Ethereum)</SelectItem>
                              <SelectItem value="polygon">Polygon</SelectItem>
                              <SelectItem value="solana">Solana</SelectItem>
                              <SelectItem value="binance">币安智能链 (BSC)</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            选择您想要铸造数字商品的区块链网络。不同网络的Gas费用和处理时间各不相同。
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Alert variant="outline" className="mt-4">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>注意</AlertTitle>
                      <AlertDescription>
                        铸造数字商品需要支付Gas费用。确保您的钱包中有足够的加密货币来支付交易费用。
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-between pt-4">
                      <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                        返回
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "铸造中..." : "铸造商品"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          <div>
            <div className="sticky top-20 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>商品预览</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-square relative bg-muted rounded-lg overflow-hidden mb-4">
                    {imagePreview && (
                      <Image src={imagePreview || "/placeholder.svg"} alt="商品预览" fill className="object-contain" />
                    )}
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">名称</p>
                      <p className="font-medium">{metadata?.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">价格</p>
                      <p className="font-medium">{metadata?.price} ETH</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">描述</p>
                      <p className="text-sm line-clamp-3">{metadata?.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Alert variant="outline">
                <Info className="h-4 w-4" />
                <AlertTitle>铸造过程</AlertTitle>
                <AlertDescription className="text-sm">
                  铸造数字商品是将您的数字资产永久记录在区块链上的过程。一旦铸造完成，您的商品将可以在市场上出售。
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
