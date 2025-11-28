/**
 * 占い結果の型定義
 */

import type { MBTIType, MBTIData } from './mbti.js';
import type { TenGod, TwelvePalace } from './shichu-suimei.js';
import { JIKKAN, JUNISHI, JIKKAN_READING, JUNISHI_READING } from './calculations.js';

export type { TenGod, TwelvePalace };

export type Jikkan = typeof JIKKAN[number];
export type Junishi = typeof JUNISHI[number];
export type JikkanReading = typeof JIKKAN_READING[number];
export type JunishiReading = typeof JUNISHI_READING[number];

export interface FortuneResult {
  talentNumber: number;
  essenceNumber: number;
  inquiryNumber: number;
  yearEto: {
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
    fullName: string;
    fullReading: string;
  };
  monthEto: {
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
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
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
    fullName: string;
    fullReading: string;
    tenGod: TenGod;
    twelvePalace: TwelvePalace;
  };
  monthPillar: {
    name: string;
    description: string;
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
    fullName: string;
    fullReading: string;
    tenGod: TenGod;
    twelvePalace: TwelvePalace;
  };
  dayPillar: {
    name: string;
    description: string;
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
    fullName: string;
    fullReading: string;
    tenGod: string; // '比肩' or TenGod
    twelvePalace: TwelvePalace;
    jikkanIndex: number;
    junishiIndex: number;
  };
  hourPillar: {
    name: string;
    description: string;
    jikkan: Jikkan;
    junishi: Junishi;
    jikkanReading: JikkanReading;
    junishiReading: JunishiReading;
    fullName: string;
    fullReading: string;
    tenGod: TenGod | null;
    twelvePalace: TwelvePalace | null;
    jikkanIndex: number;
    junishiIndex: number;
  } | null;
  voidBranches: string[];
  tenGods: {
    year: TenGod;
    month: TenGod;
    hour: TenGod | null;
  };
  twelvePalaces: {
    year: TwelvePalace;
    month: TwelvePalace;
    day: TwelvePalace;
    hour: TwelvePalace | null;
  };
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
