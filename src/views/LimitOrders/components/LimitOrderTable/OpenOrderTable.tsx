import { memo } from 'react'
import { useGelatoOpenLimitOrders } from 'hooks/limitOrders/useGelatoLimitOrdersHistory'
import CompactLimitOrderTable from './CompactLimitOrderTable'

const OpenOrderTable = () => {
  const orders = useGelatoOpenLimitOrders()

  return <CompactLimitOrderTable orders={orders} />
}

export default memo(OpenOrderTable)
