import { useCallback, memo, useMemo } from 'react'
import { Currency, TradeType, CurrencyAmount } from '@pancakeswap/sdk'
import { InjectedModalProps, ConfirmationPendingContent } from '@pancakeswap/uikit'
import { useTranslation } from '@pancakeswap/localization'
import { Trade } from '@pancakeswap/smart-router/evm'

import { TransactionSubmittedContent } from 'components/TransactionConfirmationModal'
import { Field } from 'state/swap/actions'
import { useActiveChainId } from 'hooks/useActiveChainId'
import { useUserSlippageTolerance } from 'state/user/hooks'
import { useSwapState } from 'state/swap/hooks'

import ConfirmSwapModalContainer from '../../components/ConfirmSwapModalContainer'
import { SwapTransactionErrorContent } from '../../components/SwapTransactionErrorContent'
import { TransactionConfirmSwapContent } from '../components'

interface ConfirmSwapModalProps {
  trade?: Trade<TradeType>
  originalTrade?: Trade<TradeType>
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> }
  attemptingTxn: boolean
  txHash?: string
  onAcceptChanges: () => void
  onConfirm: () => void
  swapErrorMessage?: string
  customOnDismiss?: () => void
  openSettingModal?: () => void
}

export const ConfirmSwapModal = memo<InjectedModalProps & ConfirmSwapModalProps>(function ConfirmSwapModalComp({
  trade,
  originalTrade,
  currencyBalances,
  onAcceptChanges,
  onConfirm,
  onDismiss,
  customOnDismiss,
  swapErrorMessage,
  attemptingTxn,
  txHash,
  openSettingModal,
}) {
  const { chainId } = useActiveChainId()
  const { t } = useTranslation()
  const [allowedSlippage] = useUserSlippageTolerance()
  const { recipient } = useSwapState()

  const handleDismiss = useCallback(() => {
    if (customOnDismiss) {
      customOnDismiss()
    }
    onDismiss?.()
  }, [customOnDismiss, onDismiss])

  const confirmationContent = useCallback(
    () =>
      swapErrorMessage ? (
        <SwapTransactionErrorContent
          openSettingModal={openSettingModal}
          onDismiss={onDismiss}
          message={swapErrorMessage}
        />
      ) : (
        <TransactionConfirmSwapContent
          trade={trade}
          currencyBalances={currencyBalances}
          originalTrade={originalTrade}
          onAcceptChanges={onAcceptChanges}
          allowedSlippage={allowedSlippage}
          onConfirm={onConfirm}
          recipient={recipient}
        />
      ),
    [
      trade,
      originalTrade,
      onAcceptChanges,
      allowedSlippage,
      onConfirm,
      recipient,
      swapErrorMessage,
      onDismiss,
      openSettingModal,
      currencyBalances,
    ],
  )

  // text to show while loading
  const pendingText = useMemo(() => {
    return t('Swapping %amountA% %symbolA% for %amountB% %symbolB%', {
      amountA: trade?.inputAmount?.toSignificant(6) ?? '',
      symbolA: trade?.inputAmount?.currency?.symbol ?? '',
      amountB: trade?.outputAmount?.toSignificant(6) ?? '',
      symbolB: trade?.outputAmount?.currency?.symbol ?? '',
    })
  }, [t, trade])

  if (!chainId) return null

  return (
    <ConfirmSwapModalContainer handleDismiss={handleDismiss}>
      {attemptingTxn ? (
        <ConfirmationPendingContent pendingText={pendingText} />
      ) : txHash ? (
        <TransactionSubmittedContent
          chainId={chainId}
          hash={txHash}
          onDismiss={handleDismiss}
          currencyToAdd={trade?.outputAmount.currency}
        />
      ) : (
        confirmationContent()
      )}
    </ConfirmSwapModalContainer>
  )
})
