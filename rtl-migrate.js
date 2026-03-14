const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  const replacements = [
    { from: /\bml-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'ms-$1' },
    { from: /\bmr-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'me-$1' },
    { from: /\bpl-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'ps-$1' },
    { from: /\bpr-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'pe-$1' },
    { from: /\bborder-l-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'border-s-$1' },
    { from: /\bborder-r-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'border-e-$1' },
    { from: /\bborder-l\b/g, to: 'border-s' },
    { from: /\bborder-r\b/g, to: 'border-e' },
    { from: /\btext-left\b/g, to: 'text-start' },
    { from: /\btext-right\b/g, to: 'text-end' },
    { from: /\bleft-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'start-$1' },
    { from: /\bright-([a-zA-Z0-9.\-\[\]]+)\b/g, to: 'end-$1' }
  ];

  replacements.forEach(({from, to}) => {
    content = content.replace(from, to);
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
