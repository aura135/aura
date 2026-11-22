package com.aura.assistant

import com.aura.assistant.voice.AuraAction
import com.aura.assistant.voice.LocalCommandEngine
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Before
import org.junit.Test

class LocalCommandEngineTest {

    private lateinit var engine: LocalCommandEngine

    @Before
    fun setUp() {
        engine = LocalCommandEngine()
    }

    @Test
    fun testAppLaunchEnglish() {
        val cmd = engine.parse("Hey AURA, open YouTube", "en")
        assertEquals(AuraAction.OPEN_APP, cmd.action)
        assertEquals("youtube", cmd.target?.lowercase())
    }

    @Test
    fun testAppLaunchTelugu() {
        val cmd = engine.parse("హే ఆరా, యూట్యూబ్ ఓపెన్ చెయ్యి", "te")
        assertEquals(AuraAction.OPEN_APP, cmd.action)
        assertEquals("te", cmd.language)
    }

    @Test
    fun testAppLaunchHindi() {
        val cmd = engine.parse("हे ऑरा, यूट्यूब खोलो", "hi")
        assertEquals(AuraAction.OPEN_APP, cmd.action)
        assertEquals("hi", cmd.language)
    }

    @Test
    fun testFlashlightToggle() {
        val onCmd = engine.parse("Turn on the flashlight", "en")
        assertEquals(AuraAction.FLASHLIGHT_ON, onCmd.action)

        val offCmd = engine.parse("Turn off the flashlight", "en")
        assertEquals(AuraAction.FLASHLIGHT_OFF, offCmd.action)

        val teOn = engine.parse("ఫ్లాష్ లైట్ ఆన్ చెయ్యి", "te")
        assertEquals(AuraAction.FLASHLIGHT_ON, teOn.action)

        val hiOff = engine.parse("टॉर्च बंद करो", "hi")
        assertEquals(AuraAction.FLASHLIGHT_OFF, hiOff.action)
    }

    @Test
    fun testOrderedPointsCapture() {
        val cmd = engine.parse(
            "Hey AURA, note this: complete the assignment, call the project team, prepare the presentation, and submit the report.",
            "en"
        )
        assertEquals(AuraAction.POINTS_SAVE, cmd.action)
        assertTrue("Should have multiple ordered points", cmd.points.size >= 3)
    }

    @Test
    fun testRepeatPoints() {
        val cmd = engine.parse("Hey AURA, repeat my points", "en")
        assertEquals(AuraAction.POINTS_REPEAT, cmd.action)

        val teCmd = engine.parse("నా పాయింట్లు చెప్పు", "te")
        assertEquals(AuraAction.POINTS_REPEAT, teCmd.action)

        val hiCmd = engine.parse("मेरे पॉइंट दोहराओ", "hi")
        assertEquals(AuraAction.POINTS_REPEAT, hiCmd.action)
    }

    @Test
    fun testFreeTimeReminder() {
        val cmd = engine.parse(
            "AURA, remind me about these points during my free time between 6 PM and 8 PM",
            "en"
        )
        assertEquals(AuraAction.REMINDER_FREETIME, cmd.action)
        assertEquals("6 PM", cmd.freeTimeStart?.trim())
        assertEquals("8 PM", cmd.freeTimeEnd?.trim())
    }

    @Test
    fun testCallingContacts() {
        val cmd = engine.parse("Hey AURA, call Mom", "en")
        assertEquals(AuraAction.CALL_CONTACT, cmd.action)
        assertEquals("mom", cmd.target?.lowercase())

        val redialCmd = engine.parse("Hey AURA, redial last number", "en")
        assertEquals(AuraAction.CALL_REDIAL, redialCmd.action)
    }

    @Test
    fun testMusicControl() {
        val play = engine.parse("Play music", "en")
        assertEquals(AuraAction.MUSIC_PLAY, play.action)

        val pause = engine.parse("Pause song", "en")
        assertEquals(AuraAction.MUSIC_PAUSE, pause.action)

        val next = engine.parse("Next song", "en")
        assertEquals(AuraAction.MUSIC_NEXT, next.action)
    }

    @Test
    fun testDailyBriefing() {
        val cmd = engine.parse("Hey AURA, what is my schedule today?", "en")
        assertEquals(AuraAction.DAILY_BRIEFING, cmd.action)
    }
}
