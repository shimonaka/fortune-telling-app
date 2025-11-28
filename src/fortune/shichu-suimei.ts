/**
 * 四柱推命の計算ロジック
 * 年柱・月柱・日柱・時柱を計算
 * 通変星、十二運、空亡の計算を追加
 */

import { JIKKAN, JIKKAN_READING, JUNISHI, JUNISHI_READING, calculateYearEto, calculateMonthEto } from './calculations.js';

// 基準日：1900年1月1日を甲子日とする
const BASE_DATE = new Date(1900, 0, 1);

// 通変星（Ten Gods）の定義
export type TenGod = '比肩' | '劫財' | '食神' | '傷官' | '偏財' | '正財' | '偏官' | '正官' | '偏印' | '印綬';
export const TEN_GODS: TenGod[] = ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '印綬'];

// 十二運（Twelve Palaces）の定義
export type TwelvePalace = '長生' | '沐浴' | '冠帯' | '建禄' | '帝旺' | '衰' | '病' | '死' | '墓' | '絶' | '胎' | '養';
export const TWELVE_PALACES: TwelvePalace[] = ['長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養'];

// 通変星マッピング (行: 日干, 列: 対象干)
const TEN_GODS_MAP: TenGod[][] = [
  ['比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '印綬'], // 甲
  ['劫財', '比肩', '傷官', '食神', '正財', '偏財', '正官', '偏官', '印綬', '偏印'], // 乙
  ['偏印', '印綬', '比肩', '劫財', '食神', '傷官', '偏財', '正財', '偏官', '正官'], // 丙
  ['印綬', '偏印', '劫財', '比肩', '傷官', '食神', '正財', '偏財', '正官', '偏官'], // 丁
  ['偏官', '正官', '偏印', '印綬', '比肩', '劫財', '食神', '傷官', '偏財', '正財'], // 戊
  ['正官', '偏官', '印綬', '偏印', '劫財', '比肩', '傷官', '食神', '正財', '偏財'], // 己
  ['偏財', '正財', '偏官', '正官', '偏印', '印綬', '比肩', '劫財', '食神', '傷官'], // 庚
  ['正財', '偏財', '正官', '偏官', '印綬', '偏印', '劫財', '比肩', '傷官', '食神'], // 辛
  ['食神', '傷官', '偏財', '正財', '偏官', '正官', '偏印', '印綬', '比肩', '劫財'], // 壬
  ['傷官', '食神', '正財', '偏財', '正官', '偏官', '印綬', '偏印', '劫財', '比肩']  // 癸
];

function calculateTenGod(dayStemIndex: number, targetStemIndex: number): TenGod {
  return TEN_GODS_MAP[dayStemIndex][targetStemIndex];
}

// 十二運テーブル (行: 日干 0-9, 列: 十二支 0-11 子-亥)
const TWELVE_PALACES_MAP: TwelvePalace[][] = [
  // 甲 (木, 陽): 長生=亥(11)
  ['沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶', '胎', '養', '長生'],
  // 乙 (木, 陰): 長生=午(6) (逆行)
  ['病', '衰', '帝旺', '建禄', '冠帯', '沐浴', '長生', '養', '胎', '絶', '墓', '死'],
  // 丙 (火, 陽): 長生=寅(2)
  ['胎', '養', '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶'],
  // 丁 (火, 陰): 長生=酉(9)
  ['絶', '墓', '死', '病', '衰', '帝旺', '建禄', '冠帯', '沐浴', '長生', '養', '胎'],
  // 戊 (土, 陽): 長生=寅(2) (火土同根)
  ['胎', '養', '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病', '死', '墓', '絶'],
  // 己 (土, 陰): 長生=酉(9) (火土同根)
  ['絶', '墓', '死', '病', '衰', '帝旺', '建禄', '冠帯', '沐浴', '長生', '養', '胎'],
  // 庚 (金, 陽): 長生=巳(5)
  ['死', '墓', '絶', '胎', '養', '長生', '沐浴', '冠帯', '建禄', '帝旺', '衰', '病'],
  // 辛 (金, 陰): 長生=子(0)
  ['長生', '養', '胎', '絶', '墓', '死', '病', '衰', '帝旺', '建禄', '冠帯', '沐浴'],
  // 壬 (水, 陽): 長生=申(8)
  ['帝旺', '衰', '病', '死', '墓', '絶', '胎', '養', '長生', '沐浴', '冠帯', '建禄'],
  // 癸 (水, 陰): 長生=卯(3)
  ['建禄', '冠帯', '沐浴', '長生', '養', '胎', '絶', '墓', '死', '病', '衰', '帝旺']
];

function calculateTwelvePalace(dayStemIndex: number, branchIndex: number): TwelvePalace {
  return TWELVE_PALACES_MAP[dayStemIndex][branchIndex];
}

// 空亡（天中殺）の計算
function calculateVoid(dayStemIndex: number, dayBranchIndex: number): string[] {
  // 旬のインデックス = (日支 - 日干 + 12) % 12
  const diff = (dayBranchIndex - dayStemIndex + 12) % 12;
  switch (diff) {
    case 10: return ['戌', '亥'];
    case 8: return ['申', '酉'];
    case 6: return ['午', '未'];
    case 4: return ['辰', '巳'];
    case 2: return ['寅', '卯'];
    case 0: return ['子', '丑'];
    default: return [];
  }
}

/**
 * 日柱を計算
 * @param year 年
 * @param month 月（1-12）
 * @param day 日（1-31）
 * @returns 日柱の干支情報
 */
export function calculateDayPillar(year: number, month: number, day: number) {
  const targetDate = new Date(year, month - 1, day);
  const daysDiff = Math.floor((targetDate.getTime() - BASE_DATE.getTime()) / (1000 * 60 * 60 * 24));

  // 十干は60日周期、十二支は60日周期（干支は60日周期）
  const jikkanIndex = (daysDiff % 10 + 10) % 10;
  const junishiIndex = (daysDiff % 12 + 12) % 12;

  return {
    jikkan: JIKKAN[jikkanIndex],
    junishi: JUNISHI[junishiIndex],
    jikkanReading: JIKKAN_READING[jikkanIndex],
    junishiReading: JUNISHI_READING[junishiIndex],
    fullName: `${JIKKAN[jikkanIndex]}${JUNISHI[junishiIndex]}`,
    fullReading: `${JIKKAN_READING[jikkanIndex]}${JUNISHI_READING[junishiIndex]}`,
    jikkanIndex,
    junishiIndex
  };
}

/**
 * 時柱を計算
 * @param dayPillar 日柱の情報
 * @param hour 時（0-23）
 * @returns 時柱の干支情報
 */
export function calculateHourPillar(dayPillar: ReturnType<typeof calculateDayPillar>, hour: number) {
  // 時間を2時間単位の十二支に変換
  const hourToJunishi: Record<number, typeof JUNISHI[number]> = {
    23: '子', 0: '子', 1: '丑', 2: '丑', 3: '寅', 4: '寅',
    5: '卯', 6: '卯', 7: '辰', 8: '辰', 9: '巳', 10: '巳',
    11: '午', 12: '午', 13: '未', 14: '未', 15: '申', 16: '申',
    17: '酉', 18: '酉', 19: '戌', 20: '戌', 21: '亥', 22: '亥'
  };

  const junishi = hourToJunishi[hour] || '子';
  const junishiIndex = JUNISHI.indexOf(junishi);
  const junishiReading = JUNISHI_READING[junishiIndex];

  // 時柱の十干は日柱の十干から計算（五鼠遁の法則）
  const dayJikkanIndex = JIKKAN.indexOf(dayPillar.jikkan);
  const hourJikkanMap: Record<number, typeof JIKKAN[number][]> = {
    0: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'], // 甲日・己日
    1: ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'], // 乙日・庚日
    2: ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'], // 丙日・辛日
    3: ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'], // 丁日・壬日
    4: ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']  // 戊日・癸日
  };

  const hourIndex = Math.floor((hour + 1) / 2) % 12; // 2時間単位で0-11に変換
  const jikkanIndex = dayJikkanIndex % 5;
  const jikkan = hourJikkanMap[jikkanIndex][hourIndex];
  const jikkanReadingIndex = JIKKAN.indexOf(jikkan);
  const jikkanReading = JIKKAN_READING[jikkanReadingIndex];

  return {
    jikkan,
    junishi,
    jikkanReading,
    junishiReading,
    fullName: `${jikkan}${junishi}`,
    fullReading: `${jikkanReading}${junishiReading}`,
    jikkanIndex: jikkanReadingIndex,
    junishiIndex: junishiIndex
  };
}

/**
 * 四柱推命の全柱を計算
 * @param year 年
 * @param month 月（1-12）
 * @param day 日（1-31）
 * @param hour 時（0-23、オプション）
 * @returns 四柱推命の結果
 */
export function calculateFourPillars(year: number, month: number, day: number, hour?: number) {
  const yearPillar = calculateYearEto(year);
  const monthPillar = calculateMonthEto(yearPillar, month);
  const dayPillar = calculateDayPillar(year, month, day);
  const hourPillar = hour !== undefined ? calculateHourPillar(dayPillar, hour) : null;

  // インデックスの取得
  const yearJikkanIndex = JIKKAN.indexOf(yearPillar.jikkan);
  const yearJunishiIndex = JUNISHI.indexOf(yearPillar.junishi);
  const monthJikkanIndex = JIKKAN.indexOf(monthPillar.jikkan);
  const monthJunishiIndex = JUNISHI.indexOf(monthPillar.junishi);
  const dayJikkanIndex = dayPillar.jikkanIndex;

  // 通変星の計算 (日干 vs 他干)
  const yearTenGod = calculateTenGod(dayJikkanIndex, yearJikkanIndex);
  const monthTenGod = calculateTenGod(dayJikkanIndex, monthJikkanIndex);
  const hourTenGod = hourPillar ? calculateTenGod(dayJikkanIndex, hourPillar.jikkanIndex) : null;

  // 十二運の計算 (日干 vs 各支)
  const yearTwelvePalace = calculateTwelvePalace(dayJikkanIndex, yearJunishiIndex);
  const monthTwelvePalace = calculateTwelvePalace(dayJikkanIndex, monthJunishiIndex);
  const dayTwelvePalace = calculateTwelvePalace(dayJikkanIndex, dayPillar.junishiIndex);
  const hourTwelvePalace = hourPillar ? calculateTwelvePalace(dayJikkanIndex, hourPillar.junishiIndex) : null;

  // 空亡の計算
  const voidBranches = calculateVoid(dayJikkanIndex, dayPillar.junishiIndex);

  return {
    yearPillar: {
      name: '年柱',
      description: '先祖・両親・幼少期の環境を表す',
      ...yearPillar,
      tenGod: yearTenGod,
      twelvePalace: yearTwelvePalace
    },
    monthPillar: {
      name: '月柱',
      description: '社会性・職業・青年期の運勢を表す',
      ...monthPillar,
      tenGod: monthTenGod,
      twelvePalace: monthTwelvePalace
    },
    dayPillar: {
      name: '日柱',
      description: '本人の本質・性格・中年期の運勢を表す',
      ...dayPillar,
      tenGod: '比肩', // 日干自身は比肩だが通常表示しない、あるいは自星とする
      twelvePalace: dayTwelvePalace
    },
    hourPillar: hourPillar ? {
      name: '時柱',
      description: '子供・晩年期の運勢・隠れた才能を表す',
      ...hourPillar,
      tenGod: hourTenGod,
      twelvePalace: hourTwelvePalace
    } : null,
    voidBranches,
    tenGods: {
      year: yearTenGod,
      month: monthTenGod,
      hour: hourTenGod
    },
    twelvePalaces: {
      year: yearTwelvePalace,
      month: monthTwelvePalace,
      day: dayTwelvePalace,
      hour: hourTwelvePalace
    }
  };
}
