package com.aura.assistant.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import com.aura.assistant.data.local.entity.NoteEntity
import com.aura.assistant.data.local.entity.NotePointEntity
import kotlinx.coroutines.flow.Flow

data class NoteWithPoints(
    val note: NoteEntity,
    val points: List<NotePointEntity>
)

@Dao
interface NoteDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertNote(note: NoteEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertPoints(points: List<NotePointEntity>)

    @Query("SELECT * FROM notes ORDER BY createdAt DESC")
    fun getAllNotesFlow(): Flow<List<NoteEntity>>

    @Query("SELECT * FROM note_points WHERE noteId = :noteId ORDER BY pointOrder ASC")
    suspend fun getPointsForNote(noteId: Long): List<NotePointEntity>

    @Query("SELECT * FROM notes ORDER BY createdAt DESC LIMIT 1")
    suspend fun getLatestNote(): NoteEntity?

    @Query("SELECT * FROM notes WHERE title LIKE '%' || :query || '%' OR category LIKE '%' || :query || '%' ORDER BY createdAt DESC")
    suspend fun searchNotes(query: String): List<NoteEntity>

    @Query("SELECT * FROM note_points WHERE pointText LIKE '%' || :query || '%' ORDER BY pointOrder ASC")
    suspend fun searchPoints(query: String): List<NotePointEntity>

    @Query("DELETE FROM note_points WHERE noteId = :noteId")
    suspend fun deletePointsForNote(noteId: Long)

    @Delete
    suspend fun deleteNote(note: NoteEntity)

    @Query("DELETE FROM notes WHERE id = :noteId")
    suspend fun deleteNoteById(noteId: Long)

    @Query("DELETE FROM notes")
    suspend fun deleteAllNotes()

    @Query("DELETE FROM note_points")
    suspend fun deleteAllPoints()
}
