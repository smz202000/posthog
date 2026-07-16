import { dayjs } from 'lib/dayjs'
import { componentsToDayJs, dateFilterToText, dateStringToComponents, dateStringToDayJs } from 'lib/utils/dateFilters'

import { DashboardType, QueryBasedInsightModel } from '~/types'

const MAX_AUTO_REFRESH_RANGE_DAYS = 30

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
    const currentTime = dayjs().tz(timezone)
    const parseDate = (value: string): dayjs.Dayjs | null => {
        const components = dateStringToComponents(value)
        return components ? componentsToDayJs(components, currentTime, timezone) : dateStringToDayJs(value, timezone)
    }
    const dateTo = dateRange.date_to ? parseDate(dateRange.date_to) : currentTime
    const dateFrom = parseDate(dateRange.date_from ?? '-7d')
    return !dateFrom || !dateTo || dateTo.diff(dateFrom, 'day', true) > MAX_AUTO_REFRESH_RANGE_DAYS
}

function getDateRangeLabel(dateRange: DateRangeLike): string {
    return dateFilterToText(dateRange.date_from ?? '-7d', dateRange.date_to, 'the selected date range') ?? 'Unknown'
}

export function getDashboardAutoRefreshRestriction(
    dashboard: DashboardType<QueryBasedInsightModel> | null | undefined,
    timezone: string
): DashboardAutoRefreshRestriction | null {
    if (!dashboard) {
        return null
    }

    const dashboardDateRange =
        dashboard.persisted_filters === undefined ? (dashboard.filters ?? {}) : (dashboard.persisted_filters ?? {})

    for (const tile of dashboard.tiles ?? []) {
        if (!tile.insight) {
            continue
        }
        const tileDateRange = tile.filters_overrides ?? {}
        const insightDateRange = getQueryDateRange(tile.insight.query)
        const legacyInsightDateRange = (tile.insight as QueryBasedInsightModel & { filters?: DateRangeLike }).filters
        const source = hasDateRange(tileDateRange)
            ? 'insight'
            : hasDateRange(dashboardDateRange)
              ? 'dashboard'
              : 'insight'
        const effectiveDateRange = hasDateRange(tileDateRange)
            ? tileDateRange
            : hasDateRange(dashboardDateRange)
              ? dashboardDateRange
              : hasDateRange(insightDateRange)
                ? insightDateRange
                : (legacyInsightDateRange ?? {})

        if (dateRangeExceedsLimit(effectiveDateRange, timezone)) {
            return source === 'dashboard'
                ? { source, dateRangeLabel: getDateRangeLabel(effectiveDateRange) }
                : {
                      source,
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
