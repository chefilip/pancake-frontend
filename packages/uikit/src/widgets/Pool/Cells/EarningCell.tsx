import styled from "styled-components";
import BigNumber from "bignumber.js";
import { BIG_ZERO } from "@pancakeswap/utils/bigNumber";
import { getBalanceNumber } from "@pancakeswap/utils/formatBalance";
import { useTranslation } from "@pancakeswap/localization";

import { Skeleton, Text, Flex, Box, Balance } from "../../../components";
import useMatchBreakpoints from "../../../contexts/MatchBreakpoints/useMatchBreakpoints";
import { DeserializedPool } from "../types";
import { CellContent, BaseCell } from "./BaseCell";

interface EarningsCellProps<T> {
  pool: DeserializedPool<T>;
  account: string;
  onPresentCollect: () => void;
}

const StyledCell = styled(BaseCell)`
  flex: 4.5;
  ${({ theme }) => theme.mediaQueries.sm} {
    flex: 1 0 120px;
  }
`;

export function EarningsCell<T>({ pool, account, onPresentCollect }: EarningsCellProps<T>) {
  const { t } = useTranslation();
  const { isMobile } = useMatchBreakpoints();
  const { earningToken, userData, earningTokenPrice } = pool;

  const earnings = userData?.pendingReward ? new BigNumber(userData.pendingReward) : BIG_ZERO;
  const earningTokenBalance = getBalanceNumber(earnings, earningToken.decimals);

  const earningPrice = earningTokenPrice ? earnings.multipliedBy(earningTokenPrice) : BIG_ZERO;

  const earningTokenDollarBalance = getBalanceNumber(earningPrice, earningToken.decimals);
  const hasEarnings = account && earnings.gt(0);

  const labelText = t("%asset% Earned", { asset: earningToken.symbol });

  const handleEarningsClick = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    onPresentCollect();
  };

  return (
    <StyledCell role="cell">
      <CellContent>
        <Text fontSize="12px" color="textSubtle" textAlign="left">
          {labelText}
        </Text>
        {!account ? (
          <Skeleton width="80px" height="16px" />
        ) : (
          <>
            <Flex>
              <Box mr="8px" height="32px" onClick={hasEarnings ? handleEarningsClick : undefined}>
                <Balance
                  mt="4px"
                  bold={!isMobile}
                  fontSize={isMobile ? "14px" : "16px"}
                  color={hasEarnings ? "primary" : "textDisabled"}
                  decimals={hasEarnings ? 5 : 1}
                  value={hasEarnings ? earningTokenBalance : 0}
                />
                {hasEarnings ? (
                  <>
                    {earningTokenPrice && earningTokenPrice > 0 && (
                      <Balance
                        display="inline"
                        fontSize="12px"
                        color="textSubtle"
                        decimals={2}
                        prefix="~"
                        value={earningTokenDollarBalance}
                        unit=" USD"
                      />
                    )}
                  </>
                ) : (
                  <Text mt="4px" fontSize="12px" color="textDisabled">
                    0 USD
                  </Text>
                )}
              </Box>
            </Flex>
          </>
        )}
      </CellContent>
    </StyledCell>
  );
}
