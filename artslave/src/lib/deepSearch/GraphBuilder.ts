import { SearchNode, SearchEdge } from './types'

export class GraphBuilder {
  /**
   * 优化图结构
   */
  async optimizeGraph(nodes: SearchNode[], edges: SearchEdge[]): Promise<void> {
    try {
      // 移除孤立节点
      this.removeIsolatedNodes(nodes, edges)
      
      // 合并重复边
      this.mergeDuplicateEdges(edges)
      
      // 计算节点重要性
      this.calculateNodeImportance(nodes, edges)
      
      console.log(`Graph optimized: ${nodes.length} nodes, ${edges.length} edges`)
    } catch (error) {
      console.error('Graph optimization failed:', error)
    }
  }

  /**
   * 移除孤立节点
   */
  private removeIsolatedNodes(nodes: SearchNode[], edges: SearchEdge[]): void {
    const connectedNodeIds = new Set<string>()
    
    // 收集所有连接的节点ID
    edges.forEach(edge => {
      connectedNodeIds.add(edge.source)
      connectedNodeIds.add(edge.target)
    })

    // 移除孤立节点（保留核心节点）
    const indicesToRemove: number[] = []
    nodes.forEach((node, index) => {
      if (node.depth > 0 && !connectedNodeIds.has(node.id)) {
        indicesToRemove.push(index)
      }
    })

    // 从后往前删除，避免索引问题
    indicesToRemove.reverse().forEach(index => {
      nodes.splice(index, 1)
    })
  }

  /**
   * 合并重复边
   */
  private mergeDuplicateEdges(edges: SearchEdge[]): void {
    const edgeMap = new Map<string, SearchEdge>()
    
    edges.forEach(edge => {
      const key = `${edge.source}-${edge.target}-${edge.type}`
      const reverseKey = `${edge.target}-${edge.source}-${edge.type}`
      
      if (edgeMap.has(key)) {
        // 合并权重
        const existingEdge = edgeMap.get(key)!
        existingEdge.weight = Math.max(existingEdge.weight, edge.weight)
        existingEdge.metadata.evidence.push(...edge.metadata.evidence)
      } else if (edgeMap.has(reverseKey)) {
        // 处理反向边
        const existingEdge = edgeMap.get(reverseKey)!
        existingEdge.weight = Math.max(existingEdge.weight, edge.weight)
        existingEdge.metadata.evidence.push(...edge.metadata.evidence)
      } else {
        edgeMap.set(key, edge)
      }
    })

    // 清空原数组并添加合并后的边
    edges.length = 0
    edges.push(...Array.from(edgeMap.values()))
  }

  /**
   * 计算节点重要性
   */
  private calculateNodeImportance(nodes: SearchNode[], edges: SearchEdge[]): void {
    // 计算度中心性
    const degreeMap = new Map<string, number>()
    
    edges.forEach(edge => {
      degreeMap.set(edge.source, (degreeMap.get(edge.source) || 0) + 1)
      degreeMap.set(edge.target, (degreeMap.get(edge.target) || 0) + 1)
    })

    // 更新节点的重要性分数
    nodes.forEach(node => {
      const degree = degreeMap.get(node.id) || 0
      const maxDegree = Math.max(...Array.from(degreeMap.values()))
      
      // 结合度中心性和相关性分数
      const importanceScore = maxDegree > 0 
        ? (degree / maxDegree) * 0.5 + node.relevanceScore * 0.5
        : node.relevanceScore

      // 将重要性分数存储在节点数据中
      node.data.importanceScore = importanceScore
    })
  }
}
