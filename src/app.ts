/**
 * タレントナビゲーターのメインロジック
 * 人材育成分析システム（四柱推命×MBTI統合）
 */

import { calculateFortune } from './fortune/calculations.js';
import { calculateFourPillars } from './fortune/shichu-suimei.js';
import { MBTI_TYPES, MBTI_QUESTIONS, calculateMBTIFromAnswers, type MBTIType } from './fortune/mbti.js';
import { TALENT_NUMBER_TRAITS, ESSENCE_NUMBER_TRAITS, INQUIRY_NUMBER_TRAITS } from './fortune/prompt-data.js';
import type { CompleteFortuneResult } from './fortune/types.js';

// DOM要素の取得
const form = document.getElementById('fortune-form') as HTMLFormElement;
const yearInput = document.getElementById('year') as HTMLInputElement;
const monthInput = document.getElementById('month') as HTMLInputElement;
const dayInput = document.getElementById('day') as HTMLInputElement;
const hourInput = document.getElementById('hour') as HTMLInputElement;
const genderSelect = document.getElementById('gender') as HTMLSelectElement;
const mbtiModeRadios = document.querySelectorAll('input[name="mbti-mode"]') as NodeListOf<HTMLInputElement>;
const mbtiSelectGroup = document.getElementById('mbti-select-group') as HTMLDivElement;
const mbtiDiagnosisGroup = document.getElementById('mbti-diagnosis-group') as HTMLDivElement;
const mbtiTypeSelect = document.getElementById('mbti-type') as HTMLSelectElement;
const mbtiQuestionsDiv = document.getElementById('mbti-questions') as HTMLDivElement;
const purposeRadios = document.querySelectorAll('input[name="purpose"]') as NodeListOf<HTMLInputElement>;
const errorDiv = document.getElementById('error') as HTMLDivElement;
const loadingDiv = document.getElementById('loading') as HTMLDivElement;
const resultSection = document.getElementById('result-section') as HTMLDivElement;

// MBTI診断の回答を保存
let mbtiAnswers: number[] = [];

// 現在のステップ
let currentStep = 1;
const totalSteps = 3;

// ステップナビゲーション
function goToStep(step: number) {
  // バリデーション
  if (step > currentStep) {
    if (!validateCurrentStep()) {
      return;
    }
  }
  
  // ステップの切り替え
  const currentStepEl = document.querySelector(`.form-step.active`);
  const nextStepEl = document.getElementById(`step-${step}`);
  
  if (currentStepEl && nextStepEl) {
    currentStepEl.classList.remove('active');
    nextStepEl.classList.add('active');
    
    // ステップインジケーターの更新
    updateStepIndicator(step);
    
    currentStep = step;
    
    // スクロールをトップに
    document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ステップインジケーターの更新
function updateStepIndicator(activeStep: number) {
  const stepItems = document.querySelectorAll('.step-item');
  stepItems.forEach((item, index) => {
    const stepNum = index + 1;
    item.classList.remove('active', 'completed');
    
    if (stepNum < activeStep) {
      item.classList.add('completed');
    } else if (stepNum === activeStep) {
      item.classList.add('active');
    }
  });
}

// 現在のステップのバリデーション
function validateCurrentStep(): boolean {
  if (currentStep === 1) {
    // ステップ1: 基本情報
    const year = parseInt(yearInput.value, 10);
    const month = parseInt(monthInput.value, 10);
    const day = parseInt(dayInput.value, 10);
    const gender = genderSelect.value;
    
    let isValid = true;
    
    // 年
    if (!year || year < 1900 || year > 2100) {
      showFieldError('year-error', '1900年から2100年の間で入力してください');
      isValid = false;
    } else {
      clearFieldError('year-error');
    }
    
    // 月
    if (!month || month < 1 || month > 12) {
      showFieldError('month-error', '1月から12月の間で入力してください');
      isValid = false;
    } else {
      clearFieldError('month-error');
    }
    
    // 日
    if (!day || day < 1 || day > 31) {
      showFieldError('day-error', '1日から31日の間で入力してください');
      isValid = false;
    } else {
      clearFieldError('day-error');
    }
    
    // 日付の妥当性チェック
    if (year && month && day) {
      if (!validateDate(year, month, day)) {
        showFieldError('day-error', '正しい日付を入力してください');
        isValid = false;
      }
    }
    
    // 性別
    if (!gender) {
      showFieldError('gender-error', '性別を選択してください');
      isValid = false;
    } else {
      clearFieldError('gender-error');
    }
    
    return isValid;
  } else if (currentStep === 2) {
    // ステップ2: MBTIタイプ
    const mbtiMode = (document.querySelector('input[name="mbti-mode"]:checked') as HTMLInputElement)?.value;
    
    if (mbtiMode === 'known') {
      const mbtiType = mbtiTypeSelect.value;
      if (!mbtiType) {
        showFieldError('mbti-type-error', 'MBTIタイプを選択してください');
        return false;
      } else {
        clearFieldError('mbti-type-error');
      }
    } else {
      // 簡易診断の回答チェック
      for (let i = 0; i < MBTI_QUESTIONS.length; i++) {
        const answer = document.querySelector(`input[name="mbti-q${i}"]:checked`) as HTMLInputElement;
        if (!answer) {
          showError('すべてのMBTI診断質問に回答してください。');
          return false;
        }
      }
    }
    
    return true;
  }
  
  return true;
}

// フィールドエラー表示
function showFieldError(fieldId: string, message: string) {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.style.display = 'block';
  }
}

function clearFieldError(fieldId: string) {
  const errorEl = document.getElementById(fieldId);
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.style.display = 'none';
  }
}

// グローバルスコープにgoToStep関数を追加
(window as any).goToStep = goToStep;

// リアルタイムバリデーション
yearInput?.addEventListener('blur', () => {
  const year = parseInt(yearInput.value, 10);
  if (year && (year < 1900 || year > 2100)) {
    showFieldError('year-error', '1900年から2100年の間で入力してください');
  } else {
    clearFieldError('year-error');
  }
});

monthInput?.addEventListener('blur', () => {
  const month = parseInt(monthInput.value, 10);
  if (month && (month < 1 || month > 12)) {
    showFieldError('month-error', '1月から12月の間で入力してください');
  } else {
    clearFieldError('month-error');
  }
});

dayInput?.addEventListener('blur', () => {
  const day = parseInt(dayInput.value, 10);
  if (day && (day < 1 || day > 31)) {
    showFieldError('day-error', '1日から31日の間で入力してください');
  } else {
    clearFieldError('day-error');
  }
  
  // 日付の妥当性チェック
  const year = parseInt(yearInput.value, 10);
  const month = parseInt(monthInput.value, 10);
  if (year && month && day) {
    if (!validateDate(year, month, day)) {
      showFieldError('day-error', '正しい日付を入力してください');
    }
  }
});

genderSelect?.addEventListener('change', () => {
  if (genderSelect.value) {
    clearFieldError('gender-error');
  }
});

mbtiTypeSelect?.addEventListener('change', () => {
  if (mbtiTypeSelect.value) {
    clearFieldError('mbti-type-error');
  }
});

// MBTIモードの切り替え
mbtiModeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    if (radio.value === 'known') {
      mbtiSelectGroup.style.display = 'block';
      mbtiDiagnosisGroup.style.display = 'none';
      mbtiTypeSelect.required = true;
    } else {
      mbtiSelectGroup.style.display = 'none';
      mbtiDiagnosisGroup.style.display = 'block';
      mbtiTypeSelect.required = false;
      renderMBTIQuestions();
    }
  });
});

// MBTI質問を表示
function renderMBTIQuestions() {
  mbtiQuestionsDiv.innerHTML = '';
  mbtiAnswers = [];
  
  MBTI_QUESTIONS.forEach((question, index) => {
    const questionDiv = document.createElement('div');
    questionDiv.className = 'mbti-question';
    questionDiv.innerHTML = `
      <h4 class="character-4-bold-pro text-primary">質問 ${index + 1}: ${question.question}</h4>
      <div class="mbti-options">
        <label class="character-3-regular-pro text-high cursor-pointer">
          <input type="radio" name="mbti-q${index}" value="0" required>
          ${question.optionA.text}
        </label>
        <label class="character-3-regular-pro text-high cursor-pointer">
          <input type="radio" name="mbti-q${index}" value="1" required>
          ${question.optionB.text}
        </label>
      </div>
    `;
    mbtiQuestionsDiv.appendChild(questionDiv);
  });
}

// フォーム送信処理
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // ステップ3にいることを確認
  if (currentStep !== 3) {
    goToStep(3);
    return;
  }
  
  // すべてのステップのバリデーション
  if (!validateCurrentStep()) {
    // ステップ2のバリデーション
    goToStep(2);
    if (!validateCurrentStep()) {
      goToStep(1);
      return;
    }
    goToStep(3);
    return;
  }
  
  const year = parseInt(yearInput.value, 10);
  const month = parseInt(monthInput.value, 10);
  const day = parseInt(dayInput.value, 10);
  const hourStr = hourInput.value;
  const gender = genderSelect.value;
  const purpose = (document.querySelector('input[name="purpose"]:checked') as HTMLInputElement)?.value || 'personal';
  
  // 最終バリデーション
  if (!validateDate(year, month, day)) {
    goToStep(1);
    showFieldError('day-error', '正しい日付を入力してください');
    return;
  }

  // MBTIタイプの取得
  let mbtiType: MBTIType | null = null;
  const mbtiMode = (document.querySelector('input[name="mbti-mode"]:checked') as HTMLInputElement)?.value;
  
  if (mbtiMode === 'known') {
    mbtiType = mbtiTypeSelect.value as MBTIType || null;
    if (!mbtiType) {
      goToStep(2);
      showFieldError('mbti-type-error', 'MBTIタイプを選択してください');
      return;
    }
  } else {
    // 簡易診断の回答を取得
    mbtiAnswers = [];
    for (let i = 0; i < MBTI_QUESTIONS.length; i++) {
      const answer = document.querySelector(`input[name="mbti-q${i}"]:checked`) as HTMLInputElement;
      if (!answer) {
        goToStep(2);
        showError('すべてのMBTI診断質問に回答してください。');
        return;
      }
      mbtiAnswers.push(parseInt(answer.value, 10));
    }
    mbtiType = calculateMBTIFromAnswers(mbtiAnswers);
  }

  if (!mbtiType) {
    goToStep(2);
    showError('MBTIタイプを取得できませんでした。');
    return;
  }

  // エラーを非表示
  hideError();
  
  // ローディング表示
  showLoading();
  hideResult();

  // 計算処理
  setTimeout(() => {
    try {
      const hour = hourStr ? parseInt(hourStr.split(':')[0], 10) : undefined;
      const result = calculateAllFortune(year, month, day, hour, gender, mbtiType);
      
      if (purpose === 'personal') {
        displayPersonalResult(result);
      } else {
        displayEmployerResult(result);
      }
      
      hideLoading();
      showResult();
    } catch (error) {
      showError('分析の計算中にエラーが発生しました。');
      hideLoading();
      console.error(error);
    }
  }, 1000);
});

/**
 * すべての分析結果を計算
 */
function calculateAllFortune(
  year: number,
  month: number,
  day: number,
  hour: number | undefined,
  gender: string,
  mbtiType: MBTIType
): CompleteFortuneResult {
  const numerology = calculateFortune(year, month, day);
  const fourPillars = calculateFourPillars(year, month, day, hour);
  const mbti = MBTI_TYPES[mbtiType];
  
  return {
    numerology,
    fourPillars,
    mbti,
    gender,
    birthDate: { year, month, day, ...(hour !== undefined && { hour }) }
  };
}

/**
 * 日付のバリデーション
 */
function validateDate(year: number, month: number, day: number): boolean {
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && 
         date.getMonth() === month - 1 && 
         date.getDate() === day;
}

/**
 * エラー表示（改善版：具体的で行動可能なメッセージ）
 */
function showError(message: string) {
  errorDiv.innerHTML = `
    <div style="display: flex; align-items: start; gap: var(--spacing-3);">
      <span class="icon-4-fill-1 material-symbols-outlined" style="color: var(--color-negative-600);">error</span>
      <div>
        <strong class="character-3-bold-pro">エラーが発生しました</strong>
        <p class="character-3-regular-pro" style="margin-top: var(--spacing-1);">${message}</p>
        <p class="character-2-regular-pro text-middle" style="margin-top: var(--spacing-2);">
          💡 ヒント: 入力内容を確認し、必須項目（<span class="text-negative">*</span>）がすべて入力されているか確認してください。
        </p>
      </div>
    </div>
  `;
  errorDiv.classList.add('show');
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
  
  // 5秒後に自動で非表示（オプション）
  setTimeout(() => {
    if (errorDiv.classList.contains('show')) {
      hideError();
    }
  }, 5000);
}

function hideError() {
  errorDiv.classList.remove('show');
}

/**
 * ローディング表示
 */
function showLoading() {
  loadingDiv.classList.add('show');
}

function hideLoading() {
  loadingDiv.classList.remove('show');
}

/**
 * 結果表示
 */
function showResult() {
  resultSection.classList.add('show');
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResult() {
  resultSection.classList.remove('show');
}

/**
 * 本人向け結果を表示
 */
function displayPersonalResult(result: CompleteFortuneResult) {
  const { numerology, fourPillars, mbti, birthDate } = result;
  const talent = TALENT_NUMBER_TRAITS[numerology.talentNumber];
  const essence = ESSENCE_NUMBER_TRAITS[numerology.essenceNumber];
  const inquiry = INQUIRY_NUMBER_TRAITS[numerology.inquiryNumber];
  
  // レーダーチャート用のデータ
  const radarData = calculateRadarData(numerology, mbti);
  
  // 目次（TOC）を生成
  const tocItems = [
    { id: 'career-traits', label: 'キャリア特性', icon: 'person' },
    { id: 'radar-chart', label: '特性レーダーチャート', icon: 'bar_chart' },
    { id: 'four-pillars', label: '四柱推命の詳細', icon: 'psychology' },
    { id: 'personality', label: '具体的な性格特性', icon: 'star' },
    { id: 'career-flow', label: 'キャリアの流れ', icon: 'trending_up' },
    { id: 'career', label: '適職とキャリア', icon: 'work' },
    { id: 'compatibility', label: '人間関係相性表', icon: 'favorite' },
    { id: 'optimization', label: 'キャリア最適化のポイント', icon: 'lightbulb' },
    { id: 'advice', label: '具体的な行動アドバイス', icon: 'tips_and_updates' },
    { id: 'message', label: '総合メッセージ', icon: 'target' }
  ];
  
  const html = `
    <div class="result-header">
      <h2 class="character-6-bold-pro text-primary">あなたのキャリア分析結果</h2>
      <p class="character-3-regular-pro text-middle">${birthDate.year}年${birthDate.month}月${birthDate.day}日生まれ</p>
      
      <!-- 目次（TOC） -->
      <nav class="result-toc">
        <h3 class="character-4-bold-pro text-primary toc-title">
          <span class="icon-4-fill-1 material-symbols-outlined">menu</span>
          目次
        </h3>
        <ul class="toc-list">
          ${tocItems.map(item => `
            <li class="toc-item">
              <a href="#${item.id}" class="toc-link character-3-regular-pro text-high">
                <span class="icon-3-fill-0 material-symbols-outlined">${item.icon}</span>
                <span class="toc-label">${item.label}</span>
              </a>
            </li>
          `).join('')}
        </ul>
      </nav>
    </div>
    
    <div class="result-content">
      <h3 id="career-traits" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">person</span>
        キャリア特性
      </h3>
      <p class="character-3-regular-pro text-high">
        <strong class="character-3-bold-pro">${mbti.name}</strong>（${mbti.type}）として、<br>
        <span class="badge badge-primary character-2-regular-pro">才能数${numerology.talentNumber}</span>
        <span class="badge badge-primary character-2-regular-pro">本質数${numerology.essenceNumber}</span>
        <span class="badge badge-primary character-2-regular-pro">探究数${numerology.inquiryNumber}</span>
        の特性を持つあなたは、${essence?.theme || ''}という人生のテーマを持っています。
      </p>
      
      <h3 id="radar-chart" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">bar_chart</span>
        特性レーダーチャート
      </h3>
      <div class="chart-container">
        <canvas id="radar-chart-canvas"></canvas>
      </div>
      
      <h3 id="four-pillars" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">psychology</span>
        四柱推命の詳細
      </h3>
      <div class="pillar-grid">
        <div class="pillar-card">
          <h4 class="character-4-bold-pro text-primary">${fourPillars.yearPillar.name}</h4>
          <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">${fourPillars.yearPillar.fullName}</strong>（${fourPillars.yearPillar.fullReading}）</p>
          <p class="character-3-regular-pro text-middle">${fourPillars.yearPillar.description}</p>
        </div>
        <div class="pillar-card">
          <h4 class="character-4-bold-pro text-primary">${fourPillars.monthPillar.name}</h4>
          <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">${fourPillars.monthPillar.fullName}</strong>（${fourPillars.monthPillar.fullReading}）</p>
          <p class="character-3-regular-pro text-middle">${fourPillars.monthPillar.description}</p>
        </div>
        <div class="pillar-card">
          <h4 class="character-4-bold-pro text-primary">${fourPillars.dayPillar.name}</h4>
          <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">${fourPillars.dayPillar.fullName}</strong>（${fourPillars.dayPillar.fullReading}）</p>
          <p class="character-3-regular-pro text-middle">${fourPillars.dayPillar.description}</p>
        </div>
        ${fourPillars.hourPillar ? `
        <div class="pillar-card">
          <h4 class="character-4-bold-pro text-primary">${fourPillars.hourPillar.name}</h4>
          <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">${fourPillars.hourPillar.fullName}</strong>（${fourPillars.hourPillar.fullReading}）</p>
          <p class="character-3-regular-pro text-middle">${fourPillars.hourPillar.description}</p>
        </div>
        ` : ''}
      </div>
      
      <h3 id="personality" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">star</span>
        具体的な性格特性
      </h3>
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">あなたの強み：</strong></p>
      <ul class="character-3-regular-pro text-high">
        ${talent?.strengths.map(s => `<li>${s}</li>`).join('') || ''}
        ${mbti.strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>
      
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">注意すべき点：</strong></p>
      <ul class="character-3-regular-pro text-high">
        ${talent?.weaknesses.map(w => `<li>${w}</li>`).join('') || ''}
        ${mbti.weaknesses.map(w => `<li>${w}</li>`).join('')}
      </ul>
      
      <h3 id="career-flow" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">trending_up</span>
        キャリアの流れ
      </h3>
      <div class="timeline">
        <div class="timeline-item">
          <div class="timeline-year character-3-bold-pro text-primary">過去（20代まで）</div>
          <div class="timeline-content character-3-regular-pro">
            ${essence?.challenge || ''}を経験し、${talent?.basic || ''}という特性を培ってきました。
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-year character-3-bold-pro text-primary">現在（30-50代）</div>
          <div class="timeline-content character-3-regular-pro">
            ${essence?.theme || ''}を追求し、${mbti.workStyle}という働き方で成果を上げています。
          </div>
        </div>
        <div class="timeline-item">
          <div class="timeline-year character-3-bold-pro text-primary">未来（60代以降）</div>
          <div class="timeline-content character-3-regular-pro">
            ${inquiry?.theme || ''}というテーマに向かって、${inquiry?.talent || ''}を発揮します。
          </div>
        </div>
      </div>
      
      <h3 id="career" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">work</span>
        適職とキャリア
      </h3>
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">あなたに適した職業：</strong></p>
      <ul class="character-3-regular-pro text-high">
        ${essence?.work.map(w => `<li>${w}</li>`).join('') || ''}
        <li>${mbti.teamRole}</li>
      </ul>
      
      <h3 id="compatibility" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">favorite</span>
        人間関係相性表
      </h3>
      ${generateCompatibilityTable(mbti.type)}
      
      <h3 id="optimization" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">lightbulb</span>
        キャリア最適化のポイント
      </h3>
      <ul class="character-3-regular-pro text-high">
        <li><strong class="character-3-bold-pro">推奨カラー：</strong>${getLuckyColor(numerology.essenceNumber)}</li>
        <li><strong class="character-3-bold-pro">重要ナンバー：</strong>${numerology.talentNumber}, ${numerology.essenceNumber}, ${numerology.inquiryNumber}</li>
        <li><strong class="character-3-bold-pro">推奨方向：</strong>${getLuckyDirection(fourPillars.yearPillar.junishi)}</li>
        <li><strong class="character-3-bold-pro">最適な活動時間：</strong>${mbti.type.startsWith('E') ? '午前中' : '午後から夜'}</li>
      </ul>
      
      <h3 id="advice" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">tips_and_updates</span>
        具体的な行動アドバイス
      </h3>
      <div class="action-plan">
        <h4 class="character-4-bold-pro text-primary">仕事の場面で</h4>
        <div class="action-item character-3-regular-pro text-high">
          ${mbti.workStyle}。${mbti.communication}というコミュニケーションスタイルを意識しましょう。
        </div>
        
        <h4 class="character-4-bold-pro text-primary">人間関係で</h4>
        <div class="action-item character-3-regular-pro text-high">
          ${mbti.communication}。${essence?.relationship || ''}という特徴を活かして、調和のとれた関係を築きましょう。
        </div>
        
        <h4 class="character-4-bold-pro text-primary">ストレス管理で</h4>
        <div class="action-item character-3-regular-pro text-high">
          ${mbti.stressFactors.join('、')}に注意し、${talent?.stress || ''}という方法でリフレッシュしましょう。
        </div>
      </div>
      
      <h3 id="message" class="character-6-bold-pro text-primary" style="scroll-margin-top: 80px;">
        <span class="icon-4-fill-1 material-symbols-outlined">target</span>
        総合メッセージ
      </h3>
      <p class="character-3-regular-pro text-high">
        あなたの魂の青写真には、${essence?.theme || ''}というテーマが刻まれています。<br>
        才能数${numerology.talentNumber}の${talent?.name || ''}の力と、<br>
        本質数${numerology.essenceNumber}の${essence?.name || ''}の資質、<br>
        MBTIタイプ${mbti.type}の${mbti.name}としての特性が、<br>
        あなたの人生の波動を形作っています。
      </p>
      <p class="character-3-regular-pro text-high">
        キャリアの道を切り開くのはあなた自身です。<br>
        あなたの才能と本質を信じて、一歩ずつ前進してください。
      </p>
    </div>
  `;
  
  resultSection.innerHTML = html;
  
  // レーダーチャートを描画
  setTimeout(() => {
    renderRadarChart(radarData);
  }, 100);
}

/**
 * 雇用主向け結果を表示
 */
function displayEmployerResult(result: CompleteFortuneResult) {
  const { numerology, fourPillars, mbti, birthDate } = result;
  const essence = ESSENCE_NUMBER_TRAITS[numerology.essenceNumber];
  
  const html = `
    <div class="result-header">
      <h2 class="character-6-bold-pro text-primary">人材分析レポート</h2>
      <p class="character-3-regular-pro text-middle">${birthDate.year}年${birthDate.month}月${birthDate.day}日生まれ / ${mbti.type} - ${mbti.name}</p>
    </div>
    
    <div class="result-content">
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">trending_up</span>
        成長予測曲線
      </h3>
      <div class="chart-container">
        <canvas id="growth-chart"></canvas>
      </div>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">target</span>
        この人とはこう接すればいい
      </h3>
      <div class="action-plan">
        <h4 class="character-4-bold-pro text-primary">コミュニケーション指針</h4>
        <div class="action-item character-3-regular-pro text-high">
          <strong class="character-3-bold-pro">話し方：</strong>${mbti.communication}<br>
          <strong class="character-3-bold-pro">指示の出し方：</strong>${mbti.managementStyle}<br>
          <strong class="character-3-bold-pro">フィードバック：</strong>${mbti.type.includes('F') ? '感情を考慮した温かい表現で' : '事実に基づいた論理的な説明で'}伝える
        </div>
        
        <h4 class="character-4-bold-pro text-primary">モチベーション管理</h4>
        <div class="action-item character-3-regular-pro text-high">
          <strong class="character-3-bold-pro">動機付け要因：</strong>${mbti.motivationFactors.join('、')}<br>
          <strong class="character-3-bold-pro">アプローチ方法：</strong>${mbti.motivationFactors.map(f => `・${f}を提供する`).join('<br>')}
        </div>
      </div>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">groups</span>
        チーム内での最適な役割
      </h3>
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">推奨役割：</strong>${mbti.teamRole}</p>
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">働き方：</strong>${mbti.workStyle}</p>
      <p class="character-3-regular-pro text-high"><strong class="character-3-bold-pro">配置の提案：</strong></p>
      <ul class="character-3-regular-pro text-high">
        ${getTeamPlacement(mbti.type).map(p => `<li>${p}</li>`).join('')}
      </ul>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">warning</span>
        リスク管理マトリクス
      </h3>
      <div class="risk-matrix">
        <div class="risk-cell ${getRiskLevel(mbti.stressFactors.length, 'low')}">
          <strong class="character-3-bold-pro">離職リスク</strong><br>
          <span class="character-3-regular-pro">${getRiskLevel(mbti.stressFactors.length, 'low') === 'risk-low' ? '低' : getRiskLevel(mbti.stressFactors.length, 'low') === 'risk-medium' ? '中' : '高'}</span>
        </div>
        <div class="risk-cell ${getRiskLevel(mbti.weaknesses.length, 'medium')}">
          <strong class="character-3-bold-pro">パフォーマンスリスク</strong><br>
          <span class="character-3-regular-pro">${getRiskLevel(mbti.weaknesses.length, 'medium') === 'risk-low' ? '低' : getRiskLevel(mbti.weaknesses.length, 'medium') === 'risk-medium' ? '中' : '高'}</span>
        </div>
        <div class="risk-cell ${getRiskLevel(numerology.essenceNumber === 8 ? 1 : 0, 'low')}">
          <strong class="character-3-bold-pro">モチベーションリスク</strong><br>
          <span class="character-3-regular-pro">${mbti.motivationFactors.length > 3 ? '低' : '中'}</span>
        </div>
      </div>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">notifications_active</span>
        ストレスサインの早期発見
      </h3>
      <div class="action-plan">
        <h4 class="character-4-bold-pro text-primary">注意すべきサイン</h4>
        <ul class="character-3-regular-pro text-high">
          ${mbti.stressFactors.map(f => `<li>${f}が続く場合、ストレスが蓄積している可能性</li>`).join('')}
        </ul>
        
        <h4 class="character-4-bold-pro text-primary">対処法</h4>
        <ul class="character-3-regular-pro text-high">
          <li>${mbti.communication}というコミュニケーションスタイルで接する</li>
          <li>${mbti.motivationFactors[0]}を提供する</li>
          <li>定期的な1on1で状況を確認する</li>
        </ul>
      </div>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">assignment</span>
        アクションプラン
      </h3>
      <div class="action-plan">
        <h4 class="character-4-bold-pro text-primary">短期（1-3ヶ月）</h4>
        <div class="action-item character-3-regular-pro text-high">
          <strong class="character-3-bold-pro">目標：</strong>${mbti.teamRole}としての役割を明確化<br>
          <strong class="character-3-bold-pro">行動：</strong>${mbti.workStyle}という環境を整備
        </div>
        
        <h4 class="character-4-bold-pro text-primary">中期（3-12ヶ月）</h4>
        <div class="action-item character-3-regular-pro text-high">
          <strong class="character-3-bold-pro">目標：</strong>${mbti.strengths[0]}と${mbti.strengths[1]}を活かした成果創出<br>
          <strong class="character-3-bold-pro">行動：</strong>${mbti.motivationFactors.join('、')}を提供
        </div>
        
        <h4 class="character-4-bold-pro text-primary">長期（1-3年）</h4>
        <div class="action-item character-3-regular-pro text-high">
          <strong class="character-3-bold-pro">目標：</strong>${essence?.work[0] || ''}としてのキャリア構築<br>
          <strong class="character-3-bold-pro">行動：</strong>${mbti.teamRole}としての経験を積み、リーダーシップを育成
        </div>
      </div>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">school</span>
        トレーニングマトリクス
      </h3>
      <table class="compatibility-table">
        <thead>
          <tr>
            <th class="character-3-bold-pro">スキル領域</th>
            <th class="character-3-bold-pro">現在の強み</th>
            <th class="character-3-bold-pro">開発が必要</th>
            <th class="character-3-bold-pro">推奨トレーニング</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td class="character-3-regular-pro text-high">コミュニケーション</td>
            <td class="character-3-regular-pro text-high">${mbti.communication}</td>
            <td class="character-3-regular-pro text-high">${mbti.type.includes('I') ? '積極的な発言' : mbti.type.includes('E') ? '傾聴スキル' : 'バランス'}</td>
            <td class="character-3-regular-pro text-high">${mbti.type.includes('I') ? 'プレゼンテーション研修' : '傾聴スキル研修'}</td>
          </tr>
          <tr>
            <td class="character-3-regular-pro text-high">問題解決</td>
            <td class="character-3-regular-pro text-high">${mbti.strengths[0]}</td>
            <td class="character-3-regular-pro text-high">${mbti.weaknesses[0]}</td>
            <td class="character-3-regular-pro text-high">${mbti.type.includes('T') ? '論理的思考研修' : '共感力向上研修'}</td>
          </tr>
          <tr>
            <td class="character-3-regular-pro text-high">チームワーク</td>
            <td class="character-3-regular-pro text-high">${mbti.teamRole}</td>
            <td class="character-3-regular-pro text-high">${mbti.type.includes('I') ? '協調性' : '独立性'}</td>
            <td class="character-3-regular-pro text-high">チームビルディング研修</td>
          </tr>
        </tbody>
      </table>
      
      <h3 class="character-6-bold-pro text-primary">
        <span class="icon-4-fill-1 material-symbols-outlined">assessment</span>
        評価方法の提案
      </h3>
      <div class="action-plan">
        <h4 class="character-4-bold-pro text-primary">評価基準</h4>
        <ul class="character-3-regular-pro text-high">
          <li><strong class="character-3-bold-pro">成果指標：</strong>${mbti.strengths[0]}と${mbti.strengths[1]}を活かした成果を評価</li>
          <li><strong class="character-3-bold-pro">プロセス指標：</strong>${mbti.workStyle}という働き方ができているか</li>
          <li><strong class="character-3-bold-pro">成長指標：</strong>${mbti.weaknesses[0]}の改善度合い</li>
        </ul>
        
        <h4 class="character-4-bold-pro text-primary">フィードバック方法</h4>
        <ul class="character-3-regular-pro text-high">
          <li>${mbti.managementStyle}というスタイルでフィードバック</li>
          <li>${mbti.type.includes('F') ? '感情を考慮した' : '論理的な'}説明を心がける</li>
          <li>定期的な1on1で${mbti.motivationFactors[0]}を確認</li>
        </ul>
      </div>
    </div>
  `;
  
  resultSection.innerHTML = html;
  
  // 成長予測チャートを描画
  setTimeout(() => {
    renderGrowthChart(numerology, mbti);
  }, 100);
}

/**
 * レーダーチャート用データを計算
 */
function calculateRadarData(numerology: any, mbti: any) {
  return {
    labels: ['リーダーシップ', '創造性', '協調性', '分析力', '実行力', 'コミュニケーション'],
    datasets: [{
      label: 'あなたの特性',
      data: [
        numerology.essenceNumber === 1 || numerology.essenceNumber === 8 ? 8 : 5,
        numerology.talentNumber === 3 || numerology.talentNumber === 9 ? 9 : 5,
        numerology.talentNumber === 2 || numerology.talentNumber === 6 ? 8 : 5,
        numerology.essenceNumber === 7 ? 9 : 5,
        numerology.essenceNumber === 4 || numerology.essenceNumber === 8 ? 8 : 5,
        mbti.type.includes('E') ? 8 : 5
      ],
      backgroundColor: 'rgba(102, 126, 234, 0.2)',
      borderColor: 'rgba(102, 126, 234, 1)',
      borderWidth: 2
    }]
  };
}

/**
 * レーダーチャートを描画
 */
function renderRadarChart(data: ReturnType<typeof calculateRadarData>) {
  const canvas = document.getElementById('radar-chart-canvas') as HTMLCanvasElement;
  if (!canvas) {
    console.error('Radar chart canvas not found');
    return;
  }

  new (window as any).Chart(canvas, {
    type: 'radar',
    data: data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        r: {
          beginAtZero: true,
          max: 10
        }
      }
    }
  });
}

/**
 * 成長予測チャートを描画
 */
function renderGrowthChart(numerology: any, mbti: any) {
  const canvas = document.getElementById('growth-chart') as HTMLCanvasElement;
  if (!canvas) return;
  
  new (window as any).Chart(canvas, {
    type: 'line',
    data: {
      labels: ['入社時', '3ヶ月', '6ヶ月', '1年', '2年', '3年'],
      datasets: [{
        label: '成長予測',
        data: [50, 60, 70, 80, 85, 90],
        borderColor: 'rgba(102, 126, 234, 1)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.4
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 100
        }
      }
    }
  });
}

/**
 * 相性表を生成
 */
function generateCompatibilityTable(mbtiType: string) {
  const compatibleTypes = getCompatibleMBTITypes(mbtiType);
  
  return `
    <table class="compatibility-table">
      <thead>
        <tr>
          <th class="character-3-bold-pro">MBTIタイプ</th>
          <th class="character-3-bold-pro">相性</th>
          <th class="character-3-bold-pro">コミュニケーションのコツ</th>
        </tr>
      </thead>
      <tbody>
        ${compatibleTypes.map(ct => `
          <tr>
            <td class="character-3-regular-pro text-high">${ct.type} - ${ct.name}</td>
            <td class="character-3-regular-pro text-high">${ct.compatibility}</td>
            <td class="character-3-regular-pro text-high">${ct.tip}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/**
 * 相性の良いMBTIタイプを取得
 */
function getCompatibleMBTITypes(mbtiType: string) {
  const allTypes = Object.values(MBTI_TYPES);
  return allTypes.slice(0, 5).map(type => ({
    type: type.type,
    name: type.name,
    compatibility: type.type === mbtiType ? '最高' : 
                   type.type[0] === mbtiType[0] ? '良好' : 
                   type.type[2] === mbtiType[2] ? '良好' : '普通',
    tip: type.communication
  }));
}

/**
 * ラッキーカラーを取得
 */
function getLuckyColor(essenceNumber: number) {
  const colors: Record<number, string> = {
    1: '赤', 2: 'オレンジ', 3: '黄', 4: '緑',
    5: '青', 6: '紫', 7: '白', 8: '黒', 9: '金'
  };
  return colors[essenceNumber] || '無彩色';
}

/**
 * ラッキー方向を取得
 */
function getLuckyDirection(junishi: string) {
  const directions: Record<string, string> = {
    '子': '北', '丑': '北東', '寅': '東北東', '卯': '東',
    '辰': '東南東', '巳': '南東', '午': '南', '未': '南西',
    '申': '西南西', '酉': '西', '戌': '西北西', '亥': '北西'
  };
  return directions[junishi] || '中央';
}

/**
 * リスクレベルを取得
 */
function getRiskLevel(factor: number, defaultLevel: string) {
  if (factor <= 2) return 'risk-low';
  if (factor <= 4) return 'risk-medium';
  return 'risk-high';
}

/**
 * チーム配置を取得
 */
function getTeamPlacement(mbtiType: string): string[] {
  if (mbtiType.includes('E') && mbtiType.includes('J')) {
    return ['リーダー役', 'プロジェクトマネージャー', 'クライアント対応'];
  } else if (mbtiType.includes('I') && mbtiType.includes('T')) {
    return ['技術リーダー', '分析担当', '品質管理'];
  } else if (mbtiType.includes('E') && mbtiType.includes('F')) {
    return ['チームマネージャー', '人事担当', '顧客サポート'];
  } else {
    return ['専門家', '研究開発', 'クリエイティブ'];
  }
}
