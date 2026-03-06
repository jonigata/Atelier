import { get } from 'svelte/store';
import { gameState, addMessage, setStamina, skipPresentation } from '$lib/stores/game';
import { endTurn } from '$lib/services/gameLoop';
import { selectRestEvent, resolveRestEventRewards, applyRestEventRewards } from '$lib/services/restEvent';
import { showDrawsForLevelUp } from '$lib/services/drawEvent';
import type { RestEventDef, ResolvedReward } from '$lib/data/restEvents';

export interface RestSequenceUI {
	/** 全画面黒背景を表示（DayTransition に引き継ぐまで維持） */
	showBackdrop(): void;
	/** イベントダイアログを表示し、ユーザーが閉じたら resolve */
	showEventDialog(event: RestEventDef, rewards: ResolvedReward[]): Promise<void>;
	/** イベントダイアログを DOM から除去 */
	hideEventDialog(): void;
	/** 黒背景の上でビデオを再生し、終了したら resolve */
	playVideo(): Promise<void>;
	/** アクションパネルに戻る（RestPanel unmount → 黒背景も消える） */
	leave(): void;
}

/**
 * 「休息する」ボタンから次の日の朝まで、全シーケンスを順序制御する。
 *
 * 画面遷移:
 *   黒背景ON → ダイアログ → ドロー → ビデオ → 黒背景維持 → endTurn
 *   → DayTransition(z-1100) が上に乗る → leave() で RestPanel unmount
 */
export async function executeRest(ui: RestSequenceUI): Promise<void> {
	// --- イベント選出＆報酬確定 ---
	const event = selectRestEvent();
	const rewards = resolveRestEventRewards(event);
	const drawInfos = applyRestEventRewards(event, rewards);

	if (!get(skipPresentation)) {
		// 1. 黒背景ON（以降 RestPanel unmount まで維持）
		ui.showBackdrop();

		// 2. イベントダイアログ表示 → ユーザーが閉じるまで待機
		await ui.showEventDialog(event, rewards);
		ui.hideEventDialog();
	}

	// --- 体力回復（全快） ---
	const state = get(gameState);
	setStamina(state.maxStamina);
	addMessage('休息しました。体力が全回復しました。');

	// --- ドロー表示（ムービーの前に実行） ---
	if (drawInfos.village)
		await showDrawsForLevelUp('facility', drawInfos.village);
	if (drawInfos.reputation)
		await showDrawsForLevelUp('helper', drawInfos.reputation);

	if (!get(skipPresentation)) {
		// 3. ビデオ再生 → 終了まで待機（黒背景の上で再生）
		await ui.playVideo();
		// ビデオ終了後も黒背景は維持 → DayTransition までつなぐ
	}

	// --- ターン終了（DayTransition が z-1100 で画面を覆う） ---
	// rest-backdrop(z-1000)をDayTransition完了まで維持し、
	// フェードイン中に背景が透けるのを防ぐ
	await endTurn(1);

	// endTurn内でエンディングに移行した場合はleaveしない
	// （processActionComplete が ending 中に走るのを防ぐ）
	if (get(gameState).phase === 'ending') return;

	// endTurn内でDayTransition完了→setPhase('morning')済み
	// RestPanelはphase変更で既にアンマウントされているが、念のためleave
	ui.leave();
}
