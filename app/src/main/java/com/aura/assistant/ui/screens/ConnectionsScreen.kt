package com.aura.assistant.ui.screens

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import com.aura.assistant.integration.ConnectivityManagerHelper
import com.aura.assistant.integration.MediaMusicController
import com.aura.assistant.ui.components.ConnectionCard
import com.aura.assistant.ui.theme.AuraBgDark
import com.aura.assistant.ui.theme.AuraCyan
import com.aura.assistant.ui.theme.AuraTextSecondary
import com.aura.assistant.ui.viewmodel.AuraViewModel

@Composable
fun ConnectionsScreen(viewModel: AuraViewModel) {
    val context = LocalContext.current
    val currentLang by viewModel.currentLanguage.collectAsState()
    val isEnrolled by viewModel.isVoiceEnrolled.collectAsState()
    val isPaused by viewModel.isVoicePaused.collectAsState()

    val connectivity = remember { ConnectivityManagerHelper(context) }
    val musicController = remember { MediaMusicController(context) }

    // Real Permission checks
    val hasMic = ContextCompat.checkSelfPermission(context, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED
    val hasContacts = ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) == PackageManager.PERMISSION_GRANTED
    val hasPhoneCall = ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED
    val hasCamera = ContextCompat.checkSelfPermission(context, Manifest.permission.CAMERA) == PackageManager.PERMISSION_GRANTED
    val hasNotif = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED
    } else true

    val isInternetConnected = connectivity.isInternetAvailable()
    val isWifiConnected = connectivity.isWifiConnected()
    val btStatus = connectivity.getBluetoothStatus()
    val isMusicActive = musicController.isMusicActive()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBgDark)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        item {
            Text(
                text = "CONNECTIONS",
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = AuraCyan,
                    letterSpacing = 2.sp
                )
            )
            Text(
                text = "Real-time hardware, network, and system integrations",
                style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
            )
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 1. VOICE CONNECTION
        item {
            Text(
                text = "VOICE CONNECTION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            ConnectionCard(
                title = "Wake-Word & Microphone",
                description = "Continuous audio input for \"Hey AURA\" activation",
                isConnected = hasMic && isEnrolled && !isPaused,
                statusText = if (!hasMic) "PERMISSION REQUIRED" else if (isPaused) "PAUSED" else if (!isEnrolled) "NOT ENROLLED" else "ACTIVE",
                icon = Icons.Default.Mic,
                actionButtonText = if (!hasMic) "Grant Microphone Permission" else null,
                onActionClick = if (!hasMic) {
                    {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:" + context.packageName)
                        }
                        context.startActivity(intent)
                    }
                } else null
            )
            ConnectionCard(
                title = "Language & Speech Engine",
                description = "Current voice output: ${when (currentLang) { "te" -> "Telugu (తెలుగు)"; "hi" -> "Hindi (हिन्दी)"; else -> "English" }}",
                isConnected = true,
                statusText = "INITIALIZED",
                icon = Icons.Default.Language
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 2. PHONE CONNECTION
        item {
            Text(
                text = "PHONE CONNECTION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            ConnectionCard(
                title = "Contacts & Calling",
                description = "Access phonebook for voice-commanded dialing and redial",
                isConnected = hasContacts && hasPhoneCall,
                statusText = if (hasContacts && hasPhoneCall) "CONNECTED" else "PERMISSIONS NEEDED",
                icon = Icons.Default.Contacts,
                actionButtonText = if (!hasContacts || !hasPhoneCall) "Grant Phone Permissions" else null,
                onActionClick = if (!hasContacts || !hasPhoneCall) {
                    {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:" + context.packageName)
                        }
                        context.startActivity(intent)
                    }
                } else null
            )
            ConnectionCard(
                title = "Notification Manager",
                description = "Exact alarm and reminder notification dispatching",
                isConnected = hasNotif,
                statusText = if (hasNotif) "ENABLED" else "DISABLED",
                icon = Icons.Default.Notifications
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 3. MUSIC CONNECTION
        item {
            Text(
                text = "MUSIC CONNECTION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            ConnectionCard(
                title = "Media Session Controller",
                description = "Supports Spotify, YouTube Music, and system media players",
                isConnected = isMusicActive,
                statusText = if (isMusicActive) "PLAYING" else "IDLE / READY",
                icon = Icons.Default.MusicNote
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 4. DEVICE CONNECTION
        item {
            Text(
                text = "DEVICE CONNECTION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            ConnectionCard(
                title = "Camera & Flashlight",
                description = "Hardware CameraManager for torch toggle and photo capture",
                isConnected = hasCamera,
                statusText = if (hasCamera) "HARDWARE READY" else "NEEDS PERMISSION",
                icon = Icons.Default.FlashlightOn,
                actionButtonText = if (!hasCamera) "Grant Camera Permission" else null,
                onActionClick = if (!hasCamera) {
                    {
                        val intent = Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                            data = Uri.parse("package:" + context.packageName)
                        }
                        context.startActivity(intent)
                    }
                } else null
            )
            ConnectionCard(
                title = "Bluetooth Adapter",
                description = btStatus,
                isConnected = btStatus.contains("enabled"),
                statusText = if (btStatus.contains("enabled")) "ENABLED" else "DISABLED",
                icon = Icons.Default.Bluetooth,
                actionButtonText = "Open Bluetooth Settings",
                onActionClick = { connectivity.openBluetoothSettings() }
            )
            ConnectionCard(
                title = "Wi-Fi Interface",
                description = if (isWifiConnected) "Connected to wireless local network" else "Disconnected",
                isConnected = isWifiConnected,
                statusText = if (isWifiConnected) "CONNECTED" else "OFFLINE",
                icon = Icons.Default.Wifi,
                actionButtonText = "Open Wi-Fi Settings",
                onActionClick = { connectivity.openWifiSettings() }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // 5. INTERNET CONNECTION
        item {
            Text(
                text = "INTERNET CONNECTION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            ConnectionCard(
                title = "Network Connectivity",
                description = if (isInternetConnected) "Online recognition and sync operational" else "Running in fully autonomous offline mode",
                isConnected = isInternetConnected,
                statusText = if (isInternetConnected) "ONLINE" else "OFFLINE READY",
                icon = Icons.Default.Cloud
            )
        }
    }
}
