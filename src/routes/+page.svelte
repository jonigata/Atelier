<script lang="ts">
  import { onMount } from 'svelte';
  import { gameState } from '$lib/stores/game';
  import { initializeGame } from '$lib/services/gameLoop';
  import { checkMilestoneProgress } from '$lib/services/tutorial';
  import HUD from '../components/HUD.svelte';
  import MessageLog from '../components/MessageLog.svelte';
  import MorningPanel from '../components/MorningPanel.svelte';
  import ActionMenu from '../components/ActionMenu.svelte';
  import ActionPanel from '../components/ActionPanel.svelte';
  import EndingScreen from '../components/EndingScreen.svelte';
  import TutorialDialogue from '../components/TutorialDialogue.svelte';
  import type { ActionType } from '$lib/models/types';

  let selectedAction: ActionType | null = null;

  onMount(() => {
    initializeGame();
  });

  function handleActionSelect(action: ActionType) {
    selectedAction = action;
  }

  function handleBackToMenu() {
    selectedAction = null;
    // アクション完了後にチュートリアル進行をチェック
    checkMilestoneProgress();
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

    <MessageLog />
  {/if}

  <!-- チュートリアルダイアログ（最前面） -->
  <TutorialDialogue />
</div>

<style>
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: 'Segoe UI', 'Hiragino Sans', 'Meiryo', sans-serif;
    background: #0a0a14;
  }

  .game-container {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 100%);
  }

  .main-panel {
    flex: 1;
    overflow-y: auto;
  }
</style>
