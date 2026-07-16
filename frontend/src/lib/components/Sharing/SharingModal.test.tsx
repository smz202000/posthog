import '@testing-library/jest-dom'

import { cleanup, render, screen, within } from '@testing-library/react'
import { expectLogic } from 'kea-test-utils'

import { themeLogic } from 'lib/logic/themeLogic'
import { eventUsageLogic } from 'lib/utils/eventUsageLogic'

import { useAvailableFeatures } from '~/mocks/features'
import { useMocks } from '~/mocks/jest'
import { NodeKind } from '~/queries/schema/schema-general'
import { initKeaTests } from '~/test/init'
import { DashboardType, InsightShortId, QueryBasedInsightModel } from '~/types'
import { AvailableFeature } from '~/types'

import { sharingLogic } from './sharingLogic'
import { getInsightDefinitionUrl, SharingModal, SharingModalProps } from './SharingModal'

const createdAt = '2022-06-28T12:30:51.459746Z'
const accessToken = '1AEQjQ2xNLGoiyI0UnNlLzOiBZWWMQ'
const dashboardId = 123
const insightShortId = 'insight456' as InsightShortId
const defaultInsightId = 456

function mockDashboardSharingConfiguration({
    enabled = true,
    passwordRequired = false,
    autoRefreshInterval = 0,
}: {
    enabled?: boolean
    passwordRequired?: boolean
    autoRefreshInterval?: number | null
}): Record<string, any> {
    const sharingConfiguration = {
        created_at: createdAt,
        enabled,
        access_token: accessToken,
        password_required: passwordRequired,
        auto_refresh_interval: autoRefreshInterval,
    }

    return {
        '/api/environments/:team_id/dashboards/:dashboard_id/sharing/': {
            ...sharingConfiguration,
            // Some kea-loader success payloads are wrapped.
            sharingConfiguration,
        },
    }
}

function mockInsightSharingConfiguration({
    insightId,
    passwordRequired = false,
}: {
    insightId: number
    passwordRequired?: boolean
}): Record<string, any> {
    const sharingConfiguration = {
        created_at: createdAt,
        enabled: true,
        access_token: accessToken,
        password_required: passwordRequired,
    }

    return {
        '/api/environments/:team_id/insights/:insight_id/sharing/': {
            ...sharingConfiguration,
            // Some kea-loader success payloads are wrapped.
            sharingConfiguration,
        },
        '/api/environments/:team_id/insights/': {
            results: [
                {
                    id: insightId,
                    short_id: insightShortId,
                },
            ],
        },
    }
}

describe('SharingModal (dashboard)', () => {
    // Unmount the modal portal between tests so its embed CodeSnippet (a themeLogic
    // consumer) can't commit a deferred render after a later file resets the kea store.
    afterEach(() => cleanup())

    function DashboardSharingModalWrapper({
        extraProps,
        autoRefreshInterval = 0,
    }: {
        extraProps?: Partial<SharingModalProps>
        autoRefreshInterval?: number | null
    }): JSX.Element {
        // Render the dashboard sharing modal with `WHITE_LABELLING` so the UI shows
        // the branding option in the form.
        useAvailableFeatures([AvailableFeature.WHITE_LABELLING])
        initKeaTests()
        themeLogic.mount()
        useMocks({
            get: mockDashboardSharingConfiguration({ autoRefreshInterval }),
        })

        const props: SharingModalProps = {
            isOpen: true,
            closeModal: () => {},
            dashboardId,
            title: 'Dashboard permissions & sharing',
            ...extraProps,
        }

        return <SharingModal {...props} />
    }

    it('renders sharing options when sharing is enabled', async () => {
        render(<DashboardSharingModalWrapper />)

        // Sharing section label
        expect(await screen.findByText('Sharing')).toBeInTheDocument()

        // Access control section
        expect(screen.getByText('Access control')).toBeInTheDocument()

        // Dashboard options smoke checks
        expect(screen.getByText(/Show PostHog branding/i)).toBeInTheDocument()
        expect(screen.getByText('Auto refresh shared dashboard')).toBeInTheDocument()
        expect(screen.queryByText('Refresh interval')).not.toBeInTheDocument()
    })

    it('shows the legacy 30-minute interval for existing shared dashboards', async () => {
        render(<DashboardSharingModalWrapper autoRefreshInterval={null} />)

        expect(await screen.findByText('Auto refresh shared dashboard')).toBeInTheDocument()
        expect(await screen.findByText('30 minutes')).toBeInTheDocument()
    })

    it('disables auto refresh when the dashboard range is longer than 30 days', async () => {
        const dashboard = {
            id: dashboardId,
            name: 'Expensive dashboard',
            filters: { date_from: '-90d' },
            tiles: [
                {
                    id: 1,
                    color: null,
                    insight: {
                        id: defaultInsightId,
                        name: 'Trend',
                        query: { kind: 'InsightVizNode', source: { kind: 'TrendsQuery' } },
                    },
                },
            ],
        } as unknown as DashboardType<QueryBasedInsightModel>

        render(<DashboardSharingModalWrapper extraProps={{ dashboard }} />)

        expect(
            await screen.findByText(
                'Auto refresh is disabled because the dashboard date range is Last 90 days, which is longer than 30 days.'
            )
        ).toBeInTheDocument()
        expect(screen.getByRole('switch', { name: 'Auto refresh shared dashboard' })).toBeDisabled()
    })

    it('calls onSharingEnabledChange after the dashboard sharing switch update succeeds', async () => {
        const onSharingEnabledChange = jest.fn()

        initKeaTests()
        useMocks({
            get: mockDashboardSharingConfiguration({ enabled: false }),
            patch: mockDashboardSharingConfiguration({ enabled: true }),
        })

        const bannerLogic = sharingLogic({ dashboardId })
        bannerLogic.mount()
        const logic = sharingLogic({ dashboardId })
        eventUsageLogic.mount()
        await expectLogic(logic, () => {
            logic.mount()
        }).toDispatchActions(['loadSharingConfigurationSuccess'])
        expect(onSharingEnabledChange).not.toHaveBeenCalled()

        await expectLogic(logic, () => {
            logic.actions.setIsEnabled({ enabled: true, onSuccess: onSharingEnabledChange })
        }).toDispatchActions(['setIsEnabledSuccess'])

        expect(onSharingEnabledChange).toHaveBeenCalledTimes(1)
        expect(onSharingEnabledChange).toHaveBeenCalledWith(true)
        logic.unmount()
        bannerLogic.unmount()
        eventUsageLogic.unmount()
    })

    it('does not call onSharingEnabledChange on initial dashboard sharing load', async () => {
        const onSharingEnabledChange = jest.fn()

        initKeaTests()
        useMocks({
            get: mockDashboardSharingConfiguration({ enabled: true }),
        })

        const logic = sharingLogic({ dashboardId })

        await expectLogic(logic, () => {
            logic.mount()
        }).toDispatchActions(['loadSharingConfigurationSuccess'])

        expect(onSharingEnabledChange).not.toHaveBeenCalled()
        logic.unmount()
    })
})

describe('SharingModal (insight)', () => {
    const fakeInsight: Partial<QueryBasedInsightModel> = {
        id: defaultInsightId,
        short_id: insightShortId,
        name: 'My insight',
    }

    afterEach(() => cleanup())

    function InsightSharingModalWrapper({ extraProps }: { extraProps?: Partial<SharingModalProps> }): JSX.Element {
        useAvailableFeatures([])
        initKeaTests()
        themeLogic.mount()
        useMocks({
            get: mockInsightSharingConfiguration({ insightId: defaultInsightId }),
        })

        const props: SharingModalProps = {
            isOpen: true,
            closeModal: () => {},
            title: 'Insight permissions & sharing',
            insightShortId: fakeInsight.short_id,
            insight: fakeInsight,
            previewIframe: true,
            ...extraProps,
        }

        return <SharingModal {...props} />
    }

    it('shows insight-specific options and no dashboard-only options', async () => {
        render(<InsightSharingModalWrapper />)

        // Insight option: Show title and description (insight-specific toggle)
        expect(await screen.findByText(/Show title and description/i)).toBeInTheDocument()

        // Dashboard-only options should not be present
        const modalTitle = await screen.findByText('Insight permissions & sharing')
        const modal = modalTitle.closest('[role="dialog"]')
        expect(modal).toBeTruthy()

        expect(within(modal as HTMLElement).queryByText(/Show insight details/i)).toBeNull()
    })
})

describe('getInsightDefinitionUrl', () => {
    it('generates a template link for an unsaved insight (raw query)', () => {
        const query = {
            kind: NodeKind.InsightVizNode,
            source: {
                kind: NodeKind.TrendsQuery,
                series: [
                    {
                        kind: NodeKind.EventsNode,
                        event: null,
                        name: 'All events',
                        math: 'total',
                    },
                ],
                trendsFilter: {},
            },
        }
        const url = getInsightDefinitionUrl({ query }, 'https://app.posthog.com')
        expect(url).toMatch(/^https:\/\/app\.posthog\.com\/insights\/new#insight=TRENDS&q=%7B.*%7D(%20)?$/)
        // Should not include /project/<id>
        expect(url).not.toContain('/project/')
    })

    it('generates a template link for a saved insight (model)', () => {
        interface MinimalInsight {
            query: any
            id: number
            name: string
        }
        const savedInsight: MinimalInsight = {
            query: {
                kind: NodeKind.InsightVizNode,
                source: {
                    kind: NodeKind.FunnelsQuery,
                    series: [],
                    funnelsFilter: {},
                },
            },
            id: 123,
            name: 'My Funnel',
        }
        const url = getInsightDefinitionUrl(savedInsight, 'https://app.posthog.com')
        expect(url).toMatch(/^https:\/\/app\.posthog\.com\/insights\/new#insight=FUNNELS&q=%7B.*%7D(%20)?$/)
        expect(url).not.toContain('/project/')
    })
})
