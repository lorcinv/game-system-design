"""Check effective Word styles and semantic references, not pagination."""
import argparse
import re
import zipfile
from pathlib import Path
from common import SKILL
from lxml import etree as ET

NS = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
W = '{' + NS['w'] + '}'


def check(path):
    errors = []
    with zipfile.ZipFile(path) as z:
        styles = ET.fromstring(z.read('word/styles.xml'))
        style_map = {s.get(W + 'styleId'): s for s in styles.findall('w:style', NS)}
        defaults = styles.find('w:docDefaults/w:rPrDefault/w:rPr', NS)
        default_p = next((s.get(W + 'styleId') for s in style_map.values()
                          if s.get(W + 'type') == 'paragraph' and s.get(W + 'default') == '1'), None)

        def chain(key):
            seen = set()
            while key and key not in seen and key in style_map:
                seen.add(key)
                s = style_map[key]
                yield s
                parent = s.find('w:basedOn', NS)
                key = parent.get(W + 'val') if parent is not None else None

        def prop(nodes, tag):
            for node in nodes:
                if node is not None:
                    found = node.find('w:' + tag, NS)
                    if found is not None:
                        return found
            return None

        roots = []
        for name in z.namelist():
            if name == 'word/document.xml' or re.fullmatch(r'word/(header|footer)\d+.xml', name):
                roots.append((name, ET.fromstring(z.read(name))))
        document = roots[0][1] if roots[0][0] == 'word/document.xml' else next(r for n, r in roots if n == 'word/document.xml')
        bookmarks = document.findall('.//w:bookmarkStart', NS)
        bookmark_names = [b.get(W + 'name') for b in bookmarks]
        if len(bookmark_names) != len(set(bookmark_names)):
            errors.append('Duplicate bookmark names')
        start_ids = {b.get(W + 'id') for b in bookmarks}
        end_ids = {b.get(W + 'id') for b in document.findall('.//w:bookmarkEnd', NS)}
        if start_ids != end_ids:
            errors.append('Unpaired bookmarks')
        for h in document.findall('.//w:hyperlink', NS):
            anchor = h.get(W + 'anchor')
            if anchor and anchor not in bookmark_names:
                errors.append(f'Broken hyperlink: {anchor}')
        for inst in document.findall('.//w:instrText', NS):
            m = re.search(r'\b(?:REF|PAGEREF)\s+"?([\w]+)', inst.text or '')
            if m and m[1] not in bookmark_names:
                errors.append(f'Broken field reference: {m[1]}')
        for part, root in roots:
            for p in root.findall('.//w:p', NS):
                visible = ''.join(p.xpath('.//w:t/text()', namespaces=NS))
                if not visible.strip():
                    continue
                ppr = p.find('w:pPr', NS)
                ps = p.find('w:pPr/w:pStyle', NS)
                pstyles = list(chain(ps.get(W + 'val') if ps is not None else default_p))
                pprops = [ppr] + [s.find('w:pPr', NS) for s in pstyles]
                outline = prop(pprops, 'outlineLvl')
                if outline is not None and int(outline.get(W + 'val')) < 9:
                    num = prop(pprops, 'numPr')
                    num_id = num.find('w:numId', NS) if num is not None else None
                    if num is not None and (num_id is None or num_id.get(W + 'val') != '0'):
                        errors.append(f'Heading has list numbering: {visible[:60]}')
                    if re.match(r'^\s*[•●▪◦■]', visible):
                        errors.append(f'Heading has bullet character: {visible[:60]}')
                    for flag in ['keepNext', 'keepLines', 'pageBreakBefore']:
                        control = prop(pprops, flag)
                        if control is not None and control.get(W + 'val', '1') not in ['0', 'false', 'off']:
                            errors.append(f'Heading has paragraph-control marker ({flag}): {visible[:60]}')
                for phrase in ['仅供参考', '以实际开发为准', '不代表最终方案', '作为AI', '作为 AI', '以下是我的思考']:
                    if phrase in visible:
                        errors.append(f'Unwanted document commentary: {phrase}')
                if 'Error! Reference source not found' in visible or '错误!未找到引用源' in visible:
                    errors.append('Visible field error')
                for run in p.findall('.//w:r', NS):
                    txt = ''.join(run.xpath('./w:t/text()', namespaces=NS))
                    if not txt.strip():
                        continue
                    rs = run.find('w:rPr/w:rStyle', NS)
                    rprops = [run.find('w:rPr', NS)]
                    if rs is not None:
                        rprops += [s.find('w:rPr', NS) for s in chain(rs.get(W + 'val'))]
                    rprops += [s.find('w:rPr', NS) for s in pstyles] + [defaults]
                    sz = prop(rprops, 'sz')
                    if sz is None or int(sz.get(W + 'val')) < 24:
                        errors.append(f'Small or unresolved font size: {txt[:35]}')
                    if re.search('[\u3400-\u9fff]', txt):
                        font = next((r.find('w:rFonts', NS).get(W + 'eastAsia') for r in rprops
                                     if r is not None and r.find('w:rFonts', NS) is not None
                                     and r.find('w:rFonts', NS).get(W + 'eastAsia')), None)
                        if font != '微软雅黑':
                            errors.append(f'Unexpected Chinese font {font}: {txt[:35]}')
        for table in document.findall('.//w:tbl', NS):
            first = table.find('w:tr', NS)
            if first is not None and first.find('w:trPr/w:tblHeader', NS) is None:
                errors.append('Table has no repeating header')
    return list(dict.fromkeys(errors))


def main():
    import json
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('document', type=Path)
    a = p.parse_args()
    errors = check(a.document)
    print(json.dumps({'passed': not errors, 'errors': errors}, ensure_ascii=False, indent=2))
    raise SystemExit(1 if errors else 0)


if __name__ == '__main__':
    main()
