/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { LucideIcon } from 'lucide-react';

interface SpeedometerGaugeProps {
  id: string;
  title: string;
  value: number; // current value
  maxValue: number; // max scale value (e.g. 1000 or 100)
  unit: string; // 'Mbps' or 'ms'
  icon: LucideIcon;
  color: string; // Tailwind hex or neon color string (e.g. '#2563eb')
  glowColor: string; // Glow color (e.g. 'rgba(37, 99, 235, 0.4)')
  shadowClass: string; // CSS class for glow effect
  scaleTicks?: number[]; // Tick values to show
}

export default function SpeedometerGauge({
  id,
  title,
  value,
  maxValue,
  unit,
  icon: Icon,
  color,
  glowColor,
  shadowClass,
  scaleTicks = [0, 25, 50, 100, 250, 500, 750, 1000],
}: SpeedometerGaugeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Keep values in refs for loop access without re-triggering effects
  const currentValRef = useRef(0);
  const targetValRef = useRef(value);

  // Dynamic state to show standard HTML numeric labels placed around the arc
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    targetValRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    setDimensions({ width, height });

    // 1. Scene Setup
    const scene = new THREE.Scene();

    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.z = 8;

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      alpha: true,
      antialias: true,
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(color, 2, 50);
    pointLight.position.set(0, 0, 5);
    scene.add(pointLight);

    // 5. Build dashboard gauge geometry
    const gaugeGroup = new THREE.Group();
    scene.add(gaugeGroup);

    // Speedometer arc parameters (Match typical automobile scale: 225 deg to -45 deg)
    const startAngle = (225 * Math.PI) / 180;
    const endAngle = (-45 * Math.PI) / 180;
    const sweepAngle = startAngle - endAngle; // 270 degrees in radians
    const radius = 2.4;

    // A. Dark Background Ring Plate
    const bgRingGeo = new THREE.RingGeometry(radius - 0.25, radius + 0.1, 64, 1, startAngle, sweepAngle);
    const bgRingMat = new THREE.MeshBasicMaterial({
      color: 0x0a0a0c,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.7,
    });
    const bgRing = new THREE.Mesh(bgRingGeo, bgRingMat);
    bgRing.position.z = -0.1;
    gaugeGroup.add(bgRing);

    // B. Beveled Border Ring
    const borderGeo = new THREE.RingGeometry(radius + 0.05, radius + 0.12, 64, 1, startAngle, sweepAngle);
    const borderMat = new THREE.MeshBasicMaterial({
      color: 0x1e1e24,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.5,
    });
    const border = new THREE.Mesh(borderGeo, borderMat);
    gaugeGroup.add(border);

    // C. Glowing Sub-Ring Track
    const trackGeo = new THREE.RingGeometry(radius - 0.15, radius - 0.13, 64, 1, startAngle, sweepAngle);
    const trackMat = new THREE.MeshBasicMaterial({
      color: 0x111115,
      side: THREE.DoubleSide,
    });
    const trackRing = new THREE.Mesh(trackGeo, trackMat);
    gaugeGroup.add(trackRing);

    // D. Dash Tick Marks
    const ticksCount = 40;
    const tickGroup = new THREE.Group();
    const tickGeometries: THREE.BoxGeometry[] = [];
    const tickMaterials: THREE.MeshBasicMaterial[] = [];
    
    for (let i = 0; i <= ticksCount; i++) {
      const percentage = i / ticksCount;
      const angle = startAngle - percentage * sweepAngle;
      
      const isMajor = i % 5 === 0;
      const tickLength = isMajor ? 0.2 : 0.09;
      const tickWidth = isMajor ? 0.03 : 0.015;
      
      const tickGeo = new THREE.BoxGeometry(tickLength, tickWidth, 0.02);
      const tickMat = new THREE.MeshBasicMaterial({
        color: isMajor ? color : '#3f3f46',
        transparent: true,
        opacity: isMajor ? 0.9 : 0.6,
      });
      const tick = new THREE.Mesh(tickGeo, tickMat);
      
      tickGeometries.push(tickGeo);
      tickMaterials.push(tickMat);
      
      // Calculate position of the tick
      const r = radius - 0.2;
      tick.position.x = Math.cos(angle) * r;
      tick.position.y = Math.sin(angle) * r;
      tick.rotation.z = angle;
      
      tickGroup.add(tick);
    }
    gaugeGroup.add(tickGroup);

    // E. Dynamic Glow Value Arc (shows filled portion in neon color)
    const arcMaterial = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.82,
    });
    let activeArcMesh: THREE.Mesh | null = null;

    // F. Glowing Center Indicator Needle (Dashboard style Pointer)
    const needleGroup = new THREE.Group();
    gaugeGroup.add(needleGroup);

    // Tapered pointer geometry
    const needleLength = radius - 0.1;
    const needleGeo = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      0, 0.06, 0.05,       // base left
      0, -0.06, 0.05,      // base right
      needleLength, 0, 0.05, // tip
    ]);
    needleGeo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
    const needleMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
    const needle = new THREE.Mesh(needleGeo, needleMat);
    needleGroup.add(needle);

    // Central circular spindle base cap
    const capGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.08, 32);
    const capMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      metalness: 0.9,
      roughness: 0.1,
    });
    const cap = new THREE.Mesh(capGeo, capMat);
    cap.rotation.x = Math.PI / 2;
    cap.position.z = 0.08;
    needleGroup.add(cap);

    // Tiny center neon ring on spinner cap
    const capRingGeo = new THREE.RingGeometry(0.1, 0.13, 32);
    const capRingMat = new THREE.MeshBasicMaterial({
      color: color,
      side: THREE.DoubleSide,
    });
    const capRing = new THREE.Mesh(capRingGeo, capRingMat);
    capRing.position.z = 0.13;
    needleGroup.add(capRing);

    // 6. Interactive Parallax Mouse Move variables
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const px = (x / rect.width) * 2 - 1; // -1 to 1
      const py = (y / rect.height) * 2 - 1; // -1 to 1
      
      targetRotationY = px * 0.14; // yaw
      targetRotationX = py * 0.14; // pitch
    };

    const handleMouseLeave = () => {
      targetRotationX = 0;
      targetRotationY = 0;
    };

    const containerElement = containerRef.current;
    containerElement.addEventListener('mousemove', handleMouseMove);
    containerElement.addEventListener('mouseleave', handleMouseLeave);

    // 7. Render/Animation Loop
    let animationId: number;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      animationId = requestAnimationFrame(animate);

      // A. Needle & Arc Value Interpolation (Smooth Lerp for dynamic physics look)
      const diff = targetValRef.current - currentValRef.current;
      currentValRef.current += diff * 0.09; // interpolates nicely

      // Hard caps
      if (currentValRef.current < 0) currentValRef.current = 0;
      if (currentValRef.current > maxValue) currentValRef.current = maxValue;

      // Update needle rotation
      const speedRatio = currentValRef.current / maxValue;
      // Realistic high-RPM mechanical needle shiver
      const isTestActive = targetValRef.current > 0.05;
      const needleJitter = isTestActive ? (Math.sin(timestamp * 0.12) * 0.006 * (speedRatio + 0.18)) : 0;
      const currentAngle = startAngle - speedRatio * sweepAngle + needleJitter;
      needleGroup.rotation.z = currentAngle;

      // Update Dynamic WebGL Filled Arc
      if (activeArcMesh) {
        gaugeGroup.remove(activeArcMesh);
        activeArcMesh.geometry.dispose();
      }

      if (speedRatio > 0.001) {
        const arcGeo = new THREE.RingGeometry(
          radius - 0.15,
          radius - 0.07,
          64,
          1,
          startAngle,
          -speedRatio * sweepAngle
        );
        activeArcMesh = new THREE.Mesh(arcGeo, arcMaterial);
        activeArcMesh.position.z = 0.01;
        gaugeGroup.add(activeArcMesh);
      }

      // B. Smooth Parallax Spring Animation
      currentRotationX += (targetRotationX - currentRotationX) * 0.08;
      currentRotationY += (targetRotationY - currentRotationY) * 0.08;

      gaugeGroup.rotation.y = currentRotationY;
      gaugeGroup.rotation.x = currentRotationX;

      // Subtle pulse effect on glow parameters
      const pulse = 1.0 + Math.sin(timestamp * 0.004) * 0.04;
      pointLight.intensity = (2.2 + speedRatio * 3) * pulse;

      renderer.render(scene, camera);
    };

    animationId = requestAnimationFrame(animate);

    // 8. Resize Observer
    const handleResize = (entries: ResizeObserverEntry[]) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({ width, height });
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerElement);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
      containerElement.removeEventListener('mousemove', handleMouseMove);
      containerElement.removeEventListener('mouseleave', handleMouseLeave);
      resizeObserver.disconnect();
      renderer.dispose();
      bgRingGeo.dispose();
      bgRingMat.dispose();
      borderGeo.dispose();
      borderMat.dispose();
      trackGeo.dispose();
      trackMat.dispose();
      tickGeometries.forEach((g) => g.dispose());
      tickMaterials.forEach((m) => m.dispose());
      arcMaterial.dispose();
      needleGeo.dispose();
      needleMat.dispose();
      capGeo.dispose();
      capMat.dispose();
      capRingGeo.dispose();
      capRingMat.dispose();
      if (activeArcMesh) {
        activeArcMesh.geometry.dispose();
      }
    };
  }, [color, maxValue]);

  // Utility to position HTML Speed Labels in 2D Space mimicking full physical speedometers!
  const getLabelStyle = (val: number) => {
    if (dimensions.width === 0) return { opacity: 0 };
    
    // Convert 3D Angle coordinates back to relative 2D percentages
    const startAngle = (225 * Math.PI) / 180;
    const endAngle = (-45 * Math.PI) / 180;
    const sweepAngle = startAngle - endAngle;
    
    const percentage = val / maxValue;
    const angle = startAngle - percentage * sweepAngle;

    // Use radius scale suitable for HTML overlay
    const scaleFactor = Math.min(dimensions.width, dimensions.height);
    const layoutRadius = scaleFactor * 0.32; // labels reside at 32% of viewport size
    
    // Polar coordinates offset from center
    const dx = Math.cos(angle) * layoutRadius;
    const dy = -Math.sin(angle) * layoutRadius; // negate Y for browser coordinate system

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;

    return {
      left: `${centerX + dx}px`,
      top: `${centerY + dy}px`,
      transform: 'translate(-50%, -50%)',
    };
  };

  return (
    <div
      ref={containerRef}
      id={`gauge-container-${id}`}
      className="relative flex items-center justify-center w-full aspect-square max-w-[360px] md:max-w-[420px] mx-auto group select-none"
    >
      {/* 3D WebGL Canvas */}
      <canvas
        ref={canvasRef}
        id={`gauge-canvas-${id}`}
        className="absolute top-0 left-0 w-full h-full block pointer-events-none"
      />

      {/* Decorative Outer HUD bracket lines */}
      <div className="absolute inset-0 border border-zinc-800/10 rounded-full pointer-events-none transition-all duration-700 group-hover:border-zinc-700/30 group-hover:scale-105 pointer-events-none" />
      <div 
        className="absolute inset-[3%] rounded-full border border-dashed border-zinc-800/20 pointer-events-none group-hover:border-zinc-700/40"
        style={{ borderColor: `${color}0b` }}
      />

      {/* HTML Circular Tick Speed Numerics Overlay */}
      {dimensions.width > 0 &&
        scaleTicks.map((tick) => {
          if (tick > maxValue) return null;
          return (
            <span
              key={tick}
              id={`gauge-tick-${id}-${tick}`}
              className="absolute font-mono text-[10px] md:text-xs text-zinc-500 transition-colors duration-300 group-hover:text-zinc-400 select-none pointer-events-none"
              style={getLabelStyle(tick)}
            >
              {tick}
            </span>
          );
        })}

      {/* Center Instrument HUD Panel */}
      <div 
        id={`gauge-hud-${id}`}
        className="absolute flex flex-col items-center justify-center p-6 text-center select-none"
        style={{
          width: `${dimensions.width * 0.44}px`,
          height: `${dimensions.height * 0.44}px`,
        }}
      >
        {/* Glow halo behind digital values */}
        <div 
          className={`absolute inset-0 rounded-full bg-radial from-${shadowClass} to-transparent opacity-20 pointer-events-none filter blur-xl`}
          style={{ backgroundColor: `${color}15` }}
        />

        {/* Dynamic Mode Icon with Subtle Float anim */}
        <Icon 
          id={`gauge-icon-${id}`}
          className={`w-6 h-6 md:w-7 md:h-7 mb-1.5 transition-all duration-300 pointer-events-none`}
          style={{
            color: color,
            filter: `drop-shadow(0 0 8px ${color})`,
          }}
        />

        <span className="text-[10px] md:text-xs font-semibold tracking-widest text-zinc-400 uppercase select-none">
          {title}
        </span>

        {/* Big digital speedometer value */}
        <div
          id={`gauge-value-${id}`}
          className="text-2xl md:text-4xl font-extrabold tracking-tight font-sans transition-all duration-100 flex items-baseline my-0.5"
          style={{
            color: '#ffffff',
            textShadow: `0 0 15px ${color}80, 0 0 2px ${color}`,
          }}
        >
          {value.toFixed(2)}
        </div>

        <span className="text-[10px] md:text-xs font-mono tracking-wider text-zinc-400 select-none">
          {unit}
        </span>
      </div>

      {/* Ambient Neon Bottom Bezel lighting strip */}
      <div
        className="absolute bottom-[10%] left-1/4 right-1/4 h-[3px] rounded-full opacity-40 blur-[1px] transition-all duration-500 group-hover:opacity-100 group-hover:scale-x-110 pointer-events-none"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          boxShadow: `0 0 10px ${color}, 0 0 3px ${color}`,
        }}
      />
    </div>
  );
}
