import os
from dotenv import load_dotenv

load_dotenv()

# 数据库配置
DATABASE_URL = os.getenv('DATABASE_URL', 'postgresql://user:password@localhost:5432/artslave')

# 爬虫配置
CRAWL_DELAY = 1  # 请求间隔（秒）
MAX_RETRIES = 3  # 最大重试次数
TIMEOUT = 30     # 请求超时时间

# 用户代理配置
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
]

# 数据源配置
DATA_SOURCES = {
    'filmfreeway': {
        'name': 'FilmFreeway 艺术节',
        'base_url': 'https://filmfreeway.com/festivals',
        'type': 'website',
        'enabled': True
    },
    'namoc': {
        'name': '中国美术馆',
        'base_url': 'http://www.namoc.org',
        'type': 'website', 
        'enabled': True
    },
    'artsy': {
        'name': 'Artsy 展览',
        'base_url': 'https://www.artsy.net',
        'type': 'api',
        'enabled': False
    }
}

# 投稿信息类型映射
SUBMISSION_TYPES = {
    'exhibition': 'EXHIBITION',
    'residency': 'RESIDENCY', 
    'competition': 'COMPETITION',
    'grant': 'GRANT',
    'conference': 'CONFERENCE',
    'festival': 'EXHIBITION',  # 艺术节归类为展览
    'award': 'COMPETITION'     # 奖项归类为比赛
}
