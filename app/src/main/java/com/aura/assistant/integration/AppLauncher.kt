package com.aura.assistant.integration

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri

class AppLauncher(private val context: Context) {

    private val commonPackageMap = mapOf(
        "youtube" to "com.google.android.youtube",
        "whatsapp" to "com.whatsapp",
        "instagram" to "com.instagram.android",
        "spotify" to "com.spotify.music",
        "maps" to "com.google.android.apps.maps",
        "google maps" to "com.google.android.apps.maps",
        "chrome" to "com.android.chrome",
        "camera" to "android.media.action.IMAGE_CAPTURE"
    )

    fun launchApp(appName: String): Pair<Boolean, String> {
        val cleanName = appName.trim().lowercase()

        // Check well-known apps
        val knownPkg = commonPackageMap[cleanName]
        if (knownPkg != null) {
            val intent = context.packageManager.getLaunchIntentForPackage(knownPkg)
            if (intent != null) {
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                context.startActivity(intent)
                return Pair(true, "Opening ${cleanName.capitalize()}")
            }
        }

        // Query all installed launcher activities
        val pm = context.packageManager
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val apps = pm.queryIntentActivities(mainIntent, 0)
        for (resolveInfo in apps) {
            val label = resolveInfo.loadLabel(pm).toString().lowercase()
            if (label.contains(cleanName) || cleanName.contains(label)) {
                val launchIntent = pm.getLaunchIntentForPackage(resolveInfo.activityInfo.packageName)
                if (launchIntent != null) {
                    launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                    context.startActivity(launchIntent)
                    return Pair(true, "Opening ${resolveInfo.loadLabel(pm)}")
                }
            }
        }

        return Pair(false, "That application is not installed on this device.")
    }
}
