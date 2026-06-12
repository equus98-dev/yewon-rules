async function run() {
  const query = encodeURIComponent('교육혁신원 규정');
  const res = await fetch('https://yewon-rules.pages.dev/api/rules/search?query=' + query + '&options=title');
  const data = await res.json();
  if (data.titleMatches && data.titleMatches.length > 0) {
    const ruleId = data.titleMatches[0].id;
    // Fetch all revisions via admin API or just raw rule endpoint
    const ruleRes = await fetch('https://yewon-rules.pages.dev/api/rules/' + ruleId);
    const ruleData = await ruleRes.json();
    
    // Check all revisions
    for (const rev of ruleData.revisions) {
      console.log('Revision:', rev.version, rev.versionName);
      if (rev.articles) {
        const art15 = rev.articles.find(a => a.articleNumber === 15);
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
    
    // Actually, `api/rules/[id]` only returns currentRevision's articles usually.
    // If we need all articles of all revisions, we might need `/api/admin/rules/[id]`.
    const adminRes = await fetch('https://yewon-rules.pages.dev/api/admin/rules/' + ruleId);
    if (adminRes.ok) {
       const adminData = await adminRes.json();
       for (const rev of adminData.revisions) {
          const art15 = rev.articles.find(a => a.articleNumber === 15);
          if (art15) {
             console.log('Found Article 15 in admin revision', rev.version);
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
    } else {
       console.log('Admin fetch failed', adminRes.status);
    }
  }
}
run();
