import { Tooltip } from '@posthog/lemon-ui'

import { LemonTableColumn, LemonTableProps } from 'lib/lemon-ui/LemonTable'
import { createdByColumn } from 'lib/lemon-ui/LemonTable/columnUtils'
import { LemonTableLink } from 'lib/lemon-ui/LemonTable/LemonTableLink'
import { urls } from 'scenes/urls'

import { AlertState } from '~/queries/schema/schema-general'

import { AlertsTable, AlertsTableColumn } from 'products/alerts/frontend/components/AlertsTable'
import { alertIntervalDisplayLabel } from 'products/alerts/frontend/logic/alertIntervalHelpers'

import { AlertType } from '../types'
import { AlertStateIndicator } from './ManageAlertsModal'

interface InsightAlertsTableProps {
    alerts: AlertType[]
    isFiltering: boolean
    loading: boolean
    pagination: LemonTableProps<AlertType>['pagination']
}

export function InsightAlertsTable({ alerts, isFiltering, loading, pagination }: InsightAlertsTableProps): JSX.Element {
    const columnsBeforeName: AlertsTableColumn<AlertType>[] = [
        {
            key: 'id',
            width: 32,
        },
    ]
    const columnsAfterName: AlertsTableColumn<AlertType>[] = [
        {
            title: 'Status',
            dataIndex: 'state',
            render: function renderStateIndicator(_, alert) {
                return alert.enabled ? <AlertStateIndicator alert={alert} /> : null
            },
        },
        {
            title: 'Interval',
            dataIndex: 'calculation_interval',
            key: 'calculation_interval',
            render: function renderInterval(_, alert) {
                return <div className="whitespace-nowrap">{alertIntervalDisplayLabel(alert.calculation_interval)}</div>
            },
        },
    ]
    const columnsAfterCreatedBy: AlertsTableColumn<AlertType>[] = [
        {
            title: 'Insight',
            dataIndex: 'insight',
            key: 'insight',
            render: function renderInsightLink(_, alert) {
                return (
                    <LemonTableLink
                        to={urls.insightView(alert.insight.short_id)}
                        title={
                            <Tooltip title={alert.insight.name}>
                                <div>{alert.insight.name || alert.insight.derived_name}</div>
                            </Tooltip>
                        }
                    />
                )
            },
        },
    ]

    return (
        <AlertsTable
            alerts={alerts}
            columnAdditions={{
                name: { before: columnsBeforeName, after: columnsAfterName },
                createdBy: { after: columnsAfterCreatedBy },
            }}
            genericColumnOverrides={{
                createdBy: createdByColumn<AlertType>() as LemonTableColumn<AlertType, keyof AlertType | undefined>,
            }}
            getAlertUrl={(alert) => urls.alert(alert.id)}
            isFiltering={isFiltering}
            loading={loading}
            pagination={pagination}
            rowClassName={(alert) => (alert.state === AlertState.NOT_FIRING ? null : 'highlighted')}
        />
    )
}
