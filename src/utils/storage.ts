import type { AppState, CompetitionConfig, SavedCompetition } from '../types';
import { DEFAULT_CONFIG } from '../types';

const STORAGE_KEY = 'peoria-slider-data';
const HISTORY_KEY = 'peoria-slider-history';

/**
 * アプリケーションの状態をlocalStorageに保存
 */
export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save state to localStorage:', error);
  }
}

/**
 * localStorageからアプリケーションの状態を読み込み
 */
export function loadState(): AppState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return null;

    const parsed = JSON.parse(data) as AppState;

    // データ検証
    if (!isValidConfig(parsed.config) || !Array.isArray(parsed.players)) {
      return null;
    }

    return parsed;
  } catch (error) {
    console.error('Failed to load state from localStorage:', error);
    return null;
  }
}

/**
 * 設定データの妥当性をチェック
 */
function isValidConfig(config: unknown): config is CompetitionConfig {
  if (!config || typeof config !== 'object') return false;

  const c = config as CompetitionConfig;

  return (
    Array.isArray(c.par) &&
    c.par.length === 18 &&
    Array.isArray(c.hiddenHoles) &&
    typeof c.hiddenWeight === 'number' &&
    typeof c.multiplier === 'number' &&
    c.limits &&
    typeof c.limits.doubleParCut === 'boolean' &&
    typeof c.limits.maxHdcp === 'number' &&
    (c.roundingMode === 'round' || c.roundingMode === 'floor' || c.roundingMode === 'ceil')
  );
}

/**
 * 状態をクリア
 */
export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear state from localStorage:', error);
  }
}

/**
 * デフォルト状態を取得
 */
export function getDefaultState(): AppState {
  return {
    config: { ...DEFAULT_CONFIG },
    players: []
  };
}

/**
 * 状態をJSONとしてエクスポート
 */
export function exportToJson(state: AppState): string {
  return JSON.stringify(state, null, 2);
}

/**
 * JSONから状態をインポート
 */
export function importFromJson(json: string): AppState | null {
  try {
    const parsed = JSON.parse(json) as AppState;
    if (!isValidConfig(parsed.config) || !Array.isArray(parsed.players)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * コンペ履歴を読み込み
 */
export function loadHistory(): SavedCompetition[] {
  try {
    const data = localStorage.getItem(HISTORY_KEY);
    if (!data) return [];

    const parsed = JSON.parse(data) as SavedCompetition[];
    if (!Array.isArray(parsed)) return [];

    return parsed.filter(
      c => c.id && c.name && c.date && isValidConfig(c.config) && Array.isArray(c.players)
    );
  } catch (error) {
    console.error('Failed to load history from localStorage:', error);
    return [];
  }
}

/**
 * コンペを履歴に保存（先頭に追加）
 */
export function saveCompetition(competition: SavedCompetition): void {
  try {
    const history = loadHistory();
    history.unshift(competition);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save competition to localStorage:', error);
  }
}

/**
 * コンペを履歴から削除
 */
export function deleteCompetition(id: string): void {
  try {
    const history = loadHistory();
    const updated = history.filter(c => c.id !== id);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to delete competition from localStorage:', error);
  }
}
