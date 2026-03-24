import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import NProgress from 'nprogress';
import { treePathsOptions, treeInfoOptions, treeFileContentOptions, treeEntriesOptions } from '../queries/tree';
import { useTheme } from '../hooks/use-theme';
import { useReviewThreads } from '../hooks/use-review-threads';
import { useCommentActions } from '../hooks/use-comment-actions';
import { isThreadResolved } from '../types/comment';
import { TreeSidebar } from './tree-sidebar';
import { FolderViewer } from './folder-viewer';
import { FileViewer } from './file-viewer';
import { PageLoader } from './skeleton';
import { GitBranchIcon } from './icons/git-branch-icon';
import { SunIcon } from './icons/sun-icon';
import { MoonIcon } from './icons/moon-icon';

interface TreePageProps {
  initialTheme?: 'light' | 'dark' | null;
}

function getPathFromUrl(): { path: string; type: 'file' | 'dir' } {
  const params = new URLSearchParams(window.location.search);
  const path = params.get('path') || '';
  const type = (params.get('type') || 'dir') as 'file' | 'dir';
  return { path, type };
}

function updateUrl(path: string, type: 'file' | 'dir') {
  const params = new URLSearchParams(window.location.search);
  if (path) {
    params.set('path', path);
  } else {
    params.delete('path');
  }
  if (type === 'file') {
    params.set('type', 'file');
  } else {
    params.delete('type');
  }
  const url = `${window.location.pathname}?${params.toString()}`;
  window.history.pushState({}, '', url);
}

export function TreePage(props: TreePageProps) {
  const { initialTheme } = props;
  const { theme, toggleTheme } = useTheme(initialTheme);
  const queryClient = useQueryClient();

  const [nav, setNav] = useState(getPathFromUrl);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const nprogressActive = useRef(false);

  useEffect(() => {
    const handler = () => {
      setNav(getPathFromUrl());
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  useEffect(() => {
    NProgress.configure({ showSpinner: false, minimum: 0.2, trickleSpeed: 100 });
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const { data: treeData, isLoading: treeLoading } = useQuery(treePathsOptions());
  const { data: info, isLoading: infoLoading } = useQuery(treeInfoOptions());
  const sessionId = info?.sessionId ?? null;
  const { data: threads = [] } = useReviewThreads(sessionId);
  const commentActions = useCommentActions(sessionId, !!sessionId);

  const isFileMode = nav.type === 'file' && !!nav.path;
  const isDirMode = !isFileMode;

  const { data: fileContent, isFetching: fileFetching } = useQuery({
    ...treeFileContentOptions(nav.path),
    enabled: isFileMode,
  });

  const { data: entriesData, isFetching: entriesFetching } = useQuery({
    ...treeEntriesOptions(nav.path || undefined),
    enabled: isDirMode,
  });

  const contentFetching = isFileMode ? fileFetching : entriesFetching;

  useEffect(() => {
    if (contentFetching && !nprogressActive.current) {
      nprogressActive.current = true;
      NProgress.start();
    } else if (!contentFetching && nprogressActive.current) {
      nprogressActive.current = false;
      NProgress.done();
    }
  }, [contentFetching]);

  const commentCountsByFile = useMemo(() => {
    const map = new Map<string, number>();
    for (const thread of threads) {
      if (isThreadResolved(thread)) {
        continue;
      }
      const count = map.get(thread.filePath) ?? 0;
      map.set(thread.filePath, count + 1);
    }
    return map;
  }, [threads]);

  const paths = treeData?.paths ?? [];

  const handleFileClick = useCallback((path: string) => {
    queryClient.prefetchQuery(treeFileContentOptions(path));
    updateUrl(path, 'file');
    setNav({ path, type: 'file' });
  }, [queryClient]);

  const handleDirClick = useCallback((path: string) => {
    queryClient.prefetchQuery(treeEntriesOptions(path || undefined));
    updateUrl(path, 'dir');
    setNav({ path, type: 'dir' });
  }, [queryClient]);

  const handleNavigate = useCallback((path: string, type: 'file' | 'dir') => {
    if (type === 'file') {
      handleFileClick(path);
    } else {
      handleDirClick(path);
    }
  }, [handleFileClick, handleDirClick]);

  const breadcrumbs = useMemo(() => {
    if (!nav.path) {
      return [];
    }
    const parts = nav.path.split('/');
    return parts.map((part, i) => ({
      name: part,
      path: parts.slice(0, i + 1).join('/'),
      isLast: i === parts.length - 1,
    }));
  }, [nav.path]);

  const initialLoading = treeLoading || infoLoading;
  const isInitialContentLoad = isFileMode
    ? !fileContent && fileFetching
    : !entriesData && entriesFetching;

  if (initialLoading || isInitialContentLoad) {
    return <PageLoader />;
  }

  const fileThreads = threads.filter(t => t.filePath === nav.path);
  const entries = entriesData?.entries ?? [];

  return (
    <div className="flex flex-col h-screen bg-bg text-text">
      <div className="flex items-center gap-3 px-4 py-1.5 bg-bg-secondary border-b border-border font-sans text-xs">
        <div className="flex items-center gap-2.5 min-w-0 shrink">
          {info?.name && (
            <button
              className="font-semibold text-text text-sm truncate hover:text-accent transition-colors cursor-pointer"
              onClick={() => handleDirClick('')}
            >
              {info.name}
            </button>
          )}
          {info?.branch && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-diff-hunk-bg text-diff-hunk-text rounded font-mono text-[11px] shrink-0">
              <GitBranchIcon className="w-3 h-3" />
              {info.branch}
            </span>
          )}
          <span className="text-text-muted truncate hidden lg:inline">Repository browser</span>
        </div>
        <div className="flex items-center gap-2 ml-auto shrink-0">
          <button
            className="p-1.5 rounded-md text-text-muted hover:text-text hover:bg-hover bg-bg-tertiary transition-colors cursor-pointer"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Dark mode' : 'Light mode'}
          >
            {theme === 'light' ? <MoonIcon className="w-4 h-4" /> : <SunIcon className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <TreeSidebar
          ref={searchInputRef}
          paths={paths}
          activeFile={isFileMode ? nav.path : null}
          commentCountsByFile={commentCountsByFile}
          onFileClick={handleFileClick}
          onDirClick={handleDirClick}
        />

        <main className="flex-1 overflow-y-auto p-6">
          <nav className="flex items-center gap-1 mb-4 text-sm">
            <button
              className={breadcrumbs.length > 0 ? 'text-accent hover:underline cursor-pointer' : 'text-text font-medium'}
              onClick={() => handleDirClick('')}
            >
              {info?.name ?? 'root'}
            </button>
            {breadcrumbs.map(crumb => (
              <span key={crumb.path} className="flex items-center gap-1">
                <span className="text-text-muted">/</span>
                {crumb.isLast ? (
                  <span className="text-text font-medium">{crumb.name}</span>
                ) : (
                  <button
                    className="text-accent hover:underline cursor-pointer"
                    onClick={() => handleDirClick(crumb.path)}
                  >
                    {crumb.name}
                  </button>
                )}
              </span>
            ))}
          </nav>

          {isFileMode ? (
            fileContent ? (
              <FileViewer
                filePath={nav.path}
                content={fileContent}
                theme={theme}
                threads={fileThreads}
                commentActions={commentActions}
                sessionId={sessionId}
              />
            ) : fileFetching ? null : (
              <div className="flex items-center justify-center h-32 text-xs text-text-muted">
                File not found
              </div>
            )
          ) : entries.length > 0 ? (
            <FolderViewer
              entries={entries}
              onNavigate={handleNavigate}
            />
          ) : entriesFetching ? null : (
            <div className="flex items-center justify-center h-32 text-xs text-text-muted">
              Empty directory
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
