import olefile
import os
import glob
import sys

sys.stdout.reconfigure(encoding='utf-8')

hwp_files = glob.glob(r'E:\예원예술대학교_규정관리시스템\docs\rules\*.hwp')
for f in hwp_files:
    if '정관' in os.path.basename(f):
        print(f"Checking {f}")
        try:
            doc = olefile.OleFileIO(f)
            if doc.exists('PrvText'):
                text = doc.openstream('PrvText').read().decode('utf-16-le', errors='ignore')
                lines = [line.strip().replace('\x00', '') for line in text.split('\n') if line.strip().replace('\x00', '')]
                for i, line in enumerate(lines):
                    if '제12조' in line:
                        print(f"[{i}] {line}")
                        if i+1 < len(lines): print(f"  +1: {lines[i+1]}")
                        if i+2 < len(lines): print(f"  +2: {lines[i+2]}")
        except Exception as e:
            print(f"Error reading {f}: {e}")
