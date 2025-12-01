/**
 * 人材育成分析システムのメインロジック
 * 四柱推命×MBTI統合
 */

import { calculateFortune } from './fortune/calculations.js';
import { calculateFourPillars } from './fortune/shichu-suimei.js';
import { MBTI_TYPES, MBTI_QUESTIONS, calculateMBTIFromAnswers, type MBTIType } from './fortune/mbti.js';
import { TALENT_NUMBER_TRAITS, ESSENCE_NUMBER_TRAITS, INQUIRY_NUMBER_TRAITS } from './fortune/prompt-data.js';
import { generateYUICode, parseYUICode, analyzeCompatibility } from './fortune/compatibility.js';
import type { CompleteFortuneResult, FortuneResult, FourPillarsResult } from './fortune/types.js';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { analyzeRisk } from './fortune/risk-logic.js';
import { calculateTeamRoles } from './fortune/role-logic.js';
import { analyzeSynergy } from './fortune/synergy-logic.js';
import { calculateRadarData } from './fortune/radar-logic.js';

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
const adminModeBtn = document.getElementById('admin-mode-btn') as HTMLButtonElement;
const bulkAnalysisSection = document.getElementById('bulk-analysis-section') as HTMLDivElement;
const dropZone = document.getElementById('drop-zone') as HTMLDivElement;
const fileInput = document.getElementById('file-input') as HTMLInputElement;
const bulkResult = document.getElementById('bulk-result') as HTMLDivElement;
const downloadPdfBtn = document.getElementById('download-pdf-btn') as HTMLButtonElement;

// Admin Mode Toggle
let isAdminMode = false;
adminModeBtn.addEventListener('click', () => {
  isAdminMode = !isAdminMode;
  if (isAdminMode) {
    form.style.display = 'none';
    bulkAnalysisSection.style.display = 'block';
    adminModeBtn.innerHTML = '<span class="material-symbols-outlined">person</span> 個人分析モードに戻る';
    adminModeBtn.classList.replace('btn-secondary', 'btn-primary');
  } else {
    form.style.display = 'block';
    bulkAnalysisSection.style.display = 'none';
    adminModeBtn.innerHTML = '<span class="material-symbols-outlined">admin_panel_settings</span> 管理者モード（一括分析）';
    adminModeBtn.classList.replace('btn-primary', 'btn-secondary');
  }
});

// File Drop Handling
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--color-primary)';
  dropZone.style.backgroundColor = '#e3f2fd';
});
dropZone.addEventListener('dragleave', () => {
  dropZone.style.borderColor = 'var(--color-border)';
  dropZone.style.backgroundColor = 'transparent';
});
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.style.borderColor = 'var(--color-border)';
  dropZone.style.backgroundColor = 'transparent';
  if (e.dataTransfer?.files.length) {
    handleFileUpload(e.dataTransfer.files[0]);
  }
});
fileInput.addEventListener('change', (e) => {
  if (fileInput.files?.length) {
    handleFileUpload(fileInput.files[0]);
  }
});

async function handleFileUpload(file: File) {
  const reader = new FileReader();
  reader.onload = (e) => {
    const data = new Uint8Array(e.target?.result as ArrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet) as any[];

    processBulkData(jsonData, true); // Append mode
  };
  reader.readAsArrayBuffer(file);
}

interface BulkMember {
  id: string; // Unique ID for removal
  name: string;
  birthDate: { year: number; month: number; day: number };
  gender: string;
  mbti: MBTIType | null;
  fortune: FortuneResult;
  fourPillars: FourPillarsResult;
}

let bulkMembers: BulkMember[] = [];

// Tab Switching
(window as any).switchTab = (tabId: string) => {
  document.querySelectorAll('.tab-content').forEach(el => (el as HTMLElement).style.display = 'none');
  document.getElementById(`tab-${tabId}`)!.style.display = 'block';

  document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(el => {
    if (el.getAttribute('onclick')?.includes(tabId)) {
      el.classList.add('active');
      (el as HTMLElement).style.borderBottom = '2px solid var(--color-primary)';
      (el as HTMLElement).style.fontWeight = 'bold';
      (el as HTMLElement).style.color = 'var(--color-text-primary)';
    } else {
      (el as HTMLElement).style.borderBottom = 'none';
      (el as HTMLElement).style.fontWeight = 'normal';
      (el as HTMLElement).style.color = 'var(--color-text-muted)';
    }
  });
};

// Add Member from Manual Form
(window as any).addMemberFromForm = () => {
  const nameInput = document.getElementById('manual-name') as HTMLInputElement;
  const yearInput = document.getElementById('manual-year') as HTMLInputElement;
  const monthInput = document.getElementById('manual-month') as HTMLInputElement;
  const dayInput = document.getElementById('manual-day') as HTMLInputElement;
  const genderSelect = document.getElementById('manual-gender') as HTMLSelectElement;
  const mbtiSelect = document.getElementById('manual-mbti') as HTMLSelectElement;

  const name = nameInput.value.trim();
  const year = parseInt(yearInput.value);
  const month = parseInt(monthInput.value);
  const day = parseInt(dayInput.value);
  const gender = genderSelect.value;
  const mbti = mbtiSelect.value as MBTIType || null;

  if (!name || !year || !month || !day) {
    alert('氏名と生年月日は必須です');
    return;
  }

  addMember({
    name,
    birthDate: { year, month, day },
    gender,
    mbti
  });

  // Clear inputs
  nameInput.value = '';
  yearInput.value = '';
  monthInput.value = '';
  dayInput.value = '';
  mbtiSelect.value = '';
};

// Add Member from YUI Code
(window as any).addMemberFromYuiCode = () => {
  const nameInput = document.getElementById('yui-name') as HTMLInputElement;
  const codeInput = document.getElementById('yui-code-input') as HTMLInputElement;

  const name = nameInput.value.trim();
  const code = codeInput.value.trim();

  if (!name || !code) {
    alert('氏名とYUIコードを入力してください');
    return;
  }

  const data = parseYUICode(code);
  if (!data) {
    alert('無効なYUIコードです');
    return;
  }

  addMember({
    name,
    birthDate: data.birthDate,
    gender: data.gender,
    mbti: data.mbti
  });

  nameInput.value = '';
  codeInput.value = '';
};

function addMember(data: { name: string, birthDate: { year: number, month: number, day: number }, gender: string, mbti: MBTIType | null }) {
  const fortune = calculateFortune(data.birthDate.year, data.birthDate.month, data.birthDate.day);
  const fourPillars = calculateFourPillars(data.birthDate.year, data.birthDate.month, data.birthDate.day);

  bulkMembers.push({
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    ...data,
    fortune,
    fourPillars
  });

  renderMemberList();
  renderBulkResult();
}

(window as any).removeMember = (id: string) => {
  bulkMembers = bulkMembers.filter(m => m.id !== id);
  renderMemberList();
  renderBulkResult();
};

(window as any).clearMembers = () => {
  if (confirm('すべてのメンバーを削除しますか？')) {
    bulkMembers = [];
    renderMemberList();
    renderBulkResult();
  }
};

function renderMemberList() {
  const tbody = document.getElementById('member-list-body');
  const countSpan = document.getElementById('member-count');
  if (!tbody || !countSpan) return;

  countSpan.textContent = bulkMembers.length.toString();

  if (bulkMembers.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 20px; color: var(--color-text-muted);">メンバーがいません</td></tr>';
    document.getElementById('bulk-result')!.style.display = 'none';
    return;
  }

  tbody.innerHTML = bulkMembers.map(m => `
    <tr style="border-bottom: 1px solid var(--color-border);">
      <td style="padding: 10px;">${m.name}</td>
      <td style="padding: 10px;">${m.birthDate.year}/${m.birthDate.month}/${m.birthDate.day}</td>
      <td style="padding: 10px;">${m.gender === 'male' ? '男性' : '女性'}</td>
      <td style="padding: 10px;">${m.mbti || '-'}</td>
      <td style="padding: 10px; text-align: center;">
        <button onclick="removeMember('${m.id}')" style="background: none; border: none; color: var(--color-error); cursor: pointer;">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

(window as any).downloadMembersExcel = () => {
  if (bulkMembers.length === 0) {
    alert('データがありません');
    return;
  }

  const data = bulkMembers.map(m => ({
    '氏名': m.name,
    '生年': m.birthDate.year,
    '生月': m.birthDate.month,
    '生日': m.birthDate.day,
    '性別': m.gender === 'male' ? '男性' : '女性',
    'MBTI': m.mbti || ''
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Members");
  XLSX.writeFile(wb, "yui_members.xlsx");
};

function processBulkData(data: any[], append: boolean = false) {
  if (!append) bulkMembers = [];

  let addedCount = 0;
  data.forEach(row => {
    // カラム名の揺らぎを吸収（日本語・英語対応）
    const name = row['氏名'] || row['Name'] || 'Unknown';
    const year = row['生年'] || row['Year'];
    const month = row['生月'] || row['Month'];
    const day = row['生日'] || row['Day'];
    const genderStr = row['性別'] || row['Gender'];
    const mbtiStr = row['MBTI'] || row['Type'];

    if (year && month && day && genderStr) {
      const gender = (genderStr === '男性' || genderStr === 'Male' || genderStr === 'M') ? 'male' : 'female';
      const birthDate = { year: parseInt(year), month: parseInt(month), day: parseInt(day) };

      // 四柱推命計算
      const fortune = calculateFortune(birthDate.year, birthDate.month, birthDate.day);
      const fourPillars = calculateFourPillars(birthDate.year, birthDate.month, birthDate.day);

      // MBTI (指定がなければ仮で計算結果を入れるか、nullにする)
      let mbti: MBTIType | null = null;
      if (mbtiStr && MBTI_TYPES[mbtiStr as MBTIType]) {
        mbti = mbtiStr as MBTIType;
      }

      bulkMembers.push({
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        name,
        birthDate,
        gender,
        mbti,
        fortune,
        fourPillars
      });
      addedCount++;
    }
  });

  if (addedCount === 0 && !append) {
    alert('有効なデータが見つかりませんでした。Excelの列名を確認してください（氏名, 生年, 生月, 生日, 性別）。');
    return;
  }

  renderMemberList();
  renderBulkResult();
}

/**
 * 一括分析結果の表示
 */
function renderBulkResult() {
  bulkAnalysisSection.style.display = 'block';
  bulkResult.style.display = 'block';

  // 1. チーム統計の計算
  const roleCounts: Record<string, number> = {
    'Leader': 0,
    'Innovator': 0,
    'Executor': 0,
    'Coordinator': 0,
    'Strategist': 0
  };

  bulkMembers.forEach(member => {
    // 役割判定
    const roles = calculateTeamRoles(member.mbti, member.fourPillars);
    roleCounts[roles.primary]++;
  });

  // 2. チームマップ（円グラフ）の描画
  const ctx = document.getElementById('team-map-chart') as HTMLCanvasElement;
  if (ctx) {
    // 既存のチャートがあれば破棄
    const existingChart = (window as any).Chart.getChart(ctx);
    if (existingChart) existingChart.destroy();

    new (window as any).Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Leader (統率)', 'Innovator (革新)', 'Executor (実行)', 'Coordinator (調整)', 'Strategist (戦略)'],
        datasets: [{
          data: [
            roleCounts['Leader'],
            roleCounts['Innovator'],
            roleCounts['Executor'],
            roleCounts['Coordinator'],
            roleCounts['Strategist']
          ],
          backgroundColor: [
            'rgba(244, 67, 54, 0.7)',  // Red (Leader)
            'rgba(255, 193, 7, 0.7)',  // Amber (Innovator)
            'rgba(76, 175, 80, 0.7)',  // Green (Executor)
            'rgba(33, 150, 243, 0.7)', // Blue (Coordinator)
            'rgba(156, 39, 176, 0.7)'  // Purple (Strategist)
          ],
          borderColor: [
            'rgba(244, 67, 54, 1)',
            'rgba(255, 193, 7, 1)',
            'rgba(76, 175, 80, 1)',
            'rgba(33, 150, 243, 1)',
            'rgba(156, 39, 176, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
          },
          title: {
            display: true,
            text: 'チームの役割バランス (MBTI × 四柱推命)'
          }
        }
      }
    });
  }

  // 3. チームサマリーの生成
  const total = bulkMembers.length;
  const maxRole = Object.entries(roleCounts).reduce((a, b) => a[1] > b[1] ? a : b)[0];
  let summaryText = `分析対象: ${total}名。<br>`;

  switch (maxRole) {
    case 'Leader':
      summaryText += '<strong>リーダーシップ</strong>を発揮するメンバーが多く、目標達成に向けた推進力が高いチームです。';
      break;
    case 'Innovator':
      summaryText += '<strong>創造性とアイデア</strong>に富んだメンバーが多く、新規事業や改革が得意なチームです。';
      break;
    case 'Executor':
      summaryText += '<strong>実務能力と責任感</strong>が強いメンバーが多く、着実な成果を上げるのが得意なチームです。';
      break;
    case 'Coordinator':
      summaryText += '<strong>協調性とサポート力</strong>が高いメンバーが多く、円滑なコミュニケーションと安定した運営が得意なチームです。';
      break;
    case 'Strategist':
      summaryText += '<strong>長期的視点と分析力</strong>を持つメンバーが多く、複雑な課題解決や計画立案が得意なチームです。';
      break;
  }

  const summaryEl = document.getElementById('team-summary-text');
  if (summaryEl) summaryEl.innerHTML = summaryText;

  // 4. リスクヒートマップの生成
  const heatmapEl = document.getElementById('risk-heatmap');
  if (heatmapEl) {
    heatmapEl.innerHTML = '';
    heatmapEl.style.display = 'grid';
    heatmapEl.style.gridTemplateColumns = 'repeat(auto-fill, minmax(250px, 1fr))';
    heatmapEl.style.gap = '15px';

    bulkMembers.forEach(member => {
      // リスク分析実行
      const risk = analyzeRisk(member.mbti, member.fourPillars);

      let bgColor = '#e8f5e9'; // Green (Low)
      let borderColor = '#2e7d32';
      let textColor = '#1b5e20';

      if (risk.level === 4) {
        bgColor = '#ffebee'; // Red (Critical)
        borderColor = '#c62828';
        textColor = '#b71c1c';
      } else if (risk.level === 3) {
        bgColor = '#fff3e0'; // Orange (High)
        borderColor = '#ef6c00';
        textColor = '#e65100';
      } else if (risk.level === 2) {
        bgColor = '#fffde7'; // Yellow (Medium)
        borderColor = '#fbc02d';
        textColor = '#f57f17';
      }

      const item = document.createElement('div');
      item.style.backgroundColor = bgColor;
      item.style.border = `1px solid ${borderColor}`;
      item.style.borderLeft = `5px solid ${borderColor}`;
      item.style.padding = '12px';
      item.style.borderRadius = '4px';
      item.style.fontSize = '0.9rem';
      item.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)';

      item.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <strong style="font-size: 1rem;">${member.name}</strong>
          <span style="background: rgba(255,255,255,0.5); padding: 2px 6px; borderRadius: 4px; font-size: 0.8rem;">${member.mbti || '-'}</span>
        </div>
        <div style="color: ${textColor}; font-weight: bold; margin-bottom: 4px;">
          ${risk.type !== 'NONE' ? `<span class="material-symbols-outlined" style="vertical-align: bottom; font-size: 1.1rem;">warning</span> ` : ''}
          ${risk.title}
        </div>
        <div style="font-size: 0.85rem; color: #555; margin-bottom: 8px; line-height: 1.4;">
          ${risk.reason}
        </div>
        ${risk.actionItem ? `
        <div style="background: rgba(255,255,255,0.6); padding: 6px; border-radius: 4px; font-size: 0.8rem; color: #333;">
          <span style="font-weight: bold;">💡 Action:</span> ${risk.actionItem}
        </div>
        ` : ''}
      `;
      heatmapEl.appendChild(item);
    });
  }

  // 5. シナジー分析用ドロップダウンの更新
  updateSynergyDropdowns();
}

// シナジー分析用ドロップダウンの更新
function updateSynergyDropdowns() {
  const selectA = document.getElementById('synergy-member-a') as HTMLSelectElement;
  const selectB = document.getElementById('synergy-member-b') as HTMLSelectElement;

  if (!selectA || !selectB) return;

  const options = bulkMembers.map(m => `<option value="${m.id}">${m.name} (${m.mbti || '-'})</option>`).join('');
  const defaultOption = '<option value="">選択してください</option>';

  // 現在の選択値を保持
  const currentA = selectA.value;
  const currentB = selectB.value;

  selectA.innerHTML = defaultOption + options;
  selectB.innerHTML = defaultOption + options;

  if (currentA) selectA.value = currentA;
  if (currentB) selectB.value = currentB;
}

// シナジー分析実行ボタン
document.getElementById('analyze-synergy-btn')?.addEventListener('click', () => {
  const selectA = document.getElementById('synergy-member-a') as HTMLSelectElement;
  const selectB = document.getElementById('synergy-member-b') as HTMLSelectElement;
  const resultDiv = document.getElementById('synergy-result') as HTMLDivElement;

  const idA = selectA.value;
  const idB = selectB.value;

  if (!idA || !idB) {
    alert('2名のメンバーを選択してください');
    return;
  }

  if (idA === idB) {
    alert('異なるメンバーを選択してください');
    return;
  }

  const memberA = bulkMembers.find(m => m.id === idA);
  const memberB = bulkMembers.find(m => m.id === idB);

  if (!memberA || !memberB) return;

  const synergy = analyzeSynergy(memberA, memberB);

  resultDiv.style.display = 'block';
  resultDiv.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid var(--color-border); padding-bottom: 10px;">
      <h4 style="margin: 0; font-size: 1.2rem;">相性スコア: <span style="font-size: 1.5rem; color: var(--color-primary);">${synergy.score}</span> / 100</h4>
      <span style="background: ${synergy.score >= 80 ? '#e8f5e9' : synergy.score >= 60 ? '#fff3e0' : '#ffebee'}; color: ${synergy.score >= 80 ? '#2e7d32' : synergy.score >= 60 ? '#ef6c00' : '#c62828'}; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 0.9rem;">
        ${synergy.score >= 80 ? '最高' : synergy.score >= 60 ? '良好' : '要注意'}
      </span>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
      <div>
        <h5 style="color: var(--color-accent-tertiary); margin-bottom: 10px;">✨ ポジティブなシナジー</h5>
        <ul style="padding-left: 20px; margin: 0; font-size: 0.95rem; color: var(--color-text-primary);">
          ${synergy.synergyPoints.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('')}
        </ul>
      </div>
      
      <div>
        <h5 style="color: #c62828; margin-bottom: 10px;">⚠️ 予測される衝突リスク</h5>
        ${synergy.riskScenarios.length > 0 ?
      synergy.riskScenarios.map(r => `
            <div style="background: #fff; padding: 10px; border-radius: 4px; border-left: 4px solid ${r.severity === 'HIGH' ? '#c62828' : r.severity === 'MEDIUM' ? '#ef6c00' : '#fbc02d'}; margin-bottom: 10px; font-size: 0.9rem;">
              <strong style="display: block; margin-bottom: 4px;">${r.title}</strong>
              ${r.scenario}
            </div>
          `).join('')
      : '<p style="font-size: 0.9rem; color: var(--color-text-muted);">顕著な衝突リスクは見当たりません。</p>'}
      </div>
    </div>

    <div style="margin-top: 20px; background: #e3f2fd; padding: 15px; border-radius: 6px;">
      <h5 style="color: #1565c0; margin-bottom: 8px;">💡 管理者へのアドバイス</h5>
      <p style="margin-bottom: 8px; font-size: 0.95rem;"><strong>配置:</strong> ${synergy.managementAdvice.pairing}</p>
      <p style="margin: 0; font-size: 0.95rem;"><strong>役割:</strong> ${synergy.managementAdvice.roles}</p>
    </div>
  `;
});


// MBTI診断の回答を保存
let mbtiAnswers: number[] = [];

// 現在のステップ
let currentStep = 1;
const totalSteps = 3;

// ステップナビゲーション
function goToStep(step: number) {
  console.log(`goToStep called: ${step}, current: ${currentStep}`);
  // バリデーション
  if (step > currentStep) {
    if (!validateCurrentStep()) {
      console.log('Validation failed');
      return;
    }
  }

  // ステップの切り替え
  const currentStepEl = document.getElementById(`step-${currentStep}`);
  const nextStepEl = document.getElementById(`step-${step}`);

  if (currentStepEl && nextStepEl) {
    console.log(`Switching from step-${currentStep} to step-${step}`);
    // クラス操作の前に、全てのステップからactiveを削除する安全策
    document.querySelectorAll('.form-step').forEach(el => el.classList.remove('active'));

    nextStepEl.classList.add('active');

    // ステップインジケーターの更新
    updateStepIndicator(step);

    currentStep = step;

    // スクロールをトップに
    // document.querySelector('.form-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  } else {
    console.error('Step elements not found', { currentStepEl, nextStepEl });
  }
}

// イベントリスナーの設定
document.getElementById('btn-step1-next')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToStep(2);
});

document.getElementById('btn-step2-back')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToStep(1);
});

document.getElementById('btn-step2-next')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToStep(3);
});

document.getElementById('btn-step3-back')?.addEventListener('click', (e) => {
  e.preventDefault();
  goToStep(2);
});

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
      showFieldError('year-error', '1900-2100の範囲で入力');
      isValid = false;
    } else {
      clearFieldError('year-error');
    }

    // 月
    if (!month || month < 1 || month > 12) {
      showFieldError('month-error', '1-12の範囲で入力');
      isValid = false;
    } else {
      clearFieldError('month-error');
    }

    // 日
    if (!day || day < 1 || day > 31) {
      showFieldError('day-error', '1-31の範囲で入力');
      isValid = false;
    } else {
      clearFieldError('day-error');
    }

    // 日付の妥当性チェック
    if (year && month && day) {
      if (!validateDate(year, month, day)) {
        showFieldError('day-error', '無効な日付です');
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
    console.log(`Validating Step 2. Mode: ${mbtiMode}`);

    if (mbtiMode === 'known') {
      const mbtiType = mbtiTypeSelect.value;
      console.log(`Selected MBTI Type: ${mbtiType}`);
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
    showFieldError('year-error', '1900-2100の範囲で入力');
  } else {
    clearFieldError('year-error');
  }
});

monthInput?.addEventListener('blur', () => {
  const month = parseInt(monthInput.value, 10);
  if (month && (month < 1 || month > 12)) {
    showFieldError('month-error', '1-12の範囲で入力');
  } else {
    clearFieldError('month-error');
  }
});

dayInput?.addEventListener('blur', () => {
  const day = parseInt(dayInput.value, 10);
  if (day && (day < 1 || day > 31)) {
    showFieldError('day-error', '1-31の範囲で入力');
  } else {
    clearFieldError('day-error');
  }

  // 日付の妥当性チェック
  const year = parseInt(yearInput.value, 10);
  const month = parseInt(monthInput.value, 10);
  if (year && month && day) {
    if (!validateDate(year, month, day)) {
      showFieldError('day-error', '無効な日付です');
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
    questionDiv.style.marginBottom = 'var(--spacing-md)';
    questionDiv.innerHTML = `
      <h4 style="color: var(--color-accent-tertiary); margin-bottom: var(--spacing-sm);">Q${index + 1}: ${question.question}</h4>
      <div class="radio-group">
        <label>
          <input type="radio" name="mbti-q${index}" value="0" required>
          <span>${question.optionA.text}</span>
        </label>
        <label>
          <input type="radio" name="mbti-q${index}" value="1" required>
          <span>${question.optionB.text}</span>
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
      showError('分析処理中にエラーが発生しました。');
      hideLoading();
      console.error(error);
    }
  }, 1500); // 少し演出時間を長くする
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
 * エラー表示
 */
function showError(message: string) {
  errorDiv.innerHTML = `
    <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
      <span class="material-symbols-outlined">error</span>
      <span>${message}</span>
    </div>
  `;
  errorDiv.classList.add('show');
  errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });

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
  form.style.display = 'none';
}

function hideLoading() {
  loadingDiv.classList.remove('show');
  form.style.display = 'block';
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

// ... (existing imports)

// ...

/**
 * 本人向け結果を表示
 */
function displayPersonalResult(result: CompleteFortuneResult) {
  const { numerology, fourPillars, mbti, birthDate } = result;
  const talent = TALENT_NUMBER_TRAITS[numerology.talentNumber];
  const essence = ESSENCE_NUMBER_TRAITS[numerology.essenceNumber];
  const inquiry = INQUIRY_NUMBER_TRAITS[numerology.inquiryNumber];

  // レーダーチャート用のデータ (新しいロジックを使用)
  const radarData = calculateRadarData(mbti, fourPillars);

  const html = `
    <div class="result-header">
      <h2>人材特性分析レポート (YUI - 結 -)</h2>
      <p>生年月日: ${birthDate.year}年${birthDate.month}月${birthDate.day}日</p>
    </div>
    
    <div class="card">
      <h3><span class="material-symbols-outlined">person</span> キャリア特性</h3>
      <p>
        あなたは<strong style="color: var(--color-accent-primary);">${mbti.name} (${mbti.type})</strong>としての資質を持ち、
        人生のテーマは「${essence?.theme || ''}」です。
      </p>
      <div style="display: flex; gap: var(--spacing-sm); flex-wrap: wrap; margin-top: var(--spacing-md);">
        <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-accent); color: var(--color-primary);">才能数: ${numerology.talentNumber}</span>
        <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-accent); color: var(--color-primary);">本質数: ${numerology.essenceNumber}</span>
        <span style="background: #e3f2fd; padding: 4px 8px; border-radius: 4px; border: 1px solid var(--color-accent); color: var(--color-primary);">探究数: ${numerology.inquiryNumber}</span>
      </div>
    </div>

    <div class="card">
      <h3><span class="material-symbols-outlined">bar_chart</span> 特性レーダーチャート</h3>
      <div class="chart-container">
        <canvas id="radar-chart-canvas"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h3><span class="material-symbols-outlined">psychology</span> 四柱推命分析詳細</h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: var(--spacing-md);">
        <div style="background: rgba(0,0,0,0.2); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <h4 style="color: var(--color-accent-primary);">${fourPillars.yearPillar.name}</h4>
          <p><strong>${fourPillars.yearPillar.fullName}</strong> (${fourPillars.yearPillar.fullReading})</p>
          <p style="font-size: 0.9rem;">${fourPillars.yearPillar.description}</p>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <h4 style="color: var(--color-accent-primary);">${fourPillars.monthPillar.name}</h4>
          <p><strong>${fourPillars.monthPillar.fullName}</strong> (${fourPillars.monthPillar.fullReading})</p>
          <p style="font-size: 0.9rem;">${fourPillars.monthPillar.description}</p>
        </div>
        <div style="background: rgba(0,0,0,0.2); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <h4 style="color: var(--color-accent-primary);">${fourPillars.dayPillar.name}</h4>
          <p><strong>${fourPillars.dayPillar.fullName}</strong> (${fourPillars.dayPillar.fullReading})</p>
          <p style="font-size: 0.9rem;">${fourPillars.dayPillar.description}</p>
        </div>
        ${fourPillars.hourPillar ? `
        <div style="background: rgba(0,0,0,0.2); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <h4 style="color: var(--color-accent-primary);">${fourPillars.hourPillar.name}</h4>
          <p><strong>${fourPillars.hourPillar.fullName}</strong> (${fourPillars.hourPillar.fullReading})</p>
          <p style="font-size: 0.9rem;">${fourPillars.hourPillar.description}</p>
        </div>
        ` : ''}
      </div>
    </div>
    
    <div class="card">
      <h3><span class="material-symbols-outlined">star</span> 強みと弱み</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md);">
        <div>
          <h4 style="color: var(--color-success);">強み</h4>
          <ul>
            ${talent?.strengths.map(s => `<li>${s}</li>`).join('') || ''}
            ${mbti.strengths.map(s => `<li>${s}</li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 style="color: var(--color-error);">注意点</h4>
          <ul>
            ${talent?.weaknesses.map(w => `<li>${w}</li>`).join('') || ''}
            ${mbti.weaknesses.map(w => `<li>${w}</li>`).join('')}
          </ul>
        </div>
      </div>
    </div>

    <div class="card">
      <h3><span class="material-symbols-outlined">work</span> 適職とキャリア</h3>
      <p><strong>あなたに適した職業：</strong></p>
      <ul>
        ${essence?.work.map(w => `<li>${w}</li>`).join('') || ''}
        <li>${mbti.teamRole}</li>
      </ul>
    </div>

    <div class="card">
      <h3><span class="material-symbols-outlined">tips_and_updates</span> キャリア開発アドバイス</h3>
      <p>${mbti.workStyle}。${mbti.communication}というスタイルを意識しましょう。</p>
    </div>

    <div class="card" style="background: #f0f4f8; border: 1px solid var(--color-accent);">
      <h3><span class="material-symbols-outlined">auto_awesome</span> 深層コンピテンシー分析</h3>
      <p style="font-style: italic; margin-bottom: var(--spacing-md);">「${mbti.selfAnalysis.deepAnalysis}」</p>
      
      <h4 style="color: var(--color-primary); margin-top: var(--spacing-md);">隠れた才能</h4>
      <p>${mbti.selfAnalysis.hiddenTalent}</p>
      
      <h4 style="color: var(--color-primary); margin-top: var(--spacing-md);">成長への提言</h4>
      <p>${mbti.selfAnalysis.advice}</p>
    </div>

    <div class="share-actions" style="flex-direction: column; align-items: stretch;">
      <div style="width: 100%; margin-bottom: var(--spacing-md); padding: var(--spacing-md); background: var(--color-bg-tertiary); border-radius: var(--radius-sm); text-align: center;">
        <p style="font-size: 0.9rem; color: var(--color-text-muted); margin-bottom: var(--spacing-sm);">分析結果を共有</p>
        <p style="font-weight: bold; font-size: 1.1rem;">「${mbti.selfAnalysis.friendShareComment}」</p>
      </div>
      <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
        <button class="btn btn-primary" onclick="copyResult()" style="width: 100%;">
          <span class="material-symbols-outlined">content_copy</span> 結果をコピー
        </button>
        <button class="btn btn-share-x" onclick="shareOnX('${mbti.name}', '${essence?.theme || ''}', '${mbti.selfAnalysis.friendShareComment}')" style="width: 100%;">
          <span class="material-symbols-outlined">share</span> Xでシェア
        </button>
      </div>
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

  const html = `
    <div class="result-header">
      <h2>人材分析レポート</h2>
      <p>${birthDate.year}年${birthDate.month}月${birthDate.day}日 / ${mbti.type} - ${mbti.name}</p>
    </div>
    
    <div class="card">
      <h3><span class="material-symbols-outlined">trending_up</span> 成長予測</h3>
      <div class="chart-container">
        <canvas id="growth-chart"></canvas>
      </div>
    </div>
    
    <div class="card">
      <h3><span class="material-symbols-outlined">groups</span> チームでの役割</h3>
      <p><strong>推奨役割：</strong>${mbti.teamRole}</p>
      <p><strong>働き方：</strong>${mbti.workStyle}</p>
    </div>

    <div class="card">
      <h3><span class="material-symbols-outlined">psychology</span> マネジメントのポイント</h3>
      <p><strong>モチベーション：</strong>${mbti.motivationFactors.join('、')}</p>
      <p><strong>コミュニケーション：</strong>${mbti.communication}</p>
    </div>

    <div class="card" style="border-left: 4px solid var(--color-accent-secondary);">
      <h3><span class="material-symbols-outlined">menu_book</span> 雇用主向けマニュアル</h3>
      
      <h4 style="color: var(--color-accent-secondary); margin-top: var(--spacing-md);">接し方のガイド</h4>
      <p>${mbti.employerManual.communicationGuide}</p>
      
      <h4 style="color: var(--color-accent-secondary); margin-top: var(--spacing-md);">効果的な褒め言葉</h4>
      <ul style="list-style: none; padding: 0;">
        ${mbti.employerManual.praisePoints.map(p => `<li style="padding: 4px 0; padding-left: 20px; position: relative;"><span style="position: absolute; left: 0; color: var(--color-accent-secondary);">✔</span> ${p}</li>`).join('')}
      </ul>
      
      <h4 style="color: #c62828; margin-top: var(--spacing-md);">注意点（NG行動）</h4>
      <p style="color: #c62828; font-weight: 600;">${mbti.employerManual.handlingCaution}</p>
      
      <h4 style="color: var(--color-primary); margin-top: var(--spacing-md);">効果的なマネジメント</h4>
      <p>${mbti.employerManual.effectiveManagement}</p>
    </div>

    <!-- YUI Code & Pair Analysis Section -->
    <div class="card" style="border: 2px solid var(--color-primary);">
      <h3><span class="material-symbols-outlined">qr_code_2</span> YUIコード & ペア分析</h3>
      <div style="text-align: center; margin-bottom: var(--spacing-lg);">
        <p>あなたのYUIコード（部下に共有）</p>
        <div style="font-family: monospace; font-size: 1.5rem; font-weight: bold; background: #e3f2fd; padding: var(--spacing-md); border-radius: var(--radius-sm); display: inline-block; margin-bottom: var(--spacing-sm);">
          ${generateYUICode(birthDate.year, birthDate.month, birthDate.day, genderSelect.value, mbti.type)}
        </div>
        <p style="font-size: 0.85rem; color: var(--color-text-muted);">※このコードを1on1の相手に入力してもらうか、あなたが相手のコードを入力してください。</p>
      </div>

      <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-lg);">
        <h4><span class="material-symbols-outlined">diversity_3</span> 部下との相性診断 (1on1支援)</h4>
        <div class="form-group">
          <label>部下のYUIコードを入力</label>
          <div style="display: flex; gap: var(--spacing-sm);">
            <input type="text" id="subordinate-code" placeholder="例: 19950401-M-INFP" style="flex: 1;">
            <button class="btn btn-primary" onclick="analyzePair('${mbti.type}')">診断する</button>
          </div>
        </div>
        <div id="pair-analysis-result" style="display: none; margin-top: var(--spacing-md); background: var(--color-bg-primary); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <!-- Result injected here -->
        </div>
      </div>
    </div>

    <div class="card">
      <h3><span class="material-symbols-outlined">warning</span> リスク管理</h3>
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: var(--spacing-md); text-align: center;">
        <div style="background: rgba(255,255,255,0.05); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <strong>離職リスク</strong><br>
          <span style="font-size: 1.5rem; color: ${getRiskColor(mbti.stressFactors.length, 'low')}">${getRiskLevelText(mbti.stressFactors.length, 'low')}</span>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <strong>パフォーマンス</strong><br>
          <span style="font-size: 1.5rem; color: ${getRiskColor(mbti.weaknesses.length, 'medium')}">${getRiskLevelText(mbti.weaknesses.length, 'medium')}</span>
        </div>
        <div style="background: rgba(255,255,255,0.05); padding: var(--spacing-md); border-radius: var(--radius-sm);">
          <strong>モチベーション</strong><br>
          <span style="font-size: 1.5rem; color: ${getRiskColor(numerology.essenceNumber === 8 ? 1 : 0, 'low')}">${mbti.motivationFactors.length > 3 ? '低' : '中'}</span>
        </div>
      </div>
      <div style="margin-top: var(--spacing-md); font-size: 0.85rem; color: var(--color-text-secondary); background: rgba(0,0,0,0.2); padding: var(--spacing-sm); border-radius: var(--radius-sm);">
        <p style="margin-bottom: 4px;"><strong>※リスク判定について</strong></p>
        <p style="margin-bottom: 0;">この判定は、MBTIの性格特性と数秘術に基づく<strong>先天的な傾向</strong>を示しています。現在の状況や環境によって変化するものではなく、その人がストレスを感じやすいポイントや、モチベーションの源泉がどこにあるかを示唆するものです。</p>
      </div>
    </div>

    <div class="share-actions">
      <button class="btn btn-primary" onclick="copyResult()">
        <span class="material-symbols-outlined">content_copy</span> 結果をコピー
      </button>
    </div>
  `;

  resultSection.innerHTML = html;

  // 成長曲線を描画
  setTimeout(() => {
    renderGrowthChart();
  }, 100);
}

// シェア機能
(window as any).copyResult = () => {
  const text = `人材特性分析レポート\nYUI - 結 - で分析しました。\n#YUI #人材分析`;
  navigator.clipboard.writeText(text).then(() => {
    alert('結果をクリップボードにコピーしました。');
  });
};

(window as any).shareOnX = (mbtiName: string, theme: string, comment: string) => {
  const text = `${comment}\n\n特性テーマ:「${theme}」\nタイプ:「${mbtiName}」\n\nYUI - 結 - で分析\n#YUI #人材分析`;
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
};

// 旧calculateRadarData関数は削除されました

function renderRadarChart(data: any) {
  const ctx = document.getElementById('radar-chart-canvas') as HTMLCanvasElement;
  if (!ctx) return;

  new (window as any).Chart(ctx, {
    type: 'radar',
    data: data,
    options: {
      scales: {
        r: {
          angleLines: { color: 'rgba(0, 0, 0, 0.1)' },
          grid: { color: 'rgba(0, 0, 0, 0.1)' },
          pointLabels: { color: '#333', font: { size: 12 } },
          ticks: { display: false, max: 10 }
        }
      },
      plugins: {
        legend: { display: false }
      }
    }
  });
}

function renderGrowthChart() {
  const ctx = document.getElementById('growth-chart') as HTMLCanvasElement;
  if (!ctx) return;

  new (window as any).Chart(ctx, {
    type: 'line',
    data: {
      labels: ['現在', '1年後', '3年後', '5年後', '10年後'],
      datasets: [{
        label: '成長予測',
        data: [50, 65, 75, 85, 95],
        borderColor: '#0288d1',
        backgroundColor: 'rgba(2, 136, 209, 0.1)',
        fill: true,
        tension: 0.4
      }]
    },
    options: {
      scales: {
        y: { grid: { color: 'rgba(0, 0, 0, 0.1)' }, ticks: { color: '#333' } },
        x: { grid: { color: 'rgba(0, 0, 0, 0.1)' }, ticks: { color: '#333' } }
      },
      plugins: { legend: { display: false } }
    }
  });
}

function getLuckyColor(num: number): string {
  const colors = ['赤', '青', '黄', '緑', '紫', '金', '銀', '白', '黒'];
  return colors[num % colors.length];
}

function getRiskColor(level: number, type: string): string {
  if (level > 3) return 'var(--color-error)';
  if (level > 1) return 'var(--color-warning)';
  return 'var(--color-success)';
}

function getRiskLevelText(level: number, type: string): string {
  if (level > 3) return '高';
  if (level > 1) return '中';
  return '低';
}

// ペア分析機能
async function analyzePair(managerMBTI: MBTIType) {
  const codeInput = document.getElementById('subordinate-code') as HTMLInputElement;
  const resultDiv = document.getElementById('pair-analysis-result') as HTMLDivElement;

  if (!codeInput || !resultDiv) return;

  const code = codeInput.value.trim();
  if (!code) {
    alert('部下のYUIコードを入力してください');
    return;
  }

  const subordinateData = parseYUICode(code);
  if (!subordinateData) {
    alert('無効なYUIコードです。形式を確認してください（例: 19900101-M-INTJ）');
    return;
  }

  const compatibility = analyzeCompatibility(managerMBTI, subordinateData.mbti);

  resultDiv.innerHTML = `
    <h5 style="color: var(--color-primary); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: 16px;">
      診断結果: ${MBTI_TYPES[managerMBTI].name} × ${MBTI_TYPES[subordinateData.mbti].name}
    </h5>
    
    <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
      <div style="font-size: 2.5rem; font-weight: bold; color: var(--color-accent);">${compatibility.score}点</div>
      <div style="font-weight: bold;">${compatibility.summary}</div>
    </div>

    <div style="background: #fff; padding: 16px; border-radius: 8px; border-left: 4px solid var(--color-accent);">
      <strong style="display: block; margin-bottom: 8px; color: var(--color-primary);">🗣 コミュニケーション翻訳（1on1アドバイス）</strong>
      <p style="white-space: pre-wrap; margin-bottom: 0;">${compatibility.communicationAdvice}</p>
    </div>

    <div style="margin-top: 16px;">
      <strong>✨ シナジーポイント</strong>
      <ul style="margin-top: 8px; padding-left: 20px;">
        ${compatibility.synergyPoints.map(p => `<li>${p}</li>`).join('')}
      </ul>
    </div>
  `;

  resultDiv.style.display = 'block';
}

// PDFダウンロード機能
downloadPdfBtn.addEventListener('click', () => {
  if (bulkMembers.length === 0) {
    alert('データがありません');
    return;
  }

  const doc = new jsPDF();

  doc.setFontSize(20);
  doc.text('YUI - Team Analysis Report', 14, 22);

  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 14, 30);
  doc.text(`Total Members: ${bulkMembers.length}`, 14, 36);

  const tableData = bulkMembers.map(m => [
    m.name,
    `${m.birthDate.year}/${m.birthDate.month}/${m.birthDate.day}`,
    m.gender,
    m.mbti || '-',
    m.fortune.essenceNumber,
    m.fortune.talentNumber
  ]);

  autoTable(doc, {
    head: [['Name', 'Birth Date', 'Gender', 'MBTI', 'Essence', 'Talent']],
    body: tableData,
    startY: 45,
  });

  doc.save('yui-team-analysis.pdf');
});

// グローバルスコープに公開
(window as any).goToStep = goToStep;
(window as any).calculateFortune = calculateFortune;
(window as any).analyzePair = analyzePair;
