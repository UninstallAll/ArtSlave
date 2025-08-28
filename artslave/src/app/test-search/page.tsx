'use client'

import { useState } from 'react'

export default function TestSearchPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  const testSearch = async () => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch('/api/deep-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coreNode: {
            name: 'David Hockney',
            type: 'artist'
          },
          preset: 'quick'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Unknown error')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">深度搜索测试</h1>
      
      <button 
        onClick={testSearch}
        disabled={loading}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? '搜索中...' : '测试搜索 David Hockney'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          错误: {error}
        </div>
      )}

      {result && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">搜索结果</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <p><strong>总节点数:</strong> {result.metadata?.totalNodes || 0}</p>
            <p><strong>总边数:</strong> {result.metadata?.totalEdges || 0}</p>
            <p><strong>搜索耗时:</strong> {result.metadata?.searchDuration || 0}ms</p>
          </div>

          <h3 className="text-xl font-bold mt-6 mb-4">节点列表</h3>
          <div className="space-y-4">
            {result.nodes?.map((node: any, index: number) => (
              <div key={index} className="bg-white p-4 rounded-lg border shadow-sm">
                <h4 className="font-bold text-lg">{node.name}</h4>
                <p className="text-gray-600">类型: {node.type}</p>
                <p className="text-gray-600">相关性: {(node.relevanceScore * 100).toFixed(1)}%</p>
                <p className="text-gray-600">深度: {node.depth}</p>
                {Object.keys(node.data || {}).length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold">数据:</p>
                    <pre className="text-xs bg-gray-100 p-2 rounded">
                      {JSON.stringify(node.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
