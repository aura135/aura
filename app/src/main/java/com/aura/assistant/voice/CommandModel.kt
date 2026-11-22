package com.aura.assistant.voice

enum class AuraAction {
    // App & Device
    OPEN_APP,
    FLASHLIGHT_ON,
    FLASHLIGHT_OFF,
    VOLUME_UP,
    VOLUME_DOWN,
    VOLUME_MUTE,
    VOLUME_SET,
    BRIGHTNESS_UP,
    BRIGHTNESS_DOWN,
    BRIGHTNESS_SET,
    BLUETOOTH_CHECK,
    BLUETOOTH_SETTINGS,
    WIFI_CHECK,
    WIFI_SETTINGS,
    CAMERA_OPEN,
    CAMERA_CAPTURE,
    DEVICE_BATTERY,
    DEVICE_TIME,
    DEVICE_DATE,
    DEVICE_INFO,

    // Calls
    CALL_CONTACT,
    CALL_REDIAL,

    // Music
    MUSIC_PLAY,
    MUSIC_PAUSE,
    MUSIC_RESUME,
    MUSIC_NEXT,
    MUSIC_PREV,
    MUSIC_STOP,

    // Notes & Points
    NOTE_CREATE,
    NOTE_READ_LATEST,
    NOTE_FIND,
    NOTE_DELETE,
    POINTS_SAVE,
    POINTS_REPEAT,

    // Reminders & Alarms
    REMINDER_SET,
    REMINDER_FREETIME,
    REMINDER_LIST,
    ALARM_SET,
    ALARM_CANCEL,
    ALARM_LIST,

    // Tasks & Briefing
    TASK_ADD,
    TASK_COMPLETE,
    TASK_LIST_PENDING,
    TASK_LIST_COMPLETED,
    DAILY_BRIEFING,

    // Fallback
    UNKNOWN
}

data class AuraCommand(
    val action: AuraAction,
    val rawText: String,
    val content: String? = null,
    val target: String? = null,
    val targetHour: Int? = null,
    val targetMinute: Int? = null,
    val freeTimeStart: String? = null,
    val freeTimeEnd: String? = null,
    val points: List<String> = emptyList(),
    val language: String = "en"
)

data class CommandResult(
    val success: Boolean,
    val speechResponse: String,
    val displayText: String = speechResponse
)
