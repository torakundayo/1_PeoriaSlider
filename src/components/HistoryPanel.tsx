import { useMemo } from 'react';
import type { SavedCompetition } from '../types';
import { calculateAllResults } from '../utils/calculation';
import './HistoryPanel.css';

interface HistoryPanelProps {
  history: SavedCompetition[];
  onLoad: (competition: SavedCompetition) => void;
  onDelete: (id: string) => void;
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${day}`;
}

export function HistoryPanel({ history, onLoad, onDelete }: HistoryPanelProps) {
  // pre-computed summary を使い、古いデータのみ再計算（後方互換性）
  const summaries = useMemo(() => {
    return history.map(comp => {
      if (comp.summary) {
        const { playerCount, winnerName, winnerNet } = comp.summary;
        return {
          id: comp.id,
          winner: winnerName ? `${winnerName} (Net ${winnerNet?.toFixed(1)})` : null,
          playerCount,
        };
      }
      // 後方互換: summary がない古いデータ
      const results = calculateAllResults(comp.players, comp.config);
      const winner = results.find(r => r.rank === 1);
      return {
        id: comp.id,
        winner: winner ? `${winner.playerName} (Net ${winner.net.toFixed(1)})` : null,
        playerCount: comp.players.filter(
          p => p.scores.length === 18 && p.scores.every(s => s > 0)
        ).length,
      };
    });
  }, [history]);

  if (history.length === 0) {
    return (
      <div className="history-panel">
        <h2>コンペ履歴</h2>
        <p className="no-history">
          保存されたコンペはありません。<br />
          順位表タブから結果を保存できます。
        </p>
      </div>
    );
  }

  return (
    <div className="history-panel">
      <h2>コンペ履歴</h2>
      <div className="history-list">
        {history.map((comp, index) => {
          const summary = summaries[index];
          return (
            <div key={comp.id} className="history-card">
              <div className="history-card-header">
                <span className="history-name">{comp.name}</span>
                <div className="history-actions">
                  <button
                    className="btn-load"
                    onClick={() => {
                      if (confirm('現在の作業データが上書きされます。復元しますか？')) {
                        onLoad(comp);
                      }
                    }}
                  >
                    復元
                  </button>
                  <button
                    className="btn-delete"
                    onClick={() => {
                      if (confirm(`「${comp.name}」を削除しますか？`)) {
                        onDelete(comp.id);
                      }
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
              <div className="history-card-meta">
                <span>{formatDate(comp.date)}</span>
                <span>{summary.playerCount}名参加</span>
                {summary.winner && <span>優勝: {summary.winner}</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
