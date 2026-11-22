package com.aura.assistant.integration

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.database.Cursor
import android.net.Uri
import android.provider.CallLog
import android.provider.ContactsContract
import androidx.core.content.ContextCompat

data class ContactMatch(
    val id: String,
    val name: String,
    val phoneNumber: String
)

class CallContactManager(private val context: Context) {

    fun findContacts(targetName: String): List<ContactMatch> {
        val matches = mutableListOf<ContactMatch>()
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            return emptyList()
        }

        val projection = arrayOf(
            ContactsContract.CommonDataKinds.Phone.CONTACT_ID,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME,
            ContactsContract.CommonDataKinds.Phone.NUMBER
        )
        val selection = "${ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME} LIKE ?"
        val selectionArgs = arrayOf("%$targetName%")

        val cursor: Cursor? = context.contentResolver.query(
            ContactsContract.CommonDataKinds.Phone.CONTENT_URI,
            projection,
            selection,
            selectionArgs,
            ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME + " ASC"
        )

        cursor?.use {
            val idIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.CONTACT_ID)
            val nameIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.DISPLAY_NAME)
            val numIdx = it.getColumnIndex(ContactsContract.CommonDataKinds.Phone.NUMBER)

            while (it.moveToNext()) {
                val id = if (idIdx != -1) it.getString(idIdx) else ""
                val name = if (nameIdx != -1) it.getString(nameIdx) else ""
                val number = if (numIdx != -1) it.getString(numIdx) else ""
                if (number.isNotBlank()) {
                    matches.add(ContactMatch(id, name, number))
                }
            }
        }
        return matches
    }

    fun callContact(contactMatch: ContactMatch): Pair<Boolean, String> {
        val hasCallPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.CALL_PHONE) == PackageManager.PERMISSION_GRANTED
        val intentAction = if (hasCallPermission) Intent.ACTION_CALL else Intent.ACTION_DIAL
        val callIntent = Intent(intentAction).apply {
            data = Uri.parse("tel:${Uri.encode(contactMatch.phoneNumber)}")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        return try {
            context.startActivity(callIntent)
            Pair(true, "Calling ${contactMatch.name}")
        } catch (e: Exception) {
            Pair(false, "Could not initiate call: ${e.message}")
        }
    }

    fun redialLastNumber(): Pair<Boolean, String> {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.READ_CONTACTS) != PackageManager.PERMISSION_GRANTED) {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            context.startActivity(dialIntent)
            return Pair(true, "Opening dialer.")
        }
        return try {
            val cursor = context.contentResolver.query(
                CallLog.Calls.CONTENT_URI,
                arrayOf(CallLog.Calls.NUMBER, CallLog.Calls.CACHED_NAME),
                null,
                null,
                "${CallLog.Calls.DATE} DESC LIMIT 1"
            )
            cursor?.use {
                if (it.moveToFirst()) {
                    val num = it.getString(0)
                    val name = it.getString(1) ?: num
                    return callContact(ContactMatch("0", name, num))
                }
            }
            Pair(false, "No previous call found to redial.")
        } catch (e: Exception) {
            val dialIntent = Intent(Intent.ACTION_DIAL).apply { addFlags(Intent.FLAG_ACTIVITY_NEW_TASK) }
            context.startActivity(dialIntent)
            Pair(true, "Opening dialer.")
        }
    }
}
