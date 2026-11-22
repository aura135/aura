package com.aura.assistant.data.remote

import android.util.Log
import org.json.JSONArray
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class SyncPayload(
    val notes: List<Map<String, Any>>,
    val reminders: List<Map<String, Any>>,
    val tasks: List<Map<String, Any>>
)

data class SyncResult(
    val success: Boolean,
    val syncedNotesCount: Int = 0,
    val syncedRemindersCount: Int = 0,
    val syncedTasksCount: Int = 0,
    val message: String = ""
)

class AuraApiClient(private var baseUrl: String = "http://10.0.2.2:4000") {

    fun setBaseUrl(url: String) {
        baseUrl = url.trimEnd('/')
    }

    suspend fun healthCheck(): Boolean = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/health")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                connectTimeout = 3000
                readTimeout = 3000
            }
            conn.responseCode == 200
        } catch (e: Exception) {
            Log.e("AuraApiClient", "Health check failed: ${e.message}")
            false
        }
    }

    suspend fun pushData(payload: SyncPayload, token: String? = null): SyncResult = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/sync/push")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                setRequestProperty("Content-Type", "application/json")
                if (!token.isNullOrEmpty()) {
                    setRequestProperty("Authorization", "Bearer $token")
                }
                doOutput = true
                connectTimeout = 5000
                readTimeout = 5000
            }

            val body = JSONObject().apply {
                put("notes", JSONArray(payload.notes.map { JSONObject(it) }))
                put("reminders", JSONArray(payload.reminders.map { JSONObject(it) }))
                put("tasks", JSONArray(payload.tasks.map { JSONObject(it) }))
            }

            OutputStreamWriter(conn.outputStream).use { it.write(body.toString()) }

            if (conn.responseCode in 200..299) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                val resp = reader.readText()
                val json = JSONObject(resp)
                SyncResult(
                    success = true,
                    syncedNotesCount = payload.notes.size,
                    syncedRemindersCount = payload.reminders.size,
                    syncedTasksCount = payload.tasks.size,
                    message = json.optString("message", "Synced successfully")
                )
            } else {
                SyncResult(false, message = "HTTP error: ${conn.responseCode}")
            }
        } catch (e: Exception) {
            Log.e("AuraApiClient", "Push sync failed: ${e.message}")
            SyncResult(false, message = e.message ?: "Network error")
        }
    }

    suspend fun pullData(since: Long = 0, token: String? = null): JSONObject? = withContext(Dispatchers.IO) {
        try {
            val url = URL("$baseUrl/api/sync/pull?since=$since")
            val conn = (url.openConnection() as HttpURLConnection).apply {
                requestMethod = "GET"
                if (!token.isNullOrEmpty()) {
                    setRequestProperty("Authorization", "Bearer $token")
                }
                connectTimeout = 5000
                readTimeout = 5000
            }

            if (conn.responseCode in 200..299) {
                val reader = BufferedReader(InputStreamReader(conn.inputStream))
                JSONObject(reader.readText())
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e("AuraApiClient", "Pull sync failed: ${e.message}")
            null
        }
    }
}
