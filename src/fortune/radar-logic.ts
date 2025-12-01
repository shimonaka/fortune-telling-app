/**
 * 特性レーダーチャートの計算ロジック
 * MBTIと四柱推命（通変星）を組み合わせて5つのパラメータを算出
 */

import { MBTIType } from './mbti.js';
import { FourPillarsResult, TenGod } from './types.js';

export interface RadarData {
    labels: string[];
    datasets: {
        label: string;
        data: number[];
        backgroundColor: string;
        borderColor: string;
        borderWidth: number;
        pointBackgroundColor: string;
    }[];
}

/**
 * レーダーチャート用のデータを計算
 * @param mbti MBTIタイプ
 * @param fourPillars 四柱推命結果
 */
export function calculateRadarData(mbti: { type: MBTIType }, fourPillars: FourPillarsResult): RadarData {
    // 5つのパラメータ初期値 (平均的な3点からスタート)
    let scores = {
        intuition: 3,   // 直感力
        analysis: 3,    // 分析力
        action: 3,      // 行動力
        cooperation: 3, // 協調性
        creativity: 3   // 創造性
    };

    // 1. MBTIによる加点
    const type = mbti.type;

    // 直感力 (N型)
    if (type.includes('N')) scores.intuition += 3;

    // 分析力 (T型, J型)
    if (type.includes('T')) scores.analysis += 3;
    if (type.includes('J')) scores.analysis += 1;

    // 行動力 (E型, J型)
    if (type.includes('E')) scores.action += 2;
    if (type.includes('J')) scores.action += 1;
    if (type.includes('P')) scores.action += 1; // P型も柔軟な行動力がある

    // 協調性 (F型, E型)
    if (type.includes('F')) scores.cooperation += 3;
    if (type.includes('E')) scores.cooperation += 1;

    // 創造性 (N型, P型)
    if (type.includes('N')) scores.creativity += 2;
    if (type.includes('P')) scores.creativity += 2;


    // 2. 四柱推命（通変星）による加点
    // 月柱（社会運）を重視（x2）、年柱（本質）と時柱（晩年・隠れた才能）も加味（x1）

    const addScoreFromTenGod = (tenGod: TenGod | null, weight: number) => {
        if (!tenGod) return;

        switch (tenGod) {
            case '比肩': // 自立、マイペース
                scores.action += 1 * weight;
                scores.analysis += 1 * weight;
                break;
            case '劫財': // 意欲、社交（外面）
                scores.action += 2 * weight;
                scores.cooperation += 1 * weight; // 組織を作る力
                break;
            case '食神': // おおらか、表現
                scores.creativity += 1 * weight;
                scores.cooperation += 2 * weight;
                break;
            case '傷官': // 鋭い感性、技術
                scores.creativity += 3 * weight; // 傷官はクリエイティブの星
                scores.intuition += 1 * weight;
                scores.analysis += 1 * weight;
                break;
            case '偏財': // 多趣味、社交
                scores.cooperation += 2 * weight;
                scores.action += 1 * weight;
                break;
            case '正財': // 真面目、蓄積
                scores.analysis += 1 * weight;
                scores.cooperation += 1 * weight;
                break;
            case '偏官': // 行動、親分肌
                scores.action += 3 * weight; // 行動の星
                scores.intuition += 1 * weight;
                break;
            case '正官': // 責任感、規律
                scores.analysis += 2 * weight;
                scores.cooperation += 1 * weight;
                break;
            case '偏印': // ユニーク、知恵
                scores.intuition += 3 * weight; // 直感・アイデアの星
                scores.creativity += 2 * weight;
                break;
            case '印綬': // 学問、母性
                scores.analysis += 2 * weight; // 知性の星
                scores.intuition += 1 * weight;
                break;
        }
    };

    // 各柱の通変星を評価
    addScoreFromTenGod(fourPillars.monthPillar.tenGod, 1.5); // 月柱は社会的な顔なので影響大
    addScoreFromTenGod(fourPillars.yearPillar.tenGod, 1.0);
    if (fourPillars.hourPillar) {
        addScoreFromTenGod(fourPillars.hourPillar.tenGod, 1.0);
    }

    // 3. スコアの正規化 (最大10点、最小2点)
    const normalize = (score: number) => Math.min(10, Math.max(2, Math.round(score)));

    return {
        labels: ['直感力', '分析力', '行動力', '協調性', '創造性'],
        datasets: [{
            label: 'あなたの特性',
            data: [
                normalize(scores.intuition),
                normalize(scores.analysis),
                normalize(scores.action),
                normalize(scores.cooperation),
                normalize(scores.creativity)
            ],
            backgroundColor: 'rgba(2, 136, 209, 0.2)',
            borderColor: 'rgba(2, 136, 209, 1)',
            borderWidth: 2,
            pointBackgroundColor: '#fff'
        }]
    };
}
