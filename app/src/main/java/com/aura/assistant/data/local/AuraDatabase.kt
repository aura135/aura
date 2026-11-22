package com.aura.assistant.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import com.aura.assistant.data.local.dao.*
import com.aura.assistant.data.local.entity.*

@Database(
    entities = [
        NoteEntity::class,
        NotePointEntity::class,
        ReminderEntity::class,
        AlarmEntity::class,
        TaskEntity::class,
        PreferenceEntity::class,
        CommandHistoryEntity::class
    ],
    version = 1,
    exportSchema = false
)
abstract class AuraDatabase : RoomDatabase() {
    abstract fun noteDao(): NoteDao
    abstract fun reminderDao(): ReminderDao
    abstract fun alarmDao(): AlarmDao
    abstract fun taskDao(): TaskDao
    abstract fun preferenceDao(): PreferenceDao
    abstract fun commandHistoryDao(): CommandHistoryDao

    companion object {
        @Volatile
        private var INSTANCE: AuraDatabase? = null

        fun getInstance(context: Context): AuraDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AuraDatabase::class.java,
                    "aura_database.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
