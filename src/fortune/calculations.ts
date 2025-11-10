/**
 * 占い計算ロジック
 * 数秘術、干支の計算を行う
 */

// 十干の配列
export const JIKKAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
export const JIKKAN_READING = ['きのえ', 'きのと', 'ひのえ', 'ひのと', 'つちのえ', 'つちのと', 'かのえ', 'かのと', 'みずのえ', 'みずのと'] as const;

// 十二支の配列
export const JUNISHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;
export const JUNISHI_READING = ['ね', 'うし', 'とら', 'う', 'たつ', 'み', 'うま', 'ひつじ', 'さる', 'とり', 'いぬ', 'い'] as const;

// 基準年（甲子年）
const BASE_YEAR = 1984;

/**
 * 生年月日から才能数を計算
 * @param day 生まれた日（1-31）
 * @returns 才能数（1-9, 11, 22）
 */
export function calculateTalentNumber(day: number): number {
  // マスターナンバーをチェック
  if (day === 11 || day === 22) {
    return day;
  }

  // 一桁になるまで足す
  let result = day;
  while (result >= 10) {
    result = sumDigits(result);
  }
  return result;
}

/**
 * 生年月日から本質数を計算
 * @param year 生まれた年
 * @param month 生まれた月
 * @param day 生まれた日
 * @returns 本質数（1-9, 11, 22, 33）
 */
export function calculateEssenceNumber(year: number, month: number, day: number): number {
  // 年月日のすべての数字を足す
  const yearDigits = sumDigits(year);
  const monthDigits = month < 10 ? month : sumDigits(month);
  const dayDigits = sumDigits(day);
  
  let result = yearDigits + monthDigits + dayDigits;
  
  // マスターナンバーをチェック
  if (result === 11 || result === 22 || result === 33) {
    return result;
  }

  // 一桁になるまで足す
  while (result >= 10) {
    result = sumDigits(result);
  }
  return result;
}

/**
 * 生年月日から探究数を計算
 * @param month 生まれた月
 * @param day 生まれた日
 * @returns 探究数（1-9, 11）
 */
export function calculateInquiryNumber(month: number, day: number): number {
  const monthDigits = month < 10 ? month : sumDigits(month);
  const dayDigits = sumDigits(day);
  
  let result = monthDigits + dayDigits;
  
  // マスターナンバーをチェック
  if (result === 11) {
    return result;
  }

  // 一桁になるまで足す
  while (result >= 10) {
    result = sumDigits(result);
  }
  return result;
}

/**
 * 数字の各桁を足す
 */
function sumDigits(num: number): number {
  return num.toString().split('').reduce((sum, digit) => sum + parseInt(digit, 10), 0);
}

/**
 * 年の干支を計算
 * @param year 西暦年
 * @returns 干支の情報
 */
export function calculateYearEto(year: number) {
  const jikkanIndex = (year - BASE_YEAR) % 10;
  const junishiIndex = (year - BASE_YEAR) % 12;
  
  // 負の値の場合は正の値に変換
  const jikkan = jikkanIndex < 0 ? JIKKAN[jikkanIndex + 10] : JIKKAN[jikkanIndex];
  const junishi = junishiIndex < 0 ? JUNISHI[junishiIndex + 12] : JUNISHI[junishiIndex];
  const jikkanReading = jikkanIndex < 0 ? JIKKAN_READING[jikkanIndex + 10] : JIKKAN_READING[jikkanIndex];
  const junishiReading = junishiIndex < 0 ? JUNISHI_READING[junishiIndex + 12] : JUNISHI_READING[junishiIndex];
  
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
 * 月の干支を計算
 * @param yearEto 年の干支情報
 * @param month 月（1-12）
 * @returns 月の干支情報
 */
export function calculateMonthEto(yearEto: ReturnType<typeof calculateYearEto>, month: number) {
  // 月の十二支は固定
  const monthJunishiMap: Record<number, typeof JUNISHI[number]> = {
    1: '寅', 2: '卯', 3: '辰', 4: '巳', 5: '午', 6: '未',
    7: '申', 8: '酉', 9: '戌', 10: '亥', 11: '子', 12: '丑'
  };
  
  const junishi = monthJunishiMap[month];
  const junishiIndex = JUNISHI.indexOf(junishi);
  const junishiReading = JUNISHI_READING[junishiIndex];
  
  // 月の十干を計算（年の十干から）
  const yearJikkanIndex = JIKKAN.indexOf(yearEto.jikkan);
  const monthJikkanMap: Record<number, typeof JIKKAN[number][]> = {
    0: ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'], // 甲年・己年
    1: ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'], // 乙年・庚年
    2: ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'], // 丙年・辛年
    3: ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], // 丁年・壬年
    4: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙'], // 戊年・癸年
    5: ['丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁'], // 己年（甲年と同じ）
    6: ['戊', '己', '庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己'], // 庚年（乙年と同じ）
    7: ['庚', '辛', '壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛'], // 辛年（丙年と同じ）
    8: ['壬', '癸', '甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'], // 壬年（丁年と同じ）
    9: ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸', '甲', '乙']  // 癸年（戊年と同じ）
  };
  
  const jikkanIndex = yearJikkanIndex % 5; // 0-4に正規化（5年周期）
  const jikkan = monthJikkanMap[jikkanIndex][month - 1];
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
 * 生年月日からすべての占い結果を計算
 */
export function calculateFortune(year: number, month: number, day: number) {
  const talentNumber = calculateTalentNumber(day);
  const essenceNumber = calculateEssenceNumber(year, month, day);
  const inquiryNumber = calculateInquiryNumber(month, day);
  const yearEto = calculateYearEto(year);
  const monthEto = calculateMonthEto(yearEto, month);
  
  return {
    talentNumber,
    essenceNumber,
    inquiryNumber,
    yearEto,
    monthEto,
    birthDate: { year, month, day }
  };
}

