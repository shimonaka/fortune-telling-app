/**
 * MBTIタイプのデータと簡易診断
 */

export type MBTIType = 
  | 'INTJ' | 'INTP' | 'ENTJ' | 'ENTP'
  | 'INFJ' | 'INFP' | 'ENFJ' | 'ENFP'
  | 'ISTJ' | 'ISFJ' | 'ESTJ' | 'ESFJ'
  | 'ISTP' | 'ISFP' | 'ESTP' | 'ESFP';

export interface MBTIData {
  type: MBTIType;
  name: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  workStyle: string;
  communication: string;
  stressFactors: string[];
  motivationFactors: string[];
  teamRole: string;
  managementStyle: string;
}

export const MBTI_TYPES: Record<MBTIType, MBTIData> = {
  INTJ: {
    type: 'INTJ',
    name: '建築家',
    description: '戦略的思考者で、長期的なビジョンを持ち、独立心が強い',
    strengths: ['戦略的思考', '独立性', '決断力', '論理的思考'],
    weaknesses: ['完璧主義', '感情表現が苦手', '批判的', '孤立しがち'],
    workStyle: '計画を立てて実行する。一人で集中して作業することを好む',
    communication: '直接的で論理的。感情よりも事実を重視',
    stressFactors: ['不確実性', '無計画な変更', '感情的な対立'],
    motivationFactors: ['知的挑戦', '独立性', '長期的目標達成'],
    teamRole: '戦略立案者・分析者',
    managementStyle: '明確な目標設定と論理的な説明を好む'
  },
  INTP: {
    type: 'INTP',
    name: '論理学者',
    description: '理論的で好奇心旺盛。新しいアイデアを探求することを好む',
    strengths: ['論理的思考', '創造性', '柔軟性', '客観性'],
    weaknesses: ['実務が苦手', '感情に鈍感', '決断が遅い', '細部を軽視'],
    workStyle: '自由な環境で理論を探求。締切に弱い',
    communication: '理論的で詳細。感情的な話題は避ける傾向',
    stressFactors: ['過度の管理', '感情的な圧力', 'ルーチンワーク'],
    motivationFactors: ['知的探求', '自由な環境', '革新的なアイデア'],
    teamRole: 'イノベーター・問題解決者',
    managementStyle: '自由な環境と論理的な説明を提供'
  },
  ENTJ: {
    type: 'ENTJ',
    name: '指揮官',
    description: 'リーダーシップがあり、効率を重視し、目標達成に集中する',
    strengths: ['リーダーシップ', '決断力', '効率性', '戦略的思考'],
    weaknesses: ['感情的でない', '短気', '批判的', '他人の感情を軽視'],
    workStyle: '目標指向で効率的。チームを率いて成果を出す',
    communication: '直接的で命令的。感情よりも結果を重視',
    stressFactors: ['非効率', '無能なチーム', '目標の不明確さ'],
    motivationFactors: ['権力', '成功', '挑戦', '成果'],
    teamRole: 'リーダー・意思決定者',
    managementStyle: '明確な目標と成果評価を重視。権限委譲を好む'
  },
  ENTP: {
    type: 'ENTP',
    name: '討論者',
    description: '創造的で機知に富み、新しい可能性を探求する',
    strengths: ['創造性', '適応力', 'コミュニケーション', '戦略的思考'],
    weaknesses: ['ルーチンが苦手', '細部を軽視', '感情に鈍感', '決断が遅い'],
    workStyle: '多様なプロジェクトを並行。変化を好む',
    communication: 'エネルギッシュで論理的。議論を楽しむ',
    stressFactors: ['ルーチンワーク', '過度の管理', '感情的な対立'],
    motivationFactors: ['挑戦', '自由', '創造性', '知的刺激'],
    teamRole: 'イノベーター・交渉者',
    managementStyle: '自由と挑戦を提供。創造的な環境を整える'
  },
  INFJ: {
    type: 'INFJ',
    name: '提唱者',
    description: '理想主義者で、他者を理解し、深い洞察力を持つ',
    strengths: ['洞察力', '共感力', '創造性', '決断力'],
    weaknesses: ['完璧主義', '批判に敏感', '孤立しがち', '燃え尽きやすい'],
    workStyle: '意味のある仕事に集中。一人で深く考える',
    communication: '共感的で深い。非言語的コミュニケーションに敏感',
    stressFactors: ['無意味な仕事', '対立', '過度の社交'],
    motivationFactors: ['意味のある仕事', '成長', '他者への貢献'],
    teamRole: 'カウンセラー・ビジョナリー',
    managementStyle: '意味と目的を提供。個人的な成長を支援'
  },
  INFP: {
    type: 'INFP',
    name: '仲介者',
    description: '理想主義者で、創造的で、価値観を重視する',
    strengths: ['創造性', '共感力', '柔軟性', '価値観の重視'],
    weaknesses: ['批判に敏感', '決断が遅い', '実務が苦手', '燃え尽きやすい'],
    workStyle: '価値観に合う仕事に情熱を注ぐ。柔軟な環境を好む',
    communication: '温かく個人的。感情を大切にする',
    stressFactors: ['価値観の衝突', '過度の批判', 'ルーチンワーク'],
    motivationFactors: ['意味のある仕事', '創造性', '個人的な成長'],
    teamRole: '創造者・価値観の守護者',
    managementStyle: '価値観を尊重し、創造的な環境を提供'
  },
  ENFJ: {
    type: 'ENFJ',
    name: '主人公',
    description: 'カリスマ的で、他者の成長を支援し、調和を重視する',
    strengths: ['リーダーシップ', '共感力', 'コミュニケーション', '組織力'],
    weaknesses: ['批判に敏感', '燃え尽きやすい', '決断が遅い', '過度に理想主義'],
    workStyle: 'チームの成長を支援。調和を重視',
    communication: '温かく説得力がある。他者の感情に敏感',
    stressFactors: ['対立', '無視', '無意味な仕事'],
    motivationFactors: ['他者の成長', '調和', '意味のある仕事'],
    teamRole: 'メンター・組織者',
    managementStyle: 'チームの調和と成長を重視。個人的な関係を築く'
  },
  ENFP: {
    type: 'ENFP',
    name: '運動家',
    description: 'エネルギッシュで創造的、可能性を探求する',
    strengths: ['創造性', 'コミュニケーション', '熱意', '柔軟性'],
    weaknesses: ['ルーチンが苦手', '細部を軽視', '決断が遅い', '燃え尽きやすい'],
    workStyle: '多様なプロジェクトに情熱を注ぐ。変化を好む',
    communication: 'エネルギッシュで楽観的。感情を大切にする',
    stressFactors: ['ルーチンワーク', '過度の管理', '批判'],
    motivationFactors: ['創造性', '自由', '意味のある仕事', '他者とのつながり'],
    teamRole: 'イノベーター・モチベーター',
    managementStyle: '創造性と自由を提供。楽観的な環境を整える'
  },
  ISTJ: {
    type: 'ISTJ',
    name: '管理者',
    description: '実務的で責任感が強く、秩序を重視する',
    strengths: ['責任感', '組織力', '実務能力', '信頼性'],
    weaknesses: ['柔軟性に欠ける', '変化を嫌う', '感情表現が苦手', '批判的'],
    workStyle: '計画を立てて実行。秩序と効率を重視',
    communication: '直接的で事実重視。感情よりも論理',
    stressFactors: ['不確実性', '急な変更', '無秩序'],
    motivationFactors: ['安定', '成果', '責任', '秩序'],
    teamRole: '実務者・組織者',
    managementStyle: '明確な指示と安定した環境を提供'
  },
  ISFJ: {
    type: 'ISFJ',
    name: '擁護者',
    description: '思いやりがあり、責任感が強く、伝統を重視する',
    strengths: ['思いやり', '責任感', '実務能力', '協調性'],
    weaknesses: ['自己主張が弱い', '変化を嫌う', '批判に敏感', '燃え尽きやすい'],
    workStyle: '他者を支援。安定した環境を好む',
    communication: '温かく配慮深い。他者の感情に敏感',
    stressFactors: ['対立', '過度の変化', '無視'],
    motivationFactors: ['他者への貢献', '安定', '認められること'],
    teamRole: 'サポーター・実務者',
    managementStyle: '感謝と安定を提供。個人的な関係を築く'
  },
  ESTJ: {
    type: 'ESTJ',
    name: '幹部',
    description: '実務的で決断力があり、組織を率いる',
    strengths: ['リーダーシップ', '決断力', '組織力', '実務能力'],
    weaknesses: ['柔軟性に欠ける', '感情に鈍感', '批判的', '変化を嫌う'],
    workStyle: '効率的に組織を運営。結果を重視',
    communication: '直接的で命令的。事実と結果を重視',
    stressFactors: ['非効率', '無秩序', '感情的な対立'],
    motivationFactors: ['成果', '権力', '秩序', '成功'],
    teamRole: 'リーダー・組織者',
    managementStyle: '明確な目標と効率を重視。結果で評価'
  },
  ESFJ: {
    type: 'ESFJ',
    name: '領事官',
    description: '協調性があり、他者を支援し、調和を重視する',
    strengths: ['協調性', '組織力', '思いやり', '実務能力'],
    weaknesses: ['批判に敏感', '変化を嫌う', '自己主張が弱い', '燃え尽きやすい'],
    workStyle: 'チームの調和を重視。他者を支援',
    communication: '温かく社交的。他者の感情に敏感',
    stressFactors: ['対立', '無視', '過度の変化'],
    motivationFactors: ['他者への貢献', '調和', '認められること'],
    teamRole: 'サポーター・組織者',
    managementStyle: '調和と感謝を提供。チームの結束を重視'
  },
  ISTP: {
    type: 'ISTP',
    name: '巨匠',
    description: '実用的で独立心が強く、問題解決を好む',
    strengths: ['実務能力', '問題解決', '独立性', '適応力'],
    weaknesses: ['感情表現が苦手', '計画が苦手', '孤立しがち', '感情に鈍感'],
    workStyle: '実践的な問題を解決。自由な環境を好む',
    communication: '簡潔で直接的。感情よりも事実',
    stressFactors: ['過度の管理', '感情的な圧力', 'ルーチンワーク'],
    motivationFactors: ['自由', '挑戦', '実践的な問題解決'],
    teamRole: '問題解決者・実務者',
    managementStyle: '自由と実践的な挑戦を提供'
  },
  ISFP: {
    type: 'ISFP',
    name: '冒険家',
    description: '柔軟で創造的、現在を大切にする',
    strengths: ['創造性', '柔軟性', '実務能力', '共感力'],
    weaknesses: ['計画が苦手', '批判に敏感', '自己主張が弱い', '決断が遅い'],
    workStyle: '創造的な仕事に情熱。柔軟な環境を好む',
    communication: '温かく個人的。感情を大切にする',
    stressFactors: ['過度の管理', '批判', '対立'],
    motivationFactors: ['創造性', '自由', '意味のある仕事'],
    teamRole: '創造者・実務者',
    managementStyle: '創造性と自由を提供。個人的な関係を築く'
  },
  ESTP: {
    type: 'ESTP',
    name: '起業家',
    description: 'エネルギッシュで実用的、行動力がある',
    strengths: ['行動力', '適応力', '実務能力', 'コミュニケーション'],
    weaknesses: ['計画が苦手', '感情に鈍感', '細部を軽視', 'ルーチンが苦手'],
    workStyle: '即座に行動。変化と挑戦を好む',
    communication: '直接的でエネルギッシュ。事実を重視',
    stressFactors: ['ルーチンワーク', '過度の管理', '感情的な対立'],
    motivationFactors: ['行動', '挑戦', '自由', '成果'],
    teamRole: '実行者・交渉者',
    managementStyle: '行動と挑戦を提供。結果で評価'
  },
  ESFP: {
    type: 'ESFP',
    name: 'エンターテイナー',
    description: '楽観的で社交的、現在を楽しむ',
    strengths: ['社交性', '楽観性', '適応力', '創造性'],
    weaknesses: ['計画が苦手', '細部を軽視', '批判に敏感', 'ルーチンが苦手'],
    workStyle: '楽しく社交的な環境で働く。変化を好む',
    communication: 'エネルギッシュで楽観的。感情を大切にする',
    stressFactors: ['ルーチンワーク', '過度の管理', '批判'],
    motivationFactors: ['楽しさ', '他者とのつながり', '自由', '創造性'],
    teamRole: 'モチベーター・創造者',
    managementStyle: '楽しく社交的な環境を提供。感謝を表現'
  }
};

/**
 * MBTI簡易診断（質問に基づく）
 */
export interface MBTIQuestion {
  question: string;
  dimension: 'EI' | 'SN' | 'TF' | 'JP';
  optionA: { text: string; score: number };
  optionB: { text: string; score: number };
}

export const MBTI_QUESTIONS: MBTIQuestion[] = [
  {
    question: 'パーティーや集まりでは？',
    dimension: 'EI',
    optionA: { text: '多くの人と話す', score: 1 },
    optionB: { text: '少数の人と深く話す', score: -1 }
  },
  {
    question: 'エネルギーを充電する方法は？',
    dimension: 'EI',
    optionA: { text: '人と過ごす', score: 1 },
    optionB: { text: '一人の時間', score: -1 }
  },
  {
    question: '情報を処理する方法は？',
    dimension: 'SN',
    optionA: { text: '具体的な事実と詳細', score: 1 },
    optionB: { text: '可能性とパターン', score: -1 }
  },
  {
    question: '新しいスキルを学ぶ時は？',
    dimension: 'SN',
    optionA: { text: '実践的に試す', score: 1 },
    optionB: { text: '理論を理解してから', score: -1 }
  },
  {
    question: '意思決定の基準は？',
    dimension: 'TF',
    optionA: { text: '論理と客観性', score: 1 },
    optionB: { text: '価値観と調和', score: -1 }
  },
  {
    question: '問題が起きた時は？',
    dimension: 'TF',
    optionA: { text: '事実を分析する', score: 1 },
    optionB: { text: '人の気持ちを考える', score: -1 }
  },
  {
    question: '生活スタイルは？',
    dimension: 'JP',
    optionA: { text: '計画を立てて実行', score: 1 },
    optionB: { text: '柔軟に適応', score: -1 }
  },
  {
    question: '締切がある時は？',
    dimension: 'JP',
    optionA: { text: '早めに完了させる', score: 1 },
    optionB: { text: '締切直前まで作業', score: -1 }
  }
];

/**
 * 簡易診断の結果からMBTIタイプを判定
 */
export function calculateMBTIFromAnswers(answers: number[]): MBTIType {
  let EI = 0, SN = 0, TF = 0, JP = 0;
  
  answers.forEach((answer, index) => {
    const question = MBTI_QUESTIONS[index];
    const score = answer === 0 ? question.optionA.score : question.optionB.score;
    
    switch (question.dimension) {
      case 'EI': EI += score; break;
      case 'SN': SN += score; break;
      case 'TF': TF += score; break;
      case 'JP': JP += score; break;
    }
  });
  
  const E = EI > 0 ? 'E' : 'I';
  const S = SN > 0 ? 'S' : 'N';
  const T = TF > 0 ? 'T' : 'F';
  const J = JP > 0 ? 'J' : 'P';
  
  return `${E}${S}${T}${J}` as MBTIType;
}

