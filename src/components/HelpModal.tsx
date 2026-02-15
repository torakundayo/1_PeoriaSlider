import { useEffect } from 'react';
import './HelpModal.css';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="help-modal-overlay" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <div className="help-header">
          <h2>使い方ガイド</h2>
          <button className="help-close-btn" onClick={onClose} aria-label="閉じる">
            ×
          </button>
        </div>

        <div className="help-content">
          {/* イントロ */}
          <section className="help-section help-intro">
            <div className="help-app-icon">⛳</div>
            <h3>PeoriaSliderへようこそ</h3>
            <p>ゴルフコンペの順位をリアルタイムでシミュレーションできるアプリです</p>
          </section>

          {/* 3ステップガイド */}
          <section className="help-section">
            <h3>基本の3ステップ</h3>
            <div className="help-steps">
              <div className="help-step">
                <div className="step-number">1</div>
                <div className="step-icon">👤</div>
                <div className="step-content">
                  <h4>プレイヤー登録</h4>
                  <p>「スコア入力」タブでプレイヤーを追加</p>
                </div>
              </div>
              <div className="help-step">
                <div className="step-number">2</div>
                <div className="step-icon">✏️</div>
                <div className="step-content">
                  <h4>スコア入力</h4>
                  <p>18ホールのスコアを入力</p>
                </div>
              </div>
              <div className="help-step">
                <div className="step-number">3</div>
                <div className="step-icon">🏆</div>
                <div className="step-content">
                  <h4>順位確認</h4>
                  <p>「順位表」タブで結果を確認</p>
                </div>
              </div>
            </div>
          </section>

          {/* メイン機能 */}
          <section className="help-section help-feature-highlight">
            <h3>🎚️ メイン機能：係数スライダー</h3>
            <div className="feature-demo">
              <div className="slider-demo">
                <span className="demo-label">0.1</span>
                <div className="demo-slider">
                  <div className="demo-thumb"></div>
                </div>
                <span className="demo-label">1.0</span>
              </div>
              <p className="feature-desc">
                スライダーを動かすと<strong>リアルタイムで順位が変動</strong>！<br/>
                表彰式での演出にも使えます
              </p>
            </div>
          </section>

          {/* タブ説明 */}
          <section className="help-section">
            <h3>画面の説明</h3>
            <div className="help-tabs-guide">
              <div className="tab-guide">
                <div className="tab-icon">⚙️</div>
                <div className="tab-info">
                  <h4>設定タブ</h4>
                  <ul>
                    <li>計算係数の調整</li>
                    <li>隠しホールの選択</li>
                    <li>Par設定・詳細設定</li>
                  </ul>
                </div>
              </div>
              <div className="tab-guide">
                <div className="tab-icon">📝</div>
                <div className="tab-info">
                  <h4>スコア入力タブ</h4>
                  <ul>
                    <li>プレイヤーの追加・削除</li>
                    <li>18ホールのスコア入力</li>
                    <li>黄色マス＝隠しホール</li>
                  </ul>
                </div>
              </div>
              <div className="tab-guide">
                <div className="tab-icon">📊</div>
                <div className="tab-info">
                  <h4>順位表タブ</h4>
                  <ul>
                    <li>順位・Gross・HDCP・Net表示</li>
                    <li>1〜3位は金銀銅でハイライト</li>
                    <li>順位変動を矢印で表示</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* 計算式 */}
          <section className="help-section help-formula">
            <h3>📐 計算方式</h3>
            <div className="formula-box">
              <div className="formula">
                HDCP = (隠しホール合計 × 1.5 − 72) × 係数
              </div>
              <div className="formula-example">
                <strong>例：</strong> 隠しホール60打、係数0.8の場合<br/>
                (60 × 1.5 − 72) × 0.8 = <strong>14.4</strong>
              </div>
            </div>
            <div className="net-formula">
              <strong>Net = Gross − HDCP</strong>（この値で順位決定）
            </div>
          </section>

          {/* 順位の見方 */}
          <section className="help-section">
            <h3>🏅 順位表の見方</h3>
            <div className="rank-legend">
              <div className="rank-item rank-1">
                <span className="rank-badge">1</span>
                <span>優勝</span>
              </div>
              <div className="rank-item rank-2">
                <span className="rank-badge">2</span>
                <span>準優勝</span>
              </div>
              <div className="rank-item rank-3">
                <span className="rank-badge">3</span>
                <span>3位</span>
              </div>
              <div className="rank-item rank-bb">
                <span className="rank-badge">BB</span>
                <span>ブービー賞</span>
              </div>
              <div className="rank-item rank-last">
                <span className="rank-badge">最下位</span>
                <span>ブービーメーカー</span>
              </div>
            </div>
          </section>

          {/* データ管理 */}
          <section className="help-section">
            <h3>💾 データ管理</h3>
            <div className="data-info">
              <div className="data-item">
                <span className="data-icon">🔄</span>
                <div>
                  <strong>自動保存</strong>
                  <p>入力データはブラウザに自動保存されます</p>
                </div>
              </div>
              <div className="data-item">
                <span className="data-icon">📤</span>
                <div>
                  <strong>エクスポート</strong>
                  <p>データをJSONファイルとして保存</p>
                </div>
              </div>
              <div className="data-item">
                <span className="data-icon">📥</span>
                <div>
                  <strong>インポート</strong>
                  <p>保存したファイルを読み込み</p>
                </div>
              </div>
            </div>
          </section>

          {/* ヒント */}
          <section className="help-section help-tips">
            <h3>💡 活用ヒント</h3>
            <div className="tips-list">
              <div className="tip">
                <span className="tip-icon">🎤</span>
                <p>表彰式で係数を変えて「もしもの順位」を見せると盛り上がります！</p>
              </div>
              <div className="tip">
                <span className="tip-icon">📱</span>
                <p>スマートフォンでも快適に操作できます</p>
              </div>
              <div className="tip">
                <span className="tip-icon">🔐</span>
                <p>データはブラウザ内のみ保存。サーバーには送信されません</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
