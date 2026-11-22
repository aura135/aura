package com.aura.assistant.voice

import android.content.Context
import android.os.Handler
import android.os.Looper

interface AuraWakeWordListener {
    fun onWakeWordDetected(phrase: String)
    fun onListeningStateChanged(isListening: Boolean)
    fun onAudioLevel(rmsDb: Float)
}

class AuraWakeWordEngine(
    private val context: Context,
    private val listener: AuraWakeWordListener
) {
    private var isRunning = false
    private var isPaused = false
    private var currentLanguage = "en"
    private val mainHandler = Handler(Looper.getMainLooper())

    private var speechRecognizer: AuraSpeechRecognizer? = null

    fun setLanguage(lang: String) {
        currentLanguage = lang
    }

    fun start() {
        if (isRunning) return
        isRunning = true
        isPaused = false
        listener.onListeningStateChanged(true)
        startWakeWordLoop()
    }

    fun pause() {
        isPaused = true
        speechRecognizer?.cancel()
        listener.onListeningStateChanged(false)
    }

    fun resume() {
        if (!isRunning) {
            start()
            return
        }
        isPaused = false
        listener.onListeningStateChanged(true)
        startWakeWordLoop()
    }

    fun stop() {
        isRunning = false
        isPaused = false
        speechRecognizer?.cancel()
        speechRecognizer?.destroy()
        speechRecognizer = null
        listener.onListeningStateChanged(false)
    }

    private fun startWakeWordLoop() {
        if (!isRunning || isPaused) return

        mainHandler.post {
            speechRecognizer?.destroy()
            speechRecognizer = AuraSpeechRecognizer(context, object : AuraSpeechListener {
                override fun onReady() {
                    // Ready to listen
                }

                override fun onRmsChanged(rmsdB: Float) {
                    if (isRunning && !isPaused) {
                        listener.onAudioLevel(rmsdB)
                    }
                }

                override fun onResult(text: String) {
                    val clean = text.lowercase().trim()
                    // Check if wake word present
                    val matchedWakeWord = MultilingualDictionary.WAKE_WORDS.firstOrNull { clean.contains(it) }

                    if (matchedWakeWord != null) {
                        listener.onWakeWordDetected(clean)
                    } else {
                        // Restart listening loop if wake word not detected
                        scheduleNextListening(500)
                    }
                }

                override fun onError(errorCode: Int, errorMessage: String) {
                    // In continuous wake-word loop, timeout or no match is expected
                    scheduleNextListening(1000)
                }
            })

            speechRecognizer?.startListening(currentLanguage)
        }
    }

    private fun scheduleNextListening(delayMs: Long) {
        if (isRunning && !isPaused) {
            mainHandler.postDelayed({
                if (isRunning && !isPaused) {
                    startWakeWordLoop()
                }
            }, delayMs)
        }
    }
}
