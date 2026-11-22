package com.aura.assistant.ui.screens

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.assistant.service.AssistantVisualState
import com.aura.assistant.ui.components.AuraButton
import com.aura.assistant.ui.components.GlowingOrb
import com.aura.assistant.ui.theme.*
import com.aura.assistant.ui.viewmodel.AuraViewModel

@Composable
fun VoiceAssistantScreen(viewModel: AuraViewModel) {
    val visualState by viewModel.visualState.collectAsState()
    val audioRms by viewModel.audioRms.collectAsState()
    val lastRecognizedCommand by viewModel.lastRecognizedCommand.collectAsState()
    val lastSpokenResponse by viewModel.lastSpokenResponse.collectAsState()
    val isPaused by viewModel.isVoicePaused.collectAsState()
    val isEnrolled by viewModel.isVoiceEnrolled.collectAsState()

    var showDeleteConfirmDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AuraBgDark)
            .verticalScroll(rememberScrollState())
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.SpaceBetween
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier.padding(top = 28.dp)
        ) {
            // Header
            Text(
                text = "VOICE ENGINE",
                style = MaterialTheme.typography.labelLarge.copy(
                    letterSpacing = 3.sp,
                    fontSize = 13.sp,
                    color = AuraCyan
                )
            )
            Spacer(modifier = Modifier.height(6.dp))
            Text(
                text = when (visualState) {
                    AssistantVisualState.PAUSED -> "Listening Paused"
                    AssistantVisualState.LISTENING_FOR_WAKE -> "Listening for \"Hey AURA\""
                    AssistantVisualState.HEARD_WAKE_WORD -> "AURA Activated!"
                    AssistantVisualState.LISTENING_FOR_COMMAND -> "Listening to command..."
                    AssistantVisualState.PROCESSING -> "Processing command..."
                    AssistantVisualState.SPEAKING -> "Speaking response..."
                    AssistantVisualState.IDLE -> "Standby Mode"
                },
                style = MaterialTheme.typography.titleLarge.copy(
                    fontSize = 19.sp,
                    fontWeight = FontWeight.Bold,
                    color = if (isPaused) AuraDanger else Color.White
                )
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Glowing Voice Indicator Orb
            GlowingOrb(
                state = visualState,
                audioRms = audioRms,
                size = 230.dp
            )

            Spacer(modifier = Modifier.height(28.dp))

            // Live Voice Status Card
            AnimatedVisibility(
                visible = lastRecognizedCommand.isNotBlank() || lastSpokenResponse.isNotBlank(),
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Card(
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
                    border = BorderStroke(1.dp, AuraBorderGlow),
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        if (lastRecognizedCommand.isNotBlank()) {
                            Text(
                                text = "HEARD COMMAND",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = AuraCyan,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Text(
                                text = "\"$lastRecognizedCommand\"",
                                style = MaterialTheme.typography.bodyLarge.copy(
                                    color = Color.White,
                                    fontWeight = FontWeight.SemiBold,
                                    fontSize = 16.sp
                                ),
                                modifier = Modifier.padding(top = 2.dp, bottom = 8.dp)
                            )
                        }

                        if (lastSpokenResponse.isNotBlank()) {
                            Divider(color = AuraCardDark, thickness = 1.dp, modifier = Modifier.padding(vertical = 4.dp))
                            Text(
                                text = "AURA RESPONSE",
                                style = MaterialTheme.typography.bodySmall.copy(
                                    color = AuraNeonPurple,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold
                                )
                            )
                            Text(
                                text = lastSpokenResponse,
                                style = MaterialTheme.typography.bodyMedium.copy(
                                    color = AuraTextPrimary,
                                    fontSize = 14.sp
                                ),
                                modifier = Modifier.padding(top = 2.dp)
                            )
                        }
                    }
                }
            }
        }

        // STRICT MAIN VOICE INTERFACE REQUIREMENT:
        // ONLY THESE FOUR CONTROLS:
        // 1. ADD VOICE
        // 2. REMOVE VOICE
        // 3. DELETE VOICE
        // 4. PAUSE VOICE
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(top = 24.dp, bottom = 90.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            // Row 1: ADD VOICE & REMOVE VOICE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AuraButton(
                    text = "ADD VOICE",
                    onClick = { viewModel.addVoice() },
                    icon = Icons.Default.AddModerator,
                    enabled = !isEnrolled || isPaused,
                    modifier = Modifier.weight(1f)
                )

                AuraButton(
                    text = "REMOVE VOICE",
                    onClick = { viewModel.removeVoice() },
                    icon = Icons.Default.PersonRemove,
                    enabled = isEnrolled,
                    modifier = Modifier.weight(1f)
                )
            }

            // Row 2: PAUSE VOICE & DELETE VOICE
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                AuraButton(
                    text = if (isPaused) "RESUME VOICE" else "PAUSE VOICE",
                    onClick = { viewModel.togglePauseVoice() },
                    icon = if (isPaused) Icons.Default.PlayArrow else Icons.Default.Pause,
                    modifier = Modifier.weight(1f)
                )

                AuraButton(
                    text = "DELETE VOICE",
                    onClick = { showDeleteConfirmDialog = true },
                    icon = Icons.Default.DeleteForever,
                    isDanger = true,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }

    // Confirmation Dialog for DELETE VOICE
    if (showDeleteConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = {
                Text(
                    text = "Delete Saved Voice Profile?",
                    style = MaterialTheme.typography.titleLarge.copy(color = AuraDanger)
                )
            },
            text = {
                Text(
                    text = "This will permanently remove your enrolled voice preferences, sensitivities, and background listening configurations. You can add a new voice profile at any time.",
                    style = MaterialTheme.typography.bodyMedium.copy(color = AuraTextPrimary)
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.deleteVoice()
                        showDeleteConfirmDialog = false
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AuraDanger)
                ) {
                    Text(text = "Confirm Delete", color = Color.White)
                }
            },
            dismissButton = {
                OutlinedButton(
                    onClick = { showDeleteConfirmDialog = false },
                    border = BorderStroke(1.dp, AuraTextSecondary)
                ) {
                    Text(text = "Cancel", color = AuraTextSecondary)
                }
            },
            containerColor = AuraSurfaceDark,
            shape = RoundedCornerShape(16.dp)
        )
    }
}
