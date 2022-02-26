import { memo } from 'react'
import { useGelatoLimitOrdersHistory } from 'hooks/limitOrders/useGelatoLimitOrdersHistory'
import CompactLimitOrderTable from './CompactLimitOrderTable'

const HistoryOrderTable = () => {
  const orders = useGelatoLimitOrdersHistory()

  return <CompactLimitOrderTable orders={orders} />
}

export default memo(HistoryOrderTable)
