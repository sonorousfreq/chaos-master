import ui from './WebgpuNotSupported.module.css'

export function WebgpuNotSupported() {
  return (
    <div class={ui.fallback}>
      <div class={ui.content}>
        <h1 class={ui.title}>CHAOS MASTER</h1>

        <p class={ui.text}>
          Your browser or device currently does not support{' '}
          <strong>WebGPU</strong>.
        </p>

        <a
          href="https://github.com/gpuweb/gpuweb/wiki/Implementation-Status"
          target="_blank"
          rel="noopener noreferrer"
          class={ui.btn}
        >
          Check WebGPU Browser Support
        </a>

        <div class={ui.hint}>
          Try the latest Chrome, Firefox, or Safari (on supported hardware) for
          the full experience.
        </div>
      </div>
    </div>
  )
}
