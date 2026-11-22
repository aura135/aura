package com.aura.assistant.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.assistant.service.AssistantVisualState
import com.aura.assistant.ui.components.GlowingOrb
import com.aura.assistant.ui.theme.*
import com.aura.assistant.ui.viewmodel.AuraViewModel
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun HomeScreen(viewModel: AuraViewModel, onNavigateToVoice: () -> Unit) {
    val visualState by viewModel.visualState.collectAsState()
    val isPaused by viewModel.isVoicePaused.collectAsState()
    val notes by viewModel.notes.collectAsState()
    val reminders by viewModel.reminders.collectAsState()
    val alarms by viewModel.alarms.collectAsState()
    val tasks by viewModel.tasks.collectAsState()
    val history by viewModel.commandHistory.collectAsState()

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBgDark)
            .padding(horizontal = 20.dp),
        contentPadding = PaddingValues(top = 24.dp, bottom = 90.dp)
    ) {
        // 1. Header
        item {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "AURA",
                        style = MaterialTheme.typography.headlineLarge.copy(
                            color = AuraCyan,
                            fontWeight = FontWeight.ExtraBold,
                            letterSpacing = 2.sp
                        )
                    )
                    Text(
                        text = "Autonomous Voice Assistant",
                        style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
                    )
                }

                Surface(
                    shape = RoundedCornerShape(12.dp),
                    color = if (isPaused) AuraDanger.copy(alpha = 0.15f) else AuraCyan.copy(alpha = 0.15f),
                    border = BorderStroke(1.dp, if (isPaused) AuraDanger else AuraCyan)
                ) {
                    Text(
                        text = if (isPaused) "PAUSED" else "ONLINE",
                        color = if (isPaused) AuraDanger else AuraCyan,
                        fontWeight = FontWeight.Bold,
                        fontSize = 12.sp,
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp)
                    )
                }
            }
            Spacer(modifier = Modifier.height(24.dp))
        }

        // 2. Futuristic Hero Banner
        item {
            Card(
                shape = RoundedCornerShape(20.dp),
                colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                border = BorderStroke(1.dp, AuraNeonPurple.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier.padding(20.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    GlowingOrb(
                        state = visualState,
                        size = 90.dp,
                        modifier = Modifier.padding(end = 16.dp)
                    )
                    Column {
                        Text(
                            text = "Wake Word Active",
                            style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp, color = Color.White),
                            fontWeight = FontWeight.Bold
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Say \"Hey AURA\" followed by your command.",
                            style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary, fontSize = 13.sp)
                        )
                        Spacer(modifier = Modifier.height(10.dp))
                        OutlinedButton(
                            onClick = onNavigateToVoice,
                            shape = RoundedCornerShape(8.dp),
                            border = BorderStroke(1.dp, AuraCyan),
                            modifier = Modifier.height(34.dp)
                        ) {
                            Text(text = "Open Voice Interface", color = AuraCyan, fontSize = 12.sp)
                        }
                    }
                }
            }
            Spacer(modifier = Modifier.height(20.dp))
        }

        // 3. Quick Stats Grid
        item {
            Text(
                text = "SYSTEM METRICS",
                style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp, letterSpacing = 1.5.sp),
                color = AuraTextSecondary
            )
            Spacer(modifier = Modifier.height(10.dp))
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                MetricCard(
                    title = "Notes",
                    count = notes.size.toString(),
                    icon = Icons.Default.NoteAlt,
                    color = AuraCyan,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Reminders",
                    count = reminders.size.toString(),
                    icon = Icons.Default.Alarm,
                    color = AuraNeonPurple,
                    modifier = Modifier.weight(1f)
                )
                MetricCard(
                    title = "Tasks",
                    count = tasks.count { !it.isCompleted }.toString(),
                    icon = Icons.Default.CheckCircle,
                    color = AuraViolet,
                    modifier = Modifier.weight(1f)
                )
            }
            Spacer(modifier = Modifier.height(24.dp))
        }

        // 4. Recent Command History
        item {
            Text(
                text = "RECENT VOICE COMMANDS",
                style = MaterialTheme.typography.labelLarge.copy(fontSize = 12.sp, letterSpacing = 1.5.sp),
                color = AuraTextSecondary
            )
            Spacer(modifier = Modifier.height(10.dp))
        }

        if (history.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Box(modifier = Modifier.fillMaxWidth().padding(24.dp), contentAlignment = Alignment.Center) {
                        Text(
                            text = "No voice commands executed yet. Say \"Hey AURA\" to begin.",
                            style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
                        )
                    }
                }
            }
        } else {
            items(history.take(5)) { cmd ->
                val sdf = SimpleDateFormat("h:mm a", Locale.getDefault())
                val timeStr = sdf.format(Date(cmd.timestamp))
                Card(
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    border = BorderStroke(1.dp, AuraBorderGlow.copy(alpha = 0.15f)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 4.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = "\"${cmd.rawText}\"",
                                style = MaterialTheme.typography.bodyLarge.copy(fontSize = 15.sp, fontWeight = FontWeight.SemiBold),
                                color = AuraTextPrimary
                            )
                            Spacer(modifier = Modifier.height(2.dp))
                            Text(
                                text = cmd.responseText,
                                style = MaterialTheme.typography.bodySmall.copy(fontSize = 12.sp),
                                color = AuraTextSecondary
                            )
                        }
                        Text(
                            text = timeStr,
                            style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                            color = AuraCyan
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun MetricCard(
    title: String,
    count: String,
    icon: ImageVector,
    color: Color,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
        border = BorderStroke(1.dp, color.copy(alpha = 0.3f)),
        modifier = modifier
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = color,
                modifier = Modifier.size(20.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = count,
                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold, fontSize = 22.sp),
                color = Color.White
            )
            Text(
                text = title,
                style = MaterialTheme.typography.bodySmall.copy(fontSize = 11.sp),
                color = AuraTextSecondary
            )
        }
    }
}
