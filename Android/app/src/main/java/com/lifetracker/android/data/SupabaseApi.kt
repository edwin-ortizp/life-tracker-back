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

class SupabaseApi {

    private val supabaseUrl = BuildConfig.SUPABASE_URL.trimEnd('/')
    private val anonKey = BuildConfig.SUPABASE_ANON_KEY

    private val client = HttpClient(Android) {
        install(ContentNegotiation) {
            io.ktor.serialization.kotlinx.json.json(
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

    suspend fun getTasks(accessToken: String): List<Task> {
        val response = client.get("$supabaseUrl/rest/v1/tasks") {
            header("apikey", anonKey)
            header(HttpHeaders.Authorization, "Bearer $accessToken")
            header("Prefer", "return=representation")
            url {
                parameters.append("select", "*")
                parameters.append("order", "date.desc")
            }
        }
        return response.body()
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
}
