import { execFileSync } from 'node:child_process';

export interface TreeEntry {
  type: 'blob' | 'tree';
  path: string;
  name: string;
}

export function getTree(ref = 'HEAD'): string[] {
  const output = execFileSync('git', ['ls-tree', '-r', '--name-only', ref], {
    encoding: 'utf-8',
  }).trim();
  if (!output) {
    return [];
  }
  return output.split('\n');
}

export function getTreeEntries(ref = 'HEAD', dirPath?: string): TreeEntry[] {
  const target = dirPath ? `${ref}:${dirPath}` : ref;
  const raw = execFileSync('git', ['ls-tree', target], {
    encoding: 'utf-8',
  }).trim();
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
