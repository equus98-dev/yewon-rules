async function run() {
  const query = encodeURIComponent('교육혁신원 규정');
  const res = await fetch('https://yewon-rules.pages.dev/api/rules/search?query=' + query + '&options=title');
  const data = await res.json();
  if (data.titleMatches && data.titleMatches.length > 0) {
    const ruleId = data.titleMatches[0].id;
    const ruleRes = await fetch('https://yewon-rules.pages.dev/api/rules/' + ruleId);
    const ruleData = await ruleRes.json();
    
    // Check all revisions by fetching each version
    for (const rev of ruleData.revisions) {
      console.log('Fetching Revision:', rev.version, rev.versionName);
      const revRes = await fetch(`https://yewon-rules.pages.dev/api/rules/${ruleId}?version=${rev.version}`);
      const revData = await revRes.json();
      
      const art15 = revData.currentRevision.articles.find(a => a.articleNumber === 15);
      if (art15) {
        console.log('Found Article 15 in revision', rev.version);
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
      }
    }
  }
}
run();
