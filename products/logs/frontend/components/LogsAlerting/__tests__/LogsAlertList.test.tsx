import { render, screen } from '@testing-library/react'

import { createDefaultAlertsTableColumns } from 'products/alerts/frontend/components/AlertsTable'
import { LogsAlertConfigurationApi } from 'products/logs/frontend/generated/api.schemas'

import { buildLogsAlertLastCheckedColumn } from '../LogsAlertList'

describe('LogsAlertList', () => {
    it('keeps the last checked column unsortable and labels missing timestamps as never', () => {
        const defaultColumns = createDefaultAlertsTableColumns<LogsAlertConfigurationApi>()
        const column = buildLogsAlertLastCheckedColumn(defaultColumns.lastChecked)
        const alert = { last_checked_at: null } as LogsAlertConfigurationApi

        expect(column.sorter).toBeUndefined()
        expect(column.defaultSortOrder).toBeUndefined()

        render(<>{column.render?.(undefined, alert, 0, 0)}</>)

        expect(screen.getByText('Never')).toBeTruthy()
    })
})
