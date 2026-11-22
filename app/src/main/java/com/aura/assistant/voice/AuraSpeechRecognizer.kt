package com.aura.assistant.voice

import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer

interface AuraSpeechListener {
    fun onReady() {}
    fun onSpeechStarted() {}
    fun onRmsChanged(rmsdB: Float) {}
    fun onSpeechEnded() {}
    fun onResult(text: String)
    fun onError(errorCode: Int, errorMessage: String)
}

class AuraSpeechRecognizer(
    private val context: Context,
    private val listener: AuraSpeechListener
) {
    private var speechRecognizer: SpeechRecognizer? = null
    private var isListening = false

    init {
        initRecognizer()
    }

    private fun initRecognizer() {
        if (SpeechRecognizer.isRecognitionAvailable(context)) {
            speechRecognizer = SpeechRecognizer.createSpeechRecognizer(context).apply {
                setRecognitionListener(object : RecognitionListener {
                    override fun onReadyForSpeech(params: Bundle?) {
                        isListening = true
                        listener.onReady()
                    }

                    override fun onBeginningOfSpeech() {
                        listener.onSpeechStarted()
                    }

                    override fun onRmsChanged(rmsdB: Float) {
                        listener.onRmsChanged(rmsdB)
                    }

                    override fun onBufferReceived(buffer: ByteArray?) {}

                    override fun onEndOfSpeech() {
                        isListening = false
                        listener.onSpeechEnded()
                    }

                    override fun onError(error: Int) {
                        isListening = false
                        val message = getErrorMessage(error)
                        listener.onError(error, message)
                    }

                    override fun onResults(results: Bundle?) {
                        isListening = false
                        val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        val text = matches?.firstOrNull() ?: ""
                        if (text.isNotBlank()) {
                            listener.onResult(text)
                        } else {
                            listener.onError(-1, "No speech recognized.")
                        }
                    }

                    override fun onPartialResults(partialResults: Bundle?) {
                        val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
                        matches?.firstOrNull()?.let {
                            // Partial output if needed
                        }
                    }

                    override fun onEvent(eventType: Int, params: Bundle?) {}
                })
            }
        }
    }

    fun startListening(languageCode: String = "en") {
        if (speechRecognizer == null) {
            initRecognizer()
        }
        val localeTag = when (languageCode) {
            "te" -> "te-IN"
            "hi" -> "hi-IN"
            else -> "en-US"
        }

        val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply {
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE, localeTag)
            putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, localeTag)
            putExtra(RecognizerIntent.EXTRA_ONLY_RETURN_LANGUAGE_PREFERENCE, localeTag)
            putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true)
            putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 3)
            putExtra(RecognizerIntent.EXTRA_CALLING_PACKAGE, context.packageName)
        }

        try {
            speechRecognizer?.startListening(intent)
        } catch (e: Exception) {
            listener.onError(-1, "Error starting speech recognition: ${e.message}")
        }
    }

    fun stopListening() {
        if (isListening) {
            speechRecognizer?.stopListening()
            isListening = false
        }
    }

    fun cancel() {
        speechRecognizer?.cancel()
        isListening = false
    }

    fun destroy() {
        try {
            speechRecognizer?.destroy()
        } catch (e: Exception) {
            // ignore
        }
        speechRecognizer = null
        isListening = false
    }

    private fun getErrorMessage(errorCode: Int): String {
        return when (errorCode) {
            SpeechRecognizer.ERROR_AUDIO -> "Audio recording error."
            SpeechRecognizer.ERROR_CLIENT -> "Client-side error."
            SpeechRecognizer.ERROR_INSUFFICIENT_PERMISSIONS -> "Microphone permission required."
            SpeechRecognizer.ERROR_NETWORK -> "Network connection error."
            SpeechRecognizer.ERROR_NETWORK_TIMEOUT -> "Network timeout."
            SpeechRecognizer.ERROR_NO_MATCH -> "No speech match found."
            SpeechRecognizer.ERROR_RECOGNIZER_BUSY -> "Speech recognizer is busy."
            SpeechRecognizer.ERROR_SERVER -> "Server error."
            SpeechRecognizer.ERROR_SPEECH_TIMEOUT -> "No speech input heard."
            else -> "Speech recognition error ($errorCode)."
        }
    }
}
