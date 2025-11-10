/**
 * 四柱推命の計算ロジック
 * 年柱・月柱・日柱・時柱を計算
 */

import { JIKKAN, JIKKAN_READING, JUNISHI, JUNISHI_READING, calculateYearEto, calculateMonthEto } from './calculations.js';

// 基準日：1900年1月1日を甲子日とする
const BASE_DATE = new Date(1900, 0, 1);

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
    fullReading: `${JIKKAN_READING[jikkanIndex]}${JUNISHI_READING[junishiIndex]}`
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
    fullReading: `${jikkanReading}${junishiReading}`
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
  
  return {
    yearPillar: {
      name: '年柱',
      description: '先祖・両親・幼少期の環境を表す',
      ...yearPillar
    },
    monthPillar: {
      name: '月柱',
      description: '社会性・職業・青年期の運勢を表す',
      ...monthPillar
    },
    dayPillar: {
      name: '日柱',
      description: '本人の本質・性格・中年期の運勢を表す',
      ...dayPillar
    },
    hourPillar: hourPillar ? {
      name: '時柱',
      description: '子供・晩年期の運勢・隠れた才能を表す',
      ...hourPillar
    } : null
  };
}

