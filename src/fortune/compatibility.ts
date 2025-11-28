import { MBTIType, MBTI_TYPES } from './mbti.js';

export interface YUICode {
    birthDate: { year: number; month: number; day: number };
    gender: string;
    mbti: MBTIType;
}

export interface CompatibilityResult {
    score: number;
    summary: string;
    communicationAdvice: string;
    synergyPoints: string[];
}

// YUIコードの生成
export function generateYUICode(year: number, month: number, day: number, gender: string, mbti: MBTIType): string {
    const y = year.toString().padStart(4, '0');
    const m = month.toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    const g = gender === 'male' ? 'M' : gender === 'female' ? 'F' : 'O';
    return `${y}${m}${d}-${g}-${mbti}`;
}

// YUIコードのパース
export function parseYUICode(code: string): YUICode | null {
    try {
        const parts = code.split('-');
        if (parts.length !== 3) return null;

        const dateStr = parts[0];
        const genderCode = parts[1];
        const mbti = parts[2] as MBTIType;

        if (dateStr.length !== 8) return null;
        const year = parseInt(dateStr.substring(0, 4));
        const month = parseInt(dateStr.substring(4, 6));
        const day = parseInt(dateStr.substring(6, 8));

        const gender = genderCode === 'M' ? 'male' : genderCode === 'F' ? 'female' : 'other';

        if (!MBTI_TYPES[mbti]) return null;

        return {
            birthDate: { year, month, day },
            gender,
            mbti
        };
    } catch (e) {
        return null;
    }
}

// 相性分析ロジック
export function analyzeCompatibility(managerMBTI: MBTIType, subordinateMBTI: MBTIType): CompatibilityResult {
    const manager = MBTI_TYPES[managerMBTI];
    const subordinate = MBTI_TYPES[subordinateMBTI];

    let score = 70; // 基本スコア
    const synergyPoints: string[] = [];
    let communicationAdvice = '';

    // 指標ごとの比較
    const mIndices = {
        E_I: managerMBTI[0],
        S_N: managerMBTI[1],
        T_F: managerMBTI[2],
        J_P: managerMBTI[3]
    };

    const sIndices = {
        E_I: subordinateMBTI[0],
        S_N: subordinateMBTI[1],
        T_F: subordinateMBTI[2],
        J_P: subordinateMBTI[3]
    };

    // 1. エネルギーの方向 (E/I)
    if (mIndices.E_I !== sIndices.E_I) {
        synergyPoints.push('異なる視点からの意見交換が活性化します');
        score += 5;
    } else {
        synergyPoints.push('ペースが合いやすく、スムーズな会話が可能です');
        score += 5;
    }

    // 2. 情報の取り方 (S/N) - 誤解の元になりやすい
    if (mIndices.S_N !== sIndices.S_N) {
        if (mIndices.S_N === 'S') {
            communicationAdvice += '部下は抽象的な概念や可能性を好みます。具体的な事実だけでなく、「ビジョン」や「意義」を語ると響きます。\n';
        } else {
            communicationAdvice += '部下は具体的な事実や経験を重視します。抽象的な話だけでなく、「具体的な手順」や「データ」を示すと納得します。\n';
        }
    } else {
        synergyPoints.push('情報の捉え方が似ており、前提の共有が早いです');
        score += 10;
    }

    // 3. 判断基準 (T/F) - 1on1で最も重要
    if (mIndices.T_F !== sIndices.T_F) {
        if (mIndices.T_F === 'T') {
            communicationAdvice += '部下は感情や調和を大切にします。論理的な指摘の前に、まずは「共感」と「感謝」を伝えることが重要です。「なぜ」よりも「誰のために」が響きます。\n';
        } else {
            communicationAdvice += '部下は論理と公平性を重視します。感情的な訴えよりも、「理由」と「メリット」を論理的に説明すると動きます。\n';
        }
        score -= 5; // コミュニケーションコストがかかるため
    } else {
        synergyPoints.push('判断基準が共通しており、意思決定がスムーズです');
        score += 10;
    }

    // 4. 生活様式 (J/P)
    if (mIndices.J_P !== sIndices.J_P) {
        if (mIndices.J_P === 'J') {
            communicationAdvice += '部下は柔軟性を好みます。ガチガチに管理するより、ある程度の裁量と余白を与えるとパフォーマンスが上がります。\n';
        } else {
            communicationAdvice += '部下は計画性を好みます。急な変更は避け、早めの期限設定とマイルストーンの共有を行うと安心します。\n';
        }
    } else {
        score += 5;
    }

    // 総合評価コメント
    let summary = '';
    if (score >= 90) {
        summary = '最高のパートナーシップです。お互いの強みを活かし、阿吽の呼吸で仕事ができます。';
    } else if (score >= 75) {
        summary = '良好な関係です。いくつかの違いを理解することで、強力な補完関係を築けます。';
    } else {
        summary = '異なる視点を持つ二人です。コミュニケーションの「翻訳」を意識することで、お互いにない視点を得られます。';
    }

    if (!communicationAdvice) {
        communicationAdvice = '基本的な相性は良いです。お互いのスタイルを尊重し合えば、問題なくコミュニケーションが取れます。';
    }

    return {
        score,
        summary,
        communicationAdvice,
        synergyPoints
    };
}
