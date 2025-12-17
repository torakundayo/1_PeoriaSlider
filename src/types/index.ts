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
  age?: number;             // 年齢（オプション、同点時の順位決定用）
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

// 新ペリア標準の12ホール配置（OUT/IN各6ホール）
export const DEFAULT_HIDDEN_HOLES = [
  0, 2, 4, 6, 8, 10,    // OUT: 1, 3, 5, 7, 9, 11番ホール
  11, 13, 15, 16, 17, 18 // IN: 12, 14, 16, 17, 18番ホール
].map(i => i < 9 ? i : i - 1); // 0-indexed adjustment

// 標準的な新ペリア12ホール (1-indexed for display)
export const STANDARD_NEW_PEORIA_HOLES = [1, 3, 5, 7, 9, 11, 10, 12, 14, 16, 17, 18];

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

// ホール情報の表示用
export interface HoleInfo {
  number: number;  // 1-18
  par: number;
  isHidden: boolean;
}
