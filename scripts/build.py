"""Deterministic browser bundle; original records remain unchanged on disk."""
import json
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
def read(name, default=None):
    p=ROOT/'data'/f'{name}.json'
    return json.loads(p.read_text()) if p.exists() else default

def build():
    data=read('data'); issues=[]
    repairs={x['index']:x for x in read('repairs',[])}
    overrides={x['document']:x for x in read('overrides',[])}
    for r in data:
        if r['s'] == '现行有效':r['s']='原库标注现行有效，效力待核验'
        elif r['s'].startswith('已废止'):r['s']='原库标注'+r['s']+'，适用性待核验'
        if r['d'] in overrides:
            o=overrides[r['d']];r['s']=o['status'];r['e']=o['effective']
            r['review_note']=o['note'];r['review_source']=o['source']
    for i,r in enumerate(data):
        if i in repairs:
            fix=repairs[i];r['t']=fix['text'];r['review_note']=fix['note'];r['review_source']=fix['source']
        if 'WordDocument' in r['t'] or 'DocumentSummaryInformation' in r['t']:
            issues.append({'index':i,'document':r['d'],'url':r['u'],'issue':'原始 Word 提取含乱码；暂停展示该条正文，原始记录保留在 data/data.json'})
            r['t']='此条历史导入正文含文件编码噪声，暂不展示。请通过官方原文核对；修复前不作为可靠全文检索结果。'
            r['s']='正文待修复'
    from upd_status import diff
    import re
    groups={}
    for r in data:
        m=re.fullmatch(r'(企业会计准则第\d+号——.+)（(\d{4})年版）',r['d'])
        if m:groups.setdefault(m.group(1),{}).setdefault(int(m.group(2)),[]).append(r)
    comparisons=[]
    for title,versions in sorted(groups.items()):
        years=sorted(versions)
        if len(years)<2:continue
        before,after=versions[years[-2]],versions[years[-1]]
        note='机器逐条文字对照，用于定位变化；不判断修订影响及具体主体的适用时间。'
        source=after[0]['u']
        if after[0]['d'] in overrides:
            o=overrides[after[0]['d']];source=o['source'];note+=o['note']
        comparisons.append({'type':'comparison','title':title+'：'+str(years[-2])+'版 / '+str(years[-1])+'版','at':'2026-10-28T00:00:00+08:00','url':source,'analysis':note,'changes':diff({'text':'\n'.join(r['t'] for r in before)},{'text':'\n'.join(r['t'] for r in after)})})
    (ROOT/'data/comparisons.json').write_text(json.dumps(comparisons,ensure_ascii=False,indent=2)+'\n')
    tree=read('tree'); sub=read('subtree'); stat=read('stat')
    # Source snapshots are searchable in the separate live library. Do not silently
    # replace curated article IDs, legal status, or subject mappings.
    payload={'DATA':data,'TREE':tree,'SUBTREE':sub,'STAT':stat,'MATHIMG':read('mathimg')}
    (ROOT/'assets/data.js').write_text('\n'.join('const '+k+' = '+json.dumps(v,ensure_ascii=False).replace('<','\\u003c')+';' for k,v in payload.items())+'\n')
    (ROOT/'data/quality.json').write_text(json.dumps({'issues':issues,'repairs':list(repairs.values()),'records':len(data),'documents':len(set(r['u'] for r in data))},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':build()
