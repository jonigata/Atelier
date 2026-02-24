<script lang="ts">
  import {
    pendingVillageLevelUp,
    pendingReputationLevelUp,
    gameState,
    skipPresentation,
    toggleSkipPresentation,
  } from '$lib/stores/game';
  import DrawDialog from '../../../components/DrawDialog.svelte';

  // 所持施設をクリアして全施設が出るようにする
  function clearFacilities() {
    gameState.update((s) => ({ ...s, villageFacilities: [] }));
  }

  // 所持助手をクリアして全助手NEWが出るようにする
  function clearHelpers() {
    gameState.update((s) => ({ ...s, ownedHelpers: [] }));
  }

  // 助手を1匹レベル1で追加（レベルアップパターン確認用）
  function addSomeHelpers() {
    gameState.update((s) => ({
      ...s,
      ownedHelpers: [
        { helperId: 'coron', level: 1 },
        { helperId: 'goro', level: 2 },
        { helperId: 'sylph', level: 3 },
      ],
    }));
  }

  function triggerFacilityDraw() {
    pendingVillageLevelUp.set({ oldLevel: 1, newLevel: 2 });
  }

  function triggerHelperDraw() {
    pendingReputationLevelUp.set({ oldLevel: 1, newLevel: 2 });
  }

  $: facilities = $gameState.villageFacilities;
  $: helpers = $gameState.ownedHelpers;
</script>

<div class="test-page">
  <h1>DrawDialog 演出テスト</h1>

  <section class="controls">
    <h2>施設ドロー</h2>
    <div class="btn-row">
      <button on:click={clearFacilities}>施設クリア</button>
      <button class="primary" on:click={triggerFacilityDraw}>施設ドロー発動</button>
    </div>
    <p class="info">所持施設: {facilities.length === 0 ? 'なし' : facilities.join(', ')}</p>
  </section>

  <section class="controls">
    <h2>助手ドロー</h2>
    <div class="btn-row">
      <button on:click={clearHelpers}>助手クリア</button>
      <button on:click={addSomeHelpers}>助手セット (Lv1/2/MAX)</button>
      <button class="primary" on:click={triggerHelperDraw}>助手ドロー発動</button>
    </div>
    <p class="info">所持助手: {helpers.length === 0 ? 'なし' : helpers.map(h => `${h.helperId} Lv.${h.level}`).join(', ')}</p>
  </section>

  <section class="controls">
    <h2>演出設定</h2>
    <label class="checkbox-label">
      <input type="checkbox" checked={$skipPresentation} on:change={toggleSkipPresentation} />
      演出スキップ
    </label>
  </section>

  <section class="controls">
    <h2>テスト手順</h2>
    <ol>
      <li>「施設クリア」→「施設ドロー発動」でフル演出を確認</li>
      <li>バッジpop-in → カード裏面スライドイン → 3Dフリップ → カード選択</li>
      <li>フリップ完了前にカードをクリックしても反応しないことを確認</li>
      <li>選択後: 他カードフェード + 結果テキスト表示 → 自動閉じ</li>
      <li>「助手セット」→「助手ドロー発動」でNEW/Lv.UP/MAX混在を確認</li>
      <li>「演出スキップ」ONで即座に選択待ちになることを確認</li>
    </ol>
  </section>
</div>

<DrawDialog />

<style>
  .test-page {
    max-width: 600px;
    margin: 2rem auto;
    padding: 1rem;
    font-family: sans-serif;
    color: #e0e0e0;
    background: #1a1a2e;
    min-height: 100vh;
  }

  h1 {
    font-size: 1.4rem;
    color: #f4e4bc;
    border-bottom: 1px solid #4a4a6a;
    padding-bottom: 0.5rem;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.1rem;
    color: #c0c0d0;
    margin-bottom: 0.5rem;
  }

  .controls {
    background: #2a2a3e;
    border: 1px solid #4a4a6a;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
  }

  .btn-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  button {
    padding: 0.5rem 1rem;
    border: 1px solid #6a6a8a;
    border-radius: 6px;
    background: #3a3a5e;
    color: #e0e0e0;
    cursor: pointer;
    font-size: 0.9rem;
  }

  button:hover {
    background: #4a4a6e;
  }

  button.primary {
    background: #2e7d32;
    border-color: #4caf50;
    color: #fff;
    font-weight: bold;
  }

  button.primary:hover {
    background: #388e3c;
  }

  .info {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    color: #808090;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
  }

  ol {
    padding-left: 1.5rem;
    line-height: 1.8;
    font-size: 0.9rem;
    color: #a0a0b0;
  }
</style>
