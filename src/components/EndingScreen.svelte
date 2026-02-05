<script lang="ts">
  import { gameState, resetGame } from '$lib/stores/game';

  type EndingType = 'true' | 'good' | 'normal' | 'mediocre' | 'fail';

  function getEnding(): { type: EndingType; title: string; description: string } {
    const state = $gameState;
    const dev = state.villageDevelopment;

    // 真ED: 村発展度90以上, Lv15以上, エリクサー作成済
    if (
      dev >= 90 &&
      state.alchemyLevel >= 15 &&
      state.craftedItems.includes('elixir')
    ) {
      return {
        type: 'true',
        title: '真のエンディング - 復興の立役者',
        description:
          'あなたの尽力により、寂れていた村は見違えるほどに発展しました。エリクサーの調合という偉業も成し遂げ、村の人々はあなたを英雄として讃えています。師匠イリーナも「よくやった」と手紙で祝福を送ってきました。',
      };
    }

    // 良ED: 村発展度70以上, Lv10以上
    if (dev >= 70 && state.alchemyLevel >= 10) {
      return {
        type: 'good',
        title: '村の恩人',
        description:
          '村は大きく発展し、あなたは村の恩人として慕われるようになりました。多くの人々が移り住み、かつての賑わいを取り戻しつつあります。村長オルトは「君が来てくれて本当によかった」と感謝の言葉を述べました。',
      };
    }

    // 普通ED: 村発展度50以上
    if (dev >= 50) {
      return {
        type: 'normal',
        title: '貢献者',
        description:
          'あなたの活動により、村は着実に発展しました。まだ道半ばですが、村には確かな変化が生まれています。村長は今後も村に残ってほしいと言っています。',
      };
    }

    // 微妙ED: 村発展度30以上
    if (dev >= 30) {
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

  function handleRestart() {
    resetGame();
  }
</script>

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

    <div class="stats">
      <h3>最終成績</h3>
      <div class="stat-grid">
        <div class="stat highlight">
          <span class="label">村発展度</span>
          <span class="value">{$gameState.villageDevelopment}</span>
        </div>
        <div class="stat">
          <span class="label">錬金術レベル</span>
          <span class="value">{$gameState.alchemyLevel}</span>
        </div>
        <div class="stat">
          <span class="label">名声</span>
          <span class="value">{$gameState.reputation}</span>
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

    <button class="restart-btn" on:click={handleRestart}>
      もう一度プレイする
    </button>
  </div>
</div>

<style>
  .ending-screen {
    min-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
  }

  .ending-screen.true {
    background: linear-gradient(135deg, #1a1a2e 0%, #2e1a4a 50%, #4a2a6e 100%);
  }

  .ending-screen.good {
    background: linear-gradient(135deg, #1a2e1a 0%, #2a4a2a 100%);
  }

  .ending-screen.fail {
    background: linear-gradient(135deg, #2e1a1a 0%, #3a2020 100%);
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
</style>
