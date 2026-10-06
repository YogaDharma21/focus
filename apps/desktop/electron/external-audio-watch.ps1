param(
  [int]$PollMs = 1500,
  [string]$ExcludeAppId = "",
  [string]$ExcludePid = "",
  [string]$ExcludeExePath = ""
)
$ErrorActionPreference = "Stop"

# Identity of our own app, passed in by the Electron main process. Our own
# Lo-Fi music registers a media session under our AppUserModelID, so it must
# be excluded — otherwise the music would count as "external" audio and
# immediately fade itself out.
function Get-OwnAppId {
  try {
    $code = @"
using System;
using System.Runtime.InteropServices;
public static class AumidHelper {
  [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
  public static extern int GetCurrentProcessExplicitAppUserModelID(out IntPtr appId);
  public static string Get() {
    IntPtr p = IntPtr.Zero;
    try {
      if (GetCurrentProcessExplicitAppUserModelID(out p) != 0 || p == IntPtr.Zero) { return ""; }
      return Marshal.PtrToStringUni(p);
    } catch { return ""; }
    finally { if (p != IntPtr.Zero) { Marshal.FreeCoTaskMem(p); } }
  }
}
"@
    Add-Type -TypeDefinition $code
    return [AumidHelper]::Get()
  } catch { return "" }
}

# 1. Initialize WASAPI Core Audio session checker (C# COM Interop)
# This allows detecting audio from ANY application on Windows (e.g. VLC media player,
# games, communication apps, browsers) regardless of whether they integrate with SMTC.
$wasapiSupported = $false
try {
  $wasapiCode = @"
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;

public enum AudioSessionState {
    AudioSessionStateInactive = 0,
    AudioSessionStateActive = 1,
    AudioSessionStateExpired = 2
}

[Guid("A95664D2-9614-4F35-A746-DE8DB63617E6"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceEnumerator {
    [PreserveSig]
    int EnumAudioEndpoints(int dataFlow, int dwStateMask, out IMMDeviceCollection ppDevices);
    [PreserveSig]
    int GetDefaultAudioEndpoint(int dataFlow, int role, out IMMDevice ppEndpoint);
}

[Guid("0BD7A1BE-7A1A-44DB-8397-CC5392387B5E"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDeviceCollection {
    [PreserveSig]
    int GetCount(out int pcDevices);
    [PreserveSig]
    int Item(int nDevice, out IMMDevice ppDevice);
}

[Guid("D666063F-1587-4E43-81F1-B948E807363F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IMMDevice {
    [PreserveSig]
    int Activate(ref Guid iid, int dwClsCtx, IntPtr pActivationParams, [MarshalAs(UnmanagedType.IUnknown)] out object ppInterface);
    [PreserveSig]
    int OpenPropertyStore(int stgmAccess, out IntPtr ppProperties);
    [PreserveSig]
    int GetId(out IntPtr ppstrId);
    [PreserveSig]
    int GetState(out int pdwState);
}

[Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionManager2 {
    int GetAudioSessionControl(ref Guid AudioSessionGuid, int StreamFlags, out IntPtr SessionControl);
    int GetSimpleAudioVolume(ref Guid AudioSessionGuid, int StreamFlags, out IntPtr AudioVolume);
    [PreserveSig]
    int GetSessionEnumerator(out IAudioSessionEnumerator SessionEnum);
}

[Guid("E2F5BB11-0570-40CA-ACDD-3AA01277DEE8"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionEnumerator {
    [PreserveSig]
    int GetCount(out int SessionCount);
    [PreserveSig]
    int GetSession(int SessionIndex, out IAudioSessionControl Session);
}

[Guid("F4B1A599-7266-4319-A8CA-E70ACB11E8CD"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl {
    [PreserveSig]
    int GetState(out AudioSessionState pRetVal);
    int GetDisplayName(out IntPtr pRetVal);
    int SetDisplayName(string Value, ref Guid EventContext);
    int GetIconPath(out IntPtr pRetVal);
    int SetIconPath(string Value, ref Guid EventContext);
    int GetGroupingParam(out Guid pRetVal);
    int SetGroupingParam(ref Guid Override, ref Guid EventContext);
    int RegisterAudioSessionNotification(IntPtr NewNotifications);
    int UnregisterAudioSessionNotification(IntPtr NewNotifications);
}

[Guid("BFB7FF88-7239-4FC9-8FA2-07C950BE9C6D"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioSessionControl2 {
    [PreserveSig]
    int GetState(out AudioSessionState pRetVal);
    int GetDisplayName(out IntPtr pRetVal);
    int SetDisplayName(string Value, ref Guid EventContext);
    int GetIconPath(out IntPtr pRetVal);
    int SetIconPath(string Value, ref Guid EventContext);
    int GetGroupingParam(out Guid pRetVal);
    int SetGroupingParam(ref Guid Override, ref Guid EventContext);
    int RegisterAudioSessionNotification(IntPtr NewNotifications);
    int UnregisterAudioSessionNotification(IntPtr NewNotifications);
    [PreserveSig]
    int GetSessionIdentifier(out IntPtr pRetVal);
    [PreserveSig]
    int GetSessionInstanceIdentifier(out IntPtr pRetVal);
    [PreserveSig]
    int GetProcessId(out uint pRetVal);
    [PreserveSig]
    int IsSystemSoundsSession();
    int SetDuckPreference(bool optOut);
}

[Guid("C02216F6-8C67-4B5B-9D00-D008E73E0064"), InterfaceType(ComInterfaceType.InterfaceIsIUnknown)]
public interface IAudioMeterInformation {
    [PreserveSig]
    int GetPeakValue(out float pfPeak);
}

[ComImport, Guid("BCDE0395-E52F-467C-8E3D-C4579291692E")]
public class MMDeviceEnumeratorComObject {
}

public static class WasapiAudioChecker {
    private static readonly Guid IID_IAudioSessionManager2 = new Guid("77AA99A0-1BD6-484F-8BC7-2C654C9A9B6F");
    private static readonly HashSet<uint> ownPids = new HashSet<uint>();
    private static readonly Dictionary<uint, long> lastAudibleTicks = new Dictionary<uint, long>();

    public static void RegisterOwnPid(uint pid) {
        if (pid > 0) ownPids.Add(pid);
    }

    private static bool IsOwnProcess(uint pid, string ownExePath) {
        if (pid == 0) return true;
        if (ownPids.Contains(pid)) return true;

        if (!string.IsNullOrEmpty(ownExePath)) {
            try {
                using (var proc = Process.GetProcessById((int)pid)) {
                    string path = proc.MainModule.FileName;
                    if (string.Equals(path, ownExePath, StringComparison.OrdinalIgnoreCase)) {
                        ownPids.Add(pid);
                        return true;
                    }
                }
            } catch { }
        }

        return false;
    }

    public static bool IsAnyExternalAudioPlaying(string ownExePath, float peakThreshold, int holdMs) {
        var enumerator = new MMDeviceEnumeratorComObject() as IMMDeviceEnumerator;
        if (enumerator == null) return false;

        bool isPlaying = false;
        long now = Stopwatch.GetTimestamp();
        double tickFreq = (double)Stopwatch.Frequency;

        try {
            IMMDeviceCollection col;
            int hr = enumerator.EnumAudioEndpoints(0, 1, out col);
            if (hr != 0 || col == null) return false;

            try {
                int count;
                col.GetCount(out count);

                for (int d = 0; d < count && !isPlaying; d++) {
                    IMMDevice dev;
                    col.Item(d, out dev);
                    if (dev == null) continue;

                    try {
                        object obj;
                        Guid iid = IID_IAudioSessionManager2;
                        hr = dev.Activate(ref iid, 23, IntPtr.Zero, out obj);
                        if (hr != 0 || obj == null) continue;

                        var mgr = obj as IAudioSessionManager2;
                        if (mgr == null) {
                            Marshal.ReleaseComObject(obj);
                            continue;
                        }

                        try {
                            IAudioSessionEnumerator sessionEnum;
                            hr = mgr.GetSessionEnumerator(out sessionEnum);
                            if (hr == 0 && sessionEnum != null) {
                                try {
                                    int sCount;
                                    if (sessionEnum.GetCount(out sCount) == 0) {
                                        for (int s = 0; s < sCount; s++) {
                                            IAudioSessionControl ctl;
                                            if (sessionEnum.GetSession(s, out ctl) == 0 && ctl != null) {
                                                try {
                                                    AudioSessionState state;
                                                    ctl.GetState(out state);

                                                    var ctl2 = ctl as IAudioSessionControl2;
                                                    uint pid = 0;
                                                    bool isSystem = false;
                                                    if (ctl2 != null) {
                                                        ctl2.GetProcessId(out pid);
                                                        isSystem = ctl2.IsSystemSoundsSession() == 0;
                                                    }

                                                    if (state != AudioSessionState.AudioSessionStateActive) {
                                                        if (pid > 0) lastAudibleTicks.Remove(pid);
                                                        continue;
                                                    }

                                                    if (!isSystem && pid > 0 && !IsOwnProcess(pid, ownExePath)) {
                                                        var meter = ctl as IAudioMeterInformation;
                                                        float peak = 0f;
                                                        if (meter != null) {
                                                            meter.GetPeakValue(out peak);
                                                        }

                                                        long lastTick = 0;
                                                        if (peak > peakThreshold) {
                                                            lastAudibleTicks[pid] = now;
                                                            isPlaying = true;
                                                        } else if (lastAudibleTicks.TryGetValue(pid, out lastTick)) {
                                                            double elapsedMs = ((now - lastTick) * 1000.0) / tickFreq;
                                                            if (elapsedMs < (double)holdMs) {
                                                                isPlaying = true;
                                                            } else {
                                                                lastAudibleTicks.Remove(pid);
                                                            }
                                                        }
                                                    }
                                                } finally {
                                                    Marshal.ReleaseComObject(ctl);
                                                }
                                            }
                                        }
                                    }
                                } finally {
                                    Marshal.ReleaseComObject(sessionEnum);
                                }
                            }
                        } finally {
                            Marshal.ReleaseComObject(mgr);
                        }
                    } finally {
                        Marshal.ReleaseComObject(dev);
                    }
                }
            } finally {
                Marshal.ReleaseComObject(col);
            }
        } finally {
            Marshal.ReleaseComObject(enumerator);
        }

        return isPlaying;
    }
}
"@
  Add-Type -TypeDefinition $wasapiCode
  $wasapiSupported = $true
} catch {
  $wasapiSupported = $false
}

# Register known own process IDs from arguments
if ($wasapiSupported -and -not [string]::IsNullOrWhiteSpace($ExcludePid)) {
  foreach ($p in ($ExcludePid -split "[,;\s]+")) {
    $parsed = 0
    if ([uint32]::TryParse($p.Trim(), [ref]$parsed) -and $parsed -gt 0) {
      [WasapiAudioChecker]::RegisterOwnPid($parsed)
    }
  }
}

# 2. Initialize Windows System Media Transport Controls (SMTC / GSMTC)
$gsmtcSupported = $false
$mgr = $null
try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
  $mgrType = [type]::GetType("Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows, ContentType=WindowsRuntime")
  if ($mgrType) {
    $asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
      $_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1
    }
    if ($asTask -and $asTask.Count -gt 0) {
      function Get-SessionManager {
        $op = $mgrType::RequestAsync()
        return $asTask[0].MakeGenericMethod($mgrType).Invoke($null, @($op)).Result
      }
      $mgr = Get-SessionManager
      $gsmtcSupported = $true
    }
  }
} catch {
  $gsmtcSupported = $false
}

# If neither detection mechanism is available, exit with EXTERNAL_UNSUPPORTED
if (-not $wasapiSupported -and -not $gsmtcSupported) {
  Write-Output "EXTERNAL_UNSUPPORTED"
  exit 0
}

$ownId = Get-OwnAppId
if ([string]::IsNullOrWhiteSpace($ownId) -and -not [string]::IsNullOrWhiteSpace($ExcludeAppId)) {
  $ownId = $ExcludeAppId
}

function Matches-ExcludedAppId($id, $patterns) {
  if ([string]::IsNullOrWhiteSpace($id) -or [string]::IsNullOrWhiteSpace($patterns)) { return $false }
  foreach ($pat in ($patterns -split "[,;\s]+")) {
    if ([string]::IsNullOrWhiteSpace($pat)) { continue }
    if ($id -ilike $pat.Trim()) { return $true }
  }
  return $false
}

$lastState = $null
while ($true) {
  $playing = $false

  # Check GSMTC for active media sessions (e.g. YouTube in browser, Spotify)
  if ($gsmtcSupported -and $mgr) {
    try {
      foreach ($s in @($mgr.GetSessions())) {
        try {
          $pi = $s.GetPlaybackInfo()
          if ($pi -and $pi.PlaybackStatus.ToString() -eq "Playing") {
            $appId = ""
            try { $appId = $s.SourceAppUserModelId } catch {}
            if (Matches-ExcludedAppId $appId $ownId) { continue }
            $playing = $true
            break
          }
        } catch {}
      }
    } catch {
      try { $mgr = Get-SessionManager } catch {}
    }
  }

  # Check WASAPI audio sessions for any application playing audio (e.g. VLC media player, games, desktop apps)
  if (-not $playing -and $wasapiSupported) {
    try {
      if ([WasapiAudioChecker]::IsAnyExternalAudioPlaying($ExcludeExePath, 0.0005, 2000)) {
        $playing = $true
      }
    } catch {}
  }

  if ($null -eq $lastState -or $playing -ne $lastState) {
    $lastState = $playing
    if ($playing) { Write-Output "EXTERNAL_PLAYING" } else { Write-Output "EXTERNAL_STOPPED" }
  }

  Start-Sleep -Milliseconds $PollMs
}
