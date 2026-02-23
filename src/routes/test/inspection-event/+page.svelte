<svelte:options runes={true} />

<script lang="ts">
  import { gameState } from '$lib/stores/game';
  import { setEventDialogue } from '$lib/stores/tutorial';
  import { resolveInspectionCutscene } from '$lib/services/presentation';
  import InspectionCutscene from '../../../components/InspectionCutscene.svelte';
  import EventDialog from '../../../components/EventDialog.svelte';
  import type { InspectionCutsceneData, NarrativeLine } from '$lib/models/types';

  type Grade = 'S' | 'A' | 'B' | 'C' | 'D';

  let selectedMonth = $state(1);
  let selectedGrade = $state<Grade>('B');

  const months = [
    { month: 1, title: '初回報告', criteriaCount: 2 },
    { month: 2, title: '適応確認', criteriaCount: 2 },
    { month: 3, title: '基礎確認', criteriaCount: 2 },
    { month: 5, title: '成長評価', criteriaCount: 4 },
    { month: 7, title: '中間評価', criteriaCount: 4 },
    { month: 9, title: '最終準備', criteriaCount: 4 },
  ];

  const grades: Grade[] = ['S', 'A', 'B', 'C', 'D'];

  function buildCutsceneData(month: number, grade: Grade): InspectionCutsceneData {
    const m = months.find((m) => m.month === month)!;
    const passed = grade !== 'D';

    const criteria = m.criteriaCount === 2
      ? [
          { label: '錬金Lv', value: '3', grade },
          { label: '依頼', value: '5件', grade },
        ]
      : [
          { label: '錬金Lv', value: '5', grade },
          { label: '依頼', value: '15件', grade },
          { label: '村発展Lv', value: '4', grade },
          { label: '名声Lv', value: '4', grade },
        ];

    return {
      month,
      title: m.title,
      criteria,
      overallGrade: grade,
      passed,
    };
  }

  // カットシーンのみ再生
  function showCutscene() {
    const data = buildCutsceneData(selectedMonth, selectedGrade);
    gameState.update((s) => ({ ...s, pendingInspectionCutscene: data }));
  }

  // フルシーケンス再生（導入会話 → カットシーン → 結果会話）
  async function showFullSequence() {
    const grade = selectedGrade;
    const month = selectedMonth;
    const m = months.find((m) => m.month === month)!;
    const passed = grade !== 'D';

    // 1. 導入ダイアログ
    setEventDialogue({
      characterName: '査察官',
      characterTitle: '師匠組合',
      characterFaceId: 'inspector',
      eventImage: '/images/events/inspection_evaluation.png',
      lines: [
        { text: `${month}月末の定期査察を執り行います`, expression: 'neutral' },
        { text: 'それでは項目ごとに確認します', expression: 'determined' },
      ],
    });

    // ダイアログ閉じを待つ
    await new Promise<void>((resolve) => {
      const unsub = gameState.subscribe((s) => {
        if (!s.tutorialProgress.pendingDialogue) {
          unsub();
          resolve();
        }
      });
    });

    // 2. カットシーン
    const data = buildCutsceneData(month, grade);
    gameState.update((s) => ({ ...s, pendingInspectionCutscene: data }));

    // カットシーン完了を待つ
    await new Promise<void>((resolve) => {
      const unsub = gameState.subscribe((s) => {
        if (!s.pendingInspectionCutscene) {
          unsub();
          resolve();
        }
      });
    });

    // 3. 結果コメント
    const verdictLines: NarrativeLine[] = [];
    if (passed) {
      verdictLines.push({ text: `以上を踏まえまして、総合${grade}等級。合格です`, expression: 'neutral' });
      verdictLines.push({ text: '引き続き精進を期待します', expression: 'happy' });
    } else {
      verdictLines.push({ text: '以上を踏まえまして……総合D等級。不合格です', expression: 'angry' });
      verdictLines.push({ text: '残念ですが、これ以上の活動継続は認められません', expression: 'sad' });
      verdictLines.push({ text: '召還命令を発行します', expression: 'determined' });
    }

    setEventDialogue({
      characterName: '査察官',
      characterTitle: '師匠組合',
      characterFaceId: 'inspector',
      lines: verdictLines,
    });
  }
</script>

<div class="test-page">
  <h2>査察イベント演出テスト</h2>

  <div class="controls">
    <label>
      <span>査察月:</span>
      <select bind:value={selectedMonth}>
        {#each months as m}
          <option value={m.month}>{m.month}月末 - {m.title}（{m.criteriaCount}項目）</option>
        {/each}
      </select>
    </label>

    <div class="grade-selector">
      <span>総合等級:</span>
      <div class="grade-buttons">
        {#each grades as g}
          <button
            class="grade-btn"
            class:active={selectedGrade === g}
            class:fail={g === 'D'}
            onclick={() => selectedGrade = g}
          >{g}</button>
        {/each}
      </div>
    </div>
  </div>

  <div class="actions">
    <button class="show-btn primary" onclick={showFullSequence}>
      フルシーケンス再生
    </button>
    <button class="show-btn" onclick={showCutscene}>
      カットシーンのみ
    </button>
    <span class="hint">
      {selectedGrade === 'D' ? '不合格パターン' : `${selectedGrade}等級 合格パターン`}
    </span>
  </div>
</div>

<InspectionCutscene />
<EventDialog />

<style>
  .test-page {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.5rem;
    color: #e0e0f0;
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
    min-height: 100vh;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }

  h2 {
    color: #c9a959;
    margin-bottom: 1.5rem;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 8px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  label span, .grade-selector > span {
    min-width: 80px;
    font-size: 0.9rem;
    font-weight: bold;
  }

  select {
    flex: 1;
    padding: 0.4rem;
    background: #2a2a3e;
    color: #e0e0f0;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    font-size: 0.9rem;
  }

  .grade-selector {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .grade-buttons {
    display: flex;
    gap: 0.4rem;
  }

  .grade-btn {
    padding: 0.4rem 0.8rem;
    background: #2a2a3e;
    color: #a0a0b0;
    border: 1px solid #4a4a6a;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
    font-size: 0.9rem;
    transition: all 0.15s;
  }

  .grade-btn:hover {
    background: #3a3a5e;
  }

  .grade-btn.active {
    background: #4a6a4a;
    color: #90e090;
    border-color: #6a9a6a;
  }

  .grade-btn.active.fail {
    background: #6a3a3a;
    color: #e09090;
    border-color: #9a5a5a;
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .show-btn {
    padding: 0.6rem 1.2rem;
    background: #3a3a5e;
    border: 1px solid #5a5a7a;
    border-radius: 6px;
    color: #e0e0f0;
    font-weight: bold;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .show-btn.primary {
    background: linear-gradient(135deg, #8b6914, #c9a959);
    border: none;
    color: #1a1a2e;
    font-size: 1rem;
    padding: 0.7rem 1.5rem;
  }

  .show-btn:hover {
    filter: brightness(1.1);
  }

  .hint {
    font-size: 0.85rem;
    color: #a0a0b0;
  }
</style>
