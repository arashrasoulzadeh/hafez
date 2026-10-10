"""Build data/hafez.db + data/hafez.sql from data/raw"""
import json, glob, sqlite3, os, re
SCHEMA="""
CREATE TABLE categories (id INTEGER PRIMARY KEY, slug TEXT NOT NULL, title TEXT NOT NULL);
CREATE TABLE poems (
  id INTEGER PRIMARY KEY,            -- ganjoor poem id
  category_id INTEGER NOT NULL REFERENCES categories(id),
  number INTEGER NOT NULL,           -- order within category
  title TEXT NOT NULL,
  plain_text TEXT NOT NULL,          -- hemistichs one per line, no diacritics
  summary_fa TEXT,
  summary_en TEXT,
  source TEXT,
  UNIQUE(category_id, number)
);
CREATE TABLE verses (                -- hemistich level
  id INTEGER PRIMARY KEY,
  poem_id INTEGER NOT NULL REFERENCES poems(id),
  couplet_index INTEGER NOT NULL,    -- 0-based bayt index
  position INTEGER NOT NULL,         -- 0 = first hemistich, 1 = second
  text TEXT NOT NULL,                -- with diacritics (as on ganjoor)
  couplet_summary_fa TEXT,           -- bayt tafsir, on position 0 row
  couplet_summary_en TEXT
);
CREATE INDEX idx_verses_poem ON verses(poem_id, couplet_index, position);
"""
def norm(s): return " ".join(s.split()) if s else None
if os.path.exists("data/hafez.db"): os.remove("data/hafez.db")
c=sqlite3.connect("data/hafez.db"); c.executescript(SCHEMA)
for f in sorted(glob.glob("data/raw/cat*.json")):
    cat=json.load(open(f)); c.execute("INSERT INTO categories VALUES (?,?,?)",(cat["id"],cat["slug"],cat["title"]))
    for n,pid in enumerate(cat["poems"],1):
        p=json.load(open(f"data/raw/{pid}.json"))
        c.execute("INSERT INTO poems VALUES (?,?,?,?,?,?,?,?)",(pid,cat["id"],n,p["title"],p["plainText"].replace("\r",""),norm(p.get("poemSummary")),None,p.get("sourceName")))
        for v in p["verses"]:
            c.execute("INSERT INTO verses VALUES (?,?,?,?,?,?,?)",(v["id"],pid,v["coupletIndex"],v["versePosition"],v["text"],norm(v.get("coupletSummary")),None))
c.commit()
with open("data/hafez.sql","w") as o:
    for l in c.iterdump(): o.write(l+"\n")
for t in ("categories","poems","verses"): print(t,c.execute(f"select count(*) from {t}").fetchone()[0])
print(c.execute("select count(*) from poems where summary_fa is null").fetchone(), c.execute("select count(*) from verses where couplet_summary_fa is not null").fetchone())
