package com.lifetracker.android.data

import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.remove
import androidx.datastore.preferences.core.stringPreferencesKey
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class TokenStorage(private val dataStore: DataStore<Preferences>) {
    private val accessTokenKey = stringPreferencesKey("access_token")
    private val refreshTokenKey = stringPreferencesKey("refresh_token")

    val tokens: Flow<AuthTokens?> = dataStore.data.map { prefs ->
        val access = prefs[accessTokenKey]
        val refresh = prefs[refreshTokenKey]
        if (access != null) AuthTokens(access, refresh) else null
    }

    suspend fun saveTokens(tokens: AuthTokens) {
        dataStore.edit { prefs ->
            prefs[accessTokenKey] = tokens.accessToken
            tokens.refreshToken?.let { prefs[refreshTokenKey] = it }
        }
    }

    suspend fun clearTokens() {
        dataStore.edit { prefs ->
            prefs.remove(accessTokenKey)
            prefs.remove(refreshTokenKey)
        }
    }
}
