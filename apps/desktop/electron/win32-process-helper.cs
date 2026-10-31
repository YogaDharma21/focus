using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;

namespace FocusDesktop {
    class Program {
        delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);

        [DllImport("user32.dll")]
        static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32.dll", CharSet = CharSet.Unicode)]
        static extern int GetWindowTextW(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32.dll")]
        static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

        [DllImport("wtsapi32.dll", SetLastError = true)]
        static extern bool WTSEnumerateProcessesW(
            IntPtr hServer,
            int Reserved,
            int Version,
            out IntPtr ppProcessInfo,
            out int pCount);

        [DllImport("wtsapi32.dll")]
        static extern void WTSFreeMemory(IntPtr pMemory);

        [DllImport("kernel32.dll")]
        static extern IntPtr OpenProcess(uint dwDesiredAccess, bool bInheritHandle, uint dwProcessId);

        [DllImport("kernel32.dll", CharSet = CharSet.Unicode)]
        static extern bool QueryFullProcessImageNameW(IntPtr hProcess, uint dwFlags, StringBuilder lpExeName, ref uint lpdwSize);

        [DllImport("kernel32.dll")]
        static extern bool CloseHandle(IntPtr hObject);

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        struct WTS_PROCESS_INFO {
            public int SessionId;
            public int ProcessId;
            public IntPtr pProcessName;
            public IntPtr pUserSid;
        }

        struct WindowEntry {
            public uint Pid;
            public string Process;
            public string Path;
            public string Title;
        }

        static void Main(string[] args) {
            Console.OutputEncoding = Encoding.UTF8;

            int pollMs = 5000;
            int parsed;
            if (args.Length > 0 && int.TryParse(args[0], out parsed)) {
                pollMs = Math.Max(500, parsed);
            }

            bool once = false;
            for (int i = 0; i < args.Length; i++) {
                if (args[i] == "--once") once = true;
            }

            if (!once) {
                Thread stdinWatcher = new Thread(delegate() {
                    try {
                        while (Console.In.Read() != -1) {}
                    } catch {}
                    Environment.Exit(0);
                });
                stdinWatcher.IsBackground = true;
                stdinWatcher.Start();
            }

            do {
                DumpSnapshot();
                if (once) break;
                Thread.Sleep(pollMs);
            } while (true);
        }

        static void DumpSnapshot() {
            Dictionary<uint, string> procMap = new Dictionary<uint, string>();
            List<string> procList = new List<string>();
            HashSet<string> seenProcs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            IntPtr pInfo = IntPtr.Zero;
            int count = 0;

            if (WTSEnumerateProcessesW(IntPtr.Zero, 0, 1, out pInfo, out count)) {
                int structSize = Marshal.SizeOf(typeof(WTS_PROCESS_INFO));
                long current = pInfo.ToInt64();
                for (int i = 0; i < count; i++) {
                    WTS_PROCESS_INFO info = (WTS_PROCESS_INFO)Marshal.PtrToStructure(new IntPtr(current), typeof(WTS_PROCESS_INFO));
                    string name = Marshal.PtrToStringUni(info.pProcessName);
                    if (!string.IsNullOrEmpty(name)) {
                        procMap[(uint)info.ProcessId] = name;
                        if (!seenProcs.Contains(name)) {
                            seenProcs.Add(name);
                            procList.Add(name);
                        }
                    }
                    current += structSize;
                }
                WTSFreeMemory(pInfo);
            }

            StringBuilder sb = new StringBuilder(512);
            StringBuilder pathSb = new StringBuilder(1024);
            List<WindowEntry> windows = new List<WindowEntry>();
            HashSet<string> seenWindows = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            EnumWindows(delegate(IntPtr hWnd, IntPtr lParam) {
                if (!IsWindowVisible(hWnd)) return true;
                sb.Length = 0;
                int len = GetWindowTextW(hWnd, sb, 512);
                if (len > 0) {
                    string title = sb.ToString().Trim();
                    if (title.Length > 0) {
                        uint pid;
                        GetWindowThreadProcessId(hWnd, out pid);
                        string procName;
                        if (!procMap.TryGetValue(pid, out procName)) {
                            procName = "";
                        }
                        string key = pid + ":" + title;
                        if (seenWindows.Contains(key)) return true;
                        seenWindows.Add(key);

                        string exePath = "";
                        IntPtr hProc = OpenProcess(0x1000 /* PROCESS_QUERY_LIMITED_INFORMATION */, false, pid);
                        if (hProc != IntPtr.Zero) {
                            uint size = 1024;
                            pathSb.Length = 0;
                            if (QueryFullProcessImageNameW(hProc, 0, pathSb, ref size)) {
                                exePath = pathSb.ToString();
                            }
                            CloseHandle(hProc);
                        }
                        WindowEntry entry = new WindowEntry();
                        entry.Pid = pid;
                        entry.Process = procName;
                        entry.Path = exePath;
                        entry.Title = title;
                        windows.Add(entry);
                    }
                }
                return true;
            }, IntPtr.Zero);

            StringBuilder json = new StringBuilder();
            json.Append("{\"processes\":[");
            for (int i = 0; i < procList.Count; i++) {
                if (i > 0) json.Append(",");
                EscapeJson(json, procList[i]);
            }
            json.Append("],\"windows\":[");
            for (int i = 0; i < windows.Count; i++) {
                if (i > 0) json.Append(",");
                WindowEntry entry = windows[i];
                json.Append("{\"pid\":").Append(entry.Pid)
                    .Append(",\"process\":");
                EscapeJson(json, entry.Process);
                json.Append(",\"path\":");
                EscapeJson(json, entry.Path);
                json.Append(",\"title\":");
                EscapeJson(json, entry.Title);
                json.Append("}");
            }
            json.Append("]}");
            Console.WriteLine(json.ToString());
        }

        static void EscapeJson(StringBuilder sb, string str) {
            sb.Append('"');
            if (!string.IsNullOrEmpty(str)) {
                for (int i = 0; i < str.Length; i++) {
                    char c = str[i];
                    if (c == '"') sb.Append("\\\"");
                    else if (c == '\\') sb.Append("\\\\");
                    else if (c == '\r') sb.Append("\\r");
                    else if (c == '\n') sb.Append("\\n");
                    else if (c == '\t') sb.Append("\\t");
                    else if (c < 32) sb.AppendFormat("\\u{0:x4}", (int)c);
                    else sb.Append(c);
                }
            }
            sb.Append('"');
        }
    }
}
