<script lang="ts">
  export let defaultNickname: string = '';
  export let onSubmit: (nickname: string) => void;
  export let onCancel: () => void;
  export let submitting: boolean = false;

  let nickname = defaultNickname;

  function handleSubmit() {
    onSubmit(nickname.trim() || '名無しの錬金術師');
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !submitting) {
      handleSubmit();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
<div class="overlay" on:click|self={onCancel}>
  <div class="modal">
    <h3>ランキングに登録</h3>
    <p class="hint">ニックネームを入力してください（最大12文字）</p>
    <input
      type="text"
      bind:value={nickname}
      maxlength="12"
      placeholder="名無しの錬金術師"
      disabled={submitting}
      on:keydown={handleKeydown}
    />
    <div class="char-count">{nickname.length} / 12</div>
    <div class="buttons">
      <button class="cancel-btn" on:click={onCancel} disabled={submitting}>
        キャンセル
      </button>
      <button class="submit-btn" on:click={handleSubmit} disabled={submitting}>
        {#if submitting}
          送信中...
        {:else}
          登録する
        {/if}
      </button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: var(--z-modal);
  }

  .modal {
    background: #1e1e3a;
    border: 2px solid #c9a959;
    border-radius: 12px;
    padding: 2rem;
    max-width: 360px;
    width: 90%;
    text-align: center;
  }

  h3 {
    color: #f4e4bc;
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }

  .hint {
    color: #a0a0b0;
    font-size: 0.85rem;
    margin-bottom: 1rem;
  }

  input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    font-size: 1rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    color: #e0e0f0;
    text-align: center;
    box-sizing: border-box;
  }

  input:focus {
    outline: none;
    border-color: #c9a959;
  }

  input:disabled {
    opacity: 0.5;
  }

  .char-count {
    color: #606080;
    font-size: 0.75rem;
    margin-top: 0.25rem;
    text-align: right;
  }

  .buttons {
    display: flex;
    gap: 0.75rem;
    margin-top: 1.25rem;
    justify-content: center;
  }

  .cancel-btn {
    padding: 0.5rem 1.25rem;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid #4a4a6a;
    border-radius: 6px;
    color: #c0c0d0;
    cursor: pointer;
  }

  .cancel-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
  }

  .submit-btn {
    padding: 0.5rem 1.25rem;
    background: linear-gradient(135deg, #8b6914 0%, #c9a959 100%);
    border: none;
    border-radius: 6px;
    color: #1a1a2e;
    font-weight: bold;
    cursor: pointer;
  }

  .submit-btn:hover:not(:disabled) {
    box-shadow: 0 2px 8px rgba(201, 169, 89, 0.4);
  }

  .submit-btn:disabled,
  .cancel-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
