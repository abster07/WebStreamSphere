// src/components/settings/SettingsPanel.jsx

import React from 'react';
import useAppStore from '../../store/useAppStore';
import { Toggle, SectionHeader } from '../ui';

const QUALITY_OPTIONS = ['Auto', '4K', '1080p', '720p', '480p', '360p'];
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'fr', name: 'French' },
  { code: 'es', name: 'Spanish' },
  { code: 'de', name: 'German' },
];

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '13px 0',
      borderBottom: '1px solid var(--border-subtle)',
    }}>
      <div style={{ flex: 1, marginRight: 20 }}>
        <div style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 500 }}>{label}</div>
        {description && (
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPanel() {
  const { settings, updateSetting, darkMode, toggleDarkMode } = useAppStore();

  return (
    <div style={{ maxWidth: 600 }}>

      {/* Playback */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Playback" />
        <SettingRow label="Auto-play on channel click"
          description="Begin streaming immediately when a channel is selected">
          <Toggle on={settings.autoplay} onChange={v => updateSetting('autoplay', v)} />
        </SettingRow>
        <SettingRow label="Prefer HD / 4K streams"
          description="Always select the highest available quality">
          <Toggle on={settings.preferHD} onChange={v => updateSetting('preferHD', v)} />
        </SettingRow>
        <SettingRow label="Default quality"
          description="Fallback quality when auto selection is off">
          <select
            value={settings.defaultQuality}
            onChange={e => updateSetting('defaultQuality', e.target.value)}
            style={selectStyle}
          >
            {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
          </select>
        </SettingRow>
        <SettingRow label="Audio boost level"
          description={`Volume amplification: ${settings.audioBoost}%`}>
          <input
            type="range" min="50" max="200" step="10"
            value={settings.audioBoost}
            onChange={e => updateSetting('audioBoost', parseInt(e.target.value))}
            style={{ width: 100 }}
          />
        </SettingRow>
      </div>

      {/* Content */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Content" />
        <SettingRow label="Show NSFW channels"
          description="Enable to show adult content channels (18+)">
          <Toggle on={settings.showNSFW} onChange={v => updateSetting('showNSFW', v)} />
        </SettingRow>
      </div>

      {/* Interface */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader label="Interface" />
        <SettingRow label="Dark mode"
          description="Cinematic dark theme (recommended)">
          <Toggle on={darkMode} onChange={toggleDarkMode} />
        </SettingRow>
        <SettingRow label="UI Language"
          description="Display language for the interface">
          <select
            value={settings.uiLanguage}
            onChange={e => updateSetting('uiLanguage', e.target.value)}
            style={selectStyle}
          >
            {LANGUAGES.map(l => <option key={l.code} value={l.code}>{l.name}</option>)}
          </select>
        </SettingRow>
      </div>

      {/* About */}
      <div style={{
        padding: '16px 18px',
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 12,
      }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
          About StreamSphere
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {[
            ['Version', '2.4.1'],
            ['Data source', 'iptv-org GitHub'],
            ['Channels API', 'iptv-org.github.io/api'],
            ['License', 'MIT'],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--text-muted)' }}>{k}</span>
              <span style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  padding: '6px 10px', borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid var(--border-moderate)',
  color: 'var(--text-primary)', fontSize: 12, outline: 'none',
};
