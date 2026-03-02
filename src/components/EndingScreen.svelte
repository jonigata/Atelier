<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, resetGame, alchemyLevel, villageLevel, reputationLevel, scoreBreakdown } from '$lib/stores/game';
  import { initializeGame } from '$lib/services/gameLoop';
  import { savePastGameScores } from '$lib/services/pastScores';
  import { clearAutoSave } from '$lib/services/saveLoad';
  import { calcScore } from '$lib/services/score';
  import { get } from 'svelte/store';
  import { getNickname, saveNickname, submitScore } from '$lib/services/ranking';
  import NicknameInput from './NicknameInput.svelte';

  type EndingType = 'true' | 'good' | 'normal' | 'mediocre' | 'fail';

  $: isGameOver = $gameState.gameOverReason != null;
  $: isProvisionalEnding = !isGameOver && $gameState.day <= 336;
  $: provisionalTitle = $gameState.completedInspections.includes(28)
    ? '1月末の査察が終了しました'
    : 'リタイア';

  // エンディング到達時にスコア履歴をlocalStorageに保存
  let scoreSaved = false;
  onMount(() => {
    if (scoreSaved) return;
    const state = get(gameState);
    const score = calcScore(state);
    const endingType = state.gameOverReason != null
      ? 'gameover'
      : state.day <= 336
        ? (state.completedInspections.includes(28) ? 'provisional' : 'retire')
        : getEnding().type;
    savePastGameScores(state.scoreHistory, endingType, state.day, score.total);
    clearAutoSave();
    scoreSaved = true;
  });

  // 仮エンディングのステップ管理（クリックで順に開示）
  let revealStep = 0;
  const TOTAL_STEPS = 3; // 0:タイトル+スコア, 1:成績, 2:内訳+ボタン

  function handleRevealClick() {
    if (revealStep < TOTAL_STEPS - 1) {
      revealStep++;
    }
  }

  function getEnding(): { type: EndingType; title: string; description: string } {
    const state = $gameState;
    const devLv = $villageLevel;
    const alcLv = $alchemyLevel;

    // 真ED: 村発展Lv10, 錬金Lv10, エリクサー作成済
    if (
      devLv >= 10 &&
      alcLv >= 10 &&
      state.craftedItems.includes('elixir')
    ) {
      return {
        type: 'true',
        title: '真のエンディング - 復興の立役者',
        description:
          'あなたの尽力により、寂れていた村は見違えるほどに発展しました。エリクサーの調合という偉業も成し遂げ、村の人々はあなたを英雄として讃えています。師匠イリーナも「よくやった」と手紙で祝福を送ってきました。',
      };
    }

    // 良ED: 村発展Lv8以上, 錬金Lv8以上
    if (devLv >= 8 && alcLv >= 8) {
      return {
        type: 'good',
        title: '村の恩人',
        description:
          '村は大きく発展し、あなたは村の恩人として慕われるようになりました。多くの人々が移り住み、かつての賑わいを取り戻しつつあります。村長オルトは「君が来てくれて本当によかった」と感謝の言葉を述べました。',
      };
    }

    // 普通ED: 村発展Lv6以上
    if (devLv >= 6) {
      return {
        type: 'normal',
        title: '貢献者',
        description:
          'あなたの活動により、村は着実に発展しました。まだ道半ばですが、村には確かな変化が生まれています。村長は今後も村に残ってほしいと言っています。',
      };
    }

    // 微妙ED: 村発展Lv4以上
    if (devLv >= 4) {
      return {
        type: 'mediocre',
        title: 'まあまあ',
        description:
          '少しは村の役に立てたものの、大きな変化をもたらすには至りませんでした。「また来てくれ」と村人たちは見送ってくれました。',
      };
    }

    // 悪ED: 村発展度30未満
    return {
      type: 'fail',
      title: '力及ばず',
      description:
        '残念ながら、村を発展させることはできませんでした。師匠から「まだ修行が足りないようだな」と手紙が届きました。また挑戦する機会があるかもしれません...',
    };
  }

  $: ending = getEnding();

  // ランキング登録フロー
  let rankingState: 'idle' | 'input' | 'submitting' | 'done' | 'error' = 'idle';
  let rankingResult: { weeklyRank: number | null; totalRank: number | null } | null = null;
  let rankingError = '';

  function openRankingInput() {
    rankingState = 'input';
  }

  async function handleRankingSubmit(nickname: string) {
    rankingState = 'submitting';
    rankingError = '';
    saveNickname(nickname);
    try {
      const state = get(gameState);
      const bd = get(scoreBreakdown);
      const endType = state.gameOverReason != null
        ? 'gameover'
        : state.day <= 336
          ? (state.completedInspections.includes(28) ? 'provisional' : 'retire')
          : getEnding().type;
      const result = await submitScore(nickname, bd.total, endType, state.day, bd, state);
      rankingResult = { weeklyRank: result.weeklyRank, totalRank: result.totalRank };
      rankingState = 'done';
    } catch (e: unknown) {
      rankingError = e instanceof Error ? e.message : '送信に失敗しました';
      rankingState = 'error';
    }
  }

  function cancelRankingInput() {
    rankingState = 'idle';
  }

  function retryRanking() {
    rankingState = 'input';
  }

  function handleRestart() {
    revealStep = 0;
    resetGame();
    initializeGame();
  }
</script>

{#if isProvisionalEnding}
<!-- 仮エンディング -->
<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="ending-screen provisional" on:click={handleRevealClick}>
  <div class="content">
    <h1 class="fade-in">{provisionalTitle}</h1>

    <div class="final-score fade-in">
      <span class="final-score-label">SCORE</span>
      <span class="final-score-value">{$scoreBreakdown.total.toLocaleString()}</span>
      <span class="final-score-unit">pt</span>
    </div>

    {#if revealStep >= 1}
    <div class="stats fade-in">
      <h3>{$gameState.day}日目の成績</h3>
      <div class="stat-grid">
        <div class="stat highlight">
          <span class="label">村発展度</span>
          <span class="value">Lv.{$villageLevel}</span>
        </div>
        <div class="stat">
          <span class="label">錬金術レベル</span>
          <span class="value">Lv.{$alchemyLevel}</span>
        </div>
        <div class="stat">
          <span class="label">名声</span>
          <span class="value">Lv.{$reputationLevel}</span>
        </div>
        <div class="stat">
          <span class="label">所持金</span>
          <span class="value">{$gameState.money.toLocaleString()} G</span>
        </div>
        <div class="stat">
          <span class="label">達成依頼</span>
          <span class="value">{$gameState.completedQuestCount}件</span>
        </div>
        <div class="stat">
          <span class="label">調合回数</span>
          <span class="value">{$gameState.stats.totalCraftCount}回</span>
        </div>
      </div>
    </div>
    {/if}

    {#if revealStep >= 2}
    <div class="stats fade-in">
      <div class="score-breakdown">
        <h4>スコア内訳</h4>
        <div class="breakdown-grid">
          <span class="bd-label">所持金</span><span class="bd-value">{$scoreBreakdown.money.toLocaleString()}</span>
          <span class="bd-label">所持品</span><span class="bd-value">{$scoreBreakdown.inventory.toLocaleString()}</span>
          <span class="bd-label">レベル</span><span class="bd-value">{$scoreBreakdown.levels.toLocaleString()}</span>
          <span class="bd-label">依頼達成</span><span class="bd-value">{$scoreBreakdown.quests.toLocaleString()}</span>
          <span class="bd-label">アルバム</span><span class="bd-value">{$scoreBreakdown.album.toLocaleString()}</span>
          <span class="bd-label">調合実績</span><span class="bd-value">{$scoreBreakdown.crafting.toLocaleString()}</span>
          <span class="bd-label">建物・助手</span><span class="bd-value">{$scoreBreakdown.buildings.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="ranking-area fade-in">
      {#if rankingState === 'idle'}
        <button class="ranking-btn" on:click|stopPropagation={openRankingInput}>ランキングに登録</button>
      {:else if rankingState === 'done' && rankingResult}
        <div class="ranking-done">
          <span class="ranking-done-label">登録完了！</span>
          {#if rankingResult.weeklyRank}<span>週間 {rankingResult.weeklyRank}位</span>{/if}
          {#if rankingResult.totalRank}<span>全期間 {rankingResult.totalRank}位</span>{/if}
        </div>
      {:else if rankingState === 'error'}
        <p class="ranking-error">{rankingError}</p>
        <button class="ranking-btn small" on:click|stopPropagation={retryRanking}>再試行</button>
      {/if}
    </div>

    <p class="provisional-note fade-in">体験版はここまでです</p>

    <button class="restart-btn fade-in" on:click|stopPropagation={handleRestart}>
      最初から
    </button>
    {:else}
    <p class="click-hint">click</p>
    {/if}
  </div>
</div>
{:else if isGameOver}
<div class="ending-screen gameover">
  <div class="content">
    <h1>召還されました</h1>

    <div class="ending-card">
      <h2>GAME OVER</h2>
      <p class="description">{$gameState.gameOverReason}</p>
    </div>

    <div class="final-score">
      <span class="final-score-label">SCORE</span>
      <span class="final-score-value">{$scoreBreakdown.total.toLocaleString()}</span>
      <span class="final-score-unit">pt</span>
    </div>

    <div class="stats">
      <h3>{$gameState.day}日目の成績</h3>
      <div class="stat-grid">
        <div class="stat highlight">
          <span class="label">村発展度</span>
          <span class="value">Lv.{$villageLevel}</span>
        </div>
        <div class="stat">
          <span class="label">錬金術レベル</span>
          <span class="value">Lv.{$alchemyLevel}</span>
        </div>
        <div class="stat">
          <span class="label">名声</span>
          <span class="value">Lv.{$reputationLevel}</span>
        </div>
        <div class="stat">
          <span class="label">達成依頼</span>
          <span class="value">{$gameState.completedQuestCount}件</span>
        </div>
      </div>
      <div class="score-breakdown">
        <h4>スコア内訳</h4>
        <div class="breakdown-grid">
          <span class="bd-label">所持金</span><span class="bd-value">{$scoreBreakdown.money.toLocaleString()}</span>
          <span class="bd-label">所持品</span><span class="bd-value">{$scoreBreakdown.inventory.toLocaleString()}</span>
          <span class="bd-label">レベル</span><span class="bd-value">{$scoreBreakdown.levels.toLocaleString()}</span>
          <span class="bd-label">依頼達成</span><span class="bd-value">{$scoreBreakdown.quests.toLocaleString()}</span>
          <span class="bd-label">アルバム</span><span class="bd-value">{$scoreBreakdown.album.toLocaleString()}</span>
          <span class="bd-label">調合実績</span><span class="bd-value">{$scoreBreakdown.crafting.toLocaleString()}</span>
          <span class="bd-label">建物・助手</span><span class="bd-value">{$scoreBreakdown.buildings.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="ranking-area">
      {#if rankingState === 'idle'}
        <button class="ranking-btn" on:click={openRankingInput}>ランキングに登録</button>
      {:else if rankingState === 'done' && rankingResult}
        <div class="ranking-done">
          <span class="ranking-done-label">登録完了！</span>
          {#if rankingResult.weeklyRank}<span>週間 {rankingResult.weeklyRank}位</span>{/if}
          {#if rankingResult.totalRank}<span>全期間 {rankingResult.totalRank}位</span>{/if}
        </div>
      {:else if rankingState === 'error'}
        <p class="ranking-error">{rankingError}</p>
        <button class="ranking-btn small" on:click={retryRanking}>再試行</button>
      {/if}
    </div>

    <button class="restart-btn" on:click={handleRestart}>
      やり直す
    </button>
  </div>
</div>
{:else}
<div class="ending-screen" class:true={ending.type === 'true'}
     class:good={ending.type === 'good'}
     class:normal={ending.type === 'normal'}
     class:mediocre={ending.type === 'mediocre'}
     class:fail={ending.type === 'fail'}>
  <div class="content">
    <h1>1年間が終了しました</h1>

    <div class="ending-card">
      <h2>{ending.title}</h2>
      <p class="description">{ending.description}</p>
    </div>

    <div class="final-score">
      <span class="final-score-label">SCORE</span>
      <span class="final-score-value">{$scoreBreakdown.total.toLocaleString()}</span>
      <span class="final-score-unit">pt</span>
    </div>

    <div class="stats">
      <h3>最終成績</h3>
      <div class="stat-grid">
        <div class="stat highlight">
          <span class="label">村発展度</span>
          <span class="value">Lv.{$villageLevel}</span>
        </div>
        <div class="stat">
          <span class="label">錬金術レベル</span>
          <span class="value">Lv.{$alchemyLevel}</span>
        </div>
        <div class="stat">
          <span class="label">名声</span>
          <span class="value">Lv.{$reputationLevel}</span>
        </div>
        <div class="stat">
          <span class="label">所持金</span>
          <span class="value">{$gameState.money.toLocaleString()} G</span>
        </div>
        <div class="stat">
          <span class="label">達成依頼</span>
          <span class="value">{$gameState.completedQuestCount}件</span>
        </div>
        <div class="stat">
          <span class="label">調合回数</span>
          <span class="value">{$gameState.stats.totalCraftCount}回</span>
        </div>
      </div>
      <div class="score-breakdown">
        <h4>スコア内訳</h4>
        <div class="breakdown-grid">
          <span class="bd-label">所持金</span><span class="bd-value">{$scoreBreakdown.money.toLocaleString()}</span>
          <span class="bd-label">所持品</span><span class="bd-value">{$scoreBreakdown.inventory.toLocaleString()}</span>
          <span class="bd-label">レベル</span><span class="bd-value">{$scoreBreakdown.levels.toLocaleString()}</span>
          <span class="bd-label">依頼達成</span><span class="bd-value">{$scoreBreakdown.quests.toLocaleString()}</span>
          <span class="bd-label">アルバム</span><span class="bd-value">{$scoreBreakdown.album.toLocaleString()}</span>
          <span class="bd-label">調合実績</span><span class="bd-value">{$scoreBreakdown.crafting.toLocaleString()}</span>
          <span class="bd-label">建物・助手</span><span class="bd-value">{$scoreBreakdown.buildings.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div class="ranking-area">
      {#if rankingState === 'idle'}
        <button class="ranking-btn" on:click={openRankingInput}>ランキングに登録</button>
      {:else if rankingState === 'done' && rankingResult}
        <div class="ranking-done">
          <span class="ranking-done-label">登録完了！</span>
          {#if rankingResult.weeklyRank}<span>週間 {rankingResult.weeklyRank}位</span>{/if}
          {#if rankingResult.totalRank}<span>全期間 {rankingResult.totalRank}位</span>{/if}
        </div>
      {:else if rankingState === 'error'}
        <p class="ranking-error">{rankingError}</p>
        <button class="ranking-btn small" on:click={retryRanking}>再試行</button>
      {/if}
    </div>

    <button class="restart-btn" on:click={handleRestart}>
      もう一度プレイする
    </button>
  </div>
</div>
{/if}

{#if rankingState === 'input' || rankingState === 'submitting'}
  <NicknameInput
    defaultNickname={getNickname()}
    onSubmit={handleRankingSubmit}
    onCancel={cancelRankingInput}
    submitting={rankingState === 'submitting'}
  />
{/if}

<style>
  .ending-screen {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
  }

  .ending-screen.provisional {
    cursor: pointer;
  }

  .ending-screen.true {
    background: linear-gradient(135deg, #1a1a2e 0%, #2e1a4a 50%, #4a2a6e 100%);
  }

  .ending-screen.good {
    background: linear-gradient(135deg, #1a2e1a 0%, #2a4a2a 100%);
  }

  .ending-screen.fail,
  .ending-screen.gameover {
    background: linear-gradient(135deg, #2e1a1a 0%, #3a2020 100%);
  }

  .gameover h1 {
    color: #e74c3c;
  }

  .gameover .ending-card {
    border-color: #e74c3c;
    box-shadow: 0 0 20px rgba(231, 76, 60, 0.2);
  }

  .gameover h2 {
    color: #e74c3c;
  }

  .content {
    max-width: 600px;
    text-align: center;
  }

  h1 {
    font-size: 2rem;
    color: #c9a959;
    margin-bottom: 2rem;
  }

  .ending-card {
    background: rgba(0, 0, 0, 0.4);
    border: 2px solid #c9a959;
    border-radius: 12px;
    padding: 2rem;
    margin-bottom: 2rem;
  }

  .true .ending-card {
    border-color: #9c27b0;
    box-shadow: 0 0 30px rgba(156, 39, 176, 0.3);
  }

  .good .ending-card {
    border-color: #4caf50;
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.2);
  }

  h2 {
    font-size: 1.5rem;
    color: #f4e4bc;
    margin-bottom: 1rem;
  }

  .description {
    color: #c0c0d0;
    line-height: 1.6;
  }

  .stats {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    padding: 1.5rem;
    margin-bottom: 2rem;
  }

  h3 {
    color: #c9a959;
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  .stat-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .stat.highlight {
    grid-column: span 2;
    background: rgba(201, 169, 89, 0.1);
    border-radius: 6px;
    padding: 0.75rem;
  }

  .stat.highlight .value {
    font-size: 2rem;
    color: #c9a959;
  }

  .stat .label {
    font-size: 0.85rem;
    color: #a0a0b0;
  }

  .stat .value {
    font-size: 1.25rem;
    font-weight: bold;
    color: #e0e0f0;
  }

  .final-score {
    display: flex;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .final-score-label {
    font-size: 1rem;
    color: #a0a0b0;
    letter-spacing: 0.1em;
  }

  .final-score-value {
    font-size: 3rem;
    font-weight: bold;
    color: #f0c040;
    text-shadow: 0 0 20px rgba(240, 192, 64, 0.4);
  }

  .final-score-unit {
    font-size: 1.2rem;
    color: #c9a959;
  }

  .score-breakdown {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }

  .score-breakdown h4 {
    color: #a0a0b0;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }

  .breakdown-grid {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: 0.25rem 1rem;
    font-size: 0.85rem;
  }

  .bd-label {
    color: #a0a0b0;
    text-align: left;
  }

  .bd-value {
    color: #e0e0f0;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .provisional-note {
    color: #a0a0b0;
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
  }

  .click-hint {
    color: rgba(160, 160, 176, 0.6);
    font-size: 0.85rem;
    margin-top: 1rem;
    animation: blink 1.5s ease-in-out infinite;
  }

  @keyframes blink {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 1; }
  }

  .fade-in {
    animation: fadeIn 0.5s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .restart-btn {
    padding: 1rem 2.5rem;
    font-size: 1.1rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 8px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .restart-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(201, 169, 89, 0.4);
  }

  .ranking-area {
    margin-bottom: 1.5rem;
  }

  .ranking-btn {
    padding: 0.7rem 2rem;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #c9a959;
    border-radius: 8px;
    color: #c9a959;
    cursor: pointer;
    transition: all 0.2s;
  }

  .ranking-btn:hover {
    background: rgba(201, 169, 89, 0.15);
  }

  .ranking-btn.small {
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
  }

  .ranking-done {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: rgba(100, 160, 80, 0.1);
    border: 1px solid rgba(100, 160, 80, 0.3);
    border-radius: 8px;
    color: #a0d080;
    font-size: 0.95rem;
  }

  .ranking-done-label {
    font-weight: bold;
  }

  .ranking-error {
    color: #e07060;
    font-size: 0.85rem;
    margin-bottom: 0.5rem;
  }
</style>
