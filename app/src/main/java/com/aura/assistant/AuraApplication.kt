package com.aura.assistant

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.aura.assistant.data.repository.AuraRepository
import com.aura.assistant.service.AuraForegroundService
import com.aura.assistant.service.ReminderAlarmReceiver

class AuraApplication : Application() {

    lateinit var repository: AuraRepository
        private set

    override fun onCreate() {
        super.onCreate()
        repository = AuraRepository(this)
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val serviceChannel = NotificationChannel(
                AuraForegroundService.CHANNEL_ID,
                "AURA Voice Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Continuous background listening for 'Hey AURA'"
            }

            val remindersChannel = NotificationChannel(
                ReminderAlarmReceiver.CHANNEL_ID,
                "AURA Reminders & Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High priority notifications for voice reminders and alarms"
                enableVibration(true)
            }

            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(serviceChannel)
            manager.createNotificationChannel(remindersChannel)
        }
    }
}
