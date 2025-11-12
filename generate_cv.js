const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/*
  Scope the PDF and RTF generators separately to avoid redeclaring block-scoped
  variables (const/let) in the same top-level scope.
*/

/* PDF generation (scoped) */
{
  const inputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.txt');
  const outputPath = path.join(__dirname, 'public', 'assets', 'Rabbani_CV_2025.pdf');

  if (!fs.existsSync(inputPath)) {
    console.error('Input text CV not found at', inputPath);
    process.exit(1);
  }

  const content = fs.readFileSync(inputPath, 'utf8');
  // Create PDF document with ATS-friendly, reverse-chronological layout
  const doc = new PDFDocument({ size: 'A4', margin: 50 });
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // Utility: write heading
  function writeHeading(text) {
    doc.moveDown(0.4);
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(text);
    doc.moveDown(0.15);
    doc.font('Helvetica').fontSize(10).fillColor('black');
  }

  // Parse the plain text into simple sections
  const lines = content.split(/\r?\n/).map(l => l.replace(/\r/g, '').trim());
  const sections = {};
  let cursor = 'header';
  sections[cursor] = [];
  const known = ['Contact', 'Summary', 'Skills', 'Experience & Projects', 'Experience', 'Projects', 'Education', 'Certifications', 'Note'];
  for (const l of lines) {
    if (!l) { sections[cursor].push(''); continue; }
    if (known.includes(l)) { cursor = l; sections[cursor] = []; continue; }
    sections[cursor].push(l);
  }

  // Header
  const header = sections['header'] || [];
  const name = header[0] || 'Name';
  const subtitle = header[1] || '';
  doc.font('Helvetica-Bold').fontSize(18).text(name);
  if (subtitle) { doc.font('Helvetica').fontSize(10).fillColor('#374151').text(subtitle); }
  doc.moveDown(0.2);

  // Contact line (compact)
  if (sections['Contact']) {
    const contact = sections['Contact'].filter(Boolean).join(' · ');
    if (contact) {
      doc.font('Helvetica').fontSize(9).fillColor('#111827').text(contact);
      doc.moveDown(0.4);
    }
  }

  // Summary (tailored brief)
  if (sections['Summary'] && sections['Summary'].length) {
    writeHeading('Summary');
    const summaryText = sections['Summary'].join(' ');
    doc.font('Helvetica').fontSize(10).text(summaryText, { width: 500, lineGap: 2 });
  }

  // Skills (inline comma list for ATS)
  if (sections['Skills'] && sections['Skills'].length) {
    writeHeading('Skills');
    const skills = sections['Skills'].join(', ').replace(/[-•*]\s*/g, '');
    doc.font('Helvetica').fontSize(10).text(skills, { width: 500, lineGap: 2 });
  }

  // Experience & Projects - render as reverse chronological: look for dash items
  const expSrc = sections['Experience & Projects'] || sections['Experience'] || sections['Projects'] || [];
  if (expSrc.length) {
    writeHeading('Experience');
    // Each line starting with '-' is an item; group contiguous items
    for (let i = 0; i < expSrc.length; i++) {
      const line = expSrc[i];
      if (!line) { continue; }
      if (line.startsWith('-')) {
        const text = line.replace(/^[-]\s*/, '');
        // Bold the project/role prefix if it looks like "Role, Project (Year)"
        doc.font('Helvetica-Bold').fontSize(10).text(text.split(':')[0]);
        doc.moveDown(0.08);
        doc.font('Helvetica').fontSize(10).text(text);
        doc.moveDown(0.2);
      } else {
        // plain line
        doc.font('Helvetica').fontSize(10).text(line);
        doc.moveDown(0.12);
      }
    }
  }

  // Education
  if (sections['Education'] && sections['Education'].length) {
    writeHeading('Education');
    sections['Education'].forEach(l => {
      if (!l) return;
      doc.font('Helvetica').fontSize(10).text(l);
      doc.moveDown(0.08);
    });
  }

  // Certifications
  if (sections['Certifications'] && sections['Certifications'].length) {
    writeHeading('Certifications');
    sections['Certifications'].forEach(l => { if (l) doc.font('Helvetica').fontSize(10).text(l); });
  }

  doc.end();

  writeStream.on('finish', () => {
    console.log('PDF generated at', outputPath);
  });

  writeStream.on('error', (err) => {
    console.error('Error writing PDF:', err);
  });
}

/* RTF generation (scoped) */
{
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
  const known = ['Contact', 'Summary', 'Skills', 'Experience & Projects', 'Experience', 'Projects', 'Education', 'Certifications', 'Note'];
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
}
