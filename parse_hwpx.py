import zipfile
import xml.etree.ElementTree as ET
import sys

def extract_text_from_hwpx(hwpx_path, output_path):
    try:
        lines = []
        with zipfile.ZipFile(hwpx_path, 'r') as z:
            for file_name in z.namelist():
                if file_name.startswith('Contents/section'):
                    xml_content = z.read(file_name)
                    root = ET.fromstring(xml_content)
                    for elem in root.iter():
                        if elem.tag.endswith('p'): # 문단 단위
                            p_text = ""
                            for child in elem.iter():
                                if child.tag.endswith('t') and child.text:
                                    p_text += child.text
                            if p_text.strip():
                                lines.append(p_text)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write('\n'.join(lines))
        print(f"Successfully extracted text to {output_path}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == '__main__':
    extract_text_from_hwpx(sys.argv[1], sys.argv[2])
