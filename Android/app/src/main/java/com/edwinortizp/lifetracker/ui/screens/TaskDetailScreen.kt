package com.edwinortizp.lifetracker.ui.screens

import android.net.Uri
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject

private val json = Json { ignoreUnknownKeys = true }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskDetailScreen(
    encodedTask: String
) {
    var task by remember { mutableStateOf<JsonObject?>(null) }

    LaunchedEffect(encodedTask) {
        val decoded = Uri.decode(encodedTask)
        task = runCatching { json.decodeFromString(JsonObject.serializer(), decoded) }.getOrNull()
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Detalle de tarea") }) }
    ) { padding ->
        val taskData = task
        if (taskData == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "No se pudo cargar la tarea.",
                    modifier = Modifier.padding(16.dp)
                )
            }
            return@Scaffold
        }

        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                val title = taskData["title"]?.toString()
                    ?: taskData["name"]?.toString()
                    ?: "Tarea"
                Text(text = title.trim('"'), style = MaterialTheme.typography.headlineSmall)
                Spacer(modifier = Modifier.height(8.dp))
            }
            items(taskData.entries.toList()) { entry ->
                TaskDetailRow(label = entry.key, value = entry.value)
            }
        }
    }
}

@Composable
private fun TaskDetailRow(label: String, value: JsonElement) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(4.dp))
        Text(text = value.toString().trim('"'), style = MaterialTheme.typography.bodyMedium)
    }
}
