import type { Lang } from '@/shared/i18n'

export interface NotificationItem {
    id: string
    title: string
    body: string
    type: 'info' | 'success' | 'warning' | 'error'
    is_read: boolean
    created_at: string
}

const STORAGE_KEY = 'mock_notifications'

const TEMPLATES: Record<Lang, Array<Pick<NotificationItem, 'title' | 'body' | 'type'>>> = {
    ru: [
        { title: 'Новая поставка на ПВЗ', body: 'Ожидается поступление товара в течение часа.', type: 'info' },
        { title: 'Смена закрыта', body: 'Отчёт по вечерней смене успешно сохранён.', type: 'success' },
        { title: 'Высокая нагрузка', body: 'На одном из ПВЗ зафиксирован рост очереди.', type: 'warning' },
        { title: 'Возврат оформлен', body: 'Клиент завершил возврат без замечаний.', type: 'success' },
        { title: 'Проблема с выдачей', body: 'Проверьте заказ, который ожидает подтверждения.', type: 'error' },
        { title: 'Изменение расписания', body: 'На завтра обновлены часы работы сотрудников.', type: 'info' },
        { title: 'Остатки обновлены', body: 'Синхронизация данных по складу завершена.', type: 'success' },
    ],
    en: [
        { title: 'New PVZ delivery', body: 'A shipment is expected within the next hour.', type: 'info' },
        { title: 'Shift closed', body: 'The evening shift report was saved successfully.', type: 'success' },
        { title: 'High workload', body: 'One of the PVZ locations has a growing queue.', type: 'warning' },
        { title: 'Return completed', body: 'A customer return was processed successfully.', type: 'success' },
        { title: 'Pickup issue', body: 'Please check the order waiting for confirmation.', type: 'error' },
        { title: 'Schedule updated', body: 'Working hours for tomorrow were updated.', type: 'info' },
        { title: 'Inventory synced', body: 'Warehouse stock data sync has finished.', type: 'success' },
    ],
}

function shuffle<T>(items: T[]): T[] {
    const next = [...items]

    for (let index = next.length - 1; index > 0; index -= 1) {
        const randomIndex = Math.floor(Math.random() * (index + 1))
        ;[next[index], next[randomIndex]] = [next[randomIndex], next[index]]
    }

    return next
}

function saveNotifications(items: NotificationItem[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function getNotifications(): NotificationItem[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return []

        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

export function refreshNotifications(lang: Lang): NotificationItem[] {
    const count = Math.floor(Math.random() * 5) + 1
    const templates = shuffle(TEMPLATES[lang]).slice(0, count)
    const now = Date.now()

    const items = templates.map((template, index) => ({
        id: crypto.randomUUID(),
        title: template.title,
        body: template.body,
        type: template.type,
        is_read: false,
        created_at: new Date(now - index * 1000 * 60 * (Math.floor(Math.random() * 45) + 3)).toISOString(),
    }))

    saveNotifications(items)
    return items
}

export function markNotificationRead(id: string): NotificationItem[] {
    const items = getNotifications().map((item) =>
        item.id === id ? { ...item, is_read: true } : item
    )

    saveNotifications(items)
    return items
}

export function markAllNotificationsRead(): NotificationItem[] {
    const items = getNotifications().map((item) => ({ ...item, is_read: true }))
    saveNotifications(items)
    return items
}

export function getUnreadNotificationsCount(): number {
    return getNotifications().filter((item) => !item.is_read).length
}
