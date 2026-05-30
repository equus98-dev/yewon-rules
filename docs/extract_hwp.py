import olefile

def extract_hwp_prvtext(filepath):
    try:
        f = olefile.OleFileIO(filepath)
        if f.exists('PrvText'):
            stream = f.openstream('PrvText')
            data = stream.read()
            # PrvText는 UTF-16 LE 인코딩으로 본문 텍스트가 플레인하게 담겨 있습니다.
            text = data.decode('utf-16-le', errors='ignore')
            return text
        else:
            print("PrvText stream not found!")
            return ""
    except Exception as e:
        print(f"Error: {e}")
        return ""

if __name__ == '__main__':
    hwp_path = r"f:\예원예술대학교_규정관리시스템\docs\2-0-4 대학원 학칙.hwp"
    out_path = r"f:\예원예술대학교_규정관리시스템\docs\대학원학칙_텍스트.txt"
    
    text = extract_hwp_prvtext(hwp_path)
    
    # 특수 HWP 태그 일부 클렌징 및 유효 텍스트만 추출
    clean_lines = []
    for line in text.split('\n'):
        line = line.strip()
        # HWP 특수 태그 필터링 (예: <표>, <그림> 등)
        if not line.startswith('<') and not line.endswith('>') and line:
            # 널 바이트 세부 정화
            line = line.replace('\x00', '')
            if line.strip():
                clean_lines.append(line.strip())
            
    with open(out_path, "w", encoding="utf-8") as out:
        out.write('\n'.join(clean_lines))
        
    print(f"PrvText 추출 완료! 총 {len(clean_lines)}개의 가독성 높은 텍스트 라인이 {out_path} 에 저장되었습니다.")
