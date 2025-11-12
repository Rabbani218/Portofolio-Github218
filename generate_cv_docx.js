const fs = require('fs');
const path = require('path');
const { Document, Packer, Paragraph, TextRun } = require('docx');

const inputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.txt');
const outputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.docx');

if (!fs.existsSync(inputPath)) {
  console.error('Input text CV not found at', inputPath);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim());

// Build a simple Word document: header (name), subtitle, sections
const doc = new Document({ creator: 'Rabbani', description: 'Generated CV', title: 'Rabbani CV' });
const children = [];

// collect header (first two non-empty lines)
const nonEmpty = lines.filter(l => l);
const name = nonEmpty[0] || 'Name';
const subtitle = nonEmpty[1] || '';

children.push(new Paragraph({
  children: [ new TextRun({ text: name, bold: true, size: 36 }) ]
}));
if (subtitle) children.push(new Paragraph({ children: [ new TextRun({ text: subtitle, italics: true, size: 20 }) ] }));

// Parse by headings
const known = ['Contact','Summary','Skills','Experience & Projects','Experience','Projects','Education','Certifications','Note'];
let cursor = 'header';
const sections = { header: [] };
for (const l of lines) {
  if (!l) { sections[cursor].push(''); continue; }
  if (known.includes(l)) { cursor = l; sections[cursor] = []; continue; }
  sections[cursor].push(l);
}

function addSection(title, arr) {
  if (!arr || !arr.length) return;
  children.push(new Paragraph({ children: [ new TextRun({ text: title, bold: true, size: 24 }) ] }));
  arr.forEach(line => {
    if (!line) return;
    // bullet lines starting with -
    if (line.startsWith('-')) {
      children.push(new Paragraph({ text: line.replace(/^[-]\s*/, ''), bullet: { level: 0 } }));
    } else {
      children.push(new Paragraph({ text: line }));
    }
  });
}

addSection('Contact', sections['Contact']);
addSection('Summary', sections['Summary']);
addSection('Skills', sections['Skills']);
addSection('Experience', sections['Experience & Projects'] || sections['Experience'] || sections['Projects']);
addSection('Education', sections['Education']);
addSection('Certifications', sections['Certifications']);

const docWithSections = new Document({ creator: 'Rabbani', description: 'Generated CV', title: 'Rabbani CV', sections: [{ children }] });

Packer.toBuffer(docWithSections).then(buffer => {
  fs.writeFileSync(outputPath, buffer);
  console.log('DOCX generated at', outputPath);
}).catch(err => {
  console.error('Failed to generate DOCX:', err);
});
