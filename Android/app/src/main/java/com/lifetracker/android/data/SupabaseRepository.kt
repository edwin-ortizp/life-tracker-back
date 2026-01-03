package com.lifetracker.android.data

import kotlinx.coroutines.flow.first

class SupabaseRepository(
    private val api: SupabaseApi,
    private val tokenStorage: TokenStorage
) {
    suspend fun login(email: String, password: String) {
        val response = api.login(email, password)
        val tokens = AuthTokens(
            accessToken = response.access_token,
            refreshToken = response.refresh_token
        )
        tokenStorage.saveTokens(tokens)
    }

    suspend fun getTasks(): List<Task> {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        return api.getTasks(tokens.accessToken)
    }

    suspend fun getTaskById(id: String): Task {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        return api.getTaskById(id, tokens.accessToken)
    }

    suspend fun logout() {
        tokenStorage.clearTokens()
    }
}
