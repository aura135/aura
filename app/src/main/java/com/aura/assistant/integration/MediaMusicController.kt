package com.aura.assistant.integration

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.view.KeyEvent

class MediaMusicController(private val context: Context) {
    private val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as AudioManager

    fun sendMediaKeyEvent(keyCode: Int): Pair<Boolean, String> {
        return try {
            val eventDown = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
            val eventUp = KeyEvent(KeyEvent.ACTION_UP, keyCode)

            audioManager.dispatchMediaKeyEvent(eventDown)
            audioManager.dispatchMediaKeyEvent(eventUp)

            val actionName = when (keyCode) {
                KeyEvent.KEYCODE_MEDIA_PLAY -> "Playing music"
                KeyEvent.KEYCODE_MEDIA_PAUSE -> "Music paused"
                KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE -> "Toggled music playback"
                KeyEvent.KEYCODE_MEDIA_NEXT -> "Playing next track"
                KeyEvent.KEYCODE_MEDIA_PREVIOUS -> "Playing previous track"
                KeyEvent.KEYCODE_MEDIA_STOP -> "Music stopped"
                else -> "Media command dispatched"
            }
            Pair(true, actionName)
        } catch (e: Exception) {
            Pair(false, "Could not control media playback: ${e.message}")
        }
    }

    fun isMusicActive(): Boolean {
        return audioManager.isMusicActive
    }
}
