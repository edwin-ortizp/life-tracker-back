package com.lifetracker.android.ui.tasks

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.Task
import com.lifetracker.android.data.TaskFilter
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
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
    
    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery
    
    private val _currentFilter = MutableStateFlow(TaskFilter.ALL)
    val currentFilter: StateFlow<TaskFilter> = _currentFilter
    
    // New: Category filter state
    private val _categoryFilter = MutableStateFlow("")
    val categoryFilter: StateFlow<String> = _categoryFilter

    private var searchJob: Job? = null

    init {
        refresh()
    }

    fun onSearchQueryChange(query: String) {
        _searchQuery.value = query
        searchJob?.cancel()
        searchJob = viewModelScope.launch {
            delay(500) // Debounce
            refresh()
        }
    }

    fun setFilter(filter: TaskFilter) {
        _currentFilter.value = filter
        refresh()
    }
    
    // New: Set category filter
    fun setCategoryFilter(category: String) {
        _categoryFilter.value = category
        refresh()
    }

    fun refresh() {
        _state.value = TaskListState.Loading
        viewModelScope.launch {
            val query = _searchQuery.value
            val filter = _currentFilter.value
            val category = _categoryFilter.value.trim()
            
            runCatching { 
                // Logic updated:
                // If query is present, use searchTasks (but pass category filter too)
                // If no query, use getTasks with filters
                
                if (query.isNotBlank()) {
                    repository.searchTasks(query, if (category.isNotEmpty()) category else null)
                } else {
                    repository.getTasks(
                        filter = filter, 
                        category = if (category.isNotEmpty()) category else null
                    ) 
                }
            }
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

sealed interface TaskCreateState {
    data object Idle : TaskCreateState
    data object Loading : TaskCreateState
    data object Success : TaskCreateState
    data class Error(val message: String) : TaskCreateState
}

class TaskCreateViewModel(private val repository: SupabaseRepository) : ViewModel() {
    private val _state = MutableStateFlow<TaskCreateState>(TaskCreateState.Idle)
    val state: StateFlow<TaskCreateState> = _state

    fun createTask(title: String, description: String?, category: String?, startDate: String?, endDate: String?, taskCode: String?) {
        if (title.isBlank()) {
            _state.value = TaskCreateState.Error("El título es obligatorio")
            return
        }
        
        _state.value = TaskCreateState.Loading
        viewModelScope.launch {
            runCatching {
                repository.createTask(
                    title = title,
                    description = description,
                    category = category,
                    startDate = startDate,
                    endDate = endDate,
                    taskCode = taskCode
                )
            }.onSuccess {
                _state.value = TaskCreateState.Success
            }.onFailure { error ->
                _state.value = TaskCreateState.Error(error.message ?: "Error al crear la tarea")
            }
        }
    }
    
    fun resetState() {
        _state.value = TaskCreateState.Idle
    }
}

class TaskCreateViewModelFactory(
    private val repository: SupabaseRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(TaskCreateViewModel::class.java)) {
            return TaskCreateViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
