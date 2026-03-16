import { useEffect, useRef } from "react";
import * as THREE from "three";

/**
 * CyberBackground — A Three.js animated cyber network with floating nodes
 * and connection lines that subtly react to mouse movement.
 */
export function CyberBackground() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const animFrameRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    // Node particles
    const nodeCount = 80;
    const nodeGeometry = new THREE.BufferGeometry();
    const nodePositions = new Float32Array(nodeCount * 3);
    const nodeSizes = new Float32Array(nodeCount);
    const nodeVelocities = [];

    for (let i = 0; i < nodeCount; i++) {
      nodePositions[i * 3] = (Math.random() - 0.5) * 100;
      nodePositions[i * 3 + 1] = (Math.random() - 0.5) * 60;
      nodePositions[i * 3 + 2] = (Math.random() - 0.5) * 40;
      nodeSizes[i] = Math.random() * 3 + 1;
      nodeVelocities.push({
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.01,
      });
    }

    nodeGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(nodePositions, 3)
    );
    nodeGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(nodeSizes, 1)
    );

    // Custom shader for glowing nodes
    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor1: { value: new THREE.Color(0x00f3ff) },
        uColor2: { value: new THREE.Color(0xb94eff) },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        varying float vPulse;
        void main() {
          vPulse = sin(uTime * 0.5 + position.x * 0.1) * 0.5 + 0.5;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (200.0 / -mvPosition.z) * (0.8 + vPulse * 0.4);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1;
        uniform vec3 uColor2;
        varying float vPulse;
        void main() {
          float d = length(gl_PointCoord - vec2(0.5));
          if (d > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, d);
          vec3 color = mix(uColor1, uColor2, vPulse);
          gl_FragColor = vec4(color, alpha * 0.7);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
    scene.add(nodePoints);

    // Connection lines
    const lineMaxDist = 18;
    const lineGeometry = new THREE.BufferGeometry();
    const maxLines = nodeCount * (nodeCount - 1) / 2;
    const linePositions = new Float32Array(maxLines * 6);
    const lineColors = new Float32Array(maxLines * 6);
    lineGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(linePositions, 3)
    );
    lineGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(lineColors, 3)
    );

    const lineMaterial = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.25,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const lines = new THREE.LineSegments(lineGeometry, lineMaterial);
    scene.add(lines);

    // Mouse tracking
    const onMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
    };
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    // Resize handler
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize, { passive: true });

    // Animation loop
    let time = 0;
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      time += 0.01;

      nodeMaterial.uniforms.uTime.value = time;

      // Move nodes
      const positions = nodeGeometry.attributes.position.array;
      for (let i = 0; i < nodeCount; i++) {
        positions[i * 3] += nodeVelocities[i].x;
        positions[i * 3 + 1] += nodeVelocities[i].y;
        positions[i * 3 + 2] += nodeVelocities[i].z;

        // Mouse influence
        const dx = mouseRef.current.x * 5 - positions[i * 3] * 0.01;
        const dy = mouseRef.current.y * 5 - positions[i * 3 + 1] * 0.01;
        positions[i * 3] += dx * 0.005;
        positions[i * 3 + 1] += dy * 0.005;

        // Wrap around boundaries
        if (positions[i * 3] > 55) positions[i * 3] = -55;
        if (positions[i * 3] < -55) positions[i * 3] = 55;
        if (positions[i * 3 + 1] > 35) positions[i * 3 + 1] = -35;
        if (positions[i * 3 + 1] < -35) positions[i * 3 + 1] = 35;
      }
      nodeGeometry.attributes.position.needsUpdate = true;

      // Update connection lines
      let lineIdx = 0;
      const cyan = new THREE.Color(0x00f3ff);
      const purple = new THREE.Color(0xb94eff);

      for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
          const dx = positions[i * 3] - positions[j * 3];
          const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
          const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist < lineMaxDist) {
            const alpha = 1 - dist / lineMaxDist;
            const color = cyan.clone().lerp(purple, alpha);

            linePositions[lineIdx * 6] = positions[i * 3];
            linePositions[lineIdx * 6 + 1] = positions[i * 3 + 1];
            linePositions[lineIdx * 6 + 2] = positions[i * 3 + 2];
            linePositions[lineIdx * 6 + 3] = positions[j * 3];
            linePositions[lineIdx * 6 + 4] = positions[j * 3 + 1];
            linePositions[lineIdx * 6 + 5] = positions[j * 3 + 2];

            lineColors[lineIdx * 6] = color.r * alpha;
            lineColors[lineIdx * 6 + 1] = color.g * alpha;
            lineColors[lineIdx * 6 + 2] = color.b * alpha;
            lineColors[lineIdx * 6 + 3] = color.r * alpha;
            lineColors[lineIdx * 6 + 4] = color.g * alpha;
            lineColors[lineIdx * 6 + 5] = color.b * alpha;

            lineIdx++;
          }
        }
      }

      // Zero out remaining lines
      for (let i = lineIdx; i < maxLines; i++) {
        for (let k = 0; k < 6; k++) {
          linePositions[i * 6 + k] = 0;
          lineColors[i * 6 + k] = 0;
        }
      }

      lineGeometry.attributes.position.needsUpdate = true;
      lineGeometry.attributes.color.needsUpdate = true;
      lineGeometry.setDrawRange(0, lineIdx * 2);

      // Subtle camera movement
      camera.position.x += (mouseRef.current.x * 3 - camera.position.x) * 0.01;
      camera.position.y += (mouseRef.current.y * 2 - camera.position.y) * 0.01;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("resize", onResize);

      nodeGeometry.dispose();
      nodeMaterial.dispose();
      lineGeometry.dispose();
      lineMaterial.dispose();

      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
