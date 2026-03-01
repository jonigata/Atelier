CREATE TABLE ranking_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '名無しの錬金術師',
  score INTEGER NOT NULL,
  ending_type TEXT NOT NULL,
  final_day INTEGER NOT NULL,
  bd_money INTEGER NOT NULL DEFAULT 0,
  bd_inventory INTEGER NOT NULL DEFAULT 0,
  bd_levels INTEGER NOT NULL DEFAULT 0,
  bd_quests INTEGER NOT NULL DEFAULT 0,
  bd_album INTEGER NOT NULL DEFAULT 0,
  bd_crafting INTEGER NOT NULL DEFAULT 0,
  bd_buildings INTEGER NOT NULL DEFAULT 0,
  save_data TEXT,
  submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_ranking_weekly ON ranking_entries (submitted_at, score DESC);
CREATE INDEX idx_ranking_total ON ranking_entries (score DESC);
CREATE INDEX idx_ranking_player ON ranking_entries (player_id, submitted_at);
