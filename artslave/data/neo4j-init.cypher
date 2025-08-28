
// ArtSlave 知识图谱初始化脚本
// 在 Neo4j Browser 中运行此脚本

// 创建约束
CREATE CONSTRAINT artist_name IF NOT EXISTS FOR (a:Artist) REQUIRE a.name IS UNIQUE;
CREATE CONSTRAINT exhibition_title IF NOT EXISTS FOR (e:Exhibition) REQUIRE (e.title, e.year) IS UNIQUE;
CREATE CONSTRAINT institution_name IF NOT EXISTS FOR (i:Institution) REQUIRE i.name IS UNIQUE;
CREATE CONSTRAINT artwork_title IF NOT EXISTS FOR (w:Artwork) REQUIRE (w.title, w.artist) IS UNIQUE;

// 创建示例节点
CREATE (picasso:Artist {
  name: "巴勃罗·毕加索",
  birth_year: 1881,
  death_year: 1973,
  nationality: "西班牙",
  style: ["立体主义", "蓝色时期", "玫瑰时期"],
  bio: "20世纪最具影响力的艺术家之一"
});

CREATE (cubism:Movement {
  name: "立体主义",
  period: "1907-1920",
  characteristics: ["几何形状", "多视角", "解构重组"],
  description: "20世纪初的革命性艺术运动"
});

CREATE (guernica:Artwork {
  title: "格尔尼卡",
  year: 1937,
  medium: "布面油画",
  dimensions: "349.3 × 776.6 cm",
  description: "反战主题的立体主义杰作"
});

CREATE (moma:Institution {
  name: "现代艺术博物馆",
  type: "博物馆",
  location: "纽约",
  founded: 1929,
  description: "世界著名的现代艺术博物馆"
});

CREATE (picasso_retro:Exhibition {
  title: "毕加索回顾展",
  year: 2023,
  venue: "现代艺术博物馆",
  duration: "6个月",
  description: "毕加索作品大型回顾展"
});

// 创建关系
CREATE (picasso)-[:FOUNDED]->(cubism);
CREATE (picasso)-[:CREATED]->(guernica);
CREATE (guernica)-[:BELONGS_TO]->(cubism);
CREATE (guernica)-[:COLLECTED_BY]->(moma);
CREATE (picasso_retro)-[:HELD_AT]->(moma);
CREATE (picasso_retro)-[:FEATURES]->(picasso);
CREATE (picasso_retro)-[:DISPLAYS]->(guernica);

// 创建索引
CREATE INDEX artist_name_index IF NOT EXISTS FOR (a:Artist) ON (a.name);
CREATE INDEX exhibition_year_index IF NOT EXISTS FOR (e:Exhibition) ON (e.year);
CREATE INDEX artwork_year_index IF NOT EXISTS FOR (w:Artwork) ON (w.year);
