import { exec, execLines } from './exec.js';

export interface TreeEntry {
  type: 'blob' | 'tree';
  path: string;
  name: string;
}

export function getTree(ref = 'HEAD'): string[] {
  return execLines(`git ls-tree -r --name-only ${ref}`);
}

export function getTreeEntries(ref = 'HEAD', dirPath?: string): TreeEntry[] {
  const target = dirPath ? `${ref}:${dirPath}` : ref;
  const raw = exec(`git ls-tree ${target}`);
  if (!raw) {
    return [];
  }

  return raw.split('\n').map(line => {
    const [info, name] = line.split('\t');
    const type = info.split(/\s+/)[1] as 'blob' | 'tree';
    const fullPath = dirPath ? `${dirPath}/${name}` : name;
    return { type, path: fullPath, name };
  });
}
