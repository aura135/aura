package com.aura.assistant.ui.viewmodel

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.aura.assistant.data.local.entity.AlarmEntity
import com.aura.assistant.data.local.entity.NoteEntity
import com.aura.assistant.data.local.entity.NotePointEntity
import com.aura.assistant.data.local.entity.ReminderEntity
import com.aura.assistant.data.local.entity.TaskEntity
import com.aura.assistant.data.repository.AuraRepository
import com.aura.assistant.service.AssistantVisualState
import com.aura.assistant.service.AuraForegroundService
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

class AuraViewModel(
    application: Application,
    private val repository: AuraRepository
) : AndroidViewModel(application) {

    private var auraService: AuraForegroundService? = null
    private var isBound = false

    val visualState = MutableStateFlow(AssistantVisualState.IDLE)
    val lastSpokenResponse = MutableStateFlow("")
    val lastRecognizedCommand = MutableStateFlow("")
    val audioRms = MutableStateFlow(0f)

    val isVoiceEnrolled = MutableStateFlow(true)
    val isVoicePaused = MutableStateFlow(false)
    val currentLanguage = MutableStateFlow("en")

    val notes = repository.allNotesFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val reminders = repository.allRemindersFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val alarms = repository.allAlarmsFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val tasks = repository.allTasksFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val commandHistory = repository.commandHistoryFlow.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as? AuraForegroundService.AuraBinder
            auraService = binder?.getService()
            isBound = true

            auraService?.let { s ->
                viewModelScope.launch {
                    s.visualState.collect { visualState.value = it }
                }
                viewModelScope.launch {
                    s.lastSpokenResponse.collect { lastSpokenResponse.value = it }
                }
                viewModelScope.launch {
                    s.lastRecognizedCommand.collect { lastRecognizedCommand.value = it }
                }
                viewModelScope.launch {
                    s.audioRms.collect { audioRms.value = it }
                }
            }
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            auraService = null
            isBound = false
        }
    }

    init {
        loadPreferences()
        bindService()
    }

    private fun loadPreferences() {
        viewModelScope.launch {
            isVoiceEnrolled.value = repository.isVoiceEnrolled()
            isVoicePaused.value = repository.isVoicePaused()
            currentLanguage.value = repository.getLanguage()
        }
    }

    fun bindService() {
        val context = getApplication<Application>()
        val intent = Intent(context, AuraForegroundService::class.java)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    // STRICT MAIN VOICE INTERFACE CONTROLS:
    // 1. ADD VOICE
    fun addVoice() {
        viewModelScope.launch {
            repository.setVoiceEnrolled(true)
            repository.setVoicePaused(false)
            isVoiceEnrolled.value = true
            isVoicePaused.value = false
            AuraForegroundService.startService(getApplication())
            auraService?.resumeListening()
        }
    }

    // 2. REMOVE VOICE
    fun removeVoice() {
        viewModelScope.launch {
            repository.setVoiceEnrolled(false)
            isVoiceEnrolled.value = false
            auraService?.pauseListening()
        }
    }

    // 3. DELETE VOICE
    fun deleteVoice() {
        viewModelScope.launch {
            repository.deleteVoiceProfile()
            isVoiceEnrolled.value = false
            isVoicePaused.value = false
            auraService?.pauseListening()
        }
    }

    // 4. PAUSE VOICE
    fun togglePauseVoice() {
        viewModelScope.launch {
            val currentlyPaused = isVoicePaused.value
            val targetState = !currentlyPaused
            repository.setVoicePaused(targetState)
            isVoicePaused.value = targetState
            if (targetState) {
                auraService?.pauseListening()
            } else {
                auraService?.resumeListening()
            }
        }
    }

    fun setLanguage(lang: String) {
        viewModelScope.launch {
            repository.setLanguage(lang)
            currentLanguage.value = lang
            auraService?.resumeListening()
        }
    }

    fun triggerVoiceCommand(text: String) {
        auraService?.triggerVoiceCommand(text)
    }

    suspend fun getPointsForNote(noteId: Long): List<NotePointEntity> {
        return repository.getPointsForNote(noteId)
    }

    fun deleteNote(noteId: Long) {
        viewModelScope.launch {
            repository.deleteNote(noteId)
        }
    }

    fun completeTask(taskId: Long) {
        viewModelScope.launch {
            repository.completeTask(taskId)
        }
    }

    fun readPointsAloud(points: List<NotePointEntity>) {
        val text = "Reading saved points: " + points.sortedBy { it.pointOrder }.mapIndexed { i, p -> "Point ${i + 1}: ${p.pointText}" }.joinToString(". ")
        triggerVoiceCommand("repeat these points")
    }

    override fun onCleared() {
        super.onCleared()
        if (isBound) {
            try {
                getApplication<Application>().unbindService(serviceConnection)
            } catch (e: Exception) {
                // ignore
            }
            isBound = false
        }
    }
}

class AuraViewModelFactory(
    private val application: Application,
    private val repository: AuraRepository
) : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuraViewModel::class.java)) {
            @Suppress("UNCHECKED_CAST")
            return AuraViewModel(application, repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
