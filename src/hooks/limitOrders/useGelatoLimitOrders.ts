import { DerivedOrderInfo, useDerivedOrderInfo, useOrderState, useDefaultsFromURLSearch } from 'state/limitOrders/hooks'
import { OrderState } from 'state/limitOrders/types'
import useGelatoLimitOrdersHandlers, { GelatoLimitOrdersHandlers } from './useGelatoLimitOrdersHandlers'

const useGelatoLimitOrders = (): {
  handlers: GelatoLimitOrdersHandlers
  derivedOrderInfo: DerivedOrderInfo
  orderState: OrderState
} => {
  const [localOrderState, localDispatch] = useOrderState()

  useDefaultsFromURLSearch(localDispatch)

  const derivedOrderInfo = useDerivedOrderInfo(localOrderState)
  const localHandlers = useGelatoLimitOrdersHandlers(localDispatch)

  return {
    handlers: localHandlers,
    derivedOrderInfo,
    orderState: localOrderState,
  }
}

export default useGelatoLimitOrders
