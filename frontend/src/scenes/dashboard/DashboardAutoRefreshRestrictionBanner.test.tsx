import '@testing-library/jest-dom'

import { render } from '@testing-library/react'

import { DashboardPlacement } from '~/types'

import { DashboardAutoRefreshRestrictionBanner } from './DashboardAutoRefreshRestrictionBanner'

describe('DashboardAutoRefreshRestrictionBanner', () => {
    it.each([DashboardPlacement.Public, DashboardPlacement.Export])(
        'does not mount sharing state for %s placement',
        (placement) => {
            const { container } = render(<DashboardAutoRefreshRestrictionBanner placement={placement} />)

            expect(container).toBeEmptyDOMElement()
        }
    )
})
