package com.lifetracker.android.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.Task
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface TaskListState {
    data object Loading : TaskListState
    data class Success(val tasks: List<Task>) : TaskListState
    data class Error(val message: String) : TaskListState
    data object Empty : TaskListState
}

class TaskListViewModel(private val repository: SupabaseRepository) : ViewModel() {
    private val _state = MutableStateFlow<TaskListState>(TaskListState.Loading)
    val state: StateFlow<TaskListState> = _state

    init {
        refresh()
    }

    fun refresh() {
        _state.value = TaskListState.Loading
        viewModelScope.launch {
            runCatching { repository.getTasks() }
                .onSuccess { tasks ->
                    _state.value = if (tasks.isEmpty()) TaskListState.Empty else TaskListState.Success(tasks)
                }
                .onFailure { error ->
                    _state.value = TaskListState.Error(error.message ?: "Error al cargar tareas")
                }
        }
    }
}

class TaskListViewModelFactory(
    private val repository: SupabaseRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TaskListViewModel::class.java)) {
            return TaskListViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}

sealed interface TaskDetailState {
    data object Loading : TaskDetailState
    data class Success(val task: Task) : TaskDetailState
    data class Error(val message: String) : TaskDetailState
}

class TaskDetailViewModel(private val repository: SupabaseRepository) : ViewModel() {
    private val _state = MutableStateFlow<TaskDetailState>(TaskDetailState.Loading)
    val state: StateFlow<TaskDetailState> = _state

    fun loadTask(id: String) {
        _state.value = TaskDetailState.Loading
        viewModelScope.launch {
            runCatching { repository.getTaskById(id) }
                .onSuccess { task ->
                    _state.value = TaskDetailState.Success(task)
                }
                .onFailure { error ->
                    _state.value = TaskDetailState.Error(error.message ?: "Error al cargar la tarea")
                }
        }
    }
}

class TaskDetailViewModelFactory(
    private val repository: SupabaseRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TaskDetailViewModel::class.java)) {
            return TaskDetailViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
