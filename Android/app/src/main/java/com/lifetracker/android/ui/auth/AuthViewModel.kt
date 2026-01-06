package com.lifetracker.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.lifetracker.android.data.SupabaseRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface AuthUiState {
    data object Idle : AuthUiState
    data object Loading : AuthUiState
    data object Success : AuthUiState
    data class Error(val message: String) : AuthUiState
}

class AuthViewModel(private val repository: SupabaseRepository) : ViewModel() {
    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState

    fun login(email: String, password: String) {
        _uiState.value = AuthUiState.Loading
        viewModelScope.launch {
            runCatching {
                repository.login(email, password)
            }.onSuccess {
                _uiState.value = AuthUiState.Success
            }.onFailure { error ->
                _uiState.value = AuthUiState.Error(error.message ?: "Error al iniciar sesión")
            }
        }
    }

    fun resetState() {
        _uiState.value = AuthUiState.Idle
    }
}

class AuthViewModelFactory(
    private val repository: SupabaseRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(AuthViewModel::class.java)) {
            return AuthViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
