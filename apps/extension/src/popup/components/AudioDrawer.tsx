import React, { useEffect, useState } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Disc,
  Waves,
  ChevronDown,
} from "lucide-react";
import type {
  SoundChannelId,
  SoundChannelState,
  SoundscapePreset,
} from "../../types";
import { SOUNDSCAPE_PRESETS } from "../../lib/soundscape";

export interface AudioDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  audioSourceType: "lofi" | "soundscape";
  onAudioSourceTypeChange: (type: "lofi" | "soundscape") => void;
  soundEnabled: boolean;
  musicEnabled: boolean;
  isMusicPlaying: boolean;
  musicVolume: number;
  onToggleMusicPlay: () => void;
  onMusicVolumeChange: (volume: number) => void;
  autoPauseOnExternalAudio?: boolean;
  onToggleAutoPause?: () => void;
  isSoundscapePlaying: boolean;
  soundscapeMasterVolume: number;
  onToggleSoundscapePlay: () => void;
  onSoundscapeMasterVolumeChange: (volume: number) => void;
  soundChannels: SoundChannelState[];
  soundscapeActivePreset: string | null;
  onToggleSoundscapeChannel: (id: SoundChannelId) => void;
  onSoundscapeChannelVolumeChange: (id: SoundChannelId, volume: number) => void;
  onApplySoundscapePreset: (preset: SoundscapePreset) => void;
}

export function AudioDrawer({
  isOpen,
  onClose,
  audioSourceType,
  onAudioSourceTypeChange,
  soundEnabled,
  musicEnabled,
  isMusicPlaying,
  musicVolume,
  onToggleMusicPlay,
  onMusicVolumeChange,
  autoPauseOnExternalAudio,
  onToggleAutoPause,
  isSoundscapePlaying,
  soundscapeMasterVolume,
  onToggleSoundscapePlay,
  onSoundscapeMasterVolumeChange,
  soundChannels,
  soundscapeActivePreset,
  onToggleSoundscapeChannel,
  onSoundscapeChannelVolumeChange,
  onApplySoundscapePreset,
}: AudioDrawerProps) {
  const [isChannelsExpanded, setIsChannelsExpanded] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm p-4 flex flex-col animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="audio-drawer-title"
    >
      <div className="flex-1 bg-card border border-border shadow-[0_28px_56px_-40px_rgba(0,0,0,0.9)] rounded-[24px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-foreground" />
            <h2
              id="audio-drawer-title"
              className="text-sm font-semibold tracking-[-0.015em] text-foreground"
            >
              Audio Player
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[10px] text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-300 active:scale-95 cursor-pointer"
            aria-label="Close audio player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* 2-Segment Pill Tab Switcher */}
          <div className="flex p-1 bg-surface-inset rounded-full border border-border">
            <button
              type="button"
              onClick={() => onAudioSourceTypeChange("lofi")}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer text-center ${
                audioSourceType === "lofi"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Lo-Fi
            </button>
            <button
              type="button"
              onClick={() => onAudioSourceTypeChange("soundscape")}
              className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium transition-all duration-300 active:scale-95 cursor-pointer text-center ${
                audioSourceType === "soundscape"
                  ? "bg-card text-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Soundscape
            </button>
          </div>

          {/* LO-FI PLAYER VIEW */}
          {audioSourceType === "lofi" && (
            <div className="space-y-4">
              {/* Sleek Playback Card */}
              <div className="p-3.5 rounded-[16px] bg-surface-inset border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0 ${
                      isMusicPlaying ? "animate-spin text-foreground" : ""
                    }`}
                    style={{ animationDuration: "4s" }}
                  >
                    <Disc className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      Lo-Fi Beats
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleMusicPlay}
                  disabled={!soundEnabled || !musicEnabled}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label={isMusicPlaying ? "Pause Lo-Fi" : "Play Lo-Fi"}
                >
                  {isMusicPlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Volume Slider */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                  <span>Volume</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {Math.round(musicVolume * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {musicVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={musicVolume}
                    onChange={(e) => onMusicVolumeChange(parseFloat(e.target.value))}
                    disabled={!soundEnabled || !musicEnabled}
                    className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Auto-Pause Toggle */}
              {onToggleAutoPause !== undefined && (
                <div className="flex items-center justify-between p-3 rounded-[12px] bg-surface-inset border border-border">
                  <span className="text-xs text-foreground font-medium">
                    Auto-pause on external audio
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoPauseOnExternalAudio}
                    onClick={onToggleAutoPause}
                    className={`w-9 h-5 rounded-full transition-colors duration-300 relative cursor-pointer active:scale-95 ${
                      autoPauseOnExternalAudio ? "bg-primary" : "bg-secondary"
                    }`}
                    aria-label="Toggle auto-pause on external audio"
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-primary-foreground absolute top-0.5 transition-transform duration-300 ${
                        autoPauseOnExternalAudio ? "left-[18px]" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* SOUNDSCAPE PLAYER VIEW */}
          {audioSourceType === "soundscape" && (
            <div className="space-y-4">
              {/* Tier 1: Primary Compact View */}
              {/* Primary Playback Card */}
              <div className="p-3.5 rounded-[16px] bg-surface-inset border border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
                    <Waves
                      className={`w-4 h-4 ${
                        isSoundscapePlaying ? "text-emerald" : "text-muted-foreground"
                      }`}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-foreground truncate">
                      Soundscape
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onToggleSoundscapePlay}
                  disabled={!soundEnabled}
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground hover:opacity-90 flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                  aria-label={isSoundscapePlaying ? "Pause Soundscape" : "Play Soundscape"}
                >
                  {isSoundscapePlaying ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  )}
                </button>
              </div>

              {/* Master Volume */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-muted-foreground px-0.5">
                  <span>Master Volume</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {soundscapeMasterVolume}%
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {soundscapeMasterVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="1"
                    value={soundscapeMasterVolume}
                    onChange={(e) =>
                      onSoundscapeMasterVolumeChange(parseInt(e.target.value, 10))
                    }
                    disabled={!soundEnabled}
                    className="w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Preset Chips */}
              <div className="space-y-2 pt-1 border-t border-border">
                <span className="text-[10px] font-medium uppercase tracking-[0.16em] text-muted-foreground block">
                  Presets
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SOUNDSCAPE_PRESETS.map((preset) => {
                    const isSelected =
                      soundscapeActivePreset === preset.id ||
                      (preset.id === "deepFocus" && soundscapeActivePreset === "focus");
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => onApplySoundscapePreset(preset)}
                        disabled={!soundEnabled}
                        className={`px-2.5 py-1 rounded-full text-xs transition-all duration-300 active:scale-95 cursor-pointer border disabled:opacity-40 disabled:cursor-not-allowed ${
                          isSelected
                            ? "bg-emerald-bg text-emerald border-emerald/30 font-semibold"
                            : "bg-surface-inset text-muted-foreground hover:text-foreground hover:bg-secondary border-border font-medium"
                        }`}
                      >
                        {preset.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tier 2: Collapsible Disclosure */}
              <div className="space-y-2 pt-1 border-t border-border">
                <button
                  type="button"
                  onClick={() => setIsChannelsExpanded((prev) => !prev)}
                  className="w-full flex items-center justify-between p-2.5 rounded-[12px] bg-surface-inset border border-border text-xs font-medium text-foreground hover:bg-secondary transition-all duration-300 active:scale-95 cursor-pointer"
                  aria-expanded={isChannelsExpanded}
                >
                  <span>Customize Channels</span>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${
                      isChannelsExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isChannelsExpanded && (
                  <div className="space-y-1.5 pt-1">
                    {soundChannels.map((channel) => (
                      <div
                        key={channel.id}
                        className="p-2 rounded-[10px] bg-surface-inset border border-border space-y-1.5"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <button
                            type="button"
                            onClick={() => onToggleSoundscapeChannel(channel.id)}
                            disabled={!soundEnabled}
                            className="flex items-center gap-2 text-foreground font-medium hover:text-primary transition-colors cursor-pointer disabled:cursor-not-allowed"
                          >
                            <span
                              className={`w-2 h-2 rounded-full transition-colors ${
                                channel.enabled
                                  ? "bg-emerald"
                                  : "bg-muted-foreground/30"
                              }`}
                            />
                            <span
                              className={
                                !channel.enabled
                                  ? "text-muted-foreground"
                                  : "text-foreground"
                              }
                            >
                              {channel.label}
                            </span>
                          </button>
                          <span className="font-mono tabular-nums text-[11px] text-muted-foreground">
                            {channel.enabled ? `${channel.volume}%` : "0%"}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={channel.enabled ? channel.volume : 0}
                          disabled={!soundEnabled || !channel.enabled}
                          onChange={(e) =>
                            onSoundscapeChannelVolumeChange(
                              channel.id,
                              parseInt(e.target.value, 10)
                            )
                          }
                          className={`w-full h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary ${
                            !channel.enabled
                              ? "opacity-30 cursor-not-allowed"
                              : ""
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
