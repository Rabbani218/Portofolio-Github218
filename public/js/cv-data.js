/**
 * CV Data Template - Muhammad Abdurrahman Rabbani
 * International Standard CV Format with Multiple Templates
 * Professional, Modern & ATS-Friendly
 */

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

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CVTemplateData;
}
