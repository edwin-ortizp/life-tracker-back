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
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.ExitToApp
import androidx.compose.material.icons.filled.FilterList
import androidx.compose.material.icons.filled.Menu
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.DrawerValue
import androidx.compose.material3.DropdownMenu
import androidx.compose.material3.DropdownMenuItem
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.FloatingActionButton
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalDrawerSheet
import androidx.compose.material3.ModalNavigationDrawer
import androidx.compose.material3.NavigationDrawerItem
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.rememberDrawerState
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.Task
import com.lifetracker.android.data.TaskFilter
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskListScreen(
    viewModel: TaskListViewModel,
    snackbarHostState: SnackbarHostState,
    onTaskClick: (String) -> Unit,
    onNavigateToCreate: () -> Unit,
    onLogout: () -> Unit,
    repository: SupabaseRepository
) {
    val state by viewModel.state.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val currentFilter by viewModel.currentFilter.collectAsState()
    val categoryFilter by viewModel.categoryFilter.collectAsState()
    val coroutineScope = rememberCoroutineScope()
    val drawerState = rememberDrawerState(initialValue = DrawerValue.Closed)
    var showFilterMenu by remember { mutableStateOf(false) }
    var showCategoryDialog by remember { mutableStateOf(false) }

    LaunchedEffect(state) {
        if (state is TaskListState.Error) {
            snackbarHostState.showSnackbar((state as TaskListState.Error).message)
        }
    }
    
    // Category Filter Dialog
    if (showCategoryDialog) {
        var categoryInput by remember { mutableStateOf(categoryFilter) }
        AlertDialog(
            onDismissRequest = { showCategoryDialog = false },
            title = { Text("Filtrar por Categoría") },
            text = {
                OutlinedTextField(
                    value = categoryInput,
                    onValueChange = { categoryInput = it },
                    label = { Text("Nombre de la categoría") },
                    singleLine = true
                )
            },
            confirmButton = {
                Button(onClick = {
                    viewModel.setCategoryFilter(categoryInput)
                    showCategoryDialog = false
                }) {
                    Text("Aplicar")
                }
            },
            dismissButton = {
                TextButton(onClick = { 
                    viewModel.setCategoryFilter("") // Clear filter
                    showCategoryDialog = false 
                }) {
                    Text("Borrar Filtro")
                }
            }
        )
    }

    ModalNavigationDrawer(
        drawerState = drawerState,
        drawerContent = {
            ModalDrawerSheet {
                Text("Life Tracker", modifier = Modifier.padding(16.dp), style = MaterialTheme.typography.titleLarge)
                NavigationDrawerItem(
                    label = { Text("Tareas") },
                    selected = true,
                    onClick = { coroutineScope.launch { drawerState.close() } }
                )
                NavigationDrawerItem(
                    label = { Text("Diario (Journal)") },
                    selected = false,
                    onClick = { coroutineScope.launch { drawerState.close() } /* TODO: Navigate to Journal */ }
                )
                NavigationDrawerItem(
                    label = { Text("Metas (Goals)") },
                    selected = false,
                    onClick = { coroutineScope.launch { drawerState.close() } /* TODO: Navigate to Goals */ }
                )
                NavigationDrawerItem(
                    label = { Text("Bebidas (Drink Logs)") },
                    selected = false,
                    onClick = { coroutineScope.launch { drawerState.close() } /* TODO: Navigate to Drink Logs */ }
                )

                NavigationDrawerItem(
                    label = { Text("Cerrar Sesión") },
                    selected = false,
                    onClick = {
                        coroutineScope.launch {
                            drawerState.close()
                            repository.logout()
                            onLogout()
                        }
                    }
                )
            }
        }
    ) {
        Scaffold(
            topBar = {
                Column {
                    TopAppBar(
                        title = { Text("Tareas") },
                        navigationIcon = {
                            IconButton(onClick = { coroutineScope.launch { drawerState.open() } }) {
                                Icon(Icons.Default.Menu, contentDescription = "Menú")
                            }
                        },
                        actions = {
                            // Filter Button
                            Box {
                                IconButton(onClick = { showFilterMenu = true }) {
                                    Icon(Icons.Default.FilterList, contentDescription = "Filtrar")
                                }
                                DropdownMenu(
                                    expanded = showFilterMenu,
                                    onDismissRequest = { showFilterMenu = false }
                                ) {
                                    DropdownMenuItem(
                                        text = { Text("Todas") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.ALL)
                                            showFilterMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Hoy") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.TODAY)
                                            showFilterMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Mañana") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.TOMORROW)
                                            showFilterMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Vencidas") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.OVERDUE)
                                            showFilterMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Futuras (Desde mañana)") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.FUTURE)
                                            showFilterMenu = false
                                        }
                                    )
                                    DropdownMenuItem(
                                        text = { Text("Sin fecha") },
                                        onClick = {
                                            viewModel.setFilter(TaskFilter.NO_DATE)
                                            showFilterMenu = false
                                        }
                                    )
                                    // Category Filter Option
                                    DropdownMenuItem(
                                        text = { Text("Por Categoría...") },
                                        onClick = {
                                            showCategoryDialog = true
                                            showFilterMenu = false
                                        }
                                    )
                                }
                            }
                            IconButton(onClick = { viewModel.refresh() }) {
                                Icon(Icons.Default.Refresh, contentDescription = "Actualizar")
                            }
                        }
                    )
                    // Search Bar
                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { viewModel.onSearchQueryChange(it) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(horizontal = 16.dp, vertical = 8.dp),
                        placeholder = { Text("Buscar por título o descripción...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                        singleLine = true
                    )
                    // Show active filters
                    if (currentFilter != TaskFilter.ALL || categoryFilter.isNotEmpty()) {
                        Text(
                            text = buildString {
                                append("Filtros: ")
                                if (currentFilter != TaskFilter.ALL) append(currentFilter.name + " ")
                                if (categoryFilter.isNotEmpty()) append("Cat: $categoryFilter")
                            },
                            style = MaterialTheme.typography.bodySmall,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 4.dp)
                        )
                    }
                }
            },
            floatingActionButton = {
                FloatingActionButton(onClick = onNavigateToCreate) {
                    Icon(Icons.Default.Add, contentDescription = "Agregar Tarea")
                }
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
        task.startDate?.let { Text("Inicio: $it", style = MaterialTheme.typography.bodySmall) }
        task.category?.let { Text("Categoría: $it", style = MaterialTheme.typography.bodySmall) }
        task.status?.let { Text("Estado: $it", style = MaterialTheme.typography.bodySmall) }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
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
        
        task.taskCode?.let { Text("Código: $it", style = MaterialTheme.typography.labelMedium) }
        task.category?.let { Text("Categoría: $it", style = MaterialTheme.typography.bodyMedium) }
        
        task.description?.let { 
            Text("Descripción:", style = MaterialTheme.typography.titleSmall)
            Text(it, style = MaterialTheme.typography.bodyMedium) 
        }

        task.startDate?.let { Text("Fecha Inicio: $it") }
        task.endDate?.let { Text("Fecha Fin: $it") }
        
        task.status?.let { Text("Estado: $it") }
        task.progress?.let { Text("Progreso: $it%") }
    }
}
