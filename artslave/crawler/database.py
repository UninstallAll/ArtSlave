import psycopg2
from psycopg2.extras import RealDictCursor
import json
from datetime import datetime
from config import DATABASE_URL

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()
    
    def connect(self):
        """连接数据库"""
        try:
            self.connection = psycopg2.connect(DATABASE_URL)
            print("数据库连接成功")
        except Exception as e:
            print(f"数据库连接失败: {e}")
    
    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()
    
    def execute_query(self, query, params=None):
        """执行查询"""
        try:
            with self.connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute(query, params)
                self.connection.commit()
                return cursor.fetchall()
        except Exception as e:
            print(f"查询执行失败: {e}")
            self.connection.rollback()
            return None
    
    def insert_submission_info(self, data):
        """插入投稿信息"""
        query = """
        INSERT INTO submission_infos (
            title, description, type, organizer, deadline, 
            location, website, email, phone, fee, prize, 
            requirements, tags, is_active, created_at, updated_at
        ) VALUES (
            %(title)s, %(description)s, %(type)s, %(organizer)s, %(deadline)s,
            %(location)s, %(website)s, %(email)s, %(phone)s, %(fee)s, %(prize)s,
            %(requirements)s, %(tags)s, %(is_active)s, %(created_at)s, %(updated_at)s
        ) ON CONFLICT (title, organizer) DO UPDATE SET
            description = EXCLUDED.description,
            deadline = EXCLUDED.deadline,
            updated_at = EXCLUDED.updated_at
        RETURNING id;
        """
        
        now = datetime.now()
        params = {
            'title': data.get('title'),
            'description': data.get('description'),
            'type': data.get('type', 'OTHER'),
            'organizer': data.get('organizer'),
            'deadline': data.get('deadline'),
            'location': data.get('location'),
            'website': data.get('website'),
            'email': data.get('email'),
            'phone': data.get('phone'),
            'fee': data.get('fee'),
            'prize': data.get('prize'),
            'requirements': json.dumps(data.get('requirements', {})),
            'tags': data.get('tags', []),
            'is_active': True,
            'created_at': now,
            'updated_at': now
        }
        
        return self.execute_query(query, params)
    
    def create_crawl_job(self, data_source_id=None):
        """创建爬虫任务记录"""
        query = """
        INSERT INTO crawl_jobs (data_source_id, status, created_at)
        VALUES (%(data_source_id)s, 'pending', %(created_at)s)
        RETURNING id;
        """
        
        params = {
            'data_source_id': data_source_id,
            'created_at': datetime.now()
        }
        
        result = self.execute_query(query, params)
        return result[0]['id'] if result else None
    
    def update_crawl_job(self, job_id, status, items_found=0, items_added=0, error_message=None):
        """更新爬虫任务状态"""
        query = """
        UPDATE crawl_jobs SET 
            status = %(status)s,
            items_found = %(items_found)s,
            items_added = %(items_added)s,
            error_message = %(error_message)s,
            completed_at = %(completed_at)s
        WHERE id = %(job_id)s;
        """
        
        params = {
            'job_id': job_id,
            'status': status,
            'items_found': items_found,
            'items_added': items_added,
            'error_message': error_message,
            'completed_at': datetime.now() if status in ['completed', 'failed'] else None
        }
        
        return self.execute_query(query, params)
    
    def get_data_sources(self):
        """获取所有数据源"""
        query = "SELECT * FROM data_sources WHERE is_active = true;"
        return self.execute_query(query)
    
    def update_data_source_last_crawled(self, source_id):
        """更新数据源最后爬取时间"""
        query = """
        UPDATE data_sources SET 
            last_crawled = %(last_crawled)s,
            updated_at = %(updated_at)s
        WHERE id = %(source_id)s;
        """
        
        params = {
            'source_id': source_id,
            'last_crawled': datetime.now(),
            'updated_at': datetime.now()
        }
        
        return self.execute_query(query, params)
