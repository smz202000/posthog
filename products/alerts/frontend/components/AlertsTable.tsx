import type { ReactNode } from 'react'

import { LemonTag } from '@posthog/lemon-ui'

import { TZLabel } from 'lib/components/TZLabel'
import { LemonTable, LemonTableColumn, LemonTableProps } from 'lib/lemon-ui/LemonTable'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'

type AlertTableRecord = Record<string, any> & {
    created_by?: {
        email?: string | null
        first_name?: string | null
    } | null
    enabled?: boolean | null
    id: string | number
    last_checked_at?: string | null
    last_notified_at?: string | null
    name?: string | null
}

export type AlertsTableGenericColumn = 'name' | 'lastChecked' | 'lastNotified' | 'createdBy' | 'enabled'
export type AlertsTableColumn<T extends AlertTableRecord> =
    | AlertsTableGenericColumn
    | LemonTableColumn<T, keyof T | undefined>

export interface AlertsTableProps<T extends AlertTableRecord> extends Omit<
    LemonTableProps<T>,
    'columns' | 'dataSource' | 'emptyState' | 'noSortingCancellation' | 'nouns' | 'rowKey'
> {
    alerts: T[]
    columns: AlertsTableColumn<T>[]
    emptyState?: ReactNode
    genericColumnOverrides?: Partial<Record<AlertsTableGenericColumn, LemonTableColumn<T, keyof T | undefined>>>
    getAlertUrl?: (alert: T) => string
    isFiltering?: boolean
}

function timestampColumn<T extends AlertTableRecord>(
    title: string,
    dataIndex: 'last_checked_at' | 'last_notified_at'
): LemonTableColumn<T, keyof T | undefined> {
    return {
        title,
        sorter: true,
        defaultSortOrder: -1,
        dataIndex,
        render: function renderTimestamp(_, alert) {
            const timestamp = alert[dataIndex]
            return (
                <div className="whitespace-nowrap">
                    {timestamp ? <TZLabel time={timestamp} /> : <span className="text-muted">N/A</span>}
                </div>
            )
        },
    }
}

function genericColumn<T extends AlertTableRecord>(
    column: AlertsTableGenericColumn,
    getAlertUrl?: (alert: T) => string
): LemonTableColumn<T, keyof T | undefined> {
    switch (column) {
        case 'name':
            return {
                title: 'Name',
                dataIndex: 'name',
                key: 'name',
                render: function renderName(_, alert) {
                    const title = alert.name || 'Untitled alert'
                    if (!getAlertUrl) {
                        return title
                    }

                    return (
                        <LemonTableLink
                            to={getAlertUrl(alert)}
                            className={alert.enabled === false ? 'text-muted' : ''}
                            title={title}
                        />
                    )
                },
            }
        case 'lastChecked':
            return timestampColumn('Last checked', 'last_checked_at')
        case 'lastNotified':
            return timestampColumn('Last notified', 'last_notified_at')
        case 'createdBy':
            return {
                title: 'Created by',
                dataIndex: 'created_by',
                key: 'created_by',
                render: function renderCreatedBy(_, alert) {
                    return (
                        <span className="text-muted text-xs">
                            {alert.created_by?.first_name || alert.created_by?.email || 'N/A'}
                        </span>
                    )
                },
            }
        case 'enabled':
            return {
                title: 'Enabled',
                dataIndex: 'enabled',
                key: 'enabled',
                render: function renderEnabled(_, alert) {
                    return alert.enabled ? (
                        <LemonTag type="success">ENABLED</LemonTag>
                    ) : (
                        <LemonTag type="danger">DISABLED</LemonTag>
                    )
                },
            }
    }
}

export function AlertsTable<T extends AlertTableRecord>({
    alerts,
    columns,
    emptyState,
    genericColumnOverrides,
    getAlertUrl,
    isFiltering = false,
    loadingSkeletonRows = 5,
    ...tableProps
}: AlertsTableProps<T>): JSX.Element {
    let resolvedEmptyState = emptyState
    if (resolvedEmptyState === undefined && isFiltering) {
        resolvedEmptyState = <div className="py-8 text-center text-secondary">No alerts match your filters</div>
    }

    const resolvedColumns = columns.map((column) => {
        if (typeof column !== 'string') {
            return column
        }

        return genericColumnOverrides?.[column] || genericColumn(column, getAlertUrl)
    })

    return (
        <LemonTable
            {...tableProps}
            columns={resolvedColumns}
            dataSource={alerts}
            emptyState={resolvedEmptyState}
            loadingSkeletonRows={loadingSkeletonRows}
            noSortingCancellation
            nouns={['alert', 'alerts']}
            rowKey="id"
        />
    )
}
