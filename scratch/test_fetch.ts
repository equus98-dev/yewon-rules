import "dotenv/config";

async function getNodes(parentId: string) {
  console.log(`노드 요청 중: ${parentId}`);
  try {
    const response = await fetch("https://yewon.ac.kr/main/skin/yewon/rules/getPageDataAjax.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      },
      body: `id=${encodeURIComponent(parentId)}&menu_id=366`
    });
    
    if (!response.ok) {
      throw new Error(`HTTP 에러! 상태코드: ${response.status}`);
    }
    
    const text = await response.text();
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("JSON 파싱 에러! 응답 텍스트:", text);
      return [];
    }
  } catch (error) {
    console.error(`요청 실패 (${parentId}):`, error);
    return [];
  }
}

async function start() {
  console.log("예원예술대학교 규정 목록 긁어오기 테스트 시작...");
  const rootNodes = await getNodes("#");
  console.log("루트 노드 결과:", JSON.stringify(rootNodes, null, 2));
}

start();
