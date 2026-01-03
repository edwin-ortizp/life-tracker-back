package com.lifetracker.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.datastore.preferences.core.PreferenceDataStoreFactory
import androidx.datastore.preferences.preferencesDataStoreFile
import androidx.lifecycle.viewmodel.initializer
import androidx.lifecycle.viewmodel.viewModelFactory
import com.lifetracker.android.data.SupabaseApi
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.data.TokenStorage
import com.lifetracker.android.ui.navigation.LifeTrackerApp
import com.lifetracker.android.ui.theme.LifeTrackerTheme

class MainActivity : ComponentActivity() {

    private val dataStore by lazy {
        PreferenceDataStoreFactory.create {
            applicationContext.preferencesDataStoreFile("session")
        }
    }

    private val appViewModel: MainViewModel by viewModels {
        viewModelFactory {
            initializer {
                val tokenStorage = TokenStorage(dataStore)
                val api = SupabaseApi()
                val repository = SupabaseRepository(api, tokenStorage)
                MainViewModel(tokenStorage, repository)
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LifeTrackerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val sessionState by appViewModel.sessionState.collectAsState()
                    LifeTrackerApp(
                        isAuthenticated = sessionState is SessionState.Authenticated,
                        repository = appViewModel.repository
                    )
                }
            }
        }
    }
}
