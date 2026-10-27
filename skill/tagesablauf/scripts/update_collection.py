#!/usr/bin/env python3
"""Update only the embedded collection in a standalone Classroomscreen HTML."""
import argparse
import json
import re
from pathlib import Path

def validate(data):
    if data.get('format') != 'classroomscreen' or data.get('version') != 1:
        raise ValueError('Unsupported collection format')
    ids = set()
    for plan in data['plans']:
        if not plan.get('id') or plan['id'] in ids:
            raise ValueError('Missing or duplicate plan id')
        ids.add(plan['id'])
        slots = []
        for slot in plan['slots']:
            edges = []
            for edge in ('start', 'end'):
                if not re.fullmatch(r'\d{2}:\d{2}', slot[edge]):
                    raise ValueError('Invalid time')
                h, m = map(int, slot[edge].split(':'))
                if h > 23 or m > 59:
                    raise ValueError('Invalid time')
                edges.append(h * 60 + m)
            if edges[1] <= edges[0]:
                raise ValueError('Slot end must follow its start')
            slots.append(edges)
        slots.sort()
        if not slots or any(b[0] < a[1] for a, b in zip(slots, slots[1:])):
            raise ValueError('Missing or overlapping slots')
        activity_ids = set()
        for activity in plan['activities']:
            if not activity.get('id') or activity['id'] in activity_ids:
                raise ValueError('Missing or duplicate activity id')
            activity_ids.add(activity['id'])
            if type(activity.get('duration')) is not int or not 1 <= activity['duration'] <= 1440:
                raise ValueError('Activity duration must be a positive integer')
            if activity.get('image') and not activity['image'].startswith(('data:image/png;base64,','data:image/jpeg;base64,','data:image/webp;base64,','data:image/gif;base64,')):
                raise ValueError('Images must be embedded')
        if plan.get('backgroundId') not in data['assets']['backgrounds']:
            raise ValueError('Missing plan background')
    for item in data['assets']['backgrounds'].values():
        if not item['src'].startswith(('data:image/png;base64,','data:image/jpeg;base64,','data:image/webp;base64,','data:image/gif;base64,')):
            raise ValueError('Backgrounds must be embedded')

def update(app, collection, out):
    source = Path(app).read_text(encoding='utf-8')
    data = json.loads(Path(collection).read_text(encoding='utf-8'))
    validate(data)
    pattern = r'(<script\b[^>]*\bid=["\']embedded-data["\'][^>]*>)(.*?)(</script\s*>)'
    matches = list(re.finditer(pattern, source, re.S | re.I))
    if len(matches) != 1:
        raise ValueError('Exactly one embedded-data script is required')
    match = matches[0]
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':')).replace('<', r'\u003c')
    target = source[:match.start(2)] + payload + source[match.end(2):]
    Path(out).write_text(target, encoding='utf-8')
    print(f'Updated {len(data["plans"])} plans: {out}')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--app', required=True)
    parser.add_argument('--collection', required=True)
    parser.add_argument('--out', required=True)
    args = parser.parse_args()
    update(args.app, args.collection, args.out)
