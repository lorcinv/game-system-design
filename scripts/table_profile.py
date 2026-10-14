"""Read a built-in or project table-tool profile without executing commands."""
import argparse
import json
from pathlib import Path

SKILL=Path(__file__).resolve().parent.parent
PROFILES=SKILL/'assets/table-profiles'

def load_profile(value='luban'):
    builtin=PROFILES/(value+'.json')
    path=builtin if builtin.is_file() else Path(value).expanduser().resolve()
    data=json.loads(path.read_text(encoding='utf-8-sig'))
    required={'id','rules','mapping','capabilities','validation','generation'}
    if not required.issubset(data):
        raise ValueError('Profile missing: '+', '.join(sorted(required-set(data))))
    if not isinstance(data['id'],str) or not data['id'].strip():
        raise ValueError('Profile id must be a nonempty string')
    if not isinstance(data['mapping'],dict) or not isinstance(data['capabilities'],dict):
        raise ValueError('Profile mapping and capabilities must be objects')
    for key in ('chinese','english','type','primary_key','nullable','groups'):
        if not isinstance(data['mapping'].get(key),str) or not data['mapping'][key].strip():
            raise ValueError('Profile mapping missing: '+key)
    for key in ('validation','generation'):
        if not isinstance(data[key],str) or not data[key].strip():
            raise ValueError('Profile entrypoint missing: '+key)
    if not isinstance(data['rules'],list) or not data['rules']:
        raise ValueError('Profile needs rule references')
    root=SKILL if path.parent.resolve()==PROFILES.resolve() else path.parent
    resolved=[]
    for rule in data['rules']:
        if not isinstance(rule,str):raise ValueError('Rule must be a path or URL')
        if rule.startswith(('https://','http://')):resolved.append(rule)
        else:
            target=(root/rule).resolve()
            if not target.is_file():raise FileNotFoundError(target)
            resolved.append(str(target))
    return {**data,'resolved_rules':resolved}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('profile',nargs='?',default='luban')
    p.add_argument('--list',action='store_true')
    args=p.parse_args()
    data=[p.stem for p in sorted(PROFILES.glob('*.json'))] if args.list else load_profile(args.profile)
    print(json.dumps(data,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
