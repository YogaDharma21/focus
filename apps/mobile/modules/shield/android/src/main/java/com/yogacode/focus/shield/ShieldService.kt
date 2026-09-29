package com.yogacode.focus.shield

import android.app.ActivityManager
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.graphics.PixelFormat
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.os.Handler
import android.os.HandlerThread
import android.os.IBinder
import android.os.Looper
import android.provider.Settings
import android.view.Gravity
import android.view.View
import android.view.WindowManager
import android.widget.Button
import android.widget.FrameLayout
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.TextView
import org.json.JSONArray
import org.json.JSONObject

class ShieldService : Service() {
  companion object {
    const val PREFS = "focus_shield"
    const val KEY_BLOCKED = "blockedApps"
    const val KEY_VIOLATIONS = "violations"
    const val KEY_ACTIVE = "shieldActive"
    const val KEY_URL_BLOCKING = "urlBlocking"
    const val KEY_BLOCKED_SITES = "blockedSites"
    const val KEY_ALLOWED_SITES = "allowedSites"
    const val ACTION_STOP = "com.yogacode.focus.shield.STOP"
    const val ACTION_SHOW_URL = "com.yogacode.focus.shield.SHOW_URL"
    const val EXTRA_TITLE = "title"
    const val EXTRA_SUBTITLE = "subtitle"
    const val KEY_URL_SNOOZE = "urlSnoozeUntil"
    const val CHANNEL_ID = "focus_shield_channel"
    const val NOTIF_ID = 1001
    const val POLL_MS = 5000L
    const val CLEAR_POLLS_TO_HIDE = 2
    const val VIOLATION_COOLDOWN_MS = 60000L
    const val SNOOZE_MS = 10 * 60 * 1000L
    const val KILL_DELAY_MS = 600L
    const val MAX_VIOLATIONS = 50
  }

  private var worker: HandlerThread? = null
  private var handler: Handler? = null
  private var mainHandler: Handler? = null
  private var overlay: View? = null
  private var overlayPackage: String? = null
  private var clearStreak = 0
  private val lastViolationAt = mutableMapOf<String, Long>()
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
    mainHandler = Handler(Looper.getMainLooper())
    worker = HandlerThread("FocusShield").also { it.start() }
    handler = Handler(worker!!.looper)
    handler?.post(poller)
  }

  override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    if (intent?.action == ACTION_STOP) {
      stopSelf()
      return START_NOT_STICKY
    }
    if (intent?.action == ACTION_SHOW_URL) {
      val title = intent.getStringExtra(EXTRA_TITLE) ?: "Blocked by Focus"
      val subtitle = intent.getStringExtra(EXTRA_SUBTITLE)
        ?: "Stay in Flow — this site is on your block list."
      mainHandler?.post { showOverlayNow("url", title, subtitle, null, null, KEY_URL_SNOOZE) }
    }
    return START_STICKY
  }

  override fun onDestroy() {
    handler?.removeCallbacks(poller)
    worker?.quitSafely()
    worker = null
    handler = null
    try {
      mainHandler?.post { removeOverlayNow() }
    } catch (_: Exception) {
    }
    mainHandler = null
    super.onDestroy()
  }

  private fun dp(v: Int): Int = (v * resources.displayMetrics.density).toInt()

  private fun appLabel(pkg: String): String {
    return try {
      val info = packageManager.getApplicationInfo(pkg, 0)
      packageManager.getApplicationLabel(info).toString()
    } catch (_: Exception) {
      pkg
    }
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
    if (current != null && current != packageName && blockedSet().contains(current)) {
      clearStreak = 0
      val now = System.currentTimeMillis()
      if (now < (snoozedUntil[current] ?: 0L)) {
        postHideOverlay()
        return
      }
      if (now - (lastViolationAt[current] ?: 0L) >= VIOLATION_COOLDOWN_MS) {
        lastViolationAt[current] = now
        recordViolation(current, now)
      }
      if (overlayPackage == current) return
      val pkg = current
      val label = appLabel(pkg)
      mainHandler?.post {
        showOverlayNow(
          pkg,
          "$label blocked",
          "Stay in Flow — $label is on your block list.",
          pkg,
          pkg,
          pkg,
        )
      }
      return
    }
    // Transient blips must not drop the overlay: require consecutive clear polls.
    clearStreak++
    if (clearStreak >= CLEAR_POLLS_TO_HIDE) postHideOverlay()
  }

  private fun postHideOverlay() {
    if (overlay == null) return
    mainHandler?.post { removeOverlayNow() }
  }

  private fun recordViolation(packageName: String, now: Long) {
    val prefs = getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    val arr = try {
      JSONArray(prefs.getString(KEY_VIOLATIONS, "[]") ?: "[]")
    } catch (_: Exception) {
      JSONArray()
    }
    arr.put(
      JSONObject()
        .put("kind", "app")
        .put("match", packageName)
        .put("packageName", packageName)
        .put("timestamp", now.toString()),
    )
    while (arr.length() > MAX_VIOLATIONS) arr.remove(0)
    prefs.edit().putString(KEY_VIOLATIONS, arr.toString()).apply()
  }

  private fun showOverlayNow(
    key: String,
    titleText: String,
    subtitleText: String,
    iconPackage: String?,
    killPackage: String?,
    snoozeKey: String?,
  ) {
    if (!Settings.canDrawOverlays(this)) return
    removeOverlayNow()
    val wm = getSystemService(Context.WINDOW_SERVICE) as WindowManager
    val icon = try {
      iconPackage?.let { packageManager.getApplicationIcon(it) }
    } catch (_: Exception) {
      null
    }

    val dim = FrameLayout(this).apply {
      setBackgroundColor(0xFF000000.toInt())
    }
    val card = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      gravity = Gravity.CENTER_HORIZONTAL
      setPadding(dp(24), dp(28), dp(24), dp(24))
      background = GradientDrawable().apply {
        setColor(0xFF18181B.toInt())
        cornerRadius = dp(28).toFloat()
        setStroke(dp(1), 0xFF27272A.toInt())
      }
    }
    val eyebrow = TextView(this).apply {
      text = "FOCUS SHIELD"
      textSize = 10f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(0xFFA1A1AA.toInt())
      gravity = Gravity.CENTER
      setPadding(0, 0, 0, dp(12))
    }
    card.addView(eyebrow)
    if (icon != null) {
      val iconView = ImageView(this).apply {
        setImageDrawable(icon)
      }
      card.addView(iconView, LinearLayout.LayoutParams(dp(64), dp(64)).apply {
        bottomMargin = dp(16)
      })
    }
    val title = TextView(this).apply {
      text = titleText
      textSize = 22f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(0xFFFAFAFA.toInt())
      gravity = Gravity.CENTER
    }
    val subtitle = TextView(this).apply {
      text = subtitleText
      textSize = 13f
      setTextColor(0xFFA1A1AA.toInt())
      gravity = Gravity.CENTER
      setPadding(0, dp(8), 0, dp(24))
    }
    val openBtn = Button(this).apply {
      text = "Return to Focus"
      textSize = 14f
      setTypeface(typeface, Typeface.BOLD)
      setTextColor(0xFF18181B.toInt())
      background = GradientDrawable().apply {
        setColor(0xFFFAFAFA.toInt())
        cornerRadius = dp(14).toFloat()
      }
      setPadding(dp(16), dp(14), dp(16), dp(14))
      setOnClickListener {
        removeOverlayNow()
        val launch = packageManager.getLaunchIntentForPackage(this@ShieldService.packageName)
        launch?.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        if (launch != null) startActivity(launch)
        // Closest to "close" Android allows: kill the blocked process once backgrounded.
        if (killPackage != null) {
          handler?.postDelayed({
            try {
              val am = getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
              am.killBackgroundProcesses(killPackage)
            } catch (_: Exception) {
            }
          }, KILL_DELAY_MS)
        }
      }
    }
    val snoozeBtn = Button(this).apply {
      text = "Snooze 10 min"
      textSize = 14f
      setTextColor(0xFFFAFAFA.toInt())
      background = GradientDrawable().apply {
        setColor(0x00000000)
        cornerRadius = dp(14).toFloat()
        setStroke(dp(1), 0xFF3F3F46.toInt())
      }
      setPadding(dp(16), dp(14), dp(16), dp(14))
      setOnClickListener {
        if (snoozeKey == KEY_URL_SNOOZE) {
          getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putLong(KEY_URL_SNOOZE, System.currentTimeMillis() + SNOOZE_MS).apply()
        } else if (snoozeKey != null) {
          snoozedUntil[snoozeKey] = System.currentTimeMillis() + SNOOZE_MS
        }
        removeOverlayNow()
      }
    }
    card.addView(title)
    card.addView(subtitle)
    card.addView(openBtn, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT,
    ).apply { bottomMargin = dp(10) })
    card.addView(snoozeBtn, LinearLayout.LayoutParams(
      LinearLayout.LayoutParams.MATCH_PARENT,
      LinearLayout.LayoutParams.WRAP_CONTENT,
    ))
    dim.addView(
      card,
      FrameLayout.LayoutParams(
        FrameLayout.LayoutParams.MATCH_PARENT,
        FrameLayout.LayoutParams.WRAP_CONTENT,
        Gravity.CENTER,
      ).apply {
        leftMargin = dp(24)
        rightMargin = dp(24)
      },
    )

    val params = WindowManager.LayoutParams(
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.MATCH_PARENT,
      WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
      WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
      PixelFormat.TRANSLUCENT,
    )
    try {
      wm.addView(dim, params)
    } catch (_: Exception) {
      return
    }
    overlay = dim
    overlayPackage = key
  }

  private fun removeOverlayNow() {
    val view = overlay ?: return
    overlay = null
    overlayPackage = null
    try {
      (getSystemService(Context.WINDOW_SERVICE) as WindowManager).removeView(view)
    } catch (_: Exception) {
    }
  }
}
