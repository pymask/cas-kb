"""Official-source ingestion with immutable versions and conservative failure semantics."""
import argparse, concurrent.futures, hashlib, io, json, re, shutil, subprocess, tempfile, time, zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urljoin, urlsplit, urlunsplit
import requests
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
HOSTS={'kjs.mof.gov.cn','www.mof.gov.cn','tfs.mof.gov.cn','www.csrc.gov.cn'}
SELECTORS='.TRS_Editor, .my_doccontent, .Custom_UnionStyle, #ContentRegion, .content-detail, .detail-news'

def canonical(url):
    p=urlsplit(url)
    if p.scheme not in ('http','https') or p.hostname not in HOSTS or p.username or p.port not in (None,80,443):
        raise ValueError('非已登记官方来源')
    return urlunsplit(('https',p.netloc,p.path,p.query,''))

def fetch_once(url):
    url=canonical(url)
    for _ in range(5):
        r=requests.get(url,timeout=(8,25),headers={'User-Agent':'CAS-KB/2.0 official-source research'},allow_redirects=False)
        if r.is_redirect:
            url=canonical(urljoin(url,r.headers['Location']));continue
        r.raise_for_status()
        if len(r.content)>50_000_000:raise ValueError('文件超过50MB，需人工处理')
        return r,url
    raise ValueError('重定向次数过多')

def fetch(url):
    for attempt in range(3):
        try:return fetch_once(url)
        except (requests.Timeout, requests.ConnectionError):
            if attempt==2:raise
            time.sleep(attempt+1)

def word_text(data,ext):
    if ext=='.docx':
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            info=z.getinfo('word/document.xml')
            if info.file_size>50_000_000:raise ValueError('Word XML过大')
            root=ET.fromstring(z.read(info))
        ns='{http://schemas.openxmlformats.org/wordprocessingml/2006/main}'
        return '\n'.join(''.join(p.itertext()) for p in root.iter(ns+'p'))
    with tempfile.TemporaryDirectory() as folder:
        path=Path(folder)/'source.doc';path.write_bytes(data)
        if shutil.which('antiword'):cmd=['antiword','-m','UTF-8.txt',str(path)]
        elif shutil.which('textutil'):cmd=['textutil','-convert','txt','-stdout',str(path)]
        else:raise ValueError('需要安装antiword解析旧Word附件')
        return subprocess.run(cmd,check=True,capture_output=True,timeout=40).stdout.decode('utf-8').strip()

def html(r):
    r.encoding='utf-8' if b'charset=gb' not in r.content[:3000].lower() else 'gb18030'
    return BeautifulSoup(r.text,'html.parser')

def links(soup,url):
    out={}
    for a in soup.select('a[href]'):
        try:u=canonical(urljoin(url,a['href']))
        except ValueError:continue
        out[u]=a.get_text(' ',strip=True)
    return out

def extract(soup, allow_short=False):
    node=soup.select_one(SELECTORS)
    if node is None:raise ValueError('未识别正文区域，保留上一版本')
    for n in node.select('script,style,iframe'):n.decompose()
    for n in node.find_all(['p','div','li','tr','h1','h2','h3','br']):n.insert_after('\n')
    text='\n'.join(re.sub(r'[ \t\xa0\u3000]+',' ',s).strip() for s in node.get_text('').splitlines() if s.strip())
    if (len(text)<40 and not allow_short) or '\ufffd' in text:raise ValueError('正文过短或编码异常')
    return text

def classify(title, fallback):
    if '征求意见' in title:return '征求意见稿'
    if title.startswith(('问：','问:')):return '实施问答'
    if fallback in ('实施问答','应用案例'):return fallback
    for key,kind in [('实施问答','实施问答'),('应用案例','应用案例'),('应用指南','应用指南'),('解释第','准则解释'),('分析报告','实施分析'),('监管','监管参考'),('年报','年报指导'),('答记者问','政策解读')]:
        if key in title:return kind
    return fallback

def document(item):
    r,url=fetch(item['url']);soup=html(r)
    attachment_links={u:t for u,t in links(soup,url).items() if re.search(r'\.(pdf|docx?|xlsx?)(?:\?|$)',u,re.I)}
    text=extract(soup,allow_short=bool(attachment_links))
    title=soup.find('meta',attrs={'name':'ArticleTitle'})
    title=title.get('content') if title else item.get('title')
    title=title or (soup.title.get_text(strip=True) if soup.title else url)
    attachments=[]
    for u,label in attachment_links.items():
        if not re.search(r'\.(pdf|docx?|xlsx?)(?:\?|$)',u,re.I):continue
        a={'url':u,'title':label or u.split('/')[-1],'status':'pending'}
        try:
            ar,au=fetch(u);a['sha256']=hashlib.sha256(ar.content).hexdigest()
            if '.pdf' in urlsplit(au).path.lower():
                from pypdf import PdfReader
                at='\n'.join(p.extract_text() or '' for p in PdfReader(io.BytesIO(ar.content)).pages)
                if len(at.strip())<40:raise ValueError('扫描PDF需OCR')
                a['text']=at.strip();a['status']='extracted'
            elif re.search(r'\.docx?$',urlsplit(au).path,re.I):
                at=word_text(ar.content,Path(urlsplit(au).path).suffix.lower())
                if len(at.strip())<40:raise ValueError('Word正文过短')
                a['text']=at;a['status']='extracted'
            else:a['error']='附件格式需人工提取，正文尚不包含该附件全文'
        except Exception as e:a['error']=str(e)[:240]
        attachments.append(a)
    if not text.strip():text='此发布页正文见附件。'
    kind=classify(title,item.get('kind','官方资料'))
    return {'url':url,'title':title,'kind':kind,'publisher':item.get('publisher','财政部'),
      'text':text,'attachments':attachments,'status':'征求意见，不作为现行依据' if kind=='征求意见稿' else '官方原文快照；效力与适用范围请核对原文',
      'published': (soup.find('meta',attrs={'name':'PubDate'}) or {}).get('content','')}

def digest(doc):
    return hashlib.sha256(json.dumps(doc,ensure_ascii=False,sort_keys=True).encode()).hexdigest()

def diff(old,new):
    from difflib import SequenceMatcher
    def body(d):return (d.get('text','')+'\n'+'\n'.join(a.get('text','') for a in d.get('attachments',[]))).splitlines()
    a,b=body(old),body(new);changes=[]
    for tag,i,j,k,l in SequenceMatcher(None,a,b,autojunk=False).get_opcodes():
        if tag!='equal':changes.append({'type':tag,'before':a[i:j],'after':b[k:l]})
    return changes

def save(path,obj):
    path.parent.mkdir(parents=True,exist_ok=True);temp=path.with_suffix('.tmp');temp.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n');temp.replace(path)

def ingest(root,docs,now):
    folder=root/'data';p=folder/'library.json';library=json.loads(p.read_text()) if p.exists() else []
    lp=folder/'changes.json';history=json.loads(lp.read_text()) if lp.exists() else []
    current={x['id']:x for x in library};events=[]
    for doc in sorted(docs,key=lambda x:x['url']):
        ident=hashlib.sha256(doc['url'].encode()).hexdigest()[:20];sha=digest(doc);old=current.get(ident)
        if old and old['hash']==sha:continue
        previous=json.loads((root/old['snapshot']).read_text()) if old else {}
        snapshot=f'data/versions/{ident}/{sha}.json';save(root/snapshot,doc)
        event={'id':ident+'-'+sha[:16]+'-'+now,'document_id':ident,'title':doc['title'],'url':doc['url'],'at':now,'type':'changed' if old else 'added','before':old['snapshot'] if old else None,'after':snapshot,'changes':diff(previous,doc),'analysis':'机器采集文本差异，可能包含解析器修订，不一定是官方政策变化；不自动判断准则废止、生效或会计处理结论。'}
        events.append(event)
        current[ident]={**doc,'id':ident,'hash':sha,'snapshot':snapshot,'updated_at':now}
    save(p,sorted(current.values(),key=lambda x:(x['updated_at'],x['id']),reverse=True));save(lp,events+history)
    return events,len(current)

def discover(config,max_pages):
    queue=[(u,s,0) for s in config['feeds'] for u in s['urls']];visited=set();found={};errors=[];reports=[]
    while queue and len(visited)<max_pages:
        url,source,depth=queue.pop(0)
        if url in visited:continue
        visited.add(url)
        try:
            r,actual=fetch(url);ls=links(html(r),actual);count=0;recognized=0
            for u,title in ls.items():
                if re.search(source.get('article_pattern',r'/t\d{8}_\d+\.htm'),u):
                    recognized+=1
                    if source.get('all_articles') or re.search(source.get('keywords',config['keywords']),title):
                        found[u]={'url':u,'title':title,'kind':source['kind'],'publisher':source.get('publisher','财政部')};count+=1
                elif depth<source.get('depth',0) and u.startswith(source['prefix']) and (u.endswith('/') or re.search(r'/index(?:_\d+)?\.htm$',u)) and u not in visited:
                    queue.append((u,source,depth+1))
            if not recognized and not any(u.startswith(source['prefix']) and u.endswith('/') for u in ls):raise ValueError('栏目结构异常或无可识别条目')
            reports.append({'url':url,'ok':True,'articles':count})
        except Exception as e:errors.append({'url':url,'error':str(e)[:240]});reports.append({'url':url,'ok':False})
    if queue:errors.append({'url':'discovery','error':'达到栏目抓取上限；未遍历栏目不声明已检查'})
    return found,errors,reports

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--offline',action='store_true');ap.add_argument('--seeds-only',action='store_true');ap.add_argument('--max-pages',type=int,default=80);ap.add_argument('--max-docs',type=int,default=500);args=ap.parse_args()
    if args.offline:
        print('离线校验：不改变线上检查时间或状态');return
    now=datetime.now(timezone.utc).isoformat(timespec='seconds');config=json.loads((ROOT/'data/sources.json').read_text());found={};errors=[];reports=[]
    if not args.seeds_only:found,errors,reports=discover(config,args.max_pages)
    for item in config['documents']:found[canonical(item['url'])]=item
    # Previously collected sources are rechecked even after disappearing from feeds.
    lib=ROOT/'data/library.json'
    if lib.exists():
        for item in json.loads(lib.read_text()):found.setdefault(item['url'],item)
    items=sorted(found.values(),key=lambda x:x['url'])
    if len(items)>args.max_docs:errors.append({'url':'documents','error':'达到正文抓取上限，本次检查不完整'})
    docs=[]
    existing={x['url']:x for x in json.loads(lib.read_text())} if lib.exists() else {}
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        futures={pool.submit(document,x):x for x in items[:args.max_docs]}
        for f in concurrent.futures.as_completed(futures):
            try:
                d=f.result()
                failed=any(a['status']!='extracted' for a in d['attachments'])
                if not (failed and d['url'] in existing):docs.append(d)
                for a in d['attachments']:
                    if a['status']!='extracted':errors.append({'url':a['url'],'error':a.get('error','附件待提取')})
            except Exception as e:errors.append({'url':futures[f]['url'],'error':str(e)[:240]})
    events,total=ingest(ROOT,docs,now)
    previous=json.loads((ROOT/'update_status.json').read_text())
    complete=not errors and not args.seeds_only
    status={'schema':2,'checked':now,'complete':complete,'offline':False,'last_success':now if complete else previous.get('last_success'),
      'scope':'登记栏目、证监会首页重点链接及历史已采集来源；不代表官方资料全量覆盖','sources':reports,'errors':errors,'err':None if complete else '本次检查不完整，请查看来源明细；保留上次成功正文。',
      'counts':{'checked_documents':len(docs),'discovered':len(items),'library':total,'added':sum(e['type']=='added' for e in events),'changed':sum(e['type']=='changed' for e in events)},'run_url':__import__('os').environ.get('RUN_URL'),'new_std':[],'new_interp':[],'notices':[]}
    save(ROOT/'update_status.json',status)
    cp=ROOT/'data/checks.json';checks=json.loads(cp.read_text()) if cp.exists() else []
    save(cp,([status]+checks)[:180])
    print(json.dumps(status['counts'],ensure_ascii=False));print('errors',len(errors))
    if errors:raise SystemExit(2)
if __name__=='__main__':main()
