import type { LinkComponentProps } from "@cloudflare/kumo";
import { Link } from "@tanstack/react-router";
import { forwardRef } from "react";

/** Lets Kumo links (`Link`, `Sidebar.MenuButton href`) navigate client-side through TanStack Router. */
export const RouterLink = forwardRef<HTMLAnchorElement, LinkComponentProps>(function RouterLink(
  // Kumo also passes the deprecated `to`, mirroring `href`.
  { href, to: _to, ...anchorProps },
  ref,
) {
  return <Link ref={ref} to={href} {...anchorProps} />;
});
