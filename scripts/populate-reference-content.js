const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '../pages');

const theme = {
    saffron: '#FF9933',
    white: '#FFFFFF',
    green: '#138808',
    navy: '#000080',
    gold: '#FFD700'
};

function createSVG(pageNumber, title, subtitle, color) {
    return `
<svg width="800" height="1100" xmlns="http://www.w3.org/2000/svg">
    <rect width="800" height="1100" fill="${color}" />
    <rect width="760" height="1060" x="20" y="20" fill="none" stroke="${theme.gold}" stroke-width="2" />
    
    <text x="400" y="150" font-family="Arial, sans-serif" font-size="60" font-weight="bold" fill="${color === theme.navy ? 'white' : theme.navy}" text-anchor="middle">HKSSL</text>
    <text x="400" y="210" font-family="Arial, sans-serif" font-size="24" fill="${color === theme.navy ? theme.saffron : theme.navy}" text-anchor="middle">SPECIAL EDITION 2022</text>
    
    <circle cx="400" cy="550" r="150" fill="white" opacity="0.1" />
    
    <text x="400" y="800" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="${color === theme.navy ? 'white' : theme.navy}" text-anchor="middle">${title}</text>
    <text x="400" y="860" font-family="Arial, sans-serif" font-size="20" fill="${color === theme.navy ? 'white' : theme.navy}" text-anchor="middle" opacity="0.8">${subtitle}</text>
    
    <text x="750" y="1070" font-family="Arial, sans-serif" font-size="18" fill="${color === theme.navy ? 'white' : theme.navy}" text-anchor="end">Page ${pageNumber}</text>
</svg>`.trim();
}

const pages = [
    { title: 'COVER PAGE', subtitle: 'Commemorating Excellence', color: theme.navy },
    { title: 'EDITORIAL', subtitle: 'A Message from the Team', color: theme.white },
    { title: 'AWARDEE SPOTLIGHT', subtitle: 'Recognizing Changemakers', color: theme.white },
    { title: 'GALLERY', subtitle: 'Moments of Pride', color: theme.white },
    { title: 'COMMUNITY', subtitle: 'Impact Across Borders', color: theme.white },
    { title: 'INNOVATION', subtitle: 'Driving Future Growth', color: theme.white },
    { title: 'PARTNERS', subtitle: 'Stronger Together', color: theme.white },
    { title: 'CONTACT US', subtitle: 'Get in Touch', color: theme.navy }
];

if (!fs.existsSync(pagesDir)) fs.mkdirSync(pagesDir);

pages.forEach((page, i) => {
    const filename = `${(i + 1).toString().padStart(2, '0')}-${page.title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    fs.writeFileSync(path.join(pagesDir, filename), createSVG(i + 1, page.title, page.subtitle, page.color));
});

console.log('Generated placeholder pages.');

