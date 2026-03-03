<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, markInventoryOpened, skipPresentation } from '$lib/stores/game';
  import { initializeGame } from '$lib/services/gameLoop';
  import { autoLoad, clearAutoSave, saveIndicator } from '$lib/services/saveLoad';
  import { initializeActiveGoalTracking } from '$lib/services/achievement';
  import { processActionComplete } from '$lib/services/presentation';
  import { initBgm } from '$lib/stores/bgm';
  import HUD from '../components/HUD.svelte';
  import MessageLog from '../components/MessageLog.svelte';
  import MorningPanel from '../components/MorningPanel.svelte';
  import ActionMenu from '../components/ActionMenu.svelte';
  import ActionPanel from '../components/ActionPanel.svelte';
  import EndingScreen from '../components/EndingScreen.svelte';
  import EventDialog from '../components/EventDialog.svelte';
  import ConfirmDialog from '../components/ConfirmDialog.svelte';
  import DayTransition from '../components/DayTransition.svelte';
  import InspectionCutscene from '../components/InspectionCutscene.svelte';
  import DrawDialog from '../components/DrawDialog.svelte';
  import ExpeditionReturnDialog from '../components/ExpeditionReturnDialog.svelte';
  import DebugPanel from '../components/DebugPanel.svelte';
  import SaveLoadSidebar from '../components/SaveLoadSidebar.svelte';
  import ToastContainer from '../components/ToastContainer.svelte';
  import TalkBanner from '../components/TalkBanner.svelte';
  import { dev } from '$app/environment';
  import type { ActionType } from '$lib/models/types';

  let selectedAction: ActionType | null = null;
  let initialAlbumTab: 'items' | 'achievements' | 'scores' | 'ranking' = 'items';

  function handleScoreClick() {
    initialAlbumTab = 'scores';
    selectedAction = 'album';
  }

  onMount(() => {
    // URLパラメータで本番セーブ削除
    const params = new URLSearchParams(window.location.search);
    if (params.get('clearSave') === 'true') {
      clearAutoSave();
    }

    const loaded = autoLoad();
    if (loaded) {
      initializeActiveGoalTracking();
    } else {
      initializeGame();
    }

    // URLパラメータで演出スキップを制御
    if (params.get('skipPresentation') === 'true') {
      skipPresentation.set(true);
    }

    // BGM再生
    const cleanupBgm = initBgm();

    // ブラウザの戻る/進むナビゲーションを全て防止
    // (マウスサイドボタン、ブラウザボタン、Alt+←等すべて対応)
    history.pushState(null, '', location.href);
    const preventNav = () => {
      history.pushState(null, '', location.href);
    };
    window.addEventListener('popstate', preventNav);

    return () => {
      window.removeEventListener('popstate', preventNav);
      cleanupBgm();
    };
  });

  async function handleActionSelect(action: ActionType) {
    if (action !== 'album') initialAlbumTab = 'items';
    selectedAction = action;
    if (action === 'inventory') {
      markInventoryOpened();
      await processActionComplete();
    }
  }

  async function handleBackToMenu(opts?: { skipMilestoneCheck?: boolean }) {
    selectedAction = null;
    if (!opts?.skipMilestoneCheck) {
      // アクション完了後にアチーブメント進行をチェック
      await processActionComplete();
    }
  }
</script>

<svelte:head>
  <title>コレットの村おこし工房</title>
</svelte:head>

<div class="game-container">
  {#if $gameState.phase === 'ending'}
    <EndingScreen />
  {:else}
    <HUD onScoreClick={handleScoreClick} />

    <main class="main-panel">
      {#if $gameState.phase === 'morning'}
        <MorningPanel />
      {:else if $gameState.phase === 'action'}
        {#if selectedAction === null}
          <ActionMenu onSelect={handleActionSelect} />
        {:else}
          <ActionPanel action={selectedAction} onBack={handleBackToMenu} {initialAlbumTab} />
        {/if}
      {/if}
    </main>

    {#if $gameState.phase === 'action' && selectedAction === null}
      <TalkBanner />
    {/if}

    <MessageLog />
  {/if}

  <!-- 日数経過フィードバック -->
  <DayTransition />

  <!-- 査察カットシーン -->
  <InspectionCutscene />

  <!-- ドローダイアログ -->
  <DrawDialog />

  <!-- 確認ダイアログ -->
  <ConfirmDialog />

  <!-- 派遣帰還ダイアログ -->
  <ExpeditionReturnDialog />

  <!-- イベントダイアログ（最前面） -->
  <EventDialog />

  <!-- デバッグパネル -->
  {#if dev}
    <DebugPanel />
  {/if}

  <!-- オートセーブインジケータ -->
  {#if $saveIndicator}
    <div class="save-indicator">{$saveIndicator}</div>
  {/if}
</div>

<!-- セーブ・ロードサイドバー（左側） -->
{#if dev}
  <SaveLoadSidebar />
{/if}

<!-- トースト通知（メイン画面に合わせて配置） -->
<ToastContainer />

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
    background: #0a0a14;
    user-select: none;
    -webkit-user-select: none;
  }

  .game-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
    max-width: 960px;
    margin: 0 auto;
    box-shadow: 0 0 40px rgba(0, 0, 0, 0.5);
  }

  .main-panel {
    flex: 1;
    overflow-y: auto;
    min-height: 0;
  }

  .save-indicator {
    position: fixed;
    bottom: 12px;
    right: 12px;
    padding: 0.3rem 0.7rem;
    background: rgba(0, 0, 0, 0.6);
    color: #8a8aa0;
    font-size: 0.75rem;
    border-radius: 4px;
    pointer-events: none;
    z-index: 500;
    animation: saveFlash 1.5s ease-out forwards;
  }

  @keyframes saveFlash {
    0% { opacity: 0; }
    15% { opacity: 1; }
    70% { opacity: 1; }
    100% { opacity: 0; }
  }

  /* 広い画面での背景 */
  @media (min-width: 960px) {
    :global(body) {
      background: #0a0a14;
    }
  }
</style>
