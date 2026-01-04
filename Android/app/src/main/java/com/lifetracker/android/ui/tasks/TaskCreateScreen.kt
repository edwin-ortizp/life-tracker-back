package com.lifetracker.android.ui.tasks

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TaskCreateScreen(
    viewModel: TaskCreateViewModel,
    onNavigateBack: () -> Unit,
    snackbarHostState: SnackbarHostState
) {
    val state by viewModel.state.collectAsState()
    
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var taskCode by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }

    LaunchedEffect(state) {
        if (state is TaskCreateState.Success) {
            onNavigateBack()
            viewModel.resetState()
        } else if (state is TaskCreateState.Error) {
            snackbarHostState.showSnackbar((state as TaskCreateState.Error).message)
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Nueva Tarea") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        },
        snackbarHost = { SnackbarHost(hostState = snackbarHostState) }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título *") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descripción") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                
                OutlinedTextField(
                    value = taskCode,
                    onValueChange = { taskCode = it },
                    label = { Text("Código de tarea") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )

                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Categoría") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true
                )
                
                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Fecha Inicio (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("Fecha Fin (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth(),
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number)
                )

                Button(
                    onClick = {
                        viewModel.createTask(
                            title = title,
                            description = description.ifBlank { null },
                            category = category.ifBlank { null },
                            startDate = startDate.ifBlank { null },
                            endDate = endDate.ifBlank { null },
                            taskCode = taskCode.ifBlank { null }
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    enabled = state !is TaskCreateState.Loading
                ) {
                    if (state is TaskCreateState.Loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.padding(end = 8.dp),
                            color = androidx.compose.ui.graphics.Color.White,
                            strokeWidth = 2.dp
                        )
                        Text("Creando...")
                    } else {
                        Text("Crear Tarea")
                    }
                }
            }
        }
    }
}
