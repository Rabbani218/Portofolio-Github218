const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.txt');
const outputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.rtf');

if (!fs.existsSync(inputPath)) {
  console.error('Input text CV not found at', inputPath);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');
const lines = content.split(/\r?\n/).map(l => l.trim());

// Simple RTF generator — broadly compatible with Word and ATS that accept RTF/DOC
function rtfEscape(s) {
  return s.replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}');
}

let rtf = '{\\rtf1\\ansi\\deff0\n';

// Header
const nonEmpty = lines.filter(l => l);
const name = nonEmpty[0] || 'Name';
const subtitle = nonEmpty[1] || '';

rtf += '\\b ' + rtfEscape(name) + ' \\b0\\line\n';
if (subtitle) rtf += rtfEscape(subtitle) + '\\line\\line\n';

// parse known sections
const known = ['Contact','Summary','Skills','Experience & Projects','Experience','Projects','Education','Certifications','Note'];
let cursor = 'header';
const sections = { header: [] };
for (const l of lines) {
  if (!l) { sections[cursor].push(''); continue; }
  if (known.includes(l)) { cursor = l; sections[cursor] = []; continue; }
  sections[cursor].push(l);
}

function addSectionRTF(title, arr) {
  if (!arr || !arr.length) return;
  rtf += '\\b ' + rtfEscape(title) + ' \\b0\\line\n';
  arr.forEach(line => {
    if (!line) return;
    if (line.startsWith('-')) {
      rtf += '\\tab\\bullet\\tab ' + rtfEscape(line.replace(/^[-]\s*/, '')) + '\\line\n';
    } else {
      rtf += rtfEscape(line) + '\\line\n';
    }
  });
  rtf += '\\line\n';
}

addSectionRTF('Contact', sections['Contact']);
addSectionRTF('Summary', sections['Summary']);
addSectionRTF('Skills', sections['Skills']);
addSectionRTF('Experience', sections['Experience & Projects'] || sections['Experience'] || sections['Projects']);
addSectionRTF('Education', sections['Education']);
addSectionRTF('Certifications', sections['Certifications']);

rtf += '}\n';

fs.writeFileSync(outputPath, rtf, 'utf8');
console.log('RTF generated at', outputPath);
