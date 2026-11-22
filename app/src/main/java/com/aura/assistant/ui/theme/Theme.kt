package com.aura.assistant.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

private val DarkColorScheme = darkColorScheme(
    primary = AuraCyan,
    secondary = AuraNeonPurple,
    tertiary = AuraViolet,
    background = AuraBgDark,
    surface = AuraSurfaceDark,
    surfaceVariant = AuraCardDark,
    onPrimary = AuraBgDark,
    onSecondary = AuraTextPrimary,
    onBackground = AuraTextPrimary,
    onSurface = AuraTextPrimary,
    error = AuraDanger
)

@Composable
fun AURATheme(content: @Composable () -> Unit) {
    val colorScheme = DarkColorScheme
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = AuraBgDark.toArgb()
            window.navigationBarColor = AuraBgDark.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
            WindowCompat.getInsetsController(window, view).isAppearanceLightNavigationBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
