#!/usr/bin/env python3
"""
ArtSlave 爬虫调度器
负责定时监控网站并执行爬虫任务
"""

import time
import threading
import schedule
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from database import DatabaseManager
from crawler_manager import CrawlerManager
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('crawler_scheduler.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class CrawlerScheduler:
    """爬虫调度器 - 负责定时执行爬虫任务"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.crawler_manager = CrawlerManager()
        self.running = False
        self.scheduler_thread = None
        self.data_sources = []
        
    def load_data_sources(self):
        """从数据库加载数据源配置"""
        try:
            # 这里应该从实际的数据源表加载，目前使用模拟数据
            self.data_sources = [
                {
                    'id': '1',
                    'name': 'FilmFreeway 艺术节',
                    'url': 'https://filmfreeway.com/festivals',
                    'type': 'website',
                    'crawler_name': 'demo',  # 对应的爬虫名称
                    'crawl_frequency': 24,  # 小时
                    'is_active': True,
                    'last_crawled': None
                },
                {
                    'id': '2',
                    'name': '中国美术馆展览',
                    'url': 'http://www.namoc.org',
                    'type': 'website',
                    'crawler_name': 'demo',
                    'crawl_frequency': 12,  # 小时
                    'is_active': True,
                    'last_crawled': None
                },
                {
                    'id': '3',
                    'name': 'Artsy 展览信息',
                    'url': 'https://www.artsy.net',
                    'type': 'api',
                    'crawler_name': 'demo',
                    'crawl_frequency': 6,  # 小时
                    'is_active': False,
                    'last_crawled': None
                }
            ]
            logger.info(f"加载了 {len(self.data_sources)} 个数据源")
        except Exception as e:
            logger.error(f"加载数据源失败: {e}")
            self.data_sources = []
    
    def should_crawl_source(self, source: Dict) -> bool:
        """判断数据源是否需要爬取"""
        if not source['is_active']:
            return False
            
        if source['last_crawled'] is None:
            return True
            
        try:
            last_crawled = datetime.fromisoformat(source['last_crawled'])
            next_crawl_time = last_crawled + timedelta(hours=source['crawl_frequency'])
            return datetime.now() >= next_crawl_time
        except Exception as e:
            logger.error(f"解析最后爬取时间失败: {e}")
            return True
    
    def crawl_source(self, source: Dict):
        """爬取指定数据源"""
        try:
            logger.info(f"开始爬取数据源: {source['name']}")
            
            # 创建爬虫任务记录
            job_id = self.db.create_crawl_job(source['name'])
            
            # 更新任务状态为运行中
            self.db.update_crawl_job(job_id, 'running')
            
            # 运行对应的爬虫
            success = self.crawler_manager.run_crawler(source['crawler_name'])
            
            if success:
                # 更新数据源最后爬取时间
                source['last_crawled'] = datetime.now().isoformat()
                self.update_source_last_crawled(source['id'])
                
                logger.info(f"数据源 {source['name']} 爬取成功")
            else:
                logger.error(f"数据源 {source['name']} 爬取失败")
                
        except Exception as e:
            logger.error(f"爬取数据源 {source['name']} 时发生错误: {e}")
            if 'job_id' in locals():
                self.db.update_crawl_job(job_id, 'failed', error_message=str(e))
    
    def update_source_last_crawled(self, source_id: str):
        """更新数据源最后爬取时间"""
        try:
            # 这里应该更新实际的数据库表
            # 目前只更新内存中的数据
            for source in self.data_sources:
                if source['id'] == source_id:
                    source['last_crawled'] = datetime.now().isoformat()
                    break
        except Exception as e:
            logger.error(f"更新数据源最后爬取时间失败: {e}")
    
    def check_and_crawl_sources(self):
        """检查并爬取需要更新的数据源"""
        logger.info("检查需要爬取的数据源...")
        
        crawled_count = 0
        for source in self.data_sources:
            if self.should_crawl_source(source):
                self.crawl_source(source)
                crawled_count += 1
                
                # 避免同时启动太多爬虫，添加延迟
                time.sleep(2)
        
        if crawled_count > 0:
            logger.info(f"本次检查爬取了 {crawled_count} 个数据源")
        else:
            logger.info("本次检查无需爬取任何数据源")
    
    def setup_schedules(self):
        """设置定时任务"""
        # 每10分钟检查一次是否有需要爬取的数据源
        schedule.every(10).minutes.do(self.check_and_crawl_sources)
        
        # 每小时重新加载数据源配置
        schedule.every().hour.do(self.load_data_sources)
        
        # 每天凌晨2点清理旧的爬虫任务记录
        schedule.every().day.at("02:00").do(self.cleanup_old_jobs)
        
        logger.info("定时任务设置完成")
    
    def cleanup_old_jobs(self):
        """清理旧的爬虫任务记录"""
        try:
            self.crawler_manager.cleanup_old_jobs(days=7)
            logger.info("清理旧任务记录完成")
        except Exception as e:
            logger.error(f"清理旧任务记录失败: {e}")
    
    def run_scheduler(self):
        """运行调度器主循环"""
        logger.info("爬虫调度器启动")
        
        while self.running:
            try:
                schedule.run_pending()
                time.sleep(30)  # 每30秒检查一次待执行的任务
            except Exception as e:
                logger.error(f"调度器运行错误: {e}")
                time.sleep(60)  # 出错时等待1分钟再继续
    
    def start(self):
        """启动调度器"""
        if self.running:
            logger.warning("调度器已在运行中")
            return
            
        self.running = True
        
        # 加载数据源
        self.load_data_sources()
        
        # 设置定时任务
        self.setup_schedules()
        
        # 启动调度器线程
        self.scheduler_thread = threading.Thread(target=self.run_scheduler, daemon=True)
        self.scheduler_thread.start()
        
        logger.info("爬虫调度器已启动")
    
    def stop(self):
        """停止调度器"""
        if not self.running:
            logger.warning("调度器未在运行")
            return
            
        self.running = False
        
        if self.scheduler_thread and self.scheduler_thread.is_alive():
            self.scheduler_thread.join(timeout=5)
        
        logger.info("爬虫调度器已停止")
    
    def get_status(self) -> Dict:
        """获取调度器状态"""
        return {
            'running': self.running,
            'data_sources_count': len(self.data_sources),
            'active_sources_count': len([s for s in self.data_sources if s['is_active']]),
            'next_check_time': self.get_next_check_time(),
            'uptime': self.get_uptime()
        }
    
    def get_next_check_time(self) -> Optional[str]:
        """获取下次检查时间"""
        try:
            next_run = schedule.next_run()
            if next_run:
                return next_run.isoformat()
        except:
            pass
        return None
    
    def get_uptime(self) -> str:
        """获取运行时间"""
        if hasattr(self, 'start_time'):
            uptime = datetime.now() - self.start_time
            return str(uptime)
        return "未知"

def main():
    """主函数 - 用于独立运行调度器"""
    import signal
    import sys
    
    scheduler = CrawlerScheduler()
    
    def signal_handler(signum, frame):
        logger.info("收到停止信号，正在关闭调度器...")
        scheduler.stop()
        sys.exit(0)
    
    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)
    
    try:
        scheduler.start()
        
        # 保持主线程运行
        while True:
            time.sleep(1)
            
    except KeyboardInterrupt:
        logger.info("用户中断，正在关闭调度器...")
        scheduler.stop()
    except Exception as e:
        logger.error(f"调度器运行错误: {e}")
        scheduler.stop()
        sys.exit(1)

if __name__ == "__main__":
    main()
