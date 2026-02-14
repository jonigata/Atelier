<script lang="ts">
  import AlchemyPanel from './AlchemyPanel.svelte';
  import ExpeditionPanel from './ExpeditionPanel.svelte';
  import ShopPanel from './ShopPanel.svelte';
  import QuestPanel from './QuestPanel.svelte';
  import InventoryPanel from './InventoryPanel.svelte';
  import AlbumPanel from './AlbumPanel.svelte';
  import RestPanel from './RestPanel.svelte';
  import StudyPanel from './StudyPanel.svelte';
  import TravelingMerchantPanel from './TravelingMerchantPanel.svelte';
  import type { ActionType } from '$lib/models/types';

  export let action: ActionType;
  export let onBack: () => void;
</script>

{#if action === 'alchemy'}
  <AlchemyPanel {onBack} />
{:else if action === 'quest'}
  <QuestPanel {onBack} />
{:else if action === 'expedition'}
  <ExpeditionPanel {onBack} />
{:else if action === 'shop'}
  <ShopPanel {onBack} />
{:else if action === 'inventory'}
  <InventoryPanel {onBack} />
{:else if action === 'album'}
  <AlbumPanel {onBack} />
{:else if action === 'rest'}
  <RestPanel {onBack} />
{:else if action === 'study'}
  <StudyPanel {onBack} />
{:else if action === 'traveling_merchant'}
  <TravelingMerchantPanel {onBack} />
{/if}
