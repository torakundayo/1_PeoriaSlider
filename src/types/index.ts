// 設定データ (Competition Configuration)
export interface CompetitionConfig {
  par: number[];            // 18ホール分のPar [4, 4, 3, 5...]
  hiddenHoles: number[];    // 隠しホールのインデックス [0, 1, 3, 5...]
  hiddenWeight: number;     // 隠しホール倍率 (例: 1.5)
  multiplier: number;       // 変動係数 (例: 0.8)
  limits: {
    doubleParCut: boolean;  // ダブルパーカット有無
    maxHdcp: number;        // HDCP上限
  };
  roundingMode: 'round' | 'floor' | 'ceil';  // 端数処理
}

// プレイヤーデータ (Player Data)
export interface Player {
  id: string;
  name: string;
  scores: number[];         // 18ホール分のグロススコア
}

// 計算結果（View用）(Calculation Result for Display)
export interface CalculationResult {
  playerId: string;
  playerName: string;
  gross: number;
  hiddenTotal: number;      // 隠しホール合計（カット適用後）
  hdcp: number;
  net: number;
  rank: number;
  previousRank?: number;    // アニメーション用の前回順位
}

// アプリケーション全体の状態
export interface AppState {
  config: CompetitionConfig;
  players: Player[];
}

// HDCP上限の選択肢
export const HDCP_LIMIT_OPTIONS = [
  { value: 999, label: '無制限' },
  { value: 36, label: '36（男性標準）' },
  { value: 40, label: '40（女性標準）' },
  { value: 72, label: '72（ダブルカット）' },
] as const;

// デフォルト設定
export const DEFAULT_CONFIG: CompetitionConfig = {
  par: [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4], // Total Par 72
  hiddenHoles: [0, 2, 4, 6, 8, 10, 9, 11, 13, 15, 16, 17], // 12 holes (0-indexed)
  hiddenWeight: 1.5,
  multiplier: 0.8,
  limits: {
    doubleParCut: true,
    maxHdcp: 999  // 無制限
  },
  roundingMode: 'round'
};

// 保存済みコンペのサマリー（保存時に計算して保持）
export interface CompetitionSummary {
  playerCount: number;
  winnerName: string | null;
  winnerNet: number | null;
}

// 保存済みコンペデータ
export interface SavedCompetition {
  id: string;
  name: string;
  date: string;           // ISO date string (保存日時)
  config: CompetitionConfig;
  players: Player[];
  summary?: CompetitionSummary;  // optional for backward compatibility
}
