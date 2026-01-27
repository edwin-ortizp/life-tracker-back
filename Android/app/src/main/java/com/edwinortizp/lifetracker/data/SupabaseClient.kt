package com.edwinortizp.lifetracker.data

import com.edwinortizp.lifetracker.BuildConfig
import io.github.jan.supabase.SupabaseClient as SupabaseClientType
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    private val configError: String? by lazy {
        when {
            BuildConfig.SUPABASE_URL.isBlank() || BuildConfig.SUPABASE_ANON_KEY.isBlank() ->
                "Faltan SUPABASE_URL/SUPABASE_ANON_KEY en local.properties."
            !BuildConfig.SUPABASE_URL.startsWith("http") ->
                "SUPABASE_URL inválida. Debe iniciar con http/https."
            else -> null
        }
    }

    private val clientOrNull: SupabaseClientType? by lazy {
        if (configError != null) return@lazy null
        createSupabaseClient(
            supabaseUrl = BuildConfig.SUPABASE_URL,
            supabaseKey = BuildConfig.SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(Postgrest)
        }
    }

    fun requireClient(): SupabaseClientType {
        return clientOrNull ?: throw IllegalStateException(configError ?: "Supabase no configurado.")
    }
}
