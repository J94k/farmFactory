import { wagmiConfig } from './utils/wagmiConfig'
import { WagmiConfig } from 'wagmi'
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from '@rainbow-me/rainbowkit'

import { chains } from './utils/chains'
import '@rainbow-me/rainbowkit/styles.css';
import Widget from './Widget'

function App({ widgetOptions }: { widgetOptions: Record<string, string | undefined> }) {
  return (
    <>
      <WagmiConfig config={wagmiConfig}>
        <RainbowKitProvider chains={chains} theme={(widgetOptions.theme === 'dark') ? darkTheme() : lightTheme()}>
          <Widget widgetOptions={widgetOptions} />
        </RainbowKitProvider>
      </WagmiConfig>
    </>
  );
}

export default App;
