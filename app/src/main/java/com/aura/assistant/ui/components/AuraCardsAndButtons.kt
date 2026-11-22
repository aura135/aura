package com.aura.assistant.ui.components

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aura.assistant.data.local.entity.NoteEntity
import com.aura.assistant.data.local.entity.NotePointEntity
import com.aura.assistant.ui.theme.*
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

@Composable
fun AuraButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    icon: ImageVector? = null,
    isDanger: Boolean = false,
    enabled: Boolean = true
) {
    val borderColor = if (isDanger) AuraDanger else AuraCyan
    val glowColor = if (isDanger) AuraDanger.copy(alpha = 0.2f) else AuraCyan.copy(alpha = 0.2f)
    val contentColor = if (isDanger) AuraDanger else AuraCyan

    Button(
        onClick = onClick,
        enabled = enabled,
        shape = RoundedCornerShape(14.dp),
        border = BorderStroke(1.5.dp, borderColor),
        colors = ButtonDefaults.buttonColors(
            containerColor = AuraCardDark.copy(alpha = 0.8f),
            contentColor = contentColor,
            disabledContainerColor = AuraCardDark.copy(alpha = 0.3f),
            disabledContentColor = AuraTextSecondary
        ),
        modifier = modifier
            .height(56.dp)
            .border(
                BorderStroke(2.dp, glowColor),
                RoundedCornerShape(14.dp)
            )
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (icon != null) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = contentColor,
                    modifier = Modifier.size(20.dp)
                )
                Spacer(modifier = Modifier.width(8.dp))
            }
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge.copy(
                    color = contentColor,
                    fontSize = 15.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = 1.2.sp
                )
            )
        }
    }
}

@Composable
fun ConnectionCard(
    title: String,
    description: String,
    isConnected: Boolean,
    statusText: String,
    icon: ImageVector,
    onActionClick: (() -> Unit)? = null,
    actionButtonText: String? = null,
    modifier: Modifier = Modifier
) {
    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
        border = BorderStroke(1.dp, if (isConnected) AuraCyan.copy(alpha = 0.25f) else AuraDanger.copy(alpha = 0.3f)),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(42.dp)
                            .clip(RoundedCornerShape(10.dp))
                            .background(AuraCardDark),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = icon,
                            contentDescription = null,
                            tint = if (isConnected) AuraCyan else AuraDanger,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = title,
                            style = MaterialTheme.typography.titleLarge.copy(fontSize = 17.sp),
                            color = AuraTextPrimary
                        )
                        Text(
                            text = description,
                            style = MaterialTheme.typography.bodyMedium.copy(fontSize = 13.sp),
                            color = AuraTextSecondary
                        )
                    }
                }

                // Status Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (isConnected) AuraSuccess.copy(alpha = 0.15f) else AuraDanger.copy(alpha = 0.15f),
                    border = BorderStroke(1.dp, if (isConnected) AuraSuccess else AuraDanger)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        Icon(
                            imageVector = if (isConnected) Icons.Default.CheckCircle else Icons.Default.Warning,
                            contentDescription = null,
                            tint = if (isConnected) AuraSuccess else AuraDanger,
                            modifier = Modifier.size(12.dp)
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = statusText,
                            style = MaterialTheme.typography.bodySmall.copy(fontWeight = FontWeight.Bold),
                            color = if (isConnected) AuraSuccess else AuraDanger
                        )
                    }
                }
            }

            if (onActionClick != null && actionButtonText != null) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onActionClick,
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = AuraNeonPurple),
                    modifier = Modifier.fillMaxWidth().height(40.dp)
                ) {
                    Text(text = actionButtonText, color = Color.White, fontSize = 13.sp, fontWeight = FontWeight.SemiBold)
                }
            }
        }
    }
}

@Composable
fun NoteCard(
    note: NoteEntity,
    points: List<NotePointEntity>,
    onDelete: () -> Unit,
    onSpeak: () -> Unit,
    modifier: Modifier = Modifier
) {
    val sdf = SimpleDateFormat("MMM d, yyyy · h:mm a", Locale.getDefault())
    val dateStr = sdf.format(Date(note.createdAt))

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = AuraSurfaceDark),
        border = BorderStroke(1.dp, AuraNeonPurple.copy(alpha = 0.35f)),
        modifier = modifier
            .fillMaxWidth()
            .padding(vertical = 6.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(
                    text = note.title,
                    style = MaterialTheme.typography.titleLarge.copy(fontSize = 17.sp, color = AuraCyan),
                    fontWeight = FontWeight.Bold
                )
                IconButton(onClick = onDelete, modifier = Modifier.size(28.dp)) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete Note",
                        tint = AuraDanger.copy(alpha = 0.8f),
                        modifier = Modifier.size(20.dp)
                    )
                }
            }

            Text(
                text = dateStr,
                style = MaterialTheme.typography.bodySmall.copy(color = AuraTextSecondary, fontSize = 12.sp),
                modifier = Modifier.padding(bottom = 8.dp)
            )

            // Ordered Points
            points.sortedBy { it.pointOrder }.forEach { point ->
                Row(
                    modifier = Modifier.padding(vertical = 3.dp),
                    verticalAlignment = Alignment.Top
                ) {
                    Text(
                        text = "${point.pointOrder}.",
                        color = AuraCyan,
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        modifier = Modifier.width(24.dp)
                    )
                    Text(
                        text = point.pointText,
                        color = AuraTextPrimary,
                        fontSize = 14.sp
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))
            OutlinedButton(
                onClick = onSpeak,
                shape = RoundedCornerShape(10.dp),
                border = BorderStroke(1.dp, AuraCyan.copy(alpha = 0.4f)),
                modifier = Modifier.fillMaxWidth().height(36.dp)
            ) {
                Text(text = "Read Points Aloud", color = AuraCyan, fontSize = 13.sp)
            }
        }
    }
}
