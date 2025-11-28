/**
 * リスク分析ロジック
 * MBTI（内的ストレス）と四柱推命（外的バイオリズム）を組み合わせてリスクを判定
 */

import { MBTIType } from './mbti.js';
import { calculateFourPillars } from './shichu-suimei.js';

export interface RiskDetail {
    level: number; // 1: Low, 2: Medium, 3: High, 4: Critical
    type: 'BURNOUT' | 'CONFLICT' | 'MOTIVATION' | 'STAGNATION' | 'NONE';
    title: string;
    reason: string;
    actionItem: string;
}

// MBTIごとのストレス要因定義
const MBTI_STRESS_TRIGGERS: Record<MBTIType, { title: string; reason: string; action: string }> = {
    INTJ: {
        title: '過度な抱え込み (Gripping)',
        reason: '細部への過剰な執着や、感情的な爆発が起きやすい状態です。完璧主義が裏目に出ています。',
        action: '進捗の細かな管理よりも、まずは本人の懸念事項を聞き出す時間を設けてください。'
    },
    INTP: {
        title: '分析麻痺 (Analysis Paralysis)',
        reason: '考えすぎて行動できなくなっています。感情的な爆発や、極端な論理への固執が見られます。',
        action: '「まずは60%の完成度で良い」と伝え、小さなアウトプットを促してください。'
    },
    ENTJ: {
        title: '独善的支配 (Domination)',
        reason: '他者の感情を無視し、強引に物事を進めようとしています。孤立するリスクがあります。',
        action: 'チームメンバーからのフィードバックを（匿名でも良いので）伝え、客観的な視点を取り戻させてください。'
    },
    ENTP: {
        title: '集中力散漫 (Distraction)',
        reason: '新しいことに目移りし、ルーチンワークや詳細な詰めを放棄しています。',
        action: '短期的なマイルストーンを設定し、ゲーム感覚でタスクを完了させるよう誘導してください。'
    },
    INFJ: {
        title: '燃え尽き (Burnout)',
        reason: '他者の感情や問題を背負い込みすぎています。理想と現実のギャップに苦しんでいます。',
        action: '業務量を調整し、一人で静かに過ごせる時間を確保してあげてください。'
    },
    INFP: {
        title: '現実逃避 (Withdrawal)',
        reason: '批判を恐れて殻に閉じこもっています。論理的な批判を個人攻撃と受け取っています。',
        action: '批判ではなく「期待」を伝え、彼らの価値観を肯定することから対話を始めてください。'
    },
    ENFJ: {
        title: '自己犠牲 (Self-Sacrifice)',
        reason: '調和を保つために無理をしすぎています。批判に対して過敏になっています。',
        action: '「NO」と言うことを許可し、彼ら自身のニーズを優先するよう伝えてください。'
    },
    ENFP: {
        title: '方向喪失 (Lost Direction)',
        reason: '選択肢が多すぎて迷走しています。詳細な作業に圧倒され、無気力になっています。',
        action: '優先順位を一緒に整理し、最初の一歩を具体的に示してあげてください。'
    },
    ISTJ: {
        title: '変化への抵抗 (Resistance)',
        reason: '急な変更や不確実性にストレスを感じ、過去のやり方に固執しています。',
        action: '変更の理由と、新しい手順を論理的かつ詳細に説明し、安心感を与えてください。'
    },
    ISFJ: {
        title: '悲観的思考 (Pessimism)',
        reason: '将来への不安が募り、最悪の事態ばかりを想像しています。「断れない」ストレスが限界です。',
        action: '具体的な感謝を伝え、彼らの貢献がチームに不可欠であることを再確認させてください。'
    },
    ESTJ: {
        title: '感情的爆発 (Outburst)',
        reason: '計画通りに進まないことに苛立ち、周囲に当たり散らしている可能性があります。',
        action: '状況をコントロールできている感覚を取り戻させるため、小さな成功体験を積ませてください。'
    },
    ESFJ: {
        title: '過剰適応 (Over-Adaptation)',
        reason: '嫌われないように振る舞いすぎて、自分を見失っています。批判を恐れて意見が言えません。',
        action: '個別の面談を設定し、本音を話しても安全な場であることを保証してください。'
    },
    ISTP: {
        title: '冷笑的態度 (Cynicism)',
        reason: '感情的なプレッシャーから逃れるため、冷淡で皮肉な態度をとっています。',
        action: '感情的な対話を避け、事実と論理に基づいた具体的な課題解決に集中させてください。'
    },
    ISFP: {
        title: '自己批判 (Self-Criticism)',
        reason: '自分の能力を過小評価し、プレッシャーに押しつぶされそうになっています。',
        action: '具体的な成果物や、彼らの独自のセンスを褒め、自信を回復させてください。'
    },
    ESTP: {
        title: '衝動的行動 (Impulsivity)',
        reason: '退屈に耐えられず、リスクの高い行動や無責任な言動が増えています。',
        action: '短期的なチャレンジや、身体を動かすタスクを与え、エネルギーを発散させてください。'
    },
    ESFP: {
        title: '享楽的逃避 (Escapism)',
        reason: '深刻な問題から目を背け、表面的な楽しさに逃げています。孤独を恐れています。',
        action: '深刻になりすぎず、ポジティブな未来の話をしながら、現実的な課題に向き合わせましょう。'
    }
};

/**
 * リスク分析を実行
 * @param mbti MBTIタイプ
 * @param fourPillars 四柱推命結果
 * @returns リスク詳細
 */
export function analyzeRisk(mbti: MBTIType | null, fourPillars: ReturnType<typeof calculateFourPillars>): RiskDetail {
    if (!mbti) {
        return {
            level: 1,
            type: 'NONE',
            title: 'データ不足',
            reason: 'MBTIデータがありません。',
            actionItem: 'MBTI診断を実施してください。'
        };
    }

    const stressInfo = MBTI_STRESS_TRIGGERS[mbti];
    let riskLevel = 1;
    let riskTitle = '安定';
    let riskReason = '現在は安定しています。';
    let actionItem = '定期的な1on1で現状維持を確認してください。';

    // 四柱推命によるバイオリズム判定
    // 空亡（天中殺）チェック
    const isVoidYear = fourPillars.voidBranches.includes(fourPillars.yearPillar.junishi);
    const isVoidMonth = fourPillars.voidBranches.includes(fourPillars.monthPillar.junishi);

    // 運気サイクル（十二運）チェック
    // 衰、病、死、墓、絶 はエネルギー低下
    const lowEnergyPalaces = ['衰', '病', '死', '墓', '絶'];
    const isLowEnergyYear = lowEnergyPalaces.includes(fourPillars.yearPillar.twelvePalace);

    // リスク判定ロジック
    if (isVoidYear || isVoidMonth) {
        riskLevel = 2;
        riskTitle = '判断ミス注意期 (空亡)';
        riskReason = '運気の休息期（空亡）に入っており、判断力が低下しやすい時期です。';
        actionItem = '重要な決断はチームでダブルチェックを行い、新しいことへの着手は慎重に。';
    }

    // MBTIの弱点と運気の低下が重なる場合
    if (riskLevel >= 2 && isLowEnergyYear) {
        riskLevel = 3;
        riskTitle = `${stressInfo.title} の兆候`;
        riskReason = `運気の低下により、${mbti}特有のストレス反応（${stressInfo.title}）が出やすくなっています。${stressInfo.reason}`;
        actionItem = stressInfo.action;
    }

    // さらに深刻な組み合わせ（例：空亡かつ絶）
    if ((isVoidYear || isVoidMonth) && fourPillars.yearPillar.twelvePalace === '絶') {
        riskLevel = 4;
        riskTitle = '要ケア (Critical)';
        riskReason = '運気が最も不安定な時期です。精神的な消耗が激しく、突発的なトラブルも起きやすい状態です。';
        actionItem = '無理な目標は避け、メンタルケアを最優先してください。長期休暇も検討の価値があります。';
    }

    return {
        level: riskLevel,
        type: riskLevel >= 3 ? 'BURNOUT' : riskLevel === 2 ? 'STAGNATION' : 'NONE',
        title: riskTitle,
        reason: riskReason,
        actionItem: actionItem
    };
}
