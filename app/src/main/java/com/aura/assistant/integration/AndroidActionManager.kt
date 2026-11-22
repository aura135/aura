package com.aura.assistant.integration

import android.content.Context
import android.content.Intent
import android.media.AudioManager
import android.provider.AlarmClock
import android.view.KeyEvent
import com.aura.assistant.data.repository.AuraRepository
import com.aura.assistant.voice.AuraAction
import com.aura.assistant.voice.AuraCommand
import com.aura.assistant.voice.CommandResult
import com.aura.assistant.voice.MultilingualDictionary
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.Calendar

class AndroidActionManager(private val context: Context, private val repository: AuraRepository) {
    private val appLauncher = AppLauncher(context)
    private val flashlight = FlashlightController(context)
    private val volumeBrightness = VolumeBrightnessController(context)
    private val callManager = CallContactManager(context)
    private val musicController = MediaMusicController(context)
    private val deviceInfo = DeviceInfoProvider(context)
    private val connectivity = ConnectivityManagerHelper(context)

    suspend fun execute(command: AuraCommand): CommandResult = withContext(Dispatchers.IO) {
        val lang = command.language

        val result = when (command.action) {
            // 1. App Launching
            AuraAction.OPEN_APP -> {
                val target = command.target ?: ""
                val (ok, msg) = appLauncher.launchApp(target)
                CommandResult(ok, msg)
            }

            // 2. Flashlight
            AuraAction.FLASHLIGHT_ON -> {
                val (ok, msg) = flashlight.setTorch(true)
                CommandResult(ok, if (lang == "te") "ఫ్లాష్ లైట్ ఆన్ చేయబడింది." else if (lang == "hi") "टॉर्च चालू कर दी गई है।" else msg)
            }
            AuraAction.FLASHLIGHT_OFF -> {
                val (ok, msg) = flashlight.setTorch(false)
                CommandResult(ok, if (lang == "te") "ఫ్లాష్ లైట్ ఆఫ్ చేయబడింది." else if (lang == "hi") "टॉर्च बंद कर दी गई है।" else msg)
            }

            // 3. Volume
            AuraAction.VOLUME_UP -> {
                val (ok, msg) = volumeBrightness.adjustVolume(AudioManager.ADJUST_RAISE)
                CommandResult(ok, msg)
            }
            AuraAction.VOLUME_DOWN -> {
                val (ok, msg) = volumeBrightness.adjustVolume(AudioManager.ADJUST_LOWER)
                CommandResult(ok, msg)
            }
            AuraAction.VOLUME_MUTE -> {
                val (ok, msg) = volumeBrightness.muteVolume()
                CommandResult(ok, msg)
            }
            AuraAction.VOLUME_SET -> {
                val (ok, msg) = volumeBrightness.adjustVolume(AudioManager.ADJUST_SAME)
                CommandResult(ok, msg)
            }

            // 4. Brightness
            AuraAction.BRIGHTNESS_UP -> {
                val (ok, msg) = volumeBrightness.adjustBrightness(true)
                CommandResult(ok, msg)
            }
            AuraAction.BRIGHTNESS_DOWN -> {
                val (ok, msg) = volumeBrightness.adjustBrightness(false)
                CommandResult(ok, msg)
            }
            AuraAction.BRIGHTNESS_SET -> {
                val (ok, msg) = volumeBrightness.adjustBrightness(true)
                CommandResult(ok, msg)
            }

            // 5. Bluetooth & Wi-Fi
            AuraAction.BLUETOOTH_CHECK -> {
                val status = connectivity.getBluetoothStatus()
                CommandResult(true, status)
            }
            AuraAction.BLUETOOTH_SETTINGS -> {
                connectivity.openBluetoothSettings()
                CommandResult(true, "Opening Bluetooth settings.")
            }
            AuraAction.WIFI_CHECK -> {
                val connected = connectivity.isWifiConnected()
                val msg = if (connected) "Wi-Fi is currently connected." else "Wi-Fi is currently disconnected."
                CommandResult(true, msg)
            }
            AuraAction.WIFI_SETTINGS -> {
                connectivity.openWifiSettings()
                CommandResult(true, "Opening Wi-Fi settings.")
            }

            // 6. Camera
            AuraAction.CAMERA_OPEN -> {
                val (ok, msg) = appLauncher.launchApp("camera")
                CommandResult(ok, msg)
            }
            AuraAction.CAMERA_CAPTURE -> {
                val intent = Intent(android.provider.MediaStore.ACTION_IMAGE_CAPTURE).apply {
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    context.startActivity(intent)
                    CommandResult(true, "Camera opened for photo capture.")
                } catch (e: Exception) {
                    CommandResult(false, "Could not launch camera: ${e.message}")
                }
            }

            // 7. Device Info
            AuraAction.DEVICE_BATTERY -> {
                val (pct, charging) = deviceInfo.getBatteryInfo()
                val chargeText = if (charging) "and currently charging" else "and not charging"
                val msg = if (lang == "te") "బ్యాటరీ $pct శాతం ఉంది." else if (lang == "hi") "बैटरी $pct प्रतिशत है।" else "Battery is at $pct percent $chargeText."
                CommandResult(true, msg)
            }
            AuraAction.DEVICE_TIME -> {
                val time = deviceInfo.getCurrentTime()
                val msg = if (lang == "te") "ప్రస్తుత సమయం $time." else if (lang == "hi") "अभी का समय $time है।" else "The time is $time."
                CommandResult(true, msg)
            }
            AuraAction.DEVICE_DATE -> {
                val date = deviceInfo.getCurrentDate()
                val msg = if (lang == "te") "ఈరోజు $date." else if (lang == "hi") "आज $date है।" else "Today is $date."
                CommandResult(true, msg)
            }
            AuraAction.DEVICE_INFO -> {
                CommandResult(true, deviceInfo.getGeneralDeviceInfo())
            }

            // 8. Calls
            AuraAction.CALL_CONTACT -> {
                val contactName = command.target ?: ""
                val matches = callManager.findContacts(contactName)
                when {
                    matches.isEmpty() -> CommandResult(false, MultilingualDictionary.getNotFoundResponse(lang, "contact $contactName"))
                    matches.size == 1 -> {
                        val (ok, msg) = callManager.callContact(matches[0])
                        CommandResult(ok, msg)
                    }
                    else -> {
                        // Ambiguous duplicate names - ask confirmation / open dialer with first
                        val names = matches.take(3).joinToString(", ") { "${it.name} (${it.phoneNumber})" }
                        callManager.callContact(matches[0])
                        CommandResult(true, "Multiple contacts found. Calling ${matches[0].name}.")
                    }
                }
            }
            AuraAction.CALL_REDIAL -> {
                val (ok, msg) = callManager.redialLastNumber()
                CommandResult(ok, msg)
            }

            // 9. Music Control
            AuraAction.MUSIC_PLAY -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_PLAY)
                CommandResult(ok, msg)
            }
            AuraAction.MUSIC_PAUSE -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_PAUSE)
                CommandResult(ok, msg)
            }
            AuraAction.MUSIC_RESUME -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_PLAY)
                CommandResult(ok, msg)
            }
            AuraAction.MUSIC_NEXT -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_NEXT)
                CommandResult(ok, msg)
            }
            AuraAction.MUSIC_PREV -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_PREVIOUS)
                CommandResult(ok, msg)
            }
            AuraAction.MUSIC_STOP -> {
                val (ok, msg) = musicController.sendMediaKeyEvent(KeyEvent.KEYCODE_MEDIA_STOP)
                CommandResult(ok, msg)
            }

            // 10. Notes & Ordered Points (MANDATORY REQUIREMENT)
            AuraAction.NOTE_CREATE, AuraAction.POINTS_SAVE -> {
                val points = if (command.points.isNotEmpty()) command.points else listOf(command.content ?: "Important note")
                val title = if (points.isNotEmpty()) points.first().take(25) else "Voice Note"
                repository.saveNoteWithPoints(title, points)
                val msg = MultilingualDictionary.getPointsSavedResponse(lang, points.size)
                CommandResult(true, msg)
            }

            AuraAction.POINTS_REPEAT -> {
                val (note, points) = repository.getLatestNotePoints()
                if (points.isEmpty()) {
                    CommandResult(false, if (lang == "te") "ఎలాంటి భద్రపరిచిన పాయింట్లు లేవు." else if (lang == "hi") "कोई सहेजे गए पॉइंट नहीं मिले।" else "You don't have any saved points.")
                } else {
                    val header = MultilingualDictionary.getPointsRepeatHeader(lang)
                    val orderedList = points.sortedBy { it.pointOrder }.mapIndexed { i, p -> "Point ${i + 1}: ${p.pointText}" }.joinToString(". ")
                    CommandResult(true, "$header $orderedList.")
                }
            }

            AuraAction.NOTE_READ_LATEST -> {
                val (note, points) = repository.getLatestNotePoints()
                if (note == null) {
                    CommandResult(false, "No notes found.")
                } else {
                    val content = points.sortedBy { it.pointOrder }.joinToString(", ") { it.pointText }
                    CommandResult(true, "Your latest note is: ${note.title}. Points: $content.")
                }
            }

            AuraAction.NOTE_FIND -> {
                val query = command.target ?: ""
                val notes = repository.searchNotes(query)
                if (notes.isEmpty()) {
                    CommandResult(false, "No notes found matching $query.")
                } else {
                    CommandResult(true, "Found ${notes.size} notes: " + notes.joinToString(", ") { it.title })
                }
            }

            AuraAction.NOTE_DELETE -> {
                val (latest, _) = repository.getLatestNotePoints()
                if (latest != null) {
                    repository.deleteNote(latest.id)
                    CommandResult(true, "Deleted latest note.")
                } else {
                    CommandResult(false, "No note to delete.")
                }
            }

            // 11. Reminders
            AuraAction.REMINDER_SET -> {
                val hour = command.targetHour ?: 18
                val min = command.targetMinute ?: 0
                val cal = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, min)
                    set(Calendar.SECOND, 0)
                    if (timeInMillis <= System.currentTimeMillis()) {
                        add(Calendar.DAY_OF_YEAR, 1) // Next day if time already passed
                    }
                }
                val content = command.content ?: "Reminder"
                repository.scheduleReminder(content, cal.timeInMillis)
                val timeStr = String.format("%02d:%02d", hour, min)
                val msg = if (lang == "te") "$timeStr కి గుర్తు చేస్తాను." else if (lang == "hi") "$timeStr बजे का रिमाइंडर सेट कर दिया गया है।" else "Reminder set for $content at $timeStr."
                CommandResult(true, msg)
            }

            // 12. Free-Time Reminders
            AuraAction.REMINDER_FREETIME -> {
                val start = command.freeTimeStart ?: "6 PM"
                val end = command.freeTimeEnd ?: "8 PM"
                val content = command.content ?: "Free time review"
                // Schedule within free time window: default to start time
                val hour = 18 // 6 PM
                val cal = Calendar.getInstance().apply {
                    set(Calendar.HOUR_OF_DAY, hour)
                    set(Calendar.MINUTE, 0)
                    set(Calendar.SECOND, 0)
                    if (timeInMillis <= System.currentTimeMillis()) {
                        add(Calendar.DAY_OF_YEAR, 1)
                    }
                }
                repository.scheduleReminder(content, cal.timeInMillis, isFreeTime = true, freeTimeStart = start, freeTimeEnd = end)
                val msg = "Scheduled reminder for your free time between $start and $end."
                CommandResult(true, msg)
            }

            AuraAction.REMINDER_LIST -> {
                val today = repository.getTodayReminders()
                if (today.isEmpty()) {
                    CommandResult(true, "You have no upcoming reminders today.")
                } else {
                    CommandResult(true, "You have ${today.size} reminders today: " + today.joinToString(", ") { it.title })
                }
            }

            // 13. Alarms
            AuraAction.ALARM_SET -> {
                val hour = command.targetHour ?: 7
                val min = command.targetMinute ?: 0
                repository.createAlarm(hour, min)
                // Also trigger standard Android Clock alarm intent
                val alarmIntent = Intent(AlarmClock.ACTION_SET_ALARM).apply {
                    putExtra(AlarmClock.EXTRA_HOUR, hour)
                    putExtra(AlarmClock.EXTRA_MINUTES, min)
                    putExtra(AlarmClock.EXTRA_MESSAGE, "AURA Alarm")
                    putExtra(AlarmClock.EXTRA_SKIP_UI, true)
                    addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                }
                try {
                    context.startActivity(alarmIntent)
                } catch (e: Exception) {
                    // System intent fallback handled by DB alarm
                }
                val timeStr = String.format("%02d:%02d", hour, min)
                val msg = if (lang == "te") "$timeStr కి అలారం సెట్ చేయబడింది." else if (lang == "hi") "$timeStr बजे का अलार्म सेट कर दिया गया है।" else "Alarm set for $timeStr."
                CommandResult(true, msg)
            }

            AuraAction.ALARM_CANCEL -> {
                val hour = command.targetHour ?: 6
                val min = command.targetMinute ?: 0
                val count = repository.cancelAlarm(hour, min)
                val msg = if (count > 0) "Cancelled alarm for $hour:$min." else "No alarm found at $hour:$min to cancel."
                CommandResult(true, msg)
            }

            AuraAction.ALARM_LIST -> {
                val alarms = repository.getActiveAlarms()
                if (alarms.isEmpty()) {
                    CommandResult(true, "You have no active alarms.")
                } else {
                    val list = alarms.joinToString(", ") { String.format("%02d:%02d", it.hour, it.minute) }
                    CommandResult(true, "Active alarms: $list.")
                }
            }

            // 14. Tasks
            AuraAction.TASK_ADD -> {
                val title = command.content ?: "Task"
                repository.addTask(title)
                CommandResult(true, "Added task: $title.")
            }

            AuraAction.TASK_COMPLETE -> {
                val pending = repository.getPendingTasks()
                if (pending.isNotEmpty()) {
                    repository.completeTask(pending.first().id)
                    CommandResult(true, "Marked task '${pending.first().title}' as completed.")
                } else {
                    CommandResult(false, "No pending tasks to complete.")
                }
            }

            AuraAction.TASK_LIST_PENDING -> {
                val pending = repository.getPendingTasks()
                if (pending.isEmpty()) {
                    CommandResult(true, "You have no pending tasks.")
                } else {
                    CommandResult(true, "Pending tasks: " + pending.joinToString(", ") { it.title })
                }
            }

            AuraAction.TASK_LIST_COMPLETED -> {
                val completed = repository.getCompletedTasks()
                CommandResult(true, "Completed tasks: " + completed.joinToString(", ") { it.title })
            }

            // 15. Daily Briefing
            AuraAction.DAILY_BRIEFING -> {
                val reminders = repository.getTodayReminders()
                val alarms = repository.getActiveAlarms()
                val pendingTasks = repository.getPendingTasks()
                val (_, points) = repository.getLatestNotePoints()

                val header = MultilingualDictionary.getDailyBriefingHeader(lang)
                val remText = if (reminders.isNotEmpty()) "${reminders.size} reminders today" else "no reminders"
                val alarmText = if (alarms.isNotEmpty()) "${alarms.size} active alarms" else "no alarms"
                val taskText = if (pendingTasks.isNotEmpty()) "${pendingTasks.size} pending tasks" else "all tasks completed"
                val pointText = if (points.isNotEmpty()) "${points.size} saved points" else ""

                val briefing = "$header You have $remText, $alarmText, and $taskText. $pointText"
                CommandResult(true, briefing)
            }

            // Unknown fallback
            AuraAction.UNKNOWN -> {
                CommandResult(false, "I couldn't understand that command. Please try saying Open YouTube, Turn on Flashlight, or Note this.")
            }
        }

        // Log command
        repository.logCommand(
            rawText = command.rawText,
            action = command.action.name,
            lang = lang,
            success = result.success,
            response = result.speechResponse
        )

        result
    }
}
