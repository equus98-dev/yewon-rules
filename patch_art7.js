async function patchArt7() {
  const art7Id = '5c99e2b4-937a-448a-a786-988caadfda31';
  const patchUrl = `https://yewon-rules.pages.dev/api/admin/articles/${art7Id}`;
  
  const text = "제7조(기타 사항) 이 세칙에서 정하지 아니한 사항은 운영규정 및 관련 법령, 사업 지침을 따른다.";
  const res = await fetch(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contentText: text,
      contentJson: [{ type: "article", num: "", text: text }]
    })
  });
  console.log("Patched Art 7:", res.status);
}
patchArt7();
