import type { CompetitionConfig, Player, CalculationResult } from '../types';

/**
 * ダブルパーカットを適用したスコアを取得
 */
function applyDoubleParCut(score: number, par: number, enabled: boolean): number {
  if (!enabled) return score;
  const maxScore = par * 2;
  return Math.min(score, maxScore);
}

/**
 * 隠しホールの合計スコアを計算（ダブルパーカット適用後）
 */
function calculateHiddenTotal(
  scores: number[],
  hiddenHoles: number[],
  par: number[],
  doubleParCut: boolean
): number {
  return hiddenHoles.reduce((total, holeIndex) => {
    if (holeIndex >= 0 && holeIndex < scores.length) {
      const score = scores[holeIndex];
      const holePar = par[holeIndex];
      return total + applyDoubleParCut(score, holePar, doubleParCut);
    }
    return total;
  }, 0);
}

/**
 * コースパーの合計を計算
 */
function calculateCoursePar(par: number[]): number {
  return par.reduce((sum, p) => sum + p, 0);
}

/**
 * 端数処理を適用
 */
function applyRounding(value: number, mode: 'round' | 'floor' | 'ceil'): number {
  // 小数第二位で処理して小数第一位まで表示
  const multiplied = value * 10;
  let rounded: number;

  switch (mode) {
    case 'floor':
      rounded = Math.floor(multiplied);
      break;
    case 'ceil':
      rounded = Math.ceil(multiplied);
      break;
    case 'round':
    default:
      rounded = Math.round(multiplied);
      break;
  }

  return rounded / 10;
}

/**
 * ハンディキャップを計算
 * HDCP = (隠しホールスコア合計 × 重み - コースPar) × 係数
 */
function calculateHdcp(
  hiddenTotal: number,
  hiddenWeight: number,
  coursePar: number,
  multiplier: number,
  maxHdcp: number,
  roundingMode: 'round' | 'floor' | 'ceil'
): number {
  const rawHdcp = (hiddenTotal * hiddenWeight - coursePar) * multiplier;
  const roundedHdcp = applyRounding(rawHdcp, roundingMode);

  // HDCP上限を適用（負のHDCPは許可）
  return Math.min(roundedHdcp, maxHdcp);
}

/**
 * グロススコアの合計を計算
 */
function calculateGross(scores: number[]): number {
  return scores.reduce((sum, s) => sum + s, 0);
}

/**
 * 単一プレイヤーの計算結果を取得
 */
export function calculatePlayerResult(
  player: Player,
  config: CompetitionConfig
): Omit<CalculationResult, 'rank' | 'previousRank'> {
  const gross = calculateGross(player.scores);
  const hiddenTotal = calculateHiddenTotal(
    player.scores,
    config.hiddenHoles,
    config.par,
    config.limits.doubleParCut
  );
  const coursePar = calculateCoursePar(config.par);
  const hdcp = calculateHdcp(
    hiddenTotal,
    config.hiddenWeight,
    coursePar,
    config.multiplier,
    config.limits.maxHdcp,
    config.roundingMode
  );
  const net = gross - hdcp;

  return {
    playerId: player.id,
    playerName: player.name,
    gross,
    hiddenTotal,
    hdcp,
    net
  };
}

/**
 * 順位付けのための比較関数
 * 優先順位: 1. Net（昇順）2. HDCP（昇順）3. 年齢（降順、年長者勝ち）4. Gross（昇順）
 */
function compareResults(
  a: Omit<CalculationResult, 'rank' | 'previousRank'>,
  b: Omit<CalculationResult, 'rank' | 'previousRank'>,
  players: Player[]
): number {
  // 1. Net スコア（昇順）
  if (a.net !== b.net) {
    return a.net - b.net;
  }

  // 2. HDCP（昇順：ハンデが少ない方が実力上位）
  if (a.hdcp !== b.hdcp) {
    return a.hdcp - b.hdcp;
  }

  // 3. 年齢（降順：年長者勝ち）
  const playerA = players.find(p => p.id === a.playerId);
  const playerB = players.find(p => p.id === b.playerId);
  const ageA = playerA?.age ?? 0;
  const ageB = playerB?.age ?? 0;
  if (ageA !== ageB) {
    return ageB - ageA; // 年長者が上位
  }

  // 4. Gross スコア（昇順）
  return a.gross - b.gross;
}

/**
 * 全プレイヤーの計算結果と順位を取得
 */
export function calculateAllResults(
  players: Player[],
  config: CompetitionConfig,
  previousResults?: CalculationResult[]
): CalculationResult[] {
  // 各プレイヤーの計算結果を取得
  const results = players
    .filter(p => p.scores.length === 18 && p.scores.every(s => s > 0))
    .map(player => calculatePlayerResult(player, config));

  // ソート
  const sorted = [...results].sort((a, b) => compareResults(a, b, players));

  // 順位を付与（同点は同順位）
  let currentRank = 1;
  const rankedResults: CalculationResult[] = sorted.map((result, index) => {
    if (index > 0) {
      const prev = sorted[index - 1];
      // 完全に同じ場合のみ同順位
      if (
        result.net === prev.net &&
        result.hdcp === prev.hdcp &&
        result.gross === prev.gross
      ) {
        // 同順位を維持
      } else {
        currentRank = index + 1;
      }
    }

    // 前回の順位を取得（アニメーション用）
    const previousResult = previousResults?.find(r => r.playerId === result.playerId);

    return {
      ...result,
      rank: currentRank,
      previousRank: previousResult?.rank
    };
  });

  return rankedResults;
}

/**
 * BB賞（ブービー賞、最下位から2番目）の順位を取得
 */
export function getBoobyRank(results: CalculationResult[]): number | null {
  if (results.length < 2) return null;
  const sortedByRank = [...results].sort((a, b) => b.rank - a.rank);
  // 最下位から2番目
  return sortedByRank[1]?.rank ?? null;
}

/**
 * ランダムに隠しホールを選択（新ペリア標準：OUT/IN各6ホール）
 */
export function generateRandomHiddenHoles(): number[] {
  const outHoles = [0, 1, 2, 3, 4, 5, 6, 7, 8]; // 0-8 (holes 1-9)
  const inHoles = [9, 10, 11, 12, 13, 14, 15, 16, 17]; // 9-17 (holes 10-18)

  // Fisher-Yates shuffle
  const shuffle = (arr: number[]): number[] => {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  };

  const selectedOut = shuffle(outHoles).slice(0, 6);
  const selectedIn = shuffle(inHoles).slice(0, 6);

  return [...selectedOut, ...selectedIn].sort((a, b) => a - b);
}
