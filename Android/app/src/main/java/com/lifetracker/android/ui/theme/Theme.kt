package com.lifetracker.android.ui.theme

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable

private val lightColors = lightColorScheme()
private val darkColors = darkColorScheme()

@Composable
fun LifeTrackerTheme(content: @Composable () -> Unit) {
    MaterialTheme(
        colorScheme = lightColors,
        typography = MaterialTheme.typography,
        content = content
    )
}
