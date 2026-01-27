package com.edwinortizp.lifetracker.ui.screens

import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
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
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.edwinortizp.lifetracker.data.SupabaseClient
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive

private val json = Json { ignoreUnknownKeys = true }

private data class TaskRow(
    val id: String,
    val title: String,
    val subtitle: String?,
    val raw: JsonObject
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    onTaskSelected: (String) -> Unit
) {
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var tasks by remember { mutableStateOf<List<TaskRow>>(emptyList()) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        isLoading = true
        errorMessage = null
        try {
            val client = SupabaseClient.requireClient()
            val result = client.from("tasks").select()
            val rows = result.decodeList<JsonObject>()
            tasks = rows.map { row ->
                val id = row.string("id") ?: row.string("uuid") ?: row.string("task_id") ?: "sin-id"
                val title = row.string("title") ?: row.string("name") ?: "Sin título"
                val subtitle = row.string("description") ?: row.string("notes") ?: row.string("status")
                TaskRow(id = id, title = title, subtitle = subtitle, raw = row)
            }
        } catch (e: Exception) {
            errorMessage = e.message ?: "Error al cargar tareas"
            Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show()
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Tareas") }) }
    ) { padding ->
        when {
            isLoading -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    CircularProgressIndicator()
                }
            }
            errorMessage != null -> {
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text(text = errorMessage ?: "Error desconocido")
                }
            }
            else -> {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(tasks) { task ->
                        TaskRowCard(task = task, onClick = {
                            val payload = json.encodeToString(JsonObject.serializer(), task.raw)
                            onTaskSelected(Uri.encode(payload))
                        })
                    }
                }
            }
        }
    }
}

@Composable
private fun TaskRowCard(task: TaskRow, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = task.title, style = MaterialTheme.typography.titleMedium)
            if (!task.subtitle.isNullOrBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = task.subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row {
                Text(
                    text = "ID: ${task.id}",
                    style = MaterialTheme.typography.labelSmall
                )
            }
        }
    }
}

private fun JsonObject.string(key: String): String? {
    val value = this[key] ?: return null
    return when (value) {
        is JsonPrimitive -> value.content
        else -> value.toString()
    }
}
