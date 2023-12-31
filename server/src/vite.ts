import { serveStatic } from 'hono/bun'
import { type Hono } from 'hono'
import { html } from 'hono/html'

import logger from './logger'

interface LayoutProps {
  environment: string
  hostname: string
  manifest: any
}

const Layout = async ({ environment, hostname, manifest }: LayoutProps) => {
  return html`<html lang="en">
    <head>
      <meta charset="UTF-8" />
      <link rel="icon" type="image/svg+xml" href="/vite.svg" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Oshaberi</title>

      ${environment === 'production'
        ? html`<link rel="stylesheet" href=${manifest['src/main.ts'].css[0]} />`
        : ''}
    </head>

    <body>
      <div id="app"></div>

      ${environment === 'production'
        ? html`<script type="module" src=${manifest['src/main.ts'].file}></script>`
        : `
            <script type="module" src=${`http://${hostname}:5173/@vite/client`}></script>
            <script type="module" src=${`http://${hostname}:5173/src/main.ts`}></script>
          `}
    </body>
  </html>`
}

export async function attachHome(app: Hono) {
  const environment = process.env.NODE_ENV ?? 'development'
  const hostname = process.env.HOSTNAME ?? 'localhost'
  let manifest: any

  try {
    manifest = JSON.parse(await Bun.file('./dist/.vite/manifest.json').text())
  } catch (e) {
    logger.error('Failed to load manifest', { error: e })
    manifest = {}
  }

  app.get('/', async (c) => {
    c.status(200)

    const rendered = await Layout({ environment, hostname, manifest })
    return c.html(rendered)
  })

  if (environment === 'development') {
    const supportedAssets = ['svg', 'png', 'jpg', 'png', 'jpeg', 'mp4', 'ogv']

    const assetExtensionRegex = () => {
      const formattedExtensionList = supportedAssets.join('|')

      return `/:file{.+\\.(${formattedExtensionList})$}`
    }

    app.get(assetExtensionRegex(), async (c) => {
      return c.redirect(`http://${hostname}:5173/${c.req.path}`, 303)
    })
  } else {
    app.get(
      '/*',
      serveStatic({
        root: './dist'
      })
    )
  }
}
