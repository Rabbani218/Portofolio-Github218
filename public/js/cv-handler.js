/**
 * CV Generator Handler
 * Manages CV form interactions, preview generation, and PDF export
 */

class CVGeneratorHandler {
    constructor() {
        this.currentCVData = { ...CVTemplateData.personal };
        this.init();
    }

    init() {
        this.cacheElements();
        this.attachEventListeners();
        this.populateDefaults();
    }

    cacheElements() {
        // Form inputs
        this.nameInput = document.getElementById('cv-name');
        this.titleInput = document.getElementById('cv-title-input');
        this.locationInput = document.getElementById('cv-location');
        this.emailInput = document.getElementById('cv-email');
        this.phoneInput = document.getElementById('cv-phone');
        this.linksInput = document.getElementById('cv-links');
        this.summaryInput = document.getElementById('cv-summary');
        this.skillsInput = document.getElementById('cv-skills');
        this.targetRoleSelect = document.getElementById('cv-target-role');
        this.salaryInput = document.getElementById('cv-salary');
        this.hoursInput = document.getElementById('cv-hours');
        this.healthInput = document.getElementById('cv-health-experience');
        this.demosInput = document.getElementById('cv-demos');

        // Buttons
        this.previewBtn = document.getElementById('cv-preview-btn');
        this.generateBtn = document.getElementById('generateTailoredCv');
        this.resetBtn = document.getElementById('cv-reset');
        this.addExpBtn = document.getElementById('cv-add-experience');
        this.clearExpBtn = document.getElementById('cv-clear-experience');
        this.addEduBtn = document.getElementById('cv-add-education');
        this.clearEduBtn = document.getElementById('cv-clear-education');

        // Containers
        this.expList = document.getElementById('cv-experience-list');
        this.eduList = document.getElementById('cv-education-list');

        // Preview elements
        this.previewContent = document.getElementById('cv-preview-content');
        this.previewName = document.getElementById('preview-name');
        this.previewTitle = document.getElementById('preview-title');
        this.previewLocation = document.getElementById('preview-location');
        this.previewEmail = document.getElementById('preview-email');
        this.previewLinks = document.getElementById('preview-links');
        this.previewSummary = document.getElementById('preview-summary');
        this.previewSummaryText = document.getElementById('preview-summary-text');
        this.previewSkillsList = document.getElementById('preview-skills-list');
        this.previewExpList = document.getElementById('preview-experience-list');
        this.previewEduList = document.getElementById('preview-education-list');
        this.previewProjectsList = document.getElementById('preview-projects-list');
    }

    attachEventListeners() {
        // Form inputs
        this.nameInput?.addEventListener('input', () => this.updatePreview());
        this.titleInput?.addEventListener('input', () => this.updatePreview());
        this.locationInput?.addEventListener('input', () => this.updatePreview());
        this.emailInput?.addEventListener('input', () => this.updatePreview());
        this.phoneInput?.addEventListener('input', () => this.updatePreview());
        this.linksInput?.addEventListener('input', () => this.updatePreview());
        this.summaryInput?.addEventListener('input', () => this.updatePreview());
        this.skillsInput?.addEventListener('input', () => this.updatePreview());

        // Buttons
        this.previewBtn?.addEventListener('click', () => this.updatePreview());
        this.generateBtn?.addEventListener('click', () => this.generatePDF());
        this.resetBtn?.addEventListener('click', () => this.resetForm());

        // Experience management
        this.addExpBtn?.addEventListener('click', () => this.addExperienceField());
        this.clearExpBtn?.addEventListener('click', () => this.clearExperience());

        // Education management
        this.addEduBtn?.addEventListener('click', () => this.addEducationField());
        this.clearEduBtn?.addEventListener('click', () => this.clearEducation());

        // Delegation for remove buttons
        this.expList?.addEventListener('click', (e) => {
            if (e.target.classList.contains('cv-remove-exp')) {
                e.target.closest('.cv-exp-item')?.remove();
                this.updatePreview();
            }
        });

        this.eduList?.addEventListener('click', (e) => {
            if (e.target.classList.contains('cv-remove-edu')) {
                e.target.closest('.cv-edu-item')?.remove();
                this.updatePreview();
            }
        });
    }

    populateDefaults() {
        const personal = CVTemplateData.personal;
        
        this.nameInput.value = personal.name;
        this.titleInput.value = personal.title;
        this.locationInput.value = personal.location;
        this.emailInput.value = personal.email;
        this.phoneInput.value = personal.phone;
        this.linksInput.value = `${personal.github}, ${personal.linkedin}`;
        
        const summary = CVTemplateData.summaries.general;
        this.summaryInput.value = summary;
        
        const skills = CVTemplateData.skills.technical.slice(0, 5).join(', ');
        this.skillsInput.value = skills;

        // Populate experience
        this.populateExperience();

        // Populate education
        this.populateEducation();

        // Initial preview
        this.updatePreview();
    }

    populateExperience() {
        this.expList.innerHTML = '';

        CVTemplateData.experience.slice(0, 2).forEach(exp => {
            const expHTML = `
                <div class="cv-exp-item" style="display:grid;grid-template-columns:1fr 160px;gap:8px;align-items:start;padding:10px;border-radius:8px;border:1px solid #eef2f7;">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <input name="exp-title" class="exp-title" type="text" value="${exp.role} — ${exp.company}" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;">
                        <textarea name="exp-desc" class="exp-desc" rows="3" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;resize:vertical;">${exp.description.join('\n')}</textarea>
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <input name="exp-dates" class="exp-dates" type="text" value="${exp.dates}" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;">
                        <button type="button" class="cv-remove-exp btn-secondary" style="padding:8px;border-radius:6px;align-self:end;">Remove</button>
                    </div>
                </div>
            `;
            this.expList.insertAdjacentHTML('beforeend', expHTML);
        });

        this.expList.addEventListener('input', () => this.updatePreview());
    }

    populateEducation() {
        this.eduList.innerHTML = '';

        CVTemplateData.education.forEach(edu => {
            const eduHTML = `
                <div class="cv-edu-item" style="display:grid;grid-template-columns:1fr 160px;gap:8px;align-items:start;padding:10px;border-radius:8px;border:1px solid #eef2f7;">
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <input name="edu-title" class="edu-title" type="text" value="${edu.degree}" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;">
                        <input name="edu-highlights" class="edu-highlights" type="text" value="${edu.highlights?.join(', ') || ''}" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;">
                    </div>
                    <div style="display:flex;flex-direction:column;gap:6px;">
                        <input name="edu-dates" class="edu-dates" type="text" value="${edu.dates}" style="padding:8px;border-radius:6px;border:1px solid #e6e9ef;">
                        <button type="button" class="cv-remove-edu btn-secondary" style="padding:8px;border-radius:6px;align-self:end;">Remove</button>
                    </div>
                </div>
            `;
            this.eduList.insertAdjacentHTML('beforeend', eduHTML);
        });

        this.eduList.addEventListener('input', () => this.updatePreview());
    }

    addExperienceField() {
        const template = document.getElementById('cv-exp-template');
        if (template) {
            const clone = template.content.cloneNode(true);
            this.expList.appendChild(clone);
        }
        this.updatePreview();
    }

    clearExperience() {
        this.expList.innerHTML = '';
        this.updatePreview();
    }

    addEducationField() {
        const template = document.getElementById('cv-edu-template');
        if (template) {
            const clone = template.content.cloneNode(true);
            this.eduList.appendChild(clone);
        }
        this.updatePreview();
    }

    clearEducation() {
        this.eduList.innerHTML = '';
        this.updatePreview();
    }

    gatherFormData() {
        // Personal info
        const personal = {
            name: this.nameInput?.value || '',
            title: this.titleInput?.value || '',
            location: this.locationInput?.value || '',
            email: this.emailInput?.value || '',
            phone: this.phoneInput?.value || '',
            website: '',
            github: '',
            linkedin: '',
            portfolio: '',
            languages: ['Indonesian', 'English', 'Japanese']
        };

        // Parse links
        const links = this.linksInput?.value?.split(',').map(l => l.trim()) || [];
        links.forEach(link => {
            if (link.includes('github')) personal.github = link;
            if (link.includes('linkedin')) personal.linkedin = link;
        });

        // Summary
        const summaries = {
            general: this.summaryInput?.value || '',
            data_scientist: this.summaryInput?.value || '',
            fullstack: this.summaryInput?.value || '',
            ai_engineer: this.summaryInput?.value || ''
        };

        // Skills
        const skillsText = this.skillsInput?.value || '';
        const skills = {
            technical: skillsText.split(',').map(s => s.trim()).filter(s => s),
            tools: [],
            soft: []
        };

        // Experience
        const experience = [];
        this.expList?.querySelectorAll('.cv-exp-item').forEach(item => {
            const title = item.querySelector('.exp-title')?.value || '';
            const desc = item.querySelector('.exp-desc')?.value || '';
            const dates = item.querySelector('.exp-dates')?.value || '';

            if (title) {
                const [role, company] = title.split('—').map(s => s.trim());
                experience.push({
                    role: role || title,
                    company: company || 'Company',
                    dates: dates,
                    description: desc.split('\n').filter(d => d.trim())
                });
            }
        });

        // Education
        const education = [];
        this.eduList?.querySelectorAll('.cv-edu-item').forEach(item => {
            const degree = item.querySelector('.edu-title')?.value || '';
            const highlights = item.querySelector('.edu-highlights')?.value || '';
            const dates = item.querySelector('.edu-dates')?.value || '';

            if (degree) {
                education.push({
                    degree: degree,
                    institution: 'Institution',
                    dates: dates,
                    highlights: highlights.split(',').map(h => h.trim()).filter(h => h)
                });
            }
        });

        return {
            personal,
            summaries,
            skills,
            experience,
            education,
            certifications: CVTemplateData.certifications,
            languages: CVTemplateData.languages,
            projects: CVTemplateData.projects
        };
    }

    updatePreview() {
        const data = this.gatherFormData();

        // Header
        if (this.previewName) this.previewName.textContent = data.personal.name;
        if (this.previewTitle) this.previewTitle.textContent = data.personal.title;
        if (this.previewLocation) this.previewLocation.textContent = data.personal.location;
        if (this.previewEmail) this.previewEmail.textContent = data.personal.email;

        // Contact links
        const links = [data.personal.github, data.personal.linkedin].filter(l => l);
        if (this.previewLinks && links.length > 0) {
            this.previewLinks.textContent = links.join(' • ');
        }

        // Summary
        if (this.previewSummaryText) {
            this.previewSummaryText.textContent = data.summaries.general;
        }

        // Skills
        if (this.previewSkillsList) {
            this.previewSkillsList.innerHTML = data.skills.technical
                .slice(0, 6)
                .map(skill => `<span style="display:inline-block;padding:4px 8px;background:#f0f9ff;color:#0b3d91;border-radius:20px;font-size:0.85rem;">${skill}</span>`)
                .join('');
        }

        // Experience
        if (this.previewExpList) {
            this.previewExpList.innerHTML = data.experience
                .map(exp => `
                    <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #eef2f7;">
                        <strong style="font-size:0.95rem;">${exp.role} — ${exp.company}</strong>
                        <div style="color:#64748b;font-size:0.85rem;">${exp.dates}</div>
                        <div style="color:#374151;font-size:0.9rem;margin-top:4px;">
                            ${exp.description.map(d => `<div style="margin-bottom:2px;">• ${d}</div>`).join('')}
                        </div>
                    </div>
                `)
                .join('');
        }

        // Education
        if (this.previewEduList) {
            this.previewEduList.innerHTML = data.education
                .map(edu => `
                    <div style="margin-bottom:8px;padding-bottom:8px;border-bottom:1px dashed #eef2f7;">
                        <strong style="font-size:0.95rem;">${edu.degree}</strong>
                        <div style="color:#64748b;font-size:0.85rem;">${edu.dates}</div>
                    </div>
                `)
                .join('');
        }

        // Projects
        if (this.previewProjectsList && data.projects?.length > 0) {
            this.previewProjectsList.innerHTML = data.projects
                .slice(0, 2)
                .map(proj => `
                    <div style="margin-bottom:6px;">
                        <a href="${proj.link}" target="_blank" style="color:#0b3d91;text-decoration:none;font-weight:600;">${proj.title}</a>
                        <span style="color:#94a3b8;font-size:0.85rem;"> — ${proj.technologies.join(', ')}</span>
                    </div>
                `)
                .join('');
        }
    }

    async generatePDF() {
        const data = this.gatherFormData();
        const targetRole = this.targetRoleSelect?.value || 'general';
        const template = document.getElementById('cv-template')?.value || 'modern';

        // Show loading state
        this.generateBtn.disabled = true;
        this.generateBtn.textContent = '⏳ Generating...';

        try {
            // Create generator instance
            const generator = new CVPDFGenerator(data, {
                targetRole: targetRole,
                template: template,
                color: '#0b3d91',
                accentColor: '#0ea5a4'
            });

            // Generate PDF
            const pdf = await generator.generatePDF();

            // Download
            const filename = `${data.personal.name.replace(/\s+/g, '_')}_CV_${new Date().getFullYear()}.pdf`;
            generator.downloadPDF(pdf, filename);

            // Success message
            alert('✅ CV PDF berhasil dibuat dan diunduh!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            alert('❌ Gagal membuat PDF. Silakan coba lagi.');
        } finally {
            this.generateBtn.disabled = false;
            this.generateBtn.textContent = '📥 Generate PDF';
        }
    }

    resetForm() {
        document.getElementById('cv-form')?.reset();
        this.populateDefaults();
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CVGeneratorHandler();
    });
} else {
    new CVGeneratorHandler();
}
