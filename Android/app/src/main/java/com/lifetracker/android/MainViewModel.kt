package com.lifetracker.android

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.TokenStorage
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

sealed interface SessionState {
    data object Loading : SessionState
    data object Authenticated : SessionState
    data object Unauthenticated : SessionState
}

class MainViewModel(
    val tokenStorage: TokenStorage,
    val repository: SupabaseRepository
) : ViewModel() {

    private val _sessionState = MutableStateFlow<SessionState>(SessionState.Loading)
    val sessionState: StateFlow<SessionState> = _sessionState

    init {
        viewModelScope.launch {
            tokenStorage.tokens.collect { tokens ->
                _sessionState.value = if (tokens?.accessToken?.isNotBlank() == true) {
                    SessionState.Authenticated
                } else {
                    SessionState.Unauthenticated
                }
            }
        }
    }
}
