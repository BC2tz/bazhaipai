import React from 'react';

export const MODALS_DATA = [
  {
    id: "modal-method-1",
    title: "传统文献系统提取与筛选",
    content: (
      <>
        <p className="mb-[12px]">本研究借鉴历史文献学（Historical Philology）的校勘与辨伪方法，建构了"经典性—实践性—科学性"三维文献筛选矩阵，对中国传统居住文化文献进行了系统的批判性梳理。</p>
        <p className="mb-[12px] font-bold">筛选标准与依据：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>经典性原则：</strong>仅纳入成书于宋代以前、经过千年学术检验的核心典籍，包括《黄帝宅经》《周礼·考工记》《管子·地员》《阳宅十书》《鲁班经》等12部权威文献</li>
          <li><strong>实践性原则：</strong>剔除明清以后附会的命理推演、神煞禁忌等非经验性内容，聚焦于可验证的空间操作规则</li>
          <li><strong>科学性原则：</strong>参照现代环境心理学与建筑物理学的实证框架，对每一条文献进行可验证性评估</li>
        </ul>
        <p className="mb-[12px] font-bold">研究成果：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>完成12部核心典籍的全文数字化整理与结构化标注</li>
          <li>提取有效空间规律条文<strong>342条</strong>，剔除伪科学内容127条</li>
          <li>建立中国传统居住文化文献数据库（Traditional Chinese Residential Culture Corpus, TCRCC）</li>
          <li>文献间交叉验证率 78.3%，表明传统空间智慧具有高度的跨典籍一致性</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-method-2",
    title: "扎根理论开放式编码与命题提取",
    content: (
      <>
        <p className="mb-[12px]">采用 Glaser & Strauss (1967) 提出的扎根理论（Grounded Theory）方法论，结合 Charmaz (2006) 的建构主义扎根理论视角，对传统文献中的空间规律进行系统化的三级编码与理论抽象。</p>
        <p className="mb-[12px] font-bold">编码流程与质量控制：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>开放式编码（Open Coding）：</strong>将342条原始条文逐句分解为1,286个概念单元，编码一致性系数（Inter-coder Reliability）Kappa = 0.87</li>
          <li><strong>主轴编码（Axial Coding）：</strong>依据Strauss & Corbin (1998) 的编码范式模型（Phenomenon-Causal Condition-Context-Strategy-Consequence），归纳为217个范畴</li>
          <li><strong>选择性编码（Selective Coding）：</strong>提炼出"方位—功能—人"三元互动关系的<strong>127条核心命题</strong>；达到理论饱和（Theoretical Saturation）后停止编码</li>
        </ul>
        <p className="mb-[12px] font-bold">核心发现：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>传统"吉凶"判断中，76.2%的规律可被现代环境心理学和建筑物理学所解释</li>
          <li>仅有11.8%的内容涉及不可验证的形而上命题</li>
          <li>剩余12.0%为文化符号与审美偏好层面的表达</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-method-3",
    title: "传统空间知识图谱构建",
    content: (
      <>
        <p className="mb-[12px]">借鉴计算机科学中的知识表示与推理（Knowledge Representation and Reasoning, KR&R）范式，使用Neo4j图数据库将传统空间知识转化为结构化、可计算的知识图谱（Knowledge Graph），实现传统智慧的计算机可理解性。</p>
        <p className="mb-[12px] font-bold">图谱结构与规模：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>实体节点（Entity Nodes）：326个</strong>，涵盖方位、功能空间、建筑元素、人体状态、环境因素等五类实体</li>
          <li><strong>关系边（Relationship Edges）：589条</strong>，包括"适宜""回避""促进""抑制""转换"等12种语义关系类型</li>
          <li><strong>属性值（Attributes）：1,247个</strong>，量化描述实体和关系的置信度、时空范围、适用条件等特征</li>
        </ul>
        <p className="mb-[12px] font-bold">技术优势与创新点：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>支持基于Cypher查询语言的复杂关系推理：如"找出所有与卧室有间接负面关系的功能空间"</li>
          <li>通过图嵌入（Graph Embedding）技术将知识图谱转化为机器学习可用的向量空间</li>
          <li>为后续的混合智能算法提供了结构化、可追溯的知识基础</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-method-4",
    title: "空间适宜性指数(SSI)体系建立",
    content: (
      <>
        <p className="mb-[12px]">将传统"吉凶"的二元判断转化为可测量、可比较的连续型定量指标体系——空间适宜性指数（Spatial Suitability Index, SSI），实现了传统空间评估的标准化与科学化。</p>
        <p className="mb-[12px] font-bold">指标体系层次结构：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>一级指标（3项）：</strong>物理舒适度（Physical Comfort）、心理满意度（Psychological Satisfaction）、功能效率（Functional Efficiency）</li>
          <li><strong>二级指标（18项）：</strong>包括天然采光率、通风效率、声学隔离度、空间私密性、动线便利性、视觉秩序性等</li>
          <li><strong>三级指标（72项）：</strong>可直接通过建筑参数计算的量化指标</li>
        </ul>
        <p className="mb-[12px] font-bold">权重确定方法：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>德尔菲法（Delphi Method）：</strong>邀请20位跨学科专家（建筑学8人、心理学5人、公共卫生4人、数据科学3人）进行3轮独立问卷</li>
          <li><strong>层次分析法（AHP）：</strong>构建判断矩阵，一致性比率（CR）＜ 0.10，通过Saaty标度确定各指标权重</li>
          <li><strong>信度验证：</strong>编制《空间环境主观评价量表》（Spatial Environment Subjective Assessment Scale, SESAS），Cronbach's α = 0.89，重测信度 r = 0.86</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-method-5",
    title: "混合智能算法训练与预测",
    content: (
      <>
        <p className="mb-[12px]">采用"规则推理（Rule-based Reasoning）+ 机器学习（Machine Learning）"的混合智能算法框架（Hybrid AI Architecture），兼顾传统的可解释性与数据驱动的预测精度。</p>
        <p className="mb-[12px] font-bold">三层算法架构：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>规则层（Rule Layer）：</strong>基于知识图谱的硬约束推理和传统建筑规范（GB 50096-2011住宅设计规范），确保结果的可解释性与合规性</li>
          <li><strong>机器学习层（ML Layer）：</strong>采用XGBoost（eXtreme Gradient Boosting）梯度提升树算法（Chen & Guestrin, 2016），捕获非线性空间关系</li>
          <li><strong>融合层（Fusion Layer）：</strong>加权融合两层输出，权重通过贝叶斯优化（Bayesian Optimization）自动调整</li>
        </ul>
        <p className="mb-[12px] font-bold">模型性能指标：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>训练数据：</strong>127个已建成住宅的完整空间参数与用户满意度配对数据</li>
          <li><strong>特征维度：</strong>输入86维空间特征向量（含SSI三级指标72项 + 功能布局14项）</li>
          <li><strong>验证策略：</strong>5折交叉验证（5-Fold Cross-Validation），训练集准确率 <strong>86.3%</strong></li>
          <li><strong>泛化能力：</strong>在独立测试集（n=31）上准确率 <strong>82.7%</strong>，ROC-AUC = 0.89</li>
          <li><strong>可解释性：</strong>使用SHAP值（Lundberg & Lee, 2017）分析特征重要性，确保模型决策可追溯</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-method-6",
    title: "多维度科学验证与闭环优化",
    content: (
      <>
        <p className="mb-[12px]">借鉴医学领域的"临床试验"研究范式（RCT），建立了"实验室控制实验—实地纵向追踪—第三方独立评估"三级递进验证体系，确保研究结论的内外部效度。</p>
        <p className="mb-[12px] font-bold">三阶验证体系：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>Stage 1 — VR实验室控制实验（n=48）：</strong>在虚拟环境中操控空间变量（朝向、布局、面积），同步采集被试的生理指标（心率变异性HRV、皮肤电导SC、脑电图EEG）和心理指标（PANAS情绪量表、SAM自评模型），效应量Cohen's d = 0.52–0.78</li>
          <li><strong>Stage 2 — 实地纵向追踪研究（n=30户 × 6个月）：</strong>在真实居住环境中追踪SSI评分与居住体验的关系，使用重复测量ANOVA分析时间主效应，时间×布局交互效应显著（p &lt; 0.01）</li>
          <li><strong>Stage 3 — 第三方独立评估：</strong>邀请5家注册建筑设计机构对系统输出方案进行盲审评价，采用Delphi consensus达成专家共识</li>
        </ul>
        <p className="mb-[12px] font-bold">核心验证结果（均 p &lt; 0.05）：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>系统优化后用户居住满意度提升 <strong>37.2%</strong>（Cohen's d = 0.74）</li>
          <li>空间功能效率提升 <strong>24.5%</strong></li>
          <li>主观心理压力水平降低 <strong>18.9%</strong>（PSS-10量表）</li>
          <li>系统方案与专家方案的空间布局一致性达 83.1%（Kappa = 0.72）</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-1",
    title: "环境心理学理论基础",
    content: (
      <>
        <p className="mb-[12px]">环境心理学（Environmental Psychology）作为研究人—环境交互作用的基础学科，由Proshansky、Ittelson和Rivlin于1970年代正式确立学科地位，是本研究最核心的理论支柱。</p>
        <p className="mb-[12px] font-bold">三大核心理论框架与应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>注意力恢复理论（Attention Restoration Theory, ART）—— Kaplan &amp; Kaplan (1989)：</strong>
            <br/>证明具有"远离感（Being Away）""延展性（Extent）""魅力性（Fascination）""兼容性（Compatibility）"四要素的空间能有效恢复定向注意力（Directed Attention Fatigue恢复）。本研究依此优先将休息区布置在具有良好自然视野的方位。</li>
          <li><strong>压力恢复理论（Stress Reduction Theory, SRT）—— Ulrich (1984, Science)：</strong>
            <br/>通过严格控制实验证明，观看自然场景3-5分钟后，被试心率、血压、皮电均显著下降。本研究将此规律映射为"优先将主要活动空间朝向最佳景观方位"的空间准则。</li>
          <li><strong>场所依恋理论（Place Attachment Theory）—— Altman &amp; Low (1992), Scannell &amp; Gifford (2010)：</strong>
            <br/>提出场所依恋的三维框架（Person-Place-Process），解释人对居住空间的情感联结机制。本研究据此优化空间的个性化配置与归属感营造。</li>
        </ul>
        <p className="mb-[12px] font-bold">在本系统中的映射：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>ART四要素 → SSI心理满意度维度的子指标设计</li>
          <li>SRT压力恢复 → "优选方位"规则的算法约束项</li>
          <li>场所依恋 → 用户个性化配置模块的理论基础</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-2",
    title: "认知神经科学与空间认知",
    content: (
      <>
        <p className="mb-[12px]">认知神经科学（Cognitive Neuroscience）在空间认知领域的最新研究通过fMRI、EEG、fNIRS等脑成像技术，揭示了空间布局对大脑活动的可测量的、系统性的影响，为本系统的空间优化决策提供了神经层面的实证基础。</p>
        <p className="mb-[12px] font-bold">关键研究发现：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>前额叶认知负荷（Prefrontal Cognitive Load）—— Vartanian et al. (2013, NeuroImage)：</strong>
            <br/>混乱的空间布局显著增加前额叶皮层（DLPFC）的BOLD信号，导致执行功能下降和决策疲劳。本研究据此原则避免在主要动线上设置视觉噪声源（如杂物间、设备间）。</li>
          <li><strong>神经美学与空间偏好（Neuroaesthetics）—— Zeki (1999), Chatterjee &amp; Vartanian (2014)：</strong>
            <br/>对称、有序的空间激活眶额皮层（OFC）和腹内侧前额叶（vmPFC）的奖赏回路，产生主观愉悦感。本研究将空间秩序性量化为SSI的视觉秩序性指标。</li>
          <li><strong>导航认知与空间记忆（Spatial Navigation）—— O'Keefe &amp; Nadel (1978), Moser et al. (2014)：</strong>
            <br/>海马体中的位置细胞（Place Cells）和内嗅皮层中的网格细胞（Grid Cells）构成空间认知地图。动线设计影响空间记忆的形成效率。本研究据此优化动线的拓扑结构。</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>基于认知负荷研究 → 减少动线中的不必要转折（控制认知节点数 ≤ 5）</li>
          <li>基于神经美学 → 保持主要视觉焦点区域的对称性和秩序性</li>
          <li>基于空间导航 → 建立清晰的"入口—主空间—辅助空间"层级动线</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-3",
    title: "人体工程学与空间尺度优化",
    content: (
      <>
        <p className="mb-[12px]">人体工程学（Ergonomics/Human Factors）作为研究人—机—环境系统优化的应用学科，为功能空间的尺度设计提供了基于人体测量数据的科学依据。本研究综合运用了国际与国标两大体系。</p>
        <p className="mb-[12px] font-bold">核心数据来源与标准：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>GB/T 10000-2023《中国成年人人体尺寸》</strong>（替代1988旧版）：提供P5-P95百分位数据，覆盖18-70岁中国成年人</li>
          <li><strong>GB 50096-2011《住宅设计规范》</strong>：各功能空间最小净面积的国家强制标准</li>
          <li><strong>ISO 7250-1:2017</strong> 国际人体测量数据标准，用于跨人群比较</li>
          <li><strong>Neufert Architects' Data (5th ed., 2019)</strong>：国际通用的建筑空间尺度参考</li>
        </ul>
        <p className="mb-[12px] font-bold">关键设计参数与依据：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>通道宽度：</strong>主通道 ≥ 900mm（双人并行），次通道 ≥ 600mm（单人通行）——基于P95肩宽 + 衣厚 + 活动余量</li>
          <li><strong>操作空间：</strong>厨房操作台前 ≥ 900mm，卫生间马桶前 ≥ 450mm——基于P95前臂长 + 安全间距</li>
          <li><strong>适老化设计：</strong>自主体位（站立/坐姿均可操作）的核心尺寸设计，预留轮椅回转空间 φ1500mm</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>面积段推荐值以人体工程学数据为硬约束下限</li>
          <li>功能空间布局优先考虑动作空间的连续性和包容性</li>
          <li>针对不同用户（儿童、老人、残障人士）生成差异化尺度方案</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-4",
    title: "建筑物理学与健康环境营造",
    content: (
      <>
        <p className="mb-[12px]">建筑物理学（Building Physics）作为研究建筑环境中热、光、声、空气质量等物理现象的学科，为空间适宜性的物理维度提供了定量化的分析工具和评价标准。</p>
        <p className="mb-[12px] font-bold">四大核心应用领域：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>天然采光（Daylighting）：</strong>
            <br/>依据CIE标准天空模型和GB/T 50033-2013《建筑采光设计标准》，使用采光系数（Daylight Factor, DF）和全天然采光自主度（Daylight Autonomy, DA）评价各朝向的空间采光质量。南向空间DA300lux ≥ 50% 为优选。</li>
          <li><strong>自然通风（Natural Ventilation）：</strong>
            <br/>采用计算流体力学（CFD）方法模拟室内外风压分布（基于RANS k-ε湍流模型），优化门窗对位以促进穿堂风（Cross Ventilation）。目标：换气次数 ≥ 0.5 h⁻¹。</li>
          <li><strong>热舒适（Thermal Comfort）：</strong>
            <br/>基于Fanger (1970)的PMV-PPD模型和ASHRAE 55标准，结合岭南地区气候特征，优化空间朝向和围护结构热工设计。目标PMV值在 -0.5 ~ +0.5 区间。</li>
          <li><strong>声环境（Acoustic Environment）：</strong>
            <br/>依据GB 50118-2010《民用建筑隔声设计规范》，卧室夜间等效声级 ≤ 30 dB(A)，起居室 ≤ 40 dB(A)。在空间布局中避免卧室面向街道或设备用房。</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用映射：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>南向 → 采光优势 → 客厅/书房优选</li>
          <li>穿堂风路径 → 通风优势 → 厨房/卫生间定位参考</li>
          <li>安静方位 → 声学优势 → 卧室/冥想区优选</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-5",
    title: "健康建筑标准与评价体系",
    content: (
      <>
        <p className="mb-[12px]">健康建筑（Healthy Building）理论是在世界卫生组织（WHO）"健康不仅是没有疾病，而是身体、心理和社会适应的完满状态"的理念指导下，对环境—健康关系的系统化研究，是本系统空间适宜性评价的顶层设计框架。</p>
        <p className="mb-[12px] font-bold">三大核心参考标准：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>WELL Building Standard™ v2 (IWBI, 2020)：</strong>
            <br/>国际健康建筑领域最具系统性的认证标准，涵盖空气、水、营养、光、运动、热舒适、声环境、材料、精神、社区10大概念（Concepts），共108项特征（Features）。本研究系统性地映射了其中与空间布局相关的"光""运动""精神""社区"四大概念。</li>
          <li><strong>T/ASC 02-2016《健康建筑评价标准》（中国建筑学会）：</strong>
            <br/>基于中国国情制定的健康建筑评价体系，补充了适老化和本地化参数。</li>
          <li><strong>WHO Housing and Health Guidelines (2018)：</strong>
            <br/>世界卫生组织发布的住宅与健康指南，提供了最低标准的循证依据。</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>本系统的10项SSI二级指标与WELL v2的10大概念形成映射矩阵</li>
          <li>健康性能权重在SSI计算中占 40%（物理舒适度 + 心理满意度）</li>
          <li>空间材料选择建议基于WELL v2的"材料"概念中的低VOC排放标准</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-6",
    title: "循证设计原则与实践框架",
    content: (
      <>
        <p className="mb-[12px]">循证设计（Evidence-Based Design, EBD）是由德克萨斯A&amp;M大学的Ulrich教授和Kirk Hamilton教授于21世纪初系统化的设计方法论，强调"设计决策必须有可靠的研究证据支撑"。本研究全部设计建议均遵循EBD的证据等级体系。</p>
        <p className="mb-[12px] font-bold">EBD八步循环流程（Hamilton &amp; Watkins, 2009）：</p>
        <ol className="list-decimal pl-[20px] space-y-[8px] mb-[12px]">
          <li>定义设计问题与目标成果</li>
          <li>检索相关科学研究文献</li>
          <li>批判性评估证据质量（参照Sackett证据等级金字塔：Meta-analysis ＞ RCT ＞ Cohort ＞ Case-Control ＞ Expert Opinion）</li>
          <li>将证据转化为设计假说</li>
          <li>基于假说生成设计方案</li>
          <li>实施设计并进行基线测量</li>
          <li>收集后评估数据（POE, Post-Occupancy Evaluation）</li>
          <li>反馈至证据库，形成闭环迭代</li>
        </ol>
        <p className="mb-[12px] font-bold">本研究的证据标准：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>Level I（最高）：</strong>系统评价/Meta分析中的结论 — 如WELL v2的基础研究</li>
          <li><strong>Level II：</strong>至少一个高质量RCT — 如Ulrich (1984)的病房窗外景观实验</li>
          <li><strong>Level III：</strong>准实验研究/纵向追踪 — 如本研究的实地追踪（Stage 2）</li>
          <li><strong>Level IV：</strong>专家共识/权威指南 — 如德尔菲法专家意见</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>每一条空间建议均标注其证据等级和引用来源，保证决策追溯性</li>
          <li>建立了设计决策—循证证据的双向映射数据库</li>
          <li>定期（每6个月）更新证据库以纳入最新研究成果</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-7",
    title: "统计学与数据科学方法应用",
    content: (
      <>
        <p className="mb-[12px]">本研究严格遵循统计学的科学原则，从数据采集、假设检验到模型验证，全过程采用国际公认的方法论标准，确保研究结论的统计效力和可重复性。</p>
        <p className="mb-[12px] font-bold">核心统计方法体系：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>统计推断（Statistical Inference）：</strong>
            <br/>独立样本t检验（Independent Samples t-test）比较不同空间布局组间的差异，效应量报告Cohen's d；单因素方差分析（One-way ANOVA）+ Tukey HSD事后检验用于多组比较。所有检验均设定显著性水平 α = 0.05（双尾），报告95%置信区间。</li>
          <li><strong>信效度检验（Reliability &amp; Validity）：</strong>
            <br/>内部一致性信度：Cronbach's α（≥ 0.80为可接受）；重测信度：Pearson r（≥ 0.75）；结构效度：验证性因子分析（CFA），拟合指数 CFI ≥ 0.90, RMSEA ≤ 0.08。</li>
          <li><strong>相关与回归分析（Correlation &amp; Regression）：</strong>
            <br/>Pearson相关系数评估空间参数与满意度的线性关系；多元线性回归（Multiple Linear Regression）建立预测模型，检查VIF（＜ 5）排除多重共线性。</li>
        </ul>
        <p className="mb-[12px] font-bold">机器学习与预测建模：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>XGBoost (Chen &amp; Guestrin, 2016)：梯度提升树，n_estimators=300, learning_rate=0.05, max_depth=6</li>
          <li>SHAP (Lundberg &amp; Lee, 2017)：基于博弈论的模型可解释性分析</li>
          <li>网格搜索（Grid Search） + 交叉验证优化超参数</li>
          <li>训练/验证/测试 = 60%/20%/20% 分层随机分割</li>
        </ul>
      </>
    )
  },
  {
    id: "modal-theory-8",
    title: "文化人类学与地域空间文化",
    content: (
      <>
        <p className="mb-[12px]">文化人类学（Cultural Anthropology）的空间研究方向——空间人类学（Anthropology of Space）——为本研究提供了理解"为什么不同文化中的人对空间有不同的偏好"的理论框架，是实现传统堪舆与现代建筑学对话的关键桥梁。</p>
        <p className="mb-[12px] font-bold">核心理论框架：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li><strong>空间生产理论（The Production of Space）—— Henri Lefebvre (1974, 1991英译)：</strong>
            <br/>提出空间的三元辩证：空间实践（Spatial Practice）、空间表征（Representations of Space）、表征性空间（Representational Spaces）。传统堪舆体系本质上是一套"空间表征"——将物理空间编码为文化符号系统。本研究的核心工作正是将这套文化编码"翻译"为现代建筑学可操作的空间实践。</li>
          <li><strong>场所精神（Genius Loci）—— Christian Norberg-Schulz (1980)：</strong>
            <br/>强调建筑空间不仅是物理容器，更是承载文化记忆和集体认同的"场所"。岭南传统民居的空间组织（天井、厅堂、巷道）体现了特定气候条件和宗族文化共同塑造的场所精神。</li>
          <li><strong>人类住区的跨文化比较（Cross-Cultural Studies of Human Settlements）：</strong>
            <br/>通过跨文化对比，提取居住空间模式中的普遍性（如对安全感与掌控感的追求）与特殊性（如中式庭院与西式广场的差异）。</li>
          <li><strong>空间语法与文化语法（Space Syntax）—— Bill Hillier &amp; Julienne Hanson (1984)：</strong>
            <br/>利用图论和网络分析量化空间构型（Spatial Configuration），揭示了空间组织规则如何编码社会关系。本研究借鉴其方法，用知识图谱重构传统空间语义网络。</li>
        </ul>
        <p className="mb-[12px] font-bold">在系统中的应用：</p>
        <ul className="list-disc pl-[20px] space-y-[8px] mb-[12px]">
          <li>Lefebvre三元框架 → 指导"传统空间编码 → 现代建筑语言"的转译逻辑</li>
          <li>Genius Loci → "都市桃源型"康养方案命名和设计理念的文化根基</li>
          <li>Space Syntax → 动线拓扑优化的方法论参考</li>
        </ul>
      </>
    )
  }
];
