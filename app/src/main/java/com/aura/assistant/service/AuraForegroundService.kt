package com.aura.assistant.service

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.aura.assistant.R
import com.aura.assistant.data.repository.AuraRepository
import com.aura.assistant.integration.AndroidActionManager
import com.aura.assistant.ui.MainActivity
import com.aura.assistant.voice.*
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

enum class AssistantVisualState {
    IDLE,
    LISTENING_FOR_WAKE,
    HEARD_WAKE_WORD,
    LISTENING_FOR_COMMAND,
    PROCESSING,
    SPEAKING,
    PAUSED
}

class AuraForegroundService : Service() {

    private val binder = AuraBinder()
    private val serviceScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

    private lateinit var repository: AuraRepository
    private lateinit var actionManager: AndroidActionManager
    private lateinit var commandEngine: LocalCommandEngine
    private lateinit var wakeWordEngine: AuraWakeWordEngine
    private lateinit var commandRecognizer: AuraSpeechRecognizer
    private lateinit var tts: AuraTextToSpeech

    private val _visualState = MutableStateFlow(AssistantVisualState.LISTENING_FOR_WAKE)
    val visualState: StateFlow<AssistantVisualState> = _visualState.asStateFlow()

    private val _lastSpokenResponse = MutableStateFlow("")
    val lastSpokenResponse: StateFlow<String> = _lastSpokenResponse.asStateFlow()

    private val _lastRecognizedCommand = MutableStateFlow("")
    val lastRecognizedCommand: StateFlow<String> = _lastRecognizedCommand.asStateFlow()

    private val _audioRms = MutableStateFlow(0f)
    val audioRms: StateFlow<Float> = _audioRms.asStateFlow()

    private var isPaused = false
    private var currentLanguage = "en"

    inner class AuraBinder : Binder() {
        fun getService(): AuraForegroundService = this@AuraForegroundService
    }

    companion object {
        const val CHANNEL_ID = "aura_service_channel"
        const val NOTIFICATION_ID = 1001

        const val ACTION_START = "com.aura.assistant.action.START"
        const val ACTION_PAUSE = "com.aura.assistant.action.PAUSE"
        const val ACTION_RESUME = "com.aura.assistant.action.RESUME"
        const val ACTION_STOP = "com.aura.assistant.action.STOP"

        fun startService(context: Context) {
            val intent = Intent(context, AuraForegroundService::class.java).apply {
                action = ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun pauseService(context: Context) {
            val intent = Intent(context, AuraForegroundService::class.java).apply {
                action = ACTION_PAUSE
            }
            context.startService(intent)
        }

        fun resumeService(context: Context) {
            val intent = Intent(context, AuraForegroundService::class.java).apply {
                action = ACTION_RESUME
            }
            context.startService(intent)
        }
    }

    override fun onCreate() {
        super.onCreate()
        repository = AuraRepository(this)
        actionManager = AndroidActionManager(this, repository)
        commandEngine = LocalCommandEngine()

        createNotificationChannel()

        // Initialize TTS
        tts = AuraTextToSpeech(this) { success ->
            serviceScope.launch {
                val lang = repository.getLanguage()
                currentLanguage = lang
                tts.setLanguage(lang)
            }
        }

        // Initialize Wake Word Engine
        wakeWordEngine = AuraWakeWordEngine(this, object : AuraWakeWordListener {
            override fun onWakeWordDetected(phrase: String) {
                handleWakeWordDetected(phrase)
            }

            override fun onListeningStateChanged(isListening: Boolean) {
                if (isListening && !isPaused) {
                    _visualState.value = AssistantVisualState.LISTENING_FOR_WAKE
                } else if (isPaused) {
                    _visualState.value = AssistantVisualState.PAUSED
                }
            }

            override fun onAudioLevel(rmsDb: Float) {
                _audioRms.value = rmsDb
            }
        })

        // Command recognizer
        commandRecognizer = AuraSpeechRecognizer(this, object : AuraSpeechListener {
            override fun onReady() {
                _visualState.value = AssistantVisualState.LISTENING_FOR_COMMAND
            }

            override fun onRmsChanged(rmsdB: Float) {
                _audioRms.value = rmsdB
            }

            override fun onResult(text: String) {
                handleCommandRecognized(text)
            }

            override fun onError(errorCode: Int, errorMessage: String) {
                _visualState.value = AssistantVisualState.IDLE
                _lastSpokenResponse.value = errorMessage
                tts.speak(errorMessage) {
                    resumeWakeWordEngine()
                }
            }
        })
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val notification = buildNotification(if (isPaused) "Listening paused" else "Listening for 'Hey AURA'")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MICROPHONE)
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }

        when (intent?.action) {
            ACTION_PAUSE -> pauseListening()
            ACTION_RESUME -> resumeListening()
            ACTION_STOP -> stopSelf()
            else -> {
                serviceScope.launch {
                    val pausedInPref = repository.isVoicePaused()
                    if (pausedInPref) {
                        pauseListening()
                    } else {
                        resumeListening()
                    }
                }
            }
        }

        return START_STICKY
    }

    private fun handleWakeWordDetected(phrase: String) {
        _visualState.value = AssistantVisualState.HEARD_WAKE_WORD
        _lastRecognizedCommand.value = phrase

        // If wake word was uttered together with the command in one breath
        val clean = phrase.lowercase().trim()
        val wakeWordMatched = MultilingualDictionary.WAKE_WORDS.firstOrNull { clean.startsWith(it) }
        val remainingCommand = if (wakeWordMatched != null) clean.removePrefix(wakeWordMatched).trim().removePrefix(",").trim() else ""

        if (remainingCommand.length > 3) {
            // Execute command directly!
            handleCommandRecognized(remainingCommand)
        } else {
            // Acknowledge wake word and listen for the following command
            wakeWordEngine.pause()
            val ack = MultilingualDictionary.getListeningResponse(currentLanguage)
            _visualState.value = AssistantVisualState.SPEAKING
            tts.speak(ack) {
                _visualState.value = AssistantVisualState.LISTENING_FOR_COMMAND
                commandRecognizer.startListening(currentLanguage)
            }
        }
    }

    private fun handleCommandRecognized(text: String) {
        _visualState.value = AssistantVisualState.PROCESSING
        _lastRecognizedCommand.value = text

        serviceScope.launch {
            val command = commandEngine.parse(text, currentLanguage)
            val result = actionManager.execute(command)

            _visualState.value = AssistantVisualState.SPEAKING
            _lastSpokenResponse.value = result.speechResponse

            updateNotification(result.displayText)

            tts.speak(result.speechResponse) {
                resumeWakeWordEngine()
            }
        }
    }

    private fun resumeWakeWordEngine() {
        if (!isPaused) {
            _visualState.value = AssistantVisualState.LISTENING_FOR_WAKE
            wakeWordEngine.resume()
        } else {
            _visualState.value = AssistantVisualState.PAUSED
        }
    }

    fun pauseListening() {
        isPaused = true
        serviceScope.launch {
            repository.setVoicePaused(true)
        }
        wakeWordEngine.pause()
        commandRecognizer.cancel()
        _visualState.value = AssistantVisualState.PAUSED
        updateNotification("Listening is paused")
    }

    fun resumeListening() {
        isPaused = false
        serviceScope.launch {
            repository.setVoicePaused(false)
            val lang = repository.getLanguage()
            currentLanguage = lang
            wakeWordEngine.setLanguage(lang)
            wakeWordEngine.resume()
        }
        _visualState.value = AssistantVisualState.LISTENING_FOR_WAKE
        updateNotification("Listening for 'Hey AURA'")
    }

    fun togglePause() {
        if (isPaused) resumeListening() else pauseListening()
    }

    fun triggerVoiceCommand(rawInput: String) {
        handleCommandRecognized(rawInput)
    }

    private fun buildNotification(statusText: String): Notification {
        val appIntent = Intent(this, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val pendingAppIntent = PendingIntent.getActivity(this, 0, appIntent, PendingIntent.FLAG_IMMUTABLE)

        val pauseIntent = Intent(this, AuraForegroundService::class.java).apply {
            action = if (isPaused) ACTION_RESUME else ACTION_PAUSE
        }
        val pendingToggle = PendingIntent.getService(this, 1, pauseIntent, PendingIntent.FLAG_IMMUTABLE)
        val toggleActionTitle = if (isPaused) "Resume" else "Pause"

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("AURA Voice Assistant")
            .setContentText(statusText)
            .setSmallIcon(R.drawable.ic_aura_logo)
            .setContentIntent(pendingAppIntent)
            .setOngoing(true)
            .addAction(R.drawable.ic_aura_logo, toggleActionTitle, pendingToggle)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }

    private fun updateNotification(text: String) {
        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify(NOTIFICATION_ID, buildNotification(text))
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AURA Voice Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Foreground service notification for continuous voice activation"
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }

    override fun onBind(intent: Intent?): IBinder = binder

    override fun onDestroy() {
        super.onDestroy()
        serviceScope.cancel()
        wakeWordEngine.stop()
        commandRecognizer.destroy()
        tts.shutdown()
    }
}
