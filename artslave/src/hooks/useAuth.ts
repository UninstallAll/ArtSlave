'use client'

import { useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 如果 Supabase 未配置，直接设置为未登录状态
    if (!supabase) {
      setLoading(false)
      return
    }

    // 获取当前用户
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (error) {
        console.warn('Supabase auth error:', error)
        setUser(null)
      }
      setLoading(false)
    }

    getUser()

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase 未配置' } }
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: '登录失败' } }
    }
  }

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase 未配置' } }
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: '注册失败' } }
    }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase 未配置' } }
    }

    try {
      const { error } = await supabase.auth.signOut()
      return { error }
    } catch (error) {
      return { error: { message: '退出登录失败' } }
    }
  }

  const resetPassword = async (email: string) => {
    if (!supabase) {
      return { data: null, error: { message: 'Supabase 未配置' } }
    }

    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email)
      return { data, error }
    } catch (error) {
      return { data: null, error: { message: '重置密码失败' } }
    }
  }

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  }
}
