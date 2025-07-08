'use client'

import { useAuthContext } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  FileText,
  Palette,
  Brain,
  History,
  Database,
  Settings,
  AlertTriangle,
  Sparkles
} from 'lucide-react'

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

  // 如果 Supabase 未配置，显示开发模式页面
  if (!supabase) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">
                  ArtSlave
                </h1>
              </div>
              <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-2xl text-sm font-medium">
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                开发模式
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="mb-8 bg-white rounded-3xl p-8 shadow-sm border-2 border-black">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-amber-700 flex items-center mb-2">
                <AlertTriangle className="w-6 h-6 mr-3" />
                开发模式
              </h2>
              <p className="text-lg text-gray-600">
                Supabase 尚未配置，当前运行在开发模式下
              </p>
            </div>
            <div className="space-y-6">
              <p className="text-gray-700">
                要启用完整功能，请配置以下环境变量：
              </p>
              <div className="bg-gray-900 p-6 rounded-2xl font-mono text-sm text-green-400 border-2 border-black">
                <div className="space-y-2">
                  <div><span className="text-blue-400">NEXT_PUBLIC_SUPABASE_URL</span>=your_supabase_url</div>
                  <div><span className="text-blue-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=your_anon_key</div>
                  <div><span className="text-blue-400">SUPABASE_SERVICE_ROLE_KEY</span>=your_service_role_key</div>
                </div>
              </div>
              <div className="text-gray-600 bg-blue-50 p-4 rounded-2xl border-2 border-black">
                💡 配置完成后重启开发服务器即可启用认证功能。
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                  <FileText className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">投稿信息</h3>
                <p className="text-gray-600 text-sm">
                  浏览和搜索最新的投稿机会
                </p>
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3" disabled>
                查看投稿信息 (开发中)
              </Button>
            </div>

            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-4">
                  <Palette className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">我的作品集</h3>
                <p className="text-gray-600 text-sm">
                  管理您的艺术作品和资料
                </p>
              </div>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3" disabled>
                管理作品集 (开发中)
              </Button>
            </div>

            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
                  <Brain className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">AI 匹配</h3>
                <p className="text-gray-600 text-sm">
                  查看为您推荐的投稿机会
                </p>
              </div>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3" disabled>
                查看推荐 (开发中)
              </Button>
            </div>

            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mb-4">
                  <History className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">投稿记录</h3>
                <p className="text-gray-600 text-sm">
                  跟踪您的投稿状态
                </p>
              </div>
              <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3" disabled>
                查看记录 (开发中)
              </Button>
            </div>

            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center mb-4">
                  <Database className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">数据收集</h3>
                <p className="text-gray-600 text-sm">
                  管理爬虫和数据源
                </p>
              </div>
              <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl py-3" disabled>
                数据管理 (开发中)
              </Button>
            </div>

            <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
              <div className="mb-4">
                <div className="w-14 h-14 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                  <Settings className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">设置</h3>
                <p className="text-gray-600 text-sm">
                  个人资料和系统设置
                </p>
              </div>
              <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white rounded-2xl py-3" disabled>
                系统设置 (开发中)
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-black rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">
              ArtSlave
            </h1>
            <p className="text-gray-600 mt-2">艺术投稿信息自动化平台</p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-sm border-2 border-black">
            {showRegister ? <RegisterForm /> : <LoginForm />}

            <div className="text-center mt-6">
              <Button
                variant="link"
                onClick={() => setShowRegister(!showRegister)}
                className="text-gray-600 hover:text-gray-800"
              >
                {showRegister ? '已有账户？点击登录' : '没有账户？点击注册'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-black rounded-2xl flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">
                ArtSlave
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-2xl">
                欢迎，{user.email}
              </span>
              <Button
                variant="outline"
                onClick={() => signOut()}
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-2xl"
              >
                退出登录
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mb-4">
                <FileText className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">投稿信息</h3>
              <p className="text-gray-600 text-sm">
                浏览和搜索最新的投稿机会
              </p>
            </div>
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-2xl py-3">
              查看投稿信息
            </Button>
          </div>

          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <Palette className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">我的作品集</h3>
              <p className="text-gray-600 text-sm">
                管理您的艺术作品和资料
              </p>
            </div>
            <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white rounded-2xl py-3">
              管理作品集
            </Button>
          </div>

          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-green-600 rounded-2xl flex items-center justify-center mb-4">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">AI 匹配</h3>
              <p className="text-gray-600 text-sm">
                查看为您推荐的投稿机会
              </p>
            </div>
            <Button className="w-full bg-green-600 hover:bg-green-700 text-white rounded-2xl py-3">
              查看推荐
            </Button>
          </div>

          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-orange-600 rounded-2xl flex items-center justify-center mb-4">
                <History className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">投稿记录</h3>
              <p className="text-gray-600 text-sm">
                跟踪您的投稿状态
              </p>
            </div>
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-2xl py-3">
              查看记录
            </Button>
          </div>

          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-cyan-600 rounded-2xl flex items-center justify-center mb-4">
                <Database className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">数据收集</h3>
              <p className="text-gray-600 text-sm">
                管理爬虫和数据源
              </p>
            </div>
            <Button className="w-full bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl py-3">
              数据管理
            </Button>
          </div>

          <div className="group bg-white rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 border-2 border-black">
            <div className="mb-4">
              <div className="w-14 h-14 bg-gray-700 rounded-2xl flex items-center justify-center mb-4">
                <Settings className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">设置</h3>
              <p className="text-gray-600 text-sm">
                个人资料和系统设置
              </p>
            </div>
            <Button className="w-full bg-gray-700 hover:bg-gray-800 text-white rounded-2xl py-3">
              系统设置
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
