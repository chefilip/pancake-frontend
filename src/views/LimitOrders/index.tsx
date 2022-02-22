import React, { useCallback, useEffect, useState } from 'react'
import { CurrencyAmount, Percent, Trade } from '@pancakeswap/sdk'
import { Button, Box, Flex } from '@pancakeswap/uikit'

import { useTranslation } from 'contexts/Localization'
import { AutoColumn } from 'components/Layout/Column'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import { AppBody } from 'components/App'
import ConnectWalletButton from 'components/ConnectWalletButton'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
import useGelatoLimitOrders from 'hooks/limitOrders/useGelatoLimitOrders'
import { ApprovalState, useApproveCallbackFromInputCurrencyAmount } from 'hooks/useApproveCallback'
import { Field } from 'state/limitOrders/types'
import { useDefaultsFromURLSearch } from 'state/limitOrders/hooks'
import { maxAmountSpend } from 'utils/maxAmountSpend'
import { wrappedCurrency } from 'utils/wrappedCurrency'

import { Wrapper, StyledInputCurrencyWrapper, StyledSwapContainer } from './styles'
import CurrencyInputHeader from './components/CurrencyInputHeader'
import LimitOrderPrice from './components/LimitOrderPrice'
import SwitchTokensButton from './components/SwitchTokensButton'
import Page from '../Page'
import OrderHistoryTable from './components/OrderHistoryTable'
import LimitOrderTable from './components/LimitOrderTable'

const LimitOrders = () => {
  // Helpers
  const { account, chainId } = useActiveWeb3React()
  const { t } = useTranslation()

  // TODO: use loadedUrlParams for warnings
  const loadedUrlParams = useDefaultsFromURLSearch()

  // TODO: fiat values

  const {
    handlers: { handleInput, handleCurrencySelection, handleSwitchTokens, handleLimitOrderSubmission, handleRateType },
    derivedOrderInfo: {
      currencies,
      currencyBalances,
      parsedAmounts,
      formattedAmounts,
      rawAmounts,
      trade,
      price,
      inputError,
    },
    orderState: { independentField, rateType },
  } = useGelatoLimitOrders()

  const [{ showConfirm, tradeToConfirm, swapErrorMessage, attemptingTxn, txHash }, setSwapState] = useState<{
    showConfirm: boolean
    tradeToConfirm: Trade | undefined
    attemptingTxn: boolean
    swapErrorMessage: string | undefined
    txHash: string | undefined
  }>({
    showConfirm: false,
    tradeToConfirm: undefined,
    attemptingTxn: false,
    swapErrorMessage: undefined,
    txHash: undefined,
  })

  const [approvalState, approveCallback] = useApproveCallbackFromInputCurrencyAmount(parsedAmounts.input)

  const [approvalSubmitted, setApprovalSubmitted] = useState<boolean>(false)

  const maxAmountInput: CurrencyAmount | undefined = maxAmountSpend(currencyBalances.input)
  const hideMaxButton = Boolean(maxAmountInput && parsedAmounts.input?.equalTo(maxAmountInput))

  // UI handlers
  const handleTypeInput = useCallback(
    (value: string) => {
      handleInput(Field.INPUT, value)
    },
    [handleInput],
  )
  const handleTypeOutput = useCallback(
    (value: string) => {
      handleInput(Field.OUTPUT, value)
    },
    [handleInput],
  )
  const handleInputSelect = useCallback(
    (inputCurrency) => {
      handleCurrencySelection(Field.INPUT, inputCurrency)
    },
    [handleCurrencySelection],
  )
  const handleTypeDesiredRate = useCallback(
    (value: string) => {
      handleInput(Field.PRICE, value)
    },
    [handleInput],
  )
  const handleMaxInput = useCallback(() => {
    if (maxAmountInput) {
      handleInput(Field.INPUT, maxAmountInput.toExact())
    }
  }, [maxAmountInput, handleInput])
  const handleOutputSelect = useCallback(
    (outputCurrency) => {
      handleCurrencySelection(Field.OUTPUT, outputCurrency)
    },
    [handleCurrencySelection],
  )
  const handleApprove = useCallback(async () => {
    await approveCallback()
  }, [approveCallback])

  const handlePlaceOrder = useCallback(() => {
    console.log('Placing order')
    if (!handleLimitOrderSubmission) {
      return
    }
    const wrappedInput = wrappedCurrency(currencies.input, chainId)
    const wrappedOutput = wrappedCurrency(currencies.output, chainId)

    try {
      if (!wrappedInput.address) {
        throw new Error('Invalid input currency')
      }
      if (!wrappedOutput.address) {
        throw new Error('Invalid output currency')
      }
      if (!rawAmounts.input) {
        throw new Error('Invalid input amount')
      }
      if (!rawAmounts.output) {
        throw new Error('Invalid output amount')
      }

      if (!account) {
        throw new Error('No account')
      }
      // TODO: use native BNB
      const orderToSubmit = {
        inputToken: wrappedInput.address,
        outputToken: wrappedOutput.address,
        inputAmount: rawAmounts.input,
        outputAmount: rawAmounts.output,
        owner: account,
      }
      console.log(orderToSubmit)
      handleLimitOrderSubmission(orderToSubmit)
        .then(({ hash }) => {
          console.log('Order submitted!')
          setSwapState((prev) => ({
            attemptingTxn: false,
            tradeToConfirm: prev.tradeToConfirm,
            showConfirm: prev.showConfirm,
            swapErrorMessage: undefined,
            txHash: hash,
          }))
        })
        .catch((error) => {
          console.log('Submission failed!', error)
          setSwapState((prev) => ({
            attemptingTxn: false,
            tradeToConfirm: prev.tradeToConfirm,
            showConfirm: prev.showConfirm,
            swapErrorMessage: error.message,
            txHash: undefined,
          }))
        })
    } catch (error) {
      console.error(error)
    }
  }, [
    handleLimitOrderSubmission,
    account,
    chainId,
    rawAmounts.input,
    rawAmounts.output,
    currencies.input,
    currencies.output,
  ])

  // mark when a user has submitted an approval, reset onTokenSelection for input field
  // TODO: reset
  useEffect(() => {
    if (approvalState === ApprovalState.PENDING) {
      setApprovalSubmitted(true)
    }
  }, [approvalState, approvalSubmitted])

  const currentMarketRate = trade?.executionPrice
  const percentageAsFraction =
    currentMarketRate && price ? price.subtract(currentMarketRate).divide(currentMarketRate) : undefined
  const percentageRateDifference = percentageAsFraction
    ? new Percent(percentageAsFraction.numerator, percentageAsFraction.denominator)
    : undefined

  // TODO: refine
  const showApproveFlow =
    !inputError && (approvalState === ApprovalState.NOT_APPROVED || approvalState === ApprovalState.PENDING)

  return (
    <Page>
      <Flex width="100%" justifyContent="center" position="relative">
        <Flex flexDirection="column">
          <StyledSwapContainer $isChartExpanded={false}>
            <StyledInputCurrencyWrapper mt="24px">
              <AppBody>
                <CurrencyInputHeader
                  title={t('Limit')}
                  subtitle={t('Place a limit order to trade at a set price')}
                  setIsChartDisplayed={null}
                  isChartDisplayed={false}
                />
                <Wrapper id="limit-order-page" style={{ minHeight: '412px' }}>
                  <AutoColumn gap="sm">
                    <CurrencyInputPanel
                      label={independentField === Field.OUTPUT ? t('From (estimated)') : t('From')}
                      value={formattedAmounts.input}
                      showMaxButton={!hideMaxButton}
                      currency={currencies.input}
                      onUserInput={handleTypeInput}
                      onMax={handleMaxInput}
                      onCurrencySelect={handleInputSelect}
                      otherCurrency={currencies.output}
                      id="limit-order-currency-input"
                    />

                    <SwitchTokensButton
                      handleSwitchTokens={handleSwitchTokens}
                      color={currencies[Field.INPUT] && currencies[Field.OUTPUT] ? 'primary' : 'text'}
                    />
                    <CurrencyInputPanel
                      value={formattedAmounts.output}
                      onUserInput={handleTypeOutput}
                      label={independentField === Field.INPUT ? t('To (estimated)') : t('To')}
                      showMaxButton={false}
                      currency={currencies.output}
                      onCurrencySelect={handleOutputSelect}
                      otherCurrency={currencies.output}
                      id="limit-order-currency-output"
                    />
                    <LimitOrderPrice
                      id="limit-order-desired-rate-input"
                      value={formattedAmounts.price}
                      onUserInput={handleTypeDesiredRate}
                      inputCurrency={currencies.input}
                      outputCurrency={currencies.output}
                      percentageRateDifference={percentageRateDifference}
                      rateType={rateType}
                      handleRateType={handleRateType}
                      marketPrice={currentMarketRate}
                      price={price}
                    />
                  </AutoColumn>
                  <Box mt="0.25rem">
                    {!account ? (
                      <ConnectWalletButton width="100%" />
                    ) : showApproveFlow ? (
                      <Button
                        variant="primary"
                        onClick={handleApprove}
                        id="enable-order-button"
                        width="100%"
                        disabled={approvalSubmitted}
                      >
                        {approvalSubmitted ? t('Enabling') : t('Enable')}
                      </Button>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={handlePlaceOrder}
                        id="place-order-button"
                        width="100%"
                        disabled={!!inputError}
                      >
                        {inputError || t('Place an Order')}
                      </Button>
                    )}
                  </Box>
                </Wrapper>
              </AppBody>
            </StyledInputCurrencyWrapper>
          </StyledSwapContainer>
        </Flex>
      </Flex>
      <OrderHistoryTable />
      <LimitOrderTable />
    </Page>
  )
}

export default LimitOrders
