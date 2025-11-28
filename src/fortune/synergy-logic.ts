/**
 * メンバー間シナジー分析ロジック
 * MBTI × 四柱推命（リスク状態）を組み合わせた相性診断
 */

import { MBTIType, MBTI_TYPES } from './mbti.js';
import type { FourPillarsResult, TenGod } from './types.js'; // types.jsからインポート
import { analyzeRisk } from './risk-logic.js';

export interface SynergyResult {
    score: number;
    synergyPoints: string[];
    riskScenarios: {
        title: string;
        scenario: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH';
    }[];
    managementAdvice: {
        pairing: string;
        roles: string;
    };
}

// 五行の相生・相克関係（簡易版）
// 木 -> 火 -> 土 -> 金 -> 水 -> 木
const ELEMENT_RELATIONS: Record<string, { feeds: string; attacks: string }> = {
    '木': { feeds: '火', attacks: '土' },
    '火': { feeds: '土', attacks: '金' },
    '土': { feeds: '金', attacks: '水' },
    '金': { feeds: '水', attacks: '木' },
    '水': { feeds: '木', attacks: '火' }
};

// 十干から五行への変換
function getElement(jikkan: string): string {
    if (['甲', '乙'].includes(jikkan)) return '木';
    if (['丙', '丁'].includes(jikkan)) return '火';
    if (['戊', '己'].includes(jikkan)) return '土';
    if (['庚', '辛'].includes(jikkan)) return '金';
    if (['壬', '癸'].includes(jikkan)) return '水';
    return '';
}

/**
 * シナジー分析を実行
 */
export function analyzeSynergy(
    memberA: { name: string; mbti: MBTIType | null; fourPillars: FourPillarsResult },
    memberB: { name: string; mbti: MBTIType | null; fourPillars: FourPillarsResult }
): SynergyResult {
    let score = 70; // ベーススコア
    const synergyPoints: string[] = [];
    const riskScenarios: SynergyResult['riskScenarios'] = [];
    let pairingAdvice = '標準的な組み合わせです。';
    let roleAdvice = 'お互いの役割を明確にすることで、スムーズに連携できます。';

    if (!memberA.mbti || !memberB.mbti) {
        return {
            score: 0,
            synergyPoints: ['データ不足のため分析できません'],
            riskScenarios: [],
            managementAdvice: { pairing: '', roles: '' }
        };
    }

    const typeA = MBTI_TYPES[memberA.mbti];
    const typeB = MBTI_TYPES[memberB.mbti];

    // 1. MBTIによる基本的相性
    // E/Iの補完
    if (memberA.mbti[0] !== memberB.mbti[0]) {
        score += 5;
        synergyPoints.push('「行動派」と「思考派」のバランスが良く、盲点を補い合えます。');
    }

    // N/Sの視点
    if (memberA.mbti[1] !== memberB.mbti[1]) {
        // 視点が違うため、衝突リスクはあるが、補完できれば強い
        riskScenarios.push({
            title: '視点の不一致',
            scenario: `${memberA.name}さんは${memberA.mbti[1] === 'N' ? '理想や全体像' : '現実や詳細'}を重視し、${memberB.name}さんは${memberB.mbti[1] === 'N' ? '理想や全体像' : '現実や詳細'}を重視するため、話が噛み合わないことがあります。`,
            severity: 'MEDIUM'
        });
    } else {
        score += 5;
        synergyPoints.push('情報の捉え方が似ており、スムーズに意思疎通ができます。');
    }

    // 2. 四柱推命（日干）による相性
    const elementA = getElement(memberA.fourPillars.dayPillar.jikkan);
    const elementB = getElement(memberB.fourPillars.dayPillar.jikkan);

    if (ELEMENT_RELATIONS[elementA].feeds === elementB) {
        score += 10;
        synergyPoints.push(`${memberA.name}さんが${memberB.name}さんを自然とサポートしたくなる関係性です（${elementA}生${elementB}）。`);
        roleAdvice = `${memberA.name}さんがメンターやサポート役に回ると、${memberB.name}さんの能力が引き出されます。`;
    } else if (ELEMENT_RELATIONS[elementB].feeds === elementA) {
        score += 10;
        synergyPoints.push(`${memberB.name}さんが${memberA.name}さんを自然とサポートしたくなる関係性です（${elementB}生${elementA}）。`);
        roleAdvice = `${memberB.name}さんがメンターやサポート役に回ると、${memberA.name}さんの能力が引き出されます。`;
    } else if (ELEMENT_RELATIONS[elementA].attacks === elementB || ELEMENT_RELATIONS[elementB].attacks === elementA) {
        // 相克関係は刺激になるが、ストレスにもなる
        score -= 5;
        riskScenarios.push({
            title: '潜在的な反発',
            scenario: '本質的な性質が対立しており、無意識に相手の言動にイライラしやすい関係です。',
            severity: 'LOW'
        });
    }

    // 3. 現在のリスク状態（バイオリズム）による動的リスク分析
    const riskA = analyzeRisk(memberA.mbti, memberA.fourPillars);
    const riskB = analyzeRisk(memberB.mbti, memberB.fourPillars);

    // 両者が高リスク状態の場合
    if (riskA.level >= 3 && riskB.level >= 3) {
        score -= 20;
        riskScenarios.push({
            title: '共倒れリスク (Critical)',
            scenario: `二人とも現在、精神的な余裕がない状態（${riskA.title} / ${riskB.title}）です。些細なことで感情的な衝突が起き、修復不可能になる危険性があります。`,
            severity: 'HIGH'
        });
        pairingAdvice = '現在は組ませるべきではありません。お互いに余裕がなく、ネガティブなスパイラルに陥る可能性が高いです。';
    }
    // 片方が「空亡（判断ミス）」で、もう片方が「批判的（T型）」な場合
    else if ((riskA.title.includes('空亡') && memberB.mbti.includes('T')) || (riskB.title.includes('空亡') && memberA.mbti.includes('T'))) {
        const unstable = riskA.title.includes('空亡') ? memberA.name : memberB.name;
        const critic = riskA.title.includes('空亡') ? memberB.name : memberA.name;

        score -= 10;
        riskScenarios.push({
            title: '追い打ちリスク',
            scenario: `${unstable}さんが判断ミスをしやすい時期に、${critic}さんが論理的に厳しく指摘することで、${unstable}さんが自信を喪失する恐れがあります。`,
            severity: 'MEDIUM'
        });
        roleAdvice = `${critic}さんには、${unstable}さんのミスを指摘するのではなく、事前にチェックする「ガード役」として振る舞うよう伝えてください。`;
    }
    // 片方が「燃え尽き」で、もう片方が「エネルギッシュ（E型）」な場合
    else if ((riskA.type === 'BURNOUT' && memberB.mbti.includes('E')) || (riskB.type === 'BURNOUT' && memberA.mbti.includes('E'))) {
        const tired = riskA.type === 'BURNOUT' ? memberA.name : memberB.name;
        const energetic = riskA.type === 'BURNOUT' ? memberB.name : memberA.name;

        riskScenarios.push({
            title: '温度差による疲弊',
            scenario: `${tired}さんが休息を必要としている時に、${energetic}さんの高いエネルギーや積極性がプレッシャーとなり、${tired}さんをさらに追い詰める可能性があります。`,
            severity: 'MEDIUM'
        });
        pairingAdvice = '距離感を保つ必要があります。';
    }

    // スコアの正規化 (0-100)
    score = Math.max(0, Math.min(100, score));

    // 最終的なアドバイス生成
    if (score >= 80) {
        pairingAdvice = '非常に強力なペアです。重要なプロジェクトや困難な課題を任せるのに最適です。';
    } else if (score <= 40 && pairingAdvice === '標準的な組み合わせです。') {
        pairingAdvice = '相性はあまり良くありません。長期的なペアワークは避け、タスクベースでの協力に留めるのが無難です。';
    }

    return {
        score,
        synergyPoints,
        riskScenarios,
        managementAdvice: {
            pairing: pairingAdvice,
            roles: roleAdvice
        }
    };
}
