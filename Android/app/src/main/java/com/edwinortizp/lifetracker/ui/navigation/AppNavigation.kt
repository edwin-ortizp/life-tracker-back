package com.edwinortizp.lifetracker.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.compose.rememberNavController
import com.edwinortizp.lifetracker.ui.screens.LoginScreen
import com.edwinortizp.lifetracker.ui.screens.RegisterScreen
import com.edwinortizp.lifetracker.ui.screens.DashboardScreen
import com.edwinortizp.lifetracker.ui.screens.TaskFormScreen
import com.edwinortizp.lifetracker.ui.screens.TaskListScreen
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

@Composable
fun AppNavigation() {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = "login") {
        composable("login") {
            LoginScreen(
                onNavigateToRegister = { navController.navigate("register") },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("login") { inclusive = true }
                    }
                }
            )
        }
        composable("register") {
            RegisterScreen(
                onNavigateToLogin = { navController.popBackStack() },
                onNavigateToDashboard = {
                    navController.navigate("dashboard") {
                        popUpTo("register") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard") {
            DashboardScreen(
                onOpenTasks = { navController.navigate("tasks") },
                onLogout = {
                    navController.navigate("login") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        composable("tasks") {
            TaskListScreen(
                onTaskSelected = { encodedTask ->
                    val safe = URLEncoder.encode(encodedTask, StandardCharsets.UTF_8.toString())
                    navController.navigate("task/edit/$safe")
                },
                onCreateTask = { navController.navigate("task/new") },
                onBack = { navController.popBackStack() }
            )
        }
        composable(
            "task/edit/{taskId}",
            arguments = listOf(navArgument("taskId") {
                type = NavType.StringType
                nullable = false
            })
        ) { backStackEntry ->
            val taskId = backStackEntry.arguments?.getString("taskId").orEmpty()
            TaskFormScreen(
                taskId = taskId,
                onSaved = { navController.popBackStack() },
                onCancel = { navController.popBackStack() }
            )
        }
        composable("task/new") {
            TaskFormScreen(
                taskId = null,
                onSaved = { navController.popBackStack() },
                onCancel = { navController.popBackStack() }
            )
        }
    }
}
