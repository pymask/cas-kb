# -*- coding: utf-8 -*-
"""生成 update_status.json：供网页端「检查更新」直接读取。

与 check_update.py 的区别：
  - 本脚本面向 GitHub Actions 运行（服务端抓取），产出结构化 JSON
  - 网页端 fetch('update_status.json') 即可展示，绕开浏览器 CORS 限制

用法：
    python3 upd_status.py                # 联网抓取（GitHub Actions）
    python3 upd_status.py --offline      # 不联网，仅输出本地快照信息

产出：
    /workspace/cas-kb-site/update_status.json
"""
import re, os, json, sys, time

D = os.path.dirname(os.path.abspath(__file__))
# 输出路径优先级：环境变量 > 仓库根（Actions 场景）> 本地站点目录
_env = os.environ.get("UPD_OUT")
if _env:
    OUT = _env
elif os.path.isdir("/workspace/cas-kb-site"):
    OUT = os.path.join(os.path.dirname(D), "update_status.json") \
        if os.path.basename(D) == "scripts" else "/workspace/cas-kb-site/update_status.json"
else:
    OUT = os.path.join(os.path.dirname(D), "update_status.json")
STATE = os.path.join(D, "build", "state.json")

BASE = "https://kjs.mof.gov.cn/"
HDR = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0 Safari/537.36",
    "Referer": "https://kjs.mof.gov.cn/gongzuotongzhi/",
}

# 已收录基准（与 check_update.py 保持一致）
KNOWN_ZZ = {
    "7": "201909/t20190911_3384679", "12": "201910/t20191028_3410789",
    "14": "201709/t20170907_2694006", "16": "200806/t20080618_46232",
    "20": "200806/t20080618_46228", "21": "201910/t20191028_3411190",
    "22": "201709/t20170908_2694655", "23": "201709/t20170908_2694626",
    "24": "201709/t20170908_2694624", "30": "202608/t20260806_3995008",
    "33": "200806/t20080618_46248", "37": "201709/t20170907_2694118",
}
KNOWN_JS = {
    "16": "202212/t20221212_3857395", "17": "202311/t20231109_3915491",
    "18": "202412/t20241223_3950344", "19": "202512/t20251218_3979556",
    "20": "202606/t20260615_3991686",
}


def fetch(url, retries=3):
    """抓取页面，失败返回空串（Actions 里不阻塞整体流程）"""
    try:
        import requests
    except ImportError:
        print("  ! 缺少 requests，跳过联网")
        return ""
    for a in range(retries):
        try:
            r = requests.get(url, headers=HDR, timeout=30)
            r.encoding = r.apparent_encoding or "utf-8"
            return r.text
        except Exception as e:
            print(f"  retry {a+1}: {type(e).__name__}")
            time.sleep(2)
    return ""


def list_links(html_text):
    out = []
    for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', html_text, re.S):
        href, txt = m.group(1), re.sub(r"<[^>]+>", "", m.group(2))
        txt = txt.replace("&nbsp;", " ").strip()
        if txt and ("t20" in href) and href.endswith(".htm"):
            out.append((txt, href))
    return out


def norm(href):
    m = re.search(r"(20\d{2}\d{2}/t\d{8}_\d+)", href)
    return m.group(1) if m else href


def abs_url(rel, col):
    """把相对链接补全为官网绝对地址"""
    if rel.startswith("http"):
        return rel
    return BASE + col + "/" + norm(rel) + ".htm"


def check_zhunze():
    found = {}
    for page in range(1, 5):
        u = (BASE + f"zt/kjzzss/kuaijizhunzeshishi/index_{page}.htm") if page > 1 \
            else (BASE + "zt/kjzzss/kuaijizhunzeshishi/")
        h = fetch(u)
        if not h:
            continue
        for txt, href in list_links(h):
            if "企业会计准则第" in txt and "——" in txt:
                found[norm(href)] = txt
    return found


def check_jieshi():
    found = {}
    for col in ["zhengcefabu", "gongzuotongzhi"]:
        for page in range(1, 4):
            u = (BASE + f"{col}/index_{page}.htm") if page > 1 else (BASE + f"{col}/")
            h = fetch(u)
            if not h:
                continue
            for txt, href in list_links(h):
                if "解释" in txt and "企业会计准则" in txt:
                    found[norm(href)] = txt
    return found


def main():
    offline = "--offline" in sys.argv
    snap = {
        "checked": time.strftime("%Y-%m-%d %H:%M:%S"),
        "offline": offline,
        "new_std": [],
        "new_interp": [],
        "notices": [],
        "err": None,
    }

    # 本地快照信息（供页面显示规模）
    try:
        recs = json.load(open(os.path.join(D, "build", "records.json")))
        from collections import Counter
        kc = Counter(r["kind"] for r in recs)
        snap["local"] = {
            "total": len(recs),
            "std": kc.get("准则原文", 0),
            "interp": kc.get("准则解释", 0),
            "qa": kc.get("实施问答", 0),
            "case": kc.get("应用案例", 0),
        }
    except Exception as e:
        snap["local"] = None

    if offline:
        write(snap)
        return

    print("抓取准则栏目…")
    zz = check_zhunze()
    print("抓取解释栏目…")
    js = check_jieshi()

    if not zz and not js:
        snap["err"] = "无法访问财政部站点（网络受限或站点变更），请稍后重试"
        write(snap)
        return

    def recent(k):
        m = re.match(r"(\d{4})", k)
        return (not m) or int(m.group(1)) >= 2024

    known_zz = set(KNOWN_ZZ.values())
    known_js = set(KNOWN_JS.values())

    for k, v in sorted(zz.items(), reverse=True):
        if k not in known_zz and recent(k):
            snap["new_std"].append({
                "title": v, "url": BASE + "zt/kjzzss/kuaijizhunzeshishi/" + k + ".htm"
            })

    for k, v in sorted(js.items(), reverse=True):
        if k in known_js or not recent(k):
            continue
        item = {"title": v, "url": abs_url(k, "gongzuotongzhi")}
        if "征求意见" in v:
            snap["notices"].append(item)
        elif "解释第" in v and "通知" in v:
            snap["new_interp"].append(item)
        else:
            snap["notices"].append(item)

    snap["counts"] = {"zz_listed": len(zz), "js_listed": len(js)}
    write(snap)


def write(snap):
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(snap, f, ensure_ascii=False, indent=1)
    print("已写入:", OUT)
    print(json.dumps({k: snap[k] for k in snap if k != "local"}, ensure_ascii=False)[:400])


if __name__ == "__main__":
    main()
