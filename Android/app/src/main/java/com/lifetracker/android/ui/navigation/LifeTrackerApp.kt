package com.lifetracker.android.ui.navigation

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.lifetracker.android.data.SupabaseRepository
import com.lifetracker.android.ui.auth.AuthScreen
import com.lifetracker.android.ui.auth.AuthViewModel
import com.lifetracker.android.ui.auth.AuthViewModelFactory
import com.lifetracker.android.ui.tasks.TaskDetailScreen
import com.lifetracker.android.ui.tasks.TaskDetailViewModel
import com.lifetracker.android.ui.tasks.TaskDetailViewModelFactory
import com.lifetracker.android.ui.tasks.TaskListScreen
import com.lifetracker.android.ui.tasks.TaskListViewModel
import com.lifetracker.android.ui.tasks.TaskListViewModelFactory

sealed class Screen(val route: String) {
    data object Login : Screen("login")
    data object Tasks : Screen("tasks")
    data object TaskDetail : Screen("task/{taskId}") {
        fun createRoute(id: String) = "task/$id"
    }
}

@Composable
fun LifeTrackerApp(
    isAuthenticated: Boolean,
    repository: SupabaseRepository
) {
    val navController = rememberNavController()
    val snackbarHostState = remember { SnackbarHostState() }

    NavHost(
        navController = navController,
        startDestination = if (isAuthenticated) Screen.Tasks.route else Screen.Login.route
    ) {
        composable(Screen.Login.route) {
            val viewModel: AuthViewModel = viewModel(factory = AuthViewModelFactory(repository))
            AuthScreen(
                viewModel = viewModel,
                onSuccess = {
                    navController.navigate(Screen.Tasks.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                snackbarHostState = snackbarHostState
            )
        }

        composable(Screen.Tasks.route) {
            val viewModel: TaskListViewModel = viewModel(factory = TaskListViewModelFactory(repository))
            TaskListScreen(
                viewModel = viewModel,
                snackbarHostState = snackbarHostState,
                onTaskClick = { id -> navController.navigate(Screen.TaskDetail.createRoute(id)) },
                onLogout = {
                    navController.navigate(Screen.Login.route) {
                        popUpTo(Screen.Tasks.route) { inclusive = true }
                    }
                },
                repository = repository
            )
        }

        composable(
            route = Screen.TaskDetail.route,
            arguments = listOf(navArgument("taskId") { type = NavType.StringType })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId")
            if (taskId == null) {
                Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Tarea no encontrada")
                }
            } else {
                val viewModel: TaskDetailViewModel = viewModel(factory = TaskDetailViewModelFactory(repository))
                TaskDetailScreen(taskId = taskId, viewModel = viewModel)
            }
        }
    }
}
