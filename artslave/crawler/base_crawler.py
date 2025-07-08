import requests
import time
import random
from bs4 import BeautifulSoup
from fake_useragent import UserAgent
from datetime import datetime, timedelta
import re
from config import CRAWL_DELAY, MAX_RETRIES, TIMEOUT, SUBMISSION_TYPES
from database import DatabaseManager

class BaseCrawler:
    def __init__(self, name, base_url):
        self.name = name
        self.base_url = base_url
        self.session = requests.Session()
        self.ua = UserAgent()
        self.db = DatabaseManager()
        self.items_found = 0
        self.items_added = 0
        
        # 设置请求头
        self.session.headers.update({
            'User-Agent': self.ua.random,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'Connection': 'keep-alive',
        })
    
    def make_request(self, url, retries=0):
        """发送HTTP请求"""
        try:
            # 随机延迟
            time.sleep(CRAWL_DELAY + random.uniform(0, 1))
            
            response = self.session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            return response
            
        except Exception as e:
            if retries < MAX_RETRIES:
                print(f"请求失败，重试 {retries + 1}/{MAX_RETRIES}: {e}")
                time.sleep(2 ** retries)  # 指数退避
                return self.make_request(url, retries + 1)
            else:
                print(f"请求最终失败: {e}")
                return None
    
    def parse_date(self, date_str):
        """解析日期字符串"""
        if not date_str:
            return None
            
        # 常见日期格式
        date_formats = [
            '%Y-%m-%d',
            '%Y/%m/%d', 
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%B %d, %Y',
            '%b %d, %Y',
            '%Y年%m月%d日'
        ]
        
        for fmt in date_formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue
        
        # 如果无法解析，返回一个月后的日期作为默认值
        return datetime.now() + timedelta(days=30)
    
    def clean_text(self, text):
        """清理文本"""
        if not text:
            return ""
        
        # 移除多余空白字符
        text = re.sub(r'\s+', ' ', text.strip())
        # 移除特殊字符
        text = re.sub(r'[^\w\s\-.,!?()[\]{}:;"\']', '', text)
        return text
    
    def extract_email(self, text):
        """从文本中提取邮箱"""
        if not text:
            return None
        
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        matches = re.findall(email_pattern, text)
        return matches[0] if matches else None
    
    def extract_phone(self, text):
        """从文本中提取电话号码"""
        if not text:
            return None
        
        phone_patterns = [
            r'\+?1?[-.\s]?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})',
            r'\+?86[-.\s]?([0-9]{3,4})[-.\s]?([0-9]{7,8})',
            r'(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})'
        ]
        
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            if matches:
                return ''.join(matches[0]) if isinstance(matches[0], tuple) else matches[0]
        
        return None
    
    def categorize_submission_type(self, title, description=""):
        """根据标题和描述判断投稿类型"""
        text = (title + " " + description).lower()
        
        # 关键词映射
        keywords = {
            'EXHIBITION': ['exhibition', 'gallery', 'museum', 'show', 'display', '展览', '画廊', '美术馆'],
            'RESIDENCY': ['residency', 'residence', 'artist-in-residence', '驻地', '驻留'],
            'COMPETITION': ['competition', 'contest', 'award', 'prize', '比赛', '竞赛', '奖项'],
            'GRANT': ['grant', 'funding', 'scholarship', 'fellowship', '资助', '基金', '奖学金'],
            'CONFERENCE': ['conference', 'symposium', 'workshop', 'seminar', '会议', '研讨会', '论坛']
        }
        
        for submission_type, words in keywords.items():
            if any(word in text for word in words):
                return submission_type
        
        return 'OTHER'
    
    def save_submission_info(self, data):
        """保存投稿信息到数据库"""
        try:
            # 数据验证和清理
            cleaned_data = {
                'title': self.clean_text(data.get('title', '')),
                'description': self.clean_text(data.get('description', '')),
                'type': data.get('type', 'OTHER'),
                'organizer': self.clean_text(data.get('organizer', '')),
                'deadline': self.parse_date(data.get('deadline')),
                'location': self.clean_text(data.get('location', '')),
                'website': data.get('website', ''),
                'email': self.extract_email(data.get('contact', '')),
                'phone': self.extract_phone(data.get('contact', '')),
                'fee': data.get('fee'),
                'prize': self.clean_text(data.get('prize', '')),
                'requirements': data.get('requirements', {}),
                'tags': data.get('tags', [])
            }
            
            # 如果没有指定类型，自动判断
            if cleaned_data['type'] == 'OTHER':
                cleaned_data['type'] = self.categorize_submission_type(
                    cleaned_data['title'], 
                    cleaned_data['description']
                )
            
            result = self.db.insert_submission_info(cleaned_data)
            if result:
                self.items_added += 1
                print(f"保存成功: {cleaned_data['title']}")
            
        except Exception as e:
            print(f"保存失败: {e}")
    
    def crawl(self):
        """主要爬取方法，需要在子类中实现"""
        raise NotImplementedError("子类必须实现 crawl 方法")
    
    def run(self):
        """运行爬虫"""
        print(f"开始爬取: {self.name}")
        start_time = datetime.now()
        
        try:
            self.crawl()
            print(f"爬取完成: 发现 {self.items_found} 条，新增 {self.items_added} 条")
            
        except Exception as e:
            print(f"爬取失败: {e}")
        
        finally:
            end_time = datetime.now()
            duration = (end_time - start_time).total_seconds()
            print(f"耗时: {duration:.2f} 秒")
            self.db.close()
