/**
 * Универсальный CSV-экспорт на стороне клиента.
 * BOM (0xFEFF) добавляется чтобы Excel открывал кириллицу корректно.
 */
export function exportCsv(filename: string, headers: string[], rows: (string | number)[][]): void {
    const escape = (v: string | number): string => {
        const s = String(v)
        return s.includes(',') || s.includes('"') || s.includes('\n')
            ? `"${s.replace(/"/g, '""')}"`
            : s
    }

    const lines = [
        headers.map(escape).join(','),
        ...rows.map(row => row.map(escape).join(',')),
    ]

    const bom = '\uFEFF'
    const blob = new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
