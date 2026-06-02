import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. Decrease all font weights by one
// To avoid double-replacing, we use a single function
content = content.replace(/\bfont-(black|extrabold|bold|semibold|medium)\b/g, (match, weight) => {
    if (weight === 'black') return 'font-bold';
    if (weight === 'extrabold') return 'font-bold';
    if (weight === 'bold') return 'font-medium';
    if (weight === 'semibold') return 'font-medium';
    if (weight === 'medium') return 'font-normal';
    return match;
});

// 2. We now have a file with no font-black, and all font-bold used to be font-black.
// Let's restore/increase font weights for titles.
// Titles can be identified by the "academic-title" class, or being h1, h2, h3, h4.
// Let's just find <h1, <h2, <h3, <h4, <h5, <h6 and replace font-bold|font-medium|font-normal with font-black
// We can do this with basic string replacements since there aren't many.

const headingRegex = /(<h[1-6][^>]*className=(?:["']|{`))([^>"'`}]+)(["'`}]|`})/g;

content = content.replace(headingRegex, (match, before, classes, after) => {
    // Increase weight to font-black for headings
    let newClasses = classes
        .replace(/\bfont-bold\b/g, 'font-black')
        .replace(/\bfont-medium\b/g, 'font-black')
        .replace(/\bfont-normal\b/g, 'font-black');
        
    if (!/font-(black|bold|medium)/.test(newClasses)) {
        newClasses += ' font-black'; // ensure they have it
    }
    
    return before + newClasses + after;
});

// Also fix elements with academic-title
const academicTitleRegex = /(<[^>]*className=(?:["']|{`)[^>"'`}]*academic-title[^>"'`}]+)(["'`}]|`})/g;
content = content.replace(academicTitleRegex, (match, before, after) => {
    let newBefore = before
        .replace(/\bfont-bold\b/g, 'font-black')
        .replace(/\bfont-medium\b/g, 'font-black')
        .replace(/\bfont-normal\b/g, 'font-black');
    return newBefore + after;
});

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Done!');
