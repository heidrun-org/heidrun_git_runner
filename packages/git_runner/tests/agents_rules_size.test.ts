import Fs from 'node:fs';
import Path from 'node:path';
import { describe, expect, it } from 'vitest';

const __dirname = import.meta.dirname;

const MAXIMUM_FILE_SIZE = 10_000;

describe('Agent rules size', () => {
	const agentsRulesFolder = Path.join(__dirname, '..', '..', '..', 'docs', 'agents_rules');

	it('has no file larger than the maximum size that the file AGENTS.md gives', () => {
		const relativePaths = Fs.readdirSync(agentsRulesFolder, { recursive: true, encoding: 'utf8' });
		const filePaths = relativePaths.filter((relativePath) => {
			return Fs.statSync(Path.join(agentsRulesFolder, relativePath)).isFile();
		});
		expect(filePaths.length).toBeGreaterThan(0);
		for (const relativePath of filePaths) {
			const fileSize = Fs.statSync(Path.join(agentsRulesFolder, relativePath)).size;
			expect(fileSize, relativePath).toBeLessThanOrEqual(MAXIMUM_FILE_SIZE);
		}
	});
});
