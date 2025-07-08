#!/usr/bin/env python3
"""
初始化数据库表和示例数据源
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import DatabaseManager
from datetime import datetime

def create_sample_data_sources():
    """创建示例数据源"""
    print("创建示例数据源...")
    
    db = DatabaseManager()
    
    sample_sources = [
        {
            'name': 'FilmFreeway 艺术节',
            'url': 'https://filmfreeway.com/festivals',
            'type': 'website',
            'config': {
                'selectors': {
                    'title': '.festival-title',
                    'deadline': '.deadline-date',
                    'description': '.festival-description'
                },
                'pagination': True,
                'max_pages': 10
            }
        },
        {
            'name': '中国美术馆展览',
            'url': 'http://www.namoc.org',
            'type': 'website',
            'config': {
                'selectors': {
                    'title': '.exhibition-title',
                    'date': '.exhibition-date',
                    'description': '.exhibition-content'
                },
                'encoding': 'utf-8'
            }
        },
        {
            'name': 'Artsy 展览信息',
            'url': 'https://www.artsy.net/api/exhibitions',
            'type': 'api',
            'config': {
                'api_key': 'your_api_key_here',
                'rate_limit': 100,
                'format': 'json'
            }
        }
    ]
    
    for source in sample_sources:
        try:
            query = """
            INSERT INTO data_sources (name, url, type, config, is_active, created_at, updated_at)
            VALUES (%(name)s, %(url)s, %(type)s, %(config)s, %(is_active)s, %(created_at)s, %(updated_at)s)
            ON CONFLICT (name) DO UPDATE SET
                url = EXCLUDED.url,
                type = EXCLUDED.type,
                config = EXCLUDED.config,
                updated_at = EXCLUDED.updated_at;
            """
            
            import json
            params = {
                'name': source['name'],
                'url': source['url'],
                'type': source['type'],
                'config': json.dumps(source['config']),
                'is_active': True,
                'created_at': datetime.now(),
                'updated_at': datetime.now()
            }
            
            db.execute_query(query, params)
            print(f"✓ 创建数据源: {source['name']}")
            
        except Exception as e:
            print(f"✗ 创建数据源失败 {source['name']}: {e}")
    
    db.close()

def check_database_tables():
    """检查数据库表是否存在"""
    print("检查数据库表...")
    
    db = DatabaseManager()
    
    required_tables = [
        'submission_infos',
        'data_sources', 
        'crawl_jobs',
        'users',
        'user_submissions'
    ]
    
    for table in required_tables:
        try:
            query = f"SELECT COUNT(*) FROM {table} LIMIT 1;"
            result = db.execute_query(query)
            if result is not None:
                print(f"✓ 表 {table} 存在")
            else:
                print(f"✗ 表 {table} 不存在或无法访问")
        except Exception as e:
            print(f"✗ 检查表 {table} 失败: {e}")
    
    db.close()

def create_sample_submission_info():
    """创建示例投稿信息"""
    print("创建示例投稿信息...")
    
    db = DatabaseManager()
    
    sample_submissions = [
        {
            'title': '2025年春季当代艺术群展',
            'description': '展示当代艺术家在疫情后时代的思考与创作，欢迎各种媒介的作品参与。',
            'type': 'EXHIBITION',
            'organizer': '北京当代艺术中心',
            'deadline': '2025-03-15',
            'location': '北京市朝阳区',
            'website': 'https://example.com/spring2025',
            'email': 'spring2025@artcenter.org',
            'phone': '+86-10-12345678',
            'fee': None,
            'prize': '参展证书',
            'requirements': {
                'age_limit': '18-45岁',
                'work_size': '不超过2x2米',
                'submission_format': '数字图片'
            },
            'tags': ['当代艺术', '群展', '春季']
        },
        {
            'title': '青年艺术家国际驻地项目',
            'description': '为期6个月的国际艺术家驻地项目，提供工作室、材料费和生活补贴。',
            'type': 'RESIDENCY',
            'organizer': '国际艺术交流基金会',
            'deadline': '2025-02-28',
            'location': '意大利佛罗伦萨',
            'website': 'https://example.com/residency2025',
            'email': 'residency@artexchange.org',
            'phone': '+39-055-123456',
            'fee': None,
            'prize': '月补贴2000欧元',
            'requirements': {
                'age_limit': '25-35岁',
                'language': '英语或意大利语',
                'portfolio': '至少10件作品'
            },
            'tags': ['驻地项目', '国际交流', '青年艺术家']
        }
    ]
    
    for submission in sample_submissions:
        try:
            import json
            data = submission.copy()
            data['requirements'] = json.dumps(data['requirements'])
            data['is_active'] = True
            data['created_at'] = datetime.now()
            data['updated_at'] = datetime.now()
            
            result = db.insert_submission_info(data)
            if result:
                print(f"✓ 创建投稿信息: {submission['title']}")
            else:
                print(f"✗ 创建投稿信息失败: {submission['title']}")
                
        except Exception as e:
            print(f"✗ 创建投稿信息异常 {submission['title']}: {e}")
    
    db.close()

def main():
    """主初始化函数"""
    print("=" * 50)
    print("ArtSlave 数据库初始化")
    print("=" * 50)
    
    try:
        # 检查数据库表
        check_database_tables()
        
        print("\n" + "-" * 30)
        
        # 创建示例数据源
        create_sample_data_sources()
        
        print("\n" + "-" * 30)
        
        # 创建示例投稿信息
        create_sample_submission_info()
        
        print("\n" + "=" * 50)
        print("✓ 数据库初始化完成")
        
    except Exception as e:
        print(f"✗ 数据库初始化失败: {e}")
        return 1
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
