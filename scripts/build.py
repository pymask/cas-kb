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
    old=[r for r in data if r['d']=='企业会计准则第30号——财务报表列报（2014年版）']
    new=[r for r in data if r['d']=='企业会计准则第30号——财务报表列报（2026年版）']
    comparisons=[{'type':'comparison','title':'财务报表列报：2014版 / 2026版','at':'2026-10-27T00:00:00+08:00','url':overrides[new[0]['d']]['source'],'analysis':'条文文本对照，不等同于会计政策影响结论。'+overrides[new[0]['d']]['note'],'changes':diff({'text':'\n'.join(r['t'] for r in old)},{'text':'\n'.join(r['t'] for r in new)})}]
    (ROOT/'data/comparisons.json').write_text(json.dumps(comparisons,ensure_ascii=False,indent=2)+'\n')
    tree=read('tree'); sub=read('subtree'); stat=read('stat')
    # Source snapshots are searchable in the separate live library. Do not silently
    # replace curated article IDs, legal status, or subject mappings.
    payload={'DATA':data,'TREE':tree,'SUBTREE':sub,'STAT':stat,'MATHIMG':read('mathimg')}
    (ROOT/'assets/data.js').write_text('\n'.join('const '+k+' = '+json.dumps(v,ensure_ascii=False).replace('<','\\u003c')+';' for k,v in payload.items())+'\n')
    (ROOT/'data/quality.json').write_text(json.dumps({'issues':issues,'repairs':list(repairs.values()),'records':len(data),'documents':len(set(r['u'] for r in data))},ensure_ascii=False,indent=2)+'\n')
if __name__=='__main__':build()
