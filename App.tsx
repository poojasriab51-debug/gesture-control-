
import React, { useState, useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { GoogleGenAI } from "@google/genai";
import ParticleSystem from './components/ParticleSystem';
import GestureOverlay from './components/GestureOverlay';
import UIOverlay from './components/UIOverlay';
import { ParticleShape } from './types';

const App: React.FC = () => {
  const [activeShape, setActiveShape] = useState<ParticleShape>(ParticleShape.SATURN);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [gestureData, setGestureData] = useState<{ x: number, y: number, intensity: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const aiRef = useRef<any>(null);

  // Initialize camera
  useEffect(() => {
    const setupCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setIsCameraActive(true);
        }
      } catch (err) {
        console.error("Camera access denied", err);
      }
    };
    setupCamera();
  }, []);

  // Frame processing for gesture detection
  useEffect(() => {
    if (!isCameraActive) return;

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    aiRef.current = ai;

    const processFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return;
      
      const ctx = canvasRef.current.getContext('2d');
      if (!ctx) return;

      // Draw video frame to hidden canvas to get base64
      ctx.drawImage(videoRef.current, 0, 0, 320, 240);
      const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [
            {
              inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg'
              }
            },
            {
              text: "Analyze this frame. If there is a hand, identify: 1. Its approximate center (x, y coordinates from 0-100). 2. How open/closed it is (intensity 0-100). 3. If it looks like a specific gesture: 'point' (index finger up), 'fist', 'palm', 'peace'. Return ONLY JSON: { x: number, y: number, intensity: number, gesture: string }"
            }
          ],
          config: {
            responseMimeType: 'application/json'
          }
        });

        const data = JSON.parse(response.text || '{}');
        if (data.x !== undefined) {
          setGestureData({ x: data.x, y: data.y, intensity: data.intensity });
          
          // Map gestures to shapes
          if (data.gesture === 'peace') setActiveShape(ParticleShape.HEART);
          else if (data.gesture === 'palm') setActiveShape(ParticleShape.FLOWER);
          else if (data.gesture === 'point') setActiveShape(ParticleShape.SATURN);
          else if (data.gesture === 'fist') setActiveShape(ParticleShape.FIREWORKS);
        }
      } catch (e) {
        // Silent error to prevent UI flickering on API limits/network drops
      }

      // Schedule next check (throttled to save tokens/energy)
      setTimeout(processFrame, 1500); 
    };

    processFrame();
  }, [isCameraActive]);

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* 3D Background */}
      <div className="absolute inset-0 z-0">
        <ParticleSystem activeShape={activeShape} gestureData={gestureData} />
      </div>

      {/* Camera Feed (Mirror Overlay) */}
      <div className="absolute top-4 right-4 w-48 h-36 rounded-xl overflow-hidden glass-panel border border-white/20 z-10 shadow-2xl">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className="w-full h-full object-cover scale-x-[-1]"
        />
        <canvas ref={canvasRef} width={320} height={240} className="hidden" />
        <div className="absolute bottom-1 right-2 text-[10px] text-white/50 font-mono">VISION FEED</div>
      </div>

      {/* Main UI Overlay */}
      <div className="absolute inset-0 pointer-events-none z-20">
        <UIOverlay 
          activeShape={activeShape} 
          onShapeChange={setActiveShape} 
          gestureDetected={!!gestureData}
        />
      </div>

      {/* Visual Feedback of Tracking */}
      {gestureData && (
        <GestureOverlay 
          x={gestureData.x} 
          y={gestureData.y} 
          intensity={gestureData.intensity} 
        />
      )}
    </div>
  );
};

export default App;
