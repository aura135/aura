package com.aura.assistant.ui.navigation

import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.ui.graphics.vector.ImageVector

sealed class Screen(val route: String, val title: String, val icon: ImageVector) {
    object Home : Screen("home", "Home", Icons.Default.Home)
    object VoiceAssistant : Screen("voice_assistant", "Voice", Icons.Default.Mic)
    object Connections : Screen("connections", "Connections", Icons.Default.Sensors)
    object NotesReminders : Screen("notes_reminders", "Notes & Reminders", Icons.Default.NoteAlt)
    object Settings : Screen("settings", "Settings", Icons.Default.Settings)
}
