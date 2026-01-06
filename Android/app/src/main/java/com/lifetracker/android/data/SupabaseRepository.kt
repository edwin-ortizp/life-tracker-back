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

    suspend fun getTasks(filter: TaskFilter? = null, category: String? = null): List<Task> {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        return api.getTasks(tokens.accessToken, filter, category)
    }

    suspend fun searchTasks(query: String, category: String? = null): List<Task> {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        return api.searchTasks(tokens.accessToken, query, category)
    }

    suspend fun createTask(title: String, description: String?, category: String?, startDate: String?, endDate: String?, taskCode: String?) {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        
        val request = CreateTaskRequest(
            title = title,
            description = description,
            category = category,
            startDate = startDate,
            endDate = endDate,
            taskCode = taskCode
        )
        api.createTask(tokens.accessToken, request)
    }

    suspend fun getTaskById(id: String): Task {
        val tokens = tokenStorage.tokens.first()
            ?: error("No session available")
        return api.getTaskById(id, tokens.accessToken)
    }

    suspend fun getJournalEntries(): List<JournalEntry> {
        val tokens = tokenStorage.tokens.first() ?: error("No session")
        return api.getJournalEntries(tokens.accessToken)
    }

    suspend fun getGoals(): List<Goal> {
        val tokens = tokenStorage.tokens.first() ?: error("No session")
        return api.getGoals(tokens.accessToken)
    }

    suspend fun getDrinkLogs(): List<DrinkLog> {
        val tokens = tokenStorage.tokens.first() ?: error("No session")
        return api.getDrinkLogs(tokens.accessToken)
    }

    suspend fun logout() {
        tokenStorage.clearTokens()
    }
}
