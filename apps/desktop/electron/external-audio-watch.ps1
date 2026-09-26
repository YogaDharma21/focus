param([int]$PollMs = 1500, [string]$ExcludeAppId = "")
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

try {
  Add-Type -AssemblyName System.Runtime.WindowsRuntime
} catch {
  Write-Output "EXTERNAL_UNSUPPORTED"
  exit 0
}

$mgrType = [type]::GetType("Windows.Media.Control.GlobalSystemMediaTransportControlsSessionManager, Windows, ContentType=WindowsRuntime")
if (-not $mgrType) {
  Write-Output "EXTERNAL_UNSUPPORTED"
  exit 0
}

$asTask = [System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1
}
if (-not $asTask -or $asTask.Count -eq 0) {
  Write-Output "EXTERNAL_UNSUPPORTED"
  exit 0
}

function Get-SessionManager {
  $op = $mgrType::RequestAsync()
  return $asTask[0].MakeGenericMethod($mgrType).Invoke($null, @($op)).Result
}

$ownId = Get-OwnAppId
if ([string]::IsNullOrWhiteSpace($ownId) -and -not [string]::IsNullOrWhiteSpace($ExcludeAppId)) {
  $ownId = $ExcludeAppId
}

try {
  $mgr = Get-SessionManager
} catch {
  Write-Output "EXTERNAL_UNSUPPORTED"
  exit 0
}

$lastState = $null
while ($true) {
  $ok = $false
  $playing = $false
  try {
    foreach ($s in @($mgr.GetSessions())) {
      try {
        $pi = $s.GetPlaybackInfo()
        if ($pi -and $pi.PlaybackStatus.ToString() -eq "Playing") {
          $appId = ""
          try { $appId = $s.SourceAppUserModelId } catch {}
          if ($ownId -ne "" -and $appId -ne "" -and $appId -ieq $ownId) { continue }
          $playing = $true
          break
        }
      } catch {}
    }
    $ok = $true
  } catch {
    try { $mgr = Get-SessionManager; $ok = $false } catch {}
  }
  if (-not $ok) {
    Start-Sleep -Milliseconds $PollMs
    continue
  }
  if ($null -eq $lastState -or $playing -ne $lastState) {
    $lastState = $playing
    if ($playing) { Write-Output "EXTERNAL_PLAYING" } else { Write-Output "EXTERNAL_STOPPED" }
  }
  Start-Sleep -Milliseconds $PollMs
}
