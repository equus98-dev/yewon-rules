async function run() {
  const query = encodeURIComponent('교육혁신원 규정');
  const res = await fetch('https://yewon-rules.pages.dev/api/rules/search?query=' + query + '&options=title');
  const data = await res.json();
  if (data.titleMatches && data.titleMatches.length > 0) {
    const ruleId = data.titleMatches[0].id;
    const ruleRes = await fetch('https://yewon-rules.pages.dev/api/rules/' + ruleId);
    const ruleData = await ruleRes.json();
    
    // Find article 15 or article named 부칙
    const art15 = ruleData.currentRevision.articles.find(a => a.articleNumber === 15 || (a.title && a.title.includes('부칙')));
    if (art15) {
      console.log('Found article:', art15.id, art15.title);
      const patchRes = await fetch('https://yewon-rules.pages.dev/api/admin/articles/' + art15.id, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleNumber: 8000,
          title: '부칙',
          chapter: '',
          part: '',
          section: '',
          subSection: ''
        })
      });
      console.log('Patch Status:', patchRes.status);
    } else {
      console.log('Article 15 not found. Addendums:', ruleData.currentRevision.articles.map(a => a.articleNumber + ' ' + a.title));
    }
  } else {
    console.log('Rule not found');
  }
}
run();
