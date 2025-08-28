'use client';

import React, { useCallback, useState, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  Panel,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// 自定义节点类型
const CustomNode = ({ data, selected }: any) => {
  const getNodeStyle = (type: string) => {
    const baseStyle = {
      padding: '10px 15px',
      borderRadius: '8px',
      border: '2px solid',
      background: 'white',
      fontSize: '12px',
      fontWeight: '500',
      minWidth: '120px',
      textAlign: 'center' as const,
      boxShadow: selected ? '0 0 0 2px #3b82f6' : '0 2px 4px rgba(0,0,0,0.1)',
    };

    switch (type) {
      case 'artist':
        return { ...baseStyle, borderColor: '#ef4444', color: '#dc2626' };
      case 'exhibition':
        return { ...baseStyle, borderColor: '#8b5cf6', color: '#7c3aed' };
      case 'institution':
        return { ...baseStyle, borderColor: '#06b6d4', color: '#0891b2' };
      case 'artwork':
        return { ...baseStyle, borderColor: '#f59e0b', color: '#d97706' };
      case 'movement':
        return { ...baseStyle, borderColor: '#10b981', color: '#059669' };
      default:
        return { ...baseStyle, borderColor: '#6b7280', color: '#4b5563' };
    }
  };

  return (
    <div style={getNodeStyle(data.type)}>
      <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
        {data.label}
      </div>
      {data.subtitle && (
        <div style={{ fontSize: '10px', opacity: 0.7 }}>
          {data.subtitle}
        </div>
      )}
    </div>
  );
};

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

// 示例数据
const initialNodes: Node[] = [
  {
    id: '1',
    type: 'custom',
    position: { x: 250, y: 100 },
    data: { 
      label: '毕加索',
      subtitle: '1881-1973',
      type: 'artist'
    },
  },
  {
    id: '2',
    type: 'custom',
    position: { x: 100, y: 200 },
    data: { 
      label: '立体主义',
      subtitle: '艺术运动',
      type: 'movement'
    },
  },
  {
    id: '3',
    type: 'custom',
    position: { x: 400, y: 200 },
    data: { 
      label: '格尔尼卡',
      subtitle: '1937',
      type: 'artwork'
    },
  },
  {
    id: '4',
    type: 'custom',
    position: { x: 250, y: 300 },
    data: { 
      label: '现代艺术博物馆',
      subtitle: '纽约',
      type: 'institution'
    },
  },
  {
    id: '5',
    type: 'custom',
    position: { x: 550, y: 150 },
    data: { 
      label: '毕加索回顾展',
      subtitle: '2023',
      type: 'exhibition'
    },
  },
];

const initialEdges: Edge[] = [
  {
    id: 'e1-2',
    source: '1',
    target: '2',
    label: '创立',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280' },
  },
  {
    id: 'e1-3',
    source: '1',
    target: '3',
    label: '创作',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280' },
  },
  {
    id: 'e3-4',
    source: '3',
    target: '4',
    label: '收藏于',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280' },
  },
  {
    id: 'e1-5',
    source: '1',
    target: '5',
    label: '主题',
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { stroke: '#6b7280' },
  },
];

interface KnowledgeGraphProps {
  className?: string;
}

export default function KnowledgeGraph({ className = '' }: KnowledgeGraphProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className={`w-full h-full ${className}`} style={{ minHeight: '600px' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap 
          nodeColor={(node) => {
            switch (node.data?.type) {
              case 'artist': return '#ef4444';
              case 'exhibition': return '#8b5cf6';
              case 'institution': return '#06b6d4';
              case 'artwork': return '#f59e0b';
              case 'movement': return '#10b981';
              default: return '#6b7280';
            }
          }}
        />
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        
        {/* 控制面板 */}
        <Panel position="top-left">
          <div className="bg-white p-4 rounded-lg shadow-lg border">
            <h3 className="font-bold text-sm mb-2">图例</h3>
            <div className="space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-red-500 bg-white"></div>
                <span>艺术家</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-purple-500 bg-white"></div>
                <span>展览</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-cyan-500 bg-white"></div>
                <span>机构</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-amber-500 bg-white"></div>
                <span>作品</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded border-2 border-emerald-500 bg-white"></div>
                <span>艺术运动</span>
              </div>
            </div>
          </div>
        </Panel>

        {/* 节点详情面板 */}
        {selectedNode && (
          <Panel position="top-right">
            <div className="bg-white p-4 rounded-lg shadow-lg border max-w-xs">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-bold text-sm">{selectedNode.data.label}</h3>
                <button 
                  onClick={() => setSelectedNode(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
              <p className="text-xs text-gray-600 mb-2">
                类型: {selectedNode.data.type}
              </p>
              {selectedNode.data.subtitle && (
                <p className="text-xs text-gray-600">
                  {selectedNode.data.subtitle}
                </p>
              )}
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
