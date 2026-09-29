package com.yogacode.focus.shield

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject

class ShieldService : Service() {
  companion object {
    const val PREFS = "focus_shield"
    const val KEY_BLOCKED = "blockedApps"
    const val KEY_VIOLATIONS = "violations"
    const val ACTION_STOP = "com.yogacode.focus.shield.STOP"
    const val CHANNEL_ID = "focus_shield_channel"
    const val NOTIF_ID = 1001
    const val POLL_MS = 5000L
    const val OVERLAY_COOLDOWN_MS = 60000L
    const val SNOOZE_MS = 10 * 60 * 1000L
    const val MAX_VIOLATIONS = 50
  }

  private var worker: HandlerThread? = null
  private var handler: Handler? = null
  private var overlay: View? = null
  private var overlayPackage: String? = null
  private val lastOverlayAt = mutableMapOf<String, Long>()
  private val snoozedUntil = mutableMapOf<String, Long>()

  private val poller = object : Runnable {
    override fun run() {
      try {
        pollOnce()
      } catch (_: Exception) {
      }
      handler?.postDelayed(this, POLL_MS)
    }
  }

  override fun onBind(intent: Intent?): IBinder? = null

  override fun onCreate() {
    super.onCreate()
    ensureChannel()
    startForegroundWithType()
    worker = HandlerThread("FocusShield").also { it.start() }
    handler = Handler(worker!!.looper)
    handler?.post(poller)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    return START_STICKY
  }

  override fun onDestroy() {
    handler?.removeCallbacks(poller)
    worker?.quitSafely()
    worker = null
    handler = null
    hideOverlay()
    super.onDestroy()
  }

  private fun ensureChannel() {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return
    val manager = getSystemService(NotificationManager::class.java) ?: return
    if (manager.getNotificationChannel(CHANNEL_ID) == null) {
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Focus Shield", NotificationManager.IMPORTANCE_LOW),
      )
    }
  }

  private fun startForegroundWithType() {
    val stopIntent = Intent(this, ShieldService::class.java).setAction(ACTION_STOP)
    val stopFlags = PendingIntent.FLAG_UPDATE_CURRENT or
      (if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) PendingIntent.FLAG_IMMUTABLE else 0)
    val stopAction = PendingIntent.getService(this, 0, stopIntent, stopFlags)
    val notif = Notification.Builder(this, CHANNEL_ID)
      .setContentTitle("Shield is watching")
      .setContentText("Blocking distracting apps during this Flow session.")
      .setSmallIcon(android.R.drawable.ic_lock_idle_lock)
      .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopAction)
      .build()
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      startForeground(
        NOTIF_ID,
        notif,
        android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE,
      )
    } else {
      @Suppress("DEPRECATION")
      startForeground(NOTIF_ID, notif)
    }
  }

  private fun blockedSet(): Set<String> {
    return getSharedPreferences(PREFS, Context.MODE_PRIVATE)
      .getStringSet(KEY_BLOCKED, emptySet()) ?: emptySet()
  }

  private fun foregroundPackage(): String? {
    val usage = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
    val now = System.currentTimeMillis()
    val stats = usage.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 10_000L, now)
      ?: return null
    return stats.maxByOrNull { it.lastTimeUsed }?.packageName
  }

  private fun pollOnce() {
    val current = foregroundPackage()
    if (current == null || current == packageName) {
      if (current == packageName) hideOverlay()
      return
    }
    val blocked = blockedSet()
    if (!blocked.contains(current)) {
      hideOverlay()
      return
    }
    val now = System.currentTimeMillis()
    if (now < (snoozedUntil[current] ?: 0L)) {
      hideOverlay()
      return
    }
    recordViolation(current, now)
    if (overlayPackage == current) return
    if (now - (lastOverlayAt[current] ?: 0L) < OVERLAY_COOLDOWN_MS) return
    lastOverlayAt[current] = now
    showOverlay(current)
  }

  private fun recordViolation(packageName: String, now: Long) {
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = try {
      JSONArray(prefs.getString(KEY_VIOLATIONS, "[]") ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }
    arr.put(JSONObject().put("packageName", packageName).put("timestamp", now.toString()))
    while (arr.length() > MAX_VIOLATIONS) arr.remove(0)
    prefs.edit().putString(KEY_VIOLATIONS, arr.toString()).apply()
  }

  private fun showOverlay(packageName: String) {
    if (!Settings.canDrawOverlays(this)) return
    hideOverlay()
    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager

    val container = FrameLayout(this).apply {
      setBackgroundColor(0xE609090B.toInt())
    }
    val box = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER
      setPadding(48, 48, 48, 48)
    }
    val title = TextView(this).apply {
      text = "Blocked by Focus"
      textSize = 24f
      setTextColor(0xFFFAFAFA.toInt())
      gravity = Gravity.CENTER
    }
    val subtitle = TextView(this).apply {
      text = "$packageName is on your block list.\nReturn to your Flow session."
      textSize = 14f
      setTextColor(0xFFA1A1AA.toInt())
      gravity = Gravity.CENTER
      setPadding(0, 16, 0, 32)
    }
    val openBtn = Button(this).apply {
      text = "Return to Focus"
      setOnClickListener {
        val launch = packageManager.getLaunchIntentForPackage(packageName)
        launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (launch != null) startActivity(launch)
        hideOverlay()
      }
    }
    val snoozeBtn = Button(this).apply {
      text = "Snooze 10 min"
      setOnClickListener {
        snoozedUntil[packageName] = System.currentTimeMillis() + SNOOZE_MS
        hideOverlay()
      }
    }
    box.addView(title)
    box.addView(subtitle)
    box.addView(openBtn)
    box.addView(snoozeBtn)
    container.addView(
      box,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER,
      ),
    )

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )
    try {
      wm.addView(container, params)
    } catch (_: Exception) {
      return
    }
    overlay = container
    overlayPackage = packageName
  }

  private fun hideOverlay() {
    val view = overlay ?: return
    overlay = null
    overlayPackage = null
    try {
      (getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(view)
    } catch (_: Exception) {
    }
  }
}
