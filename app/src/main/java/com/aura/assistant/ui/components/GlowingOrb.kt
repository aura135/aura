package com.aura.assistant.ui.components

import androidx.compose.animation.core.*
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import com.aura.assistant.service.AssistantVisualState
import com.aura.assistant.ui.theme.AuraCyan
import com.aura.assistant.ui.theme.AuraDanger
import com.aura.assistant.ui.theme.AuraNeonPurple
import com.aura.assistant.ui.theme.AuraViolet

@Composable
fun GlowingOrb(
    state: AssistantVisualState,
    audioRms: Float = 0f,
    size: Dp = 220.dp,
    modifier: Modifier = Modifier
) {
    val infiniteTransition = rememberInfiniteTransition(label = "orb_pulse")

    val pulseScale by infiniteTransition.animateFloat(
        initialValue = 0.85f,
        targetValue = 1.15f,
        animationSpec = infiniteRepeatable(
            animation = tween(
                durationMillis = when (state) {
                    AssistantVisualState.LISTENING_FOR_COMMAND -> 800
                    AssistantVisualState.PROCESSING -> 600
                    AssistantVisualState.SPEAKING -> 1000
                    AssistantVisualState.PAUSED -> 2500
                    else -> 1800
                },
                easing = FastOutSlowInEasing
            ),
            repeatMode = RepeatMode.Reverse
        ),
        label = "pulse_scale"
    )

    val rotationAngle by infiniteTransition.animateFloat(
        initialValue = 0f,
        targetValue = 360f,
        animationSpec = infiniteRepeatable(
            animation = tween(durationMillis = 6000, easing = LinearEasing)
        ),
        label = "rotation"
    )

    val coreColor = when (state) {
        AssistantVisualState.PAUSED -> AuraDanger
        AssistantVisualState.HEARD_WAKE_WORD -> AuraNeonPurple
        AssistantVisualState.LISTENING_FOR_COMMAND -> AuraCyan
        AssistantVisualState.PROCESSING -> AuraViolet
        AssistantVisualState.SPEAKING -> AuraCyan
        else -> AuraCyan
    }

    val glowColor = when (state) {
        AssistantVisualState.PAUSED -> AuraDanger.copy(alpha = 0.3f)
        AssistantVisualState.HEARD_WAKE_WORD -> AuraViolet.copy(alpha = 0.5f)
        else -> AuraNeonPurple.copy(alpha = 0.4f)
    }

    val dynamicBoost = (audioRms.coerceIn(0f, 10f) / 10f) * 0.2f

    Box(
        modifier = modifier.size(size),
        contentAlignment = Alignment.Center
    ) {
        Canvas(modifier = Modifier.size(size)) {
            val center = Offset(size.toPx() / 2, size.toPx() / 2)
            val baseRadius = (size.toPx() / 2.8f) * (pulseScale + dynamicBoost)

            // Outer diffused glow
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(glowColor, Color.Transparent),
                    center = center,
                    radius = baseRadius * 1.5f
                ),
                radius = baseRadius * 1.5f,
                center = center
            )

            // Secondary wave ring
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(AuraViolet.copy(alpha = 0.6f), Color.Transparent),
                    center = center,
                    radius = baseRadius * 1.2f
                ),
                radius = baseRadius * 1.2f,
                center = center
            )

            // Primary Inner Core
            drawCircle(
                brush = Brush.radialGradient(
                    colors = listOf(Color.White, coreColor, AuraNeonPurple),
                    center = center,
                    radius = baseRadius
                ),
                radius = baseRadius,
                center = center
            )

            // Central bright photon nucleus
            drawCircle(
                color = Color.White.copy(alpha = 0.85f),
                radius = baseRadius * 0.3f,
                center = center
            )
        }
    }
}
