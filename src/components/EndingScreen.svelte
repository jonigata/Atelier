<script lang="ts">
  import { gameState, resetGame } from '$lib/stores/game';

  type EndingType = 'true' | 'master' | 'merchant' | 'graduate' | 'fail';

  function getEnding(): { type: EndingType; title: string; description: string } {
    const state = $gameState;

    if (
      state.alchemyLevel >= 20 &&
      state.reputation >= 80 &&
      state.craftedItems.includes('elixir')
    ) {
      return {
        type: 'true',
        title: '真のエンディング - 伝説の錬金術士',
        description:
          'あなたはエリクサーの調合に成功し、伝説の錬金術士として歴史に名を刻みました。アカデミーの主席として卒業し、王宮錬金術士の称号を授かりました。',
      };
    }

    if (state.alchemyLevel >= 15 && state.reputation >= 60) {
      return {
        type: 'master',
        title: '一流錬金術士',
        description:
          '優れた技術と評判を獲得したあなたは、一流の錬金術士として認められました。多くの弟子があなたの元で学ぶことを望んでいます。',
      };
    }

    if (state.money >= 100000) {
      return {
        type: 'merchant',
        title: '商売上手',
        description:
          '錬金術よりも商才に長けていたあなた。莫大な財を築き、錬金術ショップを経営することになりました。',
      };
    }

    if (state.alchemyLevel >= 10) {
      return {
        type: 'graduate',
        title: '見習い卒業',
        description:
          'アカデミーの課程を無事修了しました。まだまだ学ぶことは多いですが、一人前の錬金術士として認められました。',
      };
    }

    return {
      type: 'fail',
      title: '落第',
      description:
        '残念ながら、錬金術の技術が十分に身につきませんでした。来年もう一度挑戦してみましょう...',
    };
  }

  $: ending = getEnding();

  function handleRestart() {
    resetGame();
  }
</script>

<div class="ending-screen" class:true={ending.type === 'true'}
     class:master={ending.type === 'master'}
     class:merchant={ending.type === 'merchant'}
     class:graduate={ending.type === 'graduate'}
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
