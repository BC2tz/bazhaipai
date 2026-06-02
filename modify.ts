import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// The strategy:
// Match tags like <tagName ...>
// Determine if it's a heading: /^\s*<h[1-6]/ or /^\s*<Title/ or contains 'academic-title'
// If it is NOT a heading, replace font-black -> font-bold, font-bold -> font-medium, font-medium -> font-normal
// Wait, font-medium -> font-normal implies we can just remove `font-medium` or replace with `font-normal`.

const tagRegex = /<([a-zA-Z0-9]+)([^>]*?)>/g;

content = content.replace(tagRegex, (match, tag, attrs) => {
    const isTitle = /^h[1-6]$/i.test(tag) || tag === 'Title' || attrs.includes('academic-title');
    
    if (isTitle) {
        return match; // Do not modify title elements yet (will ensure title weight is kept high)
    }

    // Decrease font weight
    let newAttrs = attrs
        .replace(/\bfont-black\b/g, 'font-bold')
        .replace(/\bfont-extrabold\b/g, 'font-bold')
        .replace(/\bfont-bold\b/g, 'font-medium')
        .replace(/\bfont-medium\b/g, 'font-normal');
        
    return `<${tag}${newAttrs}>`;
});

// For Title component, let's make sure it's bold or black if not already
// The JSX might also span multiple lines, so a naive regex might miss tags with newlines.
// A better approach for multi-line tags:
// /<([a-zA-Z0-9]+)([\s\S]*?)>/g
// Let's re-run with [\s\S]*?

content = fs.readFileSync('src/App.tsx', 'utf-8');
const tagRegexMulti = /<([a-zA-Z0-9]+)([\s\S]*?)>/g;

content = content.replace(tagRegexMulti, (match, tag, attrs) => {
    const isTitle = /^h[1-6]$/i.test(tag) || tag === 'Title' || attrs.includes('academic-title');
    
    if (isTitle) {
        // Ensure titles are font-black if they don't have font-bold/black already? 
        // Actually the prompt says "除了标题以外... 标题的字重必须大于内容"
        // Titles in this codebase currently use `font-black` or `font-bold`.
        return match;
    }

    // Decrease font weight
    // Note: since replacing 'font-black' to 'font-bold' might then cascade to 'font-medium' if chained,
    // we should use a replace replacer function.

    let newAttrs = attrs.replace(/\bfont-(black|extrabold|bold|semibold|medium)\b/g, (m, weight) => {
        if (weight === 'black') return 'font-bold';
        if (weight === 'extrabold') return 'font-bold';
        if (weight === 'bold') return 'font-medium';
        if (weight === 'semibold') return 'font-medium';
        if (weight === 'medium') return 'font-normal';
        return m;
    });
        
    return `<${tag}${newAttrs}>`;
});

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Modified font weights successfully');
