import React, { createContext, useContext } from 'react';
import type { PageReference } from './pageModel';

interface ScopeValue { page: PageReference; isEditing: boolean }
const PageScopeContext = createContext<ScopeValue>({ page: { kind: 'home' }, isEditing: false });

export function PageScope({ page, isEditing = false, children }: { page: PageReference; isEditing?: boolean; children: React.ReactNode }) {
  return <PageScopeContext.Provider value={{ page, isEditing }}>{children}</PageScopeContext.Provider>;
}

export function usePageScope(): ScopeValue {
  return useContext(PageScopeContext);
}
