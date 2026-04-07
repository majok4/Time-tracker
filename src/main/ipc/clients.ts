import { ipcMain } from 'electron'
import { getAllClients, createClient, updateClient, deleteClient } from '../db/queries/clients'
import type { CreateClientData, UpdateClientData } from '../../shared/types'

export function registerClientHandlers(): void {
  ipcMain.handle('clients:getAll', () => {
    return getAllClients()
  })

  ipcMain.handle('clients:create', (_event, data: CreateClientData) => {
    return createClient(data)
  })

  ipcMain.handle('clients:update', (_event, id: string, data: UpdateClientData) => {
    return updateClient(id, data)
  })

  ipcMain.handle('clients:delete', (_event, id: string) => {
    deleteClient(id)
  })
}
