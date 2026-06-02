import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';

// ----- Types -----
type GuaType = 'kan' | 'kun' | 'zhen' | 'xun' | 'qian' | 'dui' | 'gen' | 'li';
type Gender = 'male' | 'female';

export interface MobileResultProps {
  houseName: string;
  area: string;
  mingGuaValue: number;
  sitting: GuaType;
  gender: Gender;
  year: string;
  overviewImage: string;
}

const GUA_NAMES: Record<string, string> = {
  kan: '坎', kun: '坤', zhen: '震', xun: '巽',
  qian: '乾', dui: '兑', gen: '艮', li: '离',
};

export default function MobileResult({
  houseName, area, mingGuaValue, gender, year, overviewImage,
}: MobileResultProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    if (!cardRef.current || saving) return;
    setSaving(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#FFFFFF',
        useCORS: true,
        allowTaint: true,
      });
      const link = document.createElement('a');
      link.download = `八宅方案_${houseName}_${year}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error('Save failed:', e);
    }
    setSaving(false);
  };

  const guaName = ['', '坎', '坤', '震', '巽', '', '乾', '兑', '艮', '离'][mingGuaValue] || '?';
  const guaType = (['', 'east', 'west', 'east', 'east', '', 'west', 'west', 'west', 'east'] as const)[mingGuaValue];
  const guaTypeName = guaType === 'east' ? '东四命' : '西四命';

  return (
    <div className="min-h-screen bg-[#12151C] font-sans" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
      {/* Capture card — white bg so saved image has white background */}
      <div ref={cardRef} className="bg-white mx-auto max-w-[420px] min-h-screen flex flex-col">

        {/* Hero: 深色顶栏 */}
        <div className="bg-[#12151C] text-white px-4 pt-8 pb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[10px] tracking-[0.25em] text-[#FF5C00]/70 uppercase">
              八宅空间适配系统
            </div>
            <div className="text-[10px] text-white/30">
              {new Date().toLocaleDateString('zh-CN')}
            </div>
          </div>
          <h1 className="text-[22px] font-black tracking-tight leading-tight">
            {houseName} · {guaName}命
          </h1>
          <div className="flex gap-3 text-[12px] text-white/50 mt-1.5">
            <span>{year} · {gender === 'male' ? '男' : '女'}</span>
            <span>{area}㎡</span>
            <span className="text-[#FF5C00]/70">{guaTypeName}</span>
          </div>
        </div>

        {/* Divider line */}
        <div className="h-0.5 bg-gradient-to-r from-[#FF5C00] via-[#FF5C00]/40 to-transparent" />

        {/* 方案概览图 — 核心内容 */}
        <div className="flex-1 px-2 py-2">
          <div className="bg-[#F5F5F5] rounded overflow-hidden shadow-sm">
            <img
              src={overviewImage}
              alt={`${houseName} 方案概览`}
              className="w-full h-auto block"
              crossOrigin="anonymous"
            />
          </div>
        </div>

        {/* 底部信息 */}
        <div className="px-4 py-3 text-center border-t border-[#eeeeee]">
          <p className="text-[11px] text-[#999999] leading-relaxed">
            基于八宅理论的古代人居空间分类法数字化转译<br />
            建筑学五年级毕业设计 · 广州美术学院
          </p>
        </div>
      </div>

      {/* 保存按钮 — 固定在底部，不在截图区域内 */}
      <div className="max-w-[420px] mx-auto px-4 py-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3.5 bg-[#FF5C00] text-white text-[15px] font-bold tracking-wider active:scale-95 transition-all rounded shadow-lg shadow-[#FF5C00]/20"
        >
          {saving ? '生成中…' : saved ? '✅ 已保存到相册' : '💾 保存图片到相册'}
        </button>
        <p className="text-[11px] text-white/30 text-center mt-2.5">
          长按上方图片也可保存至相册
        </p>
      </div>
    </div>
  );
}
