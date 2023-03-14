import { BigNumber as EthersBigNumber } from '@ethersproject/bignumber'
import { IPendingCakeByTokenId, PositionDetails } from '@pancakeswap/farms'
import { useTranslation } from '@pancakeswap/localization'
import { Token } from '@pancakeswap/swap-sdk-core'
import NextLink from 'next/link'
import { AtomBox, AtomBoxProps } from '@pancakeswap/ui'
import {
  AutoColumn,
  Button,
  Farm as FarmUI,
  Flex,
  Modal,
  ModalV2,
  RowBetween,
  Text,
  useModalV2,
  useTooltip,
} from '@pancakeswap/uikit'
import { formatBigNumber } from '@pancakeswap/utils/formatBalance'
import { BigNumber } from 'bignumber.js'
import { LightCard } from 'components/Card'
import { CHAIN_QUERY_NAME } from 'config/chains'
import { useActiveChainId } from 'hooks/useActiveChainId'
import JSBI from 'jsbi'
import Image from 'next/image'
import { useEffect, useMemo } from 'react'
import { usePriceCakeUSD } from 'state/farms/hooks'
import styled from 'styled-components'
import { V3Farm } from 'views/Farms/FarmsV3'
import useFarmV3Actions from 'views/Farms/hooks/v3/useFarmV3Actions'
import { useAccount, useSigner } from 'wagmi'
import FarmV3StakeAndUnStake, { FarmV3LPPosition, FarmV3LPTitle } from './FarmV3StakeAndUnStake'

const { FarmV3HarvestAction } = FarmUI.FarmV3Table

const ActionContainer = styled(Flex)`
  width: 100%;
  padding: 0 16px;
  border: 2px solid ${({ theme }) => theme.colors.input};
  border-radius: 16px;
  flex-grow: 1;
  flex-basis: 0;
  margin-bottom: 8px;
  flex-wrap: wrap;
  padding: 16px;
  gap: 24px;
`

ActionContainer.defaultProps = {
  bg: 'dropdown',
}

type PositionType = 'staked' | 'unstaked'

interface SingleFarmV3CardProps {
  farm: V3Farm
  lpSymbol: string
  position: PositionDetails
  positionType: PositionType
  token: Token
  quoteToken: Token
  pendingCakeByTokenIds: IPendingCakeByTokenId
  onDismiss?: () => void
  direction?: 'row' | 'column'
}

const SingleFarmV3Card: React.FunctionComponent<
  React.PropsWithChildren<SingleFarmV3CardProps & Omit<AtomBoxProps, 'position'>>
> = ({
  farm,
  lpSymbol,
  position,
  token,
  quoteToken,
  positionType,
  pendingCakeByTokenIds,
  onDismiss,
  direction = 'column',
  ...atomBoxProps
}) => {
  const { chainId } = useActiveChainId()
  const { address: account } = useAccount()
  const { data: signer } = useSigner()
  const { t } = useTranslation()
  const cakePrice = usePriceCakeUSD()
  const { tokenId } = position

  const title = `${lpSymbol} (#${tokenId.toString()})`
  const liquidityUrl = `/liquidity/${tokenId.toString()}?chain=${CHAIN_QUERY_NAME[chainId]}`

  const { onStake, onUnstake, onHarvest, attemptingTxn } = useFarmV3Actions({
    tokenId: JSBI.BigInt(tokenId),
    account,
    signer,
  })

  const unstakedModal = useModalV2()

  const handleStake = async () => {
    await onStake()
    if (!attemptingTxn) {
      onDismiss?.()
    }
  }

  const handleUnStake = async () => {
    await onUnstake()
    if (!attemptingTxn) {
      unstakedModal.onDismiss()
    }
  }

  const handleHarvest = async () => {
    await onHarvest()
    if (!attemptingTxn) {
      onDismiss?.()
    }
  }

  const totalEarnings = useMemo(
    () => +formatBigNumber(pendingCakeByTokenIds[position.tokenId.toString()] || EthersBigNumber.from('0'), 4),
    [pendingCakeByTokenIds, position.tokenId],
  )

  const earningsBusd = useMemo(() => {
    return new BigNumber(totalEarnings).times(cakePrice.toString()).toNumber()
  }, [cakePrice, totalEarnings])

  const unstakingTooltip = useTooltip(
    <Text maxWidth="160px">{t('You may add or remove liquidity on the position detail page without unstake')}</Text>,
    {
      placement: 'left-end',
      manualVisible: true,
      strategy: 'absolute',
    },
  )

  useEffect(() => {
    if (unstakedModal.isOpen) {
      unstakingTooltip.forceUpdate?.()
    }
  }, [unstakedModal.isOpen, unstakingTooltip])

  return (
    <AtomBox {...atomBoxProps}>
      <ActionContainer bg="background" flexDirection={direction}>
        <RowBetween
          flexDirection="column"
          alignItems="flex-start"
          flex={{
            xs: 'auto',
            md: 1,
          }}
        >
          <FarmV3StakeAndUnStake
            title={title}
            farm={farm}
            position={position}
            token={token}
            quoteToken={quoteToken}
            positionType={positionType}
            liquidityUrl={liquidityUrl}
            isPending={attemptingTxn}
            handleStake={handleStake}
            handleUnStake={unstakedModal.onOpen}
          />
          <ModalV2 {...unstakedModal} closeOnOverlayClick>
            <Modal title={t('Unstaking')}>
              <AutoColumn
                maxWidth={{
                  xs: 'full',
                  md: 'screenSm',
                }}
                gap="16px"
              >
                <AtomBox position="relative">
                  <Image
                    ref={unstakingTooltip.targetRef}
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: '-23px',
                    }}
                    src="/images/decorations/bulb-bunny.png"
                    width={135}
                    height={120}
                    alt="bulb bunny reminds unstaking"
                  />
                  <div style={{ width: 135, height: 120 }} />
                  {unstakingTooltip.tooltip}
                </AtomBox>
                <LightCard>
                  <AutoColumn gap="8px">
                    <FarmV3LPTitle title={title} liquidityUrl={liquidityUrl} />
                    <FarmV3LPPosition farm={farm} token={token} quoteToken={quoteToken} position={position} />
                    <NextLink href={liquidityUrl} onClick={unstakedModal.onDismiss}>
                      <Button variant="tertiary" width="100%" as="a">
                        {t('Manage Position')}
                      </Button>
                    </NextLink>
                  </AutoColumn>
                </LightCard>
                <Button onClick={handleUnStake} disabled={attemptingTxn} width="100%">
                  {t('Unstake')}
                </Button>
                <Text color="textSubtle">
                  {t(
                    'Unstake will also automatically harvest any earnings that you haven’t collected yet, and send them to your wallet.',
                  )}
                </Text>
              </AutoColumn>
            </Modal>
          </ModalV2>
        </RowBetween>
        {positionType !== 'unstaked' && (
          <>
            <AtomBox
              border="1"
              width={{
                xs: 'full',
                md: 'auto',
              }}
            />
            <RowBetween flexDirection="column" alignItems="flex-start" flex={1} width="full">
              <FarmV3HarvestAction
                earnings={totalEarnings}
                earningsBusd={earningsBusd}
                pendingTx={attemptingTxn}
                userDataReady
                handleHarvest={handleHarvest}
              />
            </RowBetween>
          </>
        )}
      </ActionContainer>
    </AtomBox>
  )
}

export default SingleFarmV3Card
