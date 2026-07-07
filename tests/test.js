const fs = require('fs');
const assert = require('assert');

console.log('TAP version 13');
console.log('# FIFA 2026 Smart Stadium Tests\n');

// Load App module in Node environment
const appCode = fs.readFileSync('./app.js', 'utf8');
const script = `
  const document = { 
    addEventListener: () => {}, 
    getElementById: () => ({ addEventListener: () => {}, classList: {add:()=>{}, remove:()=>{}, replace:()=>{}}, querySelector: () => ({addEventListener:()=>{}}) }),
    createElement: () => ({}),
    querySelector: () => ({ addEventListener: () => {} })
  };
  const localStorage = { getItem: () => null, setItem: () => {} };
  ${appCode}; 
  module.exports = App;
`;
const App = eval(script);

let passed = 0;
let failed = 0;
let total = 0;

function test(name, fn) {
  total++;
  try {
    fn();
    passed++;
    console.log(`ok ${total} - ${name}`);
  } catch (e) {
    failed++;
    console.log(`not ok ${total} - ${name}`);
    console.log(`  ---`);
    console.log(`  message: ${e.message}`);
    console.log(`  ...`);
  }
}

// 1. Core Security Tests
test('Security: sanitizeInput strips HTML injection', () => {
  const dirty = '<script>alert(1)</script>';
  const clean = App.sanitizeInput(dirty);
  assert.strictEqual(clean.includes('<'), false);
});

test('Security: escapeHTML neutralizes characters', () => {
  const dirty = 'A & B < C > "D"';
  const clean = App.escapeHTML(dirty);
  assert.strictEqual(clean, 'A &amp; B &lt; C &gt; &quot;D&quot;');
});

// Summary
console.log(`\n1..${total}`);
console.log(`# tests ${total}`);
console.log(`# pass  ${passed}`);
console.log(`# fail  ${failed}`);

if (failed > 0) process.exit(1);
console.log('# All tests passed ✓');
