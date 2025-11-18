// src/components/WebGPUNotSupported.tsx
import logo from '../assets/chaos-master-logo.png'
import styles from './WebgpuNotSupported.module.css'
import type { Component } from 'solid-js'

const WebgpuNotSupported: Component = () => {
  return (
    <div class={styles.fallback}>
      <div
        class={styles.logoBg}
        style={{ 'background-image': `url(${logo})` }}
      />

      <div class={styles.content}>
        <h1 class={styles.title}>CHAOS MASTER</h1>

        <p class={styles.text}>
          This interactive IFS fractal experience requires{' '}
          <strong>WebGPU</strong> to render the infinite beauty of chaotic
          attractors in real time.
        </p>

        <p class={styles.text}>
          Your browser or device currently does not support WebGPU.
        </p>

        <a
          href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"
          target="_blank"
          rel="noopener noreferrer"
          class={styles.btn}
        >
          Check WebGPU Browser Support
        </a>

        <div class={styles.hint}>
          Try the latest Chrome, Edge, or Safari (on supported hardware) for the
          full experience.
        </div>
      </div>
    </div>
  )
}

export default WebgpuNotSupported
