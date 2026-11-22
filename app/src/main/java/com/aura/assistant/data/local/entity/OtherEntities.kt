package com.aura.assistant.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "reminders")
data class ReminderEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val reminderTime: Long,
    val repeatType: String = "NONE", // NONE, DAILY, WEEKLY
    val isFreeTime: Boolean = false,
    val freeTimeStart: String = "", // e.g. "18:00"
    val freeTimeEnd: String = "",   // e.g. "20:00"
    val isCompleted: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "alarms")
data class AlarmEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val hour: Int,
    val minute: Int,
    val label: String = "AURA Alarm",
    val daysOfWeek: String = "DAILY",
    val isEnabled: Boolean = true,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "tasks")
data class TaskEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val title: String,
    val description: String = "",
    val isCompleted: Boolean = false,
    val dueDate: Long? = null,
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "preferences")
data class PreferenceEntity(
    @PrimaryKey
    val key: String,
    val value: String
)

@Entity(tableName = "command_history")
data class CommandHistoryEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val rawText: String,
    val action: String,
    val language: String,
    val timestamp: Long = System.currentTimeMillis(),
    val success: Boolean,
    val responseText: String
)
