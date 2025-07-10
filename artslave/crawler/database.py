import sqlite3
import json
from datetime import datetime
from pathlib import Path

class DatabaseManager:
    def __init__(self):
        self.connection = None
        self.connect()

    def connect(self):
        """连接 SQLite 数据库"""
        try:
            # 确保数据目录存在
            data_dir = Path(__file__).parent.parent / 'data'
            data_dir.mkdir(exist_ok=True)

            # SQLite 数据库文件路径
            db_path = data_dir / 'artslave.db'

            self.connection = sqlite3.connect(str(db_path))
            self.connection.row_factory = sqlite3.Row  # 使结果可以像字典一样访问
            print(f"✓ SQLite 数据库连接成功: {db_path}")
        except Exception as e:
            print(f"✗ 数据库连接失败: {e}")
            self.connection = None

    def close(self):
        """关闭数据库连接"""
        if self.connection:
            self.connection.close()

    def execute_query(self, query, params=None):
        """执行查询"""
        try:
            cursor = self.connection.cursor()
            if params:
                cursor.execute(query, params)
            else:
                cursor.execute(query)

            self.connection.commit()

            # 如果是 SELECT 查询，返回结果
            if query.strip().upper().startswith('SELECT'):
                return [dict(row) for row in cursor.fetchall()]
            else:
                return cursor.rowcount

        except Exception as e:
            print(f"查询执行失败: {e}")
            self.connection.rollback()
            return None
    
    def insert_submission_info(self, data):
        """插入投稿信息"""
        # 生成唯一ID
        submission_id = str(int(datetime.now().timestamp() * 1000))

        query = """
        INSERT OR REPLACE INTO submissions (
            id, title, description, type, organizer, deadline,
            location, website, email, phone, fee, prize,
            requirements, tags, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """

        now = datetime.now().isoformat()
        params = (
            submission_id,
            data.get('title'),
            data.get('description'),
            data.get('type', 'OTHER'),
            data.get('organizer'),
            data.get('deadline'),
            data.get('location'),
            data.get('website'),
            data.get('email'),
            data.get('phone'),
            data.get('fee'),
            data.get('prize'),
            json.dumps(data.get('requirements', {})),
            json.dumps(data.get('tags', [])),
            True,
            now,
            now
        )

        result = self.execute_query(query, params)
        return submission_id if result else None
    
    def create_crawl_job(self, data_source_name="演示爬虫"):
        """创建爬虫任务记录"""
        job_id = str(int(datetime.now().timestamp() * 1000))

        query = """
        INSERT INTO crawl_jobs (id, data_source_name, status, started_at, created_at)
        VALUES (?, ?, 'pending', ?, ?)
        """

        now = datetime.now().isoformat()
        params = (job_id, data_source_name, now, now)

        result = self.execute_query(query, params)
        return job_id if result else None

    def update_crawl_job(self, job_id, status, items_found=0, items_added=0, error_message=None):
        """更新爬虫任务状态"""
        query = """
        UPDATE crawl_jobs SET
            status = ?,
            items_found = ?,
            items_added = ?,
            error_message = ?,
            completed_at = ?,
            updated_at = ?
        WHERE id = ?
        """

        now = datetime.now().isoformat()
        completed_at = now if status in ['completed', 'failed'] else None

        params = (status, items_found, items_added, error_message, completed_at, now, job_id)

        return self.execute_query(query, params)
    
    def get_data_sources(self):
        """获取所有数据源"""
        query = "SELECT * FROM data_sources WHERE is_active = 1"
        return self.execute_query(query)

    def update_data_source_last_crawled(self, source_id):
        """更新数据源最后爬取时间"""
        query = """
        UPDATE data_sources SET
            last_crawled = ?,
            updated_at = ?
        WHERE id = ?
        """

        now = datetime.now().isoformat()
        params = (now, now, source_id)

        return self.execute_query(query, params)
