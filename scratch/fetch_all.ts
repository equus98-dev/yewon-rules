import * as fs from "fs";
import * as path from "path";

async function fetchAll() {
  console.log("예원예술대학교 전체 규정 JSON 데이터 다운로드 중...");
  try {
    const response = await fetch("https://yewon.ac.kr/main/skin/yewon/rules/getPageDataAjax.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: "id=%23&menu_id=366"
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 에러! 상태코드: ${response.status}`);
    }
    
    const data = await response.json();
    const scratchDir = path.join(__dirname);
    if (!fs.existsSync(scratchDir)) {
      fs.mkdirSync(scratchDir, { recursive: true });
    }
    
    const filePath = path.join(scratchDir, "all_rules.json");
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    console.log(`다운로드 완료! 저장 위치: ${filePath} (총 ${data.length}개 노드)`);
  } catch (error) {
    console.error("전체 데이터 다운로드 실패:", error);
  }
}

fetchAll();
