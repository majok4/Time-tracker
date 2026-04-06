import { registerProjectHandlers } from './projects'
import { registerSessionHandlers } from './sessions'
import { registerFocusHandlers } from './focus'
import { registerReportHandlers } from './reports'
import { registerSettingsHandlers } from './settings'

export function registerAllIpcHandlers(): void {
  registerProjectHandlers()
  registerSessionHandlers()
  registerFocusHandlers()
  registerReportHandlers()
  registerSettingsHandlers()
}
