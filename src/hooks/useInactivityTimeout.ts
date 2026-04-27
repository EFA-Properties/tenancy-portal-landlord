import { useEffect, useRef, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'

const INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_BEFORE = 2 * 60 * 1000 // Show warning 2 minutes before logout
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

/**
 * Auto-signs out the user after 30 minutes of inactivity.
 * Shows a warning toast 2 minutes before logout.
 */
export function useInactivityTimeout() {
  const { user, logout } = useAuth()
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningElRef = useRef<HTMLDivElement | null>(null)

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    if (warningRef.current) clearTimeout(warningRef.current)
    dismissWarning()
  }, [])

  const dismissWarning = () => {
    if (warningElRef.current) {
      warningElRef.current.remove()
      warningElRef.current = null
    }
  }

  const showWarning = useCallback(() => {
    // Don't show duplicate
    if (warningElRef.current) return

    const el = document.createElement('div')
    el.id = 'inactivity-warning'
    el.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      background: #1e293b; color: white; padding: 16px 24px;
      border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.2);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px; line-height: 1.5; max-width: 360px;
      animation: slideIn 0.3s ease-out;
    `
    el.innerHTML = `
      <style>@keyframes slideIn { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }</style>
      <p style="margin:0 0 4px 0; font-weight:600;">Session expiring soon</p>
      <p style="margin:0; opacity:0.8; font-size:13px;">You'll be signed out in 2 minutes due to inactivity. Move your mouse or press any key to stay signed in.</p>
    `
    document.body.appendChild(el)
    warningElRef.current = el
  }, [])

  const resetTimer = useCallback(() => {
    if (!user) return

    clearTimers()

    // Set warning timer (fires 2 min before logout)
    warningRef.current = setTimeout(() => {
      showWarning()
    }, INACTIVITY_TIMEOUT - WARNING_BEFORE)

    // Set logout timer
    timeoutRef.current = setTimeout(async () => {
      dismissWarning()
      try {
        await logout()
        window.location.href = '/login?reason=inactivity'
      } catch {
        window.location.href = '/login?reason=inactivity'
      }
    }, INACTIVITY_TIMEOUT)
  }, [user, logout, clearTimers, showWarning])

  useEffect(() => {
    if (!user) {
      clearTimers()
      return
    }

    // Start the timer
    resetTimer()

    // Reset on any user activity
    const handleActivity = () => {
      resetTimer()
    }

    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [user, resetTimer, clearTimers])
}
