import { useState, useRef } from 'react';
import type { Player, CompetitionConfig } from '../types';
import './PlayerInput.css';

interface PlayerInputProps {
  players: Player[];
  config: CompetitionConfig;
  onPlayersChange: (players: Player[]) => void;
}

export function PlayerInput({ players, config, onPlayersChange }: PlayerInputProps) {
  const [newPlayerName, setNewPlayerName] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const handleAddPlayer = () => {
    if (!newPlayerName.trim()) return;

    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name: newPlayerName.trim(),
      scores: Array(18).fill(0)
    };

    onPlayersChange([...players, newPlayer]);
    setNewPlayerName('');
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(players.filter(p => p.id !== playerId));
  };

  const handleScoreChange = (playerId: string, holeIndex: number, score: number) => {
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        const newScores = [...p.scores];
        newScores[holeIndex] = score;
        return { ...p, scores: newScores };
      }
      return p;
    });
    onPlayersChange(updatedPlayers);
  };

  const handleNameChange = (playerId: string, name: string) => {
    const updatedPlayers = players.map(p => {
      if (p.id === playerId) {
        return { ...p, name };
      }
      return p;
    });
    onPlayersChange(updatedPlayers);
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    _playerId: string,
    holeIndex: number,
    playerIndex: number
  ) => {
    if (e.key === 'Tab' || e.key === 'Enter') {
      e.preventDefault();
      // Move to next input
      const nextHole = holeIndex + 1;
      if (nextHole < 18) {
        inputRefs.current[playerIndex]?.[nextHole]?.focus();
      } else if (playerIndex + 1 < players.length) {
        inputRefs.current[playerIndex + 1]?.[0]?.focus();
      }
    }
  };

  const calculateOutTotal = (scores: number[]) => {
    return scores.slice(0, 9).reduce((sum, s) => sum + s, 0);
  };

  const calculateInTotal = (scores: number[]) => {
    return scores.slice(9, 18).reduce((sum, s) => sum + s, 0);
  };

  const calculateTotal = (scores: number[]) => {
    return scores.reduce((sum, s) => sum + s, 0);
  };

  return (
    <div className="player-input">
      <h2>プレイヤー・スコア入力</h2>

      {/* Add player form */}
      <div className="add-player-form">
        <input
          type="text"
          placeholder="プレイヤー名を入力"
          value={newPlayerName}
          onChange={e => setNewPlayerName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAddPlayer()}
          className="player-name-input"
        />
        <button onClick={handleAddPlayer} className="btn-add">
          追加
        </button>
      </div>

      {/* Player list with scores */}
      {players.length > 0 && (
        <div className="players-list">
          {players.map((player, playerIndex) => {
            if (!inputRefs.current[playerIndex]) {
              inputRefs.current[playerIndex] = [];
            }

            return (
              <div key={player.id} className="player-card">
                <div className="player-header">
                  {editingPlayer === player.id ? (
                    <input
                      type="text"
                      value={player.name}
                      onChange={e => handleNameChange(player.id, e.target.value)}
                      onBlur={() => setEditingPlayer(null)}
                      onKeyDown={e => e.key === 'Enter' && setEditingPlayer(null)}
                      autoFocus
                      className="player-name-edit"
                    />
                  ) : (
                    <span
                      className="player-name"
                      onClick={() => setEditingPlayer(player.id)}
                    >
                      {player.name}
                    </span>
                  )}
                  <button
                    onClick={() => handleRemovePlayer(player.id)}
                    className="btn-remove"
                    aria-label="削除"
                  >
                    ×
                  </button>
                </div>

                {/* Score input grid */}
                <div className="score-grid">
                  {/* OUT (holes 1-9) */}
                  <div className="score-section">
                    <div className="score-row header">
                      <span className="section-label">OUT</span>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(h => (
                        <span
                          key={h}
                          className={`hole-number ${config.hiddenHoles.includes(h - 1) ? 'hidden-hole' : ''}`}
                        >
                          {h}
                        </span>
                      ))}
                      <span className="total-label">計</span>
                    </div>
                    <div className="score-row par">
                      <span className="section-label">Par</span>
                      {config.par.slice(0, 9).map((p, i) => (
                        <span key={i} className="par-value">{p}</span>
                      ))}
                      <span className="total-value">{config.par.slice(0, 9).reduce((a, b) => a + b, 0)}</span>
                    </div>
                    <div className="score-row scores">
                      <span className="section-label">打</span>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <input
                          key={i}
                          ref={el => { inputRefs.current[playerIndex][i] = el; }}
                          type="number"
                          min="1"
                          max="15"
                          value={player.scores[i] || ''}
                          onChange={e => handleScoreChange(player.id, i, parseInt(e.target.value) || 0)}
                          onKeyDown={e => handleKeyDown(e, player.id, i, playerIndex)}
                          className={`score-input ${config.hiddenHoles.includes(i) ? 'hidden-hole' : ''}`}
                          inputMode="numeric"
                        />
                      ))}
                      <span className="total-value">{calculateOutTotal(player.scores) || '-'}</span>
                    </div>
                  </div>

                  {/* IN (holes 10-18) */}
                  <div className="score-section">
                    <div className="score-row header">
                      <span className="section-label">IN</span>
                      {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(h => (
                        <span
                          key={h}
                          className={`hole-number ${config.hiddenHoles.includes(h - 1) ? 'hidden-hole' : ''}`}
                        >
                          {h}
                        </span>
                      ))}
                      <span className="total-label">計</span>
                    </div>
                    <div className="score-row par">
                      <span className="section-label">Par</span>
                      {config.par.slice(9, 18).map((p, i) => (
                        <span key={i} className="par-value">{p}</span>
                      ))}
                      <span className="total-value">{config.par.slice(9, 18).reduce((a, b) => a + b, 0)}</span>
                    </div>
                    <div className="score-row scores">
                      <span className="section-label">打</span>
                      {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(i => (
                        <input
                          key={i}
                          ref={el => { inputRefs.current[playerIndex][i] = el; }}
                          type="number"
                          min="1"
                          max="15"
                          value={player.scores[i] || ''}
                          onChange={e => handleScoreChange(player.id, i, parseInt(e.target.value) || 0)}
                          onKeyDown={e => handleKeyDown(e, player.id, i, playerIndex)}
                          className={`score-input ${config.hiddenHoles.includes(i) ? 'hidden-hole' : ''}`}
                          inputMode="numeric"
                        />
                      ))}
                      <span className="total-value">{calculateInTotal(player.scores) || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Total */}
                <div className="player-total">
                  <span>TOTAL:</span>
                  <span className="total-score">{calculateTotal(player.scores) || '-'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {players.length === 0 && (
        <p className="no-players">プレイヤーを追加してください</p>
      )}
    </div>
  );
}
