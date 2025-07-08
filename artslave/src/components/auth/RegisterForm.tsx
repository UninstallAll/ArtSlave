'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  
  const { signUp } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('密码不匹配')
      setLoading(false)
      return
    }

    const { error } = await signUp(email, password)
    
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }
    
    setLoading(false)
  }

  if (success) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>注册成功</CardTitle>
          <CardDescription>
            请检查您的邮箱并点击确认链接来激活账户
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">注册</h2>
        <p className="text-gray-600">创建您的 ArtSlave 账户</p>
      </div>

      <Form onSubmit={handleSubmit}>
        <FormField>
          <FormLabel htmlFor="email" className="text-gray-700 font-medium">邮箱</FormLabel>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl h-12"
            placeholder="请输入您的邮箱"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="password" className="text-gray-700 font-medium">密码</FormLabel>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl h-12"
            placeholder="请输入密码（至少6位）"
          />
        </FormField>

        <FormField>
          <FormLabel htmlFor="confirmPassword" className="text-gray-700 font-medium">确认密码</FormLabel>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-2xl h-12"
            placeholder="请再次输入密码"
          />
        </FormField>

        {error && (
          <FormMessage className="bg-red-50 text-red-700 p-4 rounded-2xl border border-red-200">
            {error}
          </FormMessage>
        )}

        <Button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white border-0 rounded-2xl h-12 text-base font-semibold"
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </Button>
      </Form>
    </div>
  )
}
