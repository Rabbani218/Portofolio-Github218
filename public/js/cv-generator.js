/**
 * CV Generator Bundle
 * Combines data template, PDF generator, browser handler, and CLI utilities
 * into a single module that works in both browser and Node environments.
 */
(()=>{
    const isNode = typeof module !== 'undefined' && module.exports;
    const globalScope = typeof window !== 'undefined' ? window : globalThis;

    let PDFDocument;
    let fs;
    let path;
    let browserPdfLoader = null;

    function ensureNodeDeps(){
        if(!isNode){
            throw new Error('Node-only dependencies requested in a browser context.');
        }
        if(!PDFDocument){
            const req = require;
            PDFDocument = req('pdfkit');
            fs = req('fs');
            path = req('path');
        }
    }

    function ensureBrowserPdfLib(){
        if(isNode){
            return Promise.resolve();
        }
        if(globalScope.jspdf && globalScope.jspdf.jsPDF){
            return Promise.resolve(globalScope.jspdf);
        }
        if(browserPdfLoader){
            return browserPdfLoader;
        }
        if(typeof document === 'undefined'){
            return Promise.reject(new Error('Document context unavailable for jsPDF initialisation.'));
        }
        browserPdfLoader = new Promise((resolve,reject)=>{
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jspdf@2.5.1/dist/jspdf.umd.min.js';
            script.async = true;
            script.crossOrigin = 'anonymous';
            script.onload = ()=>{
                if(globalScope.jspdf && globalScope.jspdf.jsPDF){
                    resolve(globalScope.jspdf);
                }else{
                    browserPdfLoader = null;
                    reject(new Error('jsPDF loaded but no constructor found.'));
                }
            };
            script.onerror = ()=>{
                browserPdfLoader = null;
                reject(new Error('Failed to load jsPDF library.'));
            };
            document.head.appendChild(script);
        });
        return browserPdfLoader;
    }

    const KNOWN_SECTION_HEADERS = ['Contact','Summary','Skills','Experience & Projects','Experience','Projects','Education','Certifications','Note'];

    function parseCvSections(content){
        const lines = content.split(/\r?\n/).map((line)=>line.replace(/\r/g,'').trim());
        const sections = {};
        let cursor = 'header';
        sections[cursor] = [];
        for(const line of lines){
            if(!line){
                sections[cursor].push('');
                continue;
            }
            if(KNOWN_SECTION_HEADERS.includes(line)){
                cursor = line;
                sections[cursor] = sections[cursor] || [];
                continue;
            }
            sections[cursor].push(line);
        }
        return sections;
    }

    function buildPdf(sections, outputPath){
        ensureNodeDeps();
        return new Promise((resolve,reject)=>{
            const doc = new PDFDocument({ size:'A4', margin:50 });
            const writeStream = fs.createWriteStream(outputPath);
            doc.pipe(writeStream);

            function writeHeading(text){
                doc.moveDown(0.4);
                doc.font('Helvetica-Bold').fontSize(12).fillColor('#111827').text(text);
                doc.moveDown(0.15);
                doc.font('Helvetica').fontSize(10).fillColor('black');
            }

            const header = sections.header || [];
            const name = header[0] || 'Name';
            const subtitle = header[1] || '';
            doc.font('Helvetica-Bold').fontSize(18).fillColor('#111827').text(name);
            if(subtitle){
                doc.font('Helvetica').fontSize(10).fillColor('#374151').text(subtitle);
            }
            doc.moveDown(0.2);

            const contactSection = sections.Contact || [];
            const contact = contactSection.filter(Boolean).join(' · ');
            if(contact){
                doc.font('Helvetica').fontSize(9).fillColor('#111827').text(contact);
                doc.moveDown(0.4);
            }

            const summary = (sections.Summary || []).join(' ');
            if(summary){
                writeHeading('Summary');
                doc.font('Helvetica').fontSize(10).fillColor('#111827').text(summary,{ width:500, lineGap:2 });
            }

            const skills = (sections.Skills || []).join(', ').replace(/[-•*]\s*/g,'');
            if(skills){
                writeHeading('Skills');
                doc.font('Helvetica').fontSize(10).fillColor('#111827').text(skills,{ width:500, lineGap:2 });
            }

            const expSrc = sections['Experience & Projects'] || sections.Experience || sections.Projects || [];
            if(expSrc.length){
                writeHeading('Experience');
                for(let i=0;i<expSrc.length;i++){
                    const line = expSrc[i];
                    if(!line){
                        continue;
                    }
                    if(line.startsWith('-')){
                        const text = line.replace(/^[-]\s*/, '');
                        doc.font('Helvetica-Bold').fontSize(10).fillColor('#111827').text(text.split(':')[0]);
                        doc.moveDown(0.08);
                        doc.font('Helvetica').fontSize(10).fillColor('#111827').text(text);
                        doc.moveDown(0.2);
                    }else{
                        doc.font('Helvetica').fontSize(10).fillColor('#111827').text(line);
                        doc.moveDown(0.12);
                    }
                }
            }

            const education = sections.Education || [];
            if(education.length){
                writeHeading('Education');
                education.forEach((line)=>{
                    if(!line){
                        return;
                    }
                    doc.font('Helvetica').fontSize(10).fillColor('#111827').text(line);
                    doc.moveDown(0.08);
                });
            }

            const certifications = sections.Certifications || [];
            if(certifications.length){
                writeHeading('Certifications');
                certifications.forEach((line)=>{
                    if(line){
                        doc.font('Helvetica').fontSize(10).fillColor('#111827').text(line);
                    }
                });
            }

            doc.end();

            writeStream.on('finish',()=>resolve(outputPath));
            writeStream.on('error',reject);
        });
    }

    function buildRtf(sections, outputPath){
        ensureNodeDeps();
        function rtfEscape(value){
            return value.replace(/\\/g,'\\\\').replace(/\{/g,'\\{').replace(/\}/g,'\\}');
        }

        let rtf = '{\\rtf1\\ansi\\deff0\n';
        const header = sections.header || [];
        const nonEmptyHeader = header.filter(Boolean);
        const name = nonEmptyHeader[0] || 'Name';
        const subtitle = nonEmptyHeader[1] || '';

        rtf += `\\b ${rtfEscape(name)} \\b0\\line\n`;
        if(subtitle){
            rtf += `${rtfEscape(subtitle)}\\line\\line\n`;
        }

        function appendSection(title, items){
            if(!items || !items.length){
                return;
            }
            rtf += `\\b ${rtfEscape(title)} \\b0\\line\n`;
            items.forEach((item)=>{
                if(!item){
                    return;
                }
                if(item.startsWith('-')){
                    rtf += `\\tab\\bullet\\tab ${rtfEscape(item.replace(/^[-]\s*/, ''))}\\line\n`;
                }else{
                    rtf += `${rtfEscape(item)}\\line\n`;
                }
            });
            rtf += '\\line\n';
        }

        appendSection('Contact', sections.Contact);
        appendSection('Summary', sections.Summary);
        appendSection('Skills', sections.Skills);
        appendSection('Experience', sections['Experience & Projects'] || sections.Experience || sections.Projects);
        appendSection('Education', sections.Education);
        appendSection('Certifications', sections.Certifications);

        rtf += '}\n';
        fs.writeFileSync(outputPath, rtf, 'utf8');
        return outputPath;
    }

    async function generateDocumentsFromText(options={}){
        if(!isNode){
            throw new Error('generateDocumentsFromText is only available in Node.');
        }
        ensureNodeDeps();
        const config = typeof options === 'string' ? { inputPath: options } : { ...options };
        const baseDir = config.baseDir ? path.resolve(config.baseDir) : path.resolve(__dirname, '..');
        const inputPath = config.inputPath ? path.resolve(config.inputPath) : path.join(baseDir, 'assets', 'Rabbani_CV_2025.txt');
        const pdfOutputPath = config.pdfOutputPath ? path.resolve(config.pdfOutputPath) : path.join(baseDir, 'assets', 'Rabbani_CV_2025.pdf');
        const rtfOutputPath = config.rtfOutputPath ? path.resolve(config.rtfOutputPath) : path.join(baseDir, 'assets', 'Rabbani_CV_2025.rtf');

        if(!fs.existsSync(inputPath)){
            throw new Error(`Input text CV not found at ${inputPath}`);
        }

        const content = fs.readFileSync(inputPath, 'utf8');
        const sections = parseCvSections(content);

        await buildPdf(sections, pdfOutputPath);
        buildRtf(sections, rtfOutputPath);

        return { pdfPath: pdfOutputPath, rtfPath: rtfOutputPath };
    }

    const CVTemplateData = {
        personal: {
            name: 'Muhammad Abdurrahman Rabbani',
            title: 'Data Analyst · Full‑Stack Developer · AI Engineer',
            location: 'Depok, West Java, Indonesia',
            email: 'Rabbani.office1806@gmail.com',
            phone: '+62 813-8992-2040',
            website: 'https://portfolio-rabbani06-main.vercel.app/',
            github: 'https://github.com/Rabbani218',
            linkedin: 'https://www.linkedin.com/in/muhammad-abdurrahman-rabbani-78b208346',
            portfolio: 'https://portfolio-rabbani06-main.vercel.app/',
            languages: ['Indonesian (Native)', 'English (Professional)', 'Japanese (Beginner)']
        },

        summaries: {
            general: 'Informatics undergraduate combining technical engineering skills with entrepreneurial experience. Specialized in data-driven decision making, building production-ready solutions, and delivering measurable business impact. Proven track record in leading cross-functional teams and shipping scalable projects from concept to deployment.',
            data_scientist: 'Data-driven engineer with expertise in statistical analysis, machine learning, and data pipeline architecture. Skilled in Python, SQL, and cloud technologies. Demonstrated ability to translate complex data into actionable business insights and build predictive models that improve operational efficiency.',
            fullstack: 'Full‑stack developer proficient in modern web technologies (React, Node.js, Express) with strong backend engineering practices. Experienced in building scalable APIs, designing optimal database schemas, and delivering high-quality user interfaces. Committed to clean code, documentation, and DevOps best practices.',
            ai_engineer: 'AI/ML engineer focused on practical model development and deployment. Skilled in PyTorch, scikit-learn, and production ML systems. Experienced in building evaluation pipelines, model optimization, and integrating AI solutions into production environments for real-world impact.'
        },

        skills: {
            technical: [
                'Python (pandas, numpy, scikit-learn, PyTorch)',
                'SQL & Database Design (MySQL, PostgreSQL)',
                'Data Analytics & Visualization (Power BI, Tableau)',
                'Machine Learning & Statistical Analysis',
                'Web Development (HTML, CSS, JavaScript, React)',
                'Backend Development (Node.js, Express)',
                'REST APIs & Microservices',
                'Docker & Containerization',
                'Git & Version Control',
                'ETL & Data Pipeline'
            ],
            tools: [
                'VS Code, Jupyter Notebook, Git',
                'Microsoft 365 (Copilot, Excel, Power BI)',
                'Figma, Postman',
                'Linux/Ubuntu, AWS Basics'
            ],
            soft: [
                'Leadership & Team Management',
                'Project Management & Agile',
                'Business Communication',
                'Data-Driven Problem Solving',
                'Cross-functional Collaboration',
                'Entrepreneurship & Innovation'
            ]
        },

        experience: [
            {
                id: 'colorweave_ceo',
                role: 'CEO & Project Lead',
                company: 'Colorweave',
                dates: 'Jan 2025 – Present',
                location: 'Jakarta, Indonesia',
                description: [
                    'Led cross-functional team of 5 members through full product lifecycle from ideation to market launch.',
                    'Developed and executed comprehensive business model canvas and go-to-market strategy.',
                    'Architected e-commerce platform launch on Shopee with integrated payment systems.',
                    'Achieved 150+ early customers and positive unit economics in the first month.',
                    'Managed resource allocation, stakeholder communication, and product roadmap prioritization.'
                ]
            },
            {
                id: 'db_architect',
                role: 'Database Architect & Developer',
                company: 'E-Commerce Platform Project',
                dates: 'Dec 2024 – Jan 2025',
                location: 'Universitas Bina Sarana Informatika',
                description: [
                    'Designed and implemented normalized MySQL schema supporting 10,000+ products and transactions.',
                    'Optimized query performance achieving 60% reduction in average response time.',
                    'Created comprehensive data dictionary and documentation for development team.',
                    'Mentored junior developers on database design principles and SQL best practices.',
                    'Implemented data integrity constraints and automated backup procedures.'
                ]
            },
            {
                id: 'data_bi_intern',
                role: 'Data Analysis & Business Intelligence Intern',
                company: 'Academic Research Project',
                dates: 'Sep 2024 – Nov 2024',
                location: 'Depok, West Java',
                description: [
                    'Analyzed 50,000+ data points to identify business trends and customer behavior patterns.',
                    'Created interactive dashboards reducing manual reporting time by 40%.',
                    'Developed predictive models improving forecast accuracy to 85%.',
                    'Presented insights to stakeholders leading to strategic business decisions.'
                ]
            }
        ],

        education: [
            {
                degree: 'Bachelor of Informatics (B.Sc. Informatics)',
                institution: 'Universitas Bina Sarana Informatika (UBSI)',
                dates: '2024 – 2028 (Expected)',
                location: 'Jakarta, Indonesia',
                highlights: [
                    'Focus: Data Science, Full‑Stack Development & AI/ML',
                    'Relevant Coursework: Database Design, Web Development, Data Structures, Algorithms',
                    'Current GPA: 3.6/4.0'
                ]
            },
            {
                degree: 'Senior High School Diploma',
                institution: 'SMAS Yapemri Depok',
                dates: '2021 – 2024',
                location: 'Depok, West Java',
                highlights: [
                    'Major: Mathematics and Natural Sciences (MIPA)',
                    'Honors: Computer Club Lead, Programming Competition Participant',
                    'Achievements: Foundation in HTML, Python, and Computer Fundamentals'
                ]
            }
        ],

        certifications: [
            {
                id: 'data_science_foundation',
                name: 'Data Science Foundation',
                issuer: 'Jobstreet by Seek',
                date: 'Dec 2024',
                credentialId: 'JOB-DS-2024-12345',
                credentialUrl: '#'
            },
            {
                id: 'copilot_foundation',
                name: 'Microsoft 365 Copilot Foundation',
                issuer: 'Microsoft Learn',
                date: 'Nov 2024',
                credentialId: 'MS-CP-2024-67890',
                credentialUrl: '#'
            },
            {
                id: 'google_analytics',
                name: 'Google Analytics Certification',
                issuer: 'Google (In Progress)',
                date: 'Expected Jan 2025',
                credentialId: 'GA-2025-01234',
                credentialUrl: '#'
            }
        ],

        projects: [
            {
                id: 'colorweave_platform',
                title: 'Colorweave E-Commerce Platform',
                description: 'Full-stack e-commerce solution with MySQL, Node.js, and React. Integrated Shopee API for multi-channel selling.',
                technologies: ['MySQL', 'Node.js', 'React', 'Express', 'Shopee API'],
                link: 'https://github.com/Rabbani218/colorweave',
                highlight: true
            },
            {
                id: 'portfolio_dashboard',
                title: 'Portfolio Analytics Dashboard',
                description: 'Real-time analytics dashboard synced with GitHub data showing project metrics, language distribution, and contribution trends.',
                technologies: ['JavaScript', 'GitHub API', 'Chart.js', 'D3.js'],
                link: 'https://github.com/Rabbani218/portfolio-analytics',
                highlight: true
            },
            {
                id: 'smart_pipeline',
                title: 'Smart Data Pipeline',
                description: 'Automated ETL pipeline processing 100K+ records daily with data validation, transformation, and warehouse loading.',
                technologies: ['Python', 'Pandas', 'SQL', 'Apache Airflow'],
                link: 'https://github.com/Rabbani218/data-pipeline',
                highlight: false
            }
        ],

        achievements: [
            {
                id: 'team_leadership',
                text: 'Led Colorweave cross-functional squad from concept to launch, onboarding 150+ early adopters within the first month.'
            },
            {
                id: 'pipeline_automation',
                text: 'Delivered automated ETL pipeline processing 100K+ records daily with validation checks and zero failed runs during pilot.'
            },
            {
                id: 'performance_optimization',
                text: 'Reduced database query response times by 60% via schema optimisation, indexing, and caching strategies.'
            },
            {
                id: 'analytics_adoption',
                text: 'Shipped analytics dashboards that cut manual reporting by ~40% and guided marketing and product decisions.'
            }
        ],

        languages: [
            { name: 'Indonesian', level: 'Native' },
            { name: 'English', level: 'Professional Working Proficiency (B2)' },
            { name: 'Japanese', level: 'Elementary Proficiency (A2)' }
        ],

        targetRoles: {
            data_scientist: {
                title: 'Data Scientist / ML Engineer',
                salary: '60M - 100M IDR / $4,000 - $7,000 USD',
                focus: ['Machine Learning', 'Statistical Analysis', 'Data Pipeline Architecture']
            },
            fullstack: {
                title: 'Full-Stack Developer',
                salary: '50M - 80M IDR / $3,500 - $5,500 USD',
                focus: ['Backend Development', 'API Design', 'Database Architecture']
            },
            ai_engineer: {
                title: 'AI Engineer / ML Research',
                salary: '70M - 120M IDR / $5,000 - $8,500 USD',
                focus: ['Model Development', 'Production ML', 'AI Research']
            },
            general: {
                title: 'Software Engineer / Data Analyst',
                salary: '45M - 75M IDR / $3,000 - $5,000 USD',
                focus: ['Full-Stack Development', 'Data Analysis', 'System Design']
            }
        },

        preferences: {
            availability: 'Immediately Available',
            workMode: 'Open to Remote, Hybrid, and On-site',
            noticeperiod: 'Available to start immediately',
            sponsorship: 'No visa sponsorship required (local)',
            relocation: 'Willing to relocate for the right opportunity',
            dailyHours: 8,
            timezone: 'WIB (UTC+7)',
            experience: 'Entry-level to Mid-level (2 years equivalent)',
            salaryExpectation: 'Negotiable based on role and location'
        },

        roleVariants: {
            general: {
                label: 'Hybrid Software & Data',
                headline: 'Balanced profile for fast-moving teams needing software and analytics execution.',
                summaryKey: 'general',
                focusAreas: ['Full-stack delivery', 'Data storytelling', 'Team leadership'],
                skillFocus: [
                    'Python (pandas, numpy, scikit-learn)',
                    'SQL & Database Design (MySQL, PostgreSQL)',
                    'React & modern front-end engineering',
                    'Node.js & Express APIs',
                    'Docker & containerization',
                    'Product & stakeholder leadership'
                ],
                experienceIds: ['colorweave_ceo', 'db_architect', 'data_bi_intern'],
                maxExperienceBullets: 4,
                achievementIds: ['team_leadership', 'performance_optimization', 'analytics_adoption'],
                projectIds: ['colorweave_platform', 'portfolio_dashboard'],
                certificationIds: ['data_science_foundation', 'copilot_foundation'],
                maxProjects: 3,
                defaultTemplate: 'modern',
                primaryColor: '#0b3d91',
                accentColor: '#0ea5a4',
                fileLabel: 'general'
            },
            data_scientist: {
                label: 'Data & BI Focus',
                headline: 'Highlights analytics, experimentation, and business insight delivery.',
                summaryKey: 'data_scientist',
                focusAreas: ['Analytics engineering', 'Predictive modeling', 'Decision automation'],
                skillFocus: [
                    'Python (pandas, scikit-learn, statsmodels)',
                    'SQL optimisation & warehousing',
                    'Data visualization (Power BI, Tableau)',
                    'ETL orchestration & automation',
                    'Experiment design & A/B testing',
                    'Business storytelling & stakeholder comms'
                ],
                experienceIds: ['data_bi_intern', 'colorweave_ceo', 'db_architect'],
                experienceOverrides: {
                    colorweave_ceo: {
                        description: [
                            'Instrumented product analytics and defined core KPIs for Colorweave launch.',
                            'Translated customer insights into backlog priorities that unlocked 150+ paying users.',
                            'Used data-led experiments to validate pricing and marketing promotions.'
                        ],
                        maxBullets: 3
                    }
                },
                maxExperienceBullets: 3,
                achievementIds: ['pipeline_automation', 'analytics_adoption', 'team_leadership'],
                projectIds: ['portfolio_dashboard', 'smart_pipeline'],
                certificationIds: ['data_science_foundation', 'google_analytics'],
                maxProjects: 3,
                defaultTemplate: 'classic',
                primaryColor: '#0b3d91',
                accentColor: '#60a5fa',
                fileLabel: 'data_science'
            },
            fullstack: {
                label: 'Full-Stack Engineering',
                headline: 'Centres backend architecture, APIs, and delivery velocity.',
                summaryKey: 'fullstack',
                focusAreas: ['Backend architecture', 'API & integration design', 'Front-end delivery'],
                skillFocus: [
                    'Node.js, Express & REST API design',
                    'React & component-driven UI development',
                    'Database performance tuning (MySQL, PostgreSQL)',
                    'DevOps fundamentals (Docker, CI/CD)',
                    'Testing & observability practices',
                    'Documentation & team collaboration'
                ],
                experienceIds: ['db_architect', 'colorweave_ceo'],
                includeExperienceIds: ['data_bi_intern'],
                experienceOverrides: {
                    db_architect: {
                        description: [
                            'Designed normalized MySQL schema scaling to 10k+ products and transactions.',
                            'Implemented query optimizations cutting response time by 60%.',
                            'Documented data dictionary and onboarding guides for developers.',
                            'Automated backup and monitoring scripts to harden reliability.'
                        ]
                    }
                },
                maxExperienceBullets: 4,
                achievementIds: ['performance_optimization', 'team_leadership'],
                projectIds: ['colorweave_platform', 'smart_pipeline'],
                certificationIds: ['copilot_foundation'],
                maxProjects: 3,
                defaultTemplate: 'modern',
                primaryColor: '#0b3d91',
                accentColor: '#60a5fa',
                fileLabel: 'fullstack'
            },
            ai_engineer: {
                label: 'AI & ML Engineering',
                headline: 'Optimised for experimentation, evaluation, and lightweight deployment.',
                summaryKey: 'ai_engineer',
                focusAreas: ['Model prototyping', 'Evaluation pipelines', 'ML deployment'],
                skillFocus: [
                    'PyTorch & scikit-learn experimentation',
                    'Model evaluation & tracking (MLflow style)',
                    'FastAPI / Flask model serving',
                    'Vector databases & embeddings',
                    'Data versioning & reproducibility',
                    'Cloud deployment basics (AWS/GCP)'
                ],
                experienceIds: ['data_bi_intern', 'colorweave_ceo'],
                includeExperienceIds: ['db_architect'],
                maxExperienceBullets: 3,
                achievementIds: ['pipeline_automation', 'analytics_adoption'],
                projectIds: ['smart_pipeline', 'portfolio_dashboard'],
                certificationIds: ['data_science_foundation', 'google_analytics'],
                maxProjects: 3,
                defaultTemplate: 'bold',
                primaryColor: '#0b3d91',
                accentColor: '#f97316',
                fileLabel: 'ai_ml'
            }
        }
    };

    class CVPDFGenerator {
        constructor(cvData, options = {}){
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

        async generatePDF(){
            if(!isNode){
                await ensureBrowserPdfLib();
            }
            const jspdfLib = globalScope.jspdf;
            if(!jspdfLib || !jspdfLib.jsPDF){
                throw new Error('jsPDF library not found. Include jsPDF before using CVPDFGenerator.');
            }
            const { jsPDF } = jspdfLib;
            const pdf = new jsPDF({ orientation:'portrait', unit:'mm', format:'a4' });
            pdf.setProperties({
                title: `CV - ${this.cvData.personal.name}`,
                subject: 'Professional CV',
                author: this.cvData.personal.name,
                keywords: 'CV, Resume, Professional',
                creator: 'Portfolio CV Generator'
            });
            const templateMethod = `render${this.capitalizeFirstLetter(this.options.template)}Template`;
            if(typeof this[templateMethod] === 'function'){
                await this[templateMethod].call(this, pdf);
            }else{
                this.renderModernTemplate(pdf);
            }
            return pdf;
        }

        renderModernTemplate(pdf){
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 15;
            const margin = 12;
            const contentWidth = pageWidth - (margin * 2);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.dark);
            this.renderHeader(pdf, margin, yPosition);
            yPosition += 20;
            if(this.cvData.summaries){
                const summary = this.cvData.summaries[this.options.targetRole] || this.cvData.summaries.general;
                yPosition = this.renderSection(pdf, 'PROFESSIONAL SUMMARY', summary, margin, yPosition, contentWidth, 8);
                yPosition += 3;
            }
            yPosition = this.renderAchievementsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            yPosition = this.renderSkillsSection(pdf, margin, yPosition, contentWidth);
            yPosition += 3;
            yPosition = this.renderExperienceSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            yPosition = this.renderProjectsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            yPosition = this.renderEducationSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            yPosition = this.renderCertificationsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            yPosition = this.renderLanguagesSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 3;
            this.renderPreferencesSection(pdf, margin, yPosition, contentWidth, pageHeight);
            this.renderFooter(pdf, pageHeight);
        }

        renderClassicTemplate(pdf){
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 15;
            const margin = 12;
            const contentWidth = pageWidth - (margin * 2);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.dark);
            this.renderHeaderClassic(pdf, margin, yPosition);
            yPosition += 18;
            if(this.cvData.summaries){
                const summary = this.cvData.summaries[this.options.targetRole] || this.cvData.summaries.general;
                yPosition = this.renderSectionClassic(pdf, 'PROFESSIONAL PROFILE', summary, margin, yPosition, contentWidth);
                yPosition += 2;
            }
            yPosition = this.renderAchievementsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderExperienceSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderProjectsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderEducationSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderSkillsSectionClassic(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            this.renderPreferencesSection(pdf, margin, yPosition, contentWidth, pageHeight);
            this.renderFooter(pdf, pageHeight);
        }

        renderMinimalTemplate(pdf){
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 12;
            const margin = 14;
            const contentWidth = pageWidth - (margin * 2);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.dark);
            this.renderHeaderMinimal(pdf, margin, yPosition);
            yPosition += 16;
            yPosition = this.renderAchievementsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderExperienceMinimal(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderProjectsSection(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderEducationMinimal(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            yPosition = this.renderSkillsMinimal(pdf, margin, yPosition, contentWidth, pageHeight);
            yPosition += 2;
            this.renderPreferencesSection(pdf, margin, yPosition, contentWidth, pageHeight);
            this.renderFooter(pdf, pageHeight);
        }

        renderBoldTemplate(pdf){
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let yPosition = 12;
            const margin = 12;
            const contentWidth = pageWidth - (margin * 2);
            pdf.setFillColor(parseInt(this.colors.primary.slice(1,3),16), parseInt(this.colors.primary.slice(3,5),16), parseInt(this.colors.primary.slice(5,7),16));
            pdf.rect(0, 0, 50, pageHeight, 'F');
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(8);
            pdf.setTextColor(255,255,255);
            pdf.text('CONTACT', 8, 20);
            pdf.setFontSize(9);
            pdf.setFont('Helvetica','normal');
            const contactLines = [this.cvData.personal.email,this.cvData.personal.phone,this.cvData.personal.location];
            contactLines.forEach((line,idx)=>{
                pdf.text(line,8,26+(idx*8),{ maxWidth:35 });
            });
            const mainMargin = 60;
            const mainContentWidth = pageWidth - mainMargin - 12;
            pdf.setTextColor(this.colors.dark);
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(18);
            pdf.text(this.cvData.personal.name, mainMargin, 20);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.primary);
            pdf.text(this.cvData.personal.title, mainMargin, 28);
            let yPos = 38;
            if(this.cvData.summaries){
                const summary = this.cvData.summaries[this.options.targetRole] || this.cvData.summaries.general;
                yPos = this.renderSection(pdf, 'SUMMARY', summary, mainMargin, yPos, mainContentWidth, 8, pageHeight);
            }
            yPos += 4;
            yPos = this.renderAchievementsSection(pdf, mainMargin, yPos, mainContentWidth, pageHeight);
            yPos += 2;
            yPos = this.renderExperienceSection(pdf, mainMargin, yPos, mainContentWidth, pageHeight);
            yPos += 2;
            yPos = this.renderProjectsSection(pdf, mainMargin, yPos, mainContentWidth, pageHeight);
            yPos += 2;
            yPos = this.renderSkillsSection(pdf, mainMargin, yPos, mainContentWidth, pageHeight);
            yPos += 2;
            this.renderPreferencesSection(pdf, mainMargin, yPos, mainContentWidth, pageHeight);
            this.renderFooter(pdf, pageHeight);
        }

        renderHeader(pdf,x,y){
            const pageWidth = pdf.internal.pageSize.getWidth();
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(22);
            pdf.setTextColor(this.colors.primary);
            pdf.text(this.cvData.personal.name, x, y);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.accent);
            pdf.text(this.cvData.personal.title, x, y+8);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.muted);
            const contactX = pageWidth - x - 60;
            const contactInfo = [this.cvData.personal.email,this.cvData.personal.phone,this.cvData.personal.location];
            contactInfo.forEach((info, idx)=>{
                pdf.text(info, contactX, y + 2 + (idx * 6));
            });
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.5);
            pdf.line(x, y+13, pageWidth - x, y+13);
        }

        renderHeaderClassic(pdf,x,y){
            const pageWidth = pdf.internal.pageSize.getWidth();
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(18);
            pdf.setTextColor(this.colors.dark);
            pdf.text(this.cvData.personal.name, x, y);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text(this.cvData.personal.title, x, y+7);
            pdf.setFontSize(8);
            pdf.setTextColor(this.colors.muted);
            const contactLine = `${this.cvData.personal.email} | ${this.cvData.personal.phone} | ${this.cvData.personal.location}`;
            pdf.text(contactLine, x, y+12, { maxWidth: pageWidth - x * 2 });
        }

        renderHeaderMinimal(pdf,x,y){
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(16);
            pdf.setTextColor(this.colors.dark);
            pdf.text(this.cvData.personal.name, x, y);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.muted);
            pdf.text(this.cvData.personal.title, x, y+6);
        }

        renderSection(pdf,title,content,x,y,width,fontSize=9,pageHeight=297){
            if(y > pageHeight - 30){
                pdf.addPage();
                y = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text(title, x, y);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, y+1, x+30, y+1);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(fontSize);
            pdf.setTextColor(this.colors.dark);
            const lines = pdf.splitTextToSize(content, width - 2);
            lines.forEach((line, idx)=>{
                pdf.text(line, x + 1, y + 6 + (idx * 4));
            });
            return y + 6 + (lines.length * 4);
        }

        renderSectionClassic(pdf,title,content,x,y,width){
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.primary);
            pdf.text(title, x, y);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            const lines = pdf.splitTextToSize(content, width - 2);
            lines.forEach((line, idx)=>{
                pdf.text(line, x, y + 6 + (idx * 4));
            });
            return y + 6 + (lines.length * 4);
        }

        renderAchievementsSection(pdf,x,y,width,pageHeight){
            if(!Array.isArray(this.cvData.achievements) || this.cvData.achievements.length === 0){
                return y;
            }
            let yPos = y;
            if(yPos > pageHeight - 25){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('KEY ACHIEVEMENTS', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            this.cvData.achievements.slice(0,5).forEach((item)=>{
                if(yPos > pageHeight - 12){
                    pdf.addPage();
                    yPos = 15;
                }
                const text = typeof item === 'string' ? item : item.text;
                const lines = pdf.splitTextToSize(`• ${text}`, width - 2);
                lines.forEach((line)=>{
                    pdf.text(line, x + 1, yPos);
                    yPos += 4;
                });
            });
            return yPos;
        }

        renderProjectsSection(pdf,x,y,width,pageHeight){
            if(!Array.isArray(this.cvData.projects) || this.cvData.projects.length === 0){
                return y;
            }
            let yPos = y;
            if(yPos > pageHeight - 30){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('SELECTED PROJECTS', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            const projects = this.cvData.projects.slice(0,3);
            projects.forEach((project)=>{
                if(yPos > pageHeight - 25){
                    pdf.addPage();
                    yPos = 15;
                }
                pdf.setFont('Helvetica','bold');
                pdf.setFontSize(9);
                pdf.setTextColor(this.colors.dark);
                pdf.text(project.title, x, yPos);
                yPos += 4;
                if(project.technologies && project.technologies.length > 0){
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.muted);
                    const techLine = project.technologies.join(' • ');
                    pdf.text(techLine, x, yPos);
                    yPos += 4;
                }
                if(project.description){
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.dark);
                    const lines = pdf.splitTextToSize(project.description, width - 2);
                    lines.forEach((line)=>{
                        pdf.text(line, x, yPos);
                        yPos += 4;
                    });
                }
                if(project.link){
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.primary);
                    pdf.textWithLink(this.cleanLink(project.link), x, yPos, { url: project.link });
                    yPos += 5;
                }else{
                    yPos += 3;
                }
            });
            return yPos;
        }

        renderPreferencesSection(pdf,x,y,width,pageHeight){
            const pref = this.cvData.preferences;
            if(!pref){
                return y;
            }
            const items = [];
            if(pref.targetRole) items.push(`Target role: ${pref.targetRole}`);
            if(pref.salaryExpectation) items.push(`Compensation: ${pref.salaryExpectation}`);
            if(pref.availability) items.push(`Availability: ${pref.availability}`);
            if(pref.workMode) items.push(`Work mode: ${pref.workMode}`);
            if(pref.noticeperiod) items.push(`Notice period: ${pref.noticeperiod}`);
            if(pref.timezone) items.push(`Timezone: ${pref.timezone}`);
            if(pref.relocation) items.push(`Relocation: ${pref.relocation}`);
            if(pref.dailyHours) items.push(`Daily hours: ${pref.dailyHours}h`);
            if(items.length === 0){
                return y;
            }
            let yPos = y;
            if(yPos > pageHeight - 25){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('HIRING SNAPSHOT', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            items.slice(0,6).forEach((item)=>{
                if(yPos > pageHeight - 12){
                    pdf.addPage();
                    yPos = 15;
                }
                pdf.text(`• ${item}`, x + 1, yPos);
                yPos += 4;
            });
            return yPos;
        }

        renderExperienceSection(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('EXPERIENCE', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            if(this.cvData.experience && this.cvData.experience.length > 0){
                this.cvData.experience.forEach((exp)=>{
                    if(yPos > pageHeight - 35){
                        pdf.addPage();
                        yPos = 15;
                    }
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(this.colors.dark);
                    pdf.text(`${exp.role} — ${exp.company}`, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(exp.dates, x + width - 40, yPos);
                    yPos += 5;
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.dark);
                    exp.description.forEach((bullet)=>{
                        if(yPos > pageHeight - 15){
                            pdf.addPage();
                            yPos = 15;
                        }
                        const bulletLines = pdf.splitTextToSize(`• ${bullet}`, width - 4);
                        bulletLines.forEach((line)=>{
                            pdf.text(line, x + 2, yPos);
                            yPos += 4;
                        });
                    });
                    yPos += 2;
                });
            }
            return yPos;
        }

        renderExperienceSectionClassic(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.primary);
            pdf.text('WORK EXPERIENCE', x, yPos);
            yPos += 7;
            if(this.cvData.experience && this.cvData.experience.length > 0){
                this.cvData.experience.forEach((exp)=>{
                    if(yPos > pageHeight - 40){
                        pdf.addPage();
                        yPos = 15;
                    }
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(this.colors.dark);
                    pdf.text(`${exp.role}`, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(`${exp.company} | ${exp.dates}`, x, yPos + 5);
                    yPos += 10;
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.dark);
                    exp.description.forEach((bullet)=>{
                        const lines = pdf.splitTextToSize(`• ${bullet}`, width - 4);
                        lines.forEach((line)=>{
                            if(yPos > pageHeight - 15){
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

        renderExperienceMinimal(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.dark);
            pdf.text('EXPERIENCE', x, yPos);
            yPos += 5;
            if(this.cvData.experience && this.cvData.experience.length > 0){
                this.cvData.experience.slice(0,3).forEach((exp)=>{
                    if(yPos > pageHeight - 25){
                        pdf.addPage();
                        yPos = 15;
                    }
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(9);
                    pdf.text(`${exp.role} — ${exp.company}`, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(exp.dates, x, yPos + 4);
                    yPos += 8;
                });
            }
            return yPos;
        }

        renderEducationSection(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('EDUCATION', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            if(this.cvData.education && this.cvData.education.length > 0){
                this.cvData.education.forEach((edu)=>{
                    if(yPos > pageHeight - 25){
                        pdf.addPage();
                        yPos = 15;
                    }
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(10);
                    pdf.setTextColor(this.colors.dark);
                    pdf.text(edu.degree, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(`${edu.institution}`, x, yPos + 5);
                    pdf.text(`${edu.dates}`, x + width - 40, yPos + 5);
                    yPos += 10;
                    if(edu.highlights && edu.highlights.length > 0){
                        pdf.setFontSize(8);
                        pdf.setTextColor(this.colors.dark);
                        edu.highlights.forEach((highlight)=>{
                            const lines = pdf.splitTextToSize(`• ${highlight}`, width - 4);
                            lines.forEach((line)=>{
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

        renderEducationSectionClassic(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.primary);
            pdf.text('EDUCATION', x, yPos);
            yPos += 7;
            if(this.cvData.education && this.cvData.education.length > 0){
                this.cvData.education.forEach((edu)=>{
                    if(yPos > pageHeight - 20){
                        pdf.addPage();
                        yPos = 15;
                    }
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(10);
                    pdf.text(edu.degree, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(9);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(edu.institution, x, yPos + 5);
                    yPos += 12;
                });
            }
            return yPos;
        }

        renderEducationMinimal(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.text('EDUCATION', x, yPos);
            yPos += 5;
            if(this.cvData.education && this.cvData.education.length > 0){
                this.cvData.education.forEach((edu)=>{
                    pdf.setFont('Helvetica','bold');
                    pdf.setFontSize(9);
                    pdf.text(edu.degree, x, yPos);
                    pdf.setFont('Helvetica','normal');
                    pdf.setFontSize(8);
                    pdf.setTextColor(this.colors.muted);
                    pdf.text(`${edu.institution} | ${edu.dates}`, x, yPos + 4);
                    yPos += 8;
                });
            }
            return yPos;
        }

        renderSkillsSection(pdf,x,y,width,pageHeight=297){
            let yPos = y;
            if(yPos > pageHeight - 25){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('CORE COMPETENCIES', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            pdf.text('Technical:', x, yPos);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(8);
            const techSkills = this.cvData.skills.technical.slice(0,5).join(' • ');
            const techLines = pdf.splitTextToSize(techSkills, width - 20);
            techLines.forEach((line, idx)=>{
                pdf.text(line, x + 20, yPos + (idx * 3));
            });
            yPos += techLines.length * 3 + 4;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            pdf.text('Tools:', x, yPos);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(8);
            const tools = this.cvData.skills.tools.join(' • ');
            const toolLines = pdf.splitTextToSize(tools, width - 20);
            toolLines.forEach((line, idx)=>{
                pdf.text(line, x + 20, yPos + (idx * 3));
            });
            yPos += toolLines.length * 3 + 4;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            pdf.text('Soft Skills:', x, yPos);
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(8);
            const softSkills = this.cvData.skills.soft.slice(0,4).join(' • ');
            const softLines = pdf.splitTextToSize(softSkills, width - 20);
            softLines.forEach((line, idx)=>{
                pdf.text(line, x + 20, yPos + (idx * 3));
            });
            return yPos + softLines.length * 3;
        }

        renderSkillsSectionClassic(pdf,x,y,width,pageHeight){
            let yPos = y;
            if(yPos > pageHeight - 20){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(11);
            pdf.setTextColor(this.colors.primary);
            pdf.text('SKILLS', x, yPos);
            yPos += 7;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            const skills = this.cvData.skills.technical.slice(0,8).join(' • ');
            const skillLines = pdf.splitTextToSize(skills, width - 2);
            skillLines.forEach((line, idx)=>{
                pdf.text(line, x, yPos + (idx * 4));
            });
            return yPos + skillLines.length * 4;
        }

        renderSkillsMinimal(pdf,x,y,width,pageHeight){
            let yPos = y;
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.text('SKILLS', x, yPos);
            yPos += 4;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(8);
            pdf.setTextColor(this.colors.dark);
            const skills = this.cvData.skills.technical.slice(0,6).join(' • ');
            const skillLines = pdf.splitTextToSize(skills, width);
            skillLines.forEach((line)=>{
                pdf.text(line, x, yPos);
                yPos += 3;
            });
            return yPos;
        }

        renderCertificationsSection(pdf,x,y,width,pageHeight){
            let yPos = y;
            if(!this.cvData.certifications || this.cvData.certifications.length === 0){
                return yPos;
            }
            if(yPos > pageHeight - 20){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('CERTIFICATIONS', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            this.cvData.certifications.forEach((cert)=>{
                if(yPos > pageHeight - 10){
                    pdf.addPage();
                    yPos = 15;
                }
                const certText = `${cert.name} — ${cert.issuer} (${cert.date})`;
                pdf.text(certText, x, yPos);
                yPos += 4;
            });
            return yPos;
        }

        renderLanguagesSection(pdf,x,y,width,pageHeight){
            let yPos = y;
            if(!this.cvData.languages || this.cvData.languages.length === 0){
                return yPos;
            }
            if(yPos > pageHeight - 15){
                pdf.addPage();
                yPos = 15;
            }
            pdf.setFont('Helvetica','bold');
            pdf.setFontSize(10);
            pdf.setTextColor(this.colors.primary);
            pdf.text('LANGUAGES', x, yPos);
            pdf.setDrawColor(this.colors.accent);
            pdf.setLineWidth(0.3);
            pdf.line(x, yPos + 1, x + 30, yPos + 1);
            yPos += 7;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(9);
            pdf.setTextColor(this.colors.dark);
            this.cvData.languages.forEach((lang)=>{
                pdf.text(`${lang.name}: ${lang.level}`, x, yPos);
                yPos += 4;
            });
            return yPos;
        }

        renderFooter(pdf,pageHeight){
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 12;
            pdf.setFont('Helvetica','normal');
            pdf.setFontSize(8);
            pdf.setTextColor(this.colors.muted);
            const footerText = `Generated with Portfolio CV Tool | ${new Date().toLocaleDateString()}`;
            pdf.text(footerText, margin, pageHeight - 8, { maxWidth: pageWidth - (margin * 2), align: 'center' });
        }

        capitalizeFirstLetter(str){
            return str.charAt(0).toUpperCase() + str.slice(1);
        }

        cleanLink(link){
            if(!link){
                return '';
            }
            const trimmed = link.replace(/^https?:\/\//,'').replace(/\/$/,'');
            return trimmed.length > 60 ? `${trimmed.slice(0,57)}...` : trimmed;
        }

        downloadPDF(pdf, filename = 'cv.pdf'){
            pdf.save(filename);
        }
    }

    class CVGeneratorHandler {
        constructor(){
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

        init(){
            this.cacheElements();
            this.populateDefaults();
            this.attachEventListeners();
            this.setVariant(this.state.activeVariant);
        }

        cacheElements(){
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

        populateDefaults(){
            const personal = CVTemplateData.personal;
            if(this.nameInput) this.nameInput.value = personal.name;
            if(this.titleInput) this.titleInput.value = personal.title;
            if(this.locationInput) this.locationInput.value = personal.location;
            if(this.emailInput) this.emailInput.value = personal.email;
            if(this.phoneInput) this.phoneInput.value = personal.phone;
            if(this.linksInput) this.linksInput.value = `${personal.github}, ${personal.linkedin}`;
            if(this.summaryInput) this.summaryInput.value = CVTemplateData.summaries.general;
            if(this.skillsInput){
                this.skillsInput.value = CVTemplateData.skills.technical.slice(0,6).join(', ');
            }
            if(this.targetRoleSelect) this.targetRoleSelect.value = 'general';
            if(this.templateSelect) this.templateSelect.value = 'modern';
            if(this.statusMessage) this.statusMessage.textContent = '';
        }

        attachEventListeners(){
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
            inputs.forEach((input)=>{
                input.addEventListener('input',()=>this.refreshPreview());
            });
            this.targetRoleSelect?.addEventListener('change',(event)=>{
                const variant = event.target.value || 'general';
                this.setVariant(variant);
            });
            this.templateSelect?.addEventListener('change',(event)=>{
                this.state.templateManuallySet = true;
                this.state.template = event.target.value || 'modern';
            });
            this.variantCards.forEach((card)=>{
                card.addEventListener('click',()=>this.setVariant(card.dataset.variant));
                card.addEventListener('keypress',(event)=>{
                    if(event.key === 'Enter' || event.key === ' '){
                        event.preventDefault();
                        this.setVariant(card.dataset.variant);
                    }
                });
            });
            this.variantButtons.forEach((btn)=>{
                btn.addEventListener('click', async (event)=>{
                    event.preventDefault();
                    const variant = event.currentTarget.dataset.variant || 'general';
                    const template = event.currentTarget.dataset.template || 'modern';
                    await this.generateAndDownload({ variantKey: variant, template });
                });
            });
            this.customDownloadBtn?.addEventListener('click', async ()=>{
                await this.generateAndDownload({
                    variantKey: this.state.activeVariant,
                    template: this.templateSelect?.value || this.state.template || 'modern'
                });
            });
            this.resetBtn?.addEventListener('click',(event)=>{
                event.preventDefault();
                this.state.templateManuallySet = false;
                this.resetForm();
            });
        }

        refreshPreview(){
            this.setVariant(this.state.activeVariant, { preserveCardState: true });
        }

        resetForm(){
            this.populateDefaults();
            this.refreshPreview();
            this.setStatus('Fields reset to template defaults.', 3000);
        }

        setStatus(message, timeout = 0){
            if(!this.statusMessage){
                return;
            }
            this.statusMessage.textContent = message;
            if(this.clearStatusTimer){
                clearTimeout(this.clearStatusTimer);
            }
            if(timeout > 0){
                this.clearStatusTimer = window.setTimeout(()=>{
                    this.statusMessage.textContent = '';
                }, timeout);
            }
        }

        setVariant(variantKey = 'general', options = {}){
            const variant = CVTemplateData.roleVariants?.[variantKey] || CVTemplateData.roleVariants.general;
            this.state.activeVariant = variantKey;
            if(this.targetRoleSelect && !options.preserveCardState){
                this.targetRoleSelect.value = variantKey;
            }
            if(this.templateSelect && !this.state.templateManuallySet && variant?.defaultTemplate){
                this.templateSelect.value = variant.defaultTemplate;
                this.state.template = variant.defaultTemplate;
            }
            if(!options.preserveCardState){
                this.variantCards.forEach((card)=>{
                    const isActive = card.dataset.variant === variantKey;
                    card.classList.toggle('is-active', isActive);
                    card.setAttribute('aria-selected', isActive ? 'true' : 'false');
                    if(!card.dataset.shadow){
                        card.dataset.shadow = card.style.boxShadow || '';
                    }
                    if(!card.dataset.border){
                        card.dataset.border = card.style.border || '1px solid rgba(148, 163, 184, 0.25)';
                    }
                    if(isActive){
                        card.style.border = `1px solid ${variant.accentColor || '#0ea5a4'}`;
                        card.style.boxShadow = '0 14px 32px rgba(14, 165, 164, 0.18)';
                    }else{
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

        getPersonalOverrides(){
            const overrides = {};
            if(this.nameInput?.value) overrides.name = this.nameInput.value.trim();
            if(this.titleInput?.value) overrides.title = this.titleInput.value.trim();
            if(this.locationInput?.value) overrides.location = this.locationInput.value.trim();
            if(this.emailInput?.value) overrides.email = this.emailInput.value.trim();
            if(this.phoneInput?.value) overrides.phone = this.phoneInput.value.trim();
            const links = (this.linksInput?.value || '').split(',').map((item)=>item.trim()).filter(Boolean);
            overrides.github = '';
            overrides.linkedin = '';
            overrides.portfolio = '';
            links.forEach((link)=>{
                if(link.includes('github.com')){
                    overrides.github = link;
                }else if(link.includes('linkedin.com')){
                    overrides.linkedin = link;
                }else if(link.startsWith('http')){
                    overrides.portfolio = link;
                }
            });
            return overrides;
        }

        getSummaryOverride(){
            const value = this.summaryInput?.value?.trim();
            return value ? value : null;
        }

        getSkillsOverride(){
            const skills = (this.skillsInput?.value || '').split(',').map((skill)=>skill.trim()).filter(Boolean);
            return skills.length > 0 ? skills : null;
        }

        getDemoLinks(){
            return (this.demosInput?.value || '').split(',').map((link)=>link.trim()).filter(Boolean);
        }

        buildVariantData(variantKey){
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
            if(Array.isArray(variant.experienceIds)){
                experience = experience.filter((item)=>variant.experienceIds.includes(item.id));
            }
            if(Array.isArray(variant.includeExperienceIds)){
                const additional = base.experience.filter((item)=>variant.includeExperienceIds.includes(item.id));
                additional.forEach((item)=>{
                    if(!experience.find((existing)=>existing.id === item.id)){
                        experience.push(item);
                    }
                });
            }
            if(variant.maxExperienceItems){
                experience = experience.slice(0, variant.maxExperienceItems);
            }
            experience = experience.map((item)=>{
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
            if(Array.isArray(variant.projectIds)){
                projects = projects.filter((project)=>variant.projectIds.includes(project.id));
            }
            if(variant.maxProjects){
                projects = projects.slice(0, variant.maxProjects);
            }
            const demoLinks = this.getDemoLinks();
            if(demoLinks.length > 0){
                const customProjects = demoLinks.map((url, idx)=>(
                    {
                        id: `custom-${idx}`,
                        title: `Additional project ${idx + 1}`,
                        description: `See more details: ${url}`,
                        technologies: [],
                        link: url,
                        highlight: false
                    }
                ));
                projects = [...projects, ...customProjects];
            }
            let certifications = base.certifications;
            if(Array.isArray(variant.certificationIds)){
                certifications = certifications.filter((cert)=>variant.certificationIds.includes(cert.id));
            }
            const achievements = [];
            if(Array.isArray(base.achievements)){
                if(Array.isArray(variant.achievementIds)){
                    variant.achievementIds.forEach((id)=>{
                        const match = base.achievements.find((item)=>item.id === id);
                        if(match) achievements.push(match);
                    });
                }else{
                    achievements.push(...base.achievements.slice(0,3));
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

        renderPreview(data){
            if(!data){
                return;
            }
            const variantMeta = data.variantMeta || {};
            const summary = data.summaries[this.state.activeVariant] || data.summaries.general;
            if(this.previewRoot){
                this.previewRoot.style.border = `1px solid ${variantMeta.accent || '#e6e9ef'}`;
                this.previewRoot.style.boxShadow = '0 12px 32px rgba(15, 23, 42, 0.1)';
            }
            if(this.previewName) this.previewName.textContent = data.personal.name || '';
            if(this.previewTitle) this.previewTitle.textContent = data.personal.title || '';
            if(this.previewVariantLabel){
                this.previewVariantLabel.textContent = variantMeta.label || this.formatTemplateName(this.state.activeVariant);
                this.previewVariantLabel.style.color = variantMeta.accent || '#0ea5a4';
            }
            if(this.previewVariantHeadline) this.previewVariantHeadline.textContent = variantMeta.headline || '';
            if(this.previewLocation) this.previewLocation.textContent = data.personal.location || '';
            if(this.previewEmail) this.previewEmail.textContent = data.personal.email || '';
            if(this.previewPhone) this.previewPhone.textContent = data.personal.phone || '';
            if(this.previewLinks) this.previewLinks.textContent = this.buildLinksString(data.personal);
            if(this.previewSummaryText) this.previewSummaryText.textContent = summary || '';
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

        renderFocusTags(container,tags,color){
            if(!container) return;
            container.innerHTML = '';
            const palette = color || '#0ea5a4';
            tags.slice(0,4).forEach((tag)=>{
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

        renderSkillBadges(container,skills){
            if(!container) return;
            container.innerHTML = '';
            skills.slice(0,8).forEach((skill)=>{
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

        renderAchievements(container,achievements){
            if(!container) return;
            container.innerHTML = '';
            achievements.forEach((item)=>{
                const li = document.createElement('li');
                li.textContent = item.text || item;
                li.style.marginBottom = '4px';
                container.appendChild(li);
            });
        }

        renderExperience(container,experience){
            if(!container) return;
            container.innerHTML = '';
            experience.forEach((exp)=>{
                const wrapper = document.createElement('div');
                wrapper.style.marginBottom = '10px';
                wrapper.style.paddingBottom = '10px';
                wrapper.style.borderBottom = '1px dashed #e2e8f0';
                const title = document.createElement('div');
                title.textContent = `${exp.role} — ${exp.company}`;
                title.style.fontWeight = '600';
                title.style.fontSize = '0.95rem';
                wrapper.appendChild(title);
                if(exp.dates){
                    const dates = document.createElement('div');
                    dates.textContent = exp.dates;
                    dates.style.fontSize = '0.85rem';
                    dates.style.color = '#64748b';
                    dates.style.marginTop = '2px';
                    wrapper.appendChild(dates);
                }
                if(Array.isArray(exp.description) && exp.description.length > 0){
                    const list = document.createElement('ul');
                    list.style.margin = '6px 0 0';
                    list.style.paddingInlineStart = '20px';
                    exp.description.forEach((line)=>{
                        const li = document.createElement('li');
                        li.textContent = line;
                        list.appendChild(li);
                    });
                    wrapper.appendChild(list);
                }
                container.appendChild(wrapper);
            });
        }

        renderEducation(container,education){
            if(!container) return;
            container.innerHTML = '';
            education.forEach((edu)=>{
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
                if(edu.dates){
                    const dates = document.createElement('div');
                    dates.textContent = edu.dates;
                    dates.style.color = '#94a3b8';
                    dates.style.fontSize = '0.82rem';
                    wrapper.appendChild(dates);
                }
                container.appendChild(wrapper);
            });
        }

        renderProjects(container,projects){
            if(!container) return;
            container.innerHTML = '';
            projects.slice(0,4).forEach((project)=>{
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
                if(project.description){
                    const desc = document.createElement('div');
                    desc.textContent = project.description;
                    desc.style.color = '#475569';
                    desc.style.fontSize = '0.9rem';
                    desc.style.marginTop = '2px';
                    block.appendChild(desc);
                }
                if(project.technologies && project.technologies.length > 0){
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

        renderCertifications(container,certifications){
            if(!container) return;
            container.innerHTML = '';
            certifications.forEach((cert)=>{
                const li = document.createElement('li');
                li.textContent = `${cert.name} — ${cert.issuer} (${cert.date})`;
                li.style.marginBottom = '4px';
                container.appendChild(li);
            });
        }

        renderLanguages(container,languages){
            if(!container) return;
            container.innerHTML = '';
            languages.forEach((lang)=>{
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

        renderAdditionalInfo(container,preferences){
            if(!container) return;
            container.innerHTML = '';
            const items = [];
            if(preferences.targetRole) items.push(`Target role: ${preferences.targetRole}`);
            if(preferences.salaryExpectation) items.push(`Compensation: ${preferences.salaryExpectation}`);
            if(preferences.availability) items.push(`Availability: ${preferences.availability}`);
            if(preferences.workMode) items.push(`Work mode: ${preferences.workMode}`);
            if(preferences.noticeperiod) items.push(`Notice period: ${preferences.noticeperiod}`);
            if(preferences.timezone) items.push(`Timezone: ${preferences.timezone}`);
            if(preferences.relocation) items.push(`Relocation: ${preferences.relocation}`);
            items.forEach((item)=>{
                const li = document.createElement('li');
                li.textContent = item;
                li.style.marginBottom = '4px';
                container.appendChild(li);
            });
        }

        toggleSection(section,hasContent){
            if(!section) return;
            section.style.display = hasContent ? '' : 'none';
        }

        buildLinksString(personal){
            const links = [];
            if(personal.github) links.push(this.stripProtocol(personal.github));
            if(personal.linkedin) links.push(this.stripProtocol(personal.linkedin));
            if(personal.portfolio) links.push(this.stripProtocol(personal.portfolio));
            return links.join(' • ');
        }

        stripProtocol(link){
            return link ? link.replace(/^https?:\/\//,'').replace(/\/$/,'') : '';
        }

        formatTemplateName(name){
            if(!name) return '';
            return name.split('_').map((part)=>part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
        }

        async generateAndDownload({ variantKey, template }){
            if(this.state.isGenerating){
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
                const safeName = data.personal.name.replace(/\s+/g,'_');
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

        static clone(obj){
            return JSON.parse(JSON.stringify(obj));
        }
    }

    const exportsObject = {
        CVTemplateData,
        CVPDFGenerator,
        CVGeneratorHandler,
        generateDocumentsFromText
    };

    if(isNode){
        module.exports = exportsObject;
        if(typeof require !== 'undefined' && require.main === module){
            generateDocumentsFromText()
                .then(({ pdfPath, rtfPath })=>{
                    console.log('PDF generated at', pdfPath);
                    console.log('RTF generated at', rtfPath);
                })
                .catch((error)=>{
                    console.error('Error generating CV assets:', error.message || error);
                    process.exit(1);
                });
        }
    }else{
        globalScope.CVTemplateData = CVTemplateData;
        globalScope.CVPDFGenerator = CVPDFGenerator;
        globalScope.CVGeneratorHandler = CVGeneratorHandler;
        if(typeof document !== 'undefined'){
            const mount = ()=>{ new CVGeneratorHandler(); };
            if(document.readyState === 'loading'){
                document.addEventListener('DOMContentLoaded', mount);
            }else{
                mount();
            }
        }
    }
})();
