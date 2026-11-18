const CONNECTION = 'aem-fragments';

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
    const connection = document.querySelector(`meta[name="urn:adobe:aue:system:${CONNECTION}"]`);
    if (!connection?.content.startsWith('aem:https://')) {
      throw new Error('The AEM Content Fragment author connection is missing or invalid.');
    }

    const author = new URL(connection.content.slice('aem:'.length));
    const fragment = new URL(reference, author);
    const path = decodeURIComponent(fragment.pathname);
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
