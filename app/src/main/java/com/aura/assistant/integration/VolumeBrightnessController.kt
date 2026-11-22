package com.aura.assistant.integration

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.net.Uri
import android.os.Build
import android.provider.Settings

class VolumeBrightnessController(private val context: Context) {
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun adjustVolume(direction: Int): Pair<Boolean, String> {
        return try {
            val flag = AudioManager.FLAG_SHOW_UI or AudioManager.FLAG_PLAY_SOUND
            audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, flag)
            val currentVol = audioManager.getStreamVolume(AudioManager.STREAM_MUSIC)
            val maxVol = audioManager.getStreamMaxVolume(AudioManager.STREAM_MUSIC)
            val percent = (currentVol * 100) / maxVol
            Pair(true, "Volume adjusted to $percent percent.")
        } catch (e: Exception) {
            Pair(false, "Could not adjust volume: ${e.message}")
        }
    }

    fun muteVolume(): Pair<Boolean, String> {
        return try {
            audioManager.setStreamVolume(AudioManager.STREAM_MUSIC, 0, AudioManager.FLAG_SHOW_UI)
            Pair(true, "Media volume muted.")
        } catch (e: Exception) {
            Pair(false, "Could not mute volume: ${e.message}")
        }
    }

    fun adjustBrightness(increase: Boolean): Pair<Boolean, String> {
        return if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.System.canWrite(context)) {
            // Open settings if WRITE_SETTINGS permission not granted
            val intent = Intent(Settings.ACTION_MANAGE_WRITE_SETTINGS).apply {
                data = Uri.parse("package:" + context.packageName)
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
            Pair(false, "Please grant write settings permission to change brightness directly.")
        } else {
            try {
                val current = Settings.System.getInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS, 128)
                val step = 40
                val target = if (increase) (current + step).coerceAtMost(255) else (current - step).coerceAtLeast(10)
                Settings.System.putInt(context.contentResolver, Settings.System.SCREEN_BRIGHTNESS, target)
                val percent = (target * 100) / 255
                Pair(true, "Brightness adjusted to $percent percent.")
            } catch (e: Exception) {
                Pair(false, "Failed to adjust brightness: ${e.message}")
            }
        }
    }
}
