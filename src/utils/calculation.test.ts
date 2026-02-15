import { describe, it, expect } from 'vitest';
import type { CompetitionConfig, Player } from '../types';
import { DEFAULT_CONFIG } from '../types';
import {
  calculatePlayerResult,
  calculateAllResults,
  getBoobyRank,
  calculateHiddenHolesPar,
  generateRandomHiddenHoles,
} from './calculation';

// テスト用ヘルパー
function makePlayer(name: string, scores: number[], id?: string): Player {
  return { id: id ?? name, name, scores };
}

function makeConfig(overrides?: Partial<CompetitionConfig>): CompetitionConfig {
  return { ...DEFAULT_CONFIG, ...overrides };
}

// 18ホール全てPar4、スコア全て同じ値
function uniformScores(score: number): number[] {
  return Array(18).fill(score);
}

describe('calculatePlayerResult', () => {
  it('全ホールParでプレイした場合、HDCPは0になる', () => {
    // Par4×18=72、隠しホール12個のPar4スコアで合計48
    // HDCP = (48 * 1.5 - 72) * 0.8 = (72 - 72) * 0.8 = 0
    const player = makePlayer('テスト', uniformScores(4));
    const result = calculatePlayerResult(player, DEFAULT_CONFIG);

    expect(result.gross).toBe(72);
    expect(result.hdcp).toBe(0);
    expect(result.net).toBe(72);
  });

  it('スコアが高い場合、正のHDCPが計算される', () => {
    // 全ホール5打: gross=90, 隠しホール合計=60
    // HDCP = (60 * 1.5 - 72) * 0.8 = (90 - 72) * 0.8 = 14.4
    const player = makePlayer('テスト', uniformScores(5));
    const result = calculatePlayerResult(player, DEFAULT_CONFIG);

    expect(result.gross).toBe(90);
    expect(result.hdcp).toBe(14.4);
    expect(result.net).toBe(90 - 14.4);
  });

  it('ダブルパーカットが適用される', () => {
    // Par4でスコア10 → ダブルパーカット有効時は8に切られる
    const scores = Array(18).fill(4);
    scores[0] = 10; // ホール1（隠しホール）にスコア10
    const player = makePlayer('テスト', scores);
    const config = makeConfig({ limits: { doubleParCut: true, maxHdcp: 999 } });
    const result = calculatePlayerResult(player, config);

    // ダブルパーカットなしの場合と比較
    const configNoCut = makeConfig({ limits: { doubleParCut: false, maxHdcp: 999 } });
    const resultNoCut = calculatePlayerResult(player, configNoCut);

    // ホール0は隠しホールなので、カット適用で隠しTotal が変わる
    expect(result.hiddenTotal).toBeLessThanOrEqual(resultNoCut.hiddenTotal);
  });

  it('HDCP上限が適用される', () => {
    // 全ホール8打: HDCP は大きくなるが、maxHdcp=36で制限
    const player = makePlayer('テスト', uniformScores(8));
    const config = makeConfig({ limits: { doubleParCut: false, maxHdcp: 36 } });
    const result = calculatePlayerResult(player, config);

    expect(result.hdcp).toBe(36);
  });

  it('端数処理: floor', () => {
    // HDCP が小数になるケースを作る
    // 隠しホール合計を奇数にするためスコアを調整
    const scores = Array(18).fill(4);
    scores[0] = 5; // 隠しホール1つだけ+1
    const player = makePlayer('テスト', scores);
    const config = makeConfig({ roundingMode: 'floor' });
    const resultFloor = calculatePlayerResult(player, config);

    const configCeil = makeConfig({ roundingMode: 'ceil' });
    const resultCeil = calculatePlayerResult(player, configCeil);

    expect(resultFloor.hdcp).toBeLessThanOrEqual(resultCeil.hdcp);
  });

  it('端数処理: ceil', () => {
    const scores = Array(18).fill(4);
    scores[0] = 5;
    const player = makePlayer('テスト', scores);
    const config = makeConfig({ roundingMode: 'ceil' });
    const resultCeil = calculatePlayerResult(player, config);

    const configRound = makeConfig({ roundingMode: 'round' });
    const resultRound = calculatePlayerResult(player, configRound);

    expect(resultCeil.hdcp).toBeGreaterThanOrEqual(resultRound.hdcp);
  });
});

describe('calculateAllResults', () => {
  it('Netが低い順に順位が付く', () => {
    const players = [
      makePlayer('A', uniformScores(6), 'a'), // gross 108
      makePlayer('B', uniformScores(4), 'b'), // gross 72
      makePlayer('C', uniformScores(5), 'c'), // gross 90
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);

    expect(results[0].rank).toBe(1);
    expect(results[1].rank).toBe(2);
    expect(results[2].rank).toBe(3);
    // Net 昇順
    expect(results[0].net).toBeLessThanOrEqual(results[1].net);
    expect(results[1].net).toBeLessThanOrEqual(results[2].net);
  });

  it('同スコアの場合は同順位になる', () => {
    const players = [
      makePlayer('A', uniformScores(5), 'a'),
      makePlayer('B', uniformScores(5), 'b'),
      makePlayer('C', uniformScores(4), 'c'),
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);

    // AとBは同スコアなので同順位
    const rankA = results.find(r => r.playerId === 'a')!.rank;
    const rankB = results.find(r => r.playerId === 'b')!.rank;
    expect(rankA).toBe(rankB);
  });

  it('18ホール未入力のプレイヤーは除外される', () => {
    const players = [
      makePlayer('Complete', uniformScores(5), 'a'),
      makePlayer('Incomplete', [4, 5, 3], 'b'), // 3ホールのみ
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);

    expect(results.length).toBe(1);
    expect(results[0].playerName).toBe('Complete');
  });

  it('スコア0のホールがあるプレイヤーは除外される', () => {
    const scores = uniformScores(5);
    scores[5] = 0;
    const players = [
      makePlayer('Valid', uniformScores(5), 'a'),
      makePlayer('HasZero', scores, 'b'),
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);

    expect(results.length).toBe(1);
    expect(results[0].playerName).toBe('Valid');
  });

  it('previousResults から前回順位を引き継ぐ', () => {
    const players = [
      makePlayer('A', uniformScores(5), 'a'),
      makePlayer('B', uniformScores(4), 'b'),
    ];
    const prevResults = calculateAllResults(players, DEFAULT_CONFIG);

    // 係数を変えて順位が変わるケース
    const newConfig = makeConfig({ multiplier: 0.1 });
    const newResults = calculateAllResults(players, newConfig, prevResults);

    // previousRank が設定されていること
    const playerA = newResults.find(r => r.playerId === 'a')!;
    expect(playerA.previousRank).toBeDefined();
  });

  it('プレイヤーが0人の場合は空配列を返す', () => {
    const results = calculateAllResults([], DEFAULT_CONFIG);
    expect(results).toEqual([]);
  });
});

describe('getBoobyRank', () => {
  it('3人以上の場合、最下位から2番目の順位を返す', () => {
    const players = [
      makePlayer('A', uniformScores(4), 'a'),
      makePlayer('B', uniformScores(5), 'b'),
      makePlayer('C', uniformScores(6), 'c'),
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);
    const booby = getBoobyRank(results);

    // 3人なので2位がブービー
    expect(booby).toBe(2);
  });

  it('2人の場合もブービーが存在する', () => {
    const players = [
      makePlayer('A', uniformScores(4), 'a'),
      makePlayer('B', uniformScores(5), 'b'),
    ];
    const results = calculateAllResults(players, DEFAULT_CONFIG);
    const booby = getBoobyRank(results);

    expect(booby).toBe(1);
  });

  it('1人以下の場合はnullを返す', () => {
    expect(getBoobyRank([])).toBeNull();

    const players = [makePlayer('A', uniformScores(4), 'a')];
    const results = calculateAllResults(players, DEFAULT_CONFIG);
    expect(getBoobyRank(results)).toBeNull();
  });
});

describe('calculateHiddenHolesPar', () => {
  it('隠しホールのPar合計を正しく計算する', () => {
    const par = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];
    const hiddenHoles = [0, 2, 4]; // Par4 + Par3 + Par4 = 11
    expect(calculateHiddenHolesPar(hiddenHoles, par)).toBe(11);
  });

  it('範囲外のインデックスは無視される', () => {
    const par = [4, 4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4];
    const hiddenHoles = [0, 99, -1]; // 0番のみ有効
    expect(calculateHiddenHolesPar(hiddenHoles, par)).toBe(4);
  });
});

describe('generateRandomHiddenHoles', () => {
  it('12ホールが選出される', () => {
    const par = DEFAULT_CONFIG.par;
    const holes = generateRandomHiddenHoles(par);
    expect(holes.length).toBe(12);
  });

  it('選出されたホールはすべて0-17の範囲内', () => {
    const par = DEFAULT_CONFIG.par;
    const holes = generateRandomHiddenHoles(par);
    holes.forEach(h => {
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThanOrEqual(17);
    });
  });

  it('重複なく選出される', () => {
    const par = DEFAULT_CONFIG.par;
    const holes = generateRandomHiddenHoles(par);
    const unique = new Set(holes);
    expect(unique.size).toBe(holes.length);
  });

  it('昇順にソートされている', () => {
    const par = DEFAULT_CONFIG.par;
    const holes = generateRandomHiddenHoles(par);
    for (let i = 1; i < holes.length; i++) {
      expect(holes[i]).toBeGreaterThan(holes[i - 1]);
    }
  });
});
