import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en">
      <Head>
      <link href="https://fonts.googleapis.com/css2?family=Comic+Neue&display=swap" rel="stylesheet" />
      </Head>
      <body
      style={{
        backgroundImage: 'url("/background_img.png")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        minHeight: '100vh',
      }}
      >
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
