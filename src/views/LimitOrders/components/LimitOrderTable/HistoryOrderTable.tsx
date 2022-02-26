import { memo } from 'react'
import { Table, Th, Td, useMatchBreakpoints } from '@pancakeswap/uikit'
import { useGelatoLimitOrdersHistory } from 'hooks/limitOrders/useGelatoLimitOrdersHistory'

import Navigation from 'components/TableNavigation'
import { useTranslation } from 'contexts/Localization'
import CompactRow from './CompactRow'
import NoOrderTable from './NoOrderTable'
import { LimitOrderTableProps } from './types'
import HeaderCellStyle from './HeaderCellStyle'
import FullRow from './FullRow'
import LoadingTable from './LoadingTable'

const HistoryOrderTable: React.FC<LimitOrderTableProps> = ({ isChartDisplayed }) => {
  const { isTablet } = useMatchBreakpoints()
  const { t } = useTranslation()
  const compactMode = !isChartDisplayed || isTablet
  const orders = useGelatoLimitOrdersHistory()

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
                    <HeaderCellStyle>{t('Status')}</HeaderCellStyle>
                  </Th>
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

export default memo(HistoryOrderTable)
