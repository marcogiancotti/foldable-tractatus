// @vitest-environment jsdom

import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import StatementText from './StatementText';

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe('qualified inline terms', () => {
  it('keeps a phrase clickable across emphasis and attributes it to the longest entry', async () => {
    const select = vi.fn();
    await act(async () =>
      root.render(
        <StatementText
          text={'An \\emph{atomic} fact has logical form.'}
          activeTerm={null}
          onSelectTerm={select}
        />,
      ),
    );

    const atomicFact = container.querySelector<HTMLButtonElement>('[title="trace \\"atomic fact\\""]');
    expect(atomicFact?.textContent).toBe('atomic fact');
    expect(atomicFact?.querySelector('em')?.textContent).toBe('atomic');

    await act(async () => atomicFact?.click());
    expect(select).toHaveBeenCalledWith('atomic fact');
  });

  it('highlights a qualified occurrence when its base term is active', async () => {
    await act(async () =>
      root.render(
        <StatementText
          text="An atomic fact."
          activeTerm="fact"
          onSelectTerm={() => {}}
        />,
      ),
    );

    expect(container.querySelector('[title="trace \\"atomic fact\\""]')?.classList).toContain('is-hit');
  });

  it('highlights a free-text phrase that extends beyond a curated phrase', async () => {
    await act(async () =>
      root.render(
        <StatementText
          text="An atomic fact is a combination."
          activeTerm="atomic fact is"
          onSelectTerm={() => {}}
        />,
      ),
    );

    expect(container.querySelector('[title="trace \\"atomic fact\\""]')?.classList).toContain('is-hit');
    expect([...container.querySelectorAll('.term-hit')].map((node) => node.textContent).join('')).toContain(' is');
  });

  it('highlights an active search that is also an inline cross-reference', async () => {
    await act(async () =>
      root.render(
        <StatementText
          text="This is shown in No. 5.101."
          activeTerm="5.101"
          onSelectTerm={() => {}}
          refs={['5.101']}
          onNavigate={() => {}}
        />,
      ),
    );

    expect(container.querySelector('.xref-num.term-hit')?.textContent).toBe('5.101');
  });
});
