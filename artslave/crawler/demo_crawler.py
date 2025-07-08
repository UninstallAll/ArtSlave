from base_crawler import BaseCrawler
from datetime import datetime, timedelta
import random

class DemoCrawler(BaseCrawler):
    """演示爬虫 - 生成模拟数据"""
    
    def __init__(self):
        super().__init__("演示数据源", "https://demo.example.com")
        
        # 模拟数据模板
        self.demo_data = [
            {
                'title': '2025年国际当代艺术展',
                'description': '展示全球当代艺术家的最新作品，涵盖绘画、雕塑、装置艺术等多种媒介。',
                'type': 'EXHIBITION',
                'organizer': '国际当代艺术基金会',
                'location': '北京市朝阳区798艺术区',
                'website': 'https://example.com/exhibition2025',
                'contact': 'info@artfoundation.org, +86-10-12345678',
                'fee': None,
                'prize': '最佳作品奖10万元',
                'tags': ['当代艺术', '国际展览', '多媒介']
            },
            {
                'title': '青年艺术家驻地项目',
                'description': '为期3个月的艺术家驻地项目，提供工作室、材料费和生活补贴。',
                'type': 'RESIDENCY',
                'organizer': '上海当代艺术博物馆',
                'location': '上海市黄浦区花园港路200号',
                'website': 'https://example.com/residency',
                'contact': 'residency@psam.org.cn, 021-23456789',
                'fee': None,
                'prize': '月补贴5000元',
                'tags': ['驻地项目', '青年艺术家', '当代艺术']
            },
            {
                'title': '全国大学生艺术设计大赛',
                'description': '面向全国高校学生的艺术设计竞赛，包括平面设计、产品设计、环境设计等类别。',
                'type': 'COMPETITION',
                'organizer': '中国美术家协会',
                'location': '全国',
                'website': 'https://example.com/competition',
                'contact': 'competition@caa.org.cn',
                'fee': 100.00,
                'prize': '一等奖5万元，二等奖3万元，三等奖1万元',
                'tags': ['学生竞赛', '艺术设计', '全国性']
            },
            {
                'title': '艺术创新基金资助项目',
                'description': '支持具有创新性的艺术项目，资助金额10-50万元不等。',
                'type': 'GRANT',
                'organizer': '文化部艺术发展中心',
                'location': '北京市',
                'website': 'https://example.com/grant',
                'contact': 'grant@artcenter.gov.cn, 010-87654321',
                'fee': None,
                'prize': '资助金额10-50万元',
                'tags': ['政府资助', '艺术创新', '项目资助']
            },
            {
                'title': '数字艺术与科技国际研讨会',
                'description': '探讨数字艺术与科技融合的最新趋势，邀请国内外专家学者参与。',
                'type': 'CONFERENCE',
                'organizer': '中央美术学院',
                'location': '北京市朝阳区花家地南街8号',
                'website': 'https://example.com/conference',
                'contact': 'conference@cafa.edu.cn',
                'fee': 500.00,
                'prize': None,
                'tags': ['学术会议', '数字艺术', '国际交流']
            },
            {
                'title': '丝绸之路艺术节',
                'description': '展示丝绸之路沿线国家和地区的传统与现代艺术作品。',
                'type': 'EXHIBITION',
                'organizer': '西安美术学院',
                'location': '西安市雁塔区含光南路100号',
                'website': 'https://example.com/silkroad',
                'contact': 'silkroad@xafa.edu.cn, 029-88888888',
                'fee': None,
                'prize': '参展证书',
                'tags': ['文化交流', '传统艺术', '丝绸之路']
            },
            {
                'title': '环保主题艺术创作资助',
                'description': '支持以环保为主题的艺术创作项目，推广环保理念。',
                'type': 'GRANT',
                'organizer': '绿色地球基金会',
                'location': '全国',
                'website': 'https://example.com/eco-art',
                'contact': 'eco@greenearth.org',
                'fee': None,
                'prize': '资助金额5-20万元',
                'tags': ['环保主题', '社会责任', '艺术创作']
            },
            {
                'title': '新媒体艺术双年展',
                'description': '聚焦新媒体艺术的发展趋势，展示VR、AR、AI等技术在艺术中的应用。',
                'type': 'EXHIBITION',
                'organizer': '深圳市当代艺术与城市规划馆',
                'location': '深圳市福田区福中路184号',
                'website': 'https://example.com/newmedia',
                'contact': 'newmedia@mocaup.org, 0755-12345678',
                'fee': None,
                'prize': '最佳新媒体艺术奖',
                'tags': ['新媒体', '双年展', '科技艺术']
            }
        ]
    
    def generate_deadline(self):
        """生成随机截止日期"""
        # 生成未来1-6个月的随机日期
        days_ahead = random.randint(30, 180)
        return (datetime.now() + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    
    def crawl(self):
        """模拟爬取过程"""
        print("开始模拟数据收集...")
        
        # 随机选择一些数据进行"爬取"
        selected_items = random.sample(self.demo_data, random.randint(3, len(self.demo_data)))
        
        for item in selected_items:
            self.items_found += 1
            
            # 为每个项目生成随机截止日期
            item_copy = item.copy()
            item_copy['deadline'] = self.generate_deadline()
            
            # 模拟网络延迟
            import time
            time.sleep(0.5)
            
            print(f"发现投稿信息: {item_copy['title']}")
            
            # 保存到数据库
            self.save_submission_info(item_copy)
        
        print(f"模拟爬取完成，共处理 {self.items_found} 条数据")

if __name__ == "__main__":
    crawler = DemoCrawler()
    crawler.run()
