import * as fs from 'fs';

let content = fs.readFileSync('src/App.tsx', 'utf-8');

// 1. ADD QR CODE IMPORT
if (!content.includes("import { QRCodeSVG }")) {
    content = content.replace("import { motion, AnimatePresence } from 'motion/react';", 
`import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';`);
}

// 2. YEAR INPUT BOX
const yearPickerOld = `<LBrackets /><div className="flex justify-between items-center mb-6 border-b border-[#121212] pb-4"><h3 className="text-lg font-black font-mono uppercase tracking-[2px]">Select Year / 选择出生年份</h3><button onClick={() => setIsYearPickerOpen(false)}><X size={20} /></button></div>
        <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">`;

const yearPickerNew = `<LBrackets /><div className="flex justify-between items-center mb-6 border-b border-[#121212] pb-4"><h3 className="text-lg font-black font-mono uppercase tracking-[2px]">Select Year / 选择出生年份</h3><button onClick={() => setIsYearPickerOpen(false)}><X size={20} /></button></div>
        <div className="mb-4 flex gap-2">
          <input 
            type="number" 
            min={1920} 
            max={2024} 
            className="flex-1 h-12 border border-[#121212] px-4 font-mono text-sm focus:outline-none focus:border-[#FF5C00] bg-white text-[#121212]" 
            placeholder="输入年份 (例如: 1990)..."
            value={year || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (!isNaN(val)) setYear(val);
            }} 
          />
        </div>
        <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">`;

content = content.replace(yearPickerOld, yearPickerNew);

// 3. IMAGE PLACEHOLDERS
content = content.replace(
    /https:\/\/placehold\.co\/1000x1000\/121212\/ffffff\?text=LAYOUT_GEN_\$\{sitting\.toUpperCase\(\)\}_\$\{area\}sqm\.jpg/g,
    '/assets/layouts/LAYOUT_GEN_${sitting}_${area}sqm.jpg'
);
content = content.replace(
    /https:\/\/placehold\.co\/1000x1000\/121212\/ffffff\?text=HEALING_GEN_\$\{sitting\.toUpperCase\(\)\}_\$\{area\}sqm\.jpg/g,
    '/assets/layouts/HEALING_GEN_${sitting}_${area}sqm.jpg'
);

// 4. THE QR CODE
const qrTarget = `{Array.from({ length: 64 }).map((_, i) => (
                     <div key={i} className={\`w-[12.5%] h-[12.5%] \${Math.random() > 0.4 ? 'bg-[#121212]' : 'bg-transparent'}\`} />
                   ))}
                   <div className="absolute top-1 left-1 w-4 h-4 xl:w-6 xl:h-6 border-2 border-[#121212] bg-white p-0.5"><div className="w-full h-full bg-[#121212]" /></div>
                   <div className="absolute top-1 right-1 w-4 h-4 xl:w-6 xl:h-6 border-2 border-[#121212] bg-white p-0.5"><div className="w-full h-full bg-[#121212]" /></div>
                   <div className="absolute bottom-1 left-1 w-4 h-4 xl:w-6 xl:h-6 border-2 border-[#121212] bg-white p-0.5"><div className="w-full h-full bg-[#121212]" /></div>`;

const qrRepl = `<QRCodeSVG value={\`生成方案: \${houseName}, \${area}㎡, 命卦: \${mingGuaValue ? ['','坎','坤','震','巽','中','乾','兑','艮','离'][mingGuaValue] : '-'}, 年份: \${year}\`} size={128} className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)]" bgColor="#ffffff" fgColor="#121212" level="M" />`;

content = content.replace(qrTarget, qrRepl);

// 5. HOVER TOOLTIP IN GRID
const gridTarget1 = `<div className="w-full text-center mt-auto border-t-[1.5px] border-[#eeeeee] pt-1">
                              <span className="text-[10px] xl:text-[14px] 2xl:text-[16px] font-medium text-[#121212] line-clamp-1 italic">{func}</span>
                            </div>`;

const gridRepl1 = `<div className="w-full text-center mt-auto border-t-[1.5px] border-[#eeeeee] pt-1 bg-white relative z-10 transition-transform group-hover:-translate-y-6 xl:group-hover:-translate-y-8">
                              <span className="text-[10px] xl:text-[14px] 2xl:text-[16px] font-medium text-[#121212] line-clamp-1 italic">{func}</span>
                            </div>
                            {status && STAR_COMPATIBILITY[status.star]?.unsuitable && (
                              <div className="absolute bottom-0 left-0 w-full bg-[#FF5C00] text-white p-1 xl:p-1.5 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform z-0">
                                <span className="text-[8px] xl:text-[10px] font-bold">⚠️ 忌用功能</span>
                                <span className="text-[8px] xl:text-[10px] leading-tight truncate w-full text-center">{STAR_COMPATIBILITY[status.star].unsuitable.join('、')}</span>
                              </div>
                            )}`;

content = content.replace(gridTarget1, gridRepl1).replace(gridTarget1, gridRepl1); // Two occurrences

// 6. HEALING_DATA design rendering
const suggestionTarget = `</p>
            </div>

            {(level`;

const suggestionRepl = `</p>
            </div>

            {viewMode === 'healing' && mingGuaValue && HEALING_DATA[mingGuaValue]?.palaces?.[selectedPalace]?.design && (
              <div className="space-y-8 bg-[#FF5C00]/5 p-12 relative mt-8 border-2 border-[#FF5C00]/20">
                  <LBrackets />
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-6 bg-[#FF5C00]" />
                    <h3 className="text-[20px] font-black uppercase tracking-widest text-[#FF5C00]">Healing Strategy / 康养设计建议</h3>
                  </div>
                  <p className="text-[24px] leading-relaxed text-[#121212] font-medium tracking-tight whitespace-pre-wrap">
                     {HEALING_DATA[mingGuaValue].palaces[selectedPalace].design}
                  </p>
              </div>
            )}

            {(level`;

content = content.replace(suggestionTarget, suggestionRepl);

fs.writeFileSync('src/App.tsx', content, 'utf-8');
console.log('Done!');
