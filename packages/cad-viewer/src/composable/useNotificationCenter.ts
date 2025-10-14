import { computed, ref } from 'vue'

/**
 * Notification Center Composable
 *
 * Provides a centralized notification system similar to Visual Studio Code.
 *
 * @example
 * ```typescript
 * import { useNotificationCenter } from '@mlightcad/cad-viewer'
 *
 * const { info, warning, error, success, notifications, unreadCount } = useNotificationCenter()
 *
 * // Add different types of notifications
 * info('Information', 'This is an info message')
 * warning('Warning', 'This is a warning message')
 * error('Error', 'This is an error message')
 * success('Success', 'This is a success message')
 *
 * // Add notification with actions
 * error('File Error', 'Failed to load file', {
 *   actions: [
 *     { label: 'Retry', action: () => retryLoad(), primary: true },
 *     { label: 'Cancel', action: () => cancel() }
 *   ],
 *   persistent: true
 * })
 *
 * // Check notification count
 * console.log(`You have ${unreadCount.value} notifications`)
 * ```
 */

export interface Notification {
  id: string
  type: 'info' | 'warning' | 'error' | 'success'
  title: string
  message?: string
  timestamp: Date
  actions?: NotificationAction[]
  persistent?: boolean
  timeout?: number
}

export interface NotificationAction {
  label: string
  action: () => void
  primary?: boolean
}

class NotificationCenter {
  private notifications = ref<Notification[]>([])
  private nextId = 1

  get allNotifications() {
    return computed(() => this.notifications.value)
  }

  get unreadCount() {
    return computed(() => this.notifications.value.length)
  }

  get hasNotifications() {
    return computed(() => this.notifications.value.length > 0)
  }

  add(notification: Omit<Notification, 'id' | 'timestamp'>) {
    const newNotification: Notification = {
      ...notification,
      id: `notification-${this.nextId++}`,
      timestamp: new Date()
    }

    this.notifications.value.unshift(newNotification)

    return newNotification.id
  }

  remove(id: string) {
    const index = this.notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      this.notifications.value.splice(index, 1)
    }
  }

  clear() {
    this.notifications.value = []
  }

  clearAll() {
    this.clear()
  }

  // Convenience methods for different notification types
  info(title: string, message?: string, options?: Partial<Notification>) {
    return this.add({
      type: 'info',
      title,
      message,
      ...options
    })
  }

  warning(title: string, message?: string, options?: Partial<Notification>) {
    return this.add({
      type: 'warning',
      title,
      message,
      ...options
    })
  }

  error(title: string, message?: string, options?: Partial<Notification>) {
    return this.add({
      type: 'error',
      title,
      message,
      persistent: true, // Errors are persistent by default
      ...options
    })
  }

  success(title: string, message?: string, options?: Partial<Notification>) {
    return this.add({
      type: 'success',
      title,
      message,
      ...options
    })
  }
}

// Global notification center instance
const notificationCenter = new NotificationCenter()

/**
 * Hook to access the notification center functionality
 *
 * @returns Object containing notification management functions and reactive state
 */
export function useNotificationCenter() {
  return {
    /** Reactive list of all notifications */
    notifications: notificationCenter.allNotifications,
    /** Reactive count of unread notifications */
    unreadCount: notificationCenter.unreadCount,
    /** Reactive boolean indicating if there are any notifications */
    hasNotifications: notificationCenter.hasNotifications,
    /** Add a custom notification */
    add: notificationCenter.add.bind(notificationCenter),
    /** Remove a notification by ID */
    remove: notificationCenter.remove.bind(notificationCenter),
    /** Clear all notifications */
    clear: notificationCenter.clear.bind(notificationCenter),
    /** Clear all notifications (alias for clear) */
    clearAll: notificationCenter.clearAll.bind(notificationCenter),
    /** Add an info notification */
    info: notificationCenter.info.bind(notificationCenter),
    /** Add a warning notification */
    warning: notificationCenter.warning.bind(notificationCenter),
    /** Add an error notification */
    error: notificationCenter.error.bind(notificationCenter),
    /** Add a success notification */
    success: notificationCenter.success.bind(notificationCenter)
  }
}
