package com.aura.assistant.ui.screens

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import android.os.PowerManager
import android.provider.Settings
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.assistant.ui.theme.*
import com.aura.assistant.ui.viewmodel.AuraViewModel

@Composable
fun SettingsScreen(viewModel: AuraViewModel) {
    val context = LocalContext.current
    val currentLang by viewModel.currentLanguage.collectAsState()
    var speechRate by remember { mutableFloatStateOf(1.0f) }
    var wakeSensitivity by remember { mutableFloatStateOf(0.8f) }

    val pm = context.getSystemService(Context.POWER_SERVICE) as PowerManager
    val isIgnoringBatteryOptimizations = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
        pm.isIgnoringBatteryOptimizations(context.packageName)
    } else true

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBgDark)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        item {
            Text(
                text = "SETTINGS",
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = AuraCyan,
                    letterSpacing = 2.sp
                )
            )
            Text(
                text = "Voice preferences, battery optimization & languages",
                style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
            )
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 1. Language Selection (Multilingual Voice Support)
        item {
            Text(
                text = "VOICE LANGUAGE",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                border = BorderStroke(1.dp, AuraBorderGlow.copy(alpha = 0.25f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Choose your preferred spoken language for natural voice interaction and responses:",
                        style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))

                    val languages = listOf(
                        Triple("en", "English", "Natural American / Indian English"),
                        Triple("te", "Telugu (తెలుగు)", "సహజమైన తెలుగు సంభాషణ"),
                        Triple("hi", "Hindi (हिन्दी)", "प्राकृतिक हिंदी आवाज")
                    )

                    languages.forEach { (code, name, sub) ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 6.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text(
                                    text = name,
                                    style = MaterialTheme.typography.titleMedium.copy(
                                        color = if (currentLang == code) AuraCyan else Color.White,
                                        fontWeight = FontWeight.SemiBold
                                    )
                                )
                                Text(text = sub, style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary))
                            }
                            RadioButton(
                                selected = currentLang == code,
                                onClick = { viewModel.setLanguage(code) },
                                colors = RadioButtonDefaults.colors(selectedColor = AuraCyan, unselectedColor = AuraTextSecondary)
                            )
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 2. Battery Optimization Guidance
        item {
            Text(
                text = "BATTERY OPTIMIZATION",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                border = BorderStroke(1.dp, if (isIgnoringBatteryOptimizations) AuraSuccess.copy(alpha = 0.3f) else AuraWarning.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            imageVector = if (isIgnoringBatteryOptimizations) Icons.Default.BatteryChargingFull else Icons.Default.BatteryAlert,
                            contentDescription = null,
                            tint = if (isIgnoringBatteryOptimizations) AuraSuccess else AuraWarning,
                            modifier = Modifier.size(24.dp)
                        )
                        Spacer(modifier = Modifier.width(10.dp))
                        Text(
                            text = if (isIgnoringBatteryOptimizations) "Background Listening Optimized" else "Background Restrictions Active",
                            style = MaterialTheme.typography.titleMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
                        )
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "To ensure AURA listens reliably for \"Hey AURA\" without being terminated by Android or device manufacturers, battery optimizations must be disabled.",
                        style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary)
                    )
                    if (!isIgnoringBatteryOptimizations) {
                        Spacer(modifier = Modifier.height(12.dp))
                        Button(
                            onClick = {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                                    val intent = Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS).apply {
                                        data = Uri.parse("package:" + context.packageName)
                                    }
                                    try {
                                        context.startActivity(intent)
                                    } catch (e: Exception) {
                                        val fallback = Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
                                        context.startActivity(fallback)
                                    }
                                }
                            },
                            colors = ButtonDefaults.buttonColors(containerColor = AuraNeonPurple),
                            shape = RoundedCornerShape(10.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(text = "Disable Battery Restrictions", color = Color.White)
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 3. Audio & Speech Controls
        item {
            Text(
                text = "SPEECH RATE & PITCH",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                border = BorderStroke(1.dp, AuraBorderGlow.copy(alpha = 0.2f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Voice Speed (${String.format("%.1f", speechRate)}x)",
                        style = MaterialTheme.typography.bodyMedium.copy(color = Color.White)
                    )
                    Slider(
                        value = speechRate,
                        onValueChange = { speechRate = it },
                        valueRange = 0.5f..2.0f,
                        colors = SliderDefaults.colors(thumbColor = AuraCyan, activeTrackColor = AuraCyan)
                    )

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Wake Word Sensitivity (${String.format("%.0f", wakeSensitivity * 100)}%)",
                        style = MaterialTheme.typography.bodyMedium.copy(color = Color.White)
                    )
                    Slider(
                        value = wakeSensitivity,
                        onValueChange = { wakeSensitivity = it },
                        valueRange = 0.1f..1.0f,
                        colors = SliderDefaults.colors(thumbColor = AuraViolet, activeTrackColor = AuraViolet)
                    )
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 4. Persistence & Security Info
        item {
            Text(
                text = "DATA & SECURITY",
                style = MaterialTheme.typography.labelLarge.copy(color = AuraTextSecondary, fontSize = 12.sp, letterSpacing = 1.5.sp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                border = BorderStroke(1.dp, AuraBorderGlow.copy(alpha = 0.15f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Local Storage & Reboot Recovery",
                        style = MaterialTheme.typography.titleMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "All notes, ordered points, tasks, and reminders are stored securely in local Room Database. Alarms and reminders are automatically rescheduled when your device reboots.",
                        style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary)
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Divider(color = AuraCardDark)
                    Spacer(modifier = Modifier.height(12.dp))
                    Text(
                        text = "Privacy Assurance",
                        style = MaterialTheme.typography.titleMedium.copy(color = Color.White, fontWeight = FontWeight.Bold)
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "No audio is recorded secretly. No cloud AI chatbots (ChatGPT/OpenAI/Gemini) are queried. All command interpretation is executed directly on your device via the local deterministic command engine.",
                        style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary)
                    )
                }
            }
        }
    }
}
