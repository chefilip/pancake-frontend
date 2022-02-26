import { memo } from 'react'
import { Table, Th, Td, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useGelatoOpenLimitOrders } from 'hooks/limitOrders/useGelatoLimitOrdersHistory'

import { useTranslation } from 'contexts/Localization'
import Navigation from 'components/TableNavigation'
import CompactRow from './CompactRow'
import NoOrderTable from './NoOrderTable'
import { LimitOrderTableProps } from './types'
import HeaderCellStyle from './HeaderCellStyle'
import FullRow from './FullRow'
import LoadingTable from './LoadingTable'

const OpenOrderTable: React.FC<LimitOrderTableProps> = ({ isChartDisplayed }) => {
  const { isTablet } = useMatchBreakpoints()
  const compactMode = !isChartDisplayed || isTablet
  const { t } = useTranslation()
  const orders = useGelatoOpenLimitOrders()

  if (!orders) return <LoadingTable />

  if (!orders?.length) {
    return <NoOrderTable />
  }

  return (
    <Navigation data={orders}>
      {({ paginatedData }) => (
        <Table>
          {compactMode ? (
            <tbody>
              {paginatedData.map((order) => (
                <tr key={order.id}>
                  <Td>
                    <CompactRow order={order} />
                  </Td>
                </tr>
              ))}
            </tbody>
          ) : (
            <>
              <thead>
                <tr>
                  <Th>
                    <HeaderCellStyle>{t('From')}</HeaderCellStyle>
                  </Th>
                  <Th>
                    <HeaderCellStyle>{t('To')}</HeaderCellStyle>
                  </Th>
                  <Th>
                    <HeaderCellStyle>{t('Limit Price')}</HeaderCellStyle>
                  </Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <FullRow key={order.id} order={order} />
                ))}
              </tbody>
            </>
          )}
        </Table>
      )}
    </Navigation>
  )
}

export default memo(OpenOrderTable)
