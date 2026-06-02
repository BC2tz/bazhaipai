import * as fs from 'fs';
let content = fs.readFileSync('src/App.tsx', 'utf-8');

const targetStr = `                            <span className={\`text-2xl sm:text-3xl xl:text-5xl font-mono font-medium leading-tight mb-1 \${isGood ? 'text-[#009E5F]' : isBad ? 'text-[#E53935]' : ''}\`}>{status?.star}</span>`;

const replStr = `                            <span className={\`text-2xl sm:text-3xl xl:text-5xl font-mono font-medium leading-tight mb-1 \${isGood ? 'text-[#009E5F]' : isBad ? 'text-[#FF5C00]' : ''}\`}>{status?.star}</span>`;

content = content.replace(targetStr, replStr).replace(targetStr, replStr);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('done');
