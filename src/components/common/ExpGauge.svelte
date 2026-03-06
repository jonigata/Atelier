<script lang="ts">
  import AnimatedGauge from './AnimatedGauge.svelte';
  import { buildExpGaugeData, type ExpType } from '$lib/data/balance';

  /** 経験値の種別 */
  export let type: ExpType;
  /** 変動前の累計経験値 */
  export let totalBefore: number;
  /** 変動後の累計経験値 */
  export let totalAfter: number;

  const COLOR_MAP: Record<ExpType, 'blue' | 'gold' | 'green'> = {
    alchemy: 'blue',
    reputation: 'gold',
    village: 'green',
  };

  $: gaugeData = buildExpGaugeData(type, totalBefore, totalAfter);
  $: gained = totalAfter - totalBefore;
  $: color = COLOR_MAP[type];
</script>

<AnimatedGauge
  before={gaugeData.before}
  after={gaugeData.after}
  max={gaugeData.max}
  label={gaugeData.label}
  text="+{gained} Exp"
  {color}
  segments={gaugeData.segments}
  subtext={gaugeData.subtext ?? ''}
/>
