import { Currency, CurrencyAmount, JSBI, Price, Token, ZERO } from "@pancakeswap/sdk";
import { FeeAmount, FeeCalculator, Tick, TickMath } from "@pancakeswap/v3-sdk";
import { useTranslation } from "@pancakeswap/localization";
import { useMemo, useState } from "react";
import BigNumber from "bignumber.js";
import { BIG_ZERO } from "@pancakeswap/utils/bigNumber";

import { ScrollableContainer } from "../../components/RoiCalculatorModal/RoiCalculatorModal";
import { LiquidityChartRangeInput, Button, DynamicSection } from "../../components";
import { Section } from "./Section";
import { DepositAmountInput } from "./DepositAmount";
import { RangeSelector } from "./RangeSelector";
import { StakeSpan } from "./StakeSpan";
import { usePriceRange, useRangeHopCallbacks, useRoi, useAmountsByUsdValue } from "./hooks";
import { CompoundFrequency } from "./CompoundFrequency";
import { AnimatedArrow } from "./AnimationArrow";
import { RoiRate } from "./RoiRate";
import { Details } from "./Details";
import { ImpermanentLossCalculator } from "./ImpermanentLossCalculator";
import { compoundingIndexToFrequency, spanIndexToSpan } from "./constants";
import { TickData } from "./types";
import { useActiveTicks } from "./hooks/useActiveTicks";

export type RoiCalculatorProps = {
  sqrtRatioX96?: JSBI;
  liquidity?: JSBI;
  independentAmount?: CurrencyAmount<Currency>;
  currencyA?: Currency;
  currencyB?: Currency;
  balanceA?: CurrencyAmount<Currency>;
  balanceB?: CurrencyAmount<Currency>;
  feeAmount?: FeeAmount;
  ticks?: TickData[];
  price?: Price<Token, Token>;
  priceLower?: Price<Token, Token>;
  priceUpper?: Price<Token, Token>;
  currencyAUsdPrice?: number;
  currencyBUsdPrice?: number;
  depositAmountInUsd?: number | string;

  // Average 24h historical trading volume in USD
  volume24H?: number;
  max?: string;
  maxLabel?: string;
} & (RoiCalculatorFarmProps | RoiCalculatorLPProps);

type RoiCalculatorLPProps = {
  isFarm?: false;
};

type RoiCalculatorFarmProps = {
  isFarm: true;
  cakePrice?: string;
  cakeAprFactor?: BigNumber;
};

// Price is always price of token0
export function RoiCalculator({
  sqrtRatioX96,
  liquidity,
  depositAmountInUsd = "0",
  currencyA,
  currencyB,
  balanceA,
  balanceB,
  currencyAUsdPrice,
  currencyBUsdPrice,
  feeAmount,
  ticks: ticksRaw,
  price,
  priceLower,
  priceUpper,
  volume24H,
  maxLabel,
  max,
  ...props
}: RoiCalculatorProps) {
  const { t } = useTranslation();
  const [usdValue, setUsdValue] = useState(String(depositAmountInUsd));
  const [spanIndex, setSpanIndex] = useState(3);
  const [compoundOn, setCompoundOn] = useState(true);
  const [compoundIndex, setCompoundIndex] = useState(0);
  const tickCurrent = useMemo(() => sqrtRatioX96 && TickMath.getTickAtSqrtRatio(sqrtRatioX96), [sqrtRatioX96]);
  const activeTicks = useActiveTicks({ currencyA, currencyB, ticks: ticksRaw, liquidity, tickCurrent });
  const ticks = useMemo(
    () =>
      ticksRaw?.map(
        ({ tick, liquidityNet }) => new Tick({ index: parseInt(tick), liquidityNet, liquidityGross: liquidityNet })
      ),
    [ticksRaw]
  );
  const mostActiveLiquidity = useMemo(
    () => ticks && sqrtRatioX96 && FeeCalculator.getLiquidityFromSqrtRatioX96(ticks, sqrtRatioX96),
    [ticks, sqrtRatioX96]
  );

  const priceRange = usePriceRange({
    feeAmount,
    baseCurrency: currencyA,
    quoteCurrency: currencyB,
    priceLower,
    priceUpper,
  });
  const { getDecrementLower, getIncrementLower, getDecrementUpper, getIncrementUpper } = useRangeHopCallbacks(
    currencyA,
    currencyB,
    feeAmount,
    priceRange?.tickLower,
    priceRange?.tickUpper,
    tickCurrent
  );
  const { amountA, amountB } = useAmountsByUsdValue({
    usdValue,
    currencyA,
    currencyB,
    price,
    priceLower: priceRange?.priceLower,
    priceUpper: priceRange?.priceUpper,
    sqrtRatioX96,
    currencyAUsdPrice,
    currencyBUsdPrice,
  });
  const maxUsdValue = useMemo<string | undefined>(() => {
    if (max) return max;
    if (!balanceA || !balanceB || typeof currencyAUsdPrice !== "number" || typeof currencyBUsdPrice !== "number") {
      return undefined;
    }
    const maxA = parseFloat(balanceA.toExact()) * currencyAUsdPrice;
    const maxB = parseFloat(balanceA.toExact()) * currencyBUsdPrice;
    return String(Math.max(maxA, maxB));
  }, [balanceA, balanceB, currencyAUsdPrice, currencyBUsdPrice, max]);

  const derivedCakeApr = useMemo(() => {
    if (
      !currencyB ||
      !priceRange?.tickUpper ||
      !priceRange?.tickLower ||
      !sqrtRatioX96 ||
      !props.isFarm ||
      !props.cakeAprFactor ||
      !amountA
    )
      return undefined;

    const positionLiquidity = FeeCalculator.getLiquidityBySingleAmount({
      amount: amountA,
      currency: currencyB,
      tickUpper: priceRange?.tickUpper,
      tickLower: priceRange?.tickLower,
      sqrtRatioX96,
    });

    const cakeApr = JSBI.greaterThan(positionLiquidity, ZERO)
      ? new BigNumber(positionLiquidity.toString()).times(props.cakeAprFactor).div(usdValue)
      : BIG_ZERO;

    return cakeApr;
  }, [
    currencyB,
    priceRange,
    amountA,
    sqrtRatioX96,
    props.isFarm,
    // @ts-ignore
    props.cakeAprFactor,
    usdValue,
  ]);

  const { fee, rate, apr, apy, cakeApy } = useRoi({
    amountA,
    amountB,
    currencyAUsdPrice,
    currencyBUsdPrice,
    tickLower: priceRange?.tickLower,
    tickUpper: priceRange?.tickUpper,
    volume24H,
    sqrtRatioX96,
    mostActiveLiquidity,
    fee: feeAmount,
    compoundEvery: compoundingIndexToFrequency[compoundIndex],
    stakeFor: spanIndexToSpan[spanIndex],
    compoundOn,
    cakeApr: props.isFarm && derivedCakeApr ? derivedCakeApr.toNumber() : undefined,
  });

  const lpReward = parseFloat(fee.toSignificant(6));
  const farmReward = props.isFarm && cakeApy ? (cakeApy * +usdValue) / 100 : 0;
  const totalRoi = lpReward + farmReward;

  return (
    <>
      <ScrollableContainer>
        <Section title={t("Deposit amount")}>
          <DepositAmountInput
            value={usdValue}
            maxLabel={maxLabel}
            onChange={setUsdValue}
            currencyA={currencyA}
            currencyB={currencyB}
            amountA={amountA}
            amountB={amountB}
            max={maxUsdValue}
          />
        </Section>
        <Section title={t("Set price range")}>
          <LiquidityChartRangeInput
            price={price}
            currencyA={currencyA}
            currencyB={currencyB}
            tickCurrent={tickCurrent}
            liquidity={liquidity}
            feeAmount={feeAmount}
            ticks={activeTicks}
            ticksAtLimit={priceRange?.ticksAtLimit}
            priceLower={priceRange?.priceLower}
            priceUpper={priceRange?.priceUpper}
            onLeftRangeInput={priceRange?.onLeftRangeInput}
            onRightRangeInput={priceRange?.onRightRangeInput}
          />
          <DynamicSection>
            <RangeSelector
              priceLower={priceRange?.priceLower}
              priceUpper={priceRange?.priceUpper}
              getDecrementLower={getDecrementLower}
              getIncrementLower={getIncrementLower}
              getDecrementUpper={getDecrementUpper}
              getIncrementUpper={getIncrementUpper}
              onLeftRangeInput={priceRange?.onLeftRangeInput}
              onRightRangeInput={priceRange?.onRightRangeInput}
              currencyA={currencyA}
              currencyB={currencyB}
              feeAmount={feeAmount}
              ticksAtLimit={priceRange?.ticksAtLimit || {}}
            />
            <Button
              onClick={priceRange?.toggleFullRange}
              variant={priceRange?.fullRange ? "primary" : "secondary"}
              mb="16px"
              scale="sm"
            >
              {t("Full Range")}
            </Button>
          </DynamicSection>
        </Section>
        <Section title={t("Staked for")}>
          <StakeSpan spanIndex={spanIndex} onSpanChange={setSpanIndex} />
        </Section>
        <Section title={t("Compounding every")}>
          <CompoundFrequency
            compoundIndex={compoundIndex}
            onCompoundChange={setCompoundIndex}
            on={compoundOn}
            onToggleCompound={setCompoundOn}
          />
        </Section>
        <ImpermanentLossCalculator
          lpReward={lpReward}
          amountA={amountA}
          amountB={amountB}
          currencyAUsdPrice={currencyAUsdPrice}
          currencyBUsdPrice={currencyBUsdPrice}
          tickLower={priceRange?.tickLower}
          tickUpper={priceRange?.tickUpper}
          sqrtRatioX96={sqrtRatioX96}
          isFarm={props.isFarm}
          usdValue={usdValue}
          cakeApy={cakeApy}
          cakePrice={props.isFarm ? props.cakePrice : undefined}
        />
        <AnimatedArrow state={{}} />
        <RoiRate usdAmount={totalRoi} rate={rate} />
      </ScrollableContainer>
      <Details
        totalYield={totalRoi}
        lpReward={fee.toSignificant(6)}
        lpApr={apr}
        lpApy={apy}
        compoundIndex={compoundIndex}
        compoundOn={compoundOn}
        farmApr={props.isFarm ? derivedCakeApr?.toFixed(2) : undefined}
        farmReward={farmReward}
        isFarm={props.isFarm}
      />
    </>
  );
}
