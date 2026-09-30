package com.yogacode.focus.shield

import android.accessibilityservice.AccessibilityService
import android.content.Context
import android.content.Intent
import android.view.accessibility.AccessibilityEvent
import android.view.accessibility.AccessibilityNodeInfo

/**
 * Detects blocked websites in browser address bars while Shield is enforcing.
 * Only runs when the user enabled the service AND url blocking is on AND a
 * Flow session is actively enforcing (mirrored into prefs by startShield).
 */
class ShieldAccessibilityService : AccessibilityService() {
  companion object {
    const val SCAN_THROTTLE_MS = 3000L
    const val URL_BLOCK_COOLDOWN_MS = 10000L
    const val MAX_NODES = 300
  }

  private val lastScanAt = mutableMapOf<String, Long>()
  private val lastUrlBlockAt = mutableMapOf<String, Long>()

  private fun shieldEnforcing(): Boolean {
    val prefs = getSharedPreferences(ShieldService.PREFS, Context.MODE_PRIVATE)
    return prefs.getBoolean(ShieldService.KEY_ACTIVE, false) &&
      prefs.getBoolean(ShieldService.KEY_URL_BLOCKING, false)
  }

  private fun blockedSites(): List<String> {
    val prefs = getSharedPreferences(ShieldService.PREFS, Context.MODE_PRIVATE)
    return prefs.getStringSet(ShieldService.KEY_BLOCKED_SITES, emptySet())?.toList() ?: emptyList()
  }

  private fun allowedSites(): List<String> {
    val prefs = getSharedPreferences(ShieldService.PREFS, Context.MODE_PRIVATE)
    return prefs.getStringSet(ShieldService.KEY_ALLOWED_SITES, emptySet())?.toList() ?: emptyList()
  }

  override fun onServiceConnected() {
  }

  override fun onAccessibilityEvent(event: AccessibilityEvent?) {
    if (event == null) return
    val type = event.eventType
    if (type != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED &&
      type != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
    ) {
      return
    }
    val pkg = event.packageName?.toString() ?: return
    if (!shieldEnforcing()) return
    val now = System.currentTimeMillis()
    if (now - (lastScanAt[pkg] ?: 0L) < SCAN_THROTTLE_MS) return
    lastScanAt[pkg] = now
    val root = rootInActiveWindow ?: return
    try {
      val match = findBlockedDomain(root, blockedSites(), allowedSites())
      if (match != null && now - (lastUrlBlockAt[pkg] ?: 0L) >= URL_BLOCK_COOLDOWN_MS) {
        lastUrlBlockAt[pkg] = now
        handleUrlBlock(pkg, match, now)
      }
    } catch (_: Exception) {
    } finally {
      try {
        root.recycle()
      } catch (_: Exception) {
      }
    }
  }

  override fun onInterrupt() {
  }

  private fun handleUrlBlock(pkg: String, domain: String, now: Long) {
    recordSiteViolation(domain, now)
    val intent = Intent(this, ShieldService::class.java).apply {
      action = ShieldService.ACTION_SHOW_URL
      putExtra(ShieldService.EXTRA_PACKAGE, pkg)
      putExtra(ShieldService.EXTRA_TITLE, "$domain blocked")
      putExtra(ShieldService.EXTRA_SUBTITLE, "Stay in Flow — $domain is on your block list.")
    }
    try {
      startService(intent)
    } catch (_: Exception) {
    }
  }

  private fun recordSiteViolation(domain: String, now: Long) {
    val prefs = getSharedPreferences(ShieldService.PREFS, Context.MODE_PRIVATE)
    val arr = try {
      org.json.JSONArray(prefs.getString(ShieldService.KEY_VIOLATIONS, "[]") ?: "[]")
    } catch (_: Exception) {
      org.json.JSONArray()
    }
    arr.put(
      org.json.JSONObject()
        .put("kind", "site")
        .put("match", domain)
        .put("packageName", "")
        .put("timestamp", now.toString()),
    )
    while (arr.length() > ShieldService.MAX_VIOLATIONS) arr.remove(0)
    prefs.edit().putString(ShieldService.KEY_VIOLATIONS, arr.toString()).apply()
  }

  private fun normalizeSite(input: String): String {
    return input.trim().lowercase()
      .replace(Regex("^https?://"), "")
      .replace(Regex("^www\\."), "")
      .split(Regex("[/:?#]"))[0]
      .trim()
  }

  private fun siteKeyword(site: String): String? {
    val labels = normalizeSite(site).split(".").filter { it.isNotEmpty() }
    if (labels.size < 2) return null
    val name = labels[labels.size - 2]
    return if (name.length >= 4) name else null
  }

  private fun textMatches(text: String, site: String, isUrlField: Boolean): Boolean {
    val clean = normalizeSite(site)
    if (clean.isEmpty()) return false
    if (text.contains(clean)) return true
    // Keyword fallback (e.g. "twitter" for twitter.com) only inside the URL bar.
    // Page bodies match on full domains only, so share widgets can't false-positive.
    if (!isUrlField) return false
    if (!text.contains(".") && !text.contains("/")) return false
    val keyword = siteKeyword(site) ?: return false
    return text.contains(keyword)
  }

  private fun findBlockedDomain(
    root: AccessibilityNodeInfo,
    blocked: List<String>,
    allowed: List<String>,
  ): String? {
    val queue = ArrayDeque<AccessibilityNodeInfo>()
    queue.add(root)
    var visited = 0
    while (queue.isNotEmpty() && visited < MAX_NODES) {
      val node = queue.removeFirst()
      visited++
      try {
        val rawText = StringBuilder()
        node.text?.let { rawText.append(it).append(' ') }
        node.contentDescription?.let { rawText.append(it) }
        if (rawText.isNotEmpty()) {
          val text = rawText.toString().lowercase()
          val isUrlField = node.className?.toString() == "android.widget.EditText"
          val isAllowed = allowed.any { textMatches(text, it, isUrlField) }
          if (!isAllowed) {
            for (site in blocked) {
              if (textMatches(text, site, isUrlField)) return normalizeSite(site)
            }
          }
        }
        for (i in 0 until node.childCount) {
          node.getChild(i)?.let { queue.add(it) }
        }
      } catch (_: Exception) {
      }
    }
    return null
  }
}
