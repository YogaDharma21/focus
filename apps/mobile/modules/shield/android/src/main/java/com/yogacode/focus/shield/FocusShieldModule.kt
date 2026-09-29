package com.yogacode.focus.shield

import android.app.ActivityManager
import android.app.AppOpsManager
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Process
import android.provider.Settings
import androidx.core.content.ContextCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import org.json.JSONArray

class FocusShieldModule : Module() {
  private val prefs
    get() = appContext.reactContext?.getSharedPreferences(ShieldService.PREFS, Context.MODE_PRIVATE)

  private fun hasUsageAccess(): Boolean {
    val context = appContext.reactContext ?: return false
    val appOps = context.getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
    val mode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
      appOps.unsafeCheckOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    } else {
      @Suppress("DEPRECATION")
      appOps.checkOpNoThrow(
        AppOpsManager.OPSTR_GET_USAGE_STATS,
        Process.myUid(),
        context.packageName,
      )
    }
    return mode == AppOpsManager.MODE_ALLOWED
  }

  override fun definition() = ModuleDefinition {
    Name("FocusShield")

    Function("hasUsageAccess") {
      return@Function hasUsageAccess()
    }

    Function("canDrawOverlays") {
      val context = appContext.reactContext ?: return@Function false
      return@Function Settings.canDrawOverlays(context)
    }

    Function("isServiceRunning") {
      val context = appContext.reactContext ?: return@Function false
      val manager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
      @Suppress("DEPRECATION")
      return@Function manager.getRunningServices(Int.MAX_VALUE).any {
        it.service.className == ShieldService::class.java.name
      }
    }

    Function("startShield") { blockedApps: List<String> ->
      val context = appContext.reactContext ?: return@Function false
      if (!hasUsageAccess() || !Settings.canDrawOverlays(context)) return@Function false
      prefs?.edit()?.putStringSet(ShieldService.KEY_BLOCKED, blockedApps.toSet())?.apply()
      val intent = Intent(context, ShieldService::class.java)
      ContextCompat.startForegroundService(context, intent)
      return@Function true
    }

    Function("stopShield") {
      val context = appContext.reactContext ?: return@Function false
      context.stopService(Intent(context, ShieldService::class.java))
      return@Function true
    }

    Function("getPendingViolations") {
      val stored = prefs?.getString(ShieldService.KEY_VIOLATIONS, "[]") ?: "[]"
      prefs?.edit()?.remove(ShieldService.KEY_VIOLATIONS)?.apply()
      val out = ArrayList<Map<String, String>>()
      try {
        val arr = JSONArray(stored)
        for (i in 0 until arr.length()) {
          val obj = arr.optJSONObject(i) ?: continue
          out.add(
            mapOf(
              "packageName" to (obj.optString("packageName", "")),
              "timestamp" to (obj.optString("timestamp", "0")),
            ),
          )
        }
      } catch (_: Exception) {
      }
      return@Function out
    }
  }
}
