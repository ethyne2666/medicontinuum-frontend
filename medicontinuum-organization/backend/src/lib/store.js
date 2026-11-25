import fs from 'node:fs';
import path from 'node:path';

/**
 * Tiny JSON-file store. All reads/writes happen synchronously inside a single
 * Node process, so read-modify-write sequences are atomic. Swap this class for a
 * real database (Postgres/MongoDB) before running in production at scale.
 */
export class Store {
  constructor(file) {
    this.file = file;
    this.data = { entities: [], shares: [] };
    this.load();
  }

  load() {
    try {
      const raw = fs.readFileSync(this.file, 'utf8');
      this.data = { entities: [], shares: [], ...JSON.parse(raw) };
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      fs.mkdirSync(path.dirname(this.file), { recursive: true });
      this.save();
    }
  }

  save() {
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
    fs.renameSync(tmp, this.file);
  }
}
