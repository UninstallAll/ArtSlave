# 🕸️ DeepSearch - 深度扩散搜索与知识图谱构建系统

## 📋 功能概述

DeepSearch 是 ArtSlave 的核心算法模块，实现基于核心对象的深度扩散搜索和知识图谱构建。通过智能爬虫、LLM 辅助分析和图算法，构建艺术领域知识网络。

### 🎯 核心能力

1. **深度扩散搜索**：从核心对象开始，多层次扩散搜索
2. **智能关联发现**：利用 LLM 识别实体间关联关系
3. **知识图谱构建**：构建可视化知识网络
4. **焦点保持算法**：确保搜索相关性

### 🌟 应用场景

- **艺术家网络分析**：扩散到相关艺术家、展览、机构
- **展览关联发现**：发现参展艺术家、策展人、相关展览
- **机构生态映射**：扩散到合作机构、项目、艺术家
- **主题研究网络**：围绕特定艺术主题构建内容网络

## 🏗️ 系统架构

```
DeepSearch System
├── SearchEngine      # 搜索引擎核心
├── DataCollector     # 数据收集器
├── LLMAnalyzer      # LLM 分析器
├── GraphBuilder     # 图构建器
└── RelevanceScorer  # 相关性评分器
```

## 🚀 快速开始

### 基础使用

```typescript
import { DeepSearchEngine } from './SearchEngine'
import { DEFAULT_SEARCH_CONFIG } from './config'

const searchEngine = new DeepSearchEngine(DEFAULT_SEARCH_CONFIG)
const result = await searchEngine.startSearch(coreNode)
```

### 搜索预设

- **quick**: 快速搜索，2层深度，15个节点/层
- **deep**: 深度搜索，4层深度，8个节点/层
- **broad**: 广泛搜索，3层深度，20个节点/层
- **precise**: 精确搜索，高相关性要求

### 支持的实体类型

- **artist**: 艺术家 | **exhibition**: 展览 | **institution**: 机构
- **artwork**: 艺术作品 | **curator**: 策展人 | **movement**: 艺术运动

### 支持的关系类型

- **collaborated_with**: 合作关系 | **exhibited_at**: 展出关系
- **influenced_by**: 影响关系 | **curated_by**: 策展关系
