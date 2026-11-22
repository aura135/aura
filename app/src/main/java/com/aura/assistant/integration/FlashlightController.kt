package com.aura.assistant.integration

import android.content.Context
import android.hardware.camera2.CameraAccessException
import android.hardware.camera2.CameraCharacteristics
import android.hardware.camera2.CameraManager
import android.os.Build

class FlashlightController(private val context: Context) {
    private val cameraManager = context.getSystemService(Context.CAMERA_SERVICE) as CameraManager
    private var isTorchOn = false

    fun setTorch(enable: Boolean): Pair<Boolean, String> {
        try {
            val cameraId = getCameraWithFlash() ?: return Pair(false, "Flashlight is not available on this device.")
            cameraManager.setTorchMode(cameraId, enable)
            isTorchOn = enable
            val status = if (enable) "turned on" else "turned off"
            return Pair(true, "Flashlight $status.")
        } catch (e: CameraAccessException) {
            return Pair(false, "Could not access camera flash: ${e.message}")
        } catch (e: Exception) {
            return Pair(false, "Error operating flashlight: ${e.message}")
        }
    }

    private fun getCameraWithFlash(): String? {
        try {
            for (id in cameraManager.cameraIdList) {
                val characteristics = cameraManager.getCameraCharacteristics(id)
                val hasFlash = characteristics.get(CameraCharacteristics.FLASH_INFO_AVAILABLE) ?: false
                val facing = characteristics.get(CameraCharacteristics.LENS_FACING)
                if (hasFlash && facing == CameraCharacteristics.LENS_FACING_BACK) {
                    return id
                }
            }
        } catch (e: Exception) {
            // fallback
        }
        return cameraManager.cameraIdList.firstOrNull()
    }
}
