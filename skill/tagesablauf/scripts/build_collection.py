#!/usr/bin/env python3
"""Build an offline collection from the readable ClassJourney AI folder."""
import argparse
import base64
import json
import sys
import time
from pathlib import Path

def embedded(root, reference):
    target = (root / reference).resolve()
    if not target.is_relative_to(root.resolve()):
        raise ValueError('Image paths must remain inside this AI folder')
    mime = {'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif'}.get(target.suffix.lower())
    if not mime:
        raise ValueError(f'Unsupported image format: {target.name}')
    return 'data:' + mime + ';base64,' + base64.b64encode(target.read_bytes()).decode('ascii')

def build(root):
    root = Path(root).resolve()
    data = json.loads((root / 'data' / 'plans.json').read_text(encoding='utf-8'))
    for background in data['assets']['backgrounds'].values():
        if background.get('srcFile'):
            background['src'] = embedded(root, background.pop('srcFile'))
    for key in ('atlas', 'fageAtlas'):
        if data['assets'].get(key + 'File'):
            data['assets'][key] = embedded(root, data['assets'].pop(key + 'File'))
    for plan in data['plans']:
        for activity in plan['activities']:
            if activity.get('imageFile'):
                activity['image'] = embedded(root, activity.pop('imageFile'))
    data.pop('workspaceAssets', None)
    data['modifiedAt'] = int(time.time() * 1000)
    sys.path.insert(0, str(root / 'scripts'))
    from update_collection import validate, update
    validate(data)
    out = root / 'output'
    out.mkdir(exist_ok=True)
    collection = out / 'Sammlung.classjourney.json'
    collection.write_text(json.dumps(data, ensure_ascii=False, separators=(',', ':')), encoding='utf-8')
    app = root / 'ClassJourney.html'
    if app.exists():
        update(app, collection, out / 'ClassJourney-neu.html')
    print(f'Ready: {collection}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default=str(Path(__file__).resolve().parent.parent))
    build(parser.parse_args().root)
