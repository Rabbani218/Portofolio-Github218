/**
 * Advanced CV PDF Generator
 * Generates Professional, Modern & ATS-friendly PDFs with Multiple Design Templates
 * 
 * Features:
 * - Multiple professional templates (Modern, Classic, Minimal, Bold)
 * - Customizable colors and typography
 * - ATS-friendly formatting
 * - Professional visual hierarchy
 * - Responsive and printable
 */

class CVPDFGenerator {
    constructor(cvData, options = {}) {
        this.cvData = cvData;
        this.options = {
            template: 'modern',
            color: '#0b3d91',
            accentColor: '#0ea5a4',
            locale: 'en',
            ...options
        };
        this.colors = {
            primary: this.options.color,
            accent: this.options.accentColor,
            dark: '#0f172a',
            light: '#f8fafc',
            muted: '#64748b',
            border: '#e2e8f0',
            success: '#10b981',
            warning: '#f59e0b'
        };
    }

    /**
     * Generate PDF document using jsPDF
     */
    async generatePDF() {
        const { jsPDF } = window.jspdf;
        
        // Create PDF with custom dimensions (A4)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // Set metadata
        pdf.setProperties({
            title: `CV - ${this.cvData.personal.name}`,
            subject: 'Professional CV',
            author: this.cvData.personal.name,
            keywords: 'CV, Resume, Professional',
            creator: 'Portfolio CV Generator'
        });

        // Choose template method
        const templateMethod = `render${this.capitalizeFirstLetter(this.options.template)}Template`;
        
        if (typeof this[templateMethod] === 'function') {
            await this[templateMethod].call(this, pdf);
        } else {
            this.renderModernTemplate(pdf);
        }

        return pdf;
    }

    /**
     * Modern Template - Clean, Professional with Contemporary Design
     */
    renderModernTemplate(pdf) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 15;
        const margin = 12;
        const contentWidth = pageWidth - (margin * 2);

        // Set default font
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.dark);

        // ===== HEADER =====
        this.renderHeader(pdf, margin, yPosition);
        yPosition += 20;

        // ===== SUMMARY =====
        if (this.cvData.summaries) {
            const summary = this.cvData.summaries[this.options.targetRole] || 
                          this.cvData.summaries.general;
            yPosition = this.renderSection(pdf, 'PROFESSIONAL SUMMARY', summary, 
                                         margin, yPosition, contentWidth, 8);
            yPosition += 3;
        }

        // ===== CORE SKILLS =====
        yPosition = this.renderSkillsSection(pdf, margin, yPosition, contentWidth);
        yPosition += 3;

        // ===== EXPERIENCE =====
        yPosition = this.renderExperienceSection(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 3;

        // ===== EDUCATION =====
        yPosition = this.renderEducationSection(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 3;

        // ===== CERTIFICATIONS =====
        yPosition = this.renderCertificationsSection(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 3;

        // ===== LANGUAGES & ADDITIONAL INFO =====
        yPosition = this.renderLanguagesSection(pdf, margin, yPosition, contentWidth, pageHeight);

        // ===== FOOTER =====
        this.renderFooter(pdf, pageHeight);
    }

    /**
     * Classic Template - Traditional & Conservative
     */
    renderClassicTemplate(pdf) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 15;
        const margin = 12;
        const contentWidth = pageWidth - (margin * 2);

        // Similar to modern but with more traditional styling
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.dark);

        // Header
        this.renderHeaderClassic(pdf, margin, yPosition);
        yPosition += 18;

        // Summary
        if (this.cvData.summaries) {
            const summary = this.cvData.summaries[this.options.targetRole] || 
                          this.cvData.summaries.general;
            yPosition = this.renderSectionClassic(pdf, 'PROFESSIONAL PROFILE', summary,
                                                 margin, yPosition, contentWidth);
            yPosition += 2;
        }

        // Experience
        yPosition = this.renderExperienceSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 2;

        // Education
        yPosition = this.renderEducationSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 2;

        // Skills
        yPosition = this.renderSkillsSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);

        this.renderFooter(pdf, pageHeight);
    }

    /**
     * Minimal Template - Clean and Simple
     */
    renderMinimalTemplate(pdf) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 12;
        const margin = 14;
        const contentWidth = pageWidth - (margin * 2);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.dark);

        // Minimalist header
        this.renderHeaderMinimal(pdf, margin, yPosition);
        yPosition += 16;

        // Experience first (no summary)
        yPosition = this.renderExperienceMinimal(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 2;

        // Education
        yPosition = this.renderEducationMinimal(pdf, margin, yPosition, contentWidth, pageHeight);
        yPosition += 2;

        // Skills
        yPosition = this.renderSkillsMinimal(pdf, margin, yPosition, contentWidth, pageHeight);

        this.renderFooter(pdf, pageHeight);
    }

    /**
     * Bold Template - Eye-catching with strong visual hierarchy
     */
    renderBoldTemplate(pdf) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 12;
        const margin = 12;
        const contentWidth = pageWidth - (margin * 2);

        // Colored sidebar background
        pdf.setFillColor(parseInt(this.colors.primary.slice(1, 3), 16),
                        parseInt(this.colors.primary.slice(3, 5), 16),
                        parseInt(this.colors.primary.slice(5, 7), 16));
        pdf.rect(0, 0, 50, pageHeight, 'F');

        // Text on sidebar
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(8);
        pdf.setTextColor(255, 255, 255);
        pdf.text('CONTACT', 8, 20);
        
        pdf.setFontSize(9);
        pdf.setFont('Helvetica', 'normal');
        const contactLines = [
            this.cvData.personal.email,
            this.cvData.personal.phone,
            this.cvData.personal.location
        ];
        contactLines.forEach((line, idx) => {
            pdf.text(line, 8, 26 + (idx * 8), { maxWidth: 35 });
        });

        // Main content area (right side)
        const mainMargin = 60;
        const mainContentWidth = pageWidth - mainMargin - 12;
        
        pdf.setTextColor(this.colors.dark);
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.text(this.cvData.personal.name, mainMargin, 20);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.primary);
        pdf.text(this.cvData.personal.title, mainMargin, 28);

        let yPos = 38;

        // Summary
        if (this.cvData.summaries) {
            const summary = this.cvData.summaries[this.options.targetRole] || 
                          this.cvData.summaries.general;
            yPos = this.renderSection(pdf, 'SUMMARY', summary, mainMargin, yPos, 
                                    mainContentWidth, 8, pageHeight);
        }

        // Experience
        yPos = this.renderExperienceSection(pdf, mainMargin, yPos + 2, mainContentWidth, pageHeight);

        this.renderFooter(pdf, pageHeight);
    }

    /**
     * ===== HEADER RENDERERS =====
     */
    renderHeader(pdf, x, y) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        // Name
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(22);
        pdf.setTextColor(this.colors.primary);
        pdf.text(this.cvData.personal.name, x, y);

        // Title
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.accent);
        pdf.text(this.cvData.personal.title, x, y + 8);

        // Contact info (right side)
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.muted);
        const contactX = pageWidth - x - 60;
        
        const contactInfo = [
            this.cvData.personal.email,
            this.cvData.personal.phone,
            this.cvData.personal.location
        ];
        
        contactInfo.forEach((info, idx) => {
            pdf.text(info, contactX, y + 2 + (idx * 6));
        });

        // Decorative line
        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.5);
        pdf.line(x, y + 13, pageWidth - x, y + 13);
    }

    renderHeaderClassic(pdf, x, y) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(18);
        pdf.setTextColor(this.colors.dark);
        pdf.text(this.cvData.personal.name, x, y);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text(this.cvData.personal.title, x, y + 7);

        // Contact line
        pdf.setFontSize(8);
        pdf.setTextColor(this.colors.muted);
        const contactLine = `${this.cvData.personal.email} | ${this.cvData.personal.phone} | ${this.cvData.personal.location}`;
        pdf.text(contactLine, x, y + 12, { maxWidth: pageWidth - x * 2 });
    }

    renderHeaderMinimal(pdf, x, y) {
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(16);
        pdf.setTextColor(this.colors.dark);
        pdf.text(this.cvData.personal.name, x, y);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.muted);
        pdf.text(this.cvData.personal.title, x, y + 6);
    }

    /**
     * ===== SECTION RENDERERS =====
     */
    renderSection(pdf, title, content, x, y, width, fontSize = 9, pageHeight = 297) {
        // Check if we need a new page
        if (y > pageHeight - 30) {
            pdf.addPage();
            y = 15;
        }

        // Section title
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text(title, x, y);

        // Decorative line under title
        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, y + 1, x + 30, y + 1);

        // Content
        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(fontSize);
        pdf.setTextColor(this.colors.dark);
        
        const textDimensions = pdf.getTextDimensions(content);
        const lines = pdf.splitTextToSize(content, width - 2);
        
        lines.forEach((line, idx) => {
            pdf.text(line, x + 1, y + 6 + (idx * 4));
        });

        return y + 6 + (lines.length * 4);
    }

    renderSectionClassic(pdf, title, content, x, y, width) {
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.primary);
        pdf.text(title, x, y);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);
        
        const lines = pdf.splitTextToSize(content, width - 2);
        lines.forEach((line, idx) => {
            pdf.text(line, x, y + 6 + (idx * 4));
        });

        return y + 6 + (lines.length * 4);
    }

    /**
     * ===== EXPERIENCE SECTION =====
     */
    renderExperienceSection(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text('EXPERIENCE', x, yPos);

        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, yPos + 1, x + 30, yPos + 1);

        yPos += 7;

        if (this.cvData.experience && this.cvData.experience.length > 0) {
            this.cvData.experience.forEach((exp, idx) => {
                if (yPos > pageHeight - 35) {
                    pdf.addPage();
                    yPos = 15;
                }

                // Role & Company
                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(this.colors.dark);
                const roleText = `${exp.role} — ${exp.company}`;
                pdf.text(roleText, x, yPos);

                // Dates
                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(this.colors.muted);
                pdf.text(exp.dates, x + width - 40, yPos);

                yPos += 5;

                // Description bullets
                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.dark);

                exp.description.forEach(bullet => {
                    if (yPos > pageHeight - 15) {
                        pdf.addPage();
                        yPos = 15;
                    }
                    
                    const bulletLines = pdf.splitTextToSize(`• ${bullet}`, width - 4);
                    bulletLines.forEach((line, lineIdx) => {
                        pdf.text(line, x + 2, yPos);
                        yPos += 4;
                    });
                });

                yPos += 2;
            });
        }

        return yPos;
    }

    renderExperienceSectionClassic(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.primary);
        pdf.text('WORK EXPERIENCE', x, yPos);

        yPos += 7;

        if (this.cvData.experience && this.cvData.experience.length > 0) {
            this.cvData.experience.forEach(exp => {
                if (yPos > pageHeight - 40) {
                    pdf.addPage();
                    yPos = 15;
                }

                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(this.colors.dark);
                pdf.text(`${exp.role}`, x, yPos);

                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.muted);
                pdf.text(`${exp.company} | ${exp.dates}`, x, yPos + 5);

                yPos += 10;

                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.dark);
                exp.description.forEach(bullet => {
                    const lines = pdf.splitTextToSize(`• ${bullet}`, width - 4);
                    lines.forEach(line => {
                        if (yPos > pageHeight - 15) {
                            pdf.addPage();
                            yPos = 15;
                        }
                        pdf.text(line, x + 2, yPos);
                        yPos += 4;
                    });
                });

                yPos += 3;
            });
        }

        return yPos;
    }

    renderExperienceMinimal(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.dark);
        pdf.text('EXPERIENCE', x, yPos);
        yPos += 5;

        if (this.cvData.experience && this.cvData.experience.length > 0) {
            this.cvData.experience.slice(0, 3).forEach(exp => {
                if (yPos > pageHeight - 25) {
                    pdf.addPage();
                    yPos = 15;
                }

                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.text(`${exp.role} — ${exp.company}`, x, yPos);

                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(this.colors.muted);
                pdf.text(exp.dates, x, yPos + 4);

                yPos += 8;
            });
        }

        return yPos;
    }

    /**
     * ===== EDUCATION SECTION =====
     */
    renderEducationSection(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text('EDUCATION', x, yPos);

        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, yPos + 1, x + 30, yPos + 1);

        yPos += 7;

        if (this.cvData.education && this.cvData.education.length > 0) {
            this.cvData.education.forEach(edu => {
                if (yPos > pageHeight - 25) {
                    pdf.addPage();
                    yPos = 15;
                }

                // Degree
                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.setTextColor(this.colors.dark);
                pdf.text(edu.degree, x, yPos);

                // Institution & dates
                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.muted);
                pdf.text(`${edu.institution}`, x, yPos + 5);
                pdf.text(`${edu.dates}`, x + width - 40, yPos + 5);

                yPos += 10;

                // Highlights
                if (edu.highlights && edu.highlights.length > 0) {
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.dark);
                    edu.highlights.forEach(highlight => {
                        const lines = pdf.splitTextToSize(`• ${highlight}`, width - 4);
                        lines.forEach(line => {
                            pdf.text(line, x + 2, yPos);
                            yPos += 3;
                        });
                    });
                }

                yPos += 2;
            });
        }

        return yPos;
    }

    renderEducationSectionClassic(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.primary);
        pdf.text('EDUCATION', x, yPos);
        yPos += 7;

        if (this.cvData.education && this.cvData.education.length > 0) {
            this.cvData.education.forEach(edu => {
                if (yPos > pageHeight - 20) {
                    pdf.addPage();
                    yPos = 15;
                }

                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(10);
                pdf.text(edu.degree, x, yPos);

                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.muted);
                pdf.text(edu.institution, x, yPos + 5);

                yPos += 12;
            });
        }

        return yPos;
    }

    renderEducationMinimal(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('EDUCATION', x, yPos);
        yPos += 5;

        if (this.cvData.education && this.cvData.education.length > 0) {
            this.cvData.education.forEach(edu => {
                pdf.setFont('Helvetica', 'bold');
                pdf.setFontSize(9);
                pdf.text(edu.degree, x, yPos);

                pdf.setFont('Helvetica', 'normal');
                pdf.setFontSize(8);
                pdf.setTextColor(this.colors.muted);
                pdf.text(`${edu.institution} | ${edu.dates}`, x, yPos + 4);

                yPos += 8;
            });
        }

        return yPos;
    }

    /**
     * ===== SKILLS SECTION =====
     */
    renderSkillsSection(pdf, x, y, width, pageHeight = 297) {
        let yPos = y;

        if (yPos > pageHeight - 25) {
            pdf.addPage();
            yPos = 15;
        }

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text('CORE COMPETENCIES', x, yPos);

        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, yPos + 1, x + 30, yPos + 1);

        yPos += 7;

        // Technical skills
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);
        pdf.text('Technical:', x, yPos);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        const techSkills = this.cvData.skills.technical.slice(0, 5).join(' • ');
        const techLines = pdf.splitTextToSize(techSkills, width - 20);
        techLines.forEach((line, idx) => {
            pdf.text(line, x + 20, yPos + (idx * 3));
        });

        yPos += techLines.length * 3 + 4;

        // Tools & Platforms
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);
        pdf.text('Tools:', x, yPos);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        const tools = this.cvData.skills.tools.join(' • ');
        const toolLines = pdf.splitTextToSize(tools, width - 20);
        toolLines.forEach((line, idx) => {
            pdf.text(line, x + 20, yPos + (idx * 3));
        });

        yPos += toolLines.length * 3 + 4;

        // Soft skills
        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);
        pdf.text('Soft Skills:', x, yPos);

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        const softSkills = this.cvData.skills.soft.slice(0, 4).join(' • ');
        const softLines = pdf.splitTextToSize(softSkills, width - 20);
        softLines.forEach((line, idx) => {
            pdf.text(line, x + 20, yPos + (idx * 3));
        });

        return yPos + softLines.length * 3;
    }

    renderSkillsSectionClassic(pdf, x, y, width, pageHeight) {
        let yPos = y;

        if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 15;
        }

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(this.colors.primary);
        pdf.text('SKILLS', x, yPos);
        yPos += 7;

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);

        const skills = this.cvData.skills.technical.slice(0, 8).join(' • ');
        const skillLines = pdf.splitTextToSize(skills, width - 2);
        skillLines.forEach((line, idx) => {
            pdf.text(line, x, yPos + (idx * 4));
        });

        return yPos + skillLines.length * 4;
    }

    renderSkillsMinimal(pdf, x, y, width, pageHeight) {
        let yPos = y;

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.text('SKILLS', x, yPos);
        yPos += 4;

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(this.colors.dark);

        const skills = this.cvData.skills.technical.slice(0, 6).join(' • ');
        const skillLines = pdf.splitTextToSize(skills, width);
        skillLines.forEach((line) => {
            pdf.text(line, x, yPos);
            yPos += 3;
        });

        return yPos;
    }

    /**
     * ===== CERTIFICATIONS & LANGUAGES SECTIONS =====
     */
    renderCertificationsSection(pdf, x, y, width, pageHeight) {
        let yPos = y;

        if (!this.cvData.certifications || this.cvData.certifications.length === 0) {
            return yPos;
        }

        if (yPos > pageHeight - 20) {
            pdf.addPage();
            yPos = 15;
        }

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text('CERTIFICATIONS', x, yPos);

        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, yPos + 1, x + 30, yPos + 1);

        yPos += 7;

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);

        this.cvData.certifications.forEach(cert => {
            if (yPos > pageHeight - 10) {
                pdf.addPage();
                yPos = 15;
            }

            const certText = `${cert.name} — ${cert.issuer} (${cert.date})`;
            pdf.text(certText, x, yPos);
            yPos += 4;
        });

        return yPos;
    }

    renderLanguagesSection(pdf, x, y, width, pageHeight) {
        let yPos = y;

        if (!this.cvData.languages || this.cvData.languages.length === 0) {
            return yPos;
        }

        if (yPos > pageHeight - 15) {
            pdf.addPage();
            yPos = 15;
        }

        pdf.setFont('Helvetica', 'bold');
        pdf.setFontSize(10);
        pdf.setTextColor(this.colors.primary);
        pdf.text('LANGUAGES', x, yPos);

        pdf.setDrawColor(this.colors.accent);
        pdf.setLineWidth(0.3);
        pdf.line(x, yPos + 1, x + 30, yPos + 1);

        yPos += 7;

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(9);
        pdf.setTextColor(this.colors.dark);

        this.cvData.languages.forEach(lang => {
            pdf.text(`${lang.name}: ${lang.level}`, x, yPos);
            yPos += 4;
        });

        return yPos;
    }

    /**
     * ===== FOOTER =====
     */
    renderFooter(pdf, pageHeight) {
        const pageWidth = pdf.internal.pageSize.getWidth();
        const margin = 12;

        pdf.setFont('Helvetica', 'normal');
        pdf.setFontSize(8);
        pdf.setTextColor(this.colors.muted);

        const footerText = `Generated with Portfolio CV Tool | ${new Date().toLocaleDateString()}`;
        pdf.text(footerText, margin, pageHeight - 8, { 
            maxWidth: pageWidth - (margin * 2),
            align: 'center'
        });
    }

    /**
     * UTILITY FUNCTIONS
     */
    capitalizeFirstLetter(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    /**
     * Download PDF file
     */
    downloadPDF(pdf, filename = 'cv.pdf') {
        pdf.save(filename);
    }
}

// Export untuk digunakan di global scope
window.CVPDFGenerator = CVPDFGenerator;
