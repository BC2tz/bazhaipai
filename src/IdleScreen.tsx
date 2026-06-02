import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// ── 学术幻灯片数据 ────────────────────────────────────────
const SLIDES = [
  {
    id: 'slide-1',
    title: '文献提取与扎根编码',
    subtitle: 'LITERATURE EXTRACTION & GROUNDED CODING',
    content:
      '以 PRISMA 系统综述框架筛选 2000–2025 年 CNKI/Web of Science 中"建成环境 × 老年人健康"文献，提取 1,247 条有效编码节点，经三级扎根理论逐级归纳为 "物理空间—生理响应—心理感知" 三元耦合模型。',
    tags: ['PRISMA', '扎根理论', 'NVivo 14', '1,247 编码节点'],
  },
  {
    id: 'slide-2',
    title: '知识图谱构建',
    subtitle: 'KNOWLEDGE GRAPH CONSTRUCTION',
    content:
      '基于 Neo4j 图数据库构建"空间属性—康养指标—设计策略"多层次知识图谱，涵盖 8 大宅向 × 6 面积段 × 32 空间类型的 1,536 个三元组，支撑推理式方案生成。',
    tags: ['Neo4j', 'Cypher', '1,536 三元组', 'OWL 本体'],
  },
  {
    id: 'slide-3',
    title: 'SSI 体系建立',
    subtitle: 'SPATIAL SUITABILITY INDEX SYSTEM',
    content:
      '融合中国传统人居环境思想方位吉凶与 ISO 21542:2021 无障碍标准、CIBSE Guide A 热舒适指标，构建 4 级评分体系（S/A/B/C），每级含 12 个维度共计 48 项评价指标。',
    tags: ['ISO 21542', 'CIBSE Guide A', 'AHP 层次分析', '48 项指标'],
  },
  {
    id: 'slide-4',
    title: '混合算法寻优',
    subtitle: 'HYBRID ALGORITHM OPTIMIZATION',
    content:
      'XGBoost 回归预测空间适配得分（R²=0.891），遗传算法（GA）在 8 宅向 × 9 宫格组合空间中搜索帕累托最优解，收敛代数约 120 代，单次寻优耗时 < 2.3s。',
    tags: ['XGBoost', '遗传算法', 'R²=0.891', '< 2.3 秒'],
  },
  {
    id: 'slide-5',
    title: '多维交叉验证',
    subtitle: 'MULTI-DIMENSIONAL VALIDATION',
    content:
      '采用德尔菲法（n=21 专家）迭代 3 轮达成共识（Kendall W=0.83），结合实地调研与 35 个真实户型回溯测试，SSI 评分与实际居住满意度 Pearson r = 0.87 (p < 0.001)。',
    tags: ['德尔菲法', 'Kendall W=0.83', 'Pearson r=0.87', 'p < 0.001'],
  },
  {
    id: 'slide-6',
    title: '环境心理学基础',
    subtitle: 'ENVIRONMENTAL PSYCHOLOGY',
    content:
      '基于 Kaplan 注意力恢复理论（ART）与 Ulrich 压力缓解理论（SRT），实证表明：自然采光（>300 lux）可降低皮质醇 16%，窗外绿视率 >25% 显著提升老年人心理幸福感（WHOQOL-BREF）。',
    tags: ['Kaplan ART', 'Ulrich SRT', '皮质醇 -16%', 'WHOQOL-BREF'],
  },
  {
    id: 'slide-7',
    title: '神经美学视角',
    subtitle: 'NEUROAESTHETICS & SPATIAL PERCEPTION',
    content:
      'fMRI 研究表明曲线空间激活前额叶皮层奖赏回路（Vartanian et al., 2013, PNAS），拱形天花与圆形平面相比直角空间使被试愉悦度提升 22%，与 PSPECT 多巴胺释放正相关。',
    tags: ['fMRI', 'Vartanian 2013', 'PNAS', '愉悦度 +22%'],
  },
  {
    id: 'slide-8',
    title: '循证验证体系',
    subtitle: 'EVIDENCE-BASED VALIDATION',
    content:
      '整合循证设计（EBD）四阶段流程：证据检索→批判评估→设计转化→后评估（POE），横跨建成环境、神经科学、人体工程学三大领域，形成闭合反馈的学术—实践验证环。',
    tags: ['循证设计 EBD', 'POE 后评估', '三学科交叉', '闭环验证'],
  },
];

// ── useIdleTimer Hook ──────────────────────────────────────
export function useIdleTimer(timeoutMs: number = 10000, paused: boolean = false) {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    setIsIdle(false);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setIsIdle(true), timeoutMs);
  }, [timeoutMs]);

  // 暂停期间：清除计时器 + 强制非空闲
  useEffect(() => {
    if (paused) {
      setIsIdle(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    } else {
      resetTimer();
    }
  }, [paused, resetTimer]);

  useEffect(() => {
    if (paused) return; // 暂停时不监听用户事件
    resetTimer();
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'];
    events.forEach((e) => window.addEventListener(e, resetTimer));
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((e) => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, paused]);

  return isIdle;
}

// ── 主组件：满屏白底极简风格，匹配开屏界面设计 ────────────
interface IdleScreenProps {
  isActive: boolean;
  onWake?: () => void;
}

export default function IdleScreen({ isActive, onWake }: IdleScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    if (!isActive) { setSlideIndex(0); return; }
    const interval = setInterval(() => setSlideIndex((i) => (i + 1) % SLIDES.length), 8000);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    if (!isActive) return;
    const handleKey = (e: KeyboardEvent) => { onWake?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isActive, onWake]);

  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          onClick={onWake}
          className="fixed inset-0 z-[300] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden select-none"
        >
          {/* 点阵背景 —— 复刻开屏动画 */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'radial-gradient(rgba(255,92,0,0.22) 2px, transparent 0)',
            backgroundSize: '40px 40px',
          }} />
          {/* 扫略光条 */}
          <div className="absolute top-1/2 -translate-y-1/2 h-[200px] w-[50%] bg-gradient-to-r from-transparent via-[#FF5C00]/15 to-transparent blur-3xl opacity-20 pointer-events-none" />
          {/* 左右橙色竖条 */}
          <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-40 bg-[#FF5C00]" />
          <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-40 bg-[#FF5C00]" />
          {/* 四角指示 */}
          <div className="absolute top-8 left-8 flex items-center gap-2">
            <div className="w-2 h-2 bg-[#FF5C00] animate-pulse rounded-full" />
            <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#999999]">待机中 · IDLE</span>
          </div>
          <div className="absolute top-8 right-8 text-[10px] font-mono uppercase tracking-[0.3em] text-[#999999]">
            {String(slideIndex + 1).padStart(2, '0')} / {String(SLIDES.length).padStart(2, '0')}
          </div>
          {/* 中央文字轮播 */}
          <AnimatePresence mode="wait">
            <motion.div key={slideIndex}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="relative z-10 text-center max-w-7xl w-full px-8 xl:px-12 space-y-8 xl:space-y-16"
            >
              <div className="flex items-center justify-center gap-4 xl:gap-6 mb-4 xl:mb-6">
                <div className="w-16 xl:w-20 h-1 xl:h-1.5 bg-[#121212]/20" />
                <span className="text-[12px] xl:text-[16px] font-medium uppercase tracking-[0.4em] xl:tracking-[0.6em] text-[#666666]">{SLIDES[slideIndex].subtitle}</span>
                <div className="w-16 xl:w-20 h-1 xl:h-1.5 bg-[#121212]/20" />
              </div>
              <h1 className="text-[60px] xl:text-[90px] 2xl:text-[100px] font-black academic-title uppercase tracking-tighter leading-[0.9] text-[#121212]">
                {SLIDES[slideIndex].title}
              </h1>
              <p className="text-lg xl:text-xl 2xl:text-2xl leading-relaxed text-[#555555] font-normal mt-6 xl:mt-8 w-full max-w-5xl mx-auto">
                {SLIDES[slideIndex].content}
              </p>
              <div className="flex flex-wrap justify-center gap-3 pt-6 xl:pt-10">
                {SLIDES[slideIndex].tags.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-[#121212]/5 text-[#121212] text-[14px] xl:text-[16px] font-mono font-medium tracking-widest">{tag}</span>
                ))}
              </div>
              <div className="flex justify-center gap-2.5 pt-4 xl:pt-6">
                {SLIDES.map((_, i) => (
                  <div key={i} className="w-1.5 h-1.5 border border-[#121212]/20 transition-all duration-500"
                    style={{ background: i === slideIndex ? '#FF5C00' : 'transparent', borderColor: i === slideIndex ? '#FF5C00' : undefined }} />
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
          <div className="absolute bottom-36 xl:bottom-40 animate-pulse">
            <span className="text-[18px] xl:text-[22px] font-medium tracking-[0.5em] text-[#FF5C00]">
              轻触屏幕以开始
            </span>
          </div>
          <div className="absolute bottom-20 flex items-center gap-6">
            <div className="h-px w-8 bg-[#121212]/10" />
            <span className="text-[15px] font-mono uppercase tracking-[0.3em] text-[#BBBBBB]">系统待机屏保 · 学术研究成果展示</span>
            <div className="h-px w-8 bg-[#121212]/10" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
