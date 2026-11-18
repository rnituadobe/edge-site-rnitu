const CONNECTION = 'aem-fragments';

function getAuthor(block) {
  const prefix = 'urn:adobe:aue:system:';
  const systems = [...document.querySelectorAll(`meta[name^="${prefix}"]`)];
  let connection = systems.find((meta) => meta.name === `${prefix}${CONNECTION}`);
  if (!connection) {
    const resource = block.getAttribute('data-aue-resource');
    const name = resource?.match(/^urn:([^:]+):/)?.[1];
    const active = systems.find((meta) => meta.name === `${prefix}${name}`);
    let author;
    if (active) {
      if (!/^(aem|xwalk):https:\/\//.test(active.content)) {
        throw new Error('The active page author connection is invalid.');
      }
      author = new URL(active.content.slice(active.content.indexOf(':') + 1));
    } else {
      author = new URL(document.location.href);
      if (author.protocol !== 'https:'
        || !/^author-p\d+-e\d+\.adobeaemcloud\.com$/.test(author.hostname)) {
        throw new Error('The page does not provide an AEM Author connection.');
      }
    }

    connection = document.createElement('meta');
    connection.name = `${prefix}${CONNECTION}`;
    connection.content = `aem:${author.origin}`;
    document.head.append(connection);
  }
  if (!connection.content.startsWith('aem:https://')) {
    throw new Error('The AEM Content Fragment author connection is invalid.');
  }
  return new URL(connection.content.slice('aem:'.length));
}

export default function decorate(block) {
  if (!block.hasAttribute('data-aue-resource')) {
    block.hidden = true;
    return;
  }

  const reference = block.querySelector('a')?.getAttribute('href') || block.textContent.trim();
  const card = document.createElement('div');
  card.className = 'content-fragment-editor';

  if (!reference) {
    card.textContent = 'Select this block and choose a Content Fragment in the properties panel.';
    block.replaceChildren(card);
    return;
  }

  try {
    const author = getAuthor(block);
    const fragment = new URL(reference, author);
    // Picker links can be externalized as .html URLs; URNs need the DAM resource path.
    const path = decodeURIComponent(fragment.pathname).replace(/\.html$/, '');
    if (fragment.origin !== author.origin || !path.startsWith('/content/dam/')
      || path.endsWith('/') || fragment.search || fragment.hash) {
      throw new Error('Select a Content Fragment under /content/dam on the configured Author.');
    }

    card.dataset.aueResource = `urn:${CONNECTION}:${path}/jcr:content/data/master`;
    card.dataset.aueType = 'component';
    card.dataset.aueLabel = 'Content Fragment fields';
    const title = document.createElement('strong');
    title.textContent = 'Edit Content Fragment fields';
    const description = document.createElement('p');
    description.textContent = 'Select this card to edit the fragment in the properties panel. Changes are saved automatically. Use a disposable fragment for checkbox testing.';
    const location = document.createElement('code');
    location.textContent = path;
    card.append(title, description, location);
  } catch (error) {
    console.error('Unable to instrument the Content Fragment.', error);
    card.setAttribute('role', 'alert');
    card.textContent = `Unable to edit Content Fragment: ${error.message}`;
  }

  block.replaceChildren(card);
}
