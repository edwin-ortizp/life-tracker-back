package com.lifetracker.tasks

data class Task(
    val id: String,
    val title: String,
    val priority: Priority,
    val status: Status,
    val createdAt: String,
    val dueDate: String?
)

enum class Priority { HIGH, MEDIUM, LOW }
enum class Status { PENDING, COMPLETED }
