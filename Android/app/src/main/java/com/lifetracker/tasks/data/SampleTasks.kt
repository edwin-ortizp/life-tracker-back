package com.lifetracker.tasks.data

import com.lifetracker.tasks.Priority
import com.lifetracker.tasks.Status
import com.lifetracker.tasks.Task

object SampleTasks {
    val items = listOf(
        Task(
            id = "1",
            title = "Plan de comidas de la semana",
            priority = Priority.MEDIUM,
            status = Status.PENDING,
            createdAt = "2025-01-08",
            dueDate = "2025-01-10"
        ),
        Task(
            id = "2",
            title = "Revisión de hábitos negativos",
            priority = Priority.HIGH,
            status = Status.PENDING,
            createdAt = "2025-01-07",
            dueDate = "2025-01-09"
        ),
        Task(
            id = "3",
            title = "Exportar JSON de tareas",
            priority = Priority.LOW,
            status = Status.COMPLETED,
            createdAt = "2025-01-05",
            dueDate = null
        )
    )
}
