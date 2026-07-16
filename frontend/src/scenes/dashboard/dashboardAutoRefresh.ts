import { parseDateExpression } from 'lib/components/DateFilter/DateRangePicker/utils'
import { dateFilterToText } from 'lib/utils/dateFilters'

import { DashboardType, QueryBasedInsightModel } from '~/types'

const MAX_AUTO_REFRESH_RANGE_DAYS = 30
const DATE_PARSE_CLOCK_SKEW_DAYS = 1 / (24 * 60)

type DateRangeLike = {
    date_from?: string | null
    date_to?: string | null
}

export type DashboardAutoRefreshRestriction = {
    source: 'dashboard' | 'insight'
    insightName?: string
    dateRangeLabel: string
}

function hasDateRange(dateRange: DateRangeLike | null | undefined): boolean {
    return dateRange?.date_from != null || dateRange?.date_to != null
}

function getQueryDateRange(query: unknown): DateRangeLike {
    if (!query || typeof query !== 'object') {
        return {}
    }
    const queryRecord = query as Record<string, unknown>
    if (queryRecord.dateRange && typeof queryRecord.dateRange === 'object') {
        return queryRecord.dateRange as DateRangeLike
    }
    return getQueryDateRange(queryRecord.source)
}

function dateRangeExceedsLimit(dateRange: DateRangeLike, timezone: string): boolean {
    if (dateRange.date_from === 'all') {
        return true
    }
    const dateFrom = parseDateExpression(dateRange.date_from ?? '-7d', timezone)
    const dateTo = parseDateExpression(dateRange.date_to ?? 'now', timezone)
    return Boolean(
        dateFrom &&
        dateTo &&
        dateTo.diff(dateFrom, 'day', true) > MAX_AUTO_REFRESH_RANGE_DAYS + DATE_PARSE_CLOCK_SKEW_DAYS
    )
}

function getDateRangeLabel(dateRange: DateRangeLike): string {
    return dateFilterToText(dateRange.date_from ?? '-7d', dateRange.date_to, 'the selected date range')
}

export function getDashboardAutoRefreshRestriction(
    dashboard: DashboardType<QueryBasedInsightModel> | null | undefined,
    timezone: string
): DashboardAutoRefreshRestriction | null {
    if (!dashboard) {
        return null
    }

    const dashboardDateRange = dashboard.filters ?? {}
    if (hasDateRange(dashboardDateRange) && dateRangeExceedsLimit(dashboardDateRange, timezone)) {
        return { source: 'dashboard', dateRangeLabel: getDateRangeLabel(dashboardDateRange) }
    }

    for (const tile of dashboard.tiles ?? []) {
        if (!tile.insight) {
            continue
        }
        const tileDateRange = tile.filters_overrides ?? {}
        const insightDateRange = getQueryDateRange(tile.insight.query)
        const effectiveDateRange = hasDateRange(tileDateRange)
            ? tileDateRange
            : hasDateRange(dashboardDateRange)
              ? dashboardDateRange
              : hasDateRange(insightDateRange)
                ? insightDateRange
                : tile.insight.filters

        if (dateRangeExceedsLimit(effectiveDateRange, timezone)) {
            return {
                source: 'insight',
                insightName: tile.insight.name || tile.insight.derived_name || 'An insight',
                dateRangeLabel: getDateRangeLabel(effectiveDateRange),
            }
        }
    }

    return null
}

export function dashboardAutoRefreshRestrictionText(restriction: DashboardAutoRefreshRestriction): string {
    return restriction.source === 'dashboard'
        ? `Auto refresh is disabled because the dashboard date range is ${restriction.dateRangeLabel}, which is longer than 30 days.`
        : `Auto refresh is disabled because “${restriction.insightName}” uses ${restriction.dateRangeLabel}, which is longer than 30 days.`
}
