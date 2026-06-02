import React from 'react';
import { renderToString } from 'react-dom/server';
import ArticleRenderer from './src/components/ArticleRenderer';

async function run() {
  const res = await fetch("https://yewon-rules.pages.dev/api/rules/8443cb20-c06b-496a-8b55-78a1305d5212");
  const data = await res.json();
  const currentRevision = data.currentRevision;
  
  if (currentRevision && currentRevision.articles) {
    for (const article of currentRevision.articles) {
      try {
        const html = renderToString(
          React.createElement(ArticleRenderer, {
            id: article.id,
            chapter: article.chapter,
            section: article.section,
            articleNumber: article.articleNumber,
            title: article.title,
            contentJson: article.contentJson,
            contentHtml: article.contentHtml
          })
        );
        console.log("Rendered successfully:", html.substring(0, 100));
      } catch (e) {
        console.error("Crash during render:", e);
      }
    }
  }
}
run();
