/**
 * チーム役割分析ロジック
 * MBTIと四柱推命（通変星）を組み合わせて適性ロールをスコアリング
 */

import { MBTIType } from './mbti.js';
import { calculateFourPillars, TenGod } from './shichu-suimei.js';

export type RoleType = 'Leader' | 'Innovator' | 'Executor' | 'Coordinator' | 'Strategist';

export interface TeamRole {
    primary: RoleType;
    secondary: RoleType;
    scores: Record<RoleType, number>;
}

// MBTIによるベーススコア定義
const MBTI_ROLE_SCORES: Record<MBTIType, Record<RoleType, number>> = {
    // Leader: ENTJ, ESTJ, ENFJ
    ENTJ: { Leader: 5, Strategist: 4, Innovator: 3, Executor: 2, Coordinator: 1 },
    ESTJ: { Leader: 5, Executor: 4, Coordinator: 3, Strategist: 2, Innovator: 1 },
    ENFJ: { Leader: 4, Coordinator: 5, Innovator: 3, Strategist: 2, Executor: 2 },

    // Innovator: ENTP, INTP, ENFP
    ENTP: { Innovator: 5, Strategist: 4, Leader: 3, Coordinator: 2, Executor: 1 },
    INTP: { Innovator: 5, Strategist: 5, Executor: 2, Leader: 1, Coordinator: 1 },
    ENFP: { Innovator: 5, Coordinator: 4, Leader: 3, Executor: 1, Strategist: 2 },

    // Executor: ISTJ, ESTP, ISTP, ISFP
    ISTJ: { Executor: 5, Strategist: 3, Coordinator: 2, Leader: 2, Innovator: 1 },
    ESTP: { Executor: 5, Leader: 3, Innovator: 4, Coordinator: 2, Strategist: 1 },
    ISTP: { Executor: 5, Innovator: 3, Strategist: 3, Leader: 1, Coordinator: 1 },
    ISFP: { Executor: 4, Coordinator: 3, Innovator: 4, Strategist: 1, Leader: 1 },

    // Coordinator: ESFJ, ISFJ, ESFP
    ESFJ: { Coordinator: 5, Leader: 3, Executor: 4, Strategist: 1, Innovator: 2 },
    ISFJ: { Coordinator: 5, Executor: 4, Strategist: 2, Leader: 1, Innovator: 1 },
    ESFP: { Coordinator: 4, Innovator: 4, Executor: 3, Leader: 2, Strategist: 1 },

    // Strategist: INTJ, INFJ
    INTJ: { Strategist: 5, Leader: 3, Innovator: 3, Executor: 2, Coordinator: 1 },
    INFJ: { Strategist: 5, Coordinator: 4, Innovator: 3, Leader: 2, Executor: 1 }
};

// 通変星による加点ロジック
// 正官・偏官 -> Leader
// 食神・傷官 -> Innovator
// 正財・偏財 -> Coordinator
// 比肩・劫財 -> Executor (自立心)
// 印綬・偏印 -> Strategist (知性)
const TEN_GOD_BONUS: Record<TenGod, Partial<Record<RoleType, number>>> = {
    '正官': { Leader: 2, Executor: 1 },
    '偏官': { Leader: 2, Executor: 2 },
    '食神': { Innovator: 2, Coordinator: 1 },
    '傷官': { Innovator: 3, Strategist: 1 },
    '正財': { Coordinator: 2, Executor: 1 },
    '偏財': { Coordinator: 2, Innovator: 1 },
    '比肩': { Executor: 2, Leader: 1 },
    '劫財': { Leader: 2, Strategist: 1 },
    '印綬': { Strategist: 2, Coordinator: 1 },
    '偏印': { Strategist: 3, Innovator: 1 }
};

/**
 * チーム役割を計算
 * @param mbti MBTIタイプ
 * @param fourPillars 四柱推命結果
 * @returns チーム役割スコアと判定結果
 */
export function calculateTeamRoles(mbti: MBTIType | null, fourPillars: ReturnType<typeof calculateFourPillars>): TeamRole {
    // 1. ベーススコア初期化
    let scores: Record<RoleType, number> = {
        Leader: 0,
        Innovator: 0,
        Executor: 0,
        Coordinator: 0,
        Strategist: 0
    };

    if (mbti) {
        scores = { ...MBTI_ROLE_SCORES[mbti] };
    }

    // 2. 四柱推命による加点 (月柱と年柱の通変星を見る)
    // 月柱の通変星（社会的な役割）を重視
    const monthGod = fourPillars.monthPillar.tenGod;
    if (monthGod) {
        const bonus = TEN_GOD_BONUS[monthGod];
        Object.entries(bonus).forEach(([role, point]) => {
            scores[role as RoleType] += point;
        });
    }

    // 年柱の通変星も少し加味
    const yearGod = fourPillars.yearPillar.tenGod;
    if (yearGod) {
        const bonus = TEN_GOD_BONUS[yearGod];
        Object.entries(bonus).forEach(([role, point]) => {
            scores[role as RoleType] += (point || 0) * 0.5; // 影響度半分
        });
    }

    // 3. ソートして順位決定
    const sortedRoles = Object.entries(scores).sort((a, b) => b[1] - a[1]);

    return {
        primary: sortedRoles[0][0] as RoleType,
        secondary: sortedRoles[1][0] as RoleType,
        scores
    };
}
