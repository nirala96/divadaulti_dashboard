declare module 'frappe-gantt' {
  export interface GanttTask {
    id: string
    name: string
    start: string
    end: string
    progress: number
    dependencies?: string
    custom_class?: string
    [key: string]: any
  }

  export interface GanttOptions {
    view_mode?: 'Day' | 'Week' | 'Month' | 'Year'
    date_format?: string
    language?: string
    header_height?: number
    column_width?: number
    step?: number
    bar_height?: number
    bar_corner_radius?: number
    arrow_curve?: number
    padding?: number
    view_modes?: string[]
    popup_trigger?: string
    custom_popup_html?: (task: GanttTask) => string
    on_click?: (task: GanttTask) => void
    on_date_change?: (task: GanttTask, start: Date, end: Date) => void
    on_progress_change?: (task: GanttTask, progress: number) => void
    on_view_change?: (mode: string) => void
  }

  export default class Gantt {
    constructor(container: HTMLElement, tasks: GanttTask[], options?: GanttOptions)
    change_view_mode(mode: string): void
    refresh(tasks: GanttTask[]): void
    clear(): void
  }
}
