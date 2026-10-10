"""Fetch all of Hafez from Ganjoor into data/raw/*.json (cached) and data/md/<cat>/<nnn>.md"""
import json, urllib.request, time, os, concurrent.futures as cf
B="https://api.ganjoor.net/api/ganjoor"
CATS={24:"ghazal",25:"qete",26:"robaei",27:"qaside",674:"montasab"}
def get(u):
    for i in range(5):
        try: return json.load(urllib.request.urlopen(urllib.request.Request(u,headers={"User-Agent":"hafez-fal"}),timeout=40))
        except Exception: time.sleep(1+i)
    raise SystemExit("fail "+u)
Q="?catInfo=false&rhymes=false&recitations=false&images=false&songs=false&comments=false&verseDetails=true&navigation=false"
def poem(pid):
    f=f"data/raw/{pid}.json"
    if os.path.exists(f): return json.load(open(f))
    p=get(f"{B}/poem/{pid}{Q}")
    for k in ("htmlText","sections","top6QuotedPoems","category"): p.pop(k,None)
    json.dump(p,open(f,"w"),ensure_ascii=False); return p
for cid,slug in CATS.items():
    cat=get(f"{B}/cat/{cid}")["cat"]
    json.dump({"id":cid,"slug":slug,"title":cat["title"],"poems":[x["id"] for x in cat["poems"]]},open(f"data/raw/cat{cid}.json","w"),ensure_ascii=False)
    with cf.ThreadPoolExecutor(8) as ex: ps=list(ex.map(poem,[x["id"] for x in cat["poems"]]))
    os.makedirs(f"data/md/{slug}",exist_ok=True)
    for n,p in enumerate(ps,1):
        L=[f"---\ncategory: {slug}\nnumber: {n}\nganjoor_id: {p['id']}\ntitle: {p['title']}\n---\n",
           "## خلاصه تفسیر (فارسی)\n\n"+" ".join((p.get('poemSummary') or '').split())+"\n"]
        cs={}
        for v in p["verses"]: cs.setdefault(v["coupletIndex"],[]).append(v)
        for ci,vs in sorted(cs.items()):
            L.append(f"### بیت {ci+1}\n\n"+"\n".join(v["text"] for v in vs)+"\n")
            s=next((v["coupletSummary"] for v in vs if v.get("coupletSummary")),None)
            if s: L.append("**تفسیر:** "+" ".join(s.split())+"\n")
        L.append("## Interpretation (English)\n\n")
        open(f"data/md/{slug}/{n:03d}.md","w").write("\n".join(L))
    print(slug,len(ps),sum(1 for p in ps if p.get('poemSummary')),sum(1 for p in ps for v in p['verses'] if v.get('coupletSummary')))
