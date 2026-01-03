package com.lifetracker.android.ui.tasks

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.Task
import kotlinx.coroutines.launch

@Composable
fun TaskListScreen(
    viewModel: TaskListViewModel,
    snackbarHostState: SnackbarHostState,
    onTaskClick: (String) -> Unit,
    onLogout: () -> Unit,
    repository: SupabaseRepository
) {
    val state by viewModel.state.collectAsState()
    val coroutineScope = rememberCoroutineScope()

    LaunchedEffect(state) {
        if (state is TaskListState.Error) {
            snackbarHostState.showSnackbar((state as TaskListState.Error).message)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Tareas") },
                actions = {
                    IconButton(onClick = { viewModel.refresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Actualizar")
                    }
                    IconButton(onClick = {
                        coroutineScope.launch {
                            repository.logout()
                            onLogout()
                        }
                    }) {
                        Icon(Icons.Default.ExitToApp, contentDescription = "Salir")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (state) {
                TaskListState.Loading -> LoadingState()
                TaskListState.Empty -> EmptyState()
                is TaskListState.Error -> ErrorState()
                is TaskListState.Success -> TaskList(
                    tasks = (state as TaskListState.Success).tasks,
                    onTaskClick = onTaskClick
                )
            }
        }
    }
}

@Composable
private fun LoadingState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        CircularProgressIndicator()
    }
}

@Composable
private fun EmptyState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("No hay tareas disponibles")
    }
}

@Composable
private fun ErrorState() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Hubo un problema al cargar las tareas")
    }
}

@Composable
private fun TaskList(tasks: List<Task>, onTaskClick: (String) -> Unit) {
    LazyColumn(modifier = Modifier.fillMaxSize()) {
        items(tasks) { task ->
            TaskRow(task, onTaskClick)
        }
    }
}

@Composable
private fun TaskRow(task: Task, onTaskClick: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onTaskClick(task.id) }
            .padding(16.dp)
    ) {
        Text(task.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        task.date?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
        task.status?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
    }
}

@Composable
fun TaskDetailScreen(taskId: String, viewModel: TaskDetailViewModel) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(taskId) {
        viewModel.loadTask(taskId)
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Detalle") }) }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (state) {
                TaskDetailState.Loading -> LoadingState()
                is TaskDetailState.Error -> ErrorState()
                is TaskDetailState.Success -> TaskDetailContent((state as TaskDetailState.Success).task)
            }
        }
    }
}

@Composable
private fun TaskDetailContent(task: Task) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(text = task.title, style = MaterialTheme.typography.headlineSmall)
        task.date?.let { Text("Fecha: $it") }
        task.status?.let { Text("Estado: $it") }
        task.description?.let { Text(it) }
    }
}
