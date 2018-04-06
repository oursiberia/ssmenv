import chalk from 'chalk';

function colorizeLine(line: string) {
  if (line.startsWith('# ')) {
    return chalk.dim(line);
  } else {
    return line;
  }
}

/**
 * Use the given `lines` to make a presentable example.
 * @param lines to be displayed.
 * @returns a single string for use in `Command.examples` array.
 */
export function make(lines: string[]): string {
  return lines
    .map(colorizeLine)
    .join('\n')
    .concat('\n');
}
