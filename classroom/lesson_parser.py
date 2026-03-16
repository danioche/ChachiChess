"""Lesson file parser for .chl lesson files

Parses metadata and interaction blocks as described in `classroom/format.md`.

Usage:
    from classroom.lesson_parser import Lesson
    lesson = Lesson.from_file('classroom/daniTeacher/lessons/begginer.chl')
    print(lesson.to_dict())

This parser extracts:
 - metadata entries that begin with `#+Key: Value`
 - blocks delimited with `#+Begin_<type>` / `#+End_<type>` (teacher, tips, move_list, etc.)
 - move_list cases (simple parsing of PGN: and Teacher: entries)
"""
from __future__ import annotations

import re
from typing import List, Dict, Optional


class Lesson:
    def __init__(self, metadata: Optional[Dict[str, str]] = None):
        self.metadata: Dict[str, str] = metadata or {}
        # blocks: map block_type -> raw string (preserve original formatting)
        self.blocks: Dict[str, str] = {}
        # convenience parsed fields
        self.teacher_text: str = ''
        self.tips: List[str] = []
        self.move_cases: List[Dict] = []
        self.nok_chats: List[str] = []

    @classmethod
    def from_file(cls, path: str) -> 'Lesson':
        with open(path, 'r', encoding='utf-8') as f:
            lines = f.read().splitlines()

        lesson = cls()

        # metadata lines are like: #+Title: Begginer and Intermediate
        meta_re = re.compile(r'^#\+(?P<key>[^:]+):\s*(?P<value>.*)$')
        begin_re = re.compile(r'^#\+Begin_(?P<block>\w+)', re.IGNORECASE)
        end_re = re.compile(r'^#\+End_(?P<block>\w+)', re.IGNORECASE)

        current_block = None
        block_lines: List[str] = []

        for raw in lines:
            line = raw.rstrip('\n')
            # metadata
            m = meta_re.match(line)
            if m and current_block is None:
                key = m.group('key').strip()
                value = m.group('value').strip().strip('"')
                lesson.metadata[key] = value
                continue

            # begin block
            m = begin_re.match(line)
            if m and current_block is None:
                current_block = m.group('block').lower()
                block_lines = []
                continue

            # end block
            m = end_re.match(line)
            if m and current_block is not None:
                end_block = m.group('block').lower()
                if end_block == current_block:
                    # store block
                    lesson.blocks[current_block] = '\n'.join(block_lines).strip()
                    current_block = None
                    block_lines = []
                    continue
                else:
                    # mismatched end - ignore and continue
                    current_block = None
                    block_lines = []
                    continue

            # inside block
            if current_block is not None:
                block_lines.append(line)

        # Post-process some common blocks
        lesson.teacher_text = lesson.blocks.get('teacher', '').strip()

        # tips: lines starting with '-' are list items
        raw_tips = lesson.blocks.get('tips', '')
        if raw_tips:
            tips = [l.strip() for l in raw_tips.splitlines() if l.strip()]
            # remove leading list markers
            lesson.tips = [re.sub(r'^[-\*\+\s]*', '', t) for t in tips]

        # move_list parsing: split into case blocks separated by blank lines
        raw_move_list = lesson.blocks.get('move_list', '')
        if raw_move_list:
            # split by blank line(s)
            parts = re.split(r'\n\s*\n', raw_move_list.strip())
            case_id = 0
            for p in parts:
                p = p.strip()
                if not p:
                    continue
                # try to extract PGN: and Teacher:
                pgn = None
                teacher_answer = None
                # find lines like 'PGN: 1. Rc8#' and 'Teacher: ...'
                for line in p.splitlines():
                    ln = line.strip()
                    if ln.lower().startswith('pgn:'):
                        pgn = ln.partition(':')[2].strip()
                    elif ln.lower().startswith('teacher:'):
                        teacher_answer = ln.partition(':')[2].strip()
                case_id += 1
                lesson.move_cases.append({
                    'id': case_id,
                    # 'raw': p,
                    'pgn': pgn,
                    'teacher': teacher_answer
                })


        raw_nok_chats = lesson.blocks.get('nok_chats', '')
        if raw_nok_chats:
            nok_chats = [l.strip() for l in raw_nok_chats.splitlines() if l.strip()]
            # remove leading list markers
            lesson.nok_chats = [re.sub(r'^[-\*\+\s]*', '', t) for t in nok_chats]


        return lesson

    def to_dict(self) -> Dict:
        return {
            'metadata': dict(self.metadata),
            'teacher': self.teacher_text,
            'tips': list(self.tips),
            'move_cases': list(self.move_cases),
            'nok_chats' : list(self.nok_chats)
            # , 'blocks': dict(self.blocks)
        }


if __name__ == '__main__':
    # small test: parse the begginer file if present
    import os
    test_path = os.path.join(os.path.dirname(__file__), 'daniTeacher', 'lessons', 'begginer.chl')
    if os.path.exists(test_path):
        lesson = Lesson.from_file(test_path)
        import json
        print(json.dumps(lesson.to_dict(), indent=2, ensure_ascii=False))
    else:
        print('Test file not found:', test_path)
