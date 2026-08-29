'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface InteractiveGridProps {
  className?: string;
  themeMode?: 'blue' | 'dark' | 'light';
}

export default function InteractiveGrid({
  className = '',
  themeMode = 'blue',
}: InteractiveGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Theme color settings matching the original Framer component
  const colors = {
    blue: {
      bgStart: '#0052ff',
      bgEnd: '#002da8',
      dotColor: '#ffffff',
      lineColor: '#ffffff',
      lineOpacity: 0.35,
      dotOpacity: 0.95,
      baseDotSize: 4.5,
    },
    dark: {
      bgStart: '#0d1527',
      bgEnd: '#04060c',
      dotColor: '#38bdf8',
      lineColor: '#1e3a8a',
      lineOpacity: 0.4,
      dotOpacity: 0.95,
      baseDotSize: 4.5,
    },
    light: {
      bgStart: '#f1f5f9',
      bgEnd: '#cbd5e1',
      dotColor: '#0284c7',
      lineColor: '#94a3b8',
      lineOpacity: 0.35,
      dotOpacity: 0.9,
      baseDotSize: 4.5,
    },
  }[themeMode];

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    // Clean previous children if any (ensures no duplicate canvases on route transitions)
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    let w = container.clientWidth || window.innerWidth || 1200;
    let h = container.clientHeight || window.innerHeight || 800;

    // 1. Scene & Camera Setup (FOV 45 at z=1000)
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, w / h, 1, 10000);
    camera.position.z = 1000;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    const group = new THREE.Group();
    scene.add(group);

    // 2. High-Density Viewport Grid Geometry
    const gridSize = 2400;
    const density = 56;
    const halfSize = gridSize / 2;

    const pts: number[] = [];
    const indices: number[] = [];

    // Generate Points
    for (let y = 0; y <= density; y++) {
      for (let x = 0; x <= density; x++) {
        pts.push(
          (x / density) * gridSize - halfSize,
          (y / density) * gridSize - halfSize,
          0
        );
      }
    }

    // Generate Line Indices
    for (let y = 0; y < density; y++) {
      for (let x = 0; x < density; x++) {
        const i = x + y * (density + 1);
        indices.push(i, i + 1); // Horizontal
        indices.push(i, i + (density + 1)); // Vertical
      }
    }
    for (let y = 0; y < density; y++) indices.push(density + y * (density + 1), density + (y + 1) * (density + 1));
    for (let x = 0; x < density; x++) indices.push(x + density * (density + 1), x + 1 + density * (density + 1));

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    geometry.setIndex(indices);

    // 3. GLSL Vertex Shader for PULL (Magnetic Elastic Attraction)
    const vertexShader = `
      uniform vec2 u_mouse;
      uniform float u_radius;
      uniform float u_strength;
      uniform float u_mouseActive;
      uniform float u_time;
      uniform float u_baseDotSize;

      void main() {
        vec3 pos = position;
        
        // PULL GRAVITATIONAL ATTRACTION
        vec2 dir = pos.xy - u_mouse;
        float dist = length(dir);
        float falloff = exp(-pow(dist / (u_radius * 0.45), 2.0));
        
        if (u_mouseActive > 0.0) {
          // Elevate in 3D space towards camera
          pos.z += falloff * u_strength * 2.4 * u_mouseActive;
          // Magnetically pull coordinates towards the cursor
          pos.xy -= dir * (falloff * 0.38) * u_mouseActive;
        }
        
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        
        // Dynamic node magnification on pull
        float sizeMod = falloff * u_baseDotSize * 2.6 * u_mouseActive;
        gl_PointSize = max(1.0, u_baseDotSize + sizeMod);
      }
    `;

    const fragTemplate = `
      uniform vec3 u_color;
      uniform float u_opacity;
      
      void main() {
        #ifdef IS_POINT
        float d = distance(gl_PointCoord, vec2(0.5));
        if (d > 0.5) discard;
        #endif
        
        gl_FragColor = vec4(u_color, u_opacity);
      }
    `;

    const baseUniforms = {
      u_mouse: { value: new THREE.Vector2(0, 0) },
      u_radius: { value: 340 },
      u_strength: { value: 240 },
      u_mouseActive: { value: 0 },
      u_time: { value: 0 },
      u_baseDotSize: { value: colors.baseDotSize },
    };

    const matLines = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragTemplate,
      uniforms: {
        ...baseUniforms,
        u_color: { value: new THREE.Color(colors.lineColor) },
        u_opacity: { value: colors.lineOpacity },
      },
      transparent: true,
      depthWrite: false,
    });

    const matPoints = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: '#define IS_POINT\n' + fragTemplate,
      uniforms: {
        ...baseUniforms,
        u_color: { value: new THREE.Color(colors.dotColor) },
        u_opacity: { value: colors.dotOpacity },
      },
      transparent: true,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(geometry, matLines);
    const points = new THREE.Points(geometry, matPoints);
    group.add(lines);
    group.add(points);

    // Hit Plane for Raycaster
    const hitPlaneGeometry = new THREE.PlaneGeometry(gridSize * 2, gridSize * 2);
    const hitPlaneMaterial = new THREE.MeshBasicMaterial({ visible: false });
    const hitPlane = new THREE.Mesh(hitPlaneGeometry, hitPlaneMaterial);
    group.add(hitPlane);

    // 4. Mouse Tracking & Raycasting (Dynamic coordinates)
    const raycaster = new THREE.Raycaster();
    const mouseNDC = new THREE.Vector2(-999, -999);
    let isHovering = false;
    let currentActive = 0;

    const onMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentW = rect.width || window.innerWidth || 1;
      const currentH = rect.height || window.innerHeight || 1;

      mouseNDC.x = ((e.clientX - rect.left) / currentW) * 2 - 1;
      mouseNDC.y = -((e.clientY - rect.top) / currentH) * 2 + 1;
      isHovering = true;
    };

    const onMouseLeave = () => {
      isHovering = false;
    };

    window.addEventListener('mousemove', onMouseMove, { passive: true });
    document.addEventListener('mouseleave', onMouseLeave);

    // 5. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const render = () => {
      const delta = Math.min(clock.getDelta(), 0.1);
      const time = clock.getElapsedTime();
      matLines.uniforms.u_time.value = time;
      matPoints.uniforms.u_time.value = time;

      // Smooth activation transition
      const targetActive = isHovering ? 1 : 0;
      currentActive += (targetActive - currentActive) * 12 * delta;
      matLines.uniforms.u_mouseActive.value = currentActive;
      matPoints.uniforms.u_mouseActive.value = currentActive;

      // 3D Parallax Tilt
      const targetRotX = isHovering ? mouseNDC.y * 0.14 : 0;
      const targetRotY = isHovering ? mouseNDC.x * 0.14 : 0;
      group.rotation.x += (targetRotX - group.rotation.x) * 6 * delta;
      group.rotation.y += (targetRotY - group.rotation.y) * 6 * delta;

      if (currentActive > 0.001) {
        raycaster.setFromCamera(mouseNDC, camera);
        const intersects = raycaster.intersectObject(hitPlane);
        if (intersects.length > 0) {
          const localPoint = group.worldToLocal(intersects[0].point.clone());
          matLines.uniforms.u_mouse.value.lerp(
            new THREE.Vector2(localPoint.x, localPoint.y),
            16 * delta
          );
          matPoints.uniforms.u_mouse.value.copy(matLines.uniforms.u_mouse.value);
        }
      }

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    // 6. Dynamic Resize Observer
    const handleResize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const currentW = rect.width || window.innerWidth || 1;
      const currentH = rect.height || window.innerHeight || 1;

      camera.aspect = currentW / currentH;
      camera.updateProjectionMatrix();
      renderer.setSize(currentW, currentH);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 7. Cleanup on Unmount / Route Navigation
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseleave', onMouseLeave);

      geometry.dispose();
      matLines.dispose();
      matPoints.dispose();
      hitPlaneGeometry.dispose();
      hitPlaneMaterial.dispose();
      renderer.dispose();

      if (container && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [themeMode]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
      style={{
        background: `radial-gradient(circle at 50% 50%, ${colors.bgStart} 0%, ${colors.bgEnd} 100%)`,
        transition: 'background 0.5s ease',
      }}
    />
  );
}
