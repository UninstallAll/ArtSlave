#!/usr/bin/env python3
"""
测试爬虫系统的基本功能
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from demo_crawler import DemoCrawler
from database import DatabaseManager

def test_database_connection():
    """测试数据库连接"""
    print("测试数据库连接...")
    try:
        db = DatabaseManager()
        if db.connection:
            print("✓ 数据库连接成功")
            db.close()
            return True
        else:
            print("✗ 数据库连接失败")
            return False
    except Exception as e:
        print(f"✗ 数据库连接错误: {e}")
        return False

def test_demo_crawler():
    """测试演示爬虫"""
    print("\n测试演示爬虫...")
    try:
        crawler = DemoCrawler()
        print("✓ 爬虫实例化成功")
        
        # 运行爬虫
        crawler.run()
        
        if crawler.items_found > 0:
            print(f"✓ 爬虫运行成功，发现 {crawler.items_found} 条数据，新增 {crawler.items_added} 条")
            return True
        else:
            print("✗ 爬虫未发现任何数据")
            return False
            
    except Exception as e:
        print(f"✗ 爬虫运行错误: {e}")
        return False

def test_data_retrieval():
    """测试数据检索"""
    print("\n测试数据检索...")
    try:
        db = DatabaseManager()
        
        # 查询最近的投稿信息
        query = """
        SELECT title, type, organizer, created_at 
        FROM submission_infos 
        ORDER BY created_at DESC 
        LIMIT 5;
        """
        
        results = db.execute_query(query)
        
        if results:
            print(f"✓ 成功检索到 {len(results)} 条投稿信息:")
            for row in results:
                print(f"  - {row['title']} ({row['type']}) - {row['organizer']}")
            db.close()
            return True
        else:
            print("✗ 未检索到任何投稿信息")
            db.close()
            return False
            
    except Exception as e:
        print(f"✗ 数据检索错误: {e}")
        return False

def test_crawl_jobs():
    """测试爬虫任务记录"""
    print("\n测试爬虫任务记录...")
    try:
        db = DatabaseManager()
        
        # 查询最近的爬虫任务
        query = """
        SELECT status, items_found, items_added, created_at 
        FROM crawl_jobs 
        ORDER BY created_at DESC 
        LIMIT 3;
        """
        
        results = db.execute_query(query)
        
        if results:
            print(f"✓ 成功检索到 {len(results)} 条任务记录:")
            for row in results:
                print(f"  - 状态: {row['status']}, 发现: {row['items_found']}, 新增: {row['items_added']}")
            db.close()
            return True
        else:
            print("✗ 未检索到任何任务记录")
            db.close()
            return False
            
    except Exception as e:
        print(f"✗ 任务记录检索错误: {e}")
        return False

def main():
    """主测试函数"""
    print("=" * 50)
    print("ArtSlave 爬虫系统测试")
    print("=" * 50)
    
    tests = [
        ("数据库连接", test_database_connection),
        ("演示爬虫", test_demo_crawler),
        ("数据检索", test_data_retrieval),
        ("任务记录", test_crawl_jobs),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
        except Exception as e:
            print(f"✗ {test_name} 测试异常: {e}")
    
    print("\n" + "=" * 50)
    print(f"测试结果: {passed}/{total} 通过")
    
    if passed == total:
        print("🎉 所有测试通过！爬虫系统运行正常。")
        return 0
    else:
        print("⚠️  部分测试失败，请检查系统配置。")
        return 1

if __name__ == "__main__":
    sys.exit(main())
