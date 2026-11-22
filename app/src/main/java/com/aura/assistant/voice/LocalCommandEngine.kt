package com.aura.assistant.voice

import java.util.Calendar
import java.util.regex.Pattern

class LocalCommandEngine {

    fun parse(rawInput: String, defaultLanguage: String = "en"): AuraCommand {
        val clean = rawInput.trim().lowercase()
        val lang = detectLanguage(clean, defaultLanguage)
        val text = stripWakeWord(clean)

        // 1. Daily Briefing
        if (matchesPattern(text, listOf("schedule today", "daily briefing", "what do i have today", "today's schedule", "షెడ్యూల్", "आज का शेड्यूल", "आज क्या करना है"))) {
            return AuraCommand(AuraAction.DAILY_BRIEFING, rawInput, language = lang)
        }

        // 2. Repeat Points / Notes
        if (matchesPattern(text, listOf("repeat these points", "repeat my points", "repeat my last points", "read my saved points", "repeat today's points", "read yesterday's notes", "what did i ask you to remember", "నా పాయింట్లు చెప్పు", "నా పాయింట్లు చదువు", "मेरे पॉइंट दोहराओ", "सहेजे गए पॉइंट पढ़ो"))) {
            return AuraCommand(AuraAction.POINTS_REPEAT, rawInput, language = lang)
        }

        // 3. Save Points / Notes
        if (text.startsWith("note this") || text.startsWith("write this down") || text.startsWith("take a note") ||
            text.startsWith("save these points") || text.startsWith("remember these points") ||
            text.contains("నోట్ రాయి") || text.contains("పాయింట్లు రాసుకో") ||
            text.contains("नोट लिखो") || text.contains("यह बात लिख लो")) {
            
            val points = extractPoints(text)
            return AuraCommand(
                action = if (points.size > 1) AuraAction.POINTS_SAVE else AuraAction.NOTE_CREATE,
                rawText = rawInput,
                content = text,
                points = points,
                language = lang
            )
        }

        // 4. Read Latest Note
        if (matchesPattern(text, listOf("read my latest note", "read latest note", "what was my last note", "చివరి నోట్ చదువు", "आखरी नोट पढ़ो"))) {
            return AuraCommand(AuraAction.NOTE_READ_LATEST, rawInput, language = lang)
        }

        // 5. Free-Time Reminders
        if (text.contains("free time") || text.contains("ఫ్రీ టైం") || text.contains("खाली समय") || text.contains("फुर्सत")) {
            val (start, end) = extractFreeTimeWindow(text)
            return AuraCommand(
                action = AuraAction.REMINDER_FREETIME,
                rawText = rawInput,
                freeTimeStart = start,
                freeTimeEnd = end,
                content = extractContentAfter(text, listOf("remind me about", "remind me to", "గుర్తు చెయ్యి", "याद दिलाओ")),
                language = lang
            )
        }

        // 6. Regular Reminders
        if (text.startsWith("remind me") || text.contains("reminder") || text.contains("గుర్తు చేయి") || text.contains("గుర్తు చెయ్యి") || text.contains("याद दिलाना") || text.contains("याद दिलाओ")) {
            val (hour, minute) = extractTime(text)
            val content = extractReminderContent(text)
            return AuraCommand(
                action = AuraAction.REMINDER_SET,
                rawText = rawInput,
                content = content,
                targetHour = hour,
                targetMinute = minute,
                language = lang
            )
        }

        // 7. Alarms
        if (text.contains("alarm") || text.contains("wake me up") || text.contains("అలారం") || text.contains("अलार्म")) {
            if (text.contains("cancel") || text.contains("రద్దు") || text.contains("बंद करो") || text.contains("हटाओ")) {
                val (hour, minute) = extractTime(text)
                return AuraCommand(AuraAction.ALARM_CANCEL, rawInput, targetHour = hour, targetMinute = minute, language = lang)
            }
            if (text.contains("what alarms") || text.contains("list alarms") || text.contains("అలారాలు ఏమున్నాయి")) {
                return AuraCommand(AuraAction.ALARM_LIST, rawInput, language = lang)
            }
            val (hour, minute) = extractTime(text)
            return AuraCommand(AuraAction.ALARM_SET, rawInput, targetHour = hour ?: 7, targetMinute = minute ?: 0, language = lang)
        }

        // 8. Calling
        if (text.startsWith("call ") || text.startsWith("dial ") || text.contains("కాల్ చెయ్యి") || text.contains("ఫోన్ చెయ్యి") || text.contains("को कॉल करो") || text.contains("को फोन लगाओ")) {
            if (text.contains("redial") || text.contains("మళ్లీ కాల్") || text.contains("फिर से कॉल")) {
                return AuraCommand(AuraAction.CALL_REDIAL, rawInput, language = lang)
            }
            val contactName = extractContactName(text)
            return AuraCommand(AuraAction.CALL_CONTACT, rawInput, target = contactName, language = lang)
        }

        // 9. Music Control
        if (text.contains("music") || text.contains("song") || text.contains("పాట") || text.contains("గానం") || text.contains("गाना") || text.contains("संगीत")) {
            return when {
                text.contains("next") || text.contains("తర్వాత") || text.contains("अगला") -> AuraCommand(AuraAction.MUSIC_NEXT, rawInput, language = lang)
                text.contains("previous") || text.contains("ముందు") || text.contains("पिछला") -> AuraCommand(AuraAction.MUSIC_PREV, rawInput, language = lang)
                text.contains("pause") || text.contains("ఆపు") || text.contains("रोक") -> AuraCommand(AuraAction.MUSIC_PAUSE, rawInput, language = lang)
                text.contains("stop") || text.contains("ఆపేయి") || text.contains("बंद") -> AuraCommand(AuraAction.MUSIC_STOP, rawInput, language = lang)
                text.contains("resume") || text.contains("మళ్లీ ప్లే") || text.contains("शुरू") -> AuraCommand(AuraAction.MUSIC_RESUME, rawInput, language = lang)
                else -> AuraCommand(AuraAction.MUSIC_PLAY, rawInput, language = lang)
            }
        }

        // 10. Flashlight
        if (text.contains("flashlight") || text.contains("torch") || text.contains("ఫ్లాష్ లైట్") || text.contains("టార్చ్")) {
            return if (text.contains("off") || text.contains("ఆపు") || text.contains("बंद")) {
                AuraCommand(AuraAction.FLASHLIGHT_OFF, rawInput, language = lang)
            } else {
                AuraCommand(AuraAction.FLASHLIGHT_ON, rawInput, language = lang)
            }
        }

        // 11. Volume
        if (text.contains("volume") || text.contains("వాల్యూమ్") || text.contains("ध्वनि") || text.contains("आवाज")) {
            return when {
                text.contains("up") || text.contains("increase") || text.contains("పెంచు") || text.contains("बढ़ाओ") -> AuraCommand(AuraAction.VOLUME_UP, rawInput, language = lang)
                text.contains("down") || text.contains("decrease") || text.contains("తగ్గించు") || text.contains("कम करो") -> AuraCommand(AuraAction.VOLUME_DOWN, rawInput, language = lang)
                text.contains("mute") || text.contains("సైలెంట్") || text.contains("म्यूट") -> AuraCommand(AuraAction.VOLUME_MUTE, rawInput, language = lang)
                else -> AuraCommand(AuraAction.VOLUME_UP, rawInput, language = lang)
            }
        }

        // 12. Brightness
        if (text.contains("brightness") || text.contains("వెలుతురు") || text.contains("चमक") || text.contains("ब्राइटनेस")) {
            return if (text.contains("down") || text.contains("తగ్గించు") || text.contains("कम")) {
                AuraCommand(AuraAction.BRIGHTNESS_DOWN, rawInput, language = lang)
            } else {
                AuraCommand(AuraAction.BRIGHTNESS_UP, rawInput, language = lang)
            }
        }

        // 13. Bluetooth & Wi-Fi
        if (text.contains("bluetooth") || text.contains("బ్లూటూత్") || text.contains("ब्लूटूथ")) {
            return if (text.contains("settings") || text.contains("ఓపెన్") || text.contains("खोल")) {
                AuraCommand(AuraAction.BLUETOOTH_SETTINGS, rawInput, language = lang)
            } else {
                AuraCommand(AuraAction.BLUETOOTH_CHECK, rawInput, language = lang)
            }
        }
        if (text.contains("wifi") || text.contains("wi-fi") || text.contains("వైఫై") || text.contains("वाईफाई")) {
            return if (text.contains("settings") || text.contains("ఓపెన్") || text.contains("खोल")) {
                AuraCommand(AuraAction.WIFI_SETTINGS, rawInput, language = lang)
            } else {
                AuraCommand(AuraAction.WIFI_CHECK, rawInput, language = lang)
            }
        }

        // 14. Camera
        if (text.contains("camera") || text.contains("photo") || text.contains("కెమెరా") || text.contains("ఫోటో") || text.contains("कैमरा") || text.contains("फोटो")) {
            return if (text.contains("capture") || text.contains("take") || text.contains("తీయి") || text.contains("खींचो")) {
                AuraCommand(AuraAction.CAMERA_CAPTURE, rawInput, language = lang)
            } else {
                AuraCommand(AuraAction.CAMERA_OPEN, rawInput, language = lang)
            }
        }

        // 15. Device Info
        if (text.contains("battery") || text.contains("చార్జింగ్") || text.contains("బ్యాటరీ") || text.contains("बैटरी")) {
            return AuraCommand(AuraAction.DEVICE_BATTERY, rawInput, language = lang)
        }
        if (text.contains("time") || text.contains("సమయం") || text.contains("समय") || text.contains("वक्त")) {
            return AuraCommand(AuraAction.DEVICE_TIME, rawInput, language = lang)
        }
        if (text.contains("date") || text.contains("తేదీ") || text.contains("तारीख")) {
            return AuraCommand(AuraAction.DEVICE_DATE, rawInput, language = lang)
        }

        // 16. Launching Apps
        if (text.startsWith("open ") || text.startsWith("launch ") || text.contains("ఓపెన్ చెయ్యి") || text.contains("खोलो")) {
            val appName = extractAppName(text)
            return AuraCommand(AuraAction.OPEN_APP, rawInput, target = appName, language = lang)
        }

        // 17. Tasks
        if (text.contains("task") || text.contains("పని") || text.contains("कार्य") || text.contains("काम")) {
            if (text.contains("pending") || text.contains("బాకీ") || text.contains("बाकी")) {
                return AuraCommand(AuraAction.TASK_LIST_PENDING, rawInput, language = lang)
            }
            if (text.contains("complete") || text.contains("పూర్తి") || text.contains("पूरा")) {
                return AuraCommand(AuraAction.TASK_COMPLETE, rawInput, content = text, language = lang)
            }
            val title = extractContentAfter(text, listOf("add a task to", "add task", "పని జోడించు", "काम जोड़ो"))
            return AuraCommand(AuraAction.TASK_ADD, rawInput, content = title.ifEmpty { text }, language = lang)
        }

        return AuraCommand(AuraAction.UNKNOWN, rawInput, language = lang)
    }

    private fun stripWakeWord(text: String): String {
        var result = text
        for (w in MultilingualDictionary.WAKE_WORDS) {
            if (result.startsWith(w)) {
                result = result.removePrefix(w).trim()
            }
        }
        return result.trim().removePrefix(",").trim()
    }

    private fun detectLanguage(text: String, defaultLang: String): String {
        for (ch in text) {
            if (ch in '\u0C00'..'\u0C7F') return "te" // Telugu Unicode range
            if (ch in '\u0900'..'\u097F') return "hi" // Devanagari Unicode range
        }
        return defaultLang
    }

    private fun matchesPattern(text: String, patterns: List<String>): Boolean {
        return patterns.any { text.contains(it) }
    }

    private fun extractPoints(text: String): List<String> {
        // Strip command trigger phrases
        var clean = text
        val triggers = listOf(
            "note this", "write this down", "take a note", "save these points", "remember these points",
            "tell me your points", "పాయింట్లు", "నోట్ రాయి", "नोट लिखो"
        )
        for (t in triggers) {
            clean = clean.replace(t, "")
        }
        clean = clean.removePrefix(":").removePrefix("-").trim()

        // Split points using common dividers
        val delimiters = Pattern.compile("(?i)\\b(?:point \\d+|first|second|third|fourth|next|then|and then|and|కూడా|మరియు|तथा|और)\\b|[\n\r;•\\-]")
        val rawPoints = clean.split(delimiters)
            .map { it.trim().removePrefix("1.").removePrefix("2.").removePrefix("3.").removePrefix("4.").removePrefix("-").trim() }
            .filter { it.length > 2 }

        return if (rawPoints.isNotEmpty()) rawPoints else listOf(clean)
    }

    private fun extractTime(text: String): Pair<Int?, Int?> {
        val matcher = Pattern.compile("(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.)?", Pattern.CASE_INSENSITIVE).matcher(text)
        if (matcher.find()) {
            var hour = matcher.group(1)?.toIntOrNull() ?: return Pair(null, null)
            val minute = matcher.group(2)?.toIntOrNull() ?: 0
            val ampm = matcher.group(3)?.lowercase()
            if (ampm != null) {
                if (ampm.contains("pm") && hour < 12) hour += 12
                if (ampm.contains("am") && hour == 12) hour = 0
            }
            return Pair(hour, minute)
        }
        // Hindi/Telugu time words
        if (text.contains("సాయంత్రం") || text.contains("రాత్రి") || text.contains("शाम") || text.contains("रात")) {
            val numMatcher = Pattern.compile("(\\d{1,2})").matcher(text)
            if (numMatcher.find()) {
                val h = numMatcher.group(1)?.toIntOrNull() ?: 6
                val finalH = if (h < 12) h + 12 else h
                return Pair(finalH, 0)
            }
        }
        if (text.contains("ఉదయం") || text.contains("सुबह")) {
            val numMatcher = Pattern.compile("(\\d{1,2})").matcher(text)
            if (numMatcher.find()) {
                val h = numMatcher.group(1)?.toIntOrNull() ?: 8
                return Pair(h, 0)
            }
        }
        return Pair(null, null)
    }

    private fun extractFreeTimeWindow(text: String): Pair<String, String> {
        // e.g. "between 6 pm and 8 pm"
        val matcher = Pattern.compile("(\\d{1,2}\\s*(?:am|pm)?)\\s*(?:and|to|నుండి|వరకు|से|तक)\\s*(\\d{1,2}\\s*(?:am|pm)?)", Pattern.CASE_INSENSITIVE).matcher(text)
        if (matcher.find()) {
            return Pair(matcher.group(1) ?: "6 PM", matcher.group(2) ?: "8 PM")
        }
        return Pair("6:00 PM", "8:00 PM")
    }

    private fun extractReminderContent(text: String): String {
        val prefixes = listOf("remind me to", "remind me about", "remind me", "గుర్తు చేయి", "గుర్తు చెయ్యి", "याद दिलाओ", "याद दिलाना")
        var result = text
        for (p in prefixes) {
            if (result.contains(p)) {
                result = result.substringAfter(p).trim()
                break
            }
        }
        // Remove time suffix if present
        result = result.replace(Regex("at\\s+\\d{1,2}(?::\\d{2})?\\s*(?:am|pm)?.*", RegexOption.IGNORE_CASE), "").trim()
        result = result.replace(Regex("tomorrow.*", RegexOption.IGNORE_CASE), "").trim()
        return result.ifEmpty { "Important Reminder" }
    }

    private fun extractContactName(text: String): String {
        val prefixes = listOf("call", "dial", "కాల్ చెయ్యి", "ఫోన్ చెయ్యి", "को कॉल करो", "को फोन करो")
        var clean = text
        for (p in prefixes) {
            clean = clean.replace(p, "").trim()
        }
        return clean.trim().removePrefix("to ").trim()
    }

    private fun extractAppName(text: String): String {
        val prefixes = listOf("open", "launch", "ఓపెన్ చెయ్యి", "खोलो")
        var clean = text
        for (p in prefixes) {
            clean = clean.replace(p, "").trim()
        }
        return clean.trim()
    }

    private fun extractContentAfter(text: String, triggers: List<String>): String {
        for (t in triggers) {
            if (text.contains(t)) {
                return text.substringAfter(t).trim()
            }
        }
        return text
    }
}
