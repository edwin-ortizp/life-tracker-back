package com.edwinortizp.lifetracker.ui.screens

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Add
import androidx.compose.material3.AssistChip
import androidx.compose.material3.Card
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.TextField
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import com.edwinortizp.lifetracker.data.SupabaseClient
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import java.time.LocalDate
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZonedDateTime
import java.time.format.DateTimeParseException
import java.time.format.DateTimeFormatter
import java.time.format.DateTimeFormatterBuilder
import java.util.Locale

private val localeEsCo = Locale.forLanguageTag("es-CO")
private val dateFormatter = DateTimeFormatter.ofPattern("EEE d MMM", localeEsCo)
private val dateTimeFormatter = DateTimeFormatter.ofPattern("EEE d MMM, HH:mm", localeEsCo)

private data class TaskRow(
    val id: String,
    val title: String,
    val subtitle: String?,
    val completed: Boolean,
    val isPrivate: Boolean,
    val isRecurrent: Boolean,
    val priority: String?,
    val size: String?,
    val category: String?,
    val startDate: LocalDate?,
    val startDateTimeLocal: ZonedDateTime?,
    val raw: JsonObject
)

private enum class StatusFilter { ALL, PENDING, COMPLETED }
private enum class DateFilter { ALL, OVERDUE, TODAY, TOMORROW, FUTURE, NO_DATE }

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    onTaskSelected: (String) -> Unit,
    onCreateTask: () -> Unit,
    onBack: () -> Unit
) {
    var isLoading by remember { mutableStateOf(true) }
    var errorMessage by remember { mutableStateOf<String?>(null) }
    var tasks by remember { mutableStateOf<List<TaskRow>>(emptyList()) }
    var searchQuery by rememberSaveable { mutableStateOf("") }
    var statusFilter by rememberSaveable { mutableStateOf(StatusFilter.ALL) }
    var privateOnly by rememberSaveable { mutableStateOf(false) }
    var recurrentOnly by rememberSaveable { mutableStateOf(false) }
    var categoryFilter by rememberSaveable { mutableStateOf<String?>(null) }
    var dateFilter by rememberSaveable { mutableStateOf(DateFilter.ALL) }
    val context = LocalContext.current

    LaunchedEffect(Unit) {
        isLoading = true
        errorMessage = null
        try {
            val client = SupabaseClient.requireClient()
            val result = client.from("tasks").select()
            val rows = result.decodeList<JsonObject>()
            tasks = rows.map { row ->
                val id = row.string("id")
                    ?: row.string("uuid")
                    ?: row.string("task_id")
                    ?: row.string("task_code")
                    ?: "sin-id"
                val title = row.string("title") ?: row.string("name") ?: "Sin título"
                val subtitle = row.string("description") ?: row.string("notes") ?: row.string("status")
                val completed = row.boolean("completed") ?: false
                val isPrivate = row.boolean("is_private") ?: false
                val isRecurrent = row.boolean("is_recurrent") ?: false
                val priority = row.string("priority")
                val size = row.string("size")
                val category = row.string("category")
                val startDateTime = row.dateTime("start_date")
                val startDateTimeLocal = startDateTime?.atZoneSameInstant(ZoneId.systemDefault())
                val startDate = startDateTimeLocal?.toLocalDate()
                TaskRow(
                    id = id,
                    title = title,
                    subtitle = subtitle,
                    completed = completed,
                    isPrivate = isPrivate,
                    isRecurrent = isRecurrent,
                    priority = priority,
                    size = size,
                    category = category,
                    startDate = startDate,
                    startDateTimeLocal = startDateTimeLocal,
                    raw = row
                )
            }
        } catch (e: Exception) {
            errorMessage = e.message ?: "Error al cargar tareas"
            Toast.makeText(context, errorMessage, Toast.LENGTH_LONG).show()
        } finally {
            isLoading = false
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tareas") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onCreateTask) {
                Icon(Icons.Default.Add, contentDescription = "Nueva tarea")
            }
        }
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
                val filtered = tasks
                    .filter { task ->
                        val matchesQuery = searchQuery.isBlank() ||
                            task.title.contains(searchQuery, ignoreCase = true) ||
                            (task.subtitle?.contains(searchQuery, ignoreCase = true) == true) ||
                            (task.category?.contains(searchQuery, ignoreCase = true) == true)
                        val matchesStatus = when (statusFilter) {
                            StatusFilter.ALL -> true
                            StatusFilter.PENDING -> !task.completed
                            StatusFilter.COMPLETED -> task.completed
                        }
                        val matchesPrivate = !privateOnly || task.isPrivate
                        val matchesRecurrent = !recurrentOnly || task.isRecurrent
                        val matchesCategory = categoryFilter == null || task.category == categoryFilter
                        val matchesDate = matchesDateFilter(task, dateFilter)
                        matchesQuery && matchesStatus && matchesPrivate && matchesRecurrent &&
                            matchesCategory && matchesDate
                    }
                val grouped = groupByDueDate(filtered)
                val categories = tasks.mapNotNull { it.category }.distinct().sorted()

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    item {
                        Column {
                            TextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                modifier = Modifier.fillMaxWidth(),
                                placeholder = { Text("Buscar tareas") }
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Row(
                                modifier = Modifier
                                    .horizontalScroll(rememberScrollState())
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                FilterChip(
                                    text = "Todas",
                                    selected = statusFilter == StatusFilter.ALL,
                                    onClick = { statusFilter = StatusFilter.ALL }
                                )
                                FilterChip(
                                    text = "Pendientes",
                                    selected = statusFilter == StatusFilter.PENDING,
                                    onClick = { statusFilter = StatusFilter.PENDING }
                                )
                                FilterChip(
                                    text = "Completadas",
                                    selected = statusFilter == StatusFilter.COMPLETED,
                                    onClick = { statusFilter = StatusFilter.COMPLETED }
                                )
                                FilterChip(
                                    text = "Privadas",
                                    selected = privateOnly,
                                    onClick = { privateOnly = !privateOnly }
                                )
                                FilterChip(
                                    text = "Recurrentes",
                                    selected = recurrentOnly,
                                    onClick = { recurrentOnly = !recurrentOnly }
                                )
                            }
                            Spacer(modifier = Modifier.height(12.dp))
                            FilterRow(
                                label = "Categoría",
                                options = categories,
                                selected = categoryFilter,
                                onSelect = { categoryFilter = it }
                            )
                            Spacer(modifier = Modifier.height(8.dp))
                            FilterRow(
                                label = "Fechas",
                                options = listOf("Atrasadas", "Hoy", "Mañana", "Futuras", "Sin fecha"),
                                selected = dateFilter.toLabel(),
                                onSelect = { label ->
                                    dateFilter = dateFilterFromLabel(label)
                                }
                            )
                        }
                    }
                    grouped.forEach { section ->
                        if (section.items.isNotEmpty()) {
                            item {
                                Text(
                                    text = section.title,
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.padding(top = 12.dp)
                                )
                            }
                            items(section.items) { task ->
                                TaskRowCard(task = task, onClick = {
                                    onTaskSelected(task.id)
                                })
                            }
                        }
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
            val dateLabel = when {
                task.startDateTimeLocal != null -> task.startDateTimeLocal.format(dateTimeFormatter)
                task.startDate != null -> task.startDate.format(dateFormatter)
                else -> "Sin fecha"
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                if (task.completed) {
                    AssistChip(onClick = {}, label = { Text("Completada") })
                }
                AssistChip(onClick = {}, label = { Text(dateLabel) })
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

private fun JsonObject.boolean(key: String): Boolean? {
    val value = this[key] ?: return null
    return when (value) {
        is JsonPrimitive -> value.content.toBooleanStrictOrNull()
        else -> null
    }
}

private fun JsonObject.date(key: String): LocalDate? {
    val raw = string(key) ?: return null
    return parseToLocalDate(raw)
}

private fun JsonObject.dateTime(key: String): OffsetDateTime? {
    val raw = string(key) ?: return null
    return parseToOffsetDateTime(raw)
}

private fun parseToLocalDate(value: String): LocalDate? {
    return parseToOffsetDateTime(value)?.toLocalDate()
        ?: runCatching { LocalDate.parse(value) }.getOrNull()
}

private fun parseToOffsetDateTime(value: String): OffsetDateTime? {
    val normalized = normalizeDateTime(value)
    return runCatching { OffsetDateTime.parse(normalized) }.getOrNull()
        ?: runCatching {
            val formatter = DateTimeFormatterBuilder()
                .appendPattern("yyyy-MM-dd HH:mm:ss")
                .optionalStart().appendPattern(".SSS").optionalEnd()
                .optionalStart().appendPattern("XXX").optionalEnd()
                .toFormatter()
            val local = java.time.LocalDateTime.parse(normalized, formatter)
            local.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        }.getOrNull()
        ?: runCatching {
            val formatter = DateTimeFormatterBuilder()
                .appendPattern("dd/MM/yyyy hh:mm")
                .optionalStart().appendPattern(":ss").optionalEnd()
                .appendPattern(" a")
                .toFormatter(Locale.ENGLISH)
            val local = java.time.LocalDateTime.parse(normalized, formatter)
            local.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        }.getOrNull()
}

private fun normalizeDateTime(value: String): String {
    val trimmed = value.trim().trim('"')
    var normalized = if (trimmed.contains(" ") && !trimmed.contains("T")) {
        trimmed.replace(" ", "T")
    } else {
        trimmed
    }
    if (normalized.matches(Regex(".+[+-]\\d{2}$"))) {
        normalized += ":00"
    } else if (normalized.matches(Regex(".+[+-]\\d{4}$"))) {
        normalized = normalized.dropLast(2) + ":" + normalized.takeLast(2)
    }
    if (normalized.contains("a. m.", ignoreCase = true) || normalized.contains("p. m.", ignoreCase = true)) {
        normalized = normalized
            .replace("a. m.", "AM", ignoreCase = true)
            .replace("p. m.", "PM", ignoreCase = true)
            .replace(".", "")
    }
    return normalized
}

private data class TaskSection(val title: String, val items: List<TaskRow>)

private fun groupByDueDate(tasks: List<TaskRow>): List<TaskSection> {
    val today = LocalDate.now(ZoneId.systemDefault())
    val tomorrow = today.plusDays(1)

    val overdue = mutableListOf<TaskRow>()
    val dueToday = mutableListOf<TaskRow>()
    val dueTomorrow = mutableListOf<TaskRow>()
    val future = mutableListOf<TaskRow>()
    val noDate = mutableListOf<TaskRow>()

    tasks.forEach { task ->
        val date = task.startDate
        when {
            date == null -> noDate.add(task)
            date.isBefore(today) -> overdue.add(task)
            date.isEqual(today) -> dueToday.add(task)
            date.isEqual(tomorrow) -> dueTomorrow.add(task)
            else -> future.add(task)
        }
    }

    val byTime = compareBy<TaskRow> { it.startDateTimeLocal == null }
        .thenBy { it.startDateTimeLocal }

    return listOf(
        TaskSection("Atrasadas", overdue.sortedWith(byTime)),
        TaskSection("Hoy", dueToday.sortedWith(byTime)),
        TaskSection("Mañana", dueTomorrow.sortedWith(byTime)),
        TaskSection("Futuras", future.sortedWith(byTime)),
        TaskSection("Sin fecha", noDate)
    )
}

private fun matchesDateFilter(task: TaskRow, filter: DateFilter): Boolean {
    if (filter == DateFilter.ALL) return true
    val today = LocalDate.now(ZoneId.systemDefault())
    val tomorrow = today.plusDays(1)
    val date = task.startDate
    return when (filter) {
        DateFilter.OVERDUE -> date != null && date.isBefore(today)
        DateFilter.TODAY -> date != null && date.isEqual(today)
        DateFilter.TOMORROW -> date != null && date.isEqual(tomorrow)
        DateFilter.FUTURE -> date != null && date.isAfter(tomorrow)
        DateFilter.NO_DATE -> date == null
        DateFilter.ALL -> true
    }
}

private fun DateFilter.toLabel(): String? {
    return when (this) {
        DateFilter.ALL -> null
        DateFilter.OVERDUE -> "Atrasadas"
        DateFilter.TODAY -> "Hoy"
        DateFilter.TOMORROW -> "Mañana"
        DateFilter.FUTURE -> "Futuras"
        DateFilter.NO_DATE -> "Sin fecha"
    }
}

private fun dateFilterFromLabel(label: String?): DateFilter {
    return when (label) {
        "Atrasadas" -> DateFilter.OVERDUE
        "Hoy" -> DateFilter.TODAY
        "Mañana" -> DateFilter.TOMORROW
        "Futuras" -> DateFilter.FUTURE
        "Sin fecha" -> DateFilter.NO_DATE
        else -> DateFilter.ALL
    }
}

@Composable
private fun FilterChip(text: String, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text(text) },
        colors = if (selected) {
            MaterialTheme.colorScheme.run {
                androidx.compose.material3.AssistChipDefaults.assistChipColors(
                    containerColor = primaryContainer,
                    labelColor = onPrimaryContainer
                )
            }
        } else {
            androidx.compose.material3.AssistChipDefaults.assistChipColors()
        }
    )
}

@Composable
private fun FilterRow(
    label: String,
    options: List<String>,
    selected: String?,
    onSelect: (String?) -> Unit
) {
    Column {
        Text(text = label, style = MaterialTheme.typography.labelMedium)
        Spacer(modifier = Modifier.height(6.dp))
        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            FilterChip(
                text = "Todas",
                selected = selected == null,
                onClick = { onSelect(null) }
            )
            options.forEach { option ->
                FilterChip(
                    text = option,
                    selected = selected == option,
                    onClick = { onSelect(option) }
                )
            }
        }
    }
}
