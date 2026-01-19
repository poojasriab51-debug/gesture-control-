
import React, { useRef, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { ParticleShape, GestureData } from '../types';

interface Props {
  activeShape: ParticleShape;
  gestureData: GestureData | null;
}

const ParticleSystem: React.FC<Props> = ({ activeShape, gestureData }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    points: THREE.Points;
    geometry: THREE.BufferGeometry;
    material: THREE.ShaderMaterial;
  } | null>(null);

  const COUNT = 15000;

  // Generate target positions based on shape
  const getShapePositions = (shape: ParticleShape) => {
    const pos = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      let x = 0, y = 0, z = 0;
      const t = i / COUNT;
      
      switch (shape) {
        case ParticleShape.HEART: {
          const angle = t * Math.PI * 2;
          x = 16 * Math.pow(Math.sin(angle), 3);
          y = 13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle);
          z = (Math.random() - 0.5) * 5;
          x *= 0.5; y *= 0.5;
          break;
        }
        case ParticleShape.SATURN: {
          const isRing = Math.random() > 0.3;
          if (isRing) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 10 + Math.random() * 5;
            x = Math.cos(angle) * radius;
            y = (Math.random() - 0.5) * 0.5;
            z = Math.sin(angle) * radius;
          } else {
            const r = 6;
            const phi = Math.acos(-1 + (2 * i) / COUNT);
            const theta = Math.sqrt(COUNT * Math.PI) * phi;
            x = r * Math.sin(phi) * Math.cos(theta);
            y = r * Math.sin(phi) * Math.sin(theta);
            z = r * Math.cos(phi);
          }
          break;
        }
        case ParticleShape.FLOWER: {
          const angle = t * Math.PI * 20;
          const r = 8 * Math.cos(5 * angle);
          x = r * Math.cos(angle);
          y = r * Math.sin(angle);
          z = (Math.random() - 0.5) * 2;
          break;
        }
        case ParticleShape.FIREWORKS: {
          const r = Math.random() * 15;
          const phi = Math.random() * Math.PI * 2;
          const theta = Math.random() * Math.PI;
          x = r * Math.sin(theta) * Math.cos(phi);
          y = r * Math.sin(theta) * Math.sin(phi);
          z = r * Math.cos(theta);
          break;
        }
        case ParticleShape.GALAXY:
        default: {
          const radius = Math.random() * 15;
          const angle = radius * 2 + Math.random();
          x = Math.cos(angle) * radius;
          y = (Math.random() - 0.5) * 4;
          z = Math.sin(angle) * radius;
          break;
        }
      }
      pos[i * 3] = x;
      pos[i * 3 + 1] = y;
      pos[i * 3 + 2] = z;
    }
    return pos;
  };

  useEffect(() => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 30;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    mountRef.current.appendChild(renderer.domElement);

    // Initial Positions (Random Spread)
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(COUNT * 3);
    const targetPositions = getShapePositions(activeShape);
    const sizes = new Float32Array(COUNT);
    const colors = new Float32Array(COUNT * 3);

    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100;
      sizes[i] = Math.random();
      colors[i * 3] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 1] = 0.5 + Math.random() * 0.5;
      colors[i * 3 + 2] = 1.0;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('targetPosition', new THREE.BufferAttribute(targetPositions, 3));
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uMorphProgress: { value: 0 },
        uGestureIntensity: { value: 0 },
        uGesturePos: { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        uniform float uTime;
        uniform float uMorphProgress;
        uniform float uGestureIntensity;
        uniform vec2 uGesturePos;
        attribute float size;
        attribute vec3 targetPosition;
        attribute vec3 color;
        varying vec3 vColor;
        
        void main() {
          vColor = color;
          
          // Morphing logic
          vec3 morphedPos = mix(position, targetPosition, uMorphProgress);
          
          // Hover effect from gesture
          float dist = distance(morphedPos.xy, uGesturePos * 20.0 - 10.0);
          float force = (1.0 - smoothstep(0.0, 10.0, dist)) * uGestureIntensity * 0.1;
          morphedPos += normalize(morphedPos) * force;

          // Gentle float
          morphedPos.y += sin(uTime + morphedPos.x) * 0.2;
          
          vec4 mvPosition = modelViewMatrix * vec4(morphedPos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z) * (1.0 + uGestureIntensity * 0.02);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        void main() {
          float d = distance(gl_PointCoord, vec2(0.5));
          if (d > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, d);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    sceneRef.current = { scene, camera, renderer, points, geometry, material };

    let frame = 0;
    const animate = () => {
      frame = requestAnimationFrame(animate);
      material.uniforms.uTime.value += 0.01;
      
      // Smoothly transition progress
      material.uniforms.uMorphProgress.value = THREE.MathUtils.lerp(
        material.uniforms.uMorphProgress.value, 
        1.0, 
        0.05
      );

      points.rotation.y += 0.002;
      renderer.render(scene, camera);
    };

    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frame);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // Update morph target when activeShape changes
  useEffect(() => {
    if (sceneRef.current) {
      const { geometry, material } = sceneRef.current;
      const newTargets = getShapePositions(activeShape);
      geometry.setAttribute('targetPosition', new THREE.BufferAttribute(newTargets, 3));
      material.uniforms.uMorphProgress.value = 0; // Trigger new animation
    }
  }, [activeShape]);

  // Update uniforms from gesture data
  useEffect(() => {
    if (sceneRef.current && gestureData) {
      const { material } = sceneRef.current;
      // Convert 0-100 to -1 to 1 for shader
      const nx = (gestureData.x / 50) - 1;
      const ny = 1 - (gestureData.y / 50);
      material.uniforms.uGesturePos.value.set(nx, ny);
      material.uniforms.uGestureIntensity.value = gestureData.intensity;
    }
  }, [gestureData]);

  return <div ref={mountRef} className="w-full h-full" />;
};

export default ParticleSystem;
