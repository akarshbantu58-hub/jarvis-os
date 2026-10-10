package com.akcreations.jarvisos

import android.Manifest
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.speech.RecognitionListener
import android.speech.tts.TextToSpeech
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
import java.util.Locale

private val Ink = Color(0xFF080D17)
private val Glass = Color(0xFF121D2D)
private val Cyan = Color(0xFF00E5FF)

class MainActivity : ComponentActivity(), TextToSpeech.OnInitListener {
    private var tts: TextToSpeech? = null
    private var speechRecognizer: SpeechRecognizer? = null
    private var onSpeechResult: ((String) -> Unit)? = null
    private val micPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { granted ->
        if (granted) startNativeListening() else statusUpdate?.invoke("Microphone permission was denied. Allow it in Android Settings.")
    }
    private var statusUpdate: ((String) -> Unit)? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)
        setContent {
            var prompt by remember { mutableStateOf("") }
            var status by remember { mutableStateOf("Native Kotlin assistant ready") }
            val messages = remember { mutableStateListOf("JARVIS: Welcome. This is the native AK Creations build.") }
            statusUpdate = { status = it }
            onSpeechResult = { spoken -> prompt = spoken; messages.add("YOU: $spoken"); status = "Voice captured" }
            MaterialTheme(colorScheme = darkColorScheme(primary = Cyan, background = Ink, surface = Glass)) {
                Surface(Modifier.fillMaxSize(), color = Ink) {
                    Column(Modifier.fillMaxSize().padding(20.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                        Text("JARVIS OS", color = Cyan, fontSize = 28.sp)
                        Text("AK CREATIONS  /  NATIVE ANDROID", color = Color.LightGray, fontSize = 11.sp)
                        Card(colors = CardDefaults.cardColors(containerColor = Glass), shape = RoundedCornerShape(24.dp)) {
                            Column(Modifier.fillMaxWidth().padding(18.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                                Text("SYSTEM STATUS", color = Cyan)
                                Text(status, color = Color.White)
                                Button(onClick = { requestMicAndListen() }, modifier = Modifier.fillMaxWidth()) { Text("🎙  Speak to JARVIS") }
                                OutlinedButton(onClick = { requestPermission(Manifest.permission.CAMERA) { status = "Camera permission granted. Camera capture UI is not yet connected." } }, modifier = Modifier.fillMaxWidth()) { Text("Camera permission") }
                                OutlinedButton(onClick = { requestPermission(Manifest.permission.ACCESS_FINE_LOCATION) { status = "Location permission granted." } }, modifier = Modifier.fillMaxWidth()) { Text("Location permission") }
                            }
                        }
                        Text("CONVERSATION", color = Cyan)
                        LazyColumn(Modifier.weight(1f).fillMaxWidth().background(Glass, RoundedCornerShape(18.dp)).padding(12.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            items(messages) { Text(it, color = Color.White) }
                        }
                        OutlinedTextField(value = prompt, onValueChange = { prompt = it }, label = { Text("Ask JARVIS") }, modifier = Modifier.fillMaxWidth())
                        Button(onClick = { if (prompt.isNotBlank()) { messages.add("YOU: $prompt"); val answer = handleLocalCommand(prompt); messages.add("JARVIS: $answer"); tts?.speak(answer, TextToSpeech.QUEUE_FLUSH, null, "jarvis-reply"); prompt = "" } }, modifier = Modifier.fillMaxWidth()) { Text("Send") }
                        Text("Native Kotlin foundation • No website wrapper • AK Creations", color = Color.Gray, fontSize = 10.sp)
                    }
                }
            }
        }
    }

    private fun requestMicAndListen() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO) == PackageManager.PERMISSION_GRANTED) startNativeListening()
        else micPermission.launch(Manifest.permission.RECORD_AUDIO)
    }

    private fun requestPermission(permission: String, granted: () -> Unit) {
        registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok -> if (ok) granted() else statusUpdate?.invoke("Permission denied: $permission") }.launch(permission)
    }

    private fun startNativeListening() {
        if (!SpeechRecognizer.isRecognitionAvailable(this)) { statusUpdate?.invoke("Android speech recognition is unavailable on this device."); return }
        speechRecognizer?.destroy()
        speechRecognizer = SpeechRecognizer.createSpeechRecognizer(this).apply {
            setRecognitionListener(object : RecognitionListener {
                override fun onReadyForSpeech(params: Bundle?) { statusUpdate?.invoke("Listening…") }
                override fun onResults(results: Bundle?) { val text = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)?.firstOrNull(); if (text != null) onSpeechResult?.invoke(text); statusUpdate?.invoke("Speech captured") }
                override fun onError(error: Int) { statusUpdate?.invoke("Speech recognition error ($error). Check internet and Android speech services.") }
                override fun onBeginningOfSpeech() {}
                override fun onBufferReceived(buffer: ByteArray?) {}
                override fun onEndOfSpeech() {}
                override fun onEvent(eventType: Int, params: Bundle?) {}
                override fun onPartialResults(partialResults: Bundle?) {}
                override fun onRmsChanged(rmsdB: Float) {}
            })
            val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH).apply { putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM); putExtra(RecognizerIntent.EXTRA_LANGUAGE, Locale.getDefault()); putExtra(RecognizerIntent.EXTRA_PROMPT, "Speak to JARVIS") }
            startListening(intent)
        }
    }

    private fun handleLocalCommand(input: String): String = when {
        input.startsWith("open ", ignoreCase = true) -> "Native app launching will be added in the device-control module."
        input.contains("hello", ignoreCase = true) || input.contains("hi", ignoreCase = true) -> "Hello. JARVIS native core is online."
        else -> "I received: $input. AI provider integration is the next native module; no API key is configured in this build."
    }

    override fun onInit(status: Int) { if (status == TextToSpeech.SUCCESS) tts?.language = Locale.getDefault() }
    override fun onDestroy() { speechRecognizer?.destroy(); tts?.shutdown(); super.onDestroy() }
}
