/**
 * ArtSlave React 组件单元测试
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';

// Mock fetch
global.fetch = jest.fn();

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// 测试工具函数
const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {component}
    </ThemeProvider>
  );
};

// Mock 数据
const mockSubmissions = [
  {
    id: '1',
    title: 'Test Exhibition',
    type: 'EXHIBITION',
    organizer: 'Test Organizer',
    location: 'Test Location',
    country: 'Test Country',
    deadline: '2025-12-31',
    description: 'Test description',
    tags: ['art', 'exhibition'],
    isGold: false,
    isFeatured: true,
    isActive: true
  }
];

const mockDataSources = [
  {
    id: '1',
    name: 'Test Data Source',
    url: 'https://example.com',
    type: 'website',
    category: '艺术展览',
    isActive: true,
    crawlFreq: 24,
    itemsFound: 10,
    status: 'completed'
  }
];

describe('HomePage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders homepage with main navigation cards', async () => {
    // Mock API responses
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubmissions })
    });

    const HomePage = require('@/app/page').default;
    renderWithTheme(<HomePage />);

    // 检查主要导航卡片
    expect(screen.getByText('投稿信息展示')).toBeInTheDocument();
    expect(screen.getByText('数据收集管理')).toBeInTheDocument();
    expect(screen.getByText('数据库管理')).toBeInTheDocument();
    expect(screen.getByText('AI 智能匹配')).toBeInTheDocument();
  });

  test('displays statistics correctly', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ 
        success: true, 
        data: mockSubmissions,
        stats: {
          totalSubmissions: 1,
          activeSubmissions: 1,
          recentSubmissions: 1
        }
      })
    });

    const HomePage = require('@/app/page').default;
    renderWithTheme(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 统计数字
    });
  });
});

describe('SubmissionsPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders submissions list', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubmissions })
    });

    const SubmissionsPage = require('@/app/submissions/page').default;
    renderWithTheme(<SubmissionsPage />);

    await waitFor(() => {
      expect(screen.getByText('Test Exhibition')).toBeInTheDocument();
      expect(screen.getByText('Test Organizer')).toBeInTheDocument();
    });
  });

  test('filters submissions by search term', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubmissions })
    });

    const SubmissionsPage = require('@/app/submissions/page').default;
    renderWithTheme(<SubmissionsPage />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/搜索/);
      fireEvent.change(searchInput, { target: { value: 'Test' } });
      expect(screen.getByText('Test Exhibition')).toBeInTheDocument();
    });
  });

  test('filters submissions by type', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubmissions })
    });

    const SubmissionsPage = require('@/app/submissions/page').default;
    renderWithTheme(<SubmissionsPage />);

    await waitFor(() => {
      const typeFilter = screen.getByDisplayValue('所有类型');
      fireEvent.change(typeFilter, { target: { value: 'EXHIBITION' } });
      expect(screen.getByText('Test Exhibition')).toBeInTheDocument();
    });
  });
});

describe('DataCollectionPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders data sources management', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDataSources })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: false, uptime: 0, uptimeFormatted: '0秒' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: false, uptime: 0, uptimeFormatted: '0秒', isInstalled: false }
        })
      });

    const DataCollectionPage = require('@/app/data-collection/page').default;
    renderWithTheme(<DataCollectionPage />);

    await waitFor(() => {
      expect(screen.getByText('数据收集管理')).toBeInTheDocument();
      expect(screen.getByText('数据源管理')).toBeInTheDocument();
    });
  });

  test('displays scheduler status', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDataSources })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: true, uptime: 3600000, uptimeFormatted: '1小时' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: false, uptime: 0, uptimeFormatted: '0秒', isInstalled: true }
        })
      });

    const DataCollectionPage = require('@/app/data-collection/page').default;
    renderWithTheme(<DataCollectionPage />);

    await waitFor(() => {
      expect(screen.getByText('自动监控调度器')).toBeInTheDocument();
      expect(screen.getByText('运行中')).toBeInTheDocument();
    });
  });

  test('handles scheduler start/stop', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockDataSources })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: [] })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: false, uptime: 0, uptimeFormatted: '0秒' }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          status: { running: false, uptime: 0, uptimeFormatted: '0秒', isInstalled: true }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, message: '调度器启动成功' })
      });

    const DataCollectionPage = require('@/app/data-collection/page').default;
    renderWithTheme(<DataCollectionPage />);

    await waitFor(() => {
      const startButton = screen.getByText('启动');
      fireEvent.click(startButton);
    });

    expect(fetch).toHaveBeenCalledWith('/api/scheduler', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ action: 'start' })
    }));
  });
});

describe('DataManagementPage', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  test('renders database management interface', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockSubmissions })
    });

    const DataManagementPage = require('@/app/data-management/page').default;
    renderWithTheme(<DataManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('数据库管理')).toBeInTheDocument();
      expect(screen.getByText('添加投稿')).toBeInTheDocument();
    });
  });

  test('handles submission creation', async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, data: mockSubmissions })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ success: true, data: mockSubmissions[0] })
      });

    const DataManagementPage = require('@/app/data-management/page').default;
    renderWithTheme(<DataManagementPage />);

    await waitFor(() => {
      const addButton = screen.getByText('添加投稿');
      fireEvent.click(addButton);
    });

    // 这里应该打开表单模态框
    // 具体的表单测试需要根据实际实现调整
  });
});

describe('ThemeSelector', () => {
  test('renders theme options', () => {
    const ThemeSelector = require('@/components/ThemeSelector').default;
    renderWithTheme(<ThemeSelector />);

    // 检查主题选择器是否渲染
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('changes theme when option is selected', async () => {
    const ThemeSelector = require('@/components/ThemeSelector').default;
    renderWithTheme(<ThemeSelector />);

    const themeButton = screen.getByRole('button');
    fireEvent.click(themeButton);

    // 这里需要根据实际的主题选择器实现来测试
    // 例如检查下拉菜单是否出现，主题是否切换等
  });
});

describe('SubmissionForm', () => {
  test('renders form fields', () => {
    const SubmissionForm = require('@/components/SubmissionForm').default;
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    renderWithTheme(
      <SubmissionForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    expect(screen.getByLabelText(/标题/)).toBeInTheDocument();
    expect(screen.getByLabelText(/类型/)).toBeInTheDocument();
    expect(screen.getByLabelText(/主办方/)).toBeInTheDocument();
  });

  test('validates required fields', async () => {
    const SubmissionForm = require('@/components/SubmissionForm').default;
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    renderWithTheme(
      <SubmissionForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    // 检查是否显示验证错误
    await waitFor(() => {
      expect(screen.getByText(/请填写标题/)).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const SubmissionForm = require('@/components/SubmissionForm').default;
    const mockOnSubmit = jest.fn();
    const mockOnCancel = jest.fn();

    renderWithTheme(
      <SubmissionForm 
        onSubmit={mockOnSubmit} 
        onCancel={mockOnCancel} 
      />
    );

    // 填写表单
    fireEvent.change(screen.getByLabelText(/标题/), { 
      target: { value: 'Test Title' } 
    });
    fireEvent.change(screen.getByLabelText(/主办方/), { 
      target: { value: 'Test Organizer' } 
    });

    const submitButton = screen.getByText('保存');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Title',
        organizer: 'Test Organizer'
      }));
    });
  });
});

// 测试工具函数
describe('Utility Functions', () => {
  test('formatDeadline function', () => {
    const { formatDeadline } = require('@/lib/utils');
    
    const testDate = '2025-12-31';
    const result = formatDeadline(testDate);
    
    expect(result).toContain('2025');
    expect(result).toContain('12');
    expect(result).toContain('31');
  });

  test('getTypeColor function', () => {
    const { getTypeColor } = require('@/lib/utils');
    
    expect(getTypeColor('EXHIBITION')).toContain('blue');
    expect(getTypeColor('RESIDENCY')).toContain('green');
    expect(getTypeColor('COMPETITION')).toContain('purple');
  });
});

// 错误边界测试
describe('Error Handling', () => {
  test('handles API errors gracefully', async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const SubmissionsPage = require('@/app/submissions/page').default;
    renderWithTheme(<SubmissionsPage />);

    // 应该显示错误状态或回退到默认数据
    await waitFor(() => {
      expect(screen.getByText(/暂无投稿信息/)).toBeInTheDocument();
    });
  });

  test('handles malformed API responses', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ invalid: 'response' })
    });

    const SubmissionsPage = require('@/app/submissions/page').default;
    renderWithTheme(<SubmissionsPage />);

    // 应该优雅地处理无效响应
    await waitFor(() => {
      expect(screen.getByText(/暂无投稿信息/)).toBeInTheDocument();
    });
  });
});
