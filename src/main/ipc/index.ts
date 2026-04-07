import { registerProjectHandlers } from './projects'
import { registerSessionHandlers } from './sessions'
import { registerFocusHandlers } from './focus'
import { registerReportHandlers } from './reports'
import { registerSettingsHandlers } from './settings'
import { registerClientHandlers } from './clients'

export function registerAllIpcHandlers(): void {
  registerProjectHandlers()
  registerSessionHandlers()
  registerFocusHandlers()
  registerReportHandlers()
  registerSettingsHandlers()
  registerClientHandlers()
}
