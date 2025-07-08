import { createClient } from '@supabase/supabase-js'

// 检查是否有真实的 Supabase 配置
const hasValidSupabaseConfig =
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('your_supabase_url') &&
  !process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder') &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://') &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 20

export const supabase = hasValidSupabaseConfig
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  : null

// 服务端使用的客户端（具有更高权限）
export const supabaseAdmin = hasValidSupabaseConfig &&
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  !process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your_supabase_service_role_key') &&
  process.env.SUPABASE_SERVICE_ROLE_KEY.length > 20
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null
