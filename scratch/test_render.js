require('@babel/register')({ presets: ['@babel/preset-env', ['@babel/preset-react', {runtime: 'automatic'}], '@babel/preset-typescript'] });
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const { default: ArticleRenderer } = require('./src/components/ArticleRenderer.tsx');

const props = {
  articleId: "test",
  articleNumber: 8194,
  title: "부칙",
  contentJson: '"[object Object]"',
  contentText: "부칙 <개정 2000. 3. 1. 설립학칙>\n1. 본 학칙에서 규정하지 아니한 사항은 총장이 따로 정한다.",
  hideHistory: false
};

const html = ReactDOMServer.renderToString(React.createElement(ArticleRenderer, props));
const fs = require('fs');
fs.writeFileSync('scratch/test_render.html', html);
console.log("Rendered to scratch/test_render.html");
