# 📌 CSS & HTML Code Reference

## Complete CSS Variable System

```css
/* ===== CSS VARIABLES FOR THEMING ===== */

:root {
    /* Light Theme (Default) */
    --primary-color: #0b3d91;
    --secondary-color: #243b5a;
    --accent-color: #0ea5a4;        /* Teal */
    --accent-2: #ff7aa2;            /* Pink */
    --accent-3: #ffd166;            /* Yellow */
    --bg-light: #fbfdff;            /* Very light blue */
    --bg-glass: rgba(255,255,255,0.6);
    --card-bg: rgba(255,255,255,0.9);
    --text-dark: #0f172a;           /* Very dark blue */
    --text-light: #374151;          /* Medium gray */
    --muted: #94a3b8;               /* Light gray */
    --muted-color: #6b7280;         /* Gray */
    --glass-blur: 8px;
    --neon: #7effc4;               /* Neon green */
    
    /* Sizing & Spacing */
    --border-radius: 12px;
    --soft-radius: 20px;
    --card-padding: 1.25rem;
    
    /* Shadows */
    --shadow-1: 0 6px 18px rgba(15,23,42,0.08);
    --shadow-2: 0 10px 30px rgba(15,23,42,0.12);
    --elev-shadow: 0 20px 50px rgba(11,61,145,0.08);
    
    /* Animation */
    --transition-fast: 180ms cubic-bezier(.2,.9,.3,1);
    --transition: 260ms cubic-bezier(.2,.9,.3,1);
    
    /* Typography */
    --type-base: 16px;
    --display: 2.6rem;
}

/* ===== DARK THEME OVERRIDES ===== */

body.dark-theme {
    --bg-light: #05060a;            /* Almost black */
    --bg-glass: rgba(6,9,18,0.35);
    --card-bg: rgba(11,20,35,0.7);
    --text-dark: #e2e8f0;           /* Very light blue */
    --text-light: #cbd5e1;          /* Light blue-gray */
    --muted: #94a3b8;               /* Stays same (neutral) */
    --muted-color: #6b7280;
    --neon: #7effc4;
}
```

---

## About Card Styling

### HTML Structure
```html
<div class="about-card">
    <h3 class="about-card__title">
        <i class="fa-solid fa-lightbulb" aria-hidden="true"></i>
        What I do
    </h3>
    <ul class="about-card__list">
        <li>Item 1</li>
        <li>Item 2</li>
    </ul>
</div>

<!-- Impact Variant -->
<div class="about-card about-card--impact">
    <div class="about-card__header">
        <strong>Impact & Results</strong>
        <p>Description here</p>
    </div>
    <ul class="about-card__list">
        <li>Achievement 1</li>
    </ul>
</div>

<!-- Collaborate Variant -->
<div class="about-card about-card--collaborate">
    <h3 class="about-card__title">
        <i class="fa-solid fa-handshake"></i>
        Collaborate
    </h3>
    <div class="about-card__actions">
        <a class="btn-primary" href="#">Email</a>
        <a class="btn-secondary" href="#">GitHub</a>
        <a class="btn-accent" href="#">LinkedIn</a>
    </div>
</div>
```

### CSS Styling
```css
.about-card {
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: linear-gradient(180deg, 
        rgba(255,255,255,0.88), 
        rgba(255,255,255,0.7));
    padding: 16px;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(8,15,30,0.04);
    border: 1px solid rgba(11,61,145,0.04);
    transition: transform var(--transition), 
                box-shadow var(--transition);
}

.about-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(11,61,145,0.08);
}

.about-card__title {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0 0 10px 0;
    color: var(--primary-color);
    font-size: 1.05rem;
}

.about-card__title i {
    color: var(--accent-color);
}

.about-card__list {
    margin: 0;
    padding-left: 18px;
    font-size: 0.95rem;
    color: var(--text-dark);
    line-height: 1.6;
}

.about-card__list li {
    margin-bottom: 8px;
}

/* Dark Theme */
body.dark-theme .about-card {
    background: linear-gradient(180deg, 
        rgba(11,20,35,0.7), 
        rgba(6,10,18,0.7)) !important;
    border: 1px solid rgba(255,255,255,0.03);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
}

body.dark-theme .about-card__title {
    color: #e2e8f0;
}

body.dark-theme .about-card__list {
    color: #cbd5e1;
}
```

---

## Education Item Styling

### HTML Structure
```html
<div class="education-list">
    <div class="education-item">
        <img src="logo.png" alt="Logo" class="education-item__logo">
        <div class="education-item__content">
            <strong class="education-item__title">
                Universitas Bina Sarana Informatika
            </strong>
            <div class="education-item__degree">
                Bachelor of Informatics
            </div>
            <div class="education-item__period">
                Jan 2019 – Nov 2035
            </div>
            <p class="education-item__desc">
                Concentrated on software development...
            </p>
            <a href="#" class="education-item__link">
                Relevant coursework: Python, SQL, etc.
            </a>
        </div>
    </div>
</div>
```

### CSS Styling
```css
.education-list {
    display: grid;
    gap: 14px;
    margin-top: 12px;
}

.education-item {
    display: flex;
    gap: 12px;
    align-items: flex-start;
    background: linear-gradient(180deg, 
        rgba(255,255,255,0.88), 
        rgba(255,255,255,0.7));
    padding: 12px;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(8,15,30,0.04);
    border: 1px solid rgba(11,61,145,0.04);
    transition: transform var(--transition), 
                box-shadow var(--transition);
}

.education-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 30px rgba(11,61,145,0.08);
}

.education-item__logo {
    flex: 0 0 64px;
    border-radius: 8px;
    object-fit: cover;
}

.education-item__content {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.education-item__title {
    display: block;
    font-size: 1.02rem;
    color: var(--primary-color);
    margin: 0;
}

.education-item__degree {
    color: var(--text-light);
    font-size: 0.95rem;
    margin: 0;
}

.education-item__period {
    color: var(--muted);
    font-size: 0.95rem;
    margin: 0;
}

.education-item__desc {
    margin: 0 0 8px 0;
    color: var(--text-light);
    font-size: 0.95rem;
    line-height: 1.6;
}

.education-item__link {
    color: var(--primary-color);
    text-decoration: underline;
    font-size: 0.95rem;
    text-underline-offset: 3px;
    transition: var(--transition);
}

.education-item__link:hover {
    color: var(--accent-color);
}

/* Dark Theme */
body.dark-theme .education-item {
    background: linear-gradient(180deg, 
        rgba(11,20,35,0.7), 
        rgba(6,10,18,0.7)) !important;
    border: 1px solid rgba(255,255,255,0.03);
    box-shadow: 0 10px 30px rgba(0,0,0,0.6);
}

body.dark-theme .education-item__title {
    color: #e2e8f0;
}

body.dark-theme .education-item__degree,
body.dark-theme .education-item__desc {
    color: #cbd5e1;
}

body.dark-theme .education-item__link {
    color: #60a5fa;
}
```

---

## Contact Form Styling

### HTML Structure
```html
<form class="contact-form">
    <strong>Send a quick message</strong>
    
    <label>
        <span class="muted-small">Your name</span>
        <input name="name" type="text" 
               placeholder="Jane Doe" required>
    </label>
    
    <label>
        <span class="muted-small">Your email</span>
        <input name="email" type="email" 
               placeholder="you@example.com" required>
    </label>
    
    <label>
        <span class="muted-small">Message</span>
        <textarea name="message" rows="5" 
                  placeholder="Your message..." required>
        </textarea>
    </label>
    
    <div class="contact-form__actions">
        <button type="submit" class="btn-primary">
            Send message
        </button>
        <button type="reset" class="btn-secondary">
            Reset
        </button>
    </div>
    
    <p class="muted-small">
        Note: Form uses your email client (mailto).
    </p>
</form>
```

### CSS Styling
```css
.contact-form {
    background: linear-gradient(180deg, 
        rgba(255,255,255,0.88), 
        rgba(255,255,255,0.7));
    padding: 14px;
    border-radius: 12px;
    box-shadow: 0 8px 24px rgba(8,15,30,0.06);
    display: flex;
    flex-direction: column;
    gap: 10px;
    border: 1px solid rgba(11,61,145,0.04);
}

.contact-form strong {
    display: block;
    color: var(--primary-color);
    margin-bottom: 6px;
}

.contact-form label {
    display: flex;
    flex-direction: column;
    gap: 6px;
}

.contact-form input,
.contact-form textarea {
    padding: 8px 10px;
    border-radius: 8px;
    border: 1px solid #e6e9ef;
    font-size: 0.95rem;
    font-family: inherit;
    background: white;
    color: var(--text-dark);
    transition: border-color var(--transition), 
                box-shadow var(--transition);
}

.contact-form input:focus,
.contact-form textarea:focus {
    border-color: var(--accent-color);
    box-shadow: 0 0 0 3px rgba(14,165,164,0.1);
    outline: none;
}

.contact-form input::placeholder,
.contact-form textarea::placeholder {
    color: var(--muted);
}

.contact-form__actions {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px;
}

.contact-form__actions button {
    padding: 10px 14px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    font-weight: 600;
    transition: var(--transition);
}

.contact-form__actions .btn-primary {
    background: linear-gradient(180deg, 
        var(--primary-color), 
        #09306f);
    color: white;
}

.contact-form__actions .btn-secondary {
    background: #f3f4f6;
    color: var(--primary-color);
}

/* Dark Theme */
body.dark-theme .contact-form {
    background: linear-gradient(180deg, 
        rgba(11,20,35,0.7), 
        rgba(6,10,18,0.7)) !important;
    border: 1px solid rgba(255,255,255,0.03);
}

body.dark-theme .contact-form strong {
    color: #e2e8f0;
}

body.dark-theme .contact-form label {
    color: #cbd5e1;
}

body.dark-theme .contact-form input,
body.dark-theme .contact-form textarea {
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.1);
    color: #e2e8f0;
}

body.dark-theme .contact-form input::placeholder,
body.dark-theme .contact-form textarea::placeholder {
    color: rgba(203,213,225,0.5);
}

body.dark-theme .contact-form input:focus,
body.dark-theme .contact-form textarea:focus {
    border-color: #7effc4;
    box-shadow: 0 0 0 3px rgba(126,255,196,0.1);
}
```

---

## Button Variants

### Primary Button
```css
.btn-primary {
    background: linear-gradient(180deg, 
        var(--primary-color), 
        #09306f);
    color: white;
    border: 0;
    padding: 0.7rem 1.4rem;
    border-radius: 12px;
    font-weight: 700;
    box-shadow: 0 8px 20px rgba(11,61,145,0.06);
    transition: var(--transition);
}

.btn-primary:hover {
    transform: translateY(-4px);
    box-shadow: 0 22px 48px rgba(11,61,145,0.14);
}

/* Dark Theme */
body.dark-theme .btn-primary {
    background: linear-gradient(180deg, 
        #0b56b3, 
        #06326a);
    box-shadow: 0 12px 34px rgba(0,0,0,0.5);
}
```

### Secondary Button
```css
.btn-secondary {
    background: rgba(255,255,255,0.9);
    color: var(--primary-color);
    border: 1px solid rgba(11,61,145,0.06);
    padding: 0.7rem 1.4rem;
    border-radius: 12px;
    font-weight: 700;
    transition: var(--transition);
}

/* Dark Theme */
body.dark-theme .btn-secondary {
    background: rgba(255,255,255,0.03);
    color: #cfe8ff;
    border: 1px solid rgba(255,255,255,0.04);
}
```

### Accent Button
```css
.btn-accent {
    background: linear-gradient(90deg, 
        var(--accent-color), 
        var(--accent-2));
    color: white;
    border: 0;
    padding: 0.7rem 1.4rem;
    border-radius: 12px;
    font-weight: 700;
    transition: var(--transition);
}

/* Dark Theme */
body.dark-theme .btn-accent {
    background: linear-gradient(90deg, 
        rgba(14,165,164,0.8), 
        rgba(6,182,212,0.8));
    color: white;
}
```

---

## Copy Paste Templates

### New About Card
```html
<div class="about-card">
    <h3 class="about-card__title">
        <i class="fa-solid fa-[icon-name]" aria-hidden="true"></i>
        Title Here
    </h3>
    <ul class="about-card__list">
        <li>Point 1</li>
        <li>Point 2</li>
        <li>Point 3</li>
    </ul>
</div>
```

### New Education Item
```html
<div class="education-item">
    <img src="/images/logo.png" alt="Logo" 
         class="education-item__logo" width="64" height="64">
    <div class="education-item__content">
        <strong class="education-item__title">School Name</strong>
        <div class="education-item__degree">Degree</div>
        <div class="education-item__period">2019 - 2025</div>
        <p class="education-item__desc">Description here...</p>
    </div>
</div>
```

### New Contact Link
```html
<a class="contact-btn btn-primary" 
   href="mailto:email@example.com" 
   aria-label="Send email">
    <i class="fa-solid fa-envelope" aria-hidden="true"></i>
    Email
</a>
```

---

## Useful CSS Mixins/Patterns

### Card Gradient (Light)
```css
background: linear-gradient(180deg, 
    rgba(255,255,255,0.88), 
    rgba(255,255,255,0.7));
```

### Card Gradient (Dark)
```css
background: linear-gradient(180deg, 
    rgba(11,20,35,0.7), 
    rgba(6,10,18,0.7)) !important;
```

### Button Gradient (Primary)
```css
background: linear-gradient(180deg, 
    var(--primary-color), 
    #09306f);
```

### Button Gradient (Accent)
```css
background: linear-gradient(90deg, 
    var(--accent-color), 
    var(--accent-2));
```

### Hover Lift Effect
```css
transform: translateY(-4px);
box-shadow: 0 10px 30px rgba(0,0,0,0.2);
```

### Dark Mode Border
```css
border: 1px solid rgba(255,255,255,0.03);
```

### Dark Mode Shadow
```css
box-shadow: 0 10px 30px rgba(0,0,0,0.6);
```

---

**Last Updated**: November 13, 2025
**Version**: 2.0
**Status**: ✅ Production Ready
