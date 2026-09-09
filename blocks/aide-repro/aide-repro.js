import { moveInstrumentation } from '../../scripts/scripts.js';

/*
 * CSC-571 / E-002404083 repro: the block's own "title" field must remain the
 * first instrumented element in the DOM, ahead of the aide-repro-item
 * children, to match the customer's "aide" block structure that triggers the
 * Universal Editor "Move to top" bug.
 */
export default function decorate(block) {
  const rows = [...block.children];
  const [titleRow, ...itemRows] = rows;

  const heading = document.createElement('h2');
  heading.className = 'aide-repro-title';
  if (titleRow) {
    moveInstrumentation(titleRow, heading);
    while (titleRow.firstElementChild) heading.append(titleRow.firstElementChild);
  }

  const list = document.createElement('ul');
  list.className = 'aide-repro-items';
  itemRows.forEach((row) => {
    const li = document.createElement('li');
    moveInstrumentation(row, li);
    while (row.firstElementChild) li.append(row.firstElementChild);
    list.append(li);
  });

  block.replaceChildren(heading, list);
}
