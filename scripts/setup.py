"""Install pinned drawing/document dependencies and prepare locally licensed fonts."""
import argparse
import os
import shutil
import subprocess
import sys
from importlib.metadata import distributions
from pathlib import Path
from common import RUNTIME, SKILL, prepare_fonts


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--node', default=shutil.which('node'))
    p.add_argument('--pnpm', help='pnpm executable or pnpm.cjs/pnpm.mjs; defaults to PATH')
    p.add_argument('--font', default=str(Path(os.environ.get('WINDIR', 'C:/Windows')) / 'Fonts/msyh.ttc'))
    p.add_argument('--bold-font', default=None)
    p.add_argument('--fonts-only', action='store_true')
    a = p.parse_args()
    RUNTIME.mkdir(parents=True, exist_ok=True)
    if not a.fonts_only:
        if not a.node:
            p.error('Provide --node from the available workspace runtime')
        node = Path(shutil.which(a.node) or a.node).resolve()
        pnpm_value = a.pnpm or shutil.which('pnpm')
        pnpm = Path(shutil.which(pnpm_value) or pnpm_value) if pnpm_value else node.parent.parent / 'node_modules/pnpm/bin/pnpm.mjs'
        if not pnpm.is_file():
            p.error('Install pnpm, or provide --pnpm pointing to its executable or JS entrypoint')
        for name in ['package.json', 'pnpm-lock.yaml']:
            shutil.copy2(SKILL / 'scripts' / name, RUNTIME / name)
        command = [str(node), str(pnpm)] if pnpm.suffix in ('.js', '.cjs', '.mjs') else [str(pnpm)]
        process_env = {**os.environ, 'PATH': str(node.parent) + os.pathsep + os.environ.get('PATH', '')}
        subprocess.run(command + ['--dir', str(RUNTIME), 'install', '--frozen-lockfile', '--ignore-scripts'], check=True, env=process_env)
        requirements = SKILL / 'scripts/requirements.txt'
        pins = dict(line.strip().split('==', 1) for line in requirements.read_text(encoding='utf-8').splitlines()
                    if line.strip() and not line.lstrip().startswith('#'))
        installed={d.metadata['Name'].lower().replace('_','-'):d.version for d in distributions(path=[str(RUNTIME/'python')])}
        if any(installed.get(k)!=v for k,v in pins.items()):
            subprocess.run([sys.executable, '-m', 'pip', 'install', '--upgrade', '--disable-pip-version-check', '--no-warn-script-location',
                            '--target', str(RUNTIME / 'python'), *[f'{k}=={v}' for k,v in pins.items()]], check=True)
    default_bold = Path(a.font).with_name('msyhbd.ttc')
    bold = a.bold_font or (str(default_bold) if default_bold.is_file() else a.font)
    prepare_fonts(a.font, bold)
    print(f'Ready: {RUNTIME}')


if __name__ == '__main__':
    main()
