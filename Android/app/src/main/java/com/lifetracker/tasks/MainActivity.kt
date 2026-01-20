package com.lifetracker.tasks

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import com.lifetracker.tasks.data.SampleTasks
import com.lifetracker.tasks.ui.TaskListScreen
import com.lifetracker.tasks.ui.theme.LifeTrackerTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            LifeTrackerTheme {
                Surface(color = MaterialTheme.colorScheme.background) {
                    TaskListScreen(tasks = SampleTasks.items)
                }
            }
        }
    }
}
