<script lang="ts">
  import { onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import {
    gameState,
    addBuilding,
    upgradeBuilding,
    addHelper,
    upgradeHelper,
    addMessage,
    skipPresentation,
  } from '$lib/stores/game';
  import { generateBuildingChoices, generateHelperChoices } from '$lib/services/draw';
  import { showDialogueAndWait } from '$lib/services/presentation';
  import { pendingDraw, resolveDraw } from '$lib/services/drawEvent';
  import type { BuildingDef, HelperDef, EventDialogue } from '$lib/models/types';

  type DrawMode = 'none' | 'facility' | 'helper';
  type DrawPhase = 'entering' | 'cards-in' | 'flipping' | 'choosing' | 'selected' | 'result' | 'closing';

  // UI状態（テンプレート参照用）
  let drawMode: DrawMode = 'none';
  let phase: DrawPhase = 'entering';
  let facilityChoices: { def: BuildingDef; currentLevel: number }[] = [];
  let helperChoices: { def: HelperDef; currentLevel: number }[] = [];
  let selectedIndex: number = -1;
  let canInteract = false;
  let resultText = '';

  // async flow 制御
  let running = false;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let resolveSelection: ((index: number) => void) | null = null;
  let resolveResultDismiss: (() => void) | null = null;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function wait(ms: number): Promise<void> {
    return new Promise(resolve => {
      timers.push(setTimeout(resolve, ms));
    });
  }

  // 施設ごとの村長コメント
  const buildingComments: Record<string, string> = {
    herb_garden: 'おお、薬草園か！ これで毎朝新鮮な薬草が手に入るな。村の皆も喜ぶぞ',
    apiary: 'ほほう、養蜂場とは賢い選択だ。蜂蜜は万能薬の材料にもなるし、村の特産にもなる',
    mine: '採掘坑か！ あの辺りには良い鉱脈があると聞いておったんだ。楽しみだな',
    well: '井戸を掘ったか。きれいな水は錬金術の基本と聞くぞ。良い判断だ',
    market: '市場ができれば、村に商人も集まってくる。活気が出るぞぉ',
    warehouse: '倉庫があれば、採取で持ち帰れる量も増えるな。探索が捗るぞ',
    drying_shed: '乾燥小屋か。薬品の仕上がりが早くなるのは助かるなぁ',
    watermill: '水車小屋！ わしも若い頃に見たことがあるぞ。調合の精度が上がるんだったな',
    library: '図書館とは素晴らしい！ 知識は村の財産だ。勉強も捗るだろう',
    clock_tower: 'おぉ、時計塔か！ 村のシンボルになるな。これで村の評判も上がるぞ',
    clinic: '診療所ができれば、先生も安心して休めるだろう。体が資本だからな',
    meeting_hall: '集会所か！ 村の皆が集まれる場所があると、村全体が元気になるぞ',
  };

  function getResultText(index: number): string {
    if (drawMode === 'facility') {
      const c = facilityChoices[index];
      if (c.currentLevel === 0) return `🏗️ ${c.def.name}を建設！`;
      if (c.currentLevel >= c.def.maxLevel) return `（これ以上強化できない）`;
      return `⬆️ ${c.def.name}がLv.${c.currentLevel + 1}に！`;
    } else {
      const c = helperChoices[index];
      if (c.currentLevel === 0) return `🤝 ${c.def.name}が仲間になった！`;
      if (c.currentLevel >= c.def.maxLevel) return `（これ以上成長できない）`;
      return `⬆️ ${c.def.name}がLv.${c.currentLevel + 1}に！`;
    }
  }

  // ========== メインシーケンス ==========
  async function runDraw(req: { type: 'facility' | 'helper' }) {
    running = true;
    const state = get(gameState);
    const skip = get(skipPresentation);

    try {
      // --- 選択肢を生成 ---
      if (req.type === 'facility') {
        const choices = generateBuildingChoices(state.buildings);
        if (choices.length === 0) {
          addMessage('村発展度がレベルアップしたが、建設・強化できる施設がもうない');
          resolveDraw();
          return;
        }
        facilityChoices = choices;
        // 初回イントロ（オーバーレイ表示前に完了する）
        if (state.buildings.length === 0) {
          await showDialogueAndWait({
            characterName: '村長',
            characterTitle: 'フォンテ村長',
            characterFaceId: 'mayor',
            lines: [
              { text: 'おお、先生！ 村の発展度が上がったぞ！', expression: 'happy' },
              { text: '村が発展するとな、新しい施設を建てられるようになるんだ', expression: 'neutral' },
              { text: '施設にはそれぞれ違った効果がある。工房の仕事を助けてくれるものもあるし、村全体を豊かにするものもある', expression: 'neutral' },
              { text: 'さあ、どれを建てるか選んでくれ！ 村の未来は先生にかかっておるぞ', expression: 'happy' },
            ],
          });
        }
        drawMode = 'facility';
      } else {
        const choices = generateHelperChoices(state.ownedHelpers);
        if (choices.length === 0) {
          resolveDraw();
          return;
        }
        helperChoices = choices;
        // 初回イントロ
        if (state.ownedHelpers.length === 0) {
          await showDialogueAndWait({
            characterName: 'コレット',
            characterTitle: '駆け出し錬金術師',
            characterFaceId: 'heroine',
            lines: [
              { text: '……あれ？ 工房の外がなんだか騒がしい', expression: 'surprised' },
              { text: 'わっ、小さな生き物たちが集まってる……！', expression: 'surprised' },
              { text: '噂を聞いてやって来てくれたのかな。嬉しいな', expression: 'happy' },
              { text: 'よし、一緒に工房を手伝ってくれる子を選ぼう！', expression: 'determined' },
            ],
          });
        }
        drawMode = 'helper';
      }

      // --- カードアニメーション ---
      selectedIndex = -1;
      canInteract = false;
      resultText = '';

      if (!skip) {
        phase = 'entering';
        await wait(200);
        phase = 'cards-in';
        await wait(500);
        phase = 'flipping';
        await wait(400);
      }

      // --- ユーザー選択を待つ ---
      phase = 'choosing';
      canInteract = true;
      const idx = await new Promise<number>(resolve => { resolveSelection = resolve; });
      resolveSelection = null;

      // --- 選択演出 ---
      selectedIndex = idx;
      canInteract = false;
      resultText = getResultText(idx);
      phase = 'selected';

      if (!skip) {
        await wait(600);
        phase = 'result';
        // 自動閉じ or クリックで閉じる
        await Promise.race([
          wait(500),
          new Promise<void>(resolve => { resolveResultDismiss = resolve; }),
        ]);
        resolveResultDismiss = null;
      } else {
        await wait(300);
        phase = 'result';
        // スキップ時もクリック待ち
        await new Promise<void>(resolve => { resolveResultDismiss = resolve; });
        resolveResultDismiss = null;
      }

      // --- 選択を適用 ---
      let pendingGreeting: EventDialogue | null = null;

      if (req.type === 'facility') {
        const choice = facilityChoices[idx];
        if (choice.currentLevel === 0) {
          const comment = buildingComments[choice.def.id];
          if (comment) {
            pendingGreeting = {
              characterName: '村長',
              characterTitle: 'フォンテ村長',
              characterFaceId: 'mayor',
              lines: [comment],
            };
          }
          addBuilding(choice.def.id);
          addMessage(`施設「${choice.def.name}」を建設した！ ${choice.def.levels[0].effectDescription}`);
        } else if (choice.currentLevel < choice.def.maxLevel) {
          upgradeBuilding(choice.def.id);
          const newLevel = choice.currentLevel + 1;
          addMessage(`施設「${choice.def.name}」がLv.${newLevel}になった！ ${choice.def.levels[newLevel - 1].effectDescription}`);
        } else {
          addMessage(`施設「${choice.def.name}」は既にLv.MAX`);
        }
      } else {
        const choice = helperChoices[idx];
        const { def, currentLevel } = choice;
        if (currentLevel === 0) {
          addHelper(def.id);
          addMessage(`助手「${def.name}」が仲間になった！ ${def.levelEffects[0].description}`);
        } else if (currentLevel < def.maxLevel) {
          upgradeHelper(def.id);
          const newLevel = currentLevel + 1;
          addMessage(`助手「${def.name}」がLv.${newLevel}になった！ ${def.levelEffects[newLevel - 1].description}`);
        } else {
          addMessage(`助手「${def.name}」は既にLv.MAX`);
        }
        if (currentLevel < def.maxLevel && def.greetings[currentLevel]) {
          pendingGreeting = {
            characterName: def.name,
            characterTitle: def.species,
            eventImage: `/images/helpers/${def.id}.png`,
            lines: [def.greetings[currentLevel]],
          };
        }
      }

      // --- 閉じアニメーション ---
      phase = 'closing';
      if (!skip) {
        await wait(200);
      }

      // --- リセット ---
      drawMode = 'none';
      phase = 'entering';
      selectedIndex = -1;
      canInteract = false;
      resultText = '';
      facilityChoices = [];
      helperChoices = [];

      // --- 後続の挨拶ダイアログ ---
      if (pendingGreeting) {
        await showDialogueAndWait(pendingGreeting);
      }

      resolveDraw();
    } finally {
      running = false;
      clearTimers();
    }
  }

  // ========== イベントハンドラ ==========
  function handleCardSelect(index: number) {
    if (!canInteract || phase !== 'choosing' || !resolveSelection) return;
    resolveSelection(index);
  }

  function handleOverlayClick() {
    if (phase === 'result' && resolveResultDismiss) {
      resolveResultDismiss();
    }
  }

  // ========== pendingDraw 監視 ==========
  const unsubDraw = pendingDraw.subscribe((req) => {
    if (!req || running) return;
    runDraw(req);
  });

  onDestroy(() => {
    unsubDraw();
    clearTimers();
  });

  $: showCards = phase !== 'entering';
  $: flipped = phase === 'flipping' || phase === 'choosing' || phase === 'selected' || phase === 'result' || phase === 'closing';
</script>

{#if drawMode !== 'none'}
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    class="draw-overlay"
    class:closing={phase === 'closing'}
    role="dialog"
    on:click={handleOverlayClick}
    on:keydown={() => {}}
  >
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="draw-dialog" on:click={handleOverlayClick} on:keydown={() => {}}>
      <div class="draw-header">
        <span class="draw-badge" class:facility={drawMode === 'facility'} class:helper={drawMode === 'helper'}>
          {drawMode === 'facility' ? '村発展度UP!' : '名声UP!'}
        </span>
        <p class="draw-subtitle">
          {drawMode === 'facility' ? '建設する施設を1つ選んでください' : '助手を1人選んでください'}
        </p>
      </div>

      <div class="cards">
        {#if drawMode === 'facility'}
          {#each facilityChoices as choice, i}
            {@const isNew = choice.currentLevel === 0}
            {@const isMaxed = choice.currentLevel >= choice.def.maxLevel}
            {@const nextLevel = isNew ? 1 : choice.currentLevel + 1}
            {@const nextEffectDesc = isMaxed ? choice.def.levels[choice.def.maxLevel - 1].effectDescription : choice.def.levels[Math.max(0, nextLevel - 1)].effectDescription}
            {@const currentEffectDesc = choice.currentLevel > 0 ? choice.def.levels[choice.currentLevel - 1].effectDescription : ''}
            <div
              class="card-wrapper"
              class:slide-in={showCards}
              class:card-chosen={selectedIndex === i}
              class:card-unchosen={selectedIndex >= 0 && selectedIndex !== i}
              style="--card-index: {i}"
            >
              <button
                class="card-flip-container"
                class:flipped
                class:maxed={isMaxed}
                disabled={!canInteract}
                on:click={() => handleCardSelect(i)}
              >
                <!-- 裏面 -->
                <div class="card-face card-back facility-back">
                  <img class="card-back-img" src="/images/cards/facility-back.png" alt="" />
                </div>
                <!-- 表面 -->
                <div class="card-face card-front facility-card">
                  <img
                    class="card-building-img"
                    src="/images/buildings/{choice.def.id}.png"
                    alt={choice.def.name}
                  />
                  <div class="building-card-info">
                    <span class="card-name">{choice.def.name}</span>
                    {#if isNew}
                      <span class="card-level new">NEW</span>
                      <span class="card-effect-overlay">{nextEffectDesc}</span>
                    {:else if isMaxed}
                      <span class="card-level max">Lv.MAX</span>
                      <span class="card-effect-overlay dimmed">これ以上強化できない</span>
                    {:else}
                      <span class="card-level upgrade">Lv.{choice.currentLevel} → Lv.{nextLevel}</span>
                      <span class="card-effect-overlay">{currentEffectDesc}</span>
                      <span class="card-effect-arrow">↓</span>
                      <span class="card-effect-overlay upgrade-next">{nextEffectDesc}</span>
                    {/if}
                  </div>
                </div>
              </button>
              {#if selectedIndex === i && (phase === 'result' || phase === 'closing')}
                <div class="result-text">{resultText}</div>
              {/if}
            </div>
          {/each}
        {:else}
          {#each helperChoices as choice, i}
            {@const isNew = choice.currentLevel === 0}
            {@const isMaxed = choice.currentLevel >= choice.def.maxLevel}
            {@const nextLevel = isNew ? 1 : choice.currentLevel + 1}
            <div
              class="card-wrapper"
              class:slide-in={showCards}
              class:card-chosen={selectedIndex === i}
              class:card-unchosen={selectedIndex >= 0 && selectedIndex !== i}
              style="--card-index: {i}"
            >
              <button
                class="card-flip-container"
                class:flipped
                class:maxed={isMaxed}
                disabled={!canInteract}
                on:click={() => handleCardSelect(i)}
              >
                <!-- 裏面 -->
                <div class="card-face card-back helper-back">
                  <img class="card-back-img" src="/images/cards/helper-back.png" alt="" />
                </div>
                <!-- 表面 -->
                <div class="card-face card-front helper-card">
                  <img
                    class="card-helper-img"
                    src="/images/helpers/{choice.def.id}.png"
                    alt={choice.def.name}
                  />
                  <div class="helper-card-info">
                    <span class="card-name">{choice.def.name}</span>
                    {#if isNew}
                      <span class="card-level new">NEW</span>
                      <span class="card-effect-overlay">{choice.def.levelEffects[0].description}</span>
                    {:else if isMaxed}
                      <span class="card-level max">Lv.MAX</span>
                      <span class="card-effect-overlay dimmed">これ以上成長できない</span>
                    {:else}
                      <span class="card-level upgrade">Lv.{choice.currentLevel} → Lv.{nextLevel}</span>
                      <span class="card-effect-overlay">{choice.def.levelEffects[choice.currentLevel - 1].description}</span>
                      <span class="card-effect-arrow">↓</span>
                      <span class="card-effect-overlay upgrade-next">{choice.def.levelEffects[nextLevel - 1].description}</span>
                    {/if}
                  </div>
                </div>
              </button>
              {#if selectedIndex === i && (phase === 'result' || phase === 'closing')}
                <div class="result-text">{resultText}</div>
              {/if}
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* ========== Overlay ========== */
  .draw-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
    user-select: none;
    animation: overlayFadeIn 0.3s ease-out;
  }

  .draw-overlay.closing {
    animation: overlayFadeOut 0.2s ease-out forwards;
    pointer-events: none;
  }

  @keyframes overlayFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes overlayFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  /* ========== Dialog ========== */
  .draw-dialog {
    max-width: 950px;
    width: 95%;
    padding: 1.5rem;
  }

  .draw-header {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  /* ========== Badge ========== */
  .draw-badge {
    display: inline-block;
    padding: 0.5rem 1.5rem;
    border-radius: 6px;
    font-size: 1.3rem;
    font-weight: bold;
    letter-spacing: 0.1em;
    animation: badgePopIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  .draw-badge.facility {
    background: linear-gradient(135deg, #2e7d32, #4caf50);
    color: #fff;
  }

  .draw-badge.helper {
    background: linear-gradient(135deg, #1565c0, #42a5f5);
    color: #fff;
  }

  @keyframes badgePopIn {
    0% { opacity: 0; transform: scale(0.7); }
    70% { transform: scale(1.05); }
    100% { opacity: 1; transform: scale(1); }
  }

  .draw-subtitle {
    color: #c0c0d0;
    margin-top: 0.75rem;
    font-size: 1rem;
    animation: subtitleFadeIn 0.3s ease-out 0.2s both;
  }

  @keyframes subtitleFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  /* ========== Cards container ========== */
  .cards {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    perspective: 800px;
  }

  /* ========== Card wrapper (slide-in + chosen/unchosen) ========== */
  .card-wrapper {
    flex: 1;
    max-width: 280px;
    min-width: 0;
    position: relative;
    opacity: 0;
    transform: translateY(30px) scale(0.95);
    display: flex;
    flex-direction: column;
    align-items: center;
    transition: opacity 0.3s ease, transform 0.3s ease;
  }

  .card-wrapper.slide-in {
    animation: cardSlideIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
    animation-delay: calc(var(--card-index) * 0.12s);
  }

  @keyframes cardSlideIn {
    from { opacity: 0; transform: translateY(30px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .card-wrapper.card-chosen {
    opacity: 1;
    animation: cardChosen 0.2s ease both;
  }

  @keyframes cardChosen {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
    100% { opacity: 1; transform: scale(1); }
  }

  .card-wrapper.card-unchosen {
    animation: none;
    opacity: 0;
    transform: scale(0.9);
    transition: opacity 0.3s ease, transform 0.3s ease;
    pointer-events: none;
  }

  /* ========== 3D Flip container ========== */
  .card-flip-container {
    width: 100%;
    aspect-ratio: 2 / 2.8;
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    font: inherit;
    color: inherit;
  }

  .card-flip-container.flipped {
    transform: rotateY(180deg);
  }

  .card-flip-container:disabled {
    cursor: default;
    pointer-events: none;
  }

  .card-flip-container.flipped:not(:disabled):hover .card-front {
    border-color: #c9a959;
    transform: rotateY(180deg) translateY(-4px);
    box-shadow: 0 8px 24px rgba(201, 169, 89, 0.3);
  }

  .card-flip-container.maxed.flipped:not(:disabled):hover .card-front {
    border-color: #6a6a8a;
    transform: rotateY(180deg);
    box-shadow: none;
  }

  /* ========== Card faces ========== */
  .card-face {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    border-radius: 12px;
    border: 2px solid #4a4a6a;
  }

  .card-back {
    overflow: hidden;
  }

  .card-back-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .card-front {
    transform: rotateY(180deg);
    transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
  }

  /* ========== Facility card (image-based) ========== */
  .facility-card {
    overflow: hidden;
    padding: 0;
    background: #1a1a2e;
  }

  .card-building-img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center top;
  }

  .building-card-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 0.5rem 0.5rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9) 40%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .card-flip-container.maxed .card-front {
    opacity: 0.5;
  }

  /* Glow on chosen card */
  .card-chosen .card-front {
    border-color: #c9a959;
    box-shadow: 0 0 20px rgba(201, 169, 89, 0.5);
  }

  .helper-card {
    overflow: hidden;
    padding: 0;
  }

  .card-helper-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .helper-card-info {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 0.75rem 0.5rem 0.5rem;
    background: linear-gradient(transparent, rgba(0, 0, 0, 0.9) 40%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
  }

  .card-effect-overlay {
    font-size: 0.8rem;
    color: #b0d0b0;
    text-align: center;
    line-height: 1.3;
  }

  .card-effect-overlay.dimmed {
    color: #808090;
  }

  .card-effect-arrow {
    font-size: 0.8rem;
    color: #c9a959;
    line-height: 1;
  }

  .card-effect-overlay.upgrade-next {
    color: #90ee90;
  }

  .card-name {
    font-size: 1.1rem;
    font-weight: bold;
    color: #f4e4bc;
    white-space: nowrap;
  }

  .card-level {
    font-size: 0.85rem;
    padding: 0.2rem 0.6rem;
    border-radius: 4px;
    font-weight: bold;
  }

  .card-level.new {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
    border: 1px solid rgba(255, 215, 0, 0.4);
  }

  .card-level.upgrade {
    background: rgba(66, 165, 245, 0.2);
    color: #42a5f5;
    border: 1px solid rgba(66, 165, 245, 0.4);
  }

  .card-level.max {
    background: rgba(128, 128, 144, 0.2);
    color: #808090;
    border: 1px solid rgba(128, 128, 144, 0.4);
  }

  /* ========== Result text ========== */
  .result-text {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 0.75rem;
    font-size: 1rem;
    font-weight: bold;
    color: #f4e4bc;
    text-align: center;
    white-space: nowrap;
    animation: resultFadeIn 0.4s ease-out both;
  }

  @keyframes resultFadeIn {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

</style>
