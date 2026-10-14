"""Shared local paths; dependencies live outside the installed skill."""
import os
import sys
from pathlib import Path

SKILL = Path(__file__).resolve().parent.parent
RUNTIME = Path(os.environ.get('GAME_SYSTEM_DESIGN_RUNTIME',
    Path(os.environ.get('CODEX_HOME', Path.home() / '.codex')) / 'skill-runtimes' / 'game-system-design'))
sys.path.insert(0, str(RUNTIME / 'python'))


def prepare_fonts(regular, bold=None):
    import hashlib
    import json
    from fontTools.ttLib import TTFont
    destination = RUNTIME / 'fonts'
    destination.mkdir(parents=True, exist_ok=True)
    entries = []
    for source, weight in [(Path(regular), 400), (Path(bold or regular), 700)]:
        if not source.is_file():
            raise FileNotFoundError(f'Font not found: {source}')
        digest = hashlib.sha256(source.read_bytes()).hexdigest()
        output = destination / f'{digest[:16]}-{weight}.ttf'
        font = TTFont(source, fontNumber=0)
        family = font['name'].getDebugName(1)
        if not output.exists():
            font.save(output)
        cmap = font.getBestCmap()
        entries.append({'path': str(output), 'weight': weight, 'family': family,
                        'source': str(source), 'sha256': digest})
        if weight == 400:
            (destination / 'glyphs.json').write_text(json.dumps(sorted(cmap)), encoding='utf-8')
        font.close()
    (destination / 'fonts.json').write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding='utf-8')
    return entries
