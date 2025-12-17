import type { CompetitionConfig } from '../types';
import { DEFAULT_CONFIG, HDCP_LIMIT_OPTIONS } from '../types';
import { generateRandomHiddenHoles } from '../utils/calculation';
import './ConfigPanel.css';

interface ConfigPanelProps {
  config: CompetitionConfig;
  onChange: (config: CompetitionConfig) => void;
}

export function ConfigPanel({ config, onChange }: ConfigPanelProps) {
  const handleParChange = (holeIndex: number, par: number) => {
    const newPar = [...config.par];
    newPar[holeIndex] = par;
    onChange({ ...config, par: newPar });
  };

  const handleHiddenHoleToggle = (holeIndex: number) => {
    const isHidden = config.hiddenHoles.includes(holeIndex);
    let newHiddenHoles: number[];

    if (isHidden) {
      newHiddenHoles = config.hiddenHoles.filter(h => h !== holeIndex);
    } else {
      newHiddenHoles = [...config.hiddenHoles, holeIndex].sort((a, b) => a - b);
    }

    onChange({ ...config, hiddenHoles: newHiddenHoles });
  };

  const handleMultiplierChange = (value: number) => {
    onChange({ ...config, multiplier: value });
  };

  const handleHiddenWeightChange = (value: number) => {
    onChange({ ...config, hiddenWeight: value });
  };

  const handleDoubleParCutToggle = () => {
    onChange({
      ...config,
      limits: { ...config.limits, doubleParCut: !config.limits.doubleParCut }
    });
  };

  const handleMaxHdcpChange = (value: number) => {
    onChange({
      ...config,
      limits: { ...config.limits, maxHdcp: value }
    });
  };

  const handleRoundingModeChange = (mode: 'round' | 'floor' | 'ceil') => {
    onChange({ ...config, roundingMode: mode });
  };

  const handleRandomHiddenHoles = () => {
    const randomHoles = generateRandomHiddenHoles();
    onChange({ ...config, hiddenHoles: randomHoles });
  };

  const handleResetToDefault = () => {
    onChange({ ...DEFAULT_CONFIG });
  };

  const totalPar = config.par.reduce((sum, p) => sum + p, 0);
  const hiddenHolesCount = config.hiddenHoles.length;

  return (
    <div className="config-panel">
      <h2>コンペ設定</h2>

      {/* 係数スライダー - メイン機能 */}
      <div className="config-section highlight">
        <label className="config-label">
          計算係数: <span className="value">{config.multiplier.toFixed(2)}</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1.0"
          step="0.05"
          value={config.multiplier}
          onChange={e => handleMultiplierChange(parseFloat(e.target.value))}
          className="slider multiplier-slider"
        />
        <div className="slider-labels">
          <span>0.1</span>
          <span>0.5</span>
          <span>1.0</span>
        </div>
      </div>

      {/* 隠しホール設定 */}
      <div className="config-section">
        <div className="section-header">
          <label className="config-label">
            隠しホール選択 ({hiddenHolesCount}ホール選択中)
          </label>
          <button
            type="button"
            onClick={handleRandomHiddenHoles}
            className="btn-small"
          >
            ランダム12H
          </button>
        </div>

        <div className="holes-grid">
          {/* OUT (1-9) */}
          <div className="holes-row">
            <span className="row-label">OUT</span>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <button
                key={i}
                type="button"
                className={`hole-btn ${config.hiddenHoles.includes(i) ? 'selected' : ''}`}
                onClick={() => handleHiddenHoleToggle(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
          {/* IN (10-18) */}
          <div className="holes-row">
            <span className="row-label">IN</span>
            {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(i => (
              <button
                key={i}
                type="button"
                className={`hole-btn ${config.hiddenHoles.includes(i) ? 'selected' : ''}`}
                onClick={() => handleHiddenHoleToggle(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Par設定 */}
      <details className="config-section collapsible">
        <summary className="config-label">
          Par設定 (合計: {totalPar})
        </summary>
        <div className="par-grid">
          {/* OUT */}
          <div className="par-row">
            <span className="row-label">OUT</span>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <select
                key={i}
                value={config.par[i]}
                onChange={e => handleParChange(i, parseInt(e.target.value))}
                className="par-select"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            ))}
          </div>
          {/* IN */}
          <div className="par-row">
            <span className="row-label">IN</span>
            {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(i => (
              <select
                key={i}
                value={config.par[i]}
                onChange={e => handleParChange(i, parseInt(e.target.value))}
                className="par-select"
              >
                <option value={3}>3</option>
                <option value={4}>4</option>
                <option value={5}>5</option>
              </select>
            ))}
          </div>
        </div>
      </details>

      {/* 詳細設定 */}
      <details className="config-section collapsible">
        <summary className="config-label">詳細設定</summary>

        <div className="config-row">
          <label>隠しホール重み:</label>
          <select
            value={config.hiddenWeight}
            onChange={e => handleHiddenWeightChange(parseFloat(e.target.value))}
          >
            <option value={1.5}>1.5 (新ペリア)</option>
            <option value={3.0}>3.0 (ペリア)</option>
            <option value={1.0}>1.0</option>
            <option value={2.0}>2.0</option>
          </select>
        </div>

        <div className="config-row">
          <label>
            <input
              type="checkbox"
              checked={config.limits.doubleParCut}
              onChange={handleDoubleParCutToggle}
            />
            ダブルパーカット
          </label>
        </div>

        <div className="config-row">
          <label>HDCP上限:</label>
          <select
            value={config.limits.maxHdcp}
            onChange={e => handleMaxHdcpChange(parseInt(e.target.value))}
          >
            {HDCP_LIMIT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="config-row">
          <label>端数処理:</label>
          <select
            value={config.roundingMode}
            onChange={e => handleRoundingModeChange(e.target.value as 'round' | 'floor' | 'ceil')}
          >
            <option value="round">四捨五入</option>
            <option value="floor">切り捨て</option>
            <option value="ceil">切り上げ</option>
          </select>
        </div>
      </details>

      <div className="config-actions">
        <button type="button" onClick={handleResetToDefault} className="btn-reset">
          設定をリセット
        </button>
      </div>
    </div>
  );
}
