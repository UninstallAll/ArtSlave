'use client'

import { useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormLabel, FormMessage } from '@/components/ui/form'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuthContext()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message)
    }
    
    setLoading(false)
  }

  return (
    <Card className="w-full max-w-md mx-auto border-0 shadow-2xl bg-white/80 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <CardTitle className="text-2xl font-bold text-slate-800">登录</CardTitle>
        <CardDescription className="text-slate-600">
          登录您的 ArtSlave 账户
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form onSubmit={handleSubmit}>
          <FormField>
            <FormLabel htmlFor="email" className="text-slate-700 font-medium">邮箱</FormLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="请输入您的邮箱"
            />
          </FormField>

          <FormField>
            <FormLabel htmlFor="password" className="text-slate-700 font-medium">密码</FormLabel>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="border-slate-300 focus:border-blue-500 focus:ring-blue-500"
              placeholder="请输入您的密码"
            />
          </FormField>

          {error && (
            <FormMessage className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200">
              {error}
            </FormMessage>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-0 shadow-lg h-12 text-base font-medium"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </Button>
        </Form>
      </CardContent>
    </Card>
  )
}
