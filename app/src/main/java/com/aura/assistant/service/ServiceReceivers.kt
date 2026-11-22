package com.aura.assistant.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.aura.assistant.R
import com.aura.assistant.data.repository.AuraRepository
import com.aura.assistant.ui.MainActivity
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

class BootReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val action = intent.action
        if (action == Intent.ACTION_BOOT_COMPLETED ||
            action == Intent.ACTION_MY_PACKAGE_REPLACED ||
            action == "android.intent.action.QUICKBOOT_POWERON") {

            val repo = AuraRepository(context)
            CoroutineScope(Dispatchers.IO).launch {
                // 1. Reschedule all active reminders and alarms
                repo.rescheduleAllActiveReminders()

                // 2. Restart foreground service if voice is enrolled
                if (repo.isVoiceEnrolled()) {
                    AuraForegroundService.startService(context)
                }
            }
        }
    }
}

class ReminderAlarmReceiver : BroadcastReceiver() {

    companion object {
        const val CHANNEL_ID = "aura_reminders_channel"
        const val ACTION_FIRE_REMINDER = "com.aura.assistant.ACTION_FIRE_REMINDER"
        const val ACTION_FIRE_ALARM = "com.aura.assistant.ACTION_FIRE_ALARM"
        const val ACTION_COMPLETE_TASK = "com.aura.assistant.ACTION_COMPLETE_TASK"

        const val EXTRA_REMINDER_ID = "extra_reminder_id"
        const val EXTRA_REMINDER_TITLE = "extra_reminder_title"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val reminderId = intent.getLongExtra(EXTRA_REMINDER_ID, -1L)
        val reminderTitle = intent.getStringExtra(EXTRA_REMINDER_TITLE) ?: "AURA Reminder"

        createNotificationChannel(context)

        val appIntent = Intent(context, MainActivity::class.java).apply {
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP or Intent.FLAG_ACTIVITY_CLEAR_TOP
        }
        val pendingAppIntent = PendingIntent.getActivity(context, reminderId.toInt(), appIntent, PendingIntent.FLAG_IMMUTABLE)

        val notification = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_aura_logo)
            .setContentTitle("AURA Reminder")
            .setContentText(reminderTitle)
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setAutoCancel(true)
            .setContentIntent(pendingAppIntent)
            .setDefaults(NotificationCompat.DEFAULT_ALL)
            .build()

        val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        notificationManager.notify((2000 + reminderId).toInt(), notification)

        // Mark as completed in DB if not recurring
        if (reminderId > 0) {
            val repo = AuraRepository(context)
            CoroutineScope(Dispatchers.IO).launch {
                repo.markReminderCompleted(reminderId)
            }
        }
    }

    private fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "AURA Reminders & Alarms",
                NotificationManager.IMPORTANCE_HIGH
            ).apply {
                description = "High priority notifications for voice reminders and alarms"
                enableVibration(true)
            }
            val manager = context.getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
