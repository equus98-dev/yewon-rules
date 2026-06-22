import PyPDF2

try:
    with open(r"E:\예원예술대학교_규정관리시스템\docs\rules\규정전문 PDF\5-1-2 학생생활관 관생생활 수칙.pdf", "rb") as f:
        reader = PyPDF2.PdfReader(f)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        # Write to txt
        with open("512_from_pdf.txt", "w", encoding="utf-8") as out:
            out.write(text)
    print("Done")
except Exception as e:
    print(e)
