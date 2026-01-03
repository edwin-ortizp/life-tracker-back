package com.lifetracker.tasks.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Card
import androidx.compose.material3.CardDefaults
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.lifetracker.tasks.Priority
import com.lifetracker.tasks.Status
import com.lifetracker.tasks.Task
import com.lifetracker.tasks.data.SampleTasks

@Composable
fun TaskListScreen(tasks: List<Task>) {
    Surface(modifier = Modifier.fillMaxSize()) {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                Text(
                    text = "Tareas",
                    style = MaterialTheme.typography.headlineSmall,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground
                )
            }

            if (tasks.isEmpty()) {
                item {
                    EmptyState()
                }
            } else {
                items(tasks, key = { it.id }) { task ->
                    TaskCard(task)
                }
            }
        }
    }
}

@Composable
private fun TaskCard(task: Task) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
            PriorityBadge(priority = task.priority)
            Text(
                text = task.title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.SemiBold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = buildMeta(task),
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            StatusPill(status = task.status)
        }
    }
}

private fun buildMeta(task: Task): String {
    val due = task.dueDate?.let { " • Vence: $it" } ?: ""
    return "Creada: ${task.createdAt}$due"
}

@Composable
private fun PriorityBadge(priority: Priority) {
    val colors = when (priority) {
        Priority.HIGH -> Color(0xFFF472B6)
        Priority.MEDIUM -> Color(0xFFFBBF24)
        Priority.LOW -> Color(0xFF22D3EE)
    }
    Surface(
        color = colors,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = priority.name,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
            color = Color(0xFF0F172A)
        )
    }
}

@Composable
private fun StatusPill(status: Status) {
    val isCompleted = status == Status.COMPLETED
    val background = if (isCompleted) Color(0xFF16A34A).copy(alpha = 0.15f) else Color(0xFF3B82F6).copy(alpha = 0.15f)
    val textColor = if (isCompleted) Color(0xFF22C55E) else Color(0xFF60A5FA)

    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = background,
        shape = MaterialTheme.shapes.medium
    ) {
        Text(
            text = if (isCompleted) "Completada" else "Pendiente",
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 8.dp),
            style = MaterialTheme.typography.labelLarge,
            textAlign = TextAlign.Center,
            color = textColor
        )
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 48.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = "No hay tareas todavía",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground
        )
        Text(
            text = "Agrega tareas para verlas aquí.",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
fun TaskListPreview() {
    TaskListScreen(tasks = SampleTasks.items)
}
