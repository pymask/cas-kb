import copy,json,tempfile,unittest,sys
from pathlib import Path
from unittest.mock import patch,Mock
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from upd_status import canonical,extract,ingest,diff,classify,fetch,document,discover
from bs4 import BeautifulSoup
class UpdateTests(unittest.TestCase):
    def test_url(self):
        self.assertEqual(canonical('http://kjs.mof.gov.cn/a.htm#x'),'https://kjs.mof.gov.cn/a.htm')
        for x in ['https://evil.test','javascript:alert(1)','https://kjs.mof.gov.cn.evil.test/x','https://user@kjs.mof.gov.cn/']:
            with self.assertRaises(ValueError):canonical(x)
    def test_parse_and_noise(self):
        text='会计准则实施问答正文。'*10
        self.assertEqual(extract(BeautifulSoup('<nav>导航</nav><div class="TRS_Editor">'+text+'<script>bad()</script></div>','html.parser')),text)
        with self.assertRaises(ValueError):extract(BeautifulSoup('<body>访问被拒绝</body>','html.parser'))
    def test_versions_idempotent_and_failure_preserves(self):
        with tempfile.TemporaryDirectory() as td:
            root=Path(td);d={'url':'https://kjs.mof.gov.cn/a.htm','title':'解释','text':'第一条\n原文','attachments':[]}
            events,total=ingest(root,[d],'2026-01-01T00:00:00Z');self.assertEqual(total,1);self.assertEqual(events[0]['type'],'added')
            self.assertEqual(ingest(root,[d],'2026-01-02T00:00:00Z')[0],[])
            changed={**d,'text':'第一条\n新文'};e,_=ingest(root,[changed],'2026-01-03T00:00:00Z');self.assertEqual(e[0]['type'],'changed');self.assertEqual(e[0]['changes'][0]['before'],['原文'])
            before=(root/'data/library.json').read_text();ingest(root,[],'2026-01-04T00:00:00Z');self.assertEqual(before,(root/'data/library.json').read_text())
            self.assertEqual(len(list((root/'data/versions').rglob('*.json'))),2)
    def test_draft_never_current(self):self.assertEqual(classify('解释第22号（征求意见稿）','准则解释'),'征求意见稿')
    def test_redirect_allowlist(self):
        r=Mock(is_redirect=True,headers={'Location':'http://127.0.0.1/secret'})
        with patch('upd_status.requests.get',return_value=r):
            with self.assertRaises(ValueError):fetch('https://kjs.mof.gov.cn/a')
    def test_http_error(self):
        r=Mock(is_redirect=False);r.raise_for_status.side_effect=RuntimeError('404')
        with patch('upd_status.requests.get',return_value=r):
            with self.assertRaises(RuntimeError):fetch('https://kjs.mof.gov.cn/a')
    def test_discover_csrc_homepage_and_publisher(self):
        page='<a href="/csrc/c105942/c7572064/content.shtml">监管规则适用指引——会计类第5号</a><a href="/csrc/c100028/c1/content.shtml">其他新闻</a>'.encode()
        response=Mock(content=page,text=page.decode())
        config={'keywords':'不会匹配','feeds':[{'urls':['https://www.csrc.gov.cn/'],'prefix':'https://www.csrc.gov.cn/','depth':0,'kind':'监管参考','publisher':'证监会','article_pattern':r'/csrc/c[0-9]+/c[0-9]+/content[.]shtml','keywords':'会计类'}]}
        with patch('upd_status.fetch',return_value=(response,'https://www.csrc.gov.cn/')):
            found,errors,reports=discover(config,10)
        self.assertEqual(len(found),1);self.assertFalse(errors);self.assertEqual(next(iter(found.values()))['publisher'],'证监会')
    def test_discover_empty_homepage_is_failure(self):
        response=Mock(content=b'<html></html>',text='<html></html>')
        config={'keywords':'会计','feeds':[{'urls':['https://www.csrc.gov.cn/'],'prefix':'https://www.csrc.gov.cn/','depth':0,'kind':'监管参考','article_pattern':'content[.]shtml'}]}
        with patch('upd_status.fetch',return_value=(response,'https://www.csrc.gov.cn/')):
            found,errors,reports=discover(config,10)
        self.assertTrue(errors);self.assertFalse(reports[0]['ok'])
    def test_attachment_change_in_diff(self):
        d={'text':'正文','attachments':[{'text':'旧附件'}]};n=copy.deepcopy(d);n['attachments'][0]['text']='新附件'
        self.assertEqual(diff(d,n)[0]['after'],['新附件'])
if __name__=='__main__':unittest.main()
