import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { INotification } from '@shared/models/graf'

interface NotificationsState {
  // State
  notifications: INotification

  // Actions
  setNotification: (notification: INotification) => void
  clearNotification: () => void
  showSuccess: (title: string, content: string | string[]) => void
  showError: (title: string, content: string | string[]) => void
  showWarning: (title: string, content: string | string[]) => void
  showInfo: (title: string, content: string | string[]) => void
}

const initialNotification: INotification = {
  content: [''],
  title: '',
  type: undefined
}

export const useNotificationsStore = create<NotificationsState>()(
  devtools(
    (set) => ({
      // Initial state
      notifications: initialNotification,

      // Actions
      setNotification: (notification) =>
        set({ notifications: notification }, false, 'notifications/setNotification'),

      clearNotification: () =>
        set({ notifications: initialNotification }, false, 'notifications/clearNotification'),

      showSuccess: (title, content) =>
        set(
          {
            notifications: {
              title,
              content: Array.isArray(content) ? content : [content],
              type: 'success'
            }
          },
          false,
          'notifications/showSuccess'
        ),

      showError: (title, content) =>
        set(
          {
            notifications: {
              title,
              content: Array.isArray(content) ? content : [content],
              type: 'error'
            }
          },
          false,
          'notifications/showError'
        ),

      showWarning: (title, content) =>
        set(
          {
            notifications: {
              title,
              content: Array.isArray(content) ? content : [content],
              type: 'warning'
            }
          },
          false,
          'notifications/showWarning'
        ),

      showInfo: (title, content) =>
        set(
          {
            notifications: {
              title,
              content: Array.isArray(content) ? content : [content],
              type: 'info'
            }
          },
          false,
          'notifications/showInfo'
        )
    }),
    { name: 'NotificationsStore' }
  )
)
