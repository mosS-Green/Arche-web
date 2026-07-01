import React, { useState, useEffect, useRef } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { 
  Camera, Mic, X, Check, Loader2, Square, 
  RefreshCw, Send, AlertCircle, FileText, Sparkles,
  Play, Pause
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { categorizeContent, structureContent } from '../lib/gemini';
import { supabase } from '../lib/supabase';

interface SmartCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialIntent?: {
    type: 'none' | 'qs_camera' | 'share';
    mimeType?: string;
    text?: string;
    imageUri?: string;
    imageBase64?: string;
  } | null;
}

type ModeType = 'choice' | 'camera' | 'microphone' | 'preview_image' | 'preview_audio' | 'preview_text' | 'processing' | 'success' | 'error';

export const SmartCaptureModal: React.FC<SmartCaptureModalProps> = ({
  isOpen,
  onClose,
  initialIntent
}) => {
  const { userId, addToast, loadPersonalData, loadWorkData } = useApp();
  
  const [mode, setMode] = useState<ModeType>('choice');
  const [comment, setComment] = useState('');
  
  // Media capture states
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  
  const [capturedBase64, setCapturedBase64] = useState<string | null>(null);
  const [capturedType, setCapturedType] = useState<'image' | 'audio' | 'none'>('none');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Stepper states for Gemini processing
  const [activeStep, setActiveStep] = useState(1);
  const [stepStatus, setStepStatus] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioIntervalRef = useRef<number | null>(null);
  
  // Audio Visualizer refs
  const waveformCanvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Process initialIntent on change
  useEffect(() => {
    if (isOpen) {
      setErrorMsg(null);
      setComment('');
      setCapturedBase64(null);
      setAudioUrl(null);
      
      if (initialIntent && initialIntent.type === 'share') {
        if (initialIntent.imageBase64) {
          setCapturedBase64(initialIntent.imageBase64);
          setCapturedType('image');
          setMode('preview_image');
        } else if (initialIntent.text) {
          setComment(initialIntent.text);
          setCapturedType('none');
          setMode('preview_text');
        }
      } else {
        setMode('camera');
        startCamera();
      }
    } else {
      cleanupMedia();
    }
  }, [isOpen, initialIntent]);

  // Audio timer
  useEffect(() => {
    if (isRecording && !isPaused) {
      audioIntervalRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (audioIntervalRef.current) {
        clearInterval(audioIntervalRef.current);
      }
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Audio Visualizer drawing loop
  useEffect(() => {
    if (mode === 'microphone' && isRecording && analyserRef.current && waveformCanvasRef.current) {
      const canvas = waveformCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const draw = () => {
        if (mode !== 'microphone') return;
        animFrameRef.current = requestAnimationFrame(draw);
        
        analyser.getByteFrequencyData(dataArray);
        
        if (ctx) {
          // Dark background overlay with decay trail effect
          ctx.fillStyle = 'rgba(16, 20, 24, 0.35)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const barWidth = (canvas.width / bufferLength) * 1.5;
          let x = 0;
          
          // Use active theme personal accent color
          const accentColor = getComputedStyle(document.documentElement)
            .getPropertyValue('--color-accent-personal').trim() || 'oklch(0.75 0.13 185)';
          
          for (let i = 0; i < bufferLength; i++) {
            const barHeight = (dataArray[i] / 255) * (canvas.height * 0.85);
            
            ctx.fillStyle = accentColor;
            const y = (canvas.height - barHeight) / 2;
            
            // Draw rounded or solid vertical bars
            ctx.fillRect(x, y, barWidth - 2, barHeight);
            x += barWidth;
          }
        }
      };
      
      draw();
    }
    
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [mode, isRecording, isPaused]);

  const cleanupMedia = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    if (mediaRecorder) {
      if (mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
      }
      setMediaRecorder(null);
    }
    if (audioIntervalRef.current) {
      clearInterval(audioIntervalRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
    
    // Visualizer cleanup
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (audioCtxRef.current) {
      if (audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
      audioCtxRef.current = null;
    }
    analyserRef.current = null;
  };

  // Camera Actions
  const startCamera = async () => {
    setErrorMsg(null);
    try {
      cleanupMedia();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access denied:', err);
      setErrorMsg('Camera access denied. Switching to voice recorder...');
      setMode('microphone');
      startRecording();
    }
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    if (!context) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedBase64(base64);
    setCapturedType('image');
    setMode('preview_image');
    cleanupMedia();
  };

  // Microphone Actions
  const startRecording = async () => {
    setErrorMsg(null);
    setIsPaused(false);
    try {
      cleanupMedia();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // MimeType detection
      let recordMimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        recordMimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        recordMimeType = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        recordMimeType = 'audio/mp4';
      }

      console.log(`[MediaRecorder] Initializing with codec: ${recordMimeType}`);
      const recorder = new MediaRecorder(stream, { mimeType: recordMimeType });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: recordMimeType });
        setAudioUrl(URL.createObjectURL(blob));
        
        // Convert blob to Base64 for Gemini
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = () => {
          setCapturedBase64(reader.result as string);
          setCapturedType('audio');
          setMode('preview_audio');
        };

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      // Web Audio Analyser setup for waveform visualization
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Fewer bins for bolder visualizer lines
      source.connect(analyser);
      
      audioCtxRef.current = audioCtx;
      analyserRef.current = analyser;

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setErrorMsg('Could not access microphone. Switching to camera...');
      setMode('camera');
      startCamera();
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.pause();
      setIsPaused(true);
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
      mediaRecorder.resume();
      setIsPaused(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && (mediaRecorder.state === 'recording' || mediaRecorder.state === 'paused')) {
      mediaRecorder.stop();
      setIsRecording(false);
      setIsPaused(false);
    }
  };

  // Gemini & Supabase Pipeline Submit
  const handleProcessAndInsert = async () => {
    if (!userId) {
      addToast('error', 'Auth Error', 'No active user profile found.');
      return;
    }

    setMode('processing');
    setActiveStep(1);
    setStepStatus('Categorizing your content...');

    try {
      // Step 1: Categorization (Thinking Level: Medium)
      const catResult = await categorizeContent(
        capturedType,
        capturedBase64,
        comment
      );

      if (!catResult.categories || catResult.categories.length === 0) {
        addToast('info', 'No Action Taken', 'The AI did not find any matching category for this content.');
        setMode('camera');
        startCamera();
        return;
      }

      setActiveStep(2);
      setStepStatus(`Extracting fields for: ${catResult.categories.join(', ')}...`);

      // Step 2: Structured extraction (Thinking Level: High)
      const dataResult = await structureContent(
        catResult.categories,
        capturedType,
        capturedBase64,
        comment
      );

      setActiveStep(3);
      setStepStatus('Saving entries to Supabase database...');

      let insertedCount = 0;
      let hasWorkData = false;
      let hasPersonalData = false;

      // Iterate categories and push to Supabase in bulk
      for (const table of Object.keys(dataResult)) {
        const entries = dataResult[table];
        if (entries && entries.length > 0) {
          const formattedEntries = entries.map((entry) => ({
            ...entry,
            user_id: userId,
            created_at: new Date().toISOString()
          }));

          const { error } = await supabase.from(table).insert(formattedEntries);
          if (error) {
            console.error(`Error inserting into ${table}:`, error);
            throw new Error(`Failed to push data to table: ${table}. ${error.message}`);
          }
          
          insertedCount += formattedEntries.length;
          if (table.startsWith('work_')) {
            hasWorkData = true;
          } else {
            hasPersonalData = true;
          }
        }
      }

      if (insertedCount === 0) {
        throw new Error("No database records were extracted by the AI.");
      }

      // Reload UI states forcing reload of personal/work data
      if (hasPersonalData) await loadPersonalData(true);
      if (hasWorkData) await loadWorkData(true);

      setActiveStep(4);
      setStepStatus(`Successfully logged ${insertedCount} entries!`);
      setMode('success');
      
      addToast('success', 'Smart Capture Complete', `Inserted ${insertedCount} database logs via AI.`);
      
      // Auto close after 2.5s
      setTimeout(() => {
        onClose();
      }, 2500);

    } catch (err: any) {
      console.error('Smart Capture Pipeline failed:', err);
      setErrorMsg(err.message || 'An error occurred during Gemini AI processing.');
      setMode('error'); // Toggle to error state
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        {/* Only render backdrop when not in fullscreen camera or mic modes */}
        {mode !== 'camera' && mode !== 'microphone' && (
          <Dialog.Overlay className="fixed inset-0 bg-bg/85 backdrop-blur-md z-50 transition-opacity" />
        )}
        <Dialog.Content 
          className={
            mode === 'camera' || mode === 'microphone'
              ? "fixed inset-0 bg-black text-ink-primary z-50 outline-none w-full h-full flex flex-col justify-between overflow-hidden"
              : "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-surface border border-surface rounded-2xl p-6 md:p-8 shadow-2xl z-50 outline-none max-h-[90vh] overflow-y-auto"
          }
          onOpenAutoFocus={() => {
            // Let input handle focus if present
          }}
        >
          {/* Header (Hidden in Fullscreen views) */}
          {mode !== 'camera' && mode !== 'microphone' && (
            <div className="flex items-center justify-between pb-4 border-b border-surface/50 mb-6">
              <Dialog.Title className="text-xl font-display font-medium text-ink-primary flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent-personal animate-pulse" />
                Smart Capture
              </Dialog.Title>
              <Dialog.Close 
                onClick={cleanupMedia}
                className="p-1 rounded-full text-ink-muted hover:text-ink-primary hover:bg-surface-hover transition-colors duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </Dialog.Close>
            </div>
          )}

          {/* Error Message banner (only in preview and other standard modes) */}
          {errorMsg && mode !== 'error' && mode !== 'camera' && mode !== 'microphone' && (
            <div className="bg-danger/10 border border-danger/25 text-danger rounded-xl p-4 mb-6 flex items-start gap-2.5 text-xs font-mono">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* CONTENT MODES */}
          
          {/* Mode 2: Camera View */}
          {mode === 'camera' && (
            <div className="relative w-full h-full bg-black flex flex-col justify-end">
              {/* Fullscreen Video */}
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="absolute inset-0 w-full h-full object-cover z-0"
              />
              <canvas ref={canvasRef} className="hidden" />

              {/* Clean bottom controls */}
              <div className="relative z-10 flex justify-around items-center px-8 py-10 bg-gradient-to-t from-black/85 to-transparent w-full">
                {/* Close/Cancel */}
                <button
                  onClick={() => {
                    cleanupMedia();
                    onClose();
                  }}
                  className="p-4 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md rounded-full text-white cursor-pointer transition-colors"
                  title="Close Camera"
                >
                  <X className="w-6 h-6" />
                </button>

                {/* Capture snapshot */}
                <button
                  onClick={captureSnapshot}
                  className="w-20 h-20 bg-white hover:bg-white/90 active:scale-95 border-4 border-white/20 rounded-full flex items-center justify-center cursor-pointer transition-all duration-150 animate-fade-in"
                  aria-label="Capture Photo"
                >
                  <div className="w-16 h-16 bg-white border border-black/10 rounded-full" />
                </button>

                {/* Switch to Voice */}
                <button
                  onClick={() => {
                    cleanupMedia();
                    setMode('microphone');
                    startRecording();
                  }}
                  className="p-4 bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md rounded-full text-white cursor-pointer transition-colors"
                  title="Switch to Voice Recording"
                >
                  <Mic className="w-6 h-6 text-accent-personal" />
                </button>
              </div>
            </div>
          )}

          {/* Mode 3: Microphone View */}
          {mode === 'microphone' && (
            <div className="relative w-full h-full bg-bg flex flex-col justify-between p-8">
              {/* Header spacer or info */}
              <div className="pt-8 text-center">
                <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest">
                  Smart Audio Capture
                </span>
              </div>

              {/* Waveform visualizer */}
              <div className="flex flex-col items-center justify-center flex-1 space-y-6">
                <div className="relative w-full max-w-sm flex items-center justify-center">
                  {/* Waveform Canvas */}
                  <canvas
                    ref={waveformCanvasRef}
                    className="w-full h-32 rounded-2xl bg-surface/30 border border-surface/50"
                    width={320}
                    height={128}
                  />
                  {/* Glowing center indicator */}
                  {!isPaused && (
                    <div className="absolute w-6 h-6 bg-accent-personal/20 rounded-full animate-ping pointer-events-none" />
                  )}
                </div>

                <div className="text-center space-y-2">
                  <span className="block text-3xl font-mono text-ink-primary font-semibold tracking-wider">
                    {formatTime(recordingSeconds)}
                  </span>
                  <span className="text-[10px] font-mono text-ink-muted uppercase tracking-widest animate-pulse">
                    {isPaused ? 'RECORDING PAUSED' : 'RECORDING ACTIVE'}
                  </span>
                </div>
              </div>

              {/* Bottom controls */}
              <div className="flex justify-center items-center gap-6 pb-8">
                {/* Cancel and switch back to camera */}
                <button
                  onClick={() => {
                    cleanupMedia();
                    setMode('camera');
                    startCamera();
                  }}
                  className="p-4 bg-surface hover:bg-surface-hover rounded-full text-ink-secondary hover:text-ink-primary cursor-pointer transition-colors"
                  title="Cancel and switch to camera"
                >
                  <Camera className="w-5 h-5" />
                </button>

                {/* Pause / Resume */}
                <button
                  onClick={isPaused ? resumeRecording : pauseRecording}
                  className="p-5 bg-surface hover:bg-surface-hover rounded-full text-accent-personal cursor-pointer transition-colors"
                  title={isPaused ? "Resume Recording" : "Pause Recording"}
                >
                  {isPaused ? <Play className="w-6 h-6 fill-accent-personal" /> : <Pause className="w-6 h-6 fill-accent-personal" />}
                </button>

                {/* Stop & save */}
                <button
                  onClick={stopRecording}
                  className="p-5 bg-danger text-bg hover:bg-danger/90 rounded-full cursor-pointer transition-transform hover:scale-105 active:scale-95"
                  title="Stop and process audio"
                >
                  <Square className="w-5 h-5 fill-bg stroke-none" />
                </button>
              </div>
            </div>
          )}

          {/* Mode 4: Preview Image */}
          {mode === 'preview_image' && (
            <div className="space-y-6">
              {capturedBase64 && (
                <div className="relative aspect-[3/4] max-h-[50vh] rounded-xl overflow-hidden border border-surface shadow-md">
                  <img src={capturedBase64} alt="Captured preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => {
                      setCapturedBase64(null);
                      setMode('camera');
                      startCamera();
                    }}
                    className="absolute top-3 right-3 p-2 bg-bg/80 hover:bg-bg rounded-full text-ink-primary transition-colors cursor-pointer"
                    title="Retake photo"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Optional Comment */}
              <div className="space-y-2">
                <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Add context / Comments (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="e.g. Remember to buy this layout schematic, assign work task to Dave..."
                  rows={3}
                  className="w-full bg-surface/40 border border-surface rounded-xl px-4 py-3 text-sm text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                />
              </div>

              <div className="flex justify-between gap-4 pt-2">
                <button
                  onClick={() => {
                    cleanupMedia();
                    setMode('camera');
                    startCamera();
                  }}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-hover rounded-xl text-xs font-mono uppercase text-ink-secondary cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={handleProcessAndInsert}
                  className="px-6 py-2.5 bg-accent-personal text-bg rounded-xl text-xs font-mono uppercase font-semibold hover:bg-accent-personal/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Send to AI
                </button>
              </div>
            </div>
          )}

          {/* Mode 5: Preview Audio */}
          {mode === 'preview_audio' && (
            <div className="space-y-6">
              <div className="bg-surface/40 border border-surface rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-accent-work/10 text-accent-work rounded-lg">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-display font-medium text-ink-primary">Voice Recording</p>
                    <p className="text-[10px] font-mono text-ink-muted">Audio captured successfully</p>
                  </div>
                </div>
                {audioUrl && (
                  <audio src={audioUrl} controls className="max-w-[200px] h-8 outline-none" />
                )}
                <button
                  onClick={() => {
                    setCapturedBase64(null);
                    setAudioUrl(null);
                    setMode('microphone');
                    startRecording();
                  }}
                  className="p-2 hover:bg-surface-hover rounded-full text-ink-secondary hover:text-ink-primary cursor-pointer transition-colors"
                  title="Record again"
                >
                  <RefreshCw className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Optional Comment */}
              <div className="space-y-2">
                <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Add notes / Context (Optional)</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Additional instructions or comment..."
                  rows={3}
                  className="w-full bg-surface/40 border border-surface rounded-xl px-4 py-3 text-sm text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                />
              </div>

              <div className="flex justify-between gap-4 pt-2">
                <button
                  onClick={() => {
                    cleanupMedia();
                    setMode('camera');
                    startCamera();
                  }}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-hover rounded-xl text-xs font-mono uppercase text-ink-secondary cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={handleProcessAndInsert}
                  className="px-6 py-2.5 bg-accent-work text-bg rounded-xl text-xs font-mono uppercase font-semibold hover:bg-accent-work/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Send to AI
                </button>
              </div>
            </div>
          )}

          {/* Mode 6: Preview Text (Shared Links/Notes) */}
          {mode === 'preview_text' && (
            <div className="space-y-6">
              <div className="bg-surface/30 border border-surface rounded-2xl p-5 space-y-2 flex flex-col">
                <span className="text-[10px] font-mono uppercase text-accent-personal tracking-wider flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Shared Content
                </span>
                <p className="text-sm font-sans text-ink-primary leading-relaxed break-words whitespace-pre-wrap max-h-40 overflow-y-auto pr-1">
                  {comment}
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-mono tracking-wider uppercase text-ink-muted">Add comments / Context (Optional)</label>
                <textarea
                  placeholder="Add details, directives, or category notes before submitting..."
                  rows={2}
                  className="w-full bg-surface/40 border border-surface rounded-xl px-4 py-3 text-sm text-ink-primary outline-none focus:border-accent-personal transition-colors resize-none font-sans"
                  onChange={(e) => setComment(e.target.value)}
                  value={comment}
                />
              </div>

              <div className="flex justify-between gap-4 pt-2">
                <button
                  onClick={() => {
                    cleanupMedia();
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-hover rounded-xl text-xs font-mono uppercase text-ink-secondary cursor-pointer"
                >
                  Reset
                </button>
                <button
                  onClick={handleProcessAndInsert}
                  className="px-6 py-2.5 bg-accent-personal text-bg rounded-xl text-xs font-mono uppercase font-semibold hover:bg-accent-personal/90 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Parse shared content
                </button>
              </div>
            </div>
          )}

          {/* Mode 7: Processing Stepper */}
          {mode === 'processing' && (
            <div className="space-y-8 py-6">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-8 h-8 text-accent-personal animate-spin" />
                <p className="text-sm font-display font-medium text-ink-primary text-center">
                  Processing with Gemini AI
                </p>
                <p className="text-[10px] font-mono text-ink-muted uppercase tracking-wider animate-pulse">
                  {stepStatus}
                </p>
              </div>

              {/* Progress Stepper UI */}
              <div className="max-w-xs mx-auto space-y-4 border-t border-surface/50 pt-6">
                {/* Step 1 */}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                    activeStep > 1 ? 'bg-accent-personal border-accent-personal text-bg' :
                    activeStep === 1 ? 'border-accent-personal text-accent-personal animate-pulse' :
                    'border-surface text-ink-muted'
                  }`}>
                    {activeStep > 1 ? <Check className="w-3 h-3 stroke-[3px]" /> : '1'}
                  </div>
                  <span className={`text-xs font-display ${activeStep === 1 ? 'text-ink-primary font-medium' : 'text-ink-muted'}`}>
                    Categorize media & comments
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                    activeStep > 2 ? 'bg-accent-personal border-accent-personal text-bg' :
                    activeStep === 2 ? 'border-accent-personal text-accent-personal animate-pulse' :
                    'border-surface text-ink-muted'
                  }`}>
                    {activeStep > 2 ? <Check className="w-3 h-3 stroke-[3px]" /> : '2'}
                  </div>
                  <span className={`text-xs font-display ${activeStep === 2 ? 'text-ink-primary font-medium' : 'text-ink-muted'}`}>
                    Gemini structured extraction
                  </span>
                </div>

                {/* Step 3 */}
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono border ${
                    activeStep > 3 ? 'bg-accent-personal border-accent-personal text-bg' :
                    activeStep === 3 ? 'border-accent-personal text-accent-personal animate-pulse' :
                    'border-surface text-ink-muted'
                  }`}>
                    {activeStep > 3 ? <Check className="w-3 h-3 stroke-[3px]" /> : '3'}
                  </div>
                  <span className={`text-xs font-display ${activeStep === 3 ? 'text-ink-primary font-medium' : 'text-ink-muted'}`}>
                    Sync structured records to database
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Mode 8: Success */}
          {mode === 'success' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
              <div className="w-16 h-16 bg-accent-personal/10 text-accent-personal rounded-full flex items-center justify-center shadow-lg shadow-accent-personal/5">
                <Check className="w-8 h-8 stroke-[3px] animate-bounce" />
              </div>
              <h3 className="text-lg font-display font-medium text-ink-primary">Capture Completed</h3>
              <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
                {stepStatus}
              </p>
            </div>
          )}

          {/* Mode: Error View */}
          {mode === 'error' && (
            <div className="space-y-6 py-6 text-center">
              <div className="w-16 h-16 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-display font-medium text-ink-primary">Processing Failed</h3>
                <p className="text-xs font-mono text-ink-muted uppercase tracking-wider">
                  Gemini API or Database Error
                </p>
              </div>
              <div className="bg-danger/5 border border-danger/10 rounded-xl p-4 text-left max-h-32 overflow-y-auto">
                <p className="text-xs font-mono text-danger break-all">{errorMsg}</p>
              </div>

              <div className="flex justify-center gap-4 pt-2">
                <button
                  onClick={() => {
                    setErrorMsg(null);
                    setMode('camera');
                    startCamera();
                  }}
                  className="px-5 py-2.5 bg-surface hover:bg-surface-hover rounded-xl text-xs font-mono uppercase text-ink-secondary cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleProcessAndInsert}
                  className="px-6 py-2.5 bg-accent-personal text-bg rounded-xl text-xs font-mono uppercase font-semibold hover:bg-accent-personal/90 flex items-center gap-1.5 cursor-pointer"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};
