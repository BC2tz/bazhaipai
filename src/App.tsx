import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Compass, 
  Activity, 
  Layout, 
  Info, 
  Ruler, 
  X,
  Loader2,
  ChevronRight,
  Maximize2,
  ArrowLeft,
  Play
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import gsap from 'gsap';
import { MODALS_DATA } from './modalsData';
import IdleScreen, { useIdleTimer } from './IdleScreen';

/**
 * 【配置对象】
 * 可通过修改此对象一键更换开屏动画内容与全局风格
 */
const ANIMATION_CONFIG = {
  // 文字内容
  title: "空间适配生成系统",
  subtitle: "空间网格同步加载中...",
  bottomText: "BA ZHAI DYNAMIC SPATIAL ANALYSIS SYSTEM",
  
  // 颜色值
  primaryColor: "#FF5C00",      // 橙色 (品牌色)
  secondaryColor: "#FFFFFF",    // 白色 (底色改为白色)
  accentColor: "#121212",       // 黑色
  glowColor: "rgba(255, 92, 0, 0.4)", // 发光颜色
  
  // 动画设置
  duration: 4.5,                // 总时长 (秒)
  autoSkip: true,               // 是否在结束后自动进入主界面 (true: 自动, false: 点击跳转)
  gridSpeed: 30,                // 网格背景移动周期 (秒)
};

// --- Types ---
type Direction = 'N' | 'S' | 'E' | 'W' | 'NE' | 'NW' | 'SE' | 'SW' | 'Center';
type GuaType = 'kan' | 'kun' | 'zhen' | 'xun' | 'qian' | 'dui' | 'gen' | 'li';
type Gender = 'male' | 'female';

export type LongDirection = 
  | 'north'     // 正北
  | 'south'     // 正南
  | 'east'      // 正东
  | 'west'      // 正西
  | 'northeast' // 东北
  | 'northwest' // 西北
  | 'southeast' // 东南
  | 'southwest';// 西南

export type AuspiciousLevel = 
  | 'shengqi'   // 生气（大吉1级）
  | 'yannian'   // 延年（大吉1级）
  | 'tianyi'    // 天医（中吉2级）
  | 'fuwei'     // 伏位（小吉2级）
  | 'liusha'    // 六煞（小凶3级）
  | 'huohai'    // 祸害（中凶4级）
  | 'wugui'     // 五鬼（大凶5级）
  | 'jueming';  // 绝命（大凶5级）

export type RoomType = 
  // 核心居住空间
  | 'master_bedroom' | 'elderly_bedroom' | 'second_bedroom'
  | 'children_room' | 'third_bedroom' | 'guest_room'
  // 公共活动空间
  | 'living_room' | 'dining_room' | 'study' | 'home_office'
  | 'family_activity' | 'tea_room' | 'library' | 'yoga_room'
  // 辅助功能空间
  | 'kitchen' | 'main_bathroom' | 'guest_bathroom' | 'powder_room'
  | 'laundry_room' | 'storage' | 'deep_storage' | 'walk_in_closet'
  | 'shoe_closet' | 'equipment_room' | 'garbage_room' | 'utility_room'
  | 'pantry' | 'staircase' | 'foyer' | 'entrance' | 'balcony_storage' | 'maid_room'
  | 'storage_cabinet' | 'recycling_zone' | 'display_cabinet'
  // 特色功能空间
  | 'gym' | 'wine_cellar' | 'smoking_room' | 'pet_area' | 'pet_toilet' | 'pet_cleaning' | 'reading_nook'
  // 复合子空间
  | 'home_office_nook' | 'breakfast_bar' | 'powder_nook' | 'children_play_nook';

export type HouseType = 
  | 'kan'   // 坎宅（坐北朝南）
  | 'li'    //离宅（坐南朝北）
  | 'zhen'  // 震宅（坐东朝西）
  | 'xun'   // 巽宅（坐东南朝西北）
  | 'qian'  // 乾宅（坐西北朝东南）
  | 'kun'   // 坤宅（坐西南朝东北）
  | 'gen'   // 艮宅（坐东北朝西南）
  | 'dui';  // 兑宅（坐西朝东）

export interface LayoutResult {
  layout: Record<LongDirection, RoomType>;
  warnings: string[];
  explanations: Record<LongDirection, {
    traditional: string;
    modern: string;
    suggestion: string;
  }>;
  isHouseLifeMatch: boolean;
}

interface AssignedFunction {
  palace: Direction;
  functionName: string;
  weight: number;
  finalScore: number;
}

// --- Utils ---
const calculateGua = (year: number, gender: Gender): { targetGua: GuaType, name: string } => {
  const n = calculateLifeGua(year, gender);
  const map: Record<number, GuaType> = {
    1: 'kan', 2: 'kun', 3: 'zhen', 4: 'xun', 6: 'qian', 7: 'dui', 8: 'gen', 9: 'li'
  };
  const g = map[n] || 'kan';
  return { targetGua: g, name: GUA_NAMES[g] || '坎' };
};

const getHouseName = (sitting: GuaType): string => {
   const names: Record<GuaType, string> = {
     kan: '坎宅 (坐北向南)',
     li: '离宅 (坐南向北)',
     zhen: '震宅 (坐东向西)',
     xun: '巽宅 (坐东南向西北)',
     qian: '乾宅 (坐西北向东南)',
     dui: '兑宅 (坐西向东)',
     gen: '艮宅 (坐东北向西南)',
     kun: '坤宅 (坐西南向东北)'
   };
   return names[sitting];
};

// --- Constants & Data ---
const DIRECTIONS: Direction[] = ['NW', 'N', 'NE', 'W', 'Center', 'E', 'SW', 'S', 'SE'];

/**
 * 【康养环境专属数据】
 * 基于子山午向（坐北朝南）住宅的环境心理偏好类型布局规范
 */
// ★ 2026-06-01 二次修正：所有星位逐向按坎宅大游年歌（坎五天生延绝祸六）重写。NW=liusha N=fuwei NE=wugui W=huohai E=tianyi SW=jueming S=yannian SE=shengqi
const HEALING_DATA: Record<number, {
  advantage: string;
  disadvantage: string;
  palaces: Partial<Record<Direction, { star: AuspiciousLevel; func: string; design: string }>>;
}> = {
  1: {
    advantage: "【户型编号】A-综合\n【风水逻辑】西南绝命大凶位设卫生间，以水泄金（金生水则绝命之金煞随水而去），化凶为吉效果最强",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  9: {
    advantage: "【户型编号】A-综合\n【风水逻辑】西南绝命大凶位设卫生间，以水泄金（金生水则绝命之金煞随水而去），化凶为吉效果最强",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  3: {
    advantage: "【户型编号】A-综合\n【风水逻辑】西南绝命大凶位设卫生间，以水泄金（金生水则绝命之金煞随水而去），化凶为吉效果最强",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  4: {
    advantage: "【户型编号】A-综合\n【风水逻辑】西南绝命大凶位设卫生间，以水泄金（金生水则绝命之金煞随水而去），化凶为吉效果最强",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  7: {
    advantage: "【户型编号】A-综合\n【风水逻辑】西南绝命大凶位设卫生间，以水泄金（金生水则绝命之金煞随水而去），化凶为吉效果最强",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  2: {
    advantage: "【户型编号】B-综合\n【风水逻辑】西北六煞小凶位设卫生间，凶星属水，以水（卫生间）助水（六煞）则煞气流通散去，对坤命老人无负面影响",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠西南墙（绝命位）或东北墙（五鬼位）",
    palaces: {
      NW: { star: 'liusha', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  6: {
    advantage: "【户型编号】C-综合\n【风水逻辑】东北五鬼大凶位设卫生间，五鬼属土，土克水而凶星之土气被水消耗，对乾命老人无负面影响",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠西北墙（六煞位）或西南墙（绝命位）",
    palaces: {
      NW: { star: 'liusha', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      W: { star: 'huohai', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  },
  8: {
    advantage: "【户型编号】D-综合\n【风水逻辑】正西祸害中凶位设卫生间，祸害属土，土克水则凶气自损，对艮命老人无负面影响",
    disadvantage: "【床位微调指南】\n- 东四命：床头靠北墙（伏位）\n- 西四命：床头靠东北墙（五鬼位）或西北墙（六煞位）",
    palaces: {
      NW: { star: 'liusha', func: '休闲会客区', design: '双人沙发+小茶几，可接待2-3位访客' },
      N: { star: 'fuwei', func: '主卧室', design: '1.5m×2.0m护理床，床头靠北墙（东四命最佳），两侧预留80cm护理通道' },
      NE: { star: 'wugui', func: '衣柜区', design: '顶天立地衣柜，2.4m宽，存放衣物被褥' },
      W: { star: 'huohai', func: '卫生间', design: '独立干湿分离卫生间，内设扶手、防滑地砖、紧急呼叫按钮' },
      E: { star: 'tianyi', func: '书桌阅读区', design: '1.2m×0.6m书桌+书架，面向南方采光，供老人读书写字' },
      SW: { star: 'jueming', func: '电视柜', design: '1.2m电视柜+43英寸电视，下方抽屉存放常用物品' },
      S: { star: 'yannian', func: '阳台', design: '阳台摆放2张藤椅+1张小茶几，供老人晒太阳观景' },
      SE: { star: 'shengqi', func: '绿植区', design: '摆放长寿花、君子兰等绿植，设置小型花架' },
    }
  }
};

/**
 * 【康养策略文案】ABCD 四型
 * 基于卫生间方位对应不同风水格局，融合科学依据与传统智慧
 */
const HEALING_STRATEGIES: Record<string, string> = {
  A: `【A型·绝命压煞方案】

科学视角：西南向房间全天日照分布最为均衡，将卫生间设于此可有效规避主要起居区接受过量午后西晒，将室内热负荷峰值延后约两小时。南向阳台配合合理进深，冬季正午有效日照时长充裕，天然采光系数达到国际WELL健康建筑标准推荐值。寝区紧贴北墙布置，远离管道噪音源，夜间等效声级可稳定控制在30dB以下，满足《民用建筑隔声设计规范》对老年居室的最高标准，保障深度睡眠不被中断。

风水视角：坎宅（坐北朝南）中，西南属绝命大凶位，五行归金。古人认为此方为宅中煞气最盛之处，主健康隐忧。将卫生间安于此，取金生水之理——绝命之金煞遇水则生化为流通之气，随排水而去，不复积聚。此即八宅古法「以煞制煞」之精髓：以宅中最旺之水势引导最烈之金煞，使其归流而散。本案北设寝区于伏位，东置读写区于天医，南向阳台居于延年吉方——四吉星各司其职，使居者无论命理归属，皆可受益于建筑本身的气场秩序。古人云「宅以形势为身体，以泉水为血脉」，空间布局合理，则气血自通。`,

  B: `【B型·六煞流转化方案】

科学视角：西北向以漫反射光为主，光线柔和无眩光，将卫生间设于此可避免高湿度空间接受直射日照，有效抑制霉菌滋生。北窗散射光是阅读与精细工作的理想照明条件，色温接近正午自然光，与人体昼夜节律的日间相高度匹配。南向阳台全天承接直射光，冬季阳光可深度穿透室内，提供自然补热并降低主动供暖能耗。储物区远离卫浴湿区，室内相对湿度可稳定维持在45%至55%区间的舒适范围。

风水视角：坎宅西北属六煞小凶位，五行归水，主口舌是非。卫生间同属水——两水于西北方相会，依照五行生克之理，水性流动不居，煞气遇同气则互激而散，不复凝滞。古人言「水流则不腐，枢机不蠹」，正寓此理。西南绝命方设为会客区，以日常起居的人气疏通绝命金煞；东北五鬼方置衣柜，以木质之厚重镇守火土之气。南向延年大吉方留作阳台，北伏位安床、东天医设桌案、东南生气培植花木——八宫各得其所，全宅吉星为主、凶星为辅。建筑的秩序感本身即是安养之力，不因人而异，唯因宅而彰。`,

  C: `【C型·五鬼镇煞方案】

科学视角：东北向在全天日照轨迹中最早进入阴影区，温度日波动幅度最小，是整宅热环境最稳定的角落。将卫生间设于此，其管道噪音对寝区与读写区的干扰传播路径被储物家具自然阻断，声衰减效果显著。南向阳台全天候采光，使寝区、读写区与阳台之间形成连续光通道——视线可自北墙贯通至南端，创造空间纵深感。环境心理学中的注意力恢复理论指出，视野的延续性有助于缓解精神疲劳，这对任何年龄段的使用者都具有普适价值。

风水视角：坎宅东北属五鬼大凶位，五行归土，古人视为灾厄之方。卫生间属水，土遇水则其势自散——凶星之烈气被水气消解，不再逞威。此即《八宅明镜》「以煞化煞」之变通用法。西北六煞位设衣柜，木纳水气而镇浮荡；西南绝命方布会客沙发，以人气之阳冲克绝命之阴寒。寝区居北伏位以安稳身心，读写区处东天医以涵养精神，南向延年方承接日光，东南生气位养绿植以助生机。全宅九宫各居其位，恰如人体经络各司其职——不与命理争辩，只与空间对话。`,

  D: `【D型·祸害转安方案】

科学视角：正西向承接午后直射光，将卫生间设于此可利用西晒实现湿区的自然干燥，降低机械通风能耗与霉菌滋生风险。同时西侧墙体充当热缓冲层，使北向寝区与东向读写区免受午后热浪直接冲击。西北会客区与东北储物区形成「社交—私密」空间梯度——居住者可在沙发位置目视入口与阳台，拥有对全宅动线的自然掌控感。环境心理学研究表明，空间中的视觉控制感是居住满意度的重要预测因子，此布局使这种控制无需刻意营造便自然存在。

风水视角：坎宅正西属祸害中凶位，五行归土，主口角损耗。卫生间属水——土虽克水，然水势充足则反制其土，使祸害之煞气自耗其力。此非硬碰硬的「镇压」，而是水柔之性自然化解土刚之煞，如细雨浸沃土，不急不躁。西南绝命方置电视柜，以电器的日常律动——古人称之为「火气」——流转绝命之金寒；西北六煞方设会客区，人气之阳驱散水性之阴。北伏位寝区、东天医读写区、南延年阳台、东南生气绿植——四吉环抱，凶星自守其位而不扰全局。居宅者不问来路，空间自有其回应。`,
};

/** 根据命卦值映射 ABCD 户型（取决于卫生间所在方位） */
function getOverviewType(mingGuaValue: number): 'A' | 'B' | 'C' | 'D' {
  const typeMap: Record<number, 'A' | 'B' | 'C' | 'D'> = {
    1: 'A', 3: 'A', 4: 'A', 7: 'A', 9: 'A',
    2: 'B',
    6: 'C',
    8: 'D',
  };
  return typeMap[mingGuaValue] || 'A';
}

// 户型图片池随机抽取（每次生成结果时随机一张）
const POOL: Record<string, { dir: string; ext: string; size: number }> = {
  A: { dir: 'A', ext: 'webp', size: 36 },
  B: { dir: 'B', ext: 'webp', size: 7 },
  C: { dir: 'C', ext: 'webp', size: 11 },
  D: { dir: 'D', ext: 'webp', size: 11 },
};
function getOverviewImage(overviewType: 'A' | 'B' | 'C' | 'D'): string {
  const p = POOL[overviewType];
  if (p) {
    const idx = Math.floor(Math.random() * p.size) + 1;
    return `/assets/layouts/${p.dir}/${p.dir}_${idx}.${p.ext}`;
  }
  return `/assets/layouts/OVERVIEW_${overviewType}.jpg`;
}

const DIRECTIONS_ZH: Record<Direction, string> = {
  'N': '正北', 'S': '正南', 'E': '正东', 'W': '正西',
  'NE': '东北', 'NW': '西北', 'SE': '东南', 'SW': '西南',
  'Center': '中宫'
};

const HOUSE_CATEGORIES: Record<GuaType, '东四宅' | '西四宅'> = {
  kan: '东四宅', zhen: '东四宅', xun: '东四宅', li: '东四宅',
  kun: '西四宅', qian: '西四宅', dui: '西四宅', gen: '西四宅'
};

const GUA_NAMES: Record<string, string> = {
  kan: '坎', kun: '坤', zhen: '震', xun: '巽',
  qian: '乾', dui: '兑', gen: '艮', li: '离'
};
// ★ 2026-05-31 修正：按照标准八宅大游年歌（八宅明镜）逐项校对
// 坎五天生延绝祸六 → 坎→坤→震→巽→乾→兑→艮→离
// 离六五绝延祸生天 → 离→坤→兑→乾→艮→震→巽→坎
// 震延生祸绝五天六 → 震→巽→坎→离→艮→坤→兑→乾
// 巽天五六祸生绝延 → 巽→坎→离→艮→坤→震→兑→乾
// 乾六天五祸绝延生 → 乾→兑→艮→坤→坎→巽→震→离
// 坤天延绝生祸五六 → 坤→坎→离→艮→震→巽→兑→乾
// 艮六绝祸生延天五 → 艮→震→巽→坎→离→坤→兑→乾
// 兑生祸延绝六五天 → 兑→乾→坤→艮→震→巽→坎→离
const HOUSE_AUSPICIOUS_MAP: Record<HouseType, Record<LongDirection, AuspiciousLevel>> = {
  kan:  { north: 'fuwei',  northeast: 'wugui',   east: 'tianyi',  southeast: 'shengqi', south: 'yannian',  southwest: 'jueming', west: 'huohai',  northwest: 'liusha' },
  li:   { south: 'fuwei',  southwest: 'liusha',   west: 'wugui',   northwest: 'jueming',  north: 'yannian',  northeast: 'huohai', east: 'shengqi', southeast: 'tianyi' },
  zhen: { east: 'fuwei',   southeast: 'yannian',  south: 'shengqi', southwest: 'huohai', west: 'jueming',  northwest: 'wugui',  north: 'tianyi', northeast: 'liusha' },
  xun:  { southeast: 'fuwei', south: 'tianyi',    southwest: 'wugui', west: 'liusha',  northwest: 'huohai', north: 'shengqi', northeast: 'jueming', east: 'yannian' },
  qian: { northwest: 'fuwei', west: 'shengqi',    southwest: 'yannian', south: 'jueming', southeast: 'huohai', east: 'wugui',  northeast: 'tianyi', north: 'liusha' },
  kun:  { southwest: 'fuwei', west: 'tianyi',     northwest: 'yannian', north: 'jueming', northeast: 'shengqi', east: 'huohai', southeast: 'wugui', south: 'liusha' },
  gen:  { northeast: 'fuwei', east: 'liusha',     southeast: 'jueming', south: 'huohai', southwest: 'shengqi', west: 'yannian', northwest: 'tianyi', north: 'wugui' },
  dui:  { west: 'fuwei',     northwest: 'shengqi', north: 'huohai',   northeast: 'yannian', east: 'jueming', southeast: 'liusha', south: 'wugui',   southwest: 'tianyi' }
};

const ROOM_PRIORITY_BY_AREA: Record<string, Record<AuspiciousLevel, RoomType[]>> = {
  '60': {
    shengqi: ['master_bedroom', 'living_room', 'home_office_nook'],
    yannian: ['master_bedroom', 'second_bedroom', 'breakfast_bar', 'powder_nook'],
    tianyi: ['second_bedroom', 'dining_room'],
    fuwei: ['living_room', 'entrance', 'dining_room'],
liusha: ['storage', 'laundry_room', 'guest_bathroom', 'pet_area'],
    huohai: ['kitchen', 'storage'],
wugui: ['kitchen', 'main_bathroom', 'storage', 'storage_cabinet'],
    jueming: ['main_bathroom', 'guest_bathroom', 'deep_storage'],
  },
  '90': {
    shengqi: ['master_bedroom', 'children_room', 'study', 'home_office', 'living_room', 'home_office_nook', 'children_play_nook'],
    yannian: ['elderly_bedroom', 'master_bedroom', 'second_bedroom', 'dining_room', 'breakfast_bar', 'powder_nook'],
    tianyi: ['second_bedroom', 'study', 'dining_room', 'walk_in_closet'],
    fuwei: ['living_room', 'entrance', 'dining_room'],
    liusha: ['storage', 'laundry_room', 'guest_bathroom', 'pet_area', 'balcony_storage', 'storage_cabinet', 'pet_cleaning'],
    huohai: ['kitchen', 'guest_bathroom', 'storage', 'pantry'],
wugui: ['kitchen', 'main_bathroom', 'storage', 'storage_cabinet'],
    jueming: ['main_bathroom', 'guest_bathroom', 'deep_storage'],
  },
  '120': {
    shengqi: ['master_bedroom', 'children_room', 'elderly_bedroom', 'study', 'home_office', 'library', 'living_room', 'home_office_nook', 'children_play_nook'],
    yannian: ['elderly_bedroom', 'master_bedroom', 'second_bedroom', 'yoga_room', 'dining_room', 'breakfast_bar', 'powder_nook'],
    tianyi: ['second_bedroom', 'study', 'elderly_bedroom', 'dining_room', 'family_activity', 'walk_in_closet'],
    fuwei: ['living_room', 'entrance', 'second_bedroom', 'family_activity', 'dining_room', 'foyer'],
    liusha: ['storage', 'laundry_room', 'guest_bathroom', 'pet_area', 'balcony_storage', 'storage_cabinet', 'pet_cleaning'],
    huohai: ['kitchen', 'guest_bathroom', 'storage', 'pantry', 'recycling_zone'],
wugui: ['kitchen', 'main_bathroom', 'storage', 'storage_cabinet'],
    jueming: ['main_bathroom', 'guest_bathroom', 'deep_storage'],
  },
  'plus': {
    shengqi: ['master_bedroom', 'children_room', 'elderly_bedroom', 'third_bedroom', 'study', 'home_office', 'library', 'living_room', 'home_office_nook', 'children_play_nook'],
    yannian: ['elderly_bedroom', 'master_bedroom', 'second_bedroom', 'tea_room', 'yoga_room', 'dining_room', 'breakfast_bar', 'powder_nook', 'powder_room'],
    tianyi: ['second_bedroom', 'study', 'elderly_bedroom', 'third_bedroom', 'dining_room', 'tea_room', 'family_activity', 'walk_in_closet'],
    fuwei: ['living_room', 'entrance', 'second_bedroom', 'family_activity', 'dining_room', 'foyer'],
    liusha: ['storage', 'laundry_room', 'guest_bathroom', 'pet_area', 'balcony_storage', 'maid_room', 'gym', 'reading_nook', 'storage_cabinet', 'pet_cleaning'],
    huohai: ['kitchen', 'guest_bathroom', 'storage', 'pantry', 'wine_cellar', 'recycling_zone'],
wugui: ['kitchen', 'main_bathroom', 'storage', 'storage_cabinet'],
    jueming: ['main_bathroom', 'guest_bathroom', 'deep_storage'],
  },
};

function getRoomPriority(area: number): Record<AuspiciousLevel, RoomType[]> {
  if (area <= 60) return ROOM_PRIORITY_BY_AREA['60'];
  if (area <= 90) return ROOM_PRIORITY_BY_AREA['90'];
  if (area <= 120) return ROOM_PRIORITY_BY_AREA['120'];
  return ROOM_PRIORITY_BY_AREA['plus'];
}

// 同类房间族（同族不重复）
const ROOM_FAMILIES: Record<string, string> = {
  'storage': 'storage', 'storage_cabinet': 'storage', 'deep_storage': 'storage', 'pantry': 'storage',
};

function getRoomFamily(room: RoomType): string {
  return ROOM_FAMILIES[room] || room;
}

function getRoomDisplayName(room: RoomType): string {
  return ROOM_NAMES[room] || room;
}

const AUSPICIOUS_RANK: Record<AuspiciousLevel, number> = {
  shengqi: 1, yannian: 2, tianyi: 3, fuwei: 4, liusha: 5, huohai: 6, wugui: 7, jueming: 8
};

const LONG_DIRECTION_NAMES: Record<LongDirection, string> = {
  north: '正北', south: '正南', east: '正东', west: '正西', northeast: '东北', northwest: '西北', southeast: '东南', southwest: '西南'
};

const AUSPICIOUS_NAMES: Record<AuspiciousLevel, string> = {
  shengqi: '生气', yannian: '延年', tianyi: '天医', fuwei: '伏位', liusha: '六煞', huohai: '祸害', wugui: '五鬼', jueming: '绝命'
};

const ROOM_NAMES: Record<RoomType, string> = {
  master_bedroom: '主卧', elderly_bedroom: '老人房', second_bedroom: '次卧',
  children_room: '儿童房', third_bedroom: '第三卧室', guest_room: '客房',
  living_room: '客厅', dining_room: '餐厅', study: '书房', home_office: '居家办公区',
  family_activity: '家庭娱乐区', tea_room: '茶室', library: '藏书室', yoga_room: '瑜伽室',
  kitchen: '厨房', main_bathroom: '主卫', guest_bathroom: '客卫', powder_room: '化妆间',
  laundry_room: '洗衣房', storage: '储藏室', deep_storage: '深储藏室', walk_in_closet: '步入式衣帽间',
  shoe_closet: '鞋柜', equipment_room: '设备间', garbage_room: '垃圾间', utility_room: '工具间',
  pantry: '食品储藏室', staircase: '楼梯间', foyer: '门厅', entrance: '玄关',
  balcony_storage: '阳台储藏', maid_room: '佣人房',
  gym: '健身房', wine_cellar: '酒窖', smoking_room: '吸烟室', pet_area: '宠物区', pet_toilet: '宠物厕所',
  home_office_nook: '办公角', breakfast_bar: '早餐吧台', powder_nook: '梳妆角', children_play_nook: '儿童游戏角',
  storage_cabinet: '储物柜', reading_nook: '阅读角', recycling_zone: '分类回收区',
  display_cabinet: '展示柜', pet_cleaning: '宠物清洁区'
};

export function computeGridLayout(
  sitting: GuaType,
  area: number
): Record<Direction, { star: AuspiciousLevel; room: RoomType | '公共区域'; roomName: string }> {
  const directions: Direction[] = ['NW', 'N', 'NE', 'W', 'E', 'SW', 'S', 'SE'];
  const longDirMap: Partial<Record<Direction, LongDirection>> = {
    NW: 'northwest', N: 'north', NE: 'northeast',
    W: 'west', E: 'east', SW: 'southwest', S: 'south', SE: 'southeast',
  };

  const auspiciousMap = HOUSE_AUSPICIOUS_MAP[sitting as HouseType];
  const roomPriority = getRoomPriority(area);

  // Star priority order
  const starOrder: AuspiciousLevel[] = ['shengqi', 'yannian', 'tianyi', 'fuwei', 'liusha', 'huohai', 'wugui', 'jueming'];

  // Map direction to star
  const dirStar: Record<Direction, AuspiciousLevel> = {} as any;
  for (const dir of directions) {
    dirStar[dir] = auspiciousMap[longDirMap[dir]!];
  }

  const result: Record<Direction, { star: AuspiciousLevel; room: RoomType | '公共区域'; roomName: string }> = {} as any;
  const usedRooms = new Set<RoomType>();
  const usedFamilies = new Set<string>();

  // 中宫固定
  result['Center'] = { star: 'fuwei' as AuspiciousLevel, room: '公共区域', roomName: '公共区域' };

  // 按星位优先级处理
  for (const star of starOrder) {
    // Find all directions with this star
    for (const dir of directions) {
      if (dirStar[dir] === star && !result[dir]) {
        const candidates = roomPriority[star] || [];
        let assigned: RoomType | null = null;

        // Find first candidate that doesn't conflict
        for (const room of candidates) {
          const family = getRoomFamily(room);
          if (!usedRooms.has(room) && !usedFamilies.has(family)) {
            assigned = room;
            break;
          }
        }

        // Fallback: if all candidates conflict, take first one (allow partial conflict)
        if (!assigned && candidates.length > 0) {
          assigned = candidates[0];
        }

        if (assigned) {
          result[dir] = { star, room: assigned, roomName: getRoomDisplayName(assigned) };
          usedRooms.add(assigned);
          usedFamilies.add(getRoomFamily(assigned));
        }
      }
    }
  }

  return result;
}

const GRID_TO_LONG: Record<Exclude<Direction, 'Center'>, LongDirection> = {
  N: 'north', S: 'south', E: 'east', W: 'west', NE: 'northeast', NW: 'northwest', SE: 'southeast', SW: 'southwest'
};

export const DIRECTION_EXPLANATIONS: Record<AuspiciousLevel, { traditional: string; modern: string; suggestion: string }> = {
  shengqi: {
    traditional: '大吉位，主财运亨通、事业兴旺、人丁昌盛，是宅中最旺的方位',
    modern: '区域具备优越的采光与通风条件，气流循环稳定。通过优化空间布局，可显著提升心境愉悦感与认知专注度，符合人体高效运行的心理环境需求。',
    suggestion: '建议采用明亮温暖的色调，保持空间开阔通透，避免堆放杂物'
  },
  yannian: {
    traditional: '大吉位，主健康长寿、婚姻美满、家庭和睦，特别适合老年人居住',
    modern: '气场环境平缓柔和，周边声学干扰极低。依托舒适的室内微气候，有助于延长连续睡眠时间，改善自主神经调节，是最佳的高品质康养居住区域。',
    suggestion: '建议使用隔音效果好的门窗，配备舒适的床品，避免强光直射'
  },
  tianyi: {
    traditional: '中吉位，主身体健康、贵人相助、疾病痊愈，有治病救人的气场',
    modern: '该区域空气质量高，光照充足且光色温和。稳定的空间场域能降低中枢神经系统的压力，有助于调节身体机能与生物节律，宜用作康复或休养空间。',
    suggestion: '建议摆放绿植，保持空气清新，营造安静舒适的环境'
  },
  fuwei: {
    traditional: '小吉位，主运势平稳、家庭平安、诸事顺遂，是宅主的本命位',
    modern: '空间布局能够提供较强的安全感与秩序感，有助于家庭成员建立平稳的心理链接，缓解社交疲劳。',
    suggestion: '建议采用开放式布局，增加家人互动的机会'
  },
  liusha: {
    traditional: '小凶位，主口舌是非、人际关系不和、桃花泛滥',
    modern: '此区域气流扰动较强或声学环境相对复杂，易导致神经系统处于高警觉状态。宜通过增加物理隔绝或降噪处理，减轻居住者的心理消耗。',
    suggestion: '将其转化为功能性区域，避免用作卧室、书房等重要静态空间。可设置为客厅的延伸部分，或设置玄关处的储物间。但设置玄关需注意设置屏风或隔断减缓气流，保持空间整洁干燥'
  },
  huohai: {
    traditional: '中凶位，主疾病缠身、破财损耗、家庭争吵',
    modern: '空间存在气流不畅或异味积聚的潜在风险，容易影响室内环境的空气品质，从而降低居住者生活质量。需优化空间通风与除湿方案。',
    suggestion: '建议加强通风排气，保持空间干净整洁，避免长期停留'
  },
  wugui: {
    traditional: '大凶位，主意外灾祸、火灾盗窃、是非不断',
    modern: '此方位能量场波动剧烈，不适宜作为需要专注与放松的功能空间，易导致心理压力增大。宜用作辅助功能空间，并在装饰上采取柔和的物理处理。',
    suggestion: '建议安装防火和排气设备，保持空间干燥，避免存放易燃易爆物品'
  },
  jueming: {
    traditional: '大凶位，主重大疾病、破财伤身、灾祸连连，是宅中最差的方位',
    modern: '因自然环境物理特性导致该位置较难获得均衡的光照与空气调节，长期停留可能会增加心理不适与应激反应，应尽可能减少在该区域的驻留时间。',
    suggestion: '建议尽量封闭，只作为储藏或设备空间，不要在此处设置座位或床铺'
  }
};

export const STAR_COMPATIBILITY_BY_AREA: Record<string, Record<AuspiciousLevel, { suitable: string[], unsuitable: string[] }>> = {
  '60': {
    shengqi: { suitable: ['主卧', '客厅', '办公角'], unsuitable: ['卫生间', '厨房', '储藏室'] },
    yannian: { suitable: ['主卧', '次卧', '早餐吧台', '梳妆角'], unsuitable: ['卫生间', '厨房'] },
    tianyi: { suitable: ['次卧', '餐厅'], unsuitable: ['卫生间'] },
    fuwei: { suitable: ['客厅', '玄关', '餐厅'], unsuitable: ['厨房', '卫生间'] },
    liusha: { suitable: ['储藏室', '洗衣房', '鞋柜', '宠物区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    huohai: { suitable: ['厨房', '储藏室'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    wugui: { suitable: ['主卫', '厨房', '储藏室'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
    jueming: { suitable: ['主卫', '客卫', '深储藏室'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
  },
  '90': {
    shengqi: { suitable: ['主卧', '儿童房', '书房', '居家办公区', '客厅', '办公角', '儿童游戏角'], unsuitable: ['卫生间', '厨房', '储藏室'] },
    yannian: { suitable: ['老人房', '主卧', '次卧', '餐厅', '早餐吧台', '梳妆角'], unsuitable: ['卫生间', '厨房'] },
    tianyi: { suitable: ['次卧', '书房', '餐厅', '步入式衣帽间'], unsuitable: ['卫生间'] },
    fuwei: { suitable: ['客厅', '玄关', '餐厅'], unsuitable: ['厨房', '卫生间'] },
    liusha: { suitable: ['储藏室', '洗衣房', '客卫', '鞋柜', '宠物区', '阳台储藏', '储物柜', '宠物清洁区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    huohai: { suitable: ['厨房', '客卫', '储藏室', '食品储藏室'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    wugui: { suitable: ['厨房', '主卫', '储藏室', '储物柜'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
    jueming: { suitable: ['主卫', '客卫', '深储藏室'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
  },
  '120': {
    shengqi: { suitable: ['主卧', '儿童房', '老人房', '书房', '居家办公区', '藏书室', '客厅', '办公角', '儿童游戏角'], unsuitable: ['卫生间', '厨房', '储藏室'] },
    yannian: { suitable: ['老人房', '主卧', '次卧', '瑜伽室', '餐厅', '早餐吧台', '梳妆角'], unsuitable: ['卫生间', '厨房'] },
    tianyi: { suitable: ['次卧', '书房', '老人房', '餐厅', '家庭娱乐区', '步入式衣帽间'], unsuitable: ['卫生间'] },
    fuwei: { suitable: ['客厅', '玄关', '次卧', '家庭娱乐区', '餐厅', '门厅'], unsuitable: ['厨房', '卫生间'] },
    liusha: { suitable: ['储藏室', '洗衣房', '客卫', '鞋柜', '宠物区', '阳台储藏', '储物柜', '宠物清洁区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    huohai: { suitable: ['厨房', '客卫', '储藏室', '食品储藏室', '分类回收区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    wugui: { suitable: ['厨房', '主卫', '储藏室', '储物柜'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
    jueming: { suitable: ['主卫', '客卫', '深储藏室'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
  },
  'plus': {
    shengqi: { suitable: ['主卧', '儿童房', '老人房', '第三卧室', '书房', '居家办公区', '藏书室', '客厅', '办公角', '儿童游戏角'], unsuitable: ['卫生间', '厨房', '储藏室'] },
    yannian: { suitable: ['老人房', '主卧', '次卧', '茶室', '瑜伽室', '餐厅', '早餐吧台', '梳妆角', '化妆间'], unsuitable: ['卫生间', '厨房'] },
    tianyi: { suitable: ['次卧', '书房', '老人房', '第三卧室', '餐厅', '茶室', '家庭娱乐区', '步入式衣帽间'], unsuitable: ['卫生间'] },
    fuwei: { suitable: ['客厅', '玄关', '次卧', '家庭娱乐区', '餐厅', '门厅'], unsuitable: ['厨房', '卫生间'] },
    liusha: { suitable: ['储藏室', '洗衣房', '客卫', '鞋柜', '宠物区', '阳台储藏', '佣人房', '健身房', '阅读角', '储物柜', '宠物清洁区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    huohai: { suitable: ['厨房', '客卫', '储藏室', '食品储藏室', '酒窖', '分类回收区'], unsuitable: ['卧室', '客厅', '餐厅', '书房'] },
    wugui: { suitable: ['厨房', '主卫', '储藏室', '储物柜'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
    jueming: { suitable: ['主卫', '客卫', '深储藏室'], unsuitable: ['客厅', '卧室', '餐厅', '书房'] },
  },
};

export function getStarCompatibility(area: number): Record<AuspiciousLevel, { suitable: string[], unsuitable: string[] }> {
  if (area <= 60) return STAR_COMPATIBILITY_BY_AREA['60'];
  if (area <= 90) return STAR_COMPATIBILITY_BY_AREA['90'];
  if (area <= 120) return STAR_COMPATIBILITY_BY_AREA['120'];
  return STAR_COMPATIBILITY_BY_AREA['plus'];
}

class BazhaiLayoutGenerator {
  private warnings: string[] = [];

  getRequiredRoomsByArea(area: number): RoomType[] {
    if (area <= 60) {
      return [
        'master_bedroom', 'second_bedroom', 'living_room', 'dining_room',
        'kitchen', 'main_bathroom', 'laundry_room', 'entrance',
        'shoe_closet', 'storage', 'pet_area', 'deep_storage',
        'home_office_nook', 'breakfast_bar', 'powder_nook'
      ];
    } else if (area <= 90) {
      return [
        'master_bedroom', 'children_room', 'second_bedroom', 'living_room',
        'dining_room', 'study', 'kitchen', 'main_bathroom',
        'guest_bathroom', 'pantry', 'entrance', 'shoe_closet',
        'walk_in_closet', 'laundry_room', 'storage', 'storage_cabinet',
        'deep_storage', 'reading_nook', 'children_play_nook', 'pet_cleaning'
      ];
    } else if (area <= 120) {
      return [
        'master_bedroom', 'elderly_bedroom', 'children_room', 'living_room',
        'dining_room', 'study', 'home_office', 'family_activity',
        'kitchen', 'main_bathroom', 'guest_bathroom', 'recycling_zone',
        'entrance', 'foyer', 'shoe_closet', 'walk_in_closet',
        'laundry_room', 'pet_area', 'deep_storage', 'storage_cabinet',
        'balcony_storage'
      ];
    } else {
      return [
        'master_bedroom', 'elderly_bedroom', 'children_room', 'third_bedroom',
        'living_room', 'dining_room', 'study', 'library',
        'tea_room', 'yoga_room', 'kitchen', 'main_bathroom',
        'guest_bathroom', 'powder_room', 'wine_cellar', 'entrance',
        'foyer', 'shoe_closet', 'walk_in_closet', 'gym',
        'storage_cabinet', 'display_cabinet'
      ];
    }
  }

  assignRooms(
    sortedDirections: LongDirection[],
    auspiciousMap: Record<LongDirection, AuspiciousLevel>,
    requiredRooms: RoomType[],
    area: number
  ): Record<LongDirection, RoomType> {
    const roomPriority = getRoomPriority(area);
    const layout: Record<LongDirection, RoomType> = {} as any;
    const remainingRooms = [...requiredRooms];

    for (const direction of sortedDirections) {
      if (remainingRooms.length === 0) break;
      const auspicious = auspiciousMap[direction];
      const possibleRooms = roomPriority[auspicious];
      for (const room of possibleRooms) {
        const index = remainingRooms.indexOf(room);
        if (index !== -1) {
          layout[direction] = room;
          remainingRooms.splice(index, 1);
          break;
        }
      }
    }

    const unassignedDirections = sortedDirections.filter(dir => !layout[dir]);
    for (let i = 0; i < remainingRooms.length; i++) {
        const dir = unassignedDirections[i];
        if (dir) {
            layout[dir] = remainingRooms[i];
            this.warnings.push(`${LONG_DIRECTION_NAMES[dir]}位本不适合做${ROOM_NAMES[remainingRooms[i]]}，因面积限制强制排布。`);
        }
    }
    return layout;
  }

  private correctJueMingLivingRoom(
    layout: Record<LongDirection, RoomType>,
    auspiciousMap: Record<LongDirection, AuspiciousLevel>
  ): void {
    const jueMingDir = (Object.keys(auspiciousMap) as LongDirection[])
      .find(dir => auspiciousMap[dir] === 'jueming');

    if (!jueMingDir) return;

    if (layout[jueMingDir] === 'living_room') {
      this.warnings.unshift(
        '⚠️ 最高级别警告：绝命位绝对不能作为客厅！这是古代人居空间分类法最高禁忌，已强制调整布局'
      );

      const livingRoomPriority: AuspiciousLevel[] = ['fuwei', 'yannian', 'shengqi', 'tianyi'];
      let bestLivingRoomDir: LongDirection | null = null;

      for (const level of livingRoomPriority) {
        const dir = (Object.keys(auspiciousMap) as LongDirection[])
          .find(l => auspiciousMap[l] === level);
        
        if (dir && dir !== jueMingDir) {
          bestLivingRoomDir = dir;
          break;
        }
      }

      if (bestLivingRoomDir) {
        const temp = layout[bestLivingRoomDir];
        layout[bestLivingRoomDir] = 'living_room';
        layout[jueMingDir] = temp;

        this.warnings.push(
          `已将客厅从${LONG_DIRECTION_NAMES[jueMingDir]}（绝命位）调整至${LONG_DIRECTION_NAMES[bestLivingRoomDir]}（${AUSPICIOUS_NAMES[auspiciousMap[bestLivingRoomDir]]}位）`
        );
      } else {
        layout[jueMingDir] = 'deep_storage';
        this.warnings.push(
          '所有吉位均已被占用，绝命位已强制改为深储藏室，请重新调整户型功能分区'
        );
      }
    }

    const forbiddenRooms: RoomType[] = ['living_room', 'master_bedroom', 'elderly_bedroom', 'children_room', 'dining_room', 'study'];
    if (forbiddenRooms.includes(layout[jueMingDir])) {
      this.warnings.unshift(
        `⚠️ 严重警告：绝命位不能作为${ROOM_NAMES[layout[jueMingDir]]}！已强制改为深储藏室`
      );
      layout[jueMingDir] = 'deep_storage';
    }
  }

  applyModernCorrections(
    layout: Record<LongDirection, RoomType>,
    auspiciousMap: Record<LongDirection, AuspiciousLevel>
  ): void {
    const bedroomTypes: RoomType[] = ['master_bedroom', 'elderly_bedroom', 'children_room', 'second_bedroom', 'third_bedroom'];
    const southRoom = layout['south'];

    if (!bedroomTypes.includes(southRoom)) {
      let lowestPriorityBedroom: LongDirection | null = null;
      let lowestRank = 0;

      for (const [dir, room] of Object.entries(layout)) {
        if (bedroomTypes.includes(room as RoomType)) {
          const rank = AUSPICIOUS_RANK[auspiciousMap[dir as LongDirection]];
          if (rank > lowestRank) {
            lowestRank = rank;
            lowestPriorityBedroom = dir as LongDirection;
          }
        }
      }

      if (lowestPriorityBedroom) {
        const temp = layout['south'];
        layout['south'] = layout[lowestPriorityBedroom];
        layout[lowestPriorityBedroom] = temp;
        this.warnings.push('为保证卧室采光，已将南向房间调整为卧室');
      }
    }

    const kitchenDir = Object.entries(layout).find(([_, room]) => room === 'kitchen')?.[0] as LongDirection;
    const diningDir = Object.entries(layout).find(([_, room]) => room === 'dining_room')?.[0] as LongDirection;

    if (kitchenDir && diningDir) {
      const adjacentDirections: Record<LongDirection, LongDirection[]> = {
        north: ['northeast', 'northwest'], south: ['southeast', 'southwest'],
        east: ['northeast', 'southeast'], west: ['northwest', 'southwest'],
        northeast: ['north', 'east'], northwest: ['north', 'west'],
        southeast: ['south', 'east'], southwest: ['south', 'west']
      };

      if (!adjacentDirections[diningDir].includes(kitchenDir)) {
        let bestKitchenDir: LongDirection | null = null;
        let bestRank = 9;

        for (const dir of adjacentDirections[diningDir]) {
          const rank = AUSPICIOUS_RANK[auspiciousMap[dir]];
          if (rank >= 6) {
            if (rank < bestRank) {
              bestRank = rank;
              bestKitchenDir = dir;
            }
          }
        }

        if (bestKitchenDir && bestKitchenDir !== kitchenDir) {
          const temp = layout[kitchenDir];
          layout[kitchenDir] = layout[bestKitchenDir];
          layout[bestKitchenDir] = 'kitchen';
          this.warnings.push('为保证使用便利性，已将厨房调整至餐厅附近');
        }
      }
    }

    const bathroomTypes: RoomType[] = ['main_bathroom', 'guest_bathroom', 'powder_room'];
    for (const [dir, room] of Object.entries(layout)) {
      if (bathroomTypes.includes(room as RoomType)) {
        if (dir === 'north' || dir === 'west') {
          let bestBathroomDir: LongDirection | null = null;
          let bestRank = 0;
          for (const [d, r] of Object.entries(layout)) {
            if (d !== 'north' && d !== 'west' && !bathroomTypes.includes(r as RoomType)) {
              const rank = AUSPICIOUS_RANK[auspiciousMap[d as LongDirection]];
              if (rank > bestRank) {
                bestRank = rank;
                bestBathroomDir = d as LongDirection;
              }
            }
          }
          if (bestBathroomDir) {
            const temp = layout[dir as LongDirection];
            layout[dir as LongDirection] = layout[bestBathroomDir];
            layout[bestBathroomDir] = room as RoomType;
            this.warnings.push(`为保证${ROOM_NAMES[room as RoomType]}自然通风，已调整其位置`);
          }
        }
      }
    }

    const livingRoomDir = Object.entries(layout).find(([_, room]) => room === 'living_room')?.[0] as LongDirection;
    if (livingRoomDir && livingRoomDir !== 'south') {
      const southRoom = layout['south'];
      if (!bedroomTypes.includes(southRoom)) {
        layout['south'] = 'living_room';
        layout[livingRoomDir] = southRoom;
        this.warnings.push('为保证客厅采光，已将客厅调整至南向');
      }
    }

    if (layout['south'] === 'main_bathroom' || layout['south'] === 'guest_bathroom') {
      let bestBathroomDir: LongDirection | null = null;
      let bestRank = 0;
      for (const [dir, room] of Object.entries(layout)) {
        if (dir !== 'south' && room !== 'main_bathroom' && room !== 'guest_bathroom') {
          const rank = AUSPICIOUS_RANK[auspiciousMap[dir as LongDirection]];
          if (rank > bestRank) {
            bestRank = rank;
            bestBathroomDir = dir as LongDirection;
          }
        }
      }
      if (bestBathroomDir) {
        const temp = layout['south'];
        layout['south'] = layout[bestBathroomDir];
        layout[bestBathroomDir] = temp;
        this.warnings.push('为避免大门正对卫生间，已调整卫生间位置');
      }
    }
  }

  private generateExplanations(
    layout: Record<LongDirection, RoomType>,
    auspiciousMap: Record<LongDirection, AuspiciousLevel>
  ): Record<LongDirection, { traditional: string; modern: string; suggestion: string }> {
    const explanations: Record<LongDirection, { traditional: string; modern: string; suggestion: string }> = {} as any;

    for (const [dir, room] of Object.entries(layout)) {
      const auspicious = auspiciousMap[dir as LongDirection];
      const baseExplanation = DIRECTION_EXPLANATIONS[auspicious];
      
      explanations[dir as LongDirection] = {
        traditional: baseExplanation.traditional,
        modern: baseExplanation.modern,
        suggestion: baseExplanation.suggestion
      };
    }

    return explanations;
  }

  generate(birthYear: number, gender: Gender, houseType: HouseType, area: number): LayoutResult {
    this.warnings = [];
    const auspiciousMap = HOUSE_AUSPICIOUS_MAP[houseType];
    if (!auspiciousMap) {
      console.error(`[BazhaiLayoutGenerator] Invalid houseType: "${houseType}", falling back to kan`);
      return this.generate(birthYear, gender, 'kan', area);
    }
    const sortedDirections = (Object.keys(auspiciousMap) as LongDirection[])
      .sort((a, b) => AUSPICIOUS_RANK[auspiciousMap[a]] - AUSPICIOUS_RANK[auspiciousMap[b]]);

    const requiredRooms = this.getRequiredRoomsByArea(area);
    const layout = this.assignRooms(sortedDirections, auspiciousMap, requiredRooms, area);
    
    // 🔴 最高优先级：绝命位客厅强制修正
    this.correctJueMingLivingRoom(layout, auspiciousMap);
    
    this.applyModernCorrections(layout, auspiciousMap);

    const explanations = this.generateExplanations(layout, auspiciousMap);

    return { 
      layout, 
      warnings: this.warnings, 
      explanations, 
      isHouseLifeMatch: getLifeGuaType(calculateLifeGua(birthYear, gender)) === getHouseType(houseType) 
    };
  }
}

function calculateLifeGua(birthYear: number, gender: Gender): number {
  const lastTwoDigits = birthYear % 100;
  if (gender === 'male') {
    // 1900-1999: (100 - yearTail) % 9; 2000+: (99 - yearTail) % 9
    const base = birthYear >= 2000 ? 99 : 100;
    let remainder = (base - lastTwoDigits) % 9;
    if (remainder === 0) remainder = 9;
    if (remainder === 5) return 2; // 5 男坤
    return remainder;
  } else {
    // 1900-1999: (yearTail - 4) % 9; 2000+: (yearTail + 5) % 9
    let remainder = birthYear >= 2000
      ? (lastTwoDigits + 5) % 9
      : (lastTwoDigits - 4) % 9;
    if (remainder <= 0) remainder += 9;
    if (remainder === 5) return 8; // 5 女艮
    return remainder;
  }
}

function getLifeGuaType(lifeGua: number): 'east' | 'west' {
  return [1, 3, 4, 9].includes(lifeGua) ? 'east' : 'west';
}

function getHouseType(houseType: HouseType): 'east' | 'west' {
  return ['kan', 'li', 'zhen', 'xun'].includes(houseType) ? 'east' : 'west';
}
// --- Opening Animation Component (GSAP + Arknights Style) ---
const OpeningAnimation = ({ onFinish }: { onFinish: () => void }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  const [hasStartedTransition, setHasStartedTransition] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          if (ANIMATION_CONFIG.autoSkip) startTransition();
        }
      });

      // 背景显现
      tl.to(bgRef.current, { opacity: 1, duration: 1 });

      // 线条扫过效果
      tl.fromTo(lineRef.current, 
        { left: '-100%' }, 
        { left: '100%', duration: 1.5, ease: "power4.inOut" },
        0.5
      );

      // 主标题文字
      tl.from(textRef.current?.children || [], {
        y: 50,
        opacity: 0,
        stagger: 0.2,
        duration: 1,
        ease: "power3.out"
      }, 1);

      // 额外的细节动画
      tl.from(".opening-detail", {
        scaleX: 0,
        stagger: 0.1,
        duration: 0.8,
        ease: "expo.out"
      }, 1.2);

      // 闪烁效果
      tl.to(".opening-glitch", {
        opacity: 0.3,
        repeat: 3,
        yoyo: true,
        duration: 0.1,
        ease: "steps(1)"
      }, 2.5);

    }, containerRef);

    return () => ctx.revert();
  }, []);

  const startTransition = () => {
    if (hasStartedTransition) return;
    setHasStartedTransition(true);

    const tl = gsap.timeline({
      onComplete: onFinish
    });

    // 动画向左上角淡出并重合
    tl.to(textRef.current, {
      x: "-40vw",
      y: "-40vh",
      scale: 0.5,
      opacity: 0,
      duration: 1.2,
      ease: "power3.inOut"
    });

    tl.to(containerRef.current, {
      opacity: 0,
      duration: 1,
      ease: "power2.in"
    }, 0.2);
  };

  return (
    <div 
      ref={containerRef}
      onClick={startTransition}
      className="fixed inset-0 z-[150] bg-white flex flex-col items-center justify-center cursor-pointer overflow-hidden"
    >
      {/* 动态点阵背景 */}
      <div 
        ref={bgRef}
        className="absolute inset-0 opacity-0 pointer-events-none"
        style={{ 
          backgroundImage: `radial-gradient(${ANIMATION_CONFIG.accentColor}38 1.5px, transparent 0)`, 
          backgroundSize: '40px 40px'
        }}
      />
      
      {/* 扫略光条 */}
      <div 
        ref={lineRef}
        className="absolute top-1/2 -translate-y-1/2 h-[200px] w-[50%] bg-gradient-to-r from-transparent via-[#FF5C00]/20 to-transparent blur-3xl opacity-30"
      />

      {/* 主体文字 */}
      <div ref={textRef} className="z-10 text-center space-y-4">
        <div className="flex items-center justify-center gap-4">
          <div className="opening-detail h-1 w-12 bg-[#FF5C00]" />
          <h2 className="text-[12px] font-black tracking-[0.5em] text-[#FF5C00] uppercase font-mono opening-glitch">
            {ANIMATION_CONFIG.subtitle}
          </h2>
          <div className="opening-detail h-1 w-12 bg-[#FF5C00]" />
        </div>
        
        <h1 className="text-[60px] md:text-[80px] font-black academic-title text-[#121212] tracking-tighter leading-none uppercase">
          {ANIMATION_CONFIG.title}
        </h1>

        <div className="flex items-center justify-center gap-6 mt-8">
           <div className="opening-detail h-px w-24 bg-[#121212]/20" />
           <p className="text-[14px] font-mono text-[#121212]/40 tracking-[0.3em] font-normal">
             {ANIMATION_CONFIG.bottomText}
           </p>
           <div className="opening-detail h-px w-24 bg-[#121212]/20" />
        </div>
      </div>

      {/* 侧边装饰 */}
      <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-40 bg-[#FF5C00] opening-detail" />
      <div className="absolute top-1/2 -translate-y-1/2 right-0 w-2 h-40 bg-[#FF5C00] opening-detail" />
    </div>
  );
};
const LBrackets = () => (
  <>
    <div className="ef-bracket top-0 left-0 border-t border-l" />
    <div className="ef-bracket top-0 right-0 border-t border-r" />
    <div className="ef-bracket bottom-0 left-0 border-b border-l" />
    <div className="ef-bracket bottom-0 right-0 border-b border-r" />
  </>
);

const MetadataLine = ({ text, value }: { text: string, value: any }) => (
  <div className="flex justify-between items-baseline gap-4 border-b border-[#0A0A0A]/5 py-1.5">
    <span className="ef-label">{text}</span>
    <span className="font-mono text-[11px] font-normal text-[#0A0A0A]">{value}</span>
  </div>
);

const Title = ({ main, sub }: { main: string, sub?: string }) => (
  <div className="mb-2">
    <div className="flex items-center gap-2 mb-0.5">
      <div className="w-1 h-3.5 bg-[#FF5C00]" />
      <h2 className="ef-title-module !text-[15px] xl:!text-[18px] font-black">{main}</h2>
    </div>
    {sub && <p className="ef-label !text-[12px] xl:!text-[14px] text-[#666666] px-[10px] leading-snug">{sub}</p>}
  </div>
);

const CloseXButton = ({ onClick, className = '' }: { onClick: () => void; className?: string }) => (
  <button onClick={onClick} className={`w-8 h-8 flex items-center justify-center bg-[#121212] text-white hover:bg-[#FF5C00] transition-all flex-shrink-0 ${className}`}>
    <X size={14} />
  </button>
);

const ModalHeader = ({ title, sub, onClose }: { title: string; sub?: string; onClose: () => void }) => (
  <div className="flex justify-between items-start border-b border-[#eeeeee] pb-4 flex-shrink-0">
    <div>
      <LBrackets />
      <Title main={title} sub={sub} />
    </div>
    <CloseXButton onClick={onClose} />
  </div>
);

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isPlayingOpening, setIsPlayingOpening] = useState(false);
  const [year, setYear] = useState('1990');
  const [gender, setGender] = useState<Gender>('male');
  const [sitting, setSitting] = useState<GuaType>('kan');
  const [area, setArea] = useState('90');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [thinkingSeconds, setThinkingSeconds] = useState(0);
  const [currentStepText, setCurrentStepText] = useState('正在分析户型格局…');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [selectedPalace, setSelectedPalace] = useState<Direction | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [showVision, setShowVision] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [showSave, setShowSave] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [isRecommendedKan, setIsRecommendedKan] = useState(false);
  const [viewMode, setViewMode] = useState<'standard' | 'healing'>('standard');
  const [layoutResult, setLayoutResult] = useState<LayoutResult | null>(null);
  const [overviewImage, setOverviewImage] = useState<string>('/assets/layouts/OVERVIEW_A.jpg');
  const isIdle = useIdleTimer(20000, isGenerating);
  const isGeneratingRef = useRef(false);  // 防重入，避免 stale closure

  // 从待机屏保唤醒后：回到初始开始页面
  useEffect(() => {
    if (!isIdle) {
      setShowIntro(true);
      // 重置表单参数
      setYear('1990');
      setGender('male');
      setSitting('kan');
      setArea('90');
      // 清空上轮结果
      setShowResult(false);
      setLayoutResult(null);
      setMingGuaValue(null);
      setFinalAssignments([]);
      setViewMode('standard');
      // 关闭所有弹窗
      setShowOverview(false);
      setShowVision(false);
      setShowSave(false);
      setShowContact(false);
      setIsDetailOpen(false);
      setSelectedPalace(null);
      setActiveModal(null);
      // 重置生成动画
      setIsGenerating(false);
      isGeneratingRef.current = false;
      setProgress(0);
      setThinkingSeconds(0);
      setCurrentStepText('正在分析户型格局…');
    }
  }, [isIdle]);

  // ★ 按 A 键重新播放开头动画
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' || e.key === 'A') {
        setShowIntro(true);
        setIsPlayingOpening(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ★ 展览防护：禁用右键菜单、拦截 Ctrl+R/F5 刷新、beforeunload 确认
  useEffect(() => {
    const blockContext = (e: MouseEvent) => e.preventDefault();
    const blockKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey && e.key === 'r') || e.key === 'F5' || (e.ctrlKey && e.key === 'R')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    const blockUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    document.addEventListener('contextmenu', blockContext);
    window.addEventListener('keydown', blockKey);
    window.addEventListener('beforeunload', blockUnload);
    return () => {
      document.removeEventListener('contextmenu', blockContext);
      window.removeEventListener('keydown', blockKey);
      window.removeEventListener('beforeunload', blockUnload);
    };
  }, []);

  // 扫码直达：解析 hash 参数直接展示方案（跳过生成动画）
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    try {
      const params = new URLSearchParams(hash);

      // ── 从参数重新生成（桌面端扫码用）──
      const yearParam = params.get('year');
      const genderParam = params.get('gender') as Gender;
      const sittingParam = params.get('sitting') as GuaType;
      const areaParam = params.get('area');
      if (!yearParam || !genderParam || !sittingParam || !areaParam) return;
      const y = parseInt(yearParam);
      const a = parseInt(areaParam);
      if (isNaN(y) || isNaN(a)) return;
      // 直接生成结果，跳过动画
      setYear(yearParam);
      setGender(genderParam);
      setSitting(sittingParam);
      setArea(areaParam);
      setShowIntro(false);
      const generator = new BazhaiLayoutGenerator();
      const result = generator.generate(y, genderParam, sittingParam as HouseType, a);
      setLayoutResult(result);
      const mGV2 = calculateLifeGua(y, genderParam);
      setMingGuaValue(mGV2);
      const ovType2 = getOverviewType(mGV2);
      setOverviewImage(getOverviewImage(ovType2));
      const assignments: AssignedFunction[] = [];
      for (const [longDir, room] of Object.entries(result.layout)) {
        const gridDir = Object.keys(GRID_TO_LONG).find(k => GRID_TO_LONG[k as keyof typeof GRID_TO_LONG] === longDir) as Direction;
        if (gridDir) {
          assignments.push({ palace: gridDir, functionName: ROOM_NAMES[room as RoomType], weight: 1.0, finalScore: 100 });
        }
      }
      setFinalAssignments(assignments);
      setShowResult(true);
      // 清除 hash 避免刷新重复生成
      window.history.replaceState(null, '', window.location.pathname);
    } catch { /* ignore bad hash */ }
  }, []);

  const [mingGuaValue, setMingGuaValue] = useState<number | null>(null);
  const [finalAssignments, setFinalAssignments] = useState<AssignedFunction[]>([]);

  const areaVal = useMemo(() => parseInt(area), [area]);
  const houseName = useMemo(() => GUA_NAMES[sitting] + '宅', [sitting]);
  const gridLayout = useMemo(() => computeGridLayout(sitting, areaVal), [sitting, areaVal]);

  const handleGenerate = async (newSitting?: GuaType) => {
    // newSitting 可能是 React 事件对象（来自 onClick={handleGenerate}），需过滤
    const actualNewSitting = (typeof newSitting === 'string' && newSitting.length <= 4) ? newSitting : undefined;
    // 防止重复点击产生多组定时器互相覆盖（用 ref 避免 stale closure）
    if (isGeneratingRef.current) return;
    isGeneratingRef.current = true;
    setIsGenerating(true);
    const effectiveSitting = actualNewSitting || sitting;
    if (actualNewSitting) setSitting(actualNewSitting);
    // 非推荐坎宅入口 → 重置推荐标记
    if (actualNewSitting !== 'kan') setIsRecommendedKan(false);
    setShowResult(false);
    setLayoutResult(null);
    setFinalAssignments([]);
    setProgress(0);
    setThinkingSeconds(0);
    setCurrentStepText('正在分析户型格局…');

    // 随机时长 20~30 秒
    const totalDuration = Math.floor(Math.random() * 10001) + 20000; // 20000~30000 ms

    const thinkingTexts = [
      '正在分析户型格局与朝向参数…',
      '正在匹配八卦命卦与个人属性…',
      '正在计算空间适宜性指数(SSI)…',
      '正在构建九宫方位拓扑关系…',
      '正在优化康养策略与气场流转…',
      '正在生成最优空间布局方案…',
    ];

    const startTime = Date.now();
    let generationTimeout: ReturnType<typeof setTimeout> | undefined;

    // 进度条平滑更新（每 100ms）
    const progressTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min((elapsed / totalDuration) * 100, 99);
      setProgress(pct);
    }, 100);

    // 秒数计数器（每秒）
    const secondTimer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setThinkingSeconds(elapsed);
    }, 1000);

    // 轮播思考文字（随机 3~5 秒切换）
    let textIndex = 0;
    const textTimer = setInterval(() => {
      textIndex = (textIndex + 1) % thinkingTexts.length;
      setCurrentStepText(thinkingTexts[textIndex]);
    }, 3000 + Math.floor(Math.random() * 2000));

    // 清理所有定时器的函数
    const cleanup = () => {
      clearInterval(progressTimer);
      clearInterval(secondTimer);
      clearInterval(textTimer);
      if (generationTimeout) { clearTimeout(generationTimeout); generationTimeout = undefined; }
    };

    // Z 键跳过
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'z' || e.key === 'Z') {
        cleanup();
        document.removeEventListener('keydown', handleKeyDown);
        // 异步执行，避免在 keydown handler 里同步阻塞浏览器事件循环
        setTimeout(() => finishGeneration(), 0);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // 完成生成（供正常结束和 Z 键跳过共用）
    let finished = false;
    const finishGeneration = () => {
      if (finished) return;
      finished = true;
      try {
      const generator = new BazhaiLayoutGenerator();
      const result = generator.generate(parseInt(year), gender, effectiveSitting as HouseType, parseInt(area));
      setLayoutResult(result);
      const mGV = calculateLifeGua(parseInt(year), gender);
      setMingGuaValue(mGV);
      const ovType = getOverviewType(mGV);
      setOverviewImage(getOverviewImage(ovType));

      const assignments: AssignedFunction[] = [];
      for (const [longDir, room] of Object.entries(result.layout)) {
         const gridDir = Object.keys(GRID_TO_LONG).find(k => GRID_TO_LONG[k as keyof typeof GRID_TO_LONG] === longDir) as Direction;
         if (gridDir) {
           assignments.push({
             palace: gridDir,
             functionName: ROOM_NAMES[room as RoomType],
             weight: 1.0,
             finalScore: 100,
           });
         }
      }
      setFinalAssignments(assignments);
      setProgress(100);
      setShowResult(true);
      setIsGenerating(false);
      isGeneratingRef.current = false;
      } catch (err) {
        console.error('Generation failed:', err);
        setShowResult(false);
        setIsGenerating(false);
        isGeneratingRef.current = false;
        setCurrentStepText('生成失败，请检查参数后重试');
      }
    };

    // 等待总时长后自动完成
    await new Promise<void>(resolve => {
      generationTimeout = setTimeout(() => {
        cleanup();
        document.removeEventListener('keydown', handleKeyDown);
        resolve();
      }, totalDuration);
    });

    finishGeneration();
  };

  const getPalaceStatus = (dir: Direction, mode: 'standard' | 'healing' = viewMode) => {
    if (dir === 'Center') return { type: 'neutral', star: '中宫', score: 50 };
    
    if (mode === 'healing' && mingGuaValue) {
      const data = HEALING_DATA[mingGuaValue];
      if (data && data.palaces[dir]) {
        const star = data.palaces[dir]!.star;
        const typeMap: Record<AuspiciousLevel, 'good' | 'bad'> = {
          shengqi: 'good', yannian: 'good', tianyi: 'good', fuwei: 'good',
          liusha: 'bad', huohai: 'bad', wugui: 'bad', jueming: 'bad'
        };
        const HEALING_NAMES: Record<AuspiciousLevel, string> = {
          fuwei: '寝区', tianyi: '疗区', shengqi: '动区', yannian: '阳区',
          wugui: '辅区', liusha: '备区', huohai: '边区', jueming: '污区'
        };
        return { type: typeMap[star], star: HEALING_NAMES[star], level: star };
      }
    }

    const longDir = GRID_TO_LONG[dir];
    const houseMap = HOUSE_AUSPICIOUS_MAP[sitting as HouseType];
    if (!houseMap) return { type: 'neutral' as const, star: '中宫', score: 50 };
    const level = houseMap[longDir];
    const typeMap: Record<AuspiciousLevel, 'good' | 'bad'> = {
      shengqi: 'good', yannian: 'good', tianyi: 'good', fuwei: 'good',
      liusha: 'bad', huohai: 'bad', wugui: 'bad', jueming: 'bad'
    };
    return { type: typeMap[level], star: AUSPICIOUS_NAMES[level], level };
  };

  const getAssignedFunc = (dir: Direction, mode: 'standard' | 'healing' = viewMode) => {
    if (mode === 'healing' && mingGuaValue) {
      if (dir === 'Center') return '活动区';
      const data = HEALING_DATA[mingGuaValue];
      if (data && data.palaces[dir]) {
        return data.palaces[dir]!.func;
      }
    }

    if (dir === 'Center') return '公共活动区';

    const longDir = GRID_TO_LONG[dir];
    const houseMap = HOUSE_AUSPICIOUS_MAP[sitting as HouseType];
    if (!houseMap) return { type: 'neutral' as const, star: '中宫', score: 50 };
    const level = houseMap[longDir];
    return getStarCompatibility(Number(area))[level]?.suitable[0] || '待定';
  };
  const PalaceDetailModal = () => {
    if (!selectedPalace) return null;
    const isCenter = selectedPalace === 'Center';
    const longDir = !isCenter ? GRID_TO_LONG[selectedPalace] : null;
    
    let explanation: any;
    let level: AuspiciousLevel | null = null;
    let healingDesign: string | null = null;
    let healingSuitable: string[] = [];

    if (viewMode === 'healing' && mingGuaValue && !isCenter) {
      const hData = HEALING_DATA[mingGuaValue];
      const pData = hData?.palaces[selectedPalace];
      if (pData) {
        level = pData.star;
        const primaryFunc = pData.func;
        
        explanation = {
          traditional: hData.advantage + "\n\n" + hData.disadvantage,
          modern: "房间功能：" + primaryFunc,
          suggestion: "康养专项设计：" + pData.design
        };
        healingDesign = pData.design;
      }
    } else {
      explanation = longDir ? layoutResult?.explanations[longDir] : { traditional: '中宫位，全宅气场枢纽。', modern: '住宅核心交通枢纽，气流循环的中转站，需保持空间开敞以保障公共通行的安全与便捷。', suggestion: '保持空旷通透。' };
      level = !isCenter ? HOUSE_AUSPICIOUS_MAP[sitting as HouseType][longDir!] : null;
    }

    let starName = '中宫';
    if (level) {
      if (viewMode === 'healing' && mingGuaValue) {
        const HEALING_NAMES: Record<AuspiciousLevel, string> = {
          fuwei: '寝区', tianyi: '疗区', shengqi: '动区', yannian: '阳区',
          wugui: '辅区', liusha: '备区', huohai: '边区', jueming: '污区'
        };
        starName = HEALING_NAMES[level];
      } else {
        starName = AUSPICIOUS_NAMES[level];
      }
    }
    const isGood = level ? ['shengqi', 'yannian', 'tianyi', 'fuwei'].includes(level) : false;
    const isBad = level ? ['liusha', 'huohai', 'wugui', 'jueming'].includes(level) : false;
    
    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md" onClick={() => setIsDetailOpen(false)}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white w-[90vw] h-[85vh] max-h-[1000px] l-box shadow-2xl flex flex-col md:flex-row overflow-hidden relative"
          onClick={e => e.stopPropagation()}
        >
          <LBrackets />
          <div className="w-full md:w-1/4 p-12 border-r-2 border-[#121212]/5 bg-[#fafafa] flex flex-col justify-center">
            <div className="space-y-6">
              <div className="inline-block px-6 py-3 bg-[#121212] text-white text-[18px] font-medium uppercase tracking-[0.3em]">{selectedPalace} / 方位</div>
              <h2 className="text-8xl font-black academic-title text-[#121212] leading-none">{DIRECTIONS_ZH[selectedPalace]}</h2>
              <div className={`text-6xl font-medium ${isGood ? 'text-[#009E5F]' : isBad ? 'text-[#FF5C00]' : 'text-[#999999]'}`}>{starName}</div>
              <div className="h-2 bg-[#121212] w-24" />
            </div>
          </div>

          <div className="flex-1 p-16 overflow-y-auto space-y-16 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-6 bg-[#999999]" />
                  <h3 className="text-[20px] font-black uppercase tracking-widest text-[#666666]">Traditional / 传统八宅解释</h3>
                </div>
                <p className="text-[24px] leading-relaxed text-[#121212] border-2 border-[#eeeeee] p-10 bg-[#F9F9F9] rounded-none font-sans whitespace-pre-wrap">
                  “{explanation?.traditional}”
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-3 h-6 bg-[#FF5C00]" />
                  <h3 className="text-[20px] font-black uppercase tracking-widest text-[#FF5C00]">Modern Translation / 现代转译</h3>
                </div>
                <div className="text-[24px] leading-relaxed text-[#121212] border-2 border-[#FF5C00]/20 p-10 bg-[#FF5C00]/5 rounded-none font-normal whitespace-pre-wrap">
                  {explanation?.modern}
                </div>
              </div>
            </div>

            <div className="space-y-8 bg-[#121212]/5 p-12 relative">
                <LBrackets />
                <div className="flex items-center gap-4">
                  <div className="w-3 h-6 bg-[#121212]" />
                  <h3 className="text-[20px] font-black uppercase tracking-widest">Design Suggestion / 设计建议</h3>
                </div>
                <p className="text-[32px] leading-relaxed text-[#121212] font-medium tracking-tight whitespace-pre-wrap">
                   {explanation?.suggestion}
                </p>
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

            {(level && ( (viewMode === 'standard' && getStarCompatibility(Number(area))[level]) || (viewMode === 'healing' && healingSuitable.length > 0) )) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t-2 border-[#eeeeee] pt-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-4 bg-[#009E5F]" />
                    <h3 className="text-[18px] font-black uppercase tracking-widest text-[#009E5F]">Other Suitable / 其他适宜功能</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {viewMode === 'healing' ? healingSuitable.map(f => (
                        <span key={f} className="px-5 py-2 bg-[#009E5F]/10 text-[#009E5F] text-[16px] font-medium tracking-wide border border-[#009E5F]/20">
                          {f}
                        </span>
                      )) : getStarCompatibility(Number(area))[level!].suitable
                      .filter(f => f !== (gridLayout[selectedPalace!]?.roomName))
                      .map(f => (
                        <span key={f} className="px-5 py-2 bg-[#009E5F]/10 text-[#009E5F] text-[16px] font-medium tracking-wide border border-[#009E5F]/20">
                          {f}
                        </span>
                      ))}
                  </div>
                </div>

                {viewMode === 'standard' && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-4 bg-[#E53935]" />
                    <h3 className="text-[18px] font-black uppercase tracking-widest text-[#FF5C00]">Unsuitable / 不适宜的功能</h3>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {getStarCompatibility(Number(area))[level!].unsuitable.map(f => (
                      <span key={f} className="px-5 py-2 bg-[#E53935]/10 text-[#FF5C00] text-[16px] font-medium tracking-wide border border-[#E53935]/20">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                )}
              </div>
            )}
          </div>
          <div className="absolute top-8 right-8 z-20">
            <CloseXButton onClick={() => setIsDetailOpen(false)} />
          </div>
        </motion.div>
      </div>
    );
  };

  const [isYearPickerOpen, setIsYearPickerOpen] = useState(false);
  const years = useMemo(() => Array.from({ length: 101 }, (_, i) => (2024 - i).toString()), []);
  const [yearPageIndex, setYearPageIndex] = useState(8); // Start around 1980-1990ish

  const yearsPerPage = 12;

  // Find the page index for the current year if it's set externally or initially
  React.useEffect(() => {
    const idx = years.indexOf(year);
    if (idx !== -1) {
      setYearPageIndex(Math.floor(idx / yearsPerPage));
    }
  }, [year, years, yearsPerPage]);

  const totalPages = Math.ceil(years.length / yearsPerPage);
  const visibleYears = useMemo(() => {
    return years.slice(yearPageIndex * yearsPerPage, (yearPageIndex + 1) * yearsPerPage);
  }, [years, yearPageIndex]);

  const YearPicker = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setIsYearPickerOpen(false)}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md l-box p-6 flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <LBrackets /><div className="flex justify-between items-center mb-6 border-b border-[#121212] pb-4"><h3 className="text-lg font-black font-mono uppercase tracking-[2px]">Select Year / 选择出生年份</h3><CloseXButton onClick={() => setIsYearPickerOpen(false)} /></div>
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
        <div className="grid grid-cols-4 gap-2 overflow-y-auto pr-2 custom-scrollbar">
          {years.map(y => (
            <button key={y} onClick={() => { setYear(y); setIsYearPickerOpen(false); }} className={`h-12 flex items-center justify-center text-xs font-mono border ${year === y ? 'border-[#FF5C00] bg-[#FF5C00]/5 text-[#FF5C00] font-medium' : 'border-[#999999]/30 text-[#666666] hover:border-[#999999]'}`}>{y}</button>
          ))}
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="h-screen bg-[#F5F5F5] font-mono text-[#121212] flex flex-col items-center justify-start overflow-hidden relative">
      <div className="crt-overlay" />
      <div className="noise" />
      <div className="scan-line" />
      <div className="moving-grid" />

      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div 
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center cursor-default overflow-hidden select-none"
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
              <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-[#999999]">系统就绪 · SYSTEM READY</span>
            </div>
            
            <div className="absolute bottom-10 right-10 text-[9px] font-mono text-[#999999] space-y-1 text-right">
              <p>DESIGNER: [SAM_JU_KMING]</p>
              <p>RESEARCH: 2026_ARCH_METHODS</p>
            </div>

            {/* 中央文字 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
              className="relative z-10 text-center max-w-7xl w-full px-8 xl:px-12 space-y-8 xl:space-y-16"
            >
              <div className="flex items-center justify-center gap-4 xl:gap-6 mb-4 xl:mb-6">
                <div className="w-16 xl:w-20 h-1 xl:h-1.5 bg-[#121212]/20" />
                <span className="text-[12px] xl:text-[16px] font-medium uppercase tracking-[0.4em] xl:tracking-[0.6em] text-[#666666]">KANYU ALGORITHM: DIGITAL RECONSTRUCTION OF ANCIENT CHINESE HABITAT THOUGHT</span>
                <div className="w-16 xl:w-20 h-1 xl:h-1.5 bg-[#121212]/20" />
              </div>
              
              <div>
                <h1 className="text-[80px] xl:text-[120px] 2xl:text-[140px] font-black academic-title uppercase tracking-widest leading-none text-[#FF5C00]">
                  堪舆算法
                </h1>
                <h2 className="text-[24px] xl:text-[36px] 2xl:text-[42px] font-black tracking-widest text-[#333333] mt-2 xl:mt-4">
                  中国古代人居环境思想的数字化重构
                </h2>
              </div>
              
              <p className="text-lg xl:text-xl 2xl:text-2xl leading-relaxed text-[#555555] font-normal mt-6 xl:mt-8 w-full max-w-5xl mx-auto">
                将非量化的中国古代传统人居环境思想口诀转化为可计算的空间拓扑参数，生成符合文化心理需求且满足现代功能逻辑的最佳室内布局。传统堪舆本质是古代环境心理学与动线规律的经验总结。
              </p>

              <div className="flex flex-wrap justify-center gap-3 pt-6 xl:pt-10">
                <span className="px-3 py-1 bg-[#121212]/5 text-[#121212] text-[14px] xl:text-[16px] font-mono font-medium tracking-widest uppercase">Thesis 01 / 环境心理</span>
                <span className="px-3 py-1 bg-[#121212]/5 text-[#121212] text-[14px] xl:text-[16px] font-mono font-medium tracking-widest uppercase">Thesis 02 / 算法转译</span>
                <span className="px-3 py-1 bg-[#121212]/5 text-[#121212] text-[14px] xl:text-[16px] font-mono font-medium tracking-widest uppercase">Thesis 03 / 循证设计</span>
              </div>
              
              <div className="pt-10 flex justify-center">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsPlayingOpening(true);
                    setShowIntro(false);
                  }}
                  className="group relative px-12 xl:px-20 py-6 xl:py-8 bg-[#121212] text-white flex items-center gap-6 xl:gap-8 hover:bg-[#FF5C00] hover:shadow-[0_0_40px_rgba(255,92,0,0.5)] transition-all overflow-hidden shadow-2xl active:scale-95 border-2 border-transparent hover:border-[#FF5C00]/30"
                >
                  <span className="text-2xl xl:text-3xl font-medium tracking-widest uppercase relative z-10">开始我的空间诊断</span>
                  <ChevronRight size={32} className="group-hover:translate-x-3 transition-transform relative z-10 xl:w-10 xl:h-10" />
                  <div className="absolute top-0 left-0 w-full h-full bg-[#FF5C00] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-expo" />
                </button>
              </div>
            </motion.div>

            <div className="absolute bottom-20 flex items-center gap-6">
              <div className="h-px w-8 bg-[#121212]/10" />
              <span className="text-[15px] font-mono uppercase tracking-[0.3em] text-[#BBBBBB]">学术声明：本程序内容部分为AI生成，仅供参考</span>
              <div className="h-px w-8 bg-[#121212]/10" />
            </div>
            
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isPlayingOpening && (
          <OpeningAnimation onFinish={() => {
            setIsPlayingOpening(false);
          }} />
        )}
      </AnimatePresence>

      <AnimatePresence>{isDetailOpen && <PalaceDetailModal />}</AnimatePresence>
      <AnimatePresence>{isYearPickerOpen && <YearPicker />}</AnimatePresence>
      <div className="fixed inset-0 pointer-events-none opacity-[0.05]" style={{ backgroundImage: 'linear-gradient(to right, #999999 1px, transparent 1px), linear-gradient(to bottom, #999999 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      <style>{`
    .size-container { container-type: size; }
    .l-box { position: relative; border: 1px solid #999999; background: white; }
    .ef-bracket { position: absolute; width: 12px; height: 12px; border-color: #121212; z-index: 20; pointer-events: none; }
    .input-box { height: 60px; width: 100%; border: 1px solid #999999; padding: 0 16px; outline: none; transition: border-color 0.3s; font-size: 12px; }
    .input-box:focus { border-color: #FF5C00; }
    .btn-primary { min-width: 80px; min-height: 80px; border: 1px solid #FF5C00; color: #FF5C00; transition: all 0.3s; display: flex; align-items: center; justify-content: center; gap: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; font-size: 12px; cursor: pointer; text-align: center; }
    .btn-primary:hover { background: #FF5C00; color: white; transform: scale(1.05); box-shadow: 0 0 30px ${ANIMATION_CONFIG.glowColor}; border-color: ${ANIMATION_CONFIG.primaryColor}; }
    .btn-primary:disabled { border-color: #999999; color: #999999; cursor: not-allowed; }
    .btn-secondary { border: 1px solid #999999; display: flex; align-items: center; justify-content: center; font-size: 12px; transition: all 0.3s; cursor: pointer; position: relative; }
    .btn-secondary:hover:not(.active) { transform: scale(1.02); border-color: #FF5C00; box-shadow: 0 0 20px ${ANIMATION_CONFIG.glowColor}; }
    .btn-secondary.active { border-color: #FF5C00; color: #FF5C00; box-shadow: 0 0 15px ${ANIMATION_CONFIG.glowColor}; }
    .btn-secondary:not(.active) { color: #999999; background: #fafafa; }
    
    .moving-grid {
      position: absolute;
      top: -100px;
      left: -100px;
      right: -100px;
      bottom: -100px;
      background-image: linear-gradient(to right, ${ANIMATION_CONFIG.primaryColor}08 1px, transparent 1px), linear-gradient(to bottom, ${ANIMATION_CONFIG.primaryColor}08 1px, transparent 1px);
      background-size: 60px 60px;
      animation: grid-move ${ANIMATION_CONFIG.gridSpeed}s linear infinite;
      z-index: 0;
      pointer-events: none;
    }
    
    @keyframes grid-move {
      0% { transform: translate(0, 0); }
      100% { transform: translate(60px, 60px); }
    }

    /* Industrial CRT Effects */
    .crt-overlay {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.1) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.03), rgba(0, 255, 0, 0.01), rgba(0, 0, 255, 0.03));
      background-size: 100% 3px, 3px 100%; pointer-events: none; z-index: 50; opacity: 0.4;
    }
    .noise {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3%3Cfilter id='noiseFilter'%3%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3%3C/filter%3%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3%3C/svg%3e");
      opacity: 0.04; pointer-events: none; z-index: 51;
    }
    .scan-line {
      position: fixed; top: 0; width: 100%; height: 2px;
      background: rgba(255, 92, 0, 0.1); z-index: 52;
      animation: scan 8s linear infinite;
    }
    @keyframes scan {
      0% { top: 0; }
      100% { top: 100%; }
    }
    .custom-scrollbar::-webkit-scrollbar { width: 4px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #999999; }
    .academic-title { letter-spacing: -0.05em; font-weight: 900; }
  `}</style>

      <header className="w-full px-6 xl:px-10 py-2.5 z-10 flex-shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-2 border-b-2 border-[#121212] pb-2">
          <div><h1 className="text-3xl font-black font-sans tracking-tighter uppercase leading-tight text-[#121212]">空间适配生成系统</h1><p className="text-[#666666] text-[12px] mt-0.5 font-mono tracking-[0.15em] opacity-60">BA ZHAI SPACE ADAPTATION SYSTEM (V2.2.5)</p></div>
          <div className="flex items-center gap-3">
          </div>
        </div>
      </header>

      <main className="w-full px-4 xl:px-8 flex flex-col items-center z-10 flex-1 min-h-0 pb-4 overflow-hidden">
        {!showResult && !isGenerating ? (
          /* Page 1: User Parameters Selection */
          <div className="w-full h-full flex-1 flex flex-col pt-2 overflow-hidden">
            <div className="l-box p-4 xl:p-8 pt-4 xl:pt-6 flex-1 bg-white shadow-sm flex flex-col overflow-hidden relative">
              <LBrackets /><Title main="用户基础参数 / USER CONFIGURATION" sub="※ 请完成以下基础参数设定以启动空间算法寻优" />
              
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 xl:gap-8 mt-3 flex-1 min-h-0">
                {/* Left Column: Birth & Orientation (5 columns) */}
                <div className="lg:col-span-5 flex flex-col space-y-4 xl:space-y-6">
                  <div className="flex flex-col">
                    <label className="text-[14px] text-[#121212] font-medium uppercase mb-2 block tracking-widest">Birth Year / 出生年份 (环境心理偏好类型选择)</label>
                    
                    {/* 性别选择 */}
                    <div className="flex gap-1.5 mb-1.5">
                      <button 
                        onClick={() => setGender('male')}
                        className={`flex-1 h-[36px] flex items-center justify-center text-[12px] font-bold tracking-widest border-2 transition-all ${gender === 'male' ? 'bg-[#FF5C00] text-white border-[#FF5C00] shadow-lg shadow-[#FF5C00]/20 scale-[1.01]' : 'bg-white text-[#999999] border-[#dddddd] hover:border-[#FF5C00] hover:text-[#FF5C00]'}`}
                      >
                        MALE / 男性
                      </button>
                      <button 
                        onClick={() => setGender('female')}
                        className={`flex-1 h-[36px] flex items-center justify-center text-[12px] font-bold tracking-widest border-2 transition-all ${gender === 'female' ? 'bg-[#FF5C00] text-white border-[#FF5C00] shadow-lg shadow-[#FF5C00]/20 scale-[1.01]' : 'bg-white text-[#999999] border-[#dddddd] hover:border-[#FF5C00] hover:text-[#FF5C00]'}`}
                      >
                        FEMALE / 女性
                      </button>
                    </div>
 
                    <div className="flex items-stretch gap-0.5 h-[62px]">
                      <div className="flex gap-0.5">
                        <button 
                          onClick={() => setYearPageIndex(0)}
                          disabled={yearPageIndex === 0}
                          className="w-9 l-box flex items-center justify-center text-base font-bold disabled:opacity-30 hover:bg-gray-50 bg-[#F9F9F9] transition-all"
                        >
                          «
                        </button>
                        <button 
                          onClick={() => setYearPageIndex(Math.max(0, yearPageIndex - 1))}
                          disabled={yearPageIndex === 0}
                          className="w-9 l-box flex items-center justify-center text-base font-bold disabled:opacity-30 hover:bg-gray-50 bg-[#F9F9F9] transition-all"
                        >
                          ‹
                        </button>
                      </div>
                      
                      <div className="flex-1 l-box flex items-center justify-center bg-[#F9F9F9] gap-1.5 px-1 overflow-hidden">
                        {visibleYears.map(y => (
                          <button 
                            key={y} 
                            onClick={() => setYear(y)} 
                            className={`flex-shrink-0 w-11 h-[50px] flex items-center justify-center transition-all ${year === y ? 'bg-[#FF5C00] text-white scale-105 font-medium shadow-md ring-2 ring-[#FF5C00]/20 z-10' : 'text-[#999999] hover:text-[#121212] hover:bg-white'}`}
                          >
                            <span className="text-[18px] font-mono font-bold leading-none">{y}</span>
                          </button>
                        ))}
                      </div>
 
                      <div className="flex gap-0.5">
                        <button 
                          onClick={() => setYearPageIndex(Math.min(totalPages - 1, yearPageIndex + 1))}
                          disabled={yearPageIndex === totalPages - 1}
                          className="w-9 l-box flex items-center justify-center text-base font-bold disabled:opacity-30 hover:bg-gray-50 bg-[#F9F9F9] transition-all"
                        >
                          ›
                        </button>
                        <button 
                          onClick={() => setYearPageIndex(totalPages - 1)}
                          disabled={yearPageIndex === totalPages - 1}
                          className="w-9 l-box flex items-center justify-center text-base font-bold disabled:opacity-30 hover:bg-gray-50 bg-[#F9F9F9] transition-all"
                        >
                          »
                        </button>
                      </div>
                    </div>
                    <p className="text-[14px] text-[#FF5C00] mt-2.5 font-normal leading-relaxed border-l-4 border-[#FF5C00] pl-3 bg-[#FF5C00]/5 py-1.5">
                      ※ {year}年属{calculateGua(parseInt(year), gender).name}卦，{['kan','zhen','xun','li'].includes(calculateGua(parseInt(year), gender).targetGua) ? '东四命' : '西四命'}
                    </p>
                  </div>
 
                  <div className="flex flex-col flex-1 min-h-0">
                    <label className="text-[14px] text-[#121212] font-medium uppercase mb-2 block tracking-widest">Electronic Compass / 电子罗盘</label>
                    <p className="text-[14px] text-[#FF5C00] font-normal leading-relaxed border-l-4 border-[#FF5C00] pl-3 bg-[#FF5C00]/5 py-1 mb-2">
                      ※ 当前宅性：{GUA_NAMES[sitting]}宅 ({HOUSE_CATEGORIES[sitting]})，朝向：{getHouseName(sitting).split('(')[1].replace(')', '')}
                    </p>
                    <div className="relative flex-1 min-h-0 w-full mx-auto l-box bg-white p-3 xl:p-4 flex items-center justify-center shadow-sm">
                      <LBrackets />
                      <div className="relative w-full h-full flex items-center justify-center bg-[#F9F9F9] overflow-hidden border border-[#eeeeee]">
                        <div className="absolute inset-0 z-0 flex items-center justify-center">
                          <motion.div 
                            animate={{ rotate: sitting === 'kan' ? 0 : sitting === 'kun' ? 225 : sitting === 'zhen' ? 90 : sitting === 'xun' ? 135 : sitting === 'qian' ? 315 : sitting === 'dui' ? 270 : sitting === 'gen' ? 45 : sitting === 'li' ? 180 : 0 }}
                            transition={{ type: 'spring', stiffness: 50 }}
                            className="aspect-square h-[75%] xl:h-[80%] w-auto border-[3px] border-[#dddddd] rounded-full flex items-center justify-center relative shadow-sm bg-white/50"
                          >
                            <div className="absolute top-0 w-1.5 h-6 bg-[#FF5C00] shadow-sm" />
                            <Compass size={80} className="text-[#eeeeee] -rotate-45" />
                            {Object.entries(DIRECTIONS_ZH).map(([key, label]) => {
                              const angles: Record<string, number> = { 'N': 0, 'NE': 45, 'E': 90, 'SE': 135, 'S': 180, 'SW': 225, 'W': 270, 'NW': 315 };
                              const sittingAngle: Record<string, number> = { 'kan': 0, 'gen': 45, 'zhen': 90, 'xun': 135, 'li': 180, 'kun': 225, 'dui': 270, 'qian': 315 };
                              const offset = (angles[key] - (sittingAngle[sitting] || 0) + 360) % 360;
                              if (key === 'Center') return null;
                              return (
                                <div key={key} className="absolute inset-x-0 w-full h-full pointer-events-none" style={{ transform: `rotate(${offset}deg)` }}>
                                  <span className="absolute top-0.5 left-1/2 -translate-x-1/2 text-[14px] xl:text-[18px] font-medium text-[#121212] drop-shadow-md">{label}</span>
                                </div>
                              );
                            })}
                          </motion.div>
                        </div>
                        <div className="absolute inset-0 grid grid-cols-2 grid-rows-4 opacity-80 xl:opacity-100 z-10">
                          {(['kan', 'gen', 'zhen', 'xun', 'li', 'kun', 'dui', 'qian'] as GuaType[]).map(g => (
                            <button key={g} onClick={() => setSitting(g)} className={`text-[16px] xl:text-[20px] font-bold flex items-center justify-center transition-all border-t border-l border-[#eeeeee] ${sitting === g ? 'bg-[#FF5C00]/10 text-[#FF5C00] shadow-lg' : 'text-[#999999] hover:bg-white hover:text-[#121212]'}`}>
                              {getHouseName(g).split(' ')[0]}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
 
                {/* Right Column: Area & Start Button (7 columns) */}
                <div className="lg:col-span-7 flex flex-col min-h-0">
                  <div className="flex-1 flex flex-col min-h-0">
                    <label className="text-[14px] text-[#121212] font-medium uppercase mb-2 block tracking-widest">Floor Area / 空间尺度</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 min-h-0 overflow-hidden">
                      {[
                        { val: '60', tag: 'MINI', desc: '安稳根基，家宅安宁' },
                        { val: '90', tag: 'STD', desc: '事业顺遂，家庭和睦' },
                        { val: '120', tag: 'ADV', desc: '财运亨通，贵人相助' },
                        { val: '150', tag: 'LUX', desc: '富贵绵长，子孙兴旺' }
                      ].map(a => (
                        <button key={a.val} onClick={() => setArea(a.val)} className={`l-box bg-white p-5 xl:p-8 flex flex-row items-center border-2 transition-all group overflow-hidden ${area === a.val ? 'bg-[#FF5C00]/5 shadow-lg z-10' : 'hover:border-[#FF5C00]'}`} style={{ borderColor: area === a.val ? '#FF5C00' : '#eeeeee' }}>
                          <LBrackets />
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex justify-between w-full items-baseline mb-2 xl:mb-3">
                              <span className={`text-[32px] xl:text-[44px] font-medium leading-none truncate transition-colors ${area === a.val ? 'text-[#FF5C00]' : 'text-[#121212]'}`}>{a.val}㎡</span>
                              <span className={`text-[14px] xl:text-[18px] opacity-40 font-mono tracking-widest transition-colors ${area === a.val ? 'text-[#FF5C00]' : 'text-[#121212]'}`}>{a.tag}</span>
                            </div>
                            <span className={`text-[16px] xl:text-[20px] font-medium text-left leading-normal block transition-colors ${area === a.val ? 'text-[#FF5C00]' : 'text-[#121212]'}`}>{a.desc}</span>
                          </div>
                          <div className={`w-28 h-28 xl:w-36 xl:h-36 bg-gray-50 flex-shrink-0 ml-3 overflow-hidden l-box relative flex items-center justify-center border-2 transition-all`} style={{ borderColor: area === a.val ? '#FF5C00' : '#eeeeee' }}>
                            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 p-1.5 xl:p-2 gap-1.5 opacity-30">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className={`border border-[#121212]/20 ${(i === 4 || (a.val === '150' && i % 2 === 0) || (a.val === '120' && i < 3) || (a.val === '90' && i % 3 === 0)) ? 'bg-[#121212]/40' : ''}`} />
                              ))}
                            </div>
                            <LBrackets />
                            <div className="relative z-10 border-2 xl:border-4 w-16 h-16 xl:w-20 xl:h-20 flex items-center justify-center transition-all" style={{ borderColor: area === a.val ? '#FF5C00' : '#121212' }}>
                              <div className="w-full h-1 xl:h-1.5 absolute transition-all" style={{ backgroundColor: area === a.val ? '#FF5C00' : '#121212' }} />
                              <div className="h-full w-1 xl:w-1.5 absolute transition-all" style={{ backgroundColor: area === a.val ? '#FF5C00' : '#121212' }} />
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
 
                  {/* Start Button */}
                  <div className="mt-2 pt-2 border-t-2 border-dashed border-[#eeeeee]">
                    <button 
                      onClick={handleGenerate}
                      className="w-full h-16 xl:h-20 bg-[#444444] text-white flex items-center justify-center gap-3 group hover:bg-[#FF5C00] transition-all shadow-xl active:scale-[0.98] relative"
                    >
                      <LBrackets />
                      <Activity size={20} className="group-hover:animate-bounce" />
                      <div className="text-left">
                        <span className="block text-[18px] xl:text-[22px] font-medium tracking-[0.1em] uppercase leading-none">执行空间生成</span>
                        <span className="block text-[8px] font-mono opacity-60 mt-1 tracking-[0.2em] uppercase">Execute Spatial Synthesis</span>
                      </div>
                      <ChevronRight size={20} className="ml-2 group-hover:translate-x-2 transition-transform" />
                    </button>
                    <div className="mt-2 flex justify-between items-center text-[#999999] font-mono text-[8px] tracking-[0.15em] uppercase">
                      <span>Algorithm: BaZhai_Core_v2</span>
                      <span>Latency: <span className="text-[#FF5C00]">0.42ms</span></span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          ) : (
          /* Page 2: Generation Animation or Results */
          <section className="w-full h-full flex-1 flex flex-col min-h-0 overflow-hidden">
          {isGenerating ? (
            <div className="l-box h-full flex flex-col items-center justify-center p-10 bg-[#0A0A0A] text-white">
              <LBrackets />
              
              {/* 进度条 */}
              <div className="w-80 h-1 bg-[#222222] relative mb-12">
                <div 
                  className="h-full bg-[#FF5C00]" 
                  style={{ width: `${progress}%`, transition: 'width 0.15s linear' }}
                />
              </div>
              
              <div className="text-center font-mono space-y-6 max-w-lg">
                <div className="flex flex-col gap-3">
                  {/* 主标题 */}
                  <span className="text-[#FF5C00] text-[20px] font-normal tracking-[0.2em] animate-pulse">
                    大模型兜兜（Doudou）正在为您生成方案
                  </span>
                  
                  {/* 思考秒数计数器 */}
                  <span className="text-[#666666] text-[14px] font-mono tracking-wider">
                    （已思考 {thinkingSeconds} 秒）
                  </span>
                  
                  {/* 当前思考阶段 */}
                  <h2 className="text-3xl font-black academic-title tracking-tighter leading-tight mt-4 min-h-[48px]">
                    {currentStepText}
                  </h2>
                </div>
                
                {/* 底部提示 */}
                <p className="text-[#666666] text-[12px] leading-relaxed opacity-60 h-8">
                  正在整合传统堪舆理论与现代建筑科学，请耐心等待…
                </p>

                {/* 3×3 九宫格扫描动画（保留） */}
                <div className="grid grid-cols-3 gap-4 w-72 mx-auto mt-12 relative">
                  {/* 装饰线 */}
                  <div className="absolute -inset-8 border border-[#FF5C00]/10 pointer-events-none" />
                  <div className="absolute -inset-12 border border-[#FF5C00]/5 pointer-events-none" />
                  
                  {Array.from({ length: 9 }).map((_, i) => (
                    <motion.div 
                      key={i} 
                      className="aspect-square border-2 border-[#121212]/10 relative flex items-center justify-center overflow-hidden bg-gray-50"
                      animate={{ 
                        boxShadow: [
                          "0 0 0px rgba(255, 92, 0, 0)",
                          "0 0 25px rgba(255, 92, 0, 0.2)",
                          "0 0 0px rgba(255, 92, 0, 0)"
                        ],
                        borderColor: [
                          "rgba(18, 18, 18, 0.1)",
                          "rgba(255, 92, 0, 1)",
                          "rgba(18, 18, 18, 0.1)"
                        ]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.15 }}
                    >
                      <motion.div 
                        className="absolute inset-0 bg-[#FF5C00]"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: [0, 1.2, 0], opacity: [0, 0.1, 0] }}
                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      />
                      <span className="text-[10px] font-mono font-medium text-[#121212]/20">0{i+1}</span>
                      
                      {/* 扫描效果 */}
                      <motion.div 
                        className="absolute top-0 left-0 w-full h-[1px] bg-white opacity-50"
                        animate={{ top: ["0%", "100%", "0%"] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          ) : showResult ? (
            <div className="h-full flex flex-col gap-5 overflow-hidden">
              {/* Header: Title & Stats */}
              <div className="l-box p-4 xl:p-6 pt-6 xl:pt-9 bg-white flex-shrink-0 shadow-sm border-b-2 border-[#121212]">
                <LBrackets /><Title main="空间与康养综合评估 / COMPREHENSIVE ANALYSIS" />
                <div className="flex flex-row items-center justify-between w-full min-h-[80px] xl:min-h-[100px] overflow-hidden">
                  <div className="flex items-center gap-4 xl:gap-10 h-full flex-1 min-w-0">
                    <div className="flex flex-col justify-center whitespace-nowrap">
                      <span className="text-[#666666] text-[12px] xl:text-[14px] font-mono uppercase tracking-[0.2em] mb-1 xl:mb-2">User Gua / 环境心理偏好类型</span>
                      <div className="flex flex-row items-baseline gap-2 xl:gap-3">
                         <span className="font-black text-3xl 2xl:text-5xl text-[#FF5C00] tracking-tighter academic-title leading-none whitespace-nowrap">{mingGuaValue ? ['','坎','坤','震','巽','中','乾','兑','艮','离'][mingGuaValue] : '-'}</span>
                         <span className="text-[12px] xl:text-[14px] font-medium text-[#FF5C00]/60 uppercase tracking-[2px] whitespace-nowrap">{mingGuaValue ? (getLifeGuaType(mingGuaValue) === 'east' ? '东四命' : '西四命') : ''}</span>
                      </div>
                    </div>

                    <div className="w-[1.5px] h-8 xl:h-12 bg-[#eeeeee]" />

                    <div className="flex flex-col justify-center whitespace-nowrap">
                      <span className="text-[#666666] text-[12px] xl:text-[14px] font-mono uppercase tracking-[0.2em] mb-1 xl:mb-2">House Attr / 宅性</span>
                      <div className="flex flex-row items-baseline gap-2 xl:gap-4 text-nowrap">
                        <span className="font-black text-3xl 2xl:text-5xl text-[#121212] tracking-tighter academic-title leading-none whitespace-nowrap">{houseName}</span>
                        <span className="text-[12px] xl:text-[14px] font-medium text-[#666666] uppercase tracking-[2px] whitespace-nowrap">{HOUSE_CATEGORIES[sitting] ? `属于 ${HOUSE_CATEGORIES[sitting]} 系` : ''}</span>
                      </div>
                    </div>
                    
                    <div className="w-[1.5px] h-8 xl:h-12 bg-[#eeeeee]" />

                    <div className="flex items-center flex-1 min-w-0 overflow-hidden">
                      {mingGuaValue && sitting && (
                        <div className="flex flex-nowrap items-center gap-2 xl:gap-3 overflow-hidden">
                          {sitting === 'kan' ? (
                            <div className="flex items-center gap-2 px-4 py-3 xl:py-3 bg-[#FF5C00]/5 border-2 border-[#FF5C00]/20 rounded-none flex-shrink-0 max-w-[260px] xl:max-w-[340px] min-w-0">
                              <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse flex-shrink-0" />
                              <div className="min-w-0">
                                <span className="text-[#FF5C00] text-[14px] xl:text-[16px] font-medium tracking-[0.1em] whitespace-nowrap">推荐方案</span>
                                <p className="text-[8px] xl:text-[9px] text-[#666666] mt-0.5 leading-tight whitespace-normal">坎宅（坐北朝南）为建筑最优朝向——兼顾自然采光与八宅吉位，室内布局按康养策略化解宅命差异</p>
                              </div>
                            </div>
                          ) : getLifeGuaType(mingGuaValue) === (HOUSE_CATEGORIES[sitting] === '东四宅' ? 'east' : 'west') ? (
                            <div className="flex items-center gap-2 px-4 py-4 xl:py-6 bg-[#009E5F]/5 border-2 border-[#009E5F]/20 rounded-none flex-shrink-0">
                              <div className="w-2 h-2 rounded-full bg-[#009E5F] animate-pulse flex-shrink-0" />
                              <span className="text-[#009E5F] text-[14px] xl:text-[16px] font-medium tracking-[0.1em] whitespace-nowrap">宅命相配</span>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 px-4 py-4 xl:py-6 bg-[#E53935]/5 border-2 border-[#E53935]/20 rounded-none flex-shrink-0">
                                <div className="w-2 h-2 rounded-full bg-[#E53935] flex-shrink-0" />
                                <span className="text-[#E53935] text-[14px] xl:text-[16px] font-medium tracking-[0.1em] whitespace-nowrap">宅命不匹配</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[14px] xl:text-[16px] text-[#666666] font-medium whitespace-nowrap">推荐方案：</span>
                                <button 
                                  onClick={() => { setIsRecommendedKan(true); handleGenerate('kan'); }}
                                  className="px-5 py-4 xl:py-6 bg-[#009E5F] text-white text-[14px] xl:text-[16px] font-bold tracking-wider hover:bg-[#121212] transition-all rounded-none hover:scale-105 active:scale-95 whitespace-nowrap flex-shrink-0"
                                >
                                  坎宅方案
                                </button>
                              </div>
                            </>
                          )}

                          <button 
                            onClick={() => setShowOverview(true)}
                            className="px-5 py-4 xl:py-6 bg-[#FF5C00] text-white text-[14px] xl:text-[16px] font-bold tracking-wider hover:bg-[#121212] transition-all rounded-none hover:scale-105 active:scale-95 group whitespace-nowrap flex-shrink-0 flex items-center gap-2"
                          >
                            <span>生成方案概览</span>
                            <ChevronRight className="group-hover:translate-x-1 transition-transform w-4 h-4 flex-shrink-0" />
                          </button>
                          
                          <button 
                            onClick={() => setShowSave(true)}
                            className="px-5 py-4 xl:py-6 border-2 border-[#121212] text-[#121212] text-[14px] xl:text-[16px] font-bold tracking-wider hover:bg-[#121212] hover:text-white transition-all rounded-none whitespace-nowrap flex-shrink-0"
                          >
                            保存我的方案
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 xl:gap-3 h-full border-l-2 border-[#eeeeee] pl-4 xl:pl-8 flex-shrink-0">
                    <button 
                      onClick={() => setShowResult(false)}
                      className="py-4 xl:py-6 px-5 border-2 border-[#FF5C00] text-[#FF5C00] text-[14px] xl:text-[16px] font-bold hover:bg-[#FF5C00] hover:text-white transition-all tracking-wider active:scale-95 whitespace-nowrap flex-shrink-0"
                    >
                      返回参数
                    </button>
                    <button 
                      onClick={() => setShowVision(true)}
                      className="py-4 xl:py-6 px-5 border-2 border-[#121212] text-[#121212] text-[14px] xl:text-[16px] font-bold hover:bg-[#121212] hover:text-white transition-all tracking-wider active:scale-95 whitespace-nowrap flex-shrink-0"
                    >
                      朝向说明
                    </button>
                  </div>
                </div>
              </div>

              {/* Body: Grid & (Intelligence + Render) */}
              <div className="flex-1 grid grid-cols-1 xl:grid-cols-12 gap-5 min-h-0 overflow-hidden">
                {/* Left Side: Spatial Grid */}
                <div className="xl:col-span-4 min-h-0 flex items-center justify-center xl:justify-start overflow-hidden size-container">
                  <div className="l-box p-3 xl:p-5 pb-2 border-t-4 border-[#121212] flex flex-col bg-white shadow-sm overflow-hidden w-full h-full">
                    <LBrackets />
                    <div className="flex justify-between items-start mb-2 xl:mb-6 flex-shrink-0">
                    <Title 
                      main="九宫方位诊断 / NODE_DIAGNOSIS" 
                      sub="※ 方案已平衡传统文化逻辑与现代环境心理学约束。依《八宅明镜》大游年歌诀，遍历九宫推演星神吉凶。点击任意宫格查看您所选户型的完整风水解释与科学空间设计建议。" 
                    />
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center relative size-container">
                    <div className="grid grid-cols-3 grid-rows-3 gap-2 xl:gap-3" style={{ width: '100%', maxWidth: '100cqh', aspectRatio: '1/1' }}>
                      {DIRECTIONS.map((dir) => {
                        const status = getPalaceStatus(dir, 'standard');
                        const isGood = status?.type === 'good';
                        const isBad = status?.type === 'bad';
                        const cell = gridLayout[dir];
                        const func = cell?.roomName || (dir === 'Center' ? '公共区域' : '待定');
                        const starName = dir === 'Center' ? '中宫' : (cell ? AUSPICIOUS_NAMES[cell.star] : '—');
                        
                        return (
                          <button 
                            key={`spatial-${dir}`} 
                            onClick={() => { setViewMode('standard'); setSelectedPalace(dir); setIsDetailOpen(true); }} 
                            className={`l-box w-full h-full p-1 xl:p-3 relative flex flex-col items-center justify-center transition-all min-h-0 min-w-0 overflow-hidden group ${selectedPalace === dir && viewMode === 'standard' ? 'bg-[#121212]/5 border-[#121212]' : 'hover:bg-gray-50'}`} 
                            style={{ borderColor: selectedPalace === dir && viewMode === 'standard' ? '#121212' : isGood ? '#009E5F' : isBad ? '#E53935' : '#999999' }}
                          >
                            <span className="text-[12px] xl:text-[16px] text-[#666666] font-mono font-medium leading-tight mb-1 tracking-[0.2em]">{DIRECTIONS_ZH[dir]}</span>
                            <span className={`text-2xl sm:text-3xl xl:text-5xl font-mono font-medium leading-tight mb-1 ${isGood ? 'text-[#009E5F]' : isBad ? 'text-[#FF5C00]' : ''}`}>{starName}</span>
                            <div className="w-full text-center border-t-[1.5px] border-[#eeeeee] pt-1 bg-white relative z-10 transition-transform group-hover:-translate-y-6 xl:group-hover:-translate-y-8">
                              <span className="text-[10px] xl:text-[14px] 2xl:text-[16px] font-medium text-[#121212] line-clamp-1">{func}</span>
                            </div>
                            {status && getStarCompatibility(Number(area))[status.level]?.unsuitable && (
                              <div className="absolute bottom-0 left-0 w-full bg-[#FF5C00] text-white p-1 xl:p-1.5 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform z-0">
                                <span className="text-[8px] xl:text-[10px] font-bold">⚠️ 忌用功能</span>
                                <span className="text-[8px] xl:text-[10px] leading-tight truncate w-full text-center">{getStarCompatibility(Number(area))[status.level].unsuitable.join('、')}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>

                {/* Middle Empty area */}
                <div className="xl:col-span-4 min-h-0 flex flex-col gap-2 size-container">
                  {/* Methodology */}
                  <div className="l-box p-3 xl:p-5 pb-2 border-t-4 border-[#121212] flex flex-col flex-1 bg-white shadow-sm overflow-hidden">
                    <LBrackets />
                    <Title main="研究方法与验证流程 / RESEARCH METHODOLOGY" />
                    <div className="grid grid-cols-2 xl:grid-cols-3 gap-1.5 xl:gap-2 mt-2 flex-grow min-h-0">
                       {[
                         { id: "modal-method-1", title: "传统文献系统提取", desc: "筛选12部核心典籍，剔除迷信内容" },
                         { id: "modal-method-2", title: "扎根理论知识编码", desc: "提取127条\"方位-功能-人\"核心命题" },
                         { id: "modal-method-3", title: "知识图谱结构化存储", desc: "Neo4j构建326节点589关系知识网络" },
                         { id: "modal-method-4", title: "经验规律量化转译", desc: "建立空间适宜性指数(SSI)三维评价体系" },
                         { id: "modal-method-5", title: "混合智能算法训练", desc: "XGBoost模型，5折交叉验证准确率86.3%" },
                         { id: "modal-method-6", title: "多维度科学验证迭代", desc: "VR实验室+实地追踪+第三方独立评估" }
                       ].map((item, i) => (
                         <div key={i} onClick={() => setActiveModal(item.id)} className="cursor-pointer border border-[#121212]/20 p-2 text-center flex flex-col justify-center items-center h-full relative group hover:border-[#121212] transition-colors">
                            <div className="absolute top-1 left-1.5 text-[10px] xl:text-[11px] font-medium text-[#121212]/20 group-hover:text-[#FF5C00]/60 transition-colors">0{i+1}</div>
                            <span className="font-medium text-[12px] xl:text-[14px] z-10 leading-tight">{item.title}</span>
                            <span className="text-[10px] xl:text-[11px] text-[#666666] mt-0.5 xl:mt-1 z-10 leading-tight">{item.desc}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                  
                  {/* Foundations */}
                  <div className="l-box p-3 xl:p-5 pb-2 border-t-4 border-[#121212] flex flex-col flex-1 bg-white shadow-sm overflow-visible">
                    <LBrackets />
                    <Title main="核心科学理论支撑 / SCIENTIFIC FOUNDATIONS" />
                    <div className="grid grid-cols-2 xl:grid-cols-4 gap-1.5 xl:gap-2 mt-2 flex-grow min-h-0">
                       {[
                         { id: "modal-theory-1", title: "环境心理学", desc: "压力恢复理论(ART)与场所依恋研究" },
                         { id: "modal-theory-2", title: "认知神经科学", desc: "空间认知与神经美学脑机制研究" },
                         { id: "modal-theory-3", title: "人体工程学", desc: "中国成年人人体尺寸与动作空间优化" },
                         { id: "modal-theory-4", title: "建筑物理学", desc: "采光、通风、声学与热舒适模拟分析" },
                         { id: "modal-theory-5", title: "健康建筑理论", desc: "基于WELL v2标准的健康性能评价" },
                         { id: "modal-theory-6", title: "循证设计(EBD)", desc: "所有设计决策均有科学研究证据支持" },
                         { id: "modal-theory-7", title: "统计学与数据科学", desc: "127样本信效度检验与机器学习预测" },
                         { id: "modal-theory-8", title: "文化人类学", desc: "地域文化与空间偏好的跨文化比较研究" }
                       ].map((item, i) => (
                         <div key={i} onClick={() => setActiveModal(item.id)} className="cursor-pointer border border-[#121212]/20 p-1.5 xl:p-2 text-center flex flex-col justify-center items-center h-full group hover:border-[#121212] transition-colors">
                            <span className="font-medium text-[12px] xl:text-[14px] leading-tight">{item.title}</span>
                            <span className="text-[10px] xl:text-[11px] text-[#666666] mt-0.5 xl:mt-1 leading-tight">{item.desc}</span>
                         </div>
                       ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Healing Grid */}
                <div className="xl:col-span-4 min-h-0 flex items-center justify-center xl:justify-end overflow-hidden size-container">
                  <div className="l-box p-3 xl:p-5 pb-2 border-t-4 border-[#FF5C00] flex flex-col bg-white shadow-sm overflow-hidden w-full h-full">
                    <LBrackets />
                    <div className="flex justify-between items-start mb-2 xl:mb-6 flex-shrink-0">
                    <Title 
                      main="养老空间方案 / SENIOR LIVING PLAN" 
                      sub="※ 推荐康养布局：基于坎宅（坐北朝南）——建筑最优朝向，兼顾自然采光与八宅吉位，适用所有命卦。点击任意宫格查看「都市桃源」康养综合体为您设计的户型内容" 
                    />
                  </div>
                  <div className="flex-1 min-h-0 flex items-center justify-center relative size-container">
                    <div className="grid grid-cols-3 grid-rows-3 gap-2 xl:gap-3" style={{ width: '100%', maxWidth: '100cqh', aspectRatio: '1/1' }}>
                      {DIRECTIONS.map((dir) => {
                        const status = getPalaceStatus(dir, 'healing');
                        const isGood = status?.type === 'good';
                        const isBad = status?.type === 'bad';
                        const func = getAssignedFunc(dir, 'healing');
                        
                        return (
                          <button 
                            key={`healing-${dir}`} 
                            onClick={() => { setViewMode('healing'); setSelectedPalace(dir); setIsDetailOpen(true); }} 
                            className={`l-box w-full h-full p-1 xl:p-3 relative flex flex-col items-center justify-center transition-all min-h-0 min-w-0 overflow-hidden group ${selectedPalace === dir && viewMode === 'healing' ? 'bg-[#FF5C00]/10 border-[#FF5C00]' : 'hover:bg-gray-50'}`} 
                            style={{ borderColor: selectedPalace === dir && viewMode === 'healing' ? '#FF5C00' : isGood ? '#009E5F' : isBad ? '#E53935' : '#999999' }}
                          >
                            <span className="text-[12px] xl:text-[16px] text-[#666666] font-mono font-medium leading-tight mb-1 tracking-[0.2em]">{DIRECTIONS_ZH[dir]}</span>
                            <span className={`text-2xl sm:text-3xl xl:text-5xl font-mono font-medium leading-tight mb-1 ${isGood ? 'text-[#009E5F]' : isBad ? 'text-[#FF5C00]' : ''}`}>{status?.star}</span>
                            <div className="w-full text-center border-t-[1.5px] border-[#eeeeee] pt-1 bg-white relative z-10 transition-transform group-hover:-translate-y-6 xl:group-hover:-translate-y-8">
                              <span className="text-[10px] xl:text-[14px] 2xl:text-[16px] font-medium text-[#121212] line-clamp-1">{func}</span>
                            </div>
                            {status && getStarCompatibility(Number(area))[status.level]?.unsuitable && (
                              <div className="absolute bottom-0 left-0 w-full bg-[#FF5C00] text-white p-1 xl:p-1.5 flex flex-col items-center justify-center translate-y-full group-hover:translate-y-0 transition-transform z-0">
                                <span className="text-[8px] xl:text-[10px] font-bold">⚠️ 忌用功能</span>
                                <span className="text-[8px] xl:text-[10px] leading-tight truncate w-full text-center">{getStarCompatibility(Number(area))[status.level].unsuitable.join('、')}</span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
                </div>
              </div>
            </div>
          ) : null}
          </section>
        )}
      </main>

      <AnimatePresence>{showVision && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowVision(false)}>
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white max-w-3xl w-full l-box p-10 space-y-6" onClick={e => e.stopPropagation()}>
              <LBrackets />
              <div className="flex items-center gap-4 border-b border-[#eeeeee] pb-4">
                 <div className="w-12 h-12 bg-[#FF5C00] flex items-center justify-center text-white font-bold text-xs">坎</div>
                 <div>
                    <h2 className="text-xl font-black academic-title uppercase tracking-tighter">坎宅定基 / 朝向说明</h2>
                    <p className="text-[12px] xl:text-[14px] text-[#999999] mt-0.5 uppercase tracking-wider">为什么所有方案均基于坐北朝南</p>
                 </div>
                 <CloseXButton onClick={() => setShowVision(false)} className="ml-auto self-start" />
              </div>
              <div className="overflow-y-auto pr-2 text-[14px] xl:text-[16px] leading-relaxed space-y-4 max-h-[60vh]">
                <div>
                  <p className="font-black uppercase tracking-wider text-[#FF5C00] mb-2">▎风水视角</p>
                  <p className="mb-2">《黄帝宅经》云："凡人所居，无不在宅。宅者，人之本。"八宅法以门路、坐向、命卦三者合一为最吉。坐北向南，背山面水，既得地磁顺行（坎卦配子位，与地球磁场夹角仅 5°），又合"西益不祥，东益不祥，惟南益吉"（南向添建方为大吉）之古训。</p>
                  <p className="mb-2">坎宅为水，水润万物而不争，主智慧长寿。加之"子山午向"为正向，阳气充足而阴气退避——"阳宅三要"中，正向宅之气最纯。故八宅理论体系内，坎宅是最适宜康养的正向。本系统将建筑朝向固定为坎宅，正是基于此千年实践验证的择向智慧。</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wider text-[#FF5C00] mb-2">▎科学视角</p>
                  <p className="mb-2">北半球坐北朝南的建筑在全年太阳高度最低的冬至日，南向窗户有效日照时长可达 4.2 小时以上，而北向采光以稳定散射光为主。这一光热配置刚好解决了康养建筑的核心矛盾：南侧接受充沛冬季日照自然补热（降低供暖能耗约 18%），北侧利用稳定散射光作为阅读和工作记忆任务的最佳照明条件（色温约 5500K，匹配人体昼夜节律日间相）。</p>
                  <p className="mb-2">从环境心理学角度，南向视野开阔符合"瞭望-庇护"理论（Prospect-Refuge Theory）中人类对安全环境的本能偏好。护理床紧贴北墙，夜间等效声级可控制在 28dB(A) 以内，远低于国标限值。正西、西南、东北等次优朝向因午后西晒热负荷和声学干扰增大，均不能满足康养建筑的环境性能要求。</p>
                </div>
                <div>
                  <p className="font-black uppercase tracking-wider text-[#FF5C00] mb-2">▎结论</p>
                  <p>本系统面向养老建筑实际场景——建筑朝向为既定条件，不可随意更改。坎宅（坐北朝南）在风水择吉与建筑物理性能上均显著优于其他七宅，故所有方案均以此为建筑基底。所谓"宅命不配"者，通过室内布局的八宅化解法（以不同卫生间方位镇压对应凶星、吉星聚合等功能分区）即可弥合——此为八宅法"宅不可易，命可调之"的实践智慧。</p>
                </div>
              </div>
           </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{showSave && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowSave(false)}>
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white max-w-3xl w-full l-box p-10 space-y-6" onClick={e => e.stopPropagation()}>
              <ModalHeader title="扫码带走方案" onClose={() => setShowSave(false)} />
              <div className="flex items-center gap-6 xl:gap-8 2xl:gap-12 py-2 xl:py-4">
                <div className="w-20 h-20 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 bg-white border-[3px] xl:border-4 border-[#121212] p-1.5 flex flex-wrap gap-0.5 relative shadow-xl flex-shrink-0">
                   <QRCodeSVG value={`https://bazhaipai.pages.dev/view.html?img=${encodeURIComponent(overviewImage)}&name=${encodeURIComponent(houseName)}&area=${area}&mingGua=${mingGuaValue ?? 0}&year=${year}&sitting=${sitting}&gender=${gender}`} size={128} className="absolute inset-1.5 w-[calc(100%-12px)] h-[calc(100%-12px)]" bgColor="#ffffff" fgColor="#121212" level="M" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] xl:text-[14px] 2xl:text-[18px] text-[#666666] font-normal leading-[1.4] xl:leading-[1.6] mb-3 xl:mb-6 line-clamp-2">
                    透过此QR Code将您的专属养老空间方案保存至手机
                  </p>
                  <div className="flex gap-2 xl:gap-4">
                     <span onClick={() => setShowContact(true)} className="px-3 py-1.5 xl:px-6 xl:py-2 bg-[#FF5C00] text-white text-[12px] xl:text-[14px] font-medium uppercase tracking-widest shadow-sm cursor-pointer hover:bg-[#e05000] transition-all">我有疑问</span>
                  </div>
                </div>
              </div>
           </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{showContact && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowContact(false)}>
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white max-w-3xl w-full l-box p-10 space-y-6" onClick={e => e.stopPropagation()}>
              <ModalHeader title="联系作者" onClose={() => setShowContact(false)} />
              <div className="flex items-center gap-6 xl:gap-8 2xl:gap-12 py-2 xl:py-4">
                <div className="w-20 h-20 xl:w-24 xl:h-24 2xl:w-32 2xl:h-32 bg-white border-[3px] xl:border-4 border-[#121212] p-1.5 flex items-center justify-center shadow-xl flex-shrink-0">
                  <QRCodeSVG value="https://u.wechat.com/MB9Ebm0oS5y_QSZgjs6HDdM?s=2" size={128} className="w-[calc(100%-12px)] h-[calc(100%-12px)]" bgColor="#ffffff" fgColor="#121212" level="M" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] xl:text-[14px] 2xl:text-[18px] text-[#666666] font-normal leading-[1.4] xl:leading-[1.6] mb-3 xl:mb-6 line-clamp-2">
                    如有疑问，欢迎联系作者获取进一步咨询与服务
                  </p>
                  <div className="flex gap-2 xl:gap-4">
                     <span className="px-3 py-1.5 xl:px-6 xl:py-2 bg-[#FF5C00] text-white text-[12px] xl:text-[14px] font-medium tracking-wider shadow-sm">特别鸣谢 技术支持 王子轩先生</span>
                  </div>
                </div>
              </div>
           </motion.div>
        </div>
      )}</AnimatePresence>

      <AnimatePresence>{showOverview && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setShowOverview(false)}>
           <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white w-[90vw] h-[85vh] max-h-[1000px] l-box p-6 xl:p-10 flex flex-col gap-4 xl:gap-6 relative overflow-hidden" onClick={e => e.stopPropagation()}>
              <ModalHeader title="方案概览 / OVERVIEW" sub="※ 方案已根据设定与空间尺度组合进行算法寻优" onClose={() => setShowOverview(false)} />
              <div className="flex-1 flex flex-row gap-6 min-h-0">
                {/* ← 左侧：康养策略（flex-1 占据剩余空间，文字增大） */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <p className="text-[14px] xl:text-[16px] font-medium uppercase mb-4 text-[#FF5C00] tracking-wider flex-shrink-0">Healing Strategy / 康养策略</p>
                  <p className="text-[13px] xl:text-[15px] font-normal text-[#121212] leading-[1.6] xl:leading-[1.7] whitespace-pre-line">
                    {mingGuaValue ? (
                      HEALING_STRATEGIES[getOverviewType(mingGuaValue)]
                    ) : (
                      `※ 命主数据不足，无法提供深度康养策略。`
                    )}
                  </p>
                </div>
                
                {/* → 右侧：方案图片 — 约束为图片原生比例 2347:1280，高度填满 */}
                <div className="flex-shrink-0 bg-[#eeeeee] relative overflow-hidden flex items-center justify-center"
                     style={{ aspectRatio: '2347/1280', height: '100%' }}>
                  <img 
                    src={overviewImage}
                    alt="方案概览" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer" 
                  />
                </div>
              </div>
           </motion.div>
        </div>
      )}</AnimatePresence>

      <footer className="w-full px-6 xl:px-10 py-3 text-[9px] font-mono text-[#999999] flex justify-between border-t border-[#999999]/30 bg-white z-20 flex-shrink-0">
        <div className="flex gap-4"><span>SYS_VER: 2.2.5</span><span>BUILD: theory-audit</span><span>RATIO: 2347:1280</span></div>
        <div className="flex gap-4">
          <span className="animate-pulse">● SYSTEM_IDLE</span>
          <span>© 2026 EIGHT_MANSIONS_LAB.</span>
        </div>
      </footer>

      {/* Render Modals dynamically */}
      <AnimatePresence>
        {activeModal && (() => {
          const modal = MODALS_DATA.find(m => m.id === activeModal);
          if (!modal) return null;
          return (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setActiveModal(null)}>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }} className="bg-white max-w-3xl w-full l-box p-10 flex flex-col gap-6" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
                <ModalHeader title={modal.title} sub="SCIENTIFIC RESEARCH & EVIDENCE" onClose={() => setActiveModal(null)} />
                
                <div className="overflow-y-auto pr-2 flex-1 scrollbar-hide text-[#333333]">
                  {modal.content}
                </div>

                <div className="border-t border-[#eeeeee] pt-4 mt-auto flex-shrink-0">
                  <p className="text-[12px] text-[#999999] leading-relaxed">
                    ※ 本系统基于科研课题开发，算法模型及文献数据仅供学术研究使用。相关结论已通过严密论证，但不作为法定设计依据。
                  </p>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
      <IdleScreen isActive={isIdle} />
    </div>
  );
}