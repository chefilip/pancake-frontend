import { BigNumber } from '@ethersproject/bignumber'
// import { TransactionResponse } from '@ethersproject/providers'
import { Currency, CurrencyAmount, Percent, Price, Token } from '@pancakeswap/sdk'
import { Button, useModal } from '@pancakeswap/uikit'
import { NonfungiblePositionManager, Position } from '@pancakeswap/v3-sdk'
import { SendTransactionResult } from '@wagmi/core'
import { useToken } from 'hooks/Tokens'
import useActiveWeb3React from 'hooks/useActiveWeb3React'
// import useBUSDPrice from 'hooks/useBUSDPrice'
import { useV3NFTPositionManagerContract } from 'hooks/useContract'
// import useIsTickAtLimit from 'hooks/v3/useIsTickAtLimit'
import { usePool } from 'hooks/v3/usePools'
// import { usePositionTokenURI } from 'hooks/v3/usePositionTokenURI'
import { useV3PositionFees } from 'hooks/v3/useV3PositionFees'
import { useV3PositionFromTokenId } from 'hooks/v3/useV3Positions'
import getPriceOrderingFromPositionForUI from 'hooks/v3/utils/getPriceOrderingFromPositionForUI'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useMemo, useState } from 'react'
// import { useSingleCallResult } from 'state/multicall/hooks'
import { useTransactionAdder } from 'state/transactions/hooks'
import { calculateGasMargin } from 'utils'
import currencyId from 'utils/currencyId'
import { CHAIN_IDS } from 'utils/wagmi'
import { unwrappedToken } from 'utils/wrappedCurrency'
import ClaimFeeModal from 'views/AddLiquidityV3/components/ClaimFeeModal'
import { usePrepareSendTransaction, useSendTransaction, useTransaction } from 'wagmi'

const useInverter = ({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
  invert?: boolean
}): {
  priceLower?: Price<Token, Token>
  priceUpper?: Price<Token, Token>
  quote?: Token
  base?: Token
} => {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

function getRatio(
  lower: Price<Currency, Currency>,
  current: Price<Currency, Currency>,
  upper: Price<Currency, Currency>,
) {
  try {
    if (!current.greaterThan(lower)) {
      return 100
    }

    if (!current.lessThan(upper)) {
      return 0
    }

    const a = Number.parseFloat(lower.toSignificant(15))
    const b = Number.parseFloat(upper.toSignificant(15))
    const c = Number.parseFloat(current.toSignificant(15))

    const ratio = Math.floor((1 / ((Math.sqrt(a * b) - Math.sqrt(b * c)) / (c - Math.sqrt(b * c)) + 1)) * 100)

    if (ratio < 0 || ratio > 100) {
      throw Error('Out of range')
    }

    return ratio
  } catch {
    return undefined
  }
}

export default function PoolPage() {
  const { account, chainId, provider } = useActiveWeb3React()

  const router = useRouter()
  const { poolId: tokenIdFromUrl } = router.query

  const parsedTokenId = tokenIdFromUrl ? BigNumber.from(tokenIdFromUrl) : undefined

  const { position: positionDetails } = useV3PositionFromTokenId(parsedTokenId)

  const {
    token0: token0Address,
    token1: token1Address,
    fee: feeAmount,
    liquidity,
    tickLower,
    tickUpper,
    tokenId,
  } = positionDetails || {}

  // const removed = liquidity?.eq(0)

  // const metadata = usePositionTokenURI(parsedTokenId)

  const token0 = useToken(token0Address)
  const token1 = useToken(token1Address)

  const currency0 = token0 ? unwrappedToken(token0) : undefined
  const currency1 = token1 ? unwrappedToken(token1) : undefined

  // construct Position from details returned
  const [, pool] = usePool(token0 ?? undefined, token1 ?? undefined, feeAmount)
  const position = useMemo(() => {
    if (pool && liquidity && typeof tickLower === 'number' && typeof tickUpper === 'number') {
      return new Position({ pool, liquidity: liquidity.toString(), tickLower, tickUpper })
    }
    return undefined
  }, [liquidity, pool, tickLower, tickUpper])

  // const tickAtLimit = useIsTickAtLimit(feeAmount, tickLower, tickUpper)

  const pricesFromPosition = getPriceOrderingFromPositionForUI(position)

  const [manuallyInverted] = useState(false)

  // handle manual inversion
  const { base } = useInverter({
    priceLower: pricesFromPosition.priceLower,
    priceUpper: pricesFromPosition.priceUpper,
    quote: pricesFromPosition.quote,
    base: pricesFromPosition.base,
    invert: manuallyInverted,
  })

  const inverted = token1 ? base?.equals(token1) : undefined
  const currencyQuote = inverted ? currency0 : currency1
  const currencyBase = inverted ? currency1 : currency0

  // const ratio = useMemo(() => {
  //   return priceLower && pool && priceUpper
  //     ? getRatio(
  //         inverted ? priceUpper.invert() : priceLower,
  //         pool.token0Price,
  //         inverted ? priceLower.invert() : priceUpper,
  //       )
  //     : undefined
  // }, [inverted, pool, priceLower, priceUpper])

  // TODO: add wrapped and unwrapped token support
  // fees
  const [feeValue0, feeValue1] = useV3PositionFees(pool ?? undefined, positionDetails?.tokenId, false)

  // these currencies will match the feeValue{0,1} currencies for the purposes of fee collection
  const currency0ForFeeCollectionPurposes = pool ? unwrappedToken(pool.token0) : undefined
  const currency1ForFeeCollectionPurposes = pool ? unwrappedToken(pool.token1) : undefined

  // const [collectMigrationHash, setCollectMigrationHash] = useState<string | null>(null)
  // const isCollectPending = useIsTransactionPending(collectMigrationHash ?? undefined)
  // const [showConfirm, setShowConfirm] = useState(false)

  // usdc prices always in terms of tokens
  // const price0 = useBUSDPrice(token0 ?? undefined)
  // const price1 = useBUSDPrice(token1 ?? undefined)

  // const fiatValueOfFees: CurrencyAmount<Currency> | null = useMemo(() => {
  //   if (!price0 || !price1 || !feeValue0 || !feeValue1) return null

  //   // we wrap because it doesn't matter, the quote returns a USDC amount
  //   const feeValue0Wrapped = feeValue0?.wrapped
  //   const feeValue1Wrapped = feeValue1?.wrapped

  //   if (!feeValue0Wrapped || !feeValue1Wrapped) return null

  //   const amount0 = price0.quote(feeValue0Wrapped)
  //   const amount1 = price1.quote(feeValue1Wrapped)
  //   return amount0.add(amount1)
  // }, [price0, price1, feeValue0, feeValue1])

  // const fiatValueOfLiquidity: CurrencyAmount<Token> | null = useMemo(() => {
  //   if (!price0 || !price1 || !position) return null
  //   const amount0 = price0.quote(position.amount0)
  //   const amount1 = price1.quote(position.amount1)
  //   return amount0.add(amount1)
  // }, [price0, price1, position])

  const addTransaction = useTransactionAdder()

  const positionManager = useV3NFTPositionManagerContract()

  const txn = useMemo(() => {
    if (
      !currency0ForFeeCollectionPurposes ||
      !currency1ForFeeCollectionPurposes ||
      !chainId ||
      !positionManager ||
      !account ||
      !tokenId ||
      !provider
    )
      return undefined

    // we fall back to expecting 0 fees in case the fetch fails, which is safe in the
    // vast majority of cases
    const { calldata, value } = NonfungiblePositionManager.collectCallParameters({
      tokenId: tokenId.toString(),
      expectedCurrencyOwed0: feeValue0 ?? CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0),
      expectedCurrencyOwed1: feeValue1 ?? CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0),
      recipient: account,
    })

    return {
      to: positionManager.address,
      data: calldata,
      value,
    }
  }, [
    account,
    chainId,
    currency0ForFeeCollectionPurposes,
    currency1ForFeeCollectionPurposes,
    feeValue0,
    feeValue1,
    positionManager,
    provider,
    tokenId,
  ])

  const { config } = usePrepareSendTransaction({
    request: txn,
  })

  const {
    data: txnResult,
    sendTransaction,
    isLoading: collecting,
    isSuccess,
  } = useSendTransaction({
    ...config,
    request: {
      ...config?.request,
      ...(config?.request?.gasLimit && { gasLimit: calculateGasMargin(BigNumber.from(config?.request?.gasLimit)) }),
    },
  })

  const { data: txnResponse } = useTransaction({
    hash: txnResult?.hash,
  })

  useEffect(() => {
    // setCollectMigrationHash(response.hash)

    if (isSuccess) {
      addTransaction(txnResponse, {
        type: 'collect-fee',
        currencyId0: currencyId(currency0ForFeeCollectionPurposes),
        currencyId1: currencyId(currency1ForFeeCollectionPurposes),
        expectedCurrencyOwed0: CurrencyAmount.fromRawAmount(currency0ForFeeCollectionPurposes, 0).toExact(),
        expectedCurrencyOwed1: CurrencyAmount.fromRawAmount(currency1ForFeeCollectionPurposes, 0).toExact(),
      })
    }
  }, [isSuccess, addTransaction, currency0ForFeeCollectionPurposes, currency1ForFeeCollectionPurposes, txnResponse])

  const collect = useCallback(() => {
    if (!txn) return

    sendTransaction()
  }, [sendTransaction, txn])

  // const owner = useSingleCallResult(tokenId ? positionManager : null, 'ownerOf', [tokenId?.toString()]).result?.[0]
  // const ownsNFT = owner === account || positionDetails?.operator === account

  const feeValueUpper = inverted ? feeValue0 : feeValue1
  const feeValueLower = inverted ? feeValue1 : feeValue0

  // check if price is within range
  const below = pool && typeof tickLower === 'number' ? pool.tickCurrent < tickLower : undefined
  const above = pool && typeof tickUpper === 'number' ? pool.tickCurrent >= tickUpper : undefined
  const inRange: boolean = typeof below === 'boolean' && typeof above === 'boolean' ? !below && !above : false

  const [onClaimFee] = useModal(
    <ClaimFeeModal collect={collect} feeValueLower={feeValueLower} feeValueUpper={feeValueUpper} />,
  )

  return (
    <>
      <div>
        {currencyQuote?.symbol} / {currencyBase?.symbol}{' '}
        {feeAmount && new Percent(feeAmount, 1_000_000).toSignificant()}% {inRange ? 'in range' : 'out of range'}
      </div>
      <div>ID: {tokenIdFromUrl}</div>
      <div>Min Tick: {tickLower}</div>
      <div>Max Tick: {tickUpper}</div>
      <Button disabled={collecting} onClick={onClaimFee}>
        Claim fee
      </Button>
    </>
  )
}

PoolPage.chains = CHAIN_IDS
