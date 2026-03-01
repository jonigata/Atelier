<script lang="ts">
  import {
    gameState,
    skipPresentation,
    toggleSkipPresentation,
  } from '$lib/stores/game';
  import { showDrawAndWait } from '$lib/services/drawEvent';
  import DrawDialog from '../../../components/DrawDialog.svelte';

  // 所持施設をクリアして全施設が出るようにする
  function clearFacilities() {
    gameState.update((s) => ({ ...s, buildings: [] }));
  }

  // 施設をいくつかセット（レベルアップパターン確認用）
  function addSomeFacilities() {
    gameState.update((s) => ({
      ...s,
      buildings: [
        { buildingId: 'herb_garden', level: 1 },
        { buildingId: 'market', level: 2 },
        { buildingId: 'watermill', level: 3 },
      ],
    }));
  }

  // 所持助手をクリアして全助手NEWが出るようにする
  function clearHelpers() {
    gameState.update((s) => ({ ...s, ownedHelpers: [] }));
  }

  // 助手をセット（レベルアップパターン確認用）
  function addSomeHelpers() {
    gameState.update((s) => ({
      ...s,
      ownedHelpers: [
        { helperId: 'coron', level: 1 },
        { helperId: 'goro', level: 4 },
        { helperId: 'sylph', level: 7 },
      ],
    }));
  }

  function triggerFacilityDraw() {
    showDrawAndWait({ type: 'facility', levelUpInfo: { oldLevel: 1, newLevel: 2 } });
  }

  function triggerHelperDraw() {
    showDrawAndWait({ type: 'helper', levelUpInfo: { oldLevel: 1, newLevel: 2 } });
  }

  $: facilities = $gameState.buildings;
  $: helpers = $gameState.ownedHelpers;
</script>

<div class="test-page">
  <h1>DrawDialog 演出テスト</h1>

  <section class="controls">
    <h2>施設ドロー</h2>
    <div class="btn-row">
      <button on:click={clearFacilities}>施設クリア</button>
      <button on:click={addSomeFacilities}>施設セット (Lv1/2/MAX)</button>
      <button class="primary" on:click={triggerFacilityDraw}>施設ドロー発動</button>
    </div>
    <p class="info">所持施設: {facilities.length === 0 ? 'なし' : facilities.map(b => `${b.buildingId} Lv.${b.level}`).join(', ')}</p>
  </section>

  <section class="controls">
    <h2>助手ドロー</h2>
    <div class="btn-row">
      <button on:click={clearHelpers}>助手クリア</button>
      <button on:click={addSomeHelpers}>助手セット (Lv1/4/MAX)</button>
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
      <li>「施設セット」→「施設ドロー発動」でNEW/Lv.UP/MAX混在を確認</li>
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
