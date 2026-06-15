import win32com.client as win32
import time
import os

try:
    hwp = win32.gencache.EnsureDispatch("HWPFrame.HwpObject")
    hwp.RegisterModule("FilePathCheckDLL", "raonkhwp")
    
    file_path = r"F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음\3-5-1 [제5호 서식] 이용신청서.hwp"
    pdf_path = r"F:\예원예술대학교_규정관리시스템\test_py.pdf"
    
    if os.path.exists(pdf_path):
        os.remove(pdf_path)
        
    hwp.Open(file_path, "HWP", "forceopen:true")
    
    hwp.HAction.GetDefault("Print", hwp.HParameterSet.HPrint.HSet)
    hwp.HParameterSet.HPrint.PrintMethod = 0 # 일반 인쇄
    hwp.HParameterSet.HPrint.Collate = 1
    hwp.HParameterSet.HPrint.UserOrder = 0
    hwp.HParameterSet.HPrint.PrintToFile = 1 # 파일로 인쇄
    hwp.HParameterSet.HPrint.FileName = pdf_path
    
    # Try using Hancom PDF printer
    hwp.HParameterSet.HPrint.PrinterName = "Hancom PDF"
    hwp.HAction.Execute("Print", hwp.HParameterSet.HPrint.HSet)
    
    time.sleep(2)
    
    hwp.Clear(1)
    hwp.Quit()
    print("Done")
except Exception as e:
    print(e)
