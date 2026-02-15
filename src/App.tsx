import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { CompetitionConfig, Player, CalculationResult, SavedCompetition, CompetitionSummary } from './types';
import { DEFAULT_CONFIG } from './types';
import { calculateAllResults } from './utils/calculation';
import {
  saveState, loadState, exportToJson, importFromJson,
  loadHistory, saveCompetition, deleteCompetition
} from './utils/storage';
import { ConfigPanel } from './components/ConfigPanel';
import { PlayerInput } from './components/PlayerInput';
import { ResultsTable } from './components/ResultsTable';
import { HistoryPanel } from './components/HistoryPanel';
import { HelpModal } from './components/HelpModal';
import './App.css';

type Tab = 'config' | 'input' | 'results' | 'history';

function App() {
  const [config, setConfig] = useState<CompetitionConfig>(DEFAULT_CONFIG);
  const [players, setPlayers] = useState<Player[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('input');
  const previousResultsRef = useRef<CalculationResult[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [history, setHistory] = useState<SavedCompetition[]>([]);

  // Load saved state and history on mount
  useEffect(() => {
    const saved = loadState();
    if (saved) {
      setConfig(saved.config);
      setPlayers(saved.players);
    }
    setHistory(loadHistory());
  }, []);

  // Save state on changes (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      saveState({ config, players });
    }, 300);
    return () => clearTimeout(timer);
  }, [config, players]);

  // Calculate results
  const results = useMemo(() => {
    return calculateAllResults(players, config, previousResultsRef.current);
  }, [players, config]);

  // Update previous results for animation tracking
  useEffect(() => {
    const timer = setTimeout(() => {
      previousResultsRef.current = results;
    }, 500);
    return () => clearTimeout(timer);
  }, [results]);

  const handleConfigChange = useCallback((newConfig: CompetitionConfig) => {
    setConfig(newConfig);
  }, []);

  const handlePlayersChange = useCallback((newPlayers: Player[]) => {
    setPlayers(newPlayers);
  }, []);

  const handleExport = () => {
    const json = exportToJson({ config, players });
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peoria-slider-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const json = e.target?.result as string;
          const imported = importFromJson(json);
          if (imported) {
            setConfig(imported.config);
            setPlayers(imported.players);
          } else {
            alert('ファイルの読み込みに失敗しました');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleClearAll = () => {
    if (confirm('すべてのデータをクリアしますか？')) {
      setConfig({ ...DEFAULT_CONFIG });
      setPlayers([]);
    }
  };

  const handleSaveCompetition = useCallback((name: string) => {
    const validPlayers = players.filter(
      p => p.scores.length === 18 && p.scores.every(s => s > 0)
    );
    const currentResults = calculateAllResults(players, config);
    const winner = currentResults.find(r => r.rank === 1);
    const summary: CompetitionSummary = {
      playerCount: validPlayers.length,
      winnerName: winner?.playerName ?? null,
      winnerNet: winner?.net ?? null,
    };
    const competition: SavedCompetition = {
      id: `comp-${Date.now()}`,
      name,
      date: new Date().toISOString(),
      config,
      players,
      summary
    };
    saveCompetition(competition);
    setHistory(loadHistory());
  }, [config, players]);

  const handleLoadCompetition = useCallback((competition: SavedCompetition) => {
    setConfig(competition.config);
    setPlayers(competition.players);
    setActiveTab('input');
  }, []);

  const handleDeleteCompetition = useCallback((id: string) => {
    deleteCompetition(id);
    setHistory(loadHistory());
  }, []);

  const validPlayersCount = players.filter(
    p => p.scores.length === 18 && p.scores.every(s => s > 0)
  ).length;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>PeoriaSlider</h1>
            <p className="subtitle">ゴルフコンペ順位シミュレーション</p>
          </div>
          <button
            className="menu-btn"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
        {menuOpen && (
          <div className="dropdown-menu">
            <button onClick={() => { setHelpOpen(true); setMenuOpen(false); }}>
              使い方
            </button>
            <button onClick={() => { handleExport(); setMenuOpen(false); }}>
              エクスポート
            </button>
            <button onClick={() => { handleImport(); setMenuOpen(false); }}>
              インポート
            </button>
            <button className="danger" onClick={() => { handleClearAll(); setMenuOpen(false); }}>
              データクリア
            </button>
          </div>
        )}
      </header>

      {/* Quick stats */}
      <div className="quick-stats">
        <div className="stat">
          <span className="stat-label">係数</span>
          <span className="stat-value">{config.multiplier.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">隠しH</span>
          <span className="stat-value">{config.hiddenHoles.length}</span>
        </div>
        <div className="stat">
          <span className="stat-label">参加者</span>
          <span className="stat-value">{validPlayersCount}/{players.length}</span>
        </div>
      </div>

      {/* Tab navigation */}
      <nav className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'config' ? 'active' : ''}`}
          onClick={() => setActiveTab('config')}
        >
          設定
        </button>
        <button
          className={`tab-btn ${activeTab === 'input' ? 'active' : ''}`}
          onClick={() => setActiveTab('input')}
        >
          スコア入力
        </button>
        <button
          className={`tab-btn ${activeTab === 'results' ? 'active' : ''}`}
          onClick={() => setActiveTab('results')}
        >
          順位表
          {results.length > 0 && <span className="badge">{results.length}</span>}
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          履歴
          {history.length > 0 && <span className="badge">{history.length}</span>}
        </button>
      </nav>

      {/* Tab content */}
      <main className="tab-content">
        {activeTab === 'config' && (
          <ConfigPanel config={config} onChange={handleConfigChange} />
        )}
        {activeTab === 'input' && (
          <PlayerInput
            players={players}
            config={config}
            onPlayersChange={handlePlayersChange}
          />
        )}
        {activeTab === 'results' && (
          <ResultsTable results={results} onSave={handleSaveCompetition} />
        )}
        {activeTab === 'history' && (
          <HistoryPanel
            history={history}
            onLoad={handleLoadCompetition}
            onDelete={handleDeleteCompetition}
          />
        )}
      </main>

      {/* Help Modal */}
      <HelpModal isOpen={helpOpen} onClose={() => setHelpOpen(false)} />
    </div>
  );
}

export default App;
