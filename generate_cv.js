const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.txt');
const outputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.pdf');

if(!fs.existsSync(inputPath)){
  console.error('Input text CV not found at', inputPath);
  process.exit(1);
}

const content = fs.readFileSync(inputPath, 'utf8');

// Create PDF document with better layout
const doc = new PDFDocument({size: 'A4', margin: 50});
const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Helper: draw a section heading
function sectionHeading(text){
  doc.moveDown(0.6);
  doc.font('Helvetica-Bold').fontSize(13).fillColor('#0b3d91').text(text, {continued: false});
  doc.moveDown(0.3);
  doc.fillColor('black').font('Helvetica').fontSize(11);
}

// Parse content into sections using known headings
const lines = content.split(/\r?\n/);
const headings = ['Contact','Summary','Skills','Experience & Projects','Experience','Projects','Education','Certifications','Note'];

let sections = {};
let current = 'header';
sections[current] = [];

for(let raw of lines){
  const line = raw.replace(/\r/g, '').trim();
  if(line === ''){
    // blank line - skip but keep separation
    if(sections[current].length && sections[current][sections[current].length-1] !== ''){
      sections[current].push('');
    }
    continue;
  }

  // detect heading exactly equal to known heading
  if(headings.includes(line)){
    current = line;
    sections[current] = [];
    continue;
  }

  sections[current].push(line);
}

// Header: name and subtitle
const headerLines = sections['header'] || [];
const name = headerLines[0] || 'Name';
const subtitle = headerLines[1] || '';

doc.font('Helvetica-Bold').fontSize(20).text(name);
if(subtitle) doc.font('Helvetica').fontSize(11).fillColor('gray').text(subtitle);
doc.moveDown(0.5);

// If contact section exists, print contact info on same line if possible
if(sections['Contact']){
  const contact = sections['Contact'];
  // join contact lines with bullets
  const contactStr = contact.filter(Boolean).join(' · ');
  doc.font('Helvetica').fontSize(10).fillColor('black').text(contactStr);
  doc.moveDown(0.6);
}

// Write other sections in order
const order = ['Summary','Skills','Experience & Projects','Education','Certifications','Note'];

order.forEach(sec => {
  if(!sections[sec]) return;
  sectionHeading(sec);
  const lines = sections[sec];
  // For bullet lists (lines starting with '-') render as bullets
  lines.forEach(l => {
    if(!l) { doc.moveDown(0.3); return; }
    if(l.startsWith('-')){
      const text = l.replace(/^-\s*/, '');
      // bullet
      doc.list([text], {bulletRadius: 2});
    } else if(l.match(/^\-\s*/)){
      doc.list([l.replace(/^-\s*/, '')]);
    } else {
      doc.font('Helvetica').fontSize(11).text(l, {lineGap: 3});
    }
    doc.moveDown(0.1);
  });
});

doc.end();

writeStream.on('finish', () => {
  console.log('PDF generated at', outputPath);
});

writeStream.on('error', (err) => {
  console.error('Error writing PDF:', err);
});
