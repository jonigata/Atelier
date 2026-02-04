<script lang="ts">
  import { toasts, dismissToast } from '$lib/stores/toast';
</script>

<div class="toast-container">
  {#each $toasts as toast (toast.id)}
    <!-- svelte-ignore a11y_click_events_have_key_events a11y_no_noninteractive_element_interactions -->
    <div
      class="toast toast-{toast.type}"
      on:click={() => dismissToast(toast.id)}
      role="alert"
    >
      <div class="toast-icon">
        {#if toast.type === 'unlock'}
          <span>🔓</span>
        {:else if toast.type === 'goal_active'}
          <span>🎯</span>
        {:else if toast.type === 'goal_complete'}
          <span>🏆</span>
        {/if}
      </div>
      <div class="toast-content">
        <div class="toast-title">{toast.title}</div>
        <div class="toast-message">{toast.message}</div>
      </div>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 960px;
    z-index: 800;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
    padding-right: 1rem;
    box-sizing: border-box;
    pointer-events: none;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
    cursor: pointer;
    pointer-events: auto;
    animation: slideIn 0.3s ease-out;
    min-width: 250px;
    max-width: 350px;
  }

  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  .toast-unlock {
    background: linear-gradient(135deg, #1a3a1a 0%, #2a5a2a 100%);
    border: 2px solid #4caf50;
  }

  .toast-goal_active {
    background: linear-gradient(135deg, #1a2a3a 0%, #2a4a6a 100%);
    border: 2px solid #2196f3;
  }

  .toast-goal_complete {
    background: linear-gradient(135deg, #3a2a1a 0%, #5a4a2a 100%);
    border: 2px solid #ffc107;
  }

  .toast-icon {
    font-size: 1.5rem;
    flex-shrink: 0;
  }

  .toast-content {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
  }

  .toast-title {
    font-size: 0.8rem;
    font-weight: bold;
    color: #a0a0b0;
  }

  .toast-unlock .toast-title {
    color: #81c784;
  }

  .toast-goal_active .toast-title {
    color: #64b5f6;
  }

  .toast-goal_complete .toast-title {
    color: #ffd54f;
  }

  .toast-message {
    font-size: 0.95rem;
    color: #e0e0f0;
    line-height: 1.3;
  }
</style>
