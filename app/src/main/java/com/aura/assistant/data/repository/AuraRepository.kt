package com.aura.assistant.data.repository

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import com.aura.assistant.data.local.AuraDatabase
import com.aura.assistant.data.local.entity.*
import com.aura.assistant.service.ReminderAlarmReceiver
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.withContext
import java.util.Calendar

class AuraRepository(private val context: Context) {
    private val db = AuraDatabase.getInstance(context)
    private val noteDao = db.noteDao()
    private val reminderDao = db.reminderDao()
    private val alarmDao = db.alarmDao()
    private val taskDao = db.taskDao()
    private val preferenceDao = db.preferenceDao()
    private val commandHistoryDao = db.commandHistoryDao()
    private val alarmManager = context.getSystemService(Context.ALARM_SERVICE) as AlarmManager

    // Preferences Keys
    companion object {
        const val PREF_VOICE_ENROLLED = "voice_enrolled"
        const val PREF_VOICE_PAUSED = "voice_paused"
        const val PREF_LANGUAGE = "selected_language" // "en", "te", "hi"
        const val PREF_SPEECH_RATE = "speech_rate"
        const val PREF_SPEECH_PITCH = "speech_pitch"
        const val PREF_WAKE_SENSITIVITY = "wake_sensitivity"
        const val PREF_CLOUD_SYNC = "cloud_sync_enabled"
        const val PREF_SERVER_URL = "server_url"
    }

    // --- Voice Management Preferences ---
    suspend fun isVoiceEnrolled(): Boolean = withContext(Dispatchers.IO) {
        preferenceDao.getPreference(PREF_VOICE_ENROLLED)?.toBoolean() ?: true
    }

    suspend fun setVoiceEnrolled(enrolled: Boolean) = withContext(Dispatchers.IO) {
        preferenceDao.setPreference(PreferenceEntity(PREF_VOICE_ENROLLED, enrolled.toString()))
    }

    suspend fun isVoicePaused(): Boolean = withContext(Dispatchers.IO) {
        preferenceDao.getPreference(PREF_VOICE_PAUSED)?.toBoolean() ?: false
    }

    suspend fun setVoicePaused(paused: Boolean) = withContext(Dispatchers.IO) {
        preferenceDao.setPreference(PreferenceEntity(PREF_VOICE_PAUSED, paused.toString()))
    }

    suspend fun getLanguage(): String = withContext(Dispatchers.IO) {
        preferenceDao.getPreference(PREF_LANGUAGE) ?: "en"
    }

    suspend fun setLanguage(lang: String) = withContext(Dispatchers.IO) {
        preferenceDao.setPreference(PreferenceEntity(PREF_LANGUAGE, lang))
    }

    suspend fun deleteVoiceProfile() = withContext(Dispatchers.IO) {
        preferenceDao.removePreference(PREF_VOICE_ENROLLED)
        preferenceDao.removePreference(PREF_VOICE_PAUSED)
        preferenceDao.removePreference(PREF_SPEECH_RATE)
        preferenceDao.removePreference(PREF_SPEECH_PITCH)
        preferenceDao.removePreference(PREF_WAKE_SENSITIVITY)
        preferenceDao.setPreference(PreferenceEntity(PREF_VOICE_ENROLLED, "false"))
    }

    // --- Notes and Ordered Points ---
    val allNotesFlow: Flow<List<NoteEntity>> = noteDao.getAllNotesFlow()

    suspend fun saveNoteWithPoints(title: String, points: List<String>, category: String = "General"): Long = withContext(Dispatchers.IO) {
        val note = NoteEntity(title = title, category = category)
        val noteId = noteDao.insertNote(note)
        val pointEntities = points.mapIndexed { index, text ->
            NotePointEntity(
                noteId = noteId,
                pointText = text.trim(),
                pointOrder = index + 1
            )
        }
        noteDao.insertPoints(pointEntities)
        noteId
    }

    suspend fun getPointsForNote(noteId: Long): List<NotePointEntity> = withContext(Dispatchers.IO) {
        noteDao.getPointsForNote(noteId)
    }

    suspend fun getLatestNotePoints(): Pair<NoteEntity?, List<NotePointEntity>> = withContext(Dispatchers.IO) {
        val latestNote = noteDao.getLatestNote()
        if (latestNote != null) {
            val points = noteDao.getPointsForNote(latestNote.id)
            Pair(latestNote, points)
        } else {
            Pair(null, emptyList())
        }
    }

    suspend fun searchNotes(query: String): List<NoteEntity> = withContext(Dispatchers.IO) {
        noteDao.searchNotes(query)
    }

    suspend fun deleteNote(noteId: Long) = withContext(Dispatchers.IO) {
        noteDao.deletePointsForNote(noteId)
        noteDao.deleteNoteById(noteId)
    }

    // --- Reminders and Free-Time Scheduling ---
    val allRemindersFlow: Flow<List<ReminderEntity>> = reminderDao.getAllRemindersFlow()

    suspend fun scheduleReminder(
        title: String,
        timeMillis: Long,
        repeatType: String = "NONE",
        isFreeTime: Boolean = false,
        freeTimeStart: String = "",
        freeTimeEnd: String = ""
    ): Long = withContext(Dispatchers.IO) {
        val reminder = ReminderEntity(
            title = title,
            reminderTime = timeMillis,
            repeatType = repeatType,
            isFreeTime = isFreeTime,
            freeTimeStart = freeTimeStart,
            freeTimeEnd = freeTimeEnd
        )
        val id = reminderDao.insertReminder(reminder)
        registerAlarmManagerReminder(id, title, timeMillis)
        id
    }

    private fun registerAlarmManagerReminder(id: Long, title: String, timeMillis: Long) {
        if (timeMillis <= System.currentTimeMillis()) return
        val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
            action = ReminderAlarmReceiver.ACTION_FIRE_REMINDER
            putExtra(ReminderAlarmReceiver.EXTRA_REMINDER_ID, id)
            putExtra(ReminderAlarmReceiver.EXTRA_REMINDER_TITLE, title)
        }
        val pendingIntent = PendingIntent.getBroadcast(
            context,
            id.toInt(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, timeMillis, pendingIntent)
            } else {
                alarmManager.setExact(AlarmManager.RTC_WAKEUP, timeMillis, pendingIntent)
            }
        } catch (e: SecurityException) {
            alarmManager.set(AlarmManager.RTC_WAKEUP, timeMillis, pendingIntent)
        }
    }

    suspend fun rescheduleAllActiveReminders() = withContext(Dispatchers.IO) {
        val active = reminderDao.getUpcomingActiveReminders()
        for (rem in active) {
            registerAlarmManagerReminder(rem.id, rem.title, rem.reminderTime)
        }
    }

    suspend fun getTodayReminders(): List<ReminderEntity> = withContext(Dispatchers.IO) {
        val cal = Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
        }
        val startOfDay = cal.timeInMillis
        cal.add(Calendar.DAY_OF_YEAR, 1)
        val endOfDay = cal.timeInMillis
        reminderDao.getRemindersBetween(startOfDay, endOfDay)
    }

    suspend fun markReminderCompleted(id: Long) = withContext(Dispatchers.IO) {
        reminderDao.markCompleted(id)
    }

    // --- Alarms ---
    val allAlarmsFlow: Flow<List<AlarmEntity>> = alarmDao.getAllAlarmsFlow()

    suspend fun createAlarm(hour: Int, minute: Int, label: String = "AURA Alarm"): Long = withContext(Dispatchers.IO) {
        val alarm = AlarmEntity(hour = hour, minute = minute, label = label)
        alarmDao.insertAlarm(alarm)
    }

    suspend fun getActiveAlarms(): List<AlarmEntity> = withContext(Dispatchers.IO) {
        alarmDao.getActiveAlarms()
    }

    suspend fun cancelAlarm(hour: Int, minute: Int): Int = withContext(Dispatchers.IO) {
        alarmDao.deleteAlarmByTime(hour, minute)
    }

    // --- Tasks ---
    val allTasksFlow: Flow<List<TaskEntity>> = taskDao.getAllTasksFlow()

    suspend fun addTask(title: String, dueDate: Long? = null): Long = withContext(Dispatchers.IO) {
        taskDao.insertTask(TaskEntity(title = title, dueDate = dueDate))
    }

    suspend fun getPendingTasks(): List<TaskEntity> = withContext(Dispatchers.IO) {
        taskDao.getPendingTasks()
    }

    suspend fun getCompletedTasks(): List<TaskEntity> = withContext(Dispatchers.IO) {
        taskDao.getCompletedTasks()
    }

    suspend fun completeTask(id: Long) = withContext(Dispatchers.IO) {
        taskDao.markCompleted(id)
    }

    // --- Command History ---
    val commandHistoryFlow: Flow<List<CommandHistoryEntity>> = commandHistoryDao.getRecentCommandsFlow()

    suspend fun logCommand(rawText: String, action: String, lang: String, success: Boolean, response: String) = withContext(Dispatchers.IO) {
        commandHistoryDao.insert(
            CommandHistoryEntity(
                rawText = rawText,
                action = action,
                language = lang,
                success = success,
                responseText = response
            )
        )
    }

    // --- Backend Cloud Sync Integration ---
    private val apiClient = com.aura.assistant.data.remote.AuraApiClient()

    suspend fun syncWithBackend(serverUrl: String? = null, token: String? = null): com.aura.assistant.data.remote.SyncResult = withContext(Dispatchers.IO) {
        if (!serverUrl.isNullOrEmpty()) {
            apiClient.setBaseUrl(serverUrl)
        }
        val isHealthy = apiClient.healthCheck()
        if (!isHealthy) {
            return@withContext com.aura.assistant.data.remote.SyncResult(false, message = "Backend unreachable")
        }

        // Pull active notes
        val (latestNote, points) = getLatestNotePoints()
        val noteMaps = if (latestNote != null) {
            listOf(mapOf(
                "title" to latestNote.title,
                "category" to latestNote.category,
                "createdAt" to latestNote.createdAt,
                "points" to points.sortedBy { it.pointOrder }.map { it.pointText }
            ))
        } else emptyList()

        val tasks = getPendingTasks().map {
            mapOf("title" to it.title, "isCompleted" to it.isCompleted, "createdAt" to it.createdAt)
        }

        val reminders = getTodayReminders().map {
            mapOf(
                "title" to it.title,
                "reminderTime" to it.reminderTime,
                "isFreeTime" to it.isFreeTime,
                "freeTimeStart" to it.freeTimeStart,
                "freeTimeEnd" to it.freeTimeEnd
            )
        }

        val payload = com.aura.assistant.data.remote.SyncPayload(
            notes = noteMaps,
            reminders = reminders,
            tasks = tasks
        )

        apiClient.pushData(payload, token)
    }
}
