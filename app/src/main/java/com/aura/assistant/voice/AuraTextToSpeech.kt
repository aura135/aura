package com.aura.assistant.voice

import android.content.Context
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import java.util.Locale

class AuraTextToSpeech(private val context: Context, private val onInitCompleted: (Boolean) -> Unit = {}) : TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null
    private var isInitialized = false
    private var currentLangCode = "en"

    init {
        tts = TextToSpeech(context, this)
    }

    override fun onInit(status: Int) {
        if (status == TextToSpeech.SUCCESS) {
            isInitialized = true
            setLanguage(currentLangCode)
            onInitCompleted(true)
        } else {
            isInitialized = false
            onInitCompleted(false)
        }
    }

    fun setLanguage(langCode: String) {
        currentLangCode = langCode
        if (!isInitialized) return
        val locale = when (langCode) {
            "te" -> Locale("te", "IN")
            "hi" -> Locale("hi", "IN")
            else -> Locale.US
        }
        val result = tts?.setLanguage(locale)
        if (result == TextToSpeech.LANG_MISSING_DATA || result == TextToSpeech.LANG_NOT_SUPPORTED) {
            tts?.setLanguage(Locale.US)
        }
    }

    fun setSpeechRate(rate: Float) {
        tts?.setSpeechRate(rate.coerceIn(0.5f, 2.0f))
    }

    fun setPitch(pitch: Float) {
        tts?.setPitch(pitch.coerceIn(0.5f, 2.0f))
    }

    fun speak(text: String, onDone: () -> Unit = {}) {
        if (!isInitialized) return

        val utteranceId = "AURA_${System.currentTimeMillis()}"
        tts?.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
            override fun onStart(id: String?) {}
            override fun onDone(id: String?) {
                if (id == utteranceId) onDone()
            }
            override fun onError(id: String?) {
                if (id == utteranceId) onDone()
            }
        })

        tts?.speak(text, TextToSpeech.QUEUE_FLUSH, null, utteranceId)
    }

    fun stop() {
        tts?.stop()
    }

    fun shutdown() {
        tts?.stop()
        tts?.shutdown()
        tts = null
        isInitialized = false
    }
}
