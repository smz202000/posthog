import { useActions, useValues } from 'kea'
import { router } from 'kea-router'

import * as magnifyingGlassPng from '@posthog/brand/hoggies/png/magnifying-glass'
import { Link } from '@posthog/lemon-ui'

import { pngHoggie } from 'lib/brand/hoggies'
import { ProductIntroduction } from 'lib/components/ProductIntroduction/ProductIntroduction'
import { urls } from 'scenes/urls'

import { ProductKey } from '~/queries/schema/schema-general'

import { AlertsFiltersBar } from '../components/AlertsFiltersBar'
import { alertLogic } from '../logic/alertLogic'
import { alertsLogic } from '../logic/alertsLogic'
import { AlertType } from '../types'
import { EditAlertModal } from './EditAlertModal'
import { InsightAlertsTable } from './InsightAlertsTable'

const HedgehogMagnifyingGlass = pngHoggie(magnifyingGlassPng)

interface AlertsProps {
    alertId: AlertType['id'] | null
}

export function Alerts({ alertId }: AlertsProps): JSX.Element {
    const { push } = useActions(router)
    const logic = alertsLogic()
    const { loadAlerts } = useActions(logic)
    const { alertsSortedByState, alertsResponseLoading, pagination, alertsCount, isFiltering } = useValues(logic)

    const { alert } = useValues(alertLogic({ alertId }))

    const isEmpty = alertsCount === 0 && !alertsResponseLoading && !isFiltering
    // TODO: add info here to sign up for alerts early access
    return (
        <>
            {isEmpty && (
                <ProductIntroduction
                    productName="Alerts"
                    productKey={ProductKey.ALERTS}
                    thingName="alert"
                    description="Alerts enable you to monitor your insight and notify you when certain conditions are met."
                    isEmpty
                    customHog={HedgehogMagnifyingGlass}
                    actionElementOverride={
                        <span className="italic">
                            To get started, visit a <Link to={urls.insights()}>trends insight</Link>, visit the
                            'Actions' in the sidebar and click 'Alerts'
                        </span>
                    }
                    mcpSurfaceKey="alerts.create"
                />
            )}

            {alert && (
                <EditAlertModal
                    onClose={() => push(urls.alerts())}
                    isOpen
                    alertId={alert.id}
                    insightShortId={alert.insight.short_id}
                    insightId={alert.insight.id}
                    insightLogicProps={{ dashboardItemId: alert.insight.short_id }}
                    onEditSuccess={() => {
                        loadAlerts()
                        push(urls.alerts())
                    }}
                />
            )}

            {isEmpty ? null : (
                <>
                    <AlertsFiltersBar />
                    <InsightAlertsTable
                        alerts={alertsSortedByState}
                        loading={alertsResponseLoading}
                        pagination={pagination}
                        isFiltering={isFiltering}
                    />
                </>
            )}
        </>
    )
}
