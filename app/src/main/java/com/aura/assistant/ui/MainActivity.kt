package com.aura.assistant.ui

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import com.aura.assistant.AuraApplication
import com.aura.assistant.service.AuraForegroundService
import com.aura.assistant.ui.navigation.Screen
import com.aura.assistant.ui.screens.*
import com.aura.assistant.ui.theme.AURATheme
import com.aura.assistant.ui.theme.AuraCyan
import com.aura.assistant.ui.theme.AuraSurfaceDark
import com.aura.assistant.ui.theme.AuraTextSecondary
import com.aura.assistant.ui.viewmodel.AuraViewModel
import com.aura.assistant.ui.viewmodel.AuraViewModelFactory

class MainActivity : ComponentActivity() {

    private lateinit var viewModel: AuraViewModel

    private val permissionLauncher = registerForActivityResult(
        ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        val recordAudioGranted = permissions[Manifest.permission.RECORD_AUDIO] ?: false
        if (recordAudioGranted) {
            AuraForegroundService.startService(this)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        val app = application as AuraApplication
        val factory = AuraViewModelFactory(app, app.repository)
        viewModel = ViewModelProvider(this, factory)[AuraViewModel::class.java]

        requestAssistantPermissions()

        setContent {
            AURATheme {
                MainAppScaffold(viewModel = viewModel)
            }
        }
    }

    private fun requestAssistantPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECORD_AUDIO,
            Manifest.permission.READ_CONTACTS,
            Manifest.permission.CALL_PHONE,
            Manifest.permission.CAMERA
        )
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            permissionLauncher.launch(missing.toTypedArray())
        } else {
            AuraForegroundService.startService(this)
        }
    }
}

@Composable
fun MainAppScaffold(viewModel: AuraViewModel) {
    val navController = rememberNavController()
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route

    val screens = listOf(
        Screen.Home,
        Screen.VoiceAssistant,
        Screen.Connections,
        Screen.NotesReminders,
        Screen.Settings
    )

    Scaffold(
        bottomBar = {
            NavigationBar(
                containerColor = AuraSurfaceDark,
                tonalElevation = 8.dp
            ) {
                screens.forEach { screen ->
                    val isSelected = currentRoute == screen.route
                    NavigationBarItem(
                        icon = {
                            Icon(
                                imageVector = screen.icon,
                                contentDescription = screen.title,
                                tint = if (isSelected) AuraCyan else AuraTextSecondary
                            )
                        },
                        label = {
                            Text(
                                text = screen.title,
                                color = if (isSelected) AuraCyan else AuraTextSecondary,
                                fontSize = 11.sp
                            )
                        },
                        selected = isSelected,
                        colors = NavigationBarItemDefaults.colors(
                            indicatorColor = AuraCyan.copy(alpha = 0.15f)
                        ),
                        onClick = {
                            if (currentRoute != screen.route) {
                                navController.navigate(screen.route) {
                                    popUpTo(navController.graph.findStartDestination().id) {
                                        saveState = true
                                    }
                                    launchSingleTop = true
                                    restoreState = true
                                }
                            }
                        }
                    )
                }
            }
        }
    ) { innerPadding ->
        NavHost(
            navController = navController,
            startDestination = Screen.Home.route,
            modifier = Modifier
                .fillMaxSize()
                .padding(innerPadding)
        ) {
            composable(Screen.Home.route) {
                HomeScreen(
                    viewModel = viewModel,
                    onNavigateToVoice = {
                        navController.navigate(Screen.VoiceAssistant.route) {
                            launchSingleTop = true
                        }
                    }
                )
            }
            composable(Screen.VoiceAssistant.route) {
                VoiceAssistantScreen(viewModel = viewModel)
            }
            composable(Screen.Connections.route) {
                ConnectionsScreen(viewModel = viewModel)
            }
            composable(Screen.NotesReminders.route) {
                NotesRemindersScreen(viewModel = viewModel)
            }
            composable(Screen.Settings.route) {
                SettingsScreen(viewModel = viewModel)
            }
        }
    }
}
