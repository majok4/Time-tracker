import { Tray, Menu, nativeImage, app, BrowserWindow } from 'electron'
import path from 'path'
import { getTimerState, stopTimer } from './timer'
import { getFocusState, cancelFocus } from './focus-timer'
import { getAllProjects } from './db/queries/projects'
import { startTimer } from './timer'

let tray: Tray | null = null
let mainWindow: BrowserWindow | null = null
let updateThrottleId: NodeJS.Timeout | null = null

function formatMs(ms: number): string {
  const totalSecs = Math.floor(ms / 1000)
  const hours = Math.floor(totalSecs / 3600)
  const mins = Math.floor((totalSecs % 3600) / 60)
  const secs = totalSecs % 60
  if (hours > 0) return `${hours}h ${mins}m`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

function buildContextMenu(): Electron.Menu {
  const timerState = getTimerState()
  const focusState = getFocusState()
  const projects = getAllProjects()

  const statusItems: Electron.MenuItemConstructorOptions[] = []

  if (focusState.active && focusState.focusSession) {
    statusItems.push({
      label: `Focus: ${formatMs(focusState.remaining)} remaining`,
      enabled: false
    })
    statusItems.push({
      label: 'Stop Focus',
      click: () => {
        cancelFocus()
        buildAndSetMenu()
      }
    })
  } else if (timerState.active && timerState.session) {
    const project = projects.find((p) => p.id === timerState.session!.projectId)
    statusItems.push({
      label: `${project?.name ?? 'Unknown'} — ${formatMs(timerState.elapsed)}`,
      enabled: false
    })
    statusItems.push({
      label: 'Stop Timer',
      click: () => {
        stopTimer()
        buildAndSetMenu()
      }
    })
  } else {
    statusItems.push({ label: 'No active session', enabled: false })
  }

  const projectItems: Electron.MenuItemConstructorOptions[] = projects.slice(0, 8).map((p) => ({
    label: `${p.icon ?? '●'} ${p.name}`,
    click: () => {
      startTimer({ projectId: p.id, source: 'manual' })
      buildAndSetMenu()
    }
  }))

  return Menu.buildFromTemplate([
    ...statusItems,
    { type: 'separator' },
    {
      label: 'Quick Start',
      submenu: projectItems.length > 0 ? projectItems : [{ label: 'No projects yet', enabled: false }]
    },
    { type: 'separator' },
    {
      label: 'Open Time Tracker',
      click: () => {
        if (mainWindow) {
          mainWindow.show()
          mainWindow.focus()
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit()
    }
  ])
}

function buildAndSetMenu(): void {
  if (!tray) return
  tray.setContextMenu(buildContextMenu())
}

export function createTray(win: BrowserWindow): Tray {
  mainWindow = win

  const iconPath = path.join(
    app.isPackaged
      ? path.join(process.resourcesPath, 'resources')
      : path.join(process.cwd(), 'resources'),
    'tray-icon.png'
  )

  let icon: Electron.NativeImage
  try {
    icon = nativeImage.createFromPath(iconPath)
    if (icon.isEmpty()) {
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)
  tray.setToolTip('Time Tracker')
  buildAndSetMenu()

  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show()
      mainWindow.focus()
    }
  })

  return tray
}

export function updateTray(): void {
  if (!tray) return
  if (updateThrottleId) return

  updateThrottleId = setTimeout(() => {
    buildAndSetMenu()

    const timerState = getTimerState()
    const focusState = getFocusState()

    let title = ''
    if (focusState.active) {
      title = `⏱ ${formatMs(focusState.remaining)}`
    } else if (timerState.active) {
      title = formatMs(timerState.elapsed)
    }

    if (tray && process.platform === 'darwin') {
      tray.setTitle(title)
    }

    updateThrottleId = null
  }, 5000)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
