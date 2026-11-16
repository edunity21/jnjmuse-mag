"""사례집 렌더링: 쪽별 PNG + 넘침·한 글자 줄 점검, PDF 출력.
사용: python3 render.py shots | pdf
"""
import sys, asyncio, json, os
from playwright.async_api import async_playwright

HERE = os.path.dirname(os.path.abspath(__file__))
URL = 'file://' + os.path.join(HERE, 'index.html')

CHECK_JS = r"""
() => {
  const mm = px => (px/3.7795).toFixed(1);
  const out = {overflow:[], orphans:[]};
  document.querySelectorAll('.page').forEach(pg => {
    const id = pg.id;
    const inn = pg.querySelector('.in'); if(!inn) return;
    const ib = inn.getBoundingClientRect();
    inn.querySelectorAll('*').forEach(el => {
      const r = el.getBoundingClientRect();
      if (r.height===0) return;
      if (r.bottom > ib.bottom + 1.5 && getComputedStyle(el).position!=='absolute')
        out.overflow.push(`${id} <${el.tagName.toLowerCase()} class="${el.className}"> +${mm(r.bottom-ib.bottom)}mm`);
      if (r.right > ib.right + 1.5)
        out.overflow.push(`${id} <${el.tagName.toLowerCase()} class="${el.className}"> right +${mm(r.right-ib.right)}mm`);
    });
    // 한 글자 줄
    pg.querySelectorAll('p,li,dd,figcaption,.cap,.story,td,h1,h2,h3,h4,.dek').forEach(el => {
      const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      const chars = []; let n;
      while (n = walker.nextNode()) {
        for (let i=0;i<n.nodeValue.length;i++) {
          const ch = n.nodeValue[i]; if (/\s/.test(ch)) continue;
          const rg = document.createRange(); rg.setStart(n,i); rg.setEnd(n,i+1);
          const rs = rg.getClientRects(); if (!rs.length) continue;
          chars.push({ch, top: Math.round(rs[0].top)});
        }
      }
      if (chars.length < 6) return;
      const lines = [];
      chars.forEach(c => { const L = lines.find(l => Math.abs(l.top - c.top) < 4); if (L) L.cs.push(c.ch); else lines.push({top:c.top, cs:[c.ch]}); });
      if (lines.length < 2) return;
      lines.sort((a,b)=>a.top-b.top);
      const last = lines[lines.length-1].cs.join('');
      const core = last.replace(/[.,·)」』\]>!?]/g,'');
      if (core.length <= 1) out.orphans.push(`${id} ${el.tagName.toLowerCase()}.${el.className}: "…${lines[lines.length-2].cs.slice(-6).join('')} / ${last}"`);
    });
  });
  return out;
}
"""

async def shots(p):
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    pg = await b.new_page(viewport={'width': 794, 'height': 1123}, device_scale_factor=1.5)
    await pg.goto(URL)
    await pg.evaluate("document.body.classList.add('pdf')")
    await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(2500)
    res = await pg.evaluate(CHECK_JS)
    print('OVERFLOW', len(res['overflow'])); [print('  ', x) for x in res['overflow'][:60]]
    print('ORPHANS', len(res['orphans'])); [print('  ', x) for x in res['orphans'][:60]]
    os.makedirs(os.path.join(HERE, 'shots'), exist_ok=True)
    for i in range(1, 21):
        el = await pg.query_selector(f'#p{i:02d}')
        await el.screenshot(path=os.path.join(HERE, 'shots', f'p{i:02d}.png'))
    await b.close()

async def pdf(p):
    b = await p.chromium.launch(executable_path='/usr/bin/google-chrome', args=['--no-sandbox'])
    for mode, w, h, name in [('print', '216mm', '303mm', 'out_print.pdf'), ('screen', '210mm', '297mm', 'out_screen.pdf')]:
        pg = await b.new_page()
        await pg.goto(URL)
        js = "document.body.classList.add('pdf');" + ("document.body.classList.add('print');" if mode == 'print' else '')
        js += f"var s=document.createElement('style');s.textContent='@page{{size:{w} {h};margin:0}}';document.head.appendChild(s);"
        await pg.evaluate(js)
        await pg.evaluate("document.fonts.ready"); await pg.wait_for_timeout(2500)
        await pg.pdf(path=os.path.join(HERE, name), width=w, height=h, print_background=True, prefer_css_page_size=True)
        await pg.close()
        print('wrote', name)
    await b.close()

async def main():
    async with async_playwright() as p:
        await (shots(p) if sys.argv[1] == 'shots' else pdf(p))

asyncio.run(main())
