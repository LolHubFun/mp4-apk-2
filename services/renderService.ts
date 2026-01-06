import { RenderConfig, LogEntry } from '../types';
import { Capacitor } from '@capacitor/core';
import { Ffmpegkit } from 'capacitor-ffmpeg-kit';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Helper to convert File/Blob to Base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        // Remove the "data:*/*;base64," prefix for Capacitor
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

/**
 * Native Render Function (Runs on Android/iOS)
 */
const nativeRender = async (
  config: RenderConfig,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Initializing Native Engine...", type: 'info' });

    if (!config.visualFile || !config.audioFile) {
        throw new Error("Missing files");
    }

    // 1. Write files to Cache Directory
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Writing files to device cache...", type: 'info' });
    
    const visualFileName = `input_visual.${config.visualFile.name.split('.').pop()}`;
    const audioFileName = `input_audio.${config.audioFile.name.split('.').pop()}`;
    const outputFileName = `output_${Date.now()}.mp4`;

    await Filesystem.writeFile({
        path: visualFileName,
        data: await fileToBase64(config.visualFile),
        directory: Directory.Cache
    });

    await Filesystem.writeFile({
        path: audioFileName,
        data: await fileToBase64(config.audioFile),
        directory: Directory.Cache
    });

    // Get full URI for FFmpeg
    const visualUri = await Filesystem.getUri({ path: visualFileName, directory: Directory.Cache });
    const audioUri = await Filesystem.getUri({ path: audioFileName, directory: Directory.Cache });
    const outputUri = await Filesystem.getUri({ path: outputFileName, directory: Directory.Cache });
    
    // Convert file:// paths to internal paths if necessary, but FFmpeg plugin usually handles cache paths better via direct integration
    // For this specific plugin, we often pass the direct cache paths.
    // However, let's use the standard ffmpeg command structure.

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Starting FFmpeg Process...", type: 'warning' });

    // 2. Construct FFmpeg Command
    // -loop 1 : Loop the image
    // -i ... : Input files
    // -c:v libx264 : Video codec
    // -tune stillimage : Optimization for static images
    // -c:a copy : Copy audio without re-encoding (FAST)
    // -shortest : Stop when the shortest input (audio) ends
    // -pix_fmt yuv420p : Standard pixel format for compatibility
    
    // Note: The plugin might require specific path formats. 
    // Usually using 'cacheDirectory' reference or direct paths.
    // Let's assume standard file paths for now.
    
    // Important: The FFmpeg plugin usually expects inputs relative to a accessible scope or absolute paths.
    // We will use the cache directory path which is standard on Android.
    
    const cmd = `-y -loop 1 -i ${visualUri.uri} -i ${audioUri.uri} -c:v libx264 -preset ultrafast -tune stillimage -c:a copy -shortest -pix_fmt yuv420p ${outputUri.uri}`;
    
    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Command: ${cmd}`, type: 'info' });

    // 3. Execute
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Executing Native FFmpeg Command...", type: 'warning' });
    
    // Execute using capacitor-ffmpeg-kit
    // Note: The 'name' parameter helps identify the session in logs
    await Ffmpegkit.exec({ 
        command: cmd, 
        name: `render_${Date.now()}` 
    });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Render Complete!", type: 'success' });
    
    return outputUri.uri;

  } catch (error: any) {
      onLog({ timestamp: new Date().toLocaleTimeString(), message: `Error: ${error.message}`, type: 'error' });
      throw error;
  }
};

/**
 * Web Simulation (Runs in Browser)
 */
export const simulateNativeRender = (
  config: RenderConfig,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    let progress = 0;
    
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "[WEB] Starting Simulation...", type: 'info' });
    
    if (!config.visualFile || !config.audioFile) {
        reject("Files missing");
        return;
    }

    const interval = setInterval(() => {
      progress += Math.random() * 10;
      
      if (progress > 20 && progress < 30) onLog({ timestamp: new Date().toLocaleTimeString(), message: "[WEB] Encoding (Simulated)...", type: 'info' });
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        onLog({ timestamp: new Date().toLocaleTimeString(), message: "[WEB] Done.", type: 'success' });
        resolve("blob:fake-video-url"); 
      }
      
      onProgress(Math.min(Math.floor(progress), 100));
    }, 200);
  });
};

// Main Export
export const renderVideo = (
    config: RenderConfig,
    onLog: (log: LogEntry) => void,
    onProgress: (progress: number) => void
): Promise<string> => {
    if (Capacitor.isNativePlatform()) {
        return nativeRender(config, onLog, onProgress);
    } else {
        return simulateNativeRender(config, onLog, onProgress);
    }
};