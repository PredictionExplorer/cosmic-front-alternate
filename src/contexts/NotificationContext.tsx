/**
 * Notification Context
 *
 * Provides a global notification system for the application.
 * Displays toast messages for success, error, warning, and info events.
 *
 * Features:
 * - Multiple notification types with distinct styling
 * - Auto-dismiss with configurable duration
 * - Queue system for multiple notifications
 * - Elegant animations matching luxury aesthetic
 */

'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

/**
 * Notification types
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Notification object
 */
export interface Notification {
	id: string;
	type: NotificationType;
	message: string;
	duration?: number;
}

/**
 * Context value type
 */
interface NotificationContextValue {
	showNotification: (type: NotificationType, message: string, duration?: number) => void;
	showSuccess: (message: string, duration?: number) => void;
	showError: (message: string, duration?: number) => void;
	showWarning: (message: string, duration?: number) => void;
	showInfo: (message: string, duration?: number) => void;
	hideNotification: (id: string) => void;
}

/**
 * Create context
 */
const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Notification Provider Props
 */
interface NotificationProviderProps {
	children: ReactNode;
}

/**
 * Notification Provider Component
 *
 * Manages notification state and provides functions to show/hide notifications.
 * Must be placed near the root of the application.
 */
export function NotificationProvider({ children }: NotificationProviderProps) {
	const [notifications, setNotifications] = useState<Notification[]>([]);

	/**
	 * Hide a notification
	 */
	const hideNotification = useCallback((id: string) => {
		setNotifications(prev => prev.filter(n => n.id !== id));
	}, []);

	/**
	 * Show a notification
	 */
	const showNotification = useCallback(
		(type: NotificationType, message: string, duration: number = 5000) => {
			const id = `${Date.now()}-${Math.random()}`;
			const notification: Notification = { id, type, message, duration };

			setNotifications(prev => [...prev, notification]);

			// Auto-dismiss after duration
			if (duration > 0) {
				setTimeout(() => {
					hideNotification(id);
				}, duration);
			}
		},
		[hideNotification]
	);

	/**
	 * Convenience methods
	 */
	const showSuccess = useCallback(
		(message: string, duration?: number) => showNotification('success', message, duration),
		[showNotification]
	);

	const showError = useCallback(
		(message: string, duration?: number) => showNotification('error', message, duration),
		[showNotification]
	);

	const showWarning = useCallback(
		(message: string, duration?: number) => showNotification('warning', message, duration),
		[showNotification]
	);

	const showInfo = useCallback(
		(message: string, duration?: number) => showNotification('info', message, duration),
		[showNotification]
	);

	const value: NotificationContextValue = {
		showNotification,
		showSuccess,
		showError,
		showWarning,
		showInfo,
		hideNotification
	};

	return (
		<NotificationContext.Provider value={value}>
			{children}
			<NotificationContainer notifications={notifications} onClose={hideNotification} />
		</NotificationContext.Provider>
	);
}

/**
 * Hook to use notifications
 */
export function useNotification() {
	const context = useContext(NotificationContext);
	if (!context) {
		throw new Error('useNotification must be used within NotificationProvider');
	}
	return context;
}

/**
 * Notification Container
 * Renders all active notifications
 */
function NotificationContainer({
	notifications,
	onClose
}: {
	notifications: Notification[];
	onClose: (id: string) => void;
}) {
	return (
		<div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none">
			<AnimatePresence>
				{notifications.map(notification => (
					<NotificationItem key={notification.id} notification={notification} onClose={onClose} />
				))}
			</AnimatePresence>
		</div>
	);
}

/**
 * Individual Notification Item
 */
function NotificationItem({ notification, onClose }: { notification: Notification; onClose: (id: string) => void }) {
	const { id, type, message } = notification;

	const config = {
		success: {
			icon: CheckCircle,
			bgColor: 'bg-status-success/10',
			borderColor: 'border-status-success/30',
			iconColor: 'text-status-success',
			textColor: 'text-status-success'
		},
		error: {
			icon: XCircle,
			bgColor: 'bg-status-error/10',
			borderColor: 'border-status-error/30',
			iconColor: 'text-status-error',
			textColor: 'text-status-error'
		},
		warning: {
			icon: AlertCircle,
			bgColor: 'bg-status-warning/10',
			borderColor: 'border-status-warning/30',
			iconColor: 'text-status-warning',
			textColor: 'text-status-warning'
		},
		info: {
			icon: Info,
			bgColor: 'bg-status-info/10',
			borderColor: 'border-status-info/30',
			iconColor: 'text-status-info',
			textColor: 'text-status-info'
		}
	}[type];

	const Icon = config.icon;

	return (
		<motion.div
			initial={{ opacity: 0, y: -20, x: 50 }}
			animate={{ opacity: 1, y: 0, x: 0 }}
			exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
			className="pointer-events-auto"
		>
			<div
				className={`
					p-4 rounded-lg border backdrop-blur-xl shadow-luxury-lg
					${config.bgColor} ${config.borderColor}
					flex items-start gap-3
				`}
			>
				<Icon className={`flex-shrink-0 mt-0.5 ${config.iconColor}`} size={20} />

				<div className="flex-1 min-w-0">
					<p className="text-sm text-text-primary leading-relaxed">{message}</p>
				</div>

				<button
					onClick={() => onClose(id)}
					className="flex-shrink-0 p-1 rounded-md hover:bg-background-elevated/50 transition-colors"
					aria-label="Close notification"
				>
					<X className="text-text-secondary hover:text-text-primary transition-colors" size={16} />
				</button>
			</div>
		</motion.div>
	);
}
