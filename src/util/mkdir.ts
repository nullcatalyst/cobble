import * as fs from 'fs';
import { ResolvedPath } from './resolved_path';

export async function mkdir(dir: ResolvedPath) {
    await fs.promises.mkdir(dir.toString(), { recursive: true });
}
