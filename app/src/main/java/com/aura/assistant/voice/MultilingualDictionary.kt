package com.aura.assistant.voice

object MultilingualDictionary {

    // Wake words across languages
    val WAKE_WORDS = listOf(
        "hey aura", "aura", "ok aura", "hello aura",
        "హే ఆరా", "ఆరా", "ఓకే ఆరా",
        "हे ऑरा", "ऑरा", "नमस्ते ऑरा"
    )

    // Standard responses
    fun getListeningResponse(lang: String): String = when (lang) {
        "te" -> "అవును, నేను వింటున్నాను."
        "hi" -> "हाँ, मैं सुन रहा हूँ।"
        else -> "Yes, I'm listening."
    }

    fun getSuccessResponse(lang: String, actionName: String): String = when (lang) {
        "te" -> "$actionName పూర్తి అయ్యింది."
        "hi" -> "$actionName पूरा हो गया।"
        else -> "$actionName completed."
    }

    fun getClarificationResponse(lang: String): String = when (lang) {
        "te" -> "దయచేసి వివరాలు స్పష్టంగా చెప్పండి."
        "hi" -> "कृपया थोड़ा स्पष्ट बताएं।"
        else -> "Could you please clarify your request?"
    }

    fun getMissingPermissionResponse(lang: String, permissionName: String): String = when (lang) {
        "te" -> "దయచేసి $permissionName అనుమతి ఇవ్వండి."
        "hi" -> "कृपया $permissionName की अनुमति दें।"
        else -> "Please grant $permissionName permission in settings."
    }

    fun getNotFoundResponse(lang: String, item: String): String = when (lang) {
        "te" -> "$item దొరకలేదు."
        "hi" -> "$item नहीं मिला।"
        else -> "I couldn't find $item."
    }

    fun getPointsSavedResponse(lang: String, count: Int): String = when (lang) {
        "te" -> "$count పాయింట్లు భద్రపరచబడ్డాయి."
        "hi" -> "$count पॉइंट सुरक्षित कर लिए गए हैं।"
        else -> "Saved $count points successfully."
    }

    fun getPointsRepeatHeader(lang: String): String = when (lang) {
        "te" -> "మీరు నమోదు చేసిన పాయింట్లు ఇవి:"
        "hi" -> "आपके द्वारा सहेजे गए पॉइंट इस प्रकार हैं:"
        else -> "Here are your saved points:"
    }

    fun getDailyBriefingHeader(lang: String): String = when (lang) {
        "te" -> "ఈరోజు మీ షెడ్యూల్ సారాంశం ఇది:"
        "hi" -> "यहाँ आपका आज का कार्यक्रम है:"
        else -> "Here is your daily briefing for today:"
    }
}
