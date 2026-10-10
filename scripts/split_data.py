"""Split the full corpus (built from data/hafez.db) into one small file per ghazal plus a compact pool used for the turning pages.
The app then downloads ~5 KB per fal instead of the whole 2.6 MB corpus."""
import json, os, random, sqlite3, shutil
c = sqlite3.connect("data/hafez.db")
out, pool = [], []
for pid, num, title in c.execute("select id,number,title from poems where category_id=24 order by number"):
    cp = {}
    for ci, pos, t, s in c.execute("select couplet_index,position,text,couplet_summary_fa from verses where poem_id=? order by couplet_index,position", (pid,)):
        d = cp.setdefault(ci, {"v": [], "s": None}); d["v"].append(t)
        if s: d["s"] = s
    sm = c.execute("select summary_fa from poems where id=?", (pid,)).fetchone()[0]
    out.append({"n": num, "title": title, "summary": sm, "couplets": [cp[k] for k in sorted(cp)]})
shutil.rmtree("public/g", ignore_errors=True); os.makedirs("public/g")
for g in out:
    json.dump(g, open(f"public/g/{g['n']}.json", "w"), ensure_ascii=False, separators=(",", ":"))
random.seed(7)
for g in random.sample(out, 48):
    pool.append({"n": g["n"], "title": g["title"], "summary": None, "couplets": [{"v": c2["v"], "s": None} for c2 in g["couplets"][:12]]})
json.dump({"count": len(out), "pool": pool}, open("public/index.json", "w"), ensure_ascii=False, separators=(",", ":"))
print(len(out), "ghazals;", os.path.getsize("public/index.json") // 1024, "KB index")
