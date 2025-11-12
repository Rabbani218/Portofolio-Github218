class CVGeneratorHandler {
    constructor() {
        this.state = {
            activeVariant: 'general',
            template: 'modern',
            templateManuallySet: false,
            isGenerating: false
        };
        this.currentData = null;
        this.clearStatusTimer = null;
        this.init();
    }

    init() {
        this.cacheElements();
        this.populateDefaults();
        this.attachEventListeners();
        this.setVariant(this.state.activeVariant);
    }

    cacheElements() {
        this.form = document.getElementById('cv-form');
        this.nameInput = document.getElementById('cv-name');
        this.titleInput = document.getElementById('cv-title-input');
        this.locationInput = document.getElementById('cv-location');
        this.emailInput = document.getElementById('cv-email');
        this.phoneInput = document.getElementById('cv-phone');
        this.linksInput = document.getElementById('cv-links');
        this.summaryInput = document.getElementById('cv-summary');
        this.skillsInput = document.getElementById('cv-skills');
        this.demosInput = document.getElementById('cv-demos');
        this.targetRoleSelect = document.getElementById('cv-target-role');
        this.templateSelect = document.getElementById('cv-template');
        this.customDownloadBtn = document.getElementById('cv-download-custom');
        this.resetBtn = document.getElementById('cv-reset');
        this.statusMessage = document.getElementById('cv-status-message');
        this.variantButtons = Array.from(document.querySelectorAll('.cv-download-btn'));
        this.variantCards = Array.from(document.querySelectorAll('[data-variant-card]'));

        this.previewRoot = document.getElementById('cv-preview');
        this.previewName = document.getElementById('preview-name');
        this.previewTitle = document.getElementById('preview-title');
        this.previewVariantLabel = document.getElementById('preview-variant-label');
        this.previewVariantHeadline = document.getElementById('preview-variant-headline');
        this.previewLocation = document.getElementById('preview-location');
        this.previewEmail = document.getElementById('preview-email');
        this.previewPhone = document.getElementById('preview-phone');
        this.previewLinks = document.getElementById('preview-links');
        this.previewSummarySection = document.getElementById('preview-summary');
        this.previewSummaryText = document.getElementById('preview-summary-text');
        this.previewFocusTags = document.getElementById('preview-focus-tags');
        this.previewHighlightsSection = document.getElementById('preview-highlights');
        this.previewHighlightList = document.getElementById('preview-highlight-list');
        this.previewSkillsSection = document.getElementById('preview-skills');
        this.previewSkillsList = document.getElementById('preview-skills-list');
        this.previewExperienceSection = document.getElementById('preview-experience');
        this.previewExpList = document.getElementById('preview-experience-list');
        this.previewProjectsSection = document.getElementById('preview-projects');
        this.previewProjectsList = document.getElementById('preview-projects-list');
        this.previewEducationSection = document.getElementById('preview-education');
        this.previewEduList = document.getElementById('preview-education-list');
        this.previewCertSection = document.getElementById('preview-certifications');
        this.previewCertList = document.getElementById('preview-certification-list');
        this.previewLanguagesSection = document.getElementById('preview-languages');
        this.previewLanguageList = document.getElementById('preview-language-list');
        this.previewAdditionalSection = document.getElementById('preview-additional');
        this.previewAdditionalList = document.getElementById('preview-additional-list');
    }

    populateDefaults() {
        const personal = CVTemplateData.personal;
        if (this.nameInput) this.nameInput.value = personal.name;
        if (this.titleInput) this.titleInput.value = personal.title;
        if (this.locationInput) this.locationInput.value = personal.location;
        if (this.emailInput) this.emailInput.value = personal.email;
        if (this.phoneInput) this.phoneInput.value = personal.phone;
        if (this.linksInput) this.linksInput.value = `${personal.github}, ${personal.linkedin}`;
        if (this.summaryInput) this.summaryInput.value = CVTemplateData.summaries.general;
        if (this.skillsInput) {
            this.skillsInput.value = CVTemplateData.skills.technical.slice(0, 6).join(', ');
        }
        if (this.targetRoleSelect) this.targetRoleSelect.value = 'general';
        if (this.templateSelect) this.templateSelect.value = 'modern';
        if (this.statusMessage) this.statusMessage.textContent = '';
    }

    attachEventListeners() {
        const inputs = [
            this.nameInput,
            this.titleInput,
            this.locationInput,
            this.emailInput,
            this.phoneInput,
            this.linksInput,
            this.summaryInput,
            this.skillsInput,
            this.demosInput
        ].filter(Boolean);

        inputs.forEach((input) => {
            input.addEventListener('input', () => this.refreshPreview());
        });

        this.targetRoleSelect?.addEventListener('change', (event) => {
            const variant = event.target.value || 'general';
            this.setVariant(variant);
        });

        this.templateSelect?.addEventListener('change', (event) => {
            this.state.templateManuallySet = true;
            this.state.template = event.target.value || 'modern';
        });

        this.variantCards.forEach((card) => {
            card.addEventListener('click', () => this.setVariant(card.dataset.variant));
            card.addEventListener('keypress', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    this.setVariant(card.dataset.variant);
                }
            });
        });

        this.variantButtons.forEach((btn) => {
            btn.addEventListener('click', async (event) => {
                event.preventDefault();
                const variant = event.currentTarget.dataset.variant || 'general';
                const template = event.currentTarget.dataset.template || 'modern';
                await this.generateAndDownload({ variantKey: variant, template });
            });
        });

        this.customDownloadBtn?.addEventListener('click', async () => {
            await this.generateAndDownload({
                variantKey: this.state.activeVariant,
                template: this.templateSelect?.value || this.state.template || 'modern'
            });
        });

        this.resetBtn?.addEventListener('click', (event) => {
            event.preventDefault();
            this.state.templateManuallySet = false;
            this.resetForm();
        });
    }

    refreshPreview() {
        this.setVariant(this.state.activeVariant, { preserveCardState: true });
    }

    resetForm() {
        this.populateDefaults();
        this.refreshPreview();
        this.setStatus('Fields reset to template defaults.', 3000);
    }

    setStatus(message, timeout = 0) {
        if (!this.statusMessage) {
            return;
        }
        this.statusMessage.textContent = message;
        if (this.clearStatusTimer) {
            clearTimeout(this.clearStatusTimer);
        }
        if (timeout > 0) {
            this.clearStatusTimer = window.setTimeout(() => {
                this.statusMessage.textContent = '';
            }, timeout);
        }
    }

    setVariant(variantKey = 'general', options = {}) {
        const variant = CVTemplateData.roleVariants?.[variantKey] || CVTemplateData.roleVariants.general;
        this.state.activeVariant = variantKey;

        if (this.targetRoleSelect && !options.preserveCardState) {
            this.targetRoleSelect.value = variantKey;
        }

        if (this.templateSelect && !this.state.templateManuallySet && variant?.defaultTemplate) {
            this.templateSelect.value = variant.defaultTemplate;
            this.state.template = variant.defaultTemplate;
        }

        if (!options.preserveCardState) {
            this.variantCards.forEach((card) => {
                const isActive = card.dataset.variant === variantKey;
                card.classList.toggle('is-active', isActive);
                card.setAttribute('aria-selected', isActive ? 'true' : 'false');

                if (!card.dataset.shadow) {
                    card.dataset.shadow = card.style.boxShadow || '';
                }
                if (!card.dataset.border) {
                    card.dataset.border = card.style.border || '1px solid rgba(148, 163, 184, 0.25)';
                }

                if (isActive) {
                    card.style.border = `1px solid ${variant.accentColor || '#0ea5a4'}`;
                    card.style.boxShadow = '0 14px 32px rgba(14, 165, 164, 0.18)';
                } else {
                    card.style.border = card.dataset.border;
                    card.style.boxShadow = card.dataset.shadow;
                }
            });
            this.setStatus(`Preset switched to ${variant.label || 'Generalist'}.`, 2500);
        }

        const data = this.buildVariantData(variantKey);
        this.currentData = data;
        this.renderPreview(data);
    }

    getPersonalOverrides() {
        const overrides = {};
        if (this.nameInput?.value) overrides.name = this.nameInput.value.trim();
        if (this.titleInput?.value) overrides.title = this.titleInput.value.trim();
        if (this.locationInput?.value) overrides.location = this.locationInput.value.trim();
        if (this.emailInput?.value) overrides.email = this.emailInput.value.trim();
        if (this.phoneInput?.value) overrides.phone = this.phoneInput.value.trim();

        const links = (this.linksInput?.value || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        overrides.github = '';
        overrides.linkedin = '';
        overrides.portfolio = '';

        links.forEach((link) => {
            if (link.includes('github.com')) {
                overrides.github = link;
            } else if (link.includes('linkedin.com')) {
                overrides.linkedin = link;
            } else if (link.startsWith('http')) {
                overrides.portfolio = link;
            }
        });

        return overrides;
    }

    getSummaryOverride() {
        const value = this.summaryInput?.value?.trim();
        return value ? value : null;
    }

    getSkillsOverride() {
        const skills = (this.skillsInput?.value || '')
            .split(',')
            .map((skill) => skill.trim())
            .filter(Boolean);
        return skills.length > 0 ? skills : null;
    }

    getDemoLinks() {
        return (this.demosInput?.value || '')
            .split(',')
            .map((link) => link.trim())
            .filter(Boolean);
    }

    buildVariantData(variantKey) {
        const base = CVGeneratorHandler.clone(CVTemplateData);
        const variant = base.roleVariants?.[variantKey] || base.roleVariants.general;

        const personal = {
            ...base.personal,
            ...this.getPersonalOverrides()
        };

        const summaryOverride = this.getSummaryOverride();
        const summaryKey = variant.summaryKey || variantKey;
        const summaryText = summaryOverride || base.summaries[summaryKey] || base.summaries.general;

        const summaries = {
            ...base.summaries,
            general: summaryText
        };
        summaries[variantKey] = summaryText;

        const skillOverride = this.getSkillsOverride();
        const skills = {
            technical: skillOverride || variant.skillFocus || base.skills.technical,
            tools: variant.toolFocus || base.skills.tools,
            soft: variant.softSkills || base.skills.soft
        };

        let experience = base.experience;
        if (Array.isArray(variant.experienceIds)) {
            experience = experience.filter((item) => variant.experienceIds.includes(item.id));
        }
        if (Array.isArray(variant.includeExperienceIds)) {
            const additional = base.experience.filter((item) => variant.includeExperienceIds.includes(item.id));
            additional.forEach((item) => {
                if (!experience.find((existing) => existing.id === item.id)) {
                    experience.push(item);
                }
            });
        }
        if (variant.maxExperienceItems) {
            experience = experience.slice(0, variant.maxExperienceItems);
        }

        experience = experience.map((item) => {
            const override = variant.experienceOverrides?.[item.id];
            const descriptionSource = override?.description || item.description;
            const maxBullets = override?.maxBullets || variant.maxExperienceBullets;
            return {
                ...item,
                ...override,
                description: maxBullets ? descriptionSource.slice(0, maxBullets) : descriptionSource
            };
        });

        let projects = base.projects;
        if (Array.isArray(variant.projectIds)) {
            projects = projects.filter((project) => variant.projectIds.includes(project.id));
        }
        if (variant.maxProjects) {
            projects = projects.slice(0, variant.maxProjects);
        }

        const demoLinks = this.getDemoLinks();
        if (demoLinks.length > 0) {
            const customProjects = demoLinks.map((url, idx) => ({
                id: `custom-${idx}`,
                title: `Additional project ${idx + 1}`,
                description: `See more details: ${url}`,
                technologies: [],
                link: url,
                highlight: false
            }));
            projects = [...projects, ...customProjects];
        }

        let certifications = base.certifications;
        if (Array.isArray(variant.certificationIds)) {
            certifications = certifications.filter((cert) => variant.certificationIds.includes(cert.id));
        }

        const achievements = [];
        if (Array.isArray(base.achievements)) {
            if (Array.isArray(variant.achievementIds)) {
                variant.achievementIds.forEach((id) => {
                    const match = base.achievements.find((item) => item.id === id);
                    if (match) achievements.push(match);
                });
            } else {
                achievements.push(...base.achievements.slice(0, 3));
            }
        }

        const targetRoleInfo = base.targetRoles?.[variantKey];
        const preferences = {
            ...base.preferences,
            targetRole: targetRoleInfo?.title || variant.label,
            salaryExpectation: variant.salaryOverride || targetRoleInfo?.salary || base.preferences.salaryExpectation,
            focus: variant.focusAreas || targetRoleInfo?.focus || []
        };

        return {
            personal,
            summaries,
            skills,
            experience,
            education: base.education,
            certifications,
            projects,
            achievements,
            languages: base.languages,
            preferences,
            variantMeta: {
                label: variant.label,
                headline: variant.headline,
                focusAreas: variant.focusAreas,
                color: variant.primaryColor,
                accent: variant.accentColor,
                fileLabel: variant.fileLabel || variantKey,
                recommendedTemplate: variant.defaultTemplate || 'modern'
            }
        };
    }

    renderPreview(data) {
        if (!data) {
            return;
        }

        const variantMeta = data.variantMeta || {};
        const summary = data.summaries[this.state.activeVariant] || data.summaries.general;

        if (this.previewRoot) {
            this.previewRoot.style.border = `1px solid ${variantMeta.accent || '#e6e9ef'}`;
            this.previewRoot.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.1)';
        }

        if (this.previewName) this.previewName.textContent = data.personal.name || '';
        if (this.previewTitle) this.previewTitle.textContent = data.personal.title || '';
        if (this.previewVariantLabel) {
            this.previewVariantLabel.textContent = variantMeta.label || this.formatTemplateName(this.state.activeVariant);
            this.previewVariantLabel.style.color = variantMeta.accent || '#0ea5a4';
        }
        if (this.previewVariantHeadline) this.previewVariantHeadline.textContent = variantMeta.headline || '';
        if (this.previewLocation) this.previewLocation.textContent = data.personal.location || '';
        if (this.previewEmail) this.previewEmail.textContent = data.personal.email || '';
        if (this.previewPhone) this.previewPhone.textContent = data.personal.phone || '';
        if (this.previewLinks) this.previewLinks.textContent = this.buildLinksString(data.personal);

        if (this.previewSummaryText) this.previewSummaryText.textContent = summary || '';
        this.toggleSection(this.previewSummarySection, Boolean(summary));

        this.renderFocusTags(this.previewFocusTags, variantMeta.focusAreas || data.preferences.focus || [], variantMeta.accent);
        this.renderAchievements(this.previewHighlightList, data.achievements || []);
        this.toggleSection(this.previewHighlightsSection, (data.achievements || []).length > 0);

        this.renderSkillBadges(this.previewSkillsList, data.skills.technical || []);
        this.toggleSection(this.previewSkillsSection, (data.skills.technical || []).length > 0);

        this.renderExperience(this.previewExpList, data.experience || []);
        this.toggleSection(this.previewExperienceSection, (data.experience || []).length > 0);

        this.renderProjects(this.previewProjectsList, data.projects || []);
        this.toggleSection(this.previewProjectsSection, (data.projects || []).length > 0);

        this.renderEducation(this.previewEduList, data.education || []);
        this.toggleSection(this.previewEducationSection, (data.education || []).length > 0);

        this.renderCertifications(this.previewCertList, data.certifications || []);
        this.toggleSection(this.previewCertSection, (data.certifications || []).length > 0);

        this.renderLanguages(this.previewLanguageList, data.languages || []);
        this.toggleSection(this.previewLanguagesSection, (data.languages || []).length > 0);

        this.renderAdditionalInfo(this.previewAdditionalList, data.preferences || {});
        const additionalHasContent = this.previewAdditionalList?.childElementCount > 0;
        this.toggleSection(this.previewAdditionalSection, additionalHasContent);
    }

    renderFocusTags(container, tags, color) {
        if (!container) return;
        container.innerHTML = '';
        const palette = color || '#0ea5a4';
        tags.slice(0, 4).forEach((tag) => {
            const chip = document.createElement('span');
            chip.textContent = tag;
            chip.style.display = 'inline-flex';
            chip.style.alignItems = 'center';
            chip.style.padding = '4px 10px';
            chip.style.borderRadius = '999px';
            chip.style.background = 'rgba(14, 165, 164, 0.12)';
            chip.style.color = palette;
            chip.style.fontSize = '0.75rem';
            chip.style.fontWeight = '600';
            container.appendChild(chip);
        });
    }

    renderSkillBadges(container, skills) {
        if (!container) return;
        container.innerHTML = '';
        skills.slice(0, 8).forEach((skill) => {
            const badge = document.createElement('span');
            badge.textContent = skill;
            badge.style.display = 'inline-flex';
            badge.style.padding = '4px 10px';
            badge.style.margin = '0 6px 6px 0';
            badge.style.borderRadius = '999px';
            badge.style.background = '#f0f9ff';
            badge.style.color = '#0b3d91';
            badge.style.fontSize = '0.8rem';
            badge.style.fontWeight = '600';
            container.appendChild(badge);
        });
    }

    renderAchievements(container, achievements) {
        if (!container) return;
        container.innerHTML = '';
        achievements.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item.text || item;
            li.style.marginBottom = '4px';
            container.appendChild(li);
        });
    }

    renderExperience(container, experience) {
        if (!container) return;
        container.innerHTML = '';
        experience.forEach((exp) => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';
            wrapper.style.paddingBottom = '10px';
            wrapper.style.borderBottom = '1px dashed #e2e8f0';

            const title = document.createElement('div');
            title.textContent = `${exp.role} — ${exp.company}`;
            title.style.fontWeight = '600';
            title.style.fontSize = '0.95rem';
            wrapper.appendChild(title);

            if (exp.dates) {
                const dates = document.createElement('div');
                dates.textContent = exp.dates;
                dates.style.fontSize = '0.85rem';
                dates.style.color = '#64748b';
                dates.style.marginTop = '2px';
                wrapper.appendChild(dates);
            }

            if (Array.isArray(exp.description) && exp.description.length > 0) {
                const list = document.createElement('ul');
                list.style.margin = '6px 0 0';
                list.style.paddingInlineStart = '20px';
                exp.description.forEach((line) => {
                    const li = document.createElement('li');
                    li.textContent = line;
                    list.appendChild(li);
                });
                wrapper.appendChild(list);
            }

            container.appendChild(wrapper);
        });
    }

    renderEducation(container, education) {
        if (!container) return;
        container.innerHTML = '';
        education.forEach((edu) => {
            const wrapper = document.createElement('div');
            wrapper.style.marginBottom = '10px';

            const degree = document.createElement('div');
            degree.textContent = edu.degree;
            degree.style.fontWeight = '600';
            degree.style.fontSize = '0.95rem';
            wrapper.appendChild(degree);

            const school = document.createElement('div');
            school.textContent = edu.institution;
            school.style.color = '#64748b';
            school.style.fontSize = '0.85rem';
            wrapper.appendChild(school);

            if (edu.dates) {
                const dates = document.createElement('div');
                dates.textContent = edu.dates;
                dates.style.color = '#94a3b8';
                dates.style.fontSize = '0.82rem';
                wrapper.appendChild(dates);
            }

            container.appendChild(wrapper);
        });
    }

    renderProjects(container, projects) {
        if (!container) return;
        container.innerHTML = '';
        projects.slice(0, 4).forEach((project) => {
            const block = document.createElement('div');
            block.style.marginBottom = '8px';

            const title = document.createElement('a');
            title.textContent = project.title;
            title.href = project.link || '#';
            title.target = '_blank';
            title.rel = 'noopener';
            title.style.color = '#0b3d91';
            title.style.fontWeight = '600';
            block.appendChild(title);

            if (project.description) {
                const desc = document.createElement('div');
                desc.textContent = project.description;
                desc.style.color = '#475569';
                desc.style.fontSize = '0.9rem';
                desc.style.marginTop = '2px';
                block.appendChild(desc);
            }

            if (project.technologies && project.technologies.length > 0) {
                const stack = document.createElement('div');
                stack.textContent = project.technologies.join(', ');
                stack.style.color = '#94a3b8';
                stack.style.fontSize = '0.82rem';
                stack.style.marginTop = '2px';
                block.appendChild(stack);
            }

            container.appendChild(block);
        });
    }

    renderCertifications(container, certifications) {
        if (!container) return;
        container.innerHTML = '';
        certifications.forEach((cert) => {
            const li = document.createElement('li');
            li.textContent = `${cert.name} — ${cert.issuer} (${cert.date})`;
            li.style.marginBottom = '4px';
            container.appendChild(li);
        });
    }

    renderLanguages(container, languages) {
        if (!container) return;
        container.innerHTML = '';
        languages.forEach((lang) => {
            const tag = document.createElement('span');
            tag.textContent = `${lang.name}: ${lang.level}`;
            tag.style.display = 'inline-flex';
            tag.style.padding = '4px 10px';
            tag.style.margin = '0 6px 6px 0';
            tag.style.borderRadius = '999px';
            tag.style.background = '#f8fafc';
            tag.style.color = '#1e293b';
            tag.style.fontSize = '0.78rem';
            container.appendChild(tag);
        });
    }

    renderAdditionalInfo(container, preferences) {
        if (!container) return;
        container.innerHTML = '';

        const items = [];
        if (preferences.targetRole) items.push(`Target role: ${preferences.targetRole}`);
        if (preferences.salaryExpectation) items.push(`Compensation: ${preferences.salaryExpectation}`);
        if (preferences.availability) items.push(`Availability: ${preferences.availability}`);
        if (preferences.workMode) items.push(`Work mode: ${preferences.workMode}`);
        if (preferences.noticeperiod) items.push(`Notice period: ${preferences.noticeperiod}`);
        if (preferences.timezone) items.push(`Timezone: ${preferences.timezone}`);
        if (preferences.relocation) items.push(`Relocation: ${preferences.relocation}`);

        items.forEach((item) => {
            const li = document.createElement('li');
            li.textContent = item;
            li.style.marginBottom = '4px';
            container.appendChild(li);
        });
    }

    toggleSection(section, hasContent) {
        if (!section) return;
        section.style.display = hasContent ? '' : 'none';
    }

    buildLinksString(personal) {
        const links = [];
        if (personal.github) links.push(this.stripProtocol(personal.github));
        if (personal.linkedin) links.push(this.stripProtocol(personal.linkedin));
        if (personal.portfolio) links.push(this.stripProtocol(personal.portfolio));
        return links.join(' • ');
    }

    stripProtocol(link) {
        return link ? link.replace(/^https?:\/\//, '').replace(/\/$/, '') : '';
    }

    formatTemplateName(name) {
        if (!name) return '';
        return name
            .split('_')
            .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
            .join(' ');
    }

    async generateAndDownload({ variantKey, template }) {
        if (this.state.isGenerating) {
            return;
        }

        this.state.isGenerating = true;
        this.setStatus('Generating CV PDF…');

        try {
            const data = this.buildVariantData(variantKey);
            const variantConfig = CVTemplateData.roleVariants?.[variantKey] || CVTemplateData.roleVariants.general;
            const templateToUse = template || variantConfig.defaultTemplate || this.state.template || 'modern';

            const generator = new CVPDFGenerator(data, {
                targetRole: variantKey,
                template: templateToUse,
                color: variantConfig.primaryColor || '#0b3d91',
                accentColor: variantConfig.accentColor || '#0ea5a4'
            });

            const pdf = await generator.generatePDF();
            const safeName = data.personal.name.replace(/\s+/g, '_');
            const label = variantConfig.fileLabel || variantKey;
            const filename = `${safeName}_${label}_${templateToUse}_CV_${new Date().getFullYear()}.pdf`;
            generator.downloadPDF(pdf, filename);

            this.setStatus(`Ready — downloaded ${variantConfig.label || 'CV'} (${this.formatTemplateName(templateToUse)}).`, 5000);
        } catch (error) {
            console.error('Error generating PDF:', error);
            this.setStatus('Failed to generate CV. Please try again.', 5000);
        } finally {
            this.state.isGenerating = false;
        }
    }

    static clone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new CVGeneratorHandler();
    });
} else {
    new CVGeneratorHandler();
}
