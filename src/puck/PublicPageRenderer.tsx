import React from 'react';
import type { Data } from '@measured/puck';
import { puckConfig } from './puck.config';
import { PAGE_BLOCK_TYPES } from './pageModel';

/** Render this site's flat Puck blocks without loading the editor runtime on public pages. */
export function PublicPageRenderer({ data }: { data: Data }) {
  return <>{data.content.map((block) => {
    if (!PAGE_BLOCK_TYPES.includes(block.type as typeof PAGE_BLOCK_TYPES[number])) return null;
    const component = puckConfig.components[block.type as keyof typeof puckConfig.components];
    if (!component) return null;
    const render = component.render as (props: Record<string, unknown>) => React.ReactNode;
    return <React.Fragment key={block.props.id}>{render(block.props)}</React.Fragment>;
  })}</>;
}
