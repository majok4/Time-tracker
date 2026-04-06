import { ipcMain } from 'electron'
import { getAllProjects, createProject, updateProject, deleteProject } from '../db/queries/projects'
import type { CreateProjectData, UpdateProjectData } from '../../shared/types'

export function registerProjectHandlers(): void {
  ipcMain.handle('projects:getAll', (_event, includeArchived = false) => {
    return getAllProjects(includeArchived)
  })

  ipcMain.handle('projects:create', (_event, data: CreateProjectData) => {
    return createProject(data)
  })

  ipcMain.handle('projects:update', (_event, id: string, data: UpdateProjectData) => {
    return updateProject(id, data)
  })

  ipcMain.handle('projects:delete', (_event, id: string) => {
    deleteProject(id)
  })
}
