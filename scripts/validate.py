import json
from pathlib import Path
from upd_status import canonical, digest
ROOT=Path(__file__).resolve().parents[1]
def validate():
    records=json.loads((ROOT/'data/data.json').read_text())
    tree=json.loads((ROOT/'data/tree.json').read_text());sub=json.loads((ROOT/'data/subtree.json').read_text())
    indices=[i for k in tree for d in k['docs'] for c in d['chapters'] for i in c['items']]
    assert set(indices)==set(range(len(records))), '准则目录存在遗漏'
    assert all(0<=i<len(records) for g in sub for s in g['items'] for i in s['items'])
    library=json.loads((ROOT/'data/library.json').read_text())
    assert len({d['id'] for d in library})==len(library)
    for d in library:
        canonical(d['url']);snapshot=json.loads((ROOT/d['snapshot']).read_text());assert digest(snapshot)==d['hash']
    for c in json.loads((ROOT/'data/changes.json').read_text()):
        assert (ROOT/c['after']).is_file()
        if c['before']:assert (ROOT/c['before']).is_file()
    print(f'Validated {len(records)} articles, {len(library)} live documents and immutable versions')
if __name__=='__main__':validate()
