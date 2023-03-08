import React from "react";
import { LanguageProvider } from "@pancakeswap/localization";
import { CurrencyAmount, JSBI, Price } from "@pancakeswap/sdk";
import { ethereumTokens } from "@pancakeswap/tokens";
import { FeeAmount } from "@pancakeswap/v3-sdk";

import { RoiCalculator } from "./RoiCalculator";
import mockData from "../../components/LiquidityChartRangeInput/mockData.json";

export default {
  title: "Widget/RoiCalculator",
  component: RoiCalculator,
  argTypes: {},
};

export const Default: React.FC<React.PropsWithChildren> = () => {
  return (
    <div style={{ padding: "32px", width: "500px" }}>
      <LanguageProvider>
        <RoiCalculator
          price={
            new Price({
              baseAmount: CurrencyAmount.fromRawAmount(ethereumTokens.usdc, "1564567634"),
              quoteAmount: CurrencyAmount.fromRawAmount(ethereumTokens.weth, "1000000000000000000"),
            })
          }
          currencyA={ethereumTokens.weth}
          currencyB={ethereumTokens.usdc}
          currencyAUsdPrice={1564.567634}
          currencyBUsdPrice={0.999999}
          sqrtRatioX96={JSBI.BigInt("2002509526268673110418559843593160")}
          liquidity={JSBI.BigInt("26477362146968540419")}
          feeAmount={FeeAmount.LOW}
          ticks={mockData}
          volume24H={291_000_000}
          priceUpper={
            new Price({
              baseAmount: CurrencyAmount.fromRawAmount(ethereumTokens.usdc, "1464567634"),
              quoteAmount: CurrencyAmount.fromRawAmount(ethereumTokens.weth, "1000000000000000000"),
            })
          }
          priceLower={
            new Price({
              baseAmount: CurrencyAmount.fromRawAmount(ethereumTokens.usdc, "1764567634"),
              quoteAmount: CurrencyAmount.fromRawAmount(ethereumTokens.weth, "1000000000000000000"),
            })
          }
        />
      </LanguageProvider>
    </div>
  );
};
