import type { App, LocAR } from 'locar'
import type { PerspectiveCamera } from 'three'

export type LocARSession = {
  app: App
  locar: LocAR
  canvas: HTMLCanvasElement
  videoEl: HTMLVideoElement
  resize: () => void
  dispose: () => void
}

type MountLocARSessionOptions = {
  container: HTMLElement
  cameraHFov?: number
  onFrame?: () => void
}

function styleVideoElement(videoEl: HTMLVideoElement) {
  videoEl.style.cssText = `
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    z-index: 0;
    background: black;
  `
}

function styleCanvasElement(canvas: HTMLCanvasElement) {
  canvas.style.width = '100%'
  canvas.style.height = '100%'
  canvas.style.display = 'block'
  canvas.style.touchAction = 'none'
  canvas.style.position = 'absolute'
  canvas.style.inset = '0'
  canvas.style.zIndex = '1'
}

function findLatestBodyVideo(beforeCount: number): HTMLVideoElement | null {
  const videos = document.querySelectorAll('body > video')
  if (videos.length <= beforeCount) return null
  return videos[videos.length - 1] as HTMLVideoElement
}

function stopVideoStream(videoEl: HTMLVideoElement) {
  const stream = videoEl.srcObject
  if (stream instanceof MediaStream) {
    stream.getTracks().forEach((track) => track.stop())
  }
  videoEl.srcObject = null
  videoEl.remove()
}

export async function mountLocARSession({
  container,
  cameraHFov = 70,
  onFrame,
}: MountLocARSessionOptions): Promise<LocARSession> {
  const videosBefore = document.querySelectorAll('body > video').length

  const canvas = document.createElement('canvas')
  styleCanvasElement(canvas)
  container.appendChild(canvas)

  const [{ App }] = await Promise.all([import('locar')])

  const app = new App({
    cameraOptions: { hFov: cameraHFov, near: 0.01, far: 100 },
    canvas,
    deviceOrientationOptions: { enabled: true },
  })

  const locar = await app.start()

  const videoEl = findLatestBodyVideo(videosBefore)
  if (!videoEl) {
    app.renderer.setAnimationLoop(null)
    app.renderer.dispose()
    canvas.remove()
    throw new Error('Flux caméra introuvable.')
  }

  styleVideoElement(videoEl)
  container.prepend(videoEl)

  const camera = app.camera as PerspectiveCamera
  const resize = () => {
    const width = container.clientWidth
    const height = container.clientHeight
    if (width === 0 || height === 0) return

    app.renderer.setSize(width, height, false)
    camera.aspect = width / height
    camera.updateProjectionMatrix()
  }

  resize()

  const resizeObserver = new ResizeObserver(resize)
  resizeObserver.observe(container)

  app.renderer.setAnimationLoop(() => {
    app.deviceOrientationControls?.update()
    onFrame?.()
    app.renderer.render(app.scene, camera)
  })

  const dispose = () => {
    resizeObserver.disconnect()
    app.renderer.setAnimationLoop(null)
    app.deviceOrientationControls?.dispose()
    app.locar.stopGps()
    stopVideoStream(videoEl)
    app.renderer.dispose()
    canvas.remove()
  }

  return {
    app,
    locar,
    canvas,
    videoEl,
    resize,
    dispose,
  }
}

export function activateARBodyLock() {
  document.body.dataset.arActive = 'true'
}

export function deactivateARBodyLock() {
  delete document.body.dataset.arActive
}

export function cleanupOrphanCameraElements() {
  document.querySelectorAll('body > video').forEach((node) => {
    stopVideoStream(node as HTMLVideoElement)
  })
}
