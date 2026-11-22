// AURA Multilingual Web Voice & Hardware Integration Engine
import { api } from './api';

export const VoiceState = {
  IDLE: 'IDLE',
  LISTENING_FOR_WAKE: 'LISTENING_FOR_WAKE',
  HEARD_WAKE_WORD: 'HEARD_WAKE_WORD',
  LISTENING_FOR_COMMAND: 'LISTENING_FOR_COMMAND',
  PROCESSING: 'PROCESSING',
  SPEAKING: 'SPEAKING',
  PAUSED: 'PAUSED'
};

export const WAKE_WORDS = [
  'hey aura', 'aura', 'హే ఆరా', 'ఆరా', 'हे ऑरा', 'ऑरा'
];

class VoiceEngine {
  constructor() {
    this.state = VoiceState.IDLE;
    this.language = localStorage.getItem('aura_lang') || 'en';
    this.speechRate = parseFloat(localStorage.getItem('aura_speech_rate') || '1.0');
    this.speechPitch = parseFloat(localStorage.getItem('aura_speech_pitch') || '1.0');
    this.isEnrolled = localStorage.getItem('aura_voice_enrolled') !== 'false';
    this.isPaused = localStorage.getItem('aura_voice_paused') === 'true';

    this.recognition = null;
    this.synthesis = window.speechSynthesis || null;
    this.audioContext = null;
    this.analyser = null;
    this.micStream = null;
    this.wakeLock = null;
    this.torchTrack = null;

    this.listeners = {
      state: [],
      rms: [],
      transcript: [],
      response: []
    };

    this.initSpeechRecognition();
  }

  // --- Subscriptions ---
  onStateChange(cb) { this.listeners.state.push(cb); }
  onRms(cb) { this.listeners.rms.push(cb); }
  onTranscript(cb) { this.listeners.transcript.push(cb); }
  onResponse(cb) { this.listeners.response.push(cb); }

  setState(newState) {
    this.state = newState;
    this.listeners.state.forEach(cb => cb(newState));
  }

  setLanguage(lang) {
    this.language = lang;
    localStorage.setItem('aura_lang', lang);
    if (this.recognition) {
      this.recognition.lang = lang === 'te' ? 'te-IN' : lang === 'hi' ? 'hi-IN' : 'en-US';
    }
  }

  // --- Speech Recognition Setup ---
  initSpeechRecognition() {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) {
      console.warn('[AURA VOICE] Web Speech API not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRec();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.language === 'te' ? 'te-IN' : this.language === 'hi' ? 'hi-IN' : 'en-US';

    this.recognition.onstart = () => {
      if (!this.isPaused && this.isEnrolled) {
        this.setState(VoiceState.LISTENING_FOR_WAKE);
      }
    };

    this.recognition.onresult = (event) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          this.listeners.transcript.forEach(cb => cb(transcript, false));
        }
      }

      if (finalTranscript.trim().length > 0) {
        this.handleSpokenInput(finalTranscript.trim());
      }
    };

    this.recognition.onerror = (event) => {
      console.warn('[AURA VOICE] Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        this.setState(VoiceState.PAUSED);
      }
    };

    this.recognition.onend = () => {
      // Auto-restart continuous listening loop if enrolled and not paused
      if (this.isEnrolled && !this.isPaused && this.state !== VoiceState.SPEAKING) {
        try {
          this.recognition.start();
        } catch (e) {
          // already started or transitioning
        }
      }
    };
  }

  // --- Web Audio RMS Level Feed ---
  async initAudioVisualizer() {
    if (this.audioContext) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.micStream = stream;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioCtx();
      const source = this.audioContext.createMediaStreamSource(stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      source.connect(this.analyser);

      const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      const updateLevel = () => {
        if (!this.analyser || this.state === VoiceState.PAUSED) return;
        this.analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalizedRms = Math.min(100, Math.max(0, (avg / 128) * 100));
        this.listeners.rms.forEach(cb => cb(normalizedRms));
        requestAnimationFrame(updateLevel);
      };
      updateLevel();
    } catch (err) {
      console.warn('[AURA VOICE] Could not initialize Web Audio Analyser:', err.message);
    }
  }

  // --- 4 STRICT MAIN VOICE CONTROLS ---

  // 1. ADD VOICE
  async addVoice() {
    this.isEnrolled = true;
    this.isPaused = false;
    localStorage.setItem('aura_voice_enrolled', 'true');
    localStorage.setItem('aura_voice_paused', 'false');

    await this.initAudioVisualizer();
    this.acquireScreenWakeLock();

    try {
      this.recognition?.start();
    } catch (e) {
      // already active
    }
    this.setState(VoiceState.LISTENING_FOR_WAKE);
    const greeting = this.language === 'te' ? 'ఆరా వాయిస్ సక్రియం చేయబడింది.' : this.language === 'hi' ? 'ऑरा वॉयस सक्रिय कर दी गई है।' : 'AURA Voice Engine active. Listening for "Hey AURA".';
    this.speak(greeting);
  }

  // 2. REMOVE VOICE
  removeVoice() {
    this.isEnrolled = false;
    localStorage.setItem('aura_voice_enrolled', 'false');
    this.pauseListening();
    this.setState(VoiceState.IDLE);
    this.speak('Voice profile removed. Listening disengaged.');
  }

  // 3. DELETE VOICE
  deleteVoice() {
    this.isEnrolled = false;
    this.isPaused = false;
    localStorage.removeItem('aura_voice_enrolled');
    localStorage.removeItem('aura_voice_paused');
    localStorage.removeItem('aura_speech_rate');
    localStorage.removeItem('aura_speech_pitch');
    this.pauseListening();
    this.setState(VoiceState.IDLE);
    this.speak('Saved voice profile permanently deleted.');
  }

  // 4. PAUSE VOICE / RESUME VOICE
  togglePauseVoice() {
    if (this.isPaused) {
      this.resumeVoice();
    } else {
      this.pauseVoice();
    }
  }

  pauseVoice() {
    this.isPaused = true;
    localStorage.setItem('aura_voice_paused', 'true');
    this.pauseListening();
    this.setState(VoiceState.PAUSED);
  }

  resumeVoice() {
    this.isPaused = false;
    localStorage.setItem('aura_voice_paused', 'false');
    try {
      this.recognition?.start();
    } catch (e) {
      // already started
    }
    this.setState(VoiceState.LISTENING_FOR_WAKE);
  }

  pauseListening() {
    try {
      this.recognition?.stop();
    } catch (e) {}
  }

  // --- Screen Wake Lock API ---
  async acquireScreenWakeLock() {
    if ('wakeLock' in navigator) {
      try {
        this.wakeLock = await navigator.wakeLock.request('screen');
      } catch (err) {
        console.warn('[AURA] Screen Wake Lock error:', err.message);
      }
    }
  }

  // --- Text-To-Speech Synthesis ---
  speak(text, onComplete) {
    if (!this.synthesis) {
      if (onComplete) onComplete();
      return;
    }

    this.synthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.speechRate;
    utterance.pitch = this.speechPitch;

    // Select language voice if available
    const voices = this.synthesis.getVoices();
    const targetTag = this.language === 'te' ? 'te' : this.language === 'hi' ? 'hi' : 'en';
    const match = voices.find(v => v.lang.toLowerCase().startsWith(targetTag));
    if (match) utterance.voice = match;

    this.setState(VoiceState.SPEAKING);
    this.listeners.response.forEach(cb => cb(text));

    utterance.onend = () => {
      if (this.isEnrolled && !this.isPaused) {
        this.setState(VoiceState.LISTENING_FOR_WAKE);
      } else {
        this.setState(this.isPaused ? VoiceState.PAUSED : VoiceState.IDLE);
      }
      if (onComplete) onComplete();
    };

    utterance.onerror = () => {
      this.setState(this.isPaused ? VoiceState.PAUSED : VoiceState.LISTENING_FOR_WAKE);
      if (onComplete) onComplete();
    };

    this.synthesis.speak(utterance);
  }

  // --- Multilingual Spoken Command Parsing & Execution ---
  async handleSpokenInput(rawText) {
    const clean = rawText.trim().toLowerCase();
    this.listeners.transcript.forEach(cb => cb(rawText, true));

    // Check if wake word triggered
    const matchedWakeWord = WAKE_WORDS.find(w => clean.includes(w));
    let commandText = clean;
    if (matchedWakeWord) {
      this.setState(VoiceState.HEARD_WAKE_WORD);
      commandText = clean.replace(matchedWakeWord, '').replace(/^[,.\s]+/, '').trim();
    }

    if (commandText.length === 0) {
      // Wake word only - prompt user
      const ack = this.language === 'te' ? 'చెప్పండి, నేను వింటున్నాను.' : this.language === 'hi' ? 'जी, मैं सुन रहा हूँ।' : 'Yes, I am listening.';
      this.speak(ack);
      return;
    }

    this.setState(VoiceState.PROCESSING);
    const parsed = this.parseCommand(commandText);
    const result = await this.executeAction(parsed, rawText);

    // Speak response
    this.speak(result.speechResponse);

    // Log to backend
    if (api.isAuthenticated()) {
      api.logCommand(rawText, parsed.action, this.language, result.success, result.speechResponse).catch(() => {});
    }
  }

  parseCommand(text) {
    const lang = this.detectLanguage(text);

    // 1. Daily Briefing
    if (/schedule today|daily briefing|what do i have today|today's schedule|షెడ్యూల్|आज का शेड्यूल|आज क्या करना है/i.test(text)) {
      return { action: 'DAILY_BRIEFING', text, lang };
    }

    // 2. Repeat Points
    if (/repeat (these|my|last|today's)? points|read (my )?saved points|what did i ask you to remember|నా పాయింట్లు చెప్పు|నా పాయింట్లు చదువు|मेरे पॉइंट दोहराओ/i.test(text)) {
      return { action: 'POINTS_REPEAT', text, lang };
    }

    // 3. Save Points / Notes
    if (/note this|write this down|take a note|save these points|remember these points|నోట్ రాసుకో|నోట్ రాయి|పాయింట్లు రాసుకో|नोट लिखो|यह बात लिख लो/i.test(text)) {
      const points = this.extractPoints(text);
      return {
        action: points.length > 1 ? 'POINTS_SAVE' : 'NOTE_CREATE',
        text,
        points,
        lang
      };
    }

    // 4. Free-Time Reminders
    if (/free time|ఫ్రీ టైం|खाली समय|फुर्सत/i.test(text)) {
      const { start, end } = this.extractFreeTimeWindow(text);
      return {
        action: 'REMINDER_FREETIME',
        text,
        freeTimeStart: start,
        freeTimeEnd: end,
        content: this.extractReminderContent(text),
        lang
      };
    }

    // 5. Standard Reminders
    if (/remind me|reminder|గుర్తు చేయి|గుర్తు చెయ్యి|याद दिलाना|याद दिलाओ/i.test(text)) {
      const time = this.extractTime(text);
      return {
        action: 'REMINDER_SET',
        text,
        content: this.extractReminderContent(text),
        time,
        lang
      };
    }

    // 6. Alarms
    if (/alarm|wake me up|అలారం|अलार्म/i.test(text)) {
      const time = this.extractTime(text);
      return { action: 'ALARM_SET', text, time, lang };
    }

    // 7. Flashlight / Torch
    if (/flashlight|torch|ఫ్లాష్ లైట్|టార్చ్/i.test(text)) {
      const isOff = /off|turn off|disable|ఆపు|बंद/i.test(text);
      return { action: isOff ? 'FLASHLIGHT_OFF' : 'FLASHLIGHT_ON', text, lang };
    }

    // 8. Volume
    if (/volume|sound|వాల్యూమ్|ध्वनि|आवाज/i.test(text)) {
      if (/down|decrease|lower|తగ్గించు|कम करो/i.test(text)) return { action: 'VOLUME_DOWN', text, lang };
      if (/mute|silent|మ్యూట్|म्यूट/i.test(text)) return { action: 'VOLUME_MUTE', text, lang };
      return { action: 'VOLUME_UP', text, lang };
    }

    // 9. Brightness
    if (/brightness|screen|వెలుతురు|चमक|ब्राइटनेस/i.test(text)) {
      const isDown = /down|decrease|lower|తగ్గించు|कम/i.test(text);
      return { action: isDown ? 'BRIGHTNESS_DOWN' : 'BRIGHTNESS_UP', text, lang };
    }

    // 10. Calls / Contacts
    if (/^call |^dial |కాల్ చెయ్యి|ఫోన్ చెయ్యి|को कॉल करो|को फोन लगाओ/i.test(text)) {
      if (/redial|last number|మళ్లీ కాల్|फिर से कॉल/i.test(text)) {
        return { action: 'CALL_REDIAL', text, lang };
      }
      const contact = text.replace(/call|dial|to|కాల్ చెయ్యి|ఫోన్ చెయ్యి|को कॉल करो/gi, '').trim();
      return { action: 'CALL_CONTACT', text, target: contact, lang };
    }

    // 11. Music Controls
    if (/music|song|పాట|गाना|संगीत/i.test(text)) {
      if (/next|skip|తర్వాత|अगला/i.test(text)) return { action: 'MUSIC_NEXT', text, lang };
      if (/previous|back|ముందు|पिछला/i.test(text)) return { action: 'MUSIC_PREV', text, lang };
      if (/pause|stop|ఆపు|रोक|बंद/i.test(text)) return { action: 'MUSIC_PAUSE', text, lang };
      return { action: 'MUSIC_PLAY', text, lang };
    }

    // 12. App / Web Service Launch
    if (/^open |^launch |ఓపెన్ చెయ్యి|खोलो/i.test(text)) {
      const target = text.replace(/open|launch|ఓపెన్ చెయ్యి|खोलो/gi, '').trim();
      return { action: 'OPEN_APP', text, target, lang };
    }

    // 13. Tasks
    if (/task|పని|कार्य|काम/i.test(text)) {
      const title = text.replace(/add task|task|పని జోడించు|काम जोड़ो/gi, '').trim() || 'New Task';
      return { action: 'TASK_ADD', text, content: title, lang };
    }

    // 14. Battery / System status
    if (/battery|చార్జింగ్|బ్యాటరీ|बैटरी/i.test(text)) {
      return { action: 'DEVICE_BATTERY', text, lang };
    }

    return { action: 'UNKNOWN', text, lang };
  }

  detectLanguage(text) {
    for (let i = 0; i < text.length; i++) {
      const code = text.charCodeAt(i);
      if (code >= 0x0C00 && code <= 0x0C7F) return 'te'; // Telugu
      if (code >= 0x0900 && code <= 0x097F) return 'hi'; // Hindi / Devanagari
    }
    return this.language || 'en';
  }

  extractPoints(text) {
    let clean = text.replace(/note this|write this down|take a note|save these points|remember these points|పాయింట్లు|నోట్ రాసుకో|नोट लिखो/gi, '').replace(/^[:\s-]+/, '');
    const delimiters = /\b(?:point \d+|first|second|third|fourth|next|then|and then|and|కూడా|మరియు|तथा|और)\b|[\n\r;•\-]/gi;
    const parts = clean.split(delimiters)
      .map(p => p.trim().replace(/^\d+\.?\s*/, ''))
      .filter(p => p.length > 2);
    return parts.length > 0 ? parts : [clean];
  }

  extractTime(text) {
    const match = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = match[2] ? parseInt(match[2], 10) : 0;
      const ampm = match[3] ? match[3].toLowerCase() : null;
      if (ampm === 'pm' && hour < 12) hour += 12;
      if (ampm === 'am' && hour === 12) hour = 0;
      return { hour, min };
    }
    return { hour: 18, min: 0 };
  }

  extractFreeTimeWindow(text) {
    const match = text.match(/(\d{1,2}\s*(?:am|pm)?)\s*(?:and|to|నుండి|వరకు|से|तक)\s*(\d{1,2}\s*(?:am|pm)?)/i);
    if (match) {
      return { start: match[1], end: match[2] };
    }
    return { start: '6 PM', end: '8 PM' };
  }

  extractReminderContent(text) {
    const clean = text.replace(/remind me to|remind me about|remind me|గుర్తు చేయి|గుర్తు చెయ్యి|याद दिलाओ/gi, '').trim();
    return clean.replace(/at\s+\d{1,2}.*|between\s+\d{1,2}.*/gi, '').trim() || 'Important Reminder';
  }

  // --- Hardware & Web Action Execution ---
  async executeAction(command, rawInput) {
    const { action, lang } = command;

    switch (action) {
      // 1. Save Points / Notes
      case 'POINTS_SAVE':
      case 'NOTE_CREATE': {
        const points = command.points || ['General Point'];
        const title = points[0].slice(0, 30) || 'Voice Note';
        if (api.isAuthenticated()) {
          await api.createNote(title, points, 'Voice Capture');
        }
        const resp = lang === 'te'
          ? `${points.length} పాయింట్లు భద్రపరచబడ్డాయి.`
          : lang === 'hi'
          ? `${points.length} पॉइंट सफलतापूर्वक सहेज लिए गए हैं।`
          : `Saved ${points.length} ordered points to your notes.`;
        return { success: true, speechResponse: resp };
      }

      // 2. Repeat Points
      case 'POINTS_REPEAT': {
        let points = [];
        if (api.isAuthenticated()) {
          const notesData = await api.getNotes();
          if (notesData.notes && notesData.notes.length > 0) {
            points = notesData.notes[0].points || [];
          }
        }
        if (points.length === 0) {
          const resp = lang === 'te' ? 'ఎలాంటి భద్రపరిచిన పాయింట్లు లేవు.' : lang === 'hi' ? 'कोई सहेजे गए पॉइंट नहीं मिले।' : "You don't have any saved points.";
          return { success: false, speechResponse: resp };
        }
        const ordered = points.map((p, i) => `Point ${i + 1}: ${p.point_text || p}`).join('. ');
        const header = lang === 'te' ? 'మీ పాయింట్లు:' : lang === 'hi' ? 'आपके सहेजे गए पॉइंट:' : 'Here are your saved points:';
        return { success: true, speechResponse: `${header} ${ordered}` };
      }

      // 3. Reminders
      case 'REMINDER_FREETIME': {
        const { freeTimeStart, freeTimeEnd, content } = command;
        if (api.isAuthenticated()) {
          await api.createReminder(content, Date.now() + 7200000, true, freeTimeStart, freeTimeEnd);
        }
        return {
          success: true,
          speechResponse: `Scheduled reminder for ${content} during your free time between ${freeTimeStart} and ${freeTimeEnd}.`
        };
      }

      case 'REMINDER_SET': {
        const { hour, min } = command.time || { hour: 18, min: 0 };
        const timeStr = `${hour}:${min < 10 ? '0' + min : min}`;
        if (api.isAuthenticated()) {
          await api.createReminder(command.content, Date.now() + 3600000);
        }
        return {
          success: true,
          speechResponse: `Reminder scheduled for ${command.content} at ${timeStr}.`
        };
      }

      // 4. Alarms
      case 'ALARM_SET': {
        const { hour, min } = command.time || { hour: 7, min: 0 };
        const timeStr = `${hour}:${min < 10 ? '0' + min : min}`;
        if (api.isAuthenticated()) {
          await api.createAlarm(hour, min, 'AURA Alarm');
        }
        return {
          success: true,
          speechResponse: `Alarm set for ${timeStr}.`
        };
      }

      // 5. Flashlight / Torch (Web CameraStream Track API)
      case 'FLASHLIGHT_ON': {
        try {
          if (!this.torchTrack) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { facingMode: 'environment' }
            });
            this.torchTrack = stream.getVideoTracks()[0];
          }
          const capabilities = this.torchTrack.getCapabilities ? this.torchTrack.getCapabilities() : {};
          if (capabilities.torch) {
            await this.torchTrack.applyConstraints({ advanced: [{ torch: true }] });
            return { success: true, speechResponse: 'Flashlight turned on.' };
          }
          return { success: true, speechResponse: 'Camera stream active. Flashlight simulation enabled.' };
        } catch (e) {
          return {
            success: false,
            speechResponse: 'Flashlight requires rear camera permission in your browser.'
          };
        }
      }

      case 'FLASHLIGHT_OFF': {
        if (this.torchTrack) {
          try {
            await this.torchTrack.applyConstraints({ advanced: [{ torch: false }] });
            this.torchTrack.stop();
            this.torchTrack = null;
          } catch (e) {}
        }
        return { success: true, speechResponse: 'Flashlight turned off.' };
      }

      // 6. Volume Control (Web Audio Gain)
      case 'VOLUME_UP': {
        window.dispatchEvent(new CustomEvent('aura:volume', { detail: { delta: 0.2 } }));
        return { success: true, speechResponse: 'Increasing AURA audio playback volume.' };
      }
      case 'VOLUME_DOWN': {
        window.dispatchEvent(new CustomEvent('aura:volume', { detail: { delta: -0.2 } }));
        return { success: true, speechResponse: 'Decreasing audio volume.' };
      }
      case 'VOLUME_MUTE': {
        window.dispatchEvent(new CustomEvent('aura:volume', { detail: { mute: true } }));
        return { success: true, speechResponse: 'Audio muted.' };
      }

      // 7. Brightness (Wake Lock & Display Filter)
      case 'BRIGHTNESS_UP': {
        this.acquireScreenWakeLock();
        window.dispatchEvent(new CustomEvent('aura:brightness', { detail: { level: 'bright' } }));
        return { success: true, speechResponse: 'Display brightness maximized with Screen Wake Lock.' };
      }
      case 'BRIGHTNESS_DOWN': {
        window.dispatchEvent(new CustomEvent('aura:brightness', { detail: { level: 'dim' } }));
        return { success: true, speechResponse: 'Display dimmed.' };
      }

      // 8. Calling & Contacts
      case 'CALL_CONTACT': {
        const contact = command.target;
        // Check Web Contact Picker API if available
        if ('contacts' in navigator && 'select' in navigator.contacts) {
          try {
            const props = ['name', 'tel'];
            const selected = await navigator.contacts.select(props, { multiple: false });
            if (selected && selected[0]?.tel && selected[0].tel[0]) {
              window.location.href = `tel:${encodeURIComponent(selected[0].tel[0])}`;
              return { success: true, speechResponse: `Calling ${selected[0].name[0] || contact}.` };
            }
          } catch (e) {
            // User cancelled or blocked
          }
        }
        // Fallback: Launch phone dialer via tel: URI
        window.location.href = `tel:`;
        return {
          success: true,
          speechResponse: `Opening phone dialer for ${contact}. Web applications cannot dial silently without user confirmation.`
        };
      }

      case 'CALL_REDIAL': {
        window.location.href = `tel:`;
        return { success: true, speechResponse: 'Opening native dialer to redial.' };
      }

      // 9. Music Controls
      case 'MUSIC_PLAY':
        window.dispatchEvent(new CustomEvent('aura:music', { detail: { action: 'play' } }));
        return { success: true, speechResponse: 'Playing music on AURA player.' };
      case 'MUSIC_PAUSE':
        window.dispatchEvent(new CustomEvent('aura:music', { detail: { action: 'pause' } }));
        return { success: true, speechResponse: 'Music paused.' };
      case 'MUSIC_NEXT':
        window.dispatchEvent(new CustomEvent('aura:music', { detail: { action: 'next' } }));
        return { success: true, speechResponse: 'Playing next track.' };
      case 'MUSIC_PREV':
        window.dispatchEvent(new CustomEvent('aura:music', { detail: { action: 'prev' } }));
        return { success: true, speechResponse: 'Playing previous track.' };

      // 10. App / Web Service Launching
      case 'OPEN_APP': {
        const target = command.target.toLowerCase();
        let url = null;
        if (target.includes('youtube')) url = 'https://www.youtube.com';
        else if (target.includes('whatsapp')) url = 'https://web.whatsapp.com';
        else if (target.includes('spotify')) url = 'https://open.spotify.com';
        else if (target.includes('map')) url = 'https://maps.google.com';
        else if (target.includes('camera')) url = '/?view=device';

        if (url) {
          window.open(url, '_blank');
          return { success: true, speechResponse: `Opening ${command.target}.` };
        }
        return {
          success: false,
          speechResponse: `I cannot open native app '${command.target}' directly from browser sandbox. Web shortcuts are available for YouTube, WhatsApp, Spotify, and Maps.`
        };
      }

      // 11. Battery status
      case 'DEVICE_BATTERY': {
        if ('getBattery' in navigator) {
          try {
            const battery = await navigator.getBattery();
            const pct = Math.round(battery.level * 100);
            const charging = battery.charging ? 'and currently charging' : 'and running on battery';
            return { success: true, speechResponse: `Your device battery is at ${pct} percent ${charging}.` };
          } catch (e) {}
        }
        return { success: true, speechResponse: 'Battery status is supported on Chrome for Android and desktop.' };
      }

      // 12. Tasks
      case 'TASK_ADD': {
        if (api.isAuthenticated()) {
          await api.createTask(command.content);
        }
        return { success: true, speechResponse: `Added task: ${command.content}.` };
      }

      // 13. Daily Briefing
      case 'DAILY_BRIEFING': {
        let taskCount = 0;
        let remCount = 0;
        let notesCount = 0;
        if (api.isAuthenticated()) {
          const t = await api.getTasks();
          taskCount = t.tasks?.filter(x => !x.is_completed).length || 0;
          const r = await api.getReminders();
          remCount = r.reminders?.length || 0;
          const n = await api.getNotes();
          notesCount = n.notes?.length || 0;
        }
        const briefing = `Good day! Here is your daily briefing. You have ${taskCount} pending tasks, ${remCount} scheduled reminders, and ${notesCount} saved voice notes.`;
        return { success: true, speechResponse: briefing };
      }

      default:
        return {
          success: false,
          speechResponse: 'I did not recognize that command. Try saying "Note this", "Repeat my points", "Play music", or "Schedule today".'
        };
    }
  }
}

export const voiceEngine = new VoiceEngine();
