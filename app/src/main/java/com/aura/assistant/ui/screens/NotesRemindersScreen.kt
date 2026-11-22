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
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.assistant.data.local.entity.NoteEntity
import com.aura.assistant.data.local.entity.NotePointEntity
import com.aura.assistant.ui.components.NoteCard
import com.aura.assistant.ui.theme.*
import com.aura.assistant.ui.viewmodel.AuraViewModel
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun NotesRemindersScreen(viewModel: AuraViewModel) {
    var selectedTab by remember { mutableStateOf(0) }
    val tabTitles = listOf("Notes & Points", "Reminders", "Alarms", "Tasks")

    val notes by viewModel.notes.collectAsState()
    val reminders by viewModel.reminders.collectAsState()
    val alarms by viewModel.alarms.collectAsState()
    val tasks by viewModel.tasks.collectAsState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBgDark)
            .padding(horizontal = 20.dp)
    ) {
        Column(modifier = Modifier.padding(top = 24.dp, bottom = 12.dp)) {
            Text(
                text = "NOTES & SCHEDULE",
                style = MaterialTheme.typography.headlineLarge.copy(
                    color = AuraCyan,
                    letterSpacing = 2.sp
                )
            )
            Text(
                text = "Voice notes, ordered points, reminders, and tasks",
                style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
            )
            Spacer(modifier = Modifier.height(16.dp))

            // Sub-tabs
            TabRow(
                selectedTabIndex = selectedTab,
                containerColor = AuraSurfaceDark,
                contentColor = AuraCyan,
                divider = {}
            ) {
                tabTitles.forEachIndexed { index, title ->
                    Tab(
                        selected = selectedTab == index,
                        onClick = { selectedTab = index },
                        text = {
                            Text(
                                text = title,
                                fontSize = 12.sp,
                                fontWeight = if (selectedTab == index) FontWeight.Bold else FontWeight.Normal,
                                color = if (selectedTab == index) AuraCyan else AuraTextSecondary
                            )
                        }
                    )
                }
            }
        }

        when (selectedTab) {
            0 -> NotesTabContent(notes, viewModel)
            1 -> RemindersTabContent(reminders)
            2 -> AlarmsTabContent(alarms)
            3 -> TasksTabContent(tasks, viewModel)
        }
    }
}

@Composable
fun NotesTabContent(notes: List<NoteEntity>, viewModel: AuraViewModel) {
    val coroutineScope = rememberCoroutineScope()
    var pointsMap by remember { mutableStateOf<Map<Long, List<NotePointEntity>>>(emptyMap()) }

    LaunchedEffect(notes) {
        val map = mutableMapOf<Long, List<NotePointEntity>>()
        for (note in notes) {
            map[note.id] = viewModel.getPointsForNote(note.id)
        }
        pointsMap = map
    }

    LazyColumn(
        contentPadding = PaddingValues(top = 8.dp, bottom = 90.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        if (notes.isEmpty()) {
            item {
                EmptyStateCard(
                    message = "No notes saved yet.\nSay: \"Hey AURA, note this...\" or \"Save these points...\"",
                    icon = Icons.Default.NoteAlt
                )
            }
        } else {
            items(notes) { note ->
                val points = pointsMap[note.id] ?: emptyList()
                NoteCard(
                    note = note,
                    points = points,
                    onDelete = { viewModel.deleteNote(note.id) },
                    onSpeak = { viewModel.readPointsAloud(points) }
                )
            }
        }
    }
}

@Composable
fun RemindersTabContent(reminders: List<com.aura.assistant.data.local.entity.ReminderEntity>) {
    val sdf = SimpleDateFormat("MMM d, yyyy · h:mm a", Locale.getDefault())

    LazyColumn(
        contentPadding = PaddingValues(top = 8.dp, bottom = 90.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        if (reminders.isEmpty()) {
            item {
                EmptyStateCard(
                    message = "No active reminders.\nSay: \"Hey AURA, remind me to study at 6 PM\" or \"Free time reminder between 6 PM and 8 PM\"",
                    icon = Icons.Default.Alarm
                )
            }
        } else {
            items(reminders) { rem ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    border = BorderStroke(1.dp, if (rem.isFreeTime) AuraViolet.copy(alpha = 0.4f) else AuraCyan.copy(alpha = 0.25f)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(
                                    text = rem.title,
                                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 16.sp, color = Color.White),
                                    fontWeight = FontWeight.Bold
                                )
                                if (rem.isFreeTime) {
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Surface(
                                        shape = RoundedCornerShape(6.dp),
                                        color = AuraViolet.copy(alpha = 0.2f)
                                    ) {
                                        Text(
                                            text = "FREE TIME",
                                            color = AuraViolet,
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                            Spacer(modifier = Modifier.height(4.dp))
                            Text(
                                text = if (rem.isFreeTime) "Window: ${rem.freeTimeStart} - ${rem.freeTimeEnd}" else sdf.format(Date(rem.reminderTime)),
                                style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary, fontSize = 13.sp)
                            )
                        }

                        Icon(
                            imageVector = if (rem.isCompleted) Icons.Default.CheckCircle else Icons.Default.Schedule,
                            contentDescription = null,
                            tint = if (rem.isCompleted) AuraSuccess else AuraCyan,
                            modifier = Modifier.size(22.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun AlarmsTabContent(alarms: List<com.aura.assistant.data.local.entity.AlarmEntity>) {
    LazyColumn(
        contentPadding = PaddingValues(top = 8.dp, bottom = 90.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        if (alarms.isEmpty()) {
            item {
                EmptyStateCard(
                    message = "No active alarms scheduled.\nSay: \"Hey AURA, set an alarm for 6 AM\" or \"Wake me up at 5:30 AM\"",
                    icon = Icons.Default.AlarmOn
                )
            }
        } else {
            items(alarms) { alarm ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    border = BorderStroke(1.dp, AuraBorderGlow.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column {
                            Text(
                                text = String.format("%02d:%02d", alarm.hour, alarm.minute),
                                style = MaterialTheme.typography.headlineMedium.copy(fontWeight = FontWeight.Bold, color = AuraCyan)
                            )
                            Text(
                                text = alarm.label,
                                style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextSecondary)
                            )
                        }
                        Switch(
                            checked = alarm.isEnabled,
                            onCheckedChange = {},
                            colors = SwitchDefaults.colors(
                                checkedThumbColor = AuraCyan,
                                checkedTrackColor = AuraNeonPurple
                            )
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun TasksTabContent(tasks: List<com.aura.assistant.data.local.entity.TaskEntity>, viewModel: AuraViewModel) {
    LazyColumn(
        contentPadding = PaddingValues(top = 8.dp, bottom = 90.dp),
        modifier = Modifier.fillMaxSize()
    ) {
        if (tasks.isEmpty()) {
            item {
                EmptyStateCard(
                    message = "No tasks yet.\nSay: \"Hey AURA, add a task to submit report\"",
                    icon = Icons.Default.Assignment
                )
            }
        } else {
            items(tasks) { task ->
                Card(
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    border = BorderStroke(1.dp, if (task.isCompleted) AuraSuccess.copy(alpha = 0.3f) else AuraBorderGlow.copy(alpha = 0.2f)),
                    modifier = Modifier.fillMaxWidth().padding(vertical = 5.dp)
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(
                                text = task.title,
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    fontWeight = FontWeight.SemiBold,
                                    color = if (task.isCompleted) AuraTextSecondary else Color.White
                                )
                            )
                        }

                        IconButton(onClick = { viewModel.completeTask(task.id) }) {
                            Icon(
                                imageVector = if (task.isCompleted) Icons.Default.CheckCircle else Icons.Default.RadioButtonUnchecked,
                                contentDescription = null,
                                tint = if (task.isCompleted) AuraSuccess else AuraCyan
                            )
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EmptyStateCard(message: String, icon: androidx.compose.ui.graphics.vector.ImageVector) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp)
    ) {
        Column(
            modifier = Modifier.fillMaxWidth().padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = AuraCyan.copy(alpha = 0.5f),
                modifier = Modifier.size(48.dp)
            )
            Spacer(modifier = Modifier.height(16.dp))
            Text(
                text = message,
                style = MaterialTheme.typography.bodyMedium.copy(
                    color = AuraTextSecondary,
                    lineHeight = 22.sp
                ),
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}
