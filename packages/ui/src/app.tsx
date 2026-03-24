import { Toaster } from 'sonner';
import { useSearchParams } from './hooks/use-search-params';
import { DiffPage } from './components/diff-page';
import { TreePage } from './components/tree-page';

export function App() {
  const { ref, theme, view, mode } = useSearchParams();

  return (
    <>
      {mode === 'tree' ? (
        <TreePage initialTheme={theme} />
      ) : (
        <DiffPage
          refParam={ref ?? 'work'}
          initialTheme={theme}
          initialViewMode={view}
        />
      )}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            fontSize: '13px',
          },
        }}
      />
    </>
  );
}
