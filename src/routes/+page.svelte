<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState, markInventoryOpened, skipPresentation } from '$lib/stores/game';
  import { initializeGame } from '$lib/services/gameLoop';
  import { processActionComplete } from '$lib/services/presentation';
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
  import DebugPanel from '../components/DebugPanel.svelte';
  import SaveLoadSidebar from '../components/SaveLoadSidebar.svelte';
  import ToastContainer from '../components/ToastContainer.svelte';
  import TalkBanner from '../components/TalkBanner.svelte';
  import type { ActionType } from '$lib/models/types';

  let selectedAction: ActionType | null = null;

  onMount(() => {
    initializeGame();

    // URLパラメータで演出スキップを制御
    const params = new URLSearchParams(window.location.search);
    if (params.get('skipPresentation') === 'true') {
      skipPresentation.set(true);
    }

    // ブラウザの戻る/進むナビゲーションを全て防止
    // (マウスサイドボタン、ブラウザボタン、Alt+←等すべて対応)
    history.pushState(null, '', location.href);
    const preventNav = () => {
      history.pushState(null, '', location.href);
    };
    window.addEventListener('popstate', preventNav);

    return () => {
      window.removeEventListener('popstate', preventNav);
    };
  });

  async function handleActionSelect(action: ActionType) {
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
  <title>アトリエシミュレーター</title>
</svelte:head>

<div class="game-container">
  {#if $gameState.phase === 'ending'}
    <EndingScreen />
  {:else}
    <HUD />

    <main class="main-panel">
      {#if $gameState.phase === 'morning'}
        <MorningPanel />
      {:else if $gameState.phase === 'action'}
        {#if selectedAction === null}
          <ActionMenu onSelect={handleActionSelect} />
        {:else}
          <ActionPanel action={selectedAction} onBack={handleBackToMenu} />
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

  <!-- イベントダイアログ（最前面） -->
  <EventDialog />

  <!-- デバッグパネル -->
  <DebugPanel />
</div>

<!-- セーブ・ロードサイドバー（左側） -->
<SaveLoadSidebar />

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

  /* 広い画面での背景 */
  @media (min-width: 960px) {
    :global(body) {
      background: #0a0a14;
    }
  }
</style>
