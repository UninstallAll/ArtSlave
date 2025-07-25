// 内容爬取服务

import { CrawlResult } from './types'

export interface CrawlerConfig {
  timeout: number
  maxRetries: number
  delay: number
  userAgent?: string
  enableJavaScript: boolean
}

export class ContentCrawler {
  private config: CrawlerConfig

  constructor(config: CrawlerConfig) {
    this.config = config
  }

  async crawl(url: string): Promise<CrawlResult> {
    const startTime = Date.now()
    let attempts = 0
    let lastError: Error | null = null

    while (attempts < this.config.maxRetries) {
      try {
        const result = await this.fetchContent(url)
        return {
          success: true,
          content: result.content,
          title: result.title,
          description: result.description,
          images: result.images,
          metadata: {
            ...result.metadata,
            processingTime: Date.now() - startTime,
            attempts: attempts + 1
          }
        }
      } catch (error) {
        lastError = error as Error
        attempts++

        if (attempts < this.config.maxRetries) {
          await this.delay(this.config.delay * attempts)
        }
      }
    }

    return {
      success: false,
      error: `爬取失败 (${attempts}次尝试): ${lastError?.message || '未知错误'}`
    }
  }

  private async fetchContent(url: string): Promise<{
    content: string
    title: string
    description?: string
    images: string[]
    metadata: Record<string, any>
  }> {
    try {
      new URL(url)
    } catch {
      throw new Error('无效的URL格式')
    }

    const headers: Record<string, string> = {
      'User-Agent': this.config.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch(url, {
        headers,
        signal: controller.signal,
        redirect: 'follow'
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const html = await response.text()
      return this.parseHtml(html, url)

    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('请求超时')
      }

      throw error
    }
  }

  private parseHtml(html: string, url: string): {
    content: string
    title: string
    description?: string
    images: string[]
    metadata: Record<string, any>
  } {
    const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : '无标题'

    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)
    const description = descMatch ? descMatch[1] : ''

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()

    const content = textContent.substring(0, 5000)

    const imgMatches = html.match(/<img[^>]*src=["']([^"']*)["']/gi) || []
    const images = imgMatches
      .map(match => {
        const srcMatch = match.match(/src=["']([^"']*)["']/)
        return srcMatch ? srcMatch[1] : null
      })
      .filter(Boolean)
      .slice(0, 10) as string[]

    const metadata = {
      language: 'zh',
      extractedAt: new Date().toISOString()
    }

    return {
      content,
      title,
      description,
      images,
      metadata
    }
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}