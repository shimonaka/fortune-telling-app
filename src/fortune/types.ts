/**
 * 占い結果の型定義
 */

import type { MBTIType, MBTIData } from './mbti.js';

export interface FortuneResult {
  talentNumber: number;
  essenceNumber: number;
  inquiryNumber: number;
  yearEto: {
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  };
  monthEto: {
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  };
  birthDate: {
    year: number;
    month: number;
    day: number;
  };
}

export interface FourPillarsResult {
  yearPillar: {
    name: string;
    description: string;
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  };
  monthPillar: {
    name: string;
    description: string;
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  };
  dayPillar: {
    name: string;
    description: string;
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  };
  hourPillar: {
    name: string;
    description: string;
    jikkan: string;
    junishi: string;
    jikkanReading: string;
    junishiReading: string;
    fullName: string;
    fullReading: string;
  } | null;
}

export interface CompleteFortuneResult {
  numerology: FortuneResult;
  fourPillars: FourPillarsResult;
  mbti: MBTIData;
  gender: string;
  birthDate: {
    year: number;
    month: number;
    day: number;
    hour?: number;
  };
}
