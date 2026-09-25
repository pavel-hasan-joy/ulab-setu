"use client";

import type { MotionValue } from "motion/react";
import { useEffect, useRef } from "react";
import * as THREE from "three";

// A cloud of particles that morphs between four shapes as `stage` goes 0 → 3:
// a globe (the alumni network), a graduation cap, a bridge ("Setu") and a briefcase.
// Morphing runs in the vertex shader; each particle leaves at a slightly different time
// and swirls outward mid-flight, which gives the "swarm" feel.

const TAU = Math.PI * 2;

function rand(seed: number) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

function globe(n: number) {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2;
    const r = Math.sqrt(1 - y * y);
    const t = golden * i;
    const R = 2.1 + (rand(i) - 0.5) * 0.06;
    out.set([Math.cos(t) * r * R, y * R, Math.sin(t) * r * R], i * 3);
  }
  return out;
}

function cap(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand(i + 1);
    const b = rand(i + 2);
    const c = rand(i + 3);
    let x: number, y: number, z: number;
    if (a < 0.55) {
      // mortarboard: a flat square, rotated 45°
      const u = (b - 0.5) * 3.4;
      const v = (c - 0.5) * 3.4;
      x = (u - v) * 0.7071;
      z = (u + v) * 0.7071;
      y = 0.75 + (rand(i + 4) - 0.5) * 0.12;
    } else if (a < 0.9) {
      // skull cap: a short open cylinder under the board
      const t = b * TAU;
      x = Math.cos(t) * 1.15;
      z = Math.sin(t) * 1.15;
      y = -0.35 + c * 1.1;
    } else {
      // tassel hanging from one corner
      x = 2.2 + (b - 0.5) * 0.08;
      z = (c - 0.5) * 0.08;
      y = 0.75 - rand(i + 5) * 1.5;
    }
    out.set([x, y - 0.1, z], i * 3);
  }
  return out;
}

function bridge(n: number) {
  const out = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const a = rand(i + 11);
    const b = rand(i + 12);
    const c = rand(i + 13);
    let x: number, y: number, z: number;
    if (a < 0.38) {
      // deck
      x = (b - 0.5) * 6.4;
      y = -0.9 + (rand(i + 14) - 0.5) * 0.08;
      z = (c - 0.5) * 0.9;
    } else if (a < 0.72) {
      // two parallel arches
      x = (b - 0.5) * 5.2;
      y = -0.9 + 2.2 * (1 - (x / 2.6) ** 2);
      z = c < 0.5 ? -0.42 : 0.42;
    } else if (a < 0.92) {
      // hangers between arch and deck
      const k = Math.floor(b * 11) - 5;
      x = k * 0.45;
      const top = -0.9 + 2.2 * (1 - (x / 2.6) ** 2);
      y = -0.9 + c * (top + 0.9);
      z = rand(i + 15) < 0.5 ? -0.42 : 0.42;
    } else {
      // piers into the "water"
      x = b < 0.5 ? -2.6 : 2.6;
      y = -0.9 - c * 1.1;
      z = (rand(i + 16) - 0.5) * 0.9;
    }
    out.set([x, y + 0.2, z], i * 3);
  }
  return out;
}

function briefcase(n: number) {
  const out = new Float32Array(n * 3);
  const W = 3.4, H = 2.3, D = 1.0;
  for (let i = 0; i < n; i++) {
    const a = rand(i + 21);
    const b = rand(i + 22) - 0.5;
    const c = rand(i + 23) - 0.5;
    let x: number, y: number, z: number;
    if (a < 0.86) {
      // surface of a box, weighted by face area
      const f = rand(i + 24);
      if (f < 0.6) { x = b * W; y = c * H; z = (f < 0.3 ? -0.5 : 0.5) * D; }
      else if (f < 0.8) { x = (f < 0.7 ? -0.5 : 0.5) * W; y = b * H; z = c * D; }
      else { x = b * W; y = (f < 0.9 ? -0.5 : 0.5) * H; z = c * D; }
      // clasp band across the front
      if (rand(i + 25) < 0.08) { x = b * W; y = 0.15 + c * 0.1; z = 0.5 * D; }
    } else {
      // handle: a half ring on top
      const t = rand(i + 26) * Math.PI;
      x = Math.cos(t) * 0.7;
      y = H / 2 + Math.sin(t) * 0.55;
      z = (rand(i + 27) - 0.5) * 0.2;
    }
    out.set([x, y - 0.1, z], i * 3);
  }
  return out;
}

const vertex = /* glsl */ `
  attribute vec3 aGlobe;
  attribute vec3 aCap;
  attribute vec3 aBridge;
  attribute vec3 aCase;
  attribute float aRandom;
  uniform float uStage;
  uniform float uTime;
  uniform float uSize;
  uniform float uPixelRatio;
  varying float vRandom;
  varying float vHeight;

  float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }

  vec3 morph(vec3 a, vec3 b, float t) {
    // each particle leaves a little earlier or later than its neighbours
    float local = clamp(t * 1.5 - aRandom * 0.5, 0.0, 1.0);
    float e = ease(local);
    vec3 p = mix(a, b, e);
    // swirl outward mid-flight
    float lift = sin(local * 3.14159);
    vec3 dir = normalize(vec3(sin(aRandom * 91.0), cos(aRandom * 57.0), sin(aRandom * 23.0)) + 0.0001);
    return p + dir * lift * 0.9;
  }

  void main() {
    vec3 pos;
    float s = uStage;
    if (s < 1.0) pos = morph(aGlobe, aCap, s);
    else if (s < 2.0) pos = morph(aCap, aBridge, s - 1.0);
    else pos = morph(aBridge, aCase, s - 2.0);

    // gentle breathing so the shape never looks frozen
    pos += 0.03 * vec3(sin(uTime * 1.3 + aRandom * 40.0), cos(uTime * 1.1 + aRandom * 30.0), sin(uTime * 0.9 + aRandom * 20.0));

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uSize * uPixelRatio * (0.6 + aRandom * 0.8) / -mv.z;
    vRandom = aRandom;
    vHeight = pos.y;
  }
`;

const fragment = /* glsl */ `
  uniform vec3 uBlue;
  uniform vec3 uSky;
  uniform vec3 uGold;
  uniform float uDark;
  varying float vRandom;
  varying float vHeight;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.0, d);
    // Each particle is either blue or gold (never a muddy mix); gold gets likelier toward the top.
    float t = clamp(vHeight * 0.25 + 0.5, 0.0, 1.0);
    float pick = fract(vRandom * 13.37);
    vec3 blue = mix(uBlue, uSky, fract(vRandom * 7.1));
    vec3 color = pick < 0.12 + t * 0.4 ? uGold : blue;
    gl_FragColor = vec4(color, alpha * (uDark > 0.5 ? 0.9 : 0.75));
  }
`;

export function ParticleMorph({ stage, className }: { stage: MotionValue<number>; className?: string }) {
  const mount = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mount.current;
    if (!el) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // no WebGL: the captions still tell the story
    }
    const pixelRatio = Math.min(window.devicePixelRatio, 2);
    renderer.setPixelRatio(pixelRatio);
    el.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 0, 9);

    const small = window.innerWidth < 768;
    const n = small ? 3500 : 7000;
    const geometry = new THREE.BufferGeometry();
    const g = globe(n);
    geometry.setAttribute("position", new THREE.BufferAttribute(g, 3));
    geometry.setAttribute("aGlobe", new THREE.BufferAttribute(g, 3));
    geometry.setAttribute("aCap", new THREE.BufferAttribute(cap(n), 3));
    geometry.setAttribute("aBridge", new THREE.BufferAttribute(bridge(n), 3));
    geometry.setAttribute("aCase", new THREE.BufferAttribute(briefcase(n), 3));
    geometry.setAttribute("aRandom", new THREE.BufferAttribute(Float32Array.from({ length: n }, (_, i) => rand(i + 99)), 1));

    const isDark = () => document.documentElement.dataset.theme === "dark";
    const uniforms = {
      uStage: { value: 0 },
      uTime: { value: 0 },
      uSize: { value: small ? 70 : 90 },
      uPixelRatio: { value: pixelRatio },
      uBlue: { value: new THREE.Color() },
      uSky: { value: new THREE.Color() },
      uGold: { value: new THREE.Color() },
      uDark: { value: 0 },
    };
    const material = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: fragment, uniforms, transparent: true, depthWrite: false });
    const applyTheme = () => {
      const dark = isDark();
      uniforms.uDark.value = dark ? 1 : 0;
      uniforms.uBlue.value.set(dark ? "#4f9fe0" : "#2f7fca");
      uniforms.uSky.value.set(dark ? "#9fd3f5" : "#6cb4e6");
      uniforms.uGold.value.set(dark ? "#f2cf6b" : "#e7ae2e");
      material.blending = dark ? THREE.AdditiveBlending : THREE.NormalBlending;
      material.needsUpdate = true;
    };
    applyTheme();
    const themeObserver = new MutationObserver(applyTheme);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

    const points = new THREE.Points(geometry, material);
    const group = new THREE.Group();
    group.add(points);
    scene.add(group);

    const resize = () => {
      const { width, height } = el.getBoundingClientRect();
      renderer.setSize(width, height, false);
      renderer.domElement.style.width = `${width}px`;
      renderer.domElement.style.height = `${height}px`;
      camera.aspect = width / Math.max(height, 1);
      // keep the shape fully in frame on narrow screens
      camera.position.z = camera.aspect < 1 ? 9 / camera.aspect ** 0.8 : 9;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(el);
    resize();

    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener("pointermove", onMove);

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let visible = true;
    const io = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
    io.observe(el);

    const clock = new THREE.Clock();
    let spin = 0;
    let frame = 0;
    const tick = () => {
      frame = requestAnimationFrame(tick);
      if (!visible) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      uniforms.uTime.value += dt;
      // ease the stage toward the scroll position so fast scrolls still look smooth
      uniforms.uStage.value += (stage.get() - uniforms.uStage.value) * 0.08;
      pointer.x += (pointer.tx - pointer.x) * 0.05;
      pointer.y += (pointer.ty - pointer.y) * 0.05;
      if (!reduce) spin += dt * 0.12;
      group.rotation.y = spin + pointer.x * 0.9;
      group.rotation.x = 0.15 + pointer.y * 0.5;
      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", onMove);
      themeObserver.disconnect();
      ro.disconnect();
      io.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [stage]);

  return <div ref={mount} className={className} aria-hidden />;
}
