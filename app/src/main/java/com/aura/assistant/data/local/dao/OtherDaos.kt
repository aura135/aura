package com.aura.assistant.data.local.dao

import androidx.room.*
import com.aura.assistant.data.local.entity.*
import kotlinx.coroutines.flow.Flow

@Dao
interface ReminderDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertReminder(reminder: ReminderEntity): Long

    @Update
    suspend fun updateReminder(reminder: ReminderEntity)

    @Delete
    suspend fun deleteReminder(reminder: ReminderEntity)

    @Query("SELECT * FROM reminders ORDER BY reminderTime ASC")
    fun getAllRemindersFlow(): Flow<List<ReminderEntity>>

    @Query("SELECT * FROM reminders WHERE isCompleted = 0 AND reminderTime >= :now ORDER BY reminderTime ASC")
    suspend fun getUpcomingActiveReminders(now: Long = System.currentTimeMillis()): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE reminderTime BETWEEN :startTime AND :endTime ORDER BY reminderTime ASC")
    suspend fun getRemindersBetween(startTime: Long, endTime: Long): List<ReminderEntity>

    @Query("SELECT * FROM reminders WHERE id = :id")
    suspend fun getReminderById(id: Long): ReminderEntity?

    @Query("UPDATE reminders SET isCompleted = 1 WHERE id = :id")
    suspend fun markCompleted(id: Long)

    @Query("DELETE FROM reminders")
    suspend fun deleteAllReminders()
}

@Dao
interface AlarmDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAlarm(alarm: AlarmEntity): Long

    @Update
    suspend fun updateAlarm(alarm: AlarmEntity)

    @Delete
    suspend fun deleteAlarm(alarm: AlarmEntity)

    @Query("SELECT * FROM alarms ORDER BY hour ASC, minute ASC")
    fun getAllAlarmsFlow(): Flow<List<AlarmEntity>>

    @Query("SELECT * FROM alarms WHERE isEnabled = 1 ORDER BY hour ASC, minute ASC")
    suspend fun getActiveAlarms(): List<AlarmEntity>

    @Query("DELETE FROM alarms WHERE hour = :hour AND minute = :minute")
    suspend fun deleteAlarmByTime(hour: Int, minute: Int): Int

    @Query("DELETE FROM alarms")
    suspend fun deleteAllAlarms()
}

@Dao
interface TaskDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertTask(task: TaskEntity): Long

    @Update
    suspend fun updateTask(task: TaskEntity)

    @Delete
    suspend fun deleteTask(task: TaskEntity)

    @Query("SELECT * FROM tasks ORDER BY createdAt DESC")
    fun getAllTasksFlow(): Flow<List<TaskEntity>>

    @Query("SELECT * FROM tasks WHERE isCompleted = 0 ORDER BY createdAt DESC")
    suspend fun getPendingTasks(): List<TaskEntity>

    @Query("SELECT * FROM tasks WHERE isCompleted = 1 ORDER BY createdAt DESC")
    suspend fun getCompletedTasks(): List<TaskEntity>

    @Query("UPDATE tasks SET isCompleted = 1 WHERE id = :id")
    suspend fun markCompleted(id: Long)

    @Query("DELETE FROM tasks")
    suspend fun deleteAllTasks()
}

@Dao
interface PreferenceDao {
    @Query("SELECT value FROM preferences WHERE `key` = :key")
    suspend fun getPreference(key: String): String?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun setPreference(pref: PreferenceEntity)

    @Query("DELETE FROM preferences WHERE `key` = :key")
    suspend fun removePreference(key: String)

    @Query("DELETE FROM preferences")
    suspend fun clearAll()
}

@Dao
interface CommandHistoryDao {
    @Insert
    suspend fun insert(entry: CommandHistoryEntity): Long

    @Query("SELECT * FROM command_history ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentCommandsFlow(limit: Int = 20): Flow<List<CommandHistoryEntity>>

    @Query("DELETE FROM command_history")
    suspend fun clearHistory()
}
