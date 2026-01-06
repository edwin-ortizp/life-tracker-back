package com.lifetracker.android.data

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.KSerializer
import kotlinx.serialization.descriptors.PrimitiveKind
import kotlinx.serialization.descriptors.PrimitiveSerialDescriptor
import kotlinx.serialization.descriptors.SerialDescriptor
import kotlinx.serialization.encoding.Decoder
import kotlinx.serialization.encoding.Encoder
import kotlinx.serialization.json.JsonDecoder
import kotlinx.serialization.json.JsonPrimitive

data class AuthTokens(
    val accessToken: String,
    val refreshToken: String?
)

@Serializable
data class AuthResponse(
    val access_token: String,
    val refresh_token: String?,
)

@Serializable
data class Task(
    @Serializable(with = FlexibleStringSerializer::class)
    val id: String,
    val title: String,
    val description: String? = null,
    val status: String? = null,
    val category: String? = null,
    @SerialName("start_date") val startDate: String? = null,
    @SerialName("end_date") val endDate: String? = null,
    val progress: Int? = null,
    @SerialName("task_code") val taskCode: String? = null,
    val completed: Boolean? = false
)

@Serializable
data class CreateTaskRequest(
    val title: String,
    val description: String? = null,
    val status: String = "pending",
    val category: String? = null,
    @SerialName("start_date") val startDate: String? = null,
    @SerialName("end_date") val endDate: String? = null,
    val progress: Int = 0,
    @SerialName("task_code") val taskCode: String? = null,
    val completed: Boolean = false
)

@Serializable
data class JournalEntry(
    val id: String,
    val content: String,
    @SerialName("created_at") val createdAt: String,
    val date: String? = null
)

@Serializable
data class Goal(
    val id: String,
    val title: String,
    val description: String? = null,
    @SerialName("target_date") val targetDate: String? = null,
    val completed: Boolean = false
)

@Serializable
data class DrinkLog(
    val id: String,
    @SerialName("drink_type") val drinkType: String,
    val amount: Int, // ml
    @SerialName("created_at") val createdAt: String
)

object FlexibleStringSerializer : KSerializer<String> {
    override val descriptor: SerialDescriptor = PrimitiveSerialDescriptor("FlexibleString", PrimitiveKind.STRING)

    override fun deserialize(decoder: Decoder): String {
        return if (decoder is JsonDecoder) {
            val element = decoder.decodeJsonElement()
            if (element is JsonPrimitive) element.content else element.toString()
        } else {
            decoder.decodeString()
        }
    }

    override fun serialize(encoder: Encoder, value: String) {
        encoder.encodeString(value)
    }
}
