package com.lifetracker.android.data

import com.lifetracker.android.BuildConfig
import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.engine.android.Android
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logger
import io.ktor.client.plugins.logging.Logging
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json
import java.time.LocalDate

class SupabaseApi {

    private val supabaseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
    private val anonKey = BuildConfig.SUPABASE_ANON_KEY

    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            json(
                Json {
                    ignoreUnknownKeys = true
                    isLenient = true
                    coerceInputValues = true
                }
            )
        }
        install(Logging) {
            level = LogLevel.INFO
            logger = object : Logger {
                override fun log(message: String) {
                    // no-op to keep logs clean in release builds
                }
            }
        }
    }

    suspend fun login(email: String, password: String): AuthResponse {
        val response = client.post("$supabaseUrl/auth/v1/token?grant_type=password") {
            header("apikey", anonKey)
            contentType(ContentType.Application.Json)
            setBody(mapOf("email" to email, "password" to password))
        }
        return response.body()
    }

    suspend fun getTasks(accessToken: String, filter: TaskFilter? = null, category: String? = null): List<Task> {
        val response = client.get("$supabaseUrl/rest/v1/tasks") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            header("Prefer", "return=representation")
            url {
                parameters.append("select", "*")
                parameters.append("completed", "is.false") 
                
                // Filters
                when (filter) {
                    TaskFilter.NO_DATE -> parameters.append("start_date", "is.null")
                    TaskFilter.TODAY -> {
                        val today = LocalDate.now().toString()
                        parameters.append("start_date", "eq.$today")
                    }
                    TaskFilter.TOMORROW -> {
                        val tomorrow = LocalDate.now().plusDays(1).toString()
                        parameters.append("start_date", "eq.$tomorrow")
                    }
                    TaskFilter.OVERDUE -> {
                        val today = LocalDate.now().toString()
                        parameters.append("start_date", "lt.$today")
                    }
                    TaskFilter.FUTURE -> {
                        val tomorrow = LocalDate.now().plusDays(1).toString()
                        parameters.append("start_date", "gte.$tomorrow")
                    }
                    else -> {}
                }

                if (!category.isNullOrBlank()) {
                    parameters.append("category", "ilike.%$category%")
                }

                parameters.append("order", "start_date.desc.nullslast")
            }
        }
        return response.body()
    }

    suspend fun searchTasks(accessToken: String, query: String, category: String? = null): List<Task> {
        val response = client.get("$supabaseUrl/rest/v1/tasks") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            header("Prefer", "return=representation")
            url {
                parameters.append("select", "*")
                parameters.append("completed", "is.false")
                parameters.append("or", "(title.ilike.%$query%,description.ilike.%$query%)")
                
                if (!category.isNullOrBlank()) {
                    parameters.append("category", "ilike.%$category%")
                }

                parameters.append("order", "start_date.desc.nullslast")
            }
        }
        return response.body()
    }

    suspend fun createTask(accessToken: String, task: CreateTaskRequest) {
        client.post("$supabaseUrl/rest/v1/tasks") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            contentType(ContentType.Application.Json)
            setBody(task)
        }
    }

    suspend fun getTaskById(id: String, accessToken: String): Task {
        val response = client.get("$supabaseUrl/rest/v1/tasks") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            url {
                parameters.append("select", "*")
                parameters.append("id", "eq.$id")
                parameters.append("limit", "1")
            }
        }
        val tasks: List<Task> = response.body()
        return tasks.firstOrNull() ?: error("Task not found")
    }

    suspend fun getJournalEntries(accessToken: String): List<JournalEntry> {
        val response = client.get("$supabaseUrl/rest/v1/journal_entries") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            url {
                parameters.append("select", "*")
                parameters.append("order", "created_at.desc")
            }
        }
        return response.body()
    }

    suspend fun getGoals(accessToken: String): List<Goal> {
         val response = client.get("$supabaseUrl/rest/v1/goals") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            url {
                parameters.append("select", "*")
            }
        }
        return response.body()
    }

    suspend fun getDrinkLogs(accessToken: String): List<DrinkLog> {
         val response = client.get("$supabaseUrl/rest/v1/drink_logs") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            url {
                parameters.append("select", "*")
                parameters.append("order", "created_at.desc")
            }
        }
        return response.body()
    }
}

enum class TaskFilter {
    ALL, NO_DATE, TODAY, TOMORROW, OVERDUE, FUTURE
}
