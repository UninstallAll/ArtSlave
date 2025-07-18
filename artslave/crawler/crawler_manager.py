#!/usr/bin/env python3
"""
ArtSlave 爬虫管理器
负责协调和管理所有数据收集爬虫
"""

import sys
import json
import argparse
import logging
import traceback
from datetime import datetime
from database import DatabaseManager
from demo_crawler import DemoCrawler

# 配置详细日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler_detailed.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CrawlerManager:
    def __init__(self):
        self.db = DatabaseManager()
        self.crawlers = {
            'demo': DemoCrawler,
            # 可以在这里添加更多爬虫类
        }
    
    def list_crawlers(self):
        """列出所有可用的爬虫"""
        print("可用的爬虫:")
        for name, crawler_class in self.crawlers.items():
            print(f"  - {name}: {crawler_class.__doc__ or '无描述'}")
    
    def run_crawler(self, crawler_name):
        """运行指定的爬虫"""
        job_start_time = datetime.now()
        logger.info(f"开始运行爬虫: {crawler_name}")

        if crawler_name not in self.crawlers:
            error_msg = f"爬虫 '{crawler_name}' 不存在"
            logger.error(error_msg)
            print(f"错误: {error_msg}")
            return False

        try:
            # 创建爬虫任务记录
            job_id = self.db.create_crawl_job()
            logger.info(f"创建爬虫任务: {job_id}")
            print(f"创建爬虫任务: {job_id}")

            # 更新任务状态为运行中
            self.db.update_crawl_job(job_id, 'running')
            logger.info(f"任务 {job_id} 状态更新为运行中")

            # 实例化并运行爬虫
            crawler_class = self.crawlers[crawler_name]
            crawler = crawler_class()
            logger.info(f"初始化爬虫 {crawler_name} 成功")

            crawler.run()
            execution_time = (datetime.now() - job_start_time).total_seconds()

            # 更新任务状态为完成
            items_found = getattr(crawler, 'items_found', 0)
            items_added = getattr(crawler, 'items_added', 0)

            self.db.update_crawl_job(
                job_id,
                'completed',
                items_found=items_found,
                items_added=items_added
            )

            logger.info(f"爬虫任务 {job_id} 完成: 发现 {items_found} 条数据，添加 {items_added} 条数据，耗时 {execution_time:.2f} 秒")
            print(f"爬虫任务完成: {job_id}")
            return True

        except Exception as e:
            execution_time = (datetime.now() - job_start_time).total_seconds()
            error_details = traceback.format_exc()
            logger.error(f"爬虫 {crawler_name} 运行失败，耗时 {execution_time:.2f} 秒")
            logger.error(f"错误详情: {e}")
            logger.debug(f"完整错误堆栈:\n{error_details}")

            print(f"爬虫运行失败: {e}")
            if 'job_id' in locals():
                self.db.update_crawl_job(job_id, 'failed', error_message=str(e))
                logger.info(f"任务 {job_id} 状态更新为失败")
            return False
    
    def run_all_crawlers(self):
        """运行所有爬虫"""
        print("开始运行所有爬虫...")
        success_count = 0
        
        for crawler_name in self.crawlers.keys():
            print(f"\n{'='*50}")
            print(f"运行爬虫: {crawler_name}")
            print(f"{'='*50}")
            
            if self.run_crawler(crawler_name):
                success_count += 1
            else:
                print(f"爬虫 {crawler_name} 运行失败")
        
        print(f"\n总结: {success_count}/{len(self.crawlers)} 个爬虫运行成功")
    
    def get_crawl_stats(self):
        """获取爬虫统计信息"""
        query = """
        SELECT 
            status,
            COUNT(*) as count,
            SUM(items_found) as total_found,
            SUM(items_added) as total_added
        FROM crawl_jobs 
        WHERE created_at >= CURRENT_DATE
        GROUP BY status;
        """
        
        results = self.db.execute_query(query)
        if results:
            print("今日爬虫统计:")
            for row in results:
                print(f"  {row['status']}: {row['count']} 次任务, "
                      f"发现 {row['total_found'] or 0} 条, "
                      f"新增 {row['total_added'] or 0} 条")
        else:
            print("今日暂无爬虫任务")
    
    def cleanup_old_jobs(self, days=7):
        """清理旧的爬虫任务记录"""
        query = """
        DELETE FROM crawl_jobs 
        WHERE created_at < CURRENT_DATE - INTERVAL '%s days';
        """
        
        result = self.db.execute_query(query, (days,))
        print(f"清理了 {days} 天前的爬虫任务记录")

def main():
    parser = argparse.ArgumentParser(description='ArtSlave 爬虫管理器')
    parser.add_argument('action', choices=['list', 'run', 'run-all', 'stats', 'cleanup'], 
                       help='要执行的操作')
    parser.add_argument('--crawler', '-c', help='要运行的爬虫名称 (用于 run 操作)')
    parser.add_argument('--days', '-d', type=int, default=7, 
                       help='清理多少天前的记录 (用于 cleanup 操作)')
    
    args = parser.parse_args()
    
    manager = CrawlerManager()
    
    try:
        if args.action == 'list':
            manager.list_crawlers()
            
        elif args.action == 'run':
            if not args.crawler:
                print("错误: 请指定要运行的爬虫名称 (--crawler)")
                sys.exit(1)
            manager.run_crawler(args.crawler)
            
        elif args.action == 'run-all':
            manager.run_all_crawlers()
            
        elif args.action == 'stats':
            manager.get_crawl_stats()
            
        elif args.action == 'cleanup':
            manager.cleanup_old_jobs(args.days)
            
    except KeyboardInterrupt:
        print("\n操作被用户中断")
        sys.exit(1)
    except Exception as e:
        print(f"发生错误: {e}")
        sys.exit(1)
    finally:
        manager.db.close()

if __name__ == "__main__":
    main()
