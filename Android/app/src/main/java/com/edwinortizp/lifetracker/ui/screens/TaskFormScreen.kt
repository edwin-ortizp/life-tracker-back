package com.edwinortizp.lifetracker.ui.screens

import android.widget.Toast
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
import androidx.compose.material3.Button
import androidx.compose.material3.DatePicker
import androidx.compose.material3.DatePickerDialog
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDatePickerState
import androidx.compose.material3.IconButton
import androidx.compose.material3.Icon
import androidx.compose.material3.AssistChip
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.edwinortizp.lifetracker.data.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.from
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.coroutines.launch
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.time.LocalTime
import java.time.OffsetDateTime
import java.time.ZoneId
import java.time.ZoneOffset
import java.time.ZonedDateTime
import java.time.format.DateTimeParseException
import java.time.format.DateTimeFormatterBuilder
import java.util.Locale


@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskFormScreen(
    taskId: String?,
    onSaved: () -> Unit,
    onCancel: () -> Unit
) {
    val context = LocalContext.current
    var isLoading by remember { mutableStateOf(false) }
    var initial by remember { mutableStateOf<JsonObject?>(null) }

    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var priority by remember { mutableStateOf("") }
    var size by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf("") }
    var startTime by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }
    var endTime by remember { mutableStateOf("") }
    var completed by remember { mutableStateOf(false) }
    var isPrivate by remember { mutableStateOf(false) }
    val scope = rememberCoroutineScope()
    var showStartPicker by remember { mutableStateOf(false) }
    var showEndPicker by remember { mutableStateOf(false) }
    var showStartTimePicker by remember { mutableStateOf(false) }
    var showEndTimePicker by remember { mutableStateOf(false) }
    var durationMinutes by remember { mutableStateOf<Long?>(null) }
    var isAutoUpdatingEnd by remember { mutableStateOf(false) }

    LaunchedEffect(taskId) {
        if (taskId.isNullOrBlank()) return@LaunchedEffect
        val task = runCatching {
            val client = SupabaseClient.requireClient()
            val rows = client.from("tasks").select().decodeList<JsonObject>()
            rows.firstOrNull { it.string("id") == taskId }
                ?: rows.firstOrNull { it.string("task_code") == taskId }
        }.getOrNull()
        initial = task
        if (task != null) {
            val startDateTime = parseToOffsetDateTime(task.string("start_date").orEmpty())
            val endDateTime = parseToOffsetDateTime(task.string("end_date").orEmpty())
            val startLocal = startDateTime?.atZoneSameInstant(ZoneId.systemDefault())
            val endLocal = endDateTime?.atZoneSameInstant(ZoneId.systemDefault())
            title = task.string("title") ?: ""
            description = task.string("description") ?: ""
            category = task.string("category") ?: ""
            priority = task.string("priority") ?: ""
            size = task.string("size") ?: ""
            startDate = startLocal?.toLocalDate()?.toString()
                ?: parseToLocalDate(task.string("start_date").orEmpty())?.toString().orEmpty()
            startTime = startLocal?.toLocalTime()?.let { formatTime(it) }.orEmpty()
            endDate = endLocal?.toLocalDate()?.toString()
                ?: parseToLocalDate(task.string("end_date").orEmpty())?.toString().orEmpty()
            endTime = endLocal?.toLocalTime()?.let { formatTime(it) }.orEmpty()
            completed = task.boolean("completed") ?: false
            isPrivate = task.boolean("is_private") ?: false
            durationMinutes = calculateDurationMinutes(startDate, startTime, endDate, endTime)
        }
    }

    LaunchedEffect(startDate, startTime) {
        val duration = durationMinutes ?: return@LaunchedEffect
        val start = buildLocalDateTime(startDate, startTime) ?: return@LaunchedEffect
        isAutoUpdatingEnd = true
        val newEnd = start.plusMinutes(duration)
        endDate = newEnd.toLocalDate().toString()
        endTime = formatTime(newEnd.toLocalTime())
        isAutoUpdatingEnd = false
    }

    LaunchedEffect(endDate, endTime) {
        if (isAutoUpdatingEnd) return@LaunchedEffect
        durationMinutes = calculateDurationMinutes(startDate, startTime, endDate, endTime)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (taskId == null) "Nueva tarea" else "Editar tarea") },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            item {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Título") }
                )
            }
            item {
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Descripción") },
                    minLines = 3
                )
            }
            item {
                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Categoría") }
                )
            }
            item {
                OutlinedTextField(
                    value = priority,
                    onValueChange = { priority = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Prioridad (texto)") }
                )
            }
            item {
                OutlinedTextField(
                    value = size,
                    onValueChange = { size = it },
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Tamaño (texto)") }
                )
            }
            item {
                Column {
                    Text(text = "Inicio", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(onClick = { showStartPicker = true }) {
                            Text(if (startDate.isBlank()) "Elegir fecha" else startDate)
                        }
                        TextButton(onClick = { startDate = "" }) {
                            Text("Limpiar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(onClick = { showStartTimePicker = true }) {
                            Text(if (startTime.isBlank()) "Elegir hora" else startTime)
                        }
                        TextButton(onClick = { startTime = "" }) {
                            Text("Limpiar")
                        }
                    }
                }
            }
            item {
                Column {
                    Text(text = "Fin", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(onClick = { showEndPicker = true }) {
                            Text(if (endDate.isBlank()) "Elegir fecha" else endDate)
                        }
                        TextButton(onClick = { endDate = "" }) {
                            Text("Limpiar")
                        }
                    }
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(onClick = { showEndTimePicker = true }) {
                            Text(if (endTime.isBlank()) "Elegir hora" else endTime)
                        }
                        TextButton(onClick = { endTime = "" }) {
                            Text("Limpiar")
                        }
                    }
                }
            }
            item {
                Column {
                    Text(text = "Duración", style = MaterialTheme.typography.labelMedium)
                    Spacer(modifier = Modifier.height(6.dp))
                    val currentDuration = durationMinutes
                    Text(
                        text = currentDuration?.let { "${it} min" } ?: "Sin duración",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        DurationChip(
                            minutes = 30,
                            selected = currentDuration == 30L,
                            onClick = {
                                durationMinutes = 30
                                applyDurationToEnd(startDate, startTime, 30)?.let { end ->
                                    endDate = end.toLocalDate().toString()
                                    endTime = formatTime(end.toLocalTime())
                                }
                            }
                        )
                        DurationChip(
                            minutes = 60,
                            selected = currentDuration == 60L,
                            onClick = {
                                durationMinutes = 60
                                applyDurationToEnd(startDate, startTime, 60)?.let { end ->
                                    endDate = end.toLocalDate().toString()
                                    endTime = formatTime(end.toLocalTime())
                                }
                            }
                        )
                        DurationChip(
                            minutes = 120,
                            selected = currentDuration == 120L,
                            onClick = {
                                durationMinutes = 120
                                applyDurationToEnd(startDate, startTime, 120)?.let { end ->
                                    endDate = end.toLocalDate().toString()
                                    endTime = formatTime(end.toLocalTime())
                                }
                            }
                        )
                    }
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Completada", style = MaterialTheme.typography.bodyLarge)
                    Switch(checked = completed, onCheckedChange = { completed = it })
                }
            }
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(text = "Privada", style = MaterialTheme.typography.bodyLarge)
                    Switch(checked = isPrivate, onCheckedChange = { isPrivate = it })
                }
            }
            item {
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = onCancel,
                        modifier = Modifier.weight(1f),
                        enabled = !isLoading
                    ) {
                        Text("Cancelar")
                    }
                    Button(
                        onClick = {
                            if (title.isBlank()) {
                                Toast.makeText(context, "Título requerido", Toast.LENGTH_LONG).show()
                                return@Button
                            }
                            scope.launch {
                                isLoading = true
                                val userId = clientUserId()
                                if (userId == null) {
                                    Toast.makeText(context, "Sesión no disponible.", Toast.LENGTH_LONG).show()
                                    isLoading = false
                                    return@launch
                                }
                                val payload = buildJsonObject {
                                    put("title", JsonPrimitive(title))
                                    if (description.isNotBlank()) put("description", JsonPrimitive(description))
                                    if (category.isNotBlank()) put("category", JsonPrimitive(category))
                                    if (priority.isNotBlank()) put("priority", JsonPrimitive(priority))
                                    if (size.isNotBlank()) put("size", JsonPrimitive(size))
                                    if (startDate.isNotBlank()) {
                                        put("start_date", JsonPrimitive(toTimestampTz(startDate, startTime)))
                                    }
                                    if (endDate.isNotBlank()) {
                                        put("end_date", JsonPrimitive(toTimestampTz(endDate, endTime)))
                                    }
                                    put("completed", JsonPrimitive(completed))
                                    put("is_private", JsonPrimitive(isPrivate))
                                    put("user_id", JsonPrimitive(userId))
                                    val id = initial?.string("id")
                                    val taskCode = initial?.string("task_code")
                                    if (!id.isNullOrBlank()) put("id", JsonPrimitive(id))
                                    if (!taskCode.isNullOrBlank()) put("task_code", JsonPrimitive(taskCode))
                                }
                                val client = SupabaseClient.requireClient()
                                runCatching {
                                    client.from("tasks").upsert(payload)
                                }.onSuccess {
                                    Toast.makeText(context, "Guardado", Toast.LENGTH_LONG).show()
                                    onSaved()
                                }.onFailure { e ->
                                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_LONG).show()
                                }
                                isLoading = false
                            }
                        },
                        modifier = Modifier.weight(1f),
                        enabled = !isLoading
                    ) {
                        Text("Guardar")
                    }
                }
            }
        }
    }

    if (showStartPicker) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = dateToMillis(startDate)
        )
        DatePickerDialog(
            onDismissRequest = { showStartPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    startDate = millisToDateString(state.selectedDateMillis)
                    showStartPicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showStartPicker = false }) { Text("Cancelar") }
            }
        ) {
            DatePicker(state = state)
        }
    }

    if (showEndPicker) {
        val state = rememberDatePickerState(
            initialSelectedDateMillis = dateToMillis(endDate)
        )
        DatePickerDialog(
            onDismissRequest = { showEndPicker = false },
            confirmButton = {
                TextButton(onClick = {
                    endDate = millisToDateString(state.selectedDateMillis)
                    showEndPicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showEndPicker = false }) { Text("Cancelar") }
            }
        ) {
            DatePicker(state = state)
        }
    }

    if (showStartTimePicker) {
        val state = androidx.compose.material3.rememberTimePickerState(
            initialHour = parseHour(startTime),
            initialMinute = parseMinute(startTime),
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showStartTimePicker = false },
            title = { Text("Hora inicio") },
            confirmButton = {
                TextButton(onClick = {
                    startTime = formatTime(state.hour, state.minute)
                    showStartTimePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showStartTimePicker = false }) { Text("Cancelar") }
            },
            text = { androidx.compose.material3.TimePicker(state = state) }
        )
    }

    if (showEndTimePicker) {
        val state = androidx.compose.material3.rememberTimePickerState(
            initialHour = parseHour(endTime),
            initialMinute = parseMinute(endTime),
            is24Hour = true
        )
        AlertDialog(
            onDismissRequest = { showEndTimePicker = false },
            title = { Text("Hora fin") },
            confirmButton = {
                TextButton(onClick = {
                    endTime = formatTime(state.hour, state.minute)
                    showEndTimePicker = false
                }) { Text("OK") }
            },
            dismissButton = {
                TextButton(onClick = { showEndTimePicker = false }) { Text("Cancelar") }
            },
            text = { androidx.compose.material3.TimePicker(state = state) }
        )
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

private fun dateToMillis(value: String): Long? {
    val date = parseToLocalDate(value) ?: return null
    return date.atStartOfDay().toInstant(ZoneOffset.UTC).toEpochMilli()
}

private fun millisToDateString(millis: Long?): String {
    if (millis == null) return ""
    val date = Instant.ofEpochMilli(millis).atOffset(ZoneOffset.UTC).toLocalDate()
    return date.toString()
}

private fun parseToLocalDate(value: String): LocalDate? {
    if (value.isBlank()) return null
    return parseToOffsetDateTime(value)?.toLocalDate()
        ?: runCatching { LocalDate.parse(value) }.getOrNull()
}

private fun toTimestampTz(dateValue: String, timeValue: String): String {
    if (dateValue.contains("T")) return dateValue
    val date = parseToLocalDate(dateValue) ?: return dateValue
    val time = parseToLocalTime(timeValue) ?: LocalTime.MIDNIGHT
    val zone = ZoneId.systemDefault()
    val zoned = ZonedDateTime.of(LocalDateTime.of(date, time), zone)
    return zoned.toOffsetDateTime().toString()
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
            val local = LocalDateTime.parse(normalized, formatter)
            local.atZone(ZoneId.systemDefault()).toOffsetDateTime()
        }.getOrNull()
        ?: runCatching {
            val formatter = DateTimeFormatterBuilder()
                .appendPattern("dd/MM/yyyy hh:mm")
                .optionalStart().appendPattern(":ss").optionalEnd()
                .appendPattern(" a")
                .toFormatter(Locale.ENGLISH)
            val local = LocalDateTime.parse(normalized, formatter)
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

private fun parseToLocalTime(value: String): LocalTime? {
    if (value.isBlank()) return null
    return runCatching { LocalTime.parse(value) }.getOrNull()
        ?: runCatching { LocalTime.parse(value, java.time.format.DateTimeFormatter.ofPattern("HH:mm")) }.getOrNull()
}

private fun parseHour(value: String): Int {
    return parseToLocalTime(value)?.hour ?: 0
}

private fun parseMinute(value: String): Int {
    return parseToLocalTime(value)?.minute ?: 0
}

private fun formatTime(hour: Int, minute: Int): String {
    val h = hour.toString().padStart(2, '0')
    val m = minute.toString().padStart(2, '0')
    return "$h:$m"
}

private fun formatTime(time: LocalTime): String {
    return formatTime(time.hour, time.minute)
}

private suspend fun clientUserId(): String? {
    return runCatching {
        SupabaseClient.requireClient().auth.currentSessionOrNull()?.user?.id
    }.getOrNull()
}

private fun buildLocalDateTime(dateValue: String, timeValue: String): LocalDateTime? {
    val date = parseToLocalDate(dateValue) ?: return null
    val time = parseToLocalTime(timeValue) ?: LocalTime.MIDNIGHT
    return LocalDateTime.of(date, time)
}

private fun calculateDurationMinutes(
    startDate: String,
    startTime: String,
    endDate: String,
    endTime: String
): Long? {
    val start = buildLocalDateTime(startDate, startTime) ?: return null
    val end = buildLocalDateTime(endDate, endTime) ?: return null
    val minutes = java.time.Duration.between(start, end).toMinutes()
    return if (minutes > 0) minutes else null
}

private fun applyDurationToEnd(
    startDate: String,
    startTime: String,
    minutes: Long
): LocalDateTime? {
    val start = buildLocalDateTime(startDate, startTime) ?: return null
    return start.plusMinutes(minutes)
}

@Composable
private fun DurationChip(minutes: Int, selected: Boolean, onClick: () -> Unit) {
    AssistChip(
        onClick = onClick,
        label = { Text("${minutes}m") },
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
