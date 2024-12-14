import type { AppProps } from 'next/app';
import { Layout } from '../components/Layout';
import { ReactElement } from 'react';

function App({ Component, pageProps }: AppProps): ReactElement {
  return (
    <Layout>
      <Component {...pageProps} />
    </Layout>
  );
}

export default App;
