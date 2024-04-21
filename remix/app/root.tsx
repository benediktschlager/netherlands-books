import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import styles from "./tailwind.css";
import { Theme } from '@radix-ui/themes';

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: styles },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export default function App() {
  return (
    <html lang="en">
      <head>
        <title>Books</title>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <script src="https://www.google.com/recaptcha/enterprise.js?render=6Lda05MpAAAAACIqI_Oz46WvRl6JWvKHLFmTQcRi"></script>
        <Meta />
        <Links />
      </head>
      <body>
        <Theme accentColor="crimson" grayColor="sand" radius="large" scaling="95%">
          <Outlet />
        </Theme>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}
