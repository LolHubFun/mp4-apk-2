import { RenderConfig, LogEntry } from '../types';
import { Ffmpegkit } from 'capacitor-ffmpeg-kit';
import { Filesystem, Directory } from '@capacitor/filesystem';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};

export const renderVideo = async (
  config: RenderConfig,
  onLog: (log: LogEntry) => void,
  onProgress: (progress: number) => void
): Promise<string> => {
  try {
    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Starting Native High-Speed Engine...", type: 'info' });

    if (!config.visualFile || !config.audioFile) throw new Error("Files missing");

    // 1. Write to Cache
    const visualExt = config.visualFile.name.split('.').pop();
    const audioExt = config.audioFile.name.split('.').pop();
    const visualFileName = `input_visual.${visualExt}`;
    const audioFileName = `input_audio.${audioExt}`;
    const outputFileName = `video_${Date.now()}.mp4`;

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

    const visualUri = await Filesystem.getUri({ path: visualFileName, directory: Directory.Cache });
    const audioUri = await Filesystem.getUri({ path: audioFileName, directory: Directory.Cache });
    const outputUri = await Filesystem.getUri({ path: outputFileName, directory: Directory.Cache });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Native resources ready. Rendering...", type: 'warning' });

    // 2. Resolve Resolution to Width/Height
    let scale = "1280:720"; // default
    if (config.resolution === '480p') scale = "854:480";
    if (config.resolution === '720p') scale = "1280:720";
    if (config.resolution === '1080p') scale = "1920:1080";

    // 3. Command with Dynamic Resolution and High Performance
    // -vf scale: Apply the selected resolution
    // -r: Set frames per second (e.g. 24)
    const cmd = `-y -loop 1 -i ${visualUri.uri} -i ${audioUri.uri} -vf scale=${scale} -r ${config.fps || 24} -c:v mpeg4 -q:v 5 -preset ultrafast -c:a aac -shortest ${outputUri.uri}`;

    onLog({ timestamp: new Date().toLocaleTimeString(), message: `Rendering at ${config.resolution}...`, type: 'info' });

    await Ffmpegkit.exec({ 
        command: cmd, 
        name: `render_${Date.now()}` 
    });

    onLog({ timestamp: new Date().toLocaleTimeString(), message: "Native Render Success!", type: 'success' });
    
    return outputUri.uri;

  } catch (error: any) {
      onLog({ timestamp: new Date().toLocaleTimeString(), message: `Native Error: ${error.message}`, type: 'error' });
      throw error;
  }
};