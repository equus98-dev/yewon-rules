import os
import win32com.client
import time

hwp = win32com.client.Dispatch("HWPFrame.HwpObject")
hwp.RegisterModule("FilePathCheckDLL", "FileAuto")
hwp.XHwpWindows.Item(0).Visible = False

base_dir = r"F:\예원예술대학교_규정관리시스템\docs\rules\별지 및 별표 모음"
hwp_file = os.path.join(base_dir, "3-5-1 [별지서식] 채용요청서.hwp")
pdf_file = r"F:\예원예술대학교_규정관리시스템\test_web3.pdf"

print("Opening", hwp_file)
hwp.Open(hwp_file, "HWP", "forceopen:true")
time.sleep(1)

print("Saving to", pdf_file)
hwp.SaveAs(pdf_file, "PDF")
time.sleep(1)

hwp.Clear(1)
hwp.Quit()
print("Done")
