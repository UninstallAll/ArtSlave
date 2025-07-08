'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'

export default function Home() {
  const { user, loading, signOut } = useAuthContext()
  const [showRegister, setShowRegister] = useState(false)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">加载中...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-4">
          {showRegister ? <RegisterForm /> : <LoginForm />}
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setShowRegister(!showRegister)}
            >
              {showRegister ? '已有账户？点击登录' : '没有账户？点击注册'}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">ArtSlave</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                欢迎，{user.email}
              </span>
              <Button
                variant="outline"
                onClick={() => signOut()}
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>投稿信息</CardTitle>
              <CardDescription>
                浏览和搜索最新的投稿机会
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                查看投稿信息
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>我的作品集</CardTitle>
              <CardDescription>
                管理您的艺术作品和资料
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                管理作品集
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI 匹配</CardTitle>
              <CardDescription>
                查看为您推荐的投稿机会
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                查看推荐
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>投稿记录</CardTitle>
              <CardDescription>
                跟踪您的投稿状态
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                查看记录
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>数据收集</CardTitle>
              <CardDescription>
                管理爬虫和数据源
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                数据管理
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>设置</CardTitle>
              <CardDescription>
                个人资料和系统设置
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                系统设置
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
