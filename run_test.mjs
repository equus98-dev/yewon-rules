import * as h from './handler_test.mjs';

const page = h.require_page10();
console.log(page);
console.log('Handler type:', typeof page.handler);
console.log('Is handler function?', typeof page.handler === 'function');
if (typeof page.handler === 'function') {
  console.log(page.handler.toString().substring(0, 100));
}
