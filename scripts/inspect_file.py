import re

with open('src/components/ArticleRenderer.tsx', encoding='utf-8') as f:
    content = f.read()

# Find the exact lines 927-938
lines = content.split('\n')
print(f"Total lines: {len(lines)}")
for i in range(925, 940):
    print(f"Line {i+1}: {repr(lines[i])}")
