function buildExportTextFromDOM() {
  let text = '';

  const natureMap = {
    'AtkUp-DefDown': 'Lonely',
    'AtkUp-SpADown': 'Adamant',
    'AtkUp-SpeDown': 'Brave',
    'DefUp-AtkDown': 'Bold',
    'DefUp-SpADown': 'Impish',
    'DefUp-SpeDown': 'Relaxed',
    'SpAUp-AtkDown': 'Modest',
    'SpAUp-DefDown': 'Mild',
    'SpAUp-SpeDown': 'Quiet',
    'SpDUp-AtkDown': 'Calm',
    'SpDUp-DefDown': 'Gentle',
    'SpDUp-SpeDown': 'Sassy',
    'SpeUp-AtkDown': 'Timid',
    'SpeUp-DefDown': 'Hasty',
    'SpeUp-SpADown': 'Jolly',
    'SpeUp-SpDDown': 'Naive',
    'None': 'Hardy'
  };

  document.querySelectorAll('.setchart').forEach(set => {
    const pokemon = set.querySelector('input[name="pokemon"]')?.value || '';
    const nickname = set.querySelector('input[name="nickname"]')?.value || '';
    const item = set.querySelector('input[name="item"]')?.value || '';
    const ability = set.querySelector('input[name="ability"]')?.value || '';

    let teraType = '';
    set.querySelectorAll('.detailcell').forEach(cell => {
      const label = cell.querySelector('label')?.textContent.trim();
      if (label === 'Tera Type') {
        teraType = cell.textContent.replace('Tera Type', '').trim();
      }
    });

    let plus = '';
    let minus = '';
    set.querySelectorAll('.statrow').forEach(row => {
      const stat = row.querySelector('label')?.textContent?.trim();
      const small = row.querySelector('small');
      if (small) {
        const mark = small.textContent.trim();
        if (mark === '+') plus = stat;
        if (mark === '-' || mark === '–' || mark === '−') minus = stat;
      }
    });

    let nature = 'Hardy';
    if (plus && minus && plus !== minus) {
      nature = natureMap[`${plus}Up-${minus}Down`] || 'Hardy';
    }

    const evParts = [];
    set.querySelectorAll('.statrow').forEach(statRow => {
      const statName = statRow.querySelector('label')?.textContent?.trim();
      const ev = statRow.querySelector('em')?.textContent?.trim();
      if (statName && ev && ev !== '0') {
        evParts.push(`${ev} ${statName}`);
      }
    });

    const ivParts = ['31 Atk'];

    const moves = [];
    for (let i = 1; i <= 4; i++) {
      const move = set.querySelector(`input[name="move${i}"]`)?.value || '';
      if (move) moves.push(`- ${move}`);
    }

    text += `${nickname ? nickname + ' ' : ''}${pokemon} @ ${item}\n`;
    text += `Ability: ${ability}\n`;
    if (teraType) text += `Tera Type: ${teraType}\n`;
    if (evParts.length) text += `EVs: ${evParts.join(' / ')}\n`;
    if (nature) text += `${nature} Nature\n`;
    if (ivParts.length) text += `IVs: ${ivParts.join(' / ')}\n`;
    text += moves.join('\n') + '\n\n';
  });

  return text.trim();
}

function createNeoPasteButton() {
  if (document.getElementById('neopaste-export-button')) return;

  const pokePasteButton = document.querySelector('button[name="pokepasteExport"]');
  if (!pokePasteButton) return;

  const neoPasteButton = document.createElement('button');
  neoPasteButton.id = 'neopaste-export-button';
  neoPasteButton.className = 'button exportbutton';
  neoPasteButton.type = 'button';
  neoPasteButton.innerHTML = '<i class="fa fa-upload"></i> Upload to NeoPaste';

  neoPasteButton.onclick = async () => {
    const title = document.querySelector('.teamnameedit')?.value || 'Untitled';
    const content = buildExportTextFromDOM();
    const authorSpan = document.querySelector('.usernametext');
    const author = authorSpan ? authorSpan.textContent.trim() : 'Anonymous';

    const payload = [{
      id: Math.random().toString(36).substring(2, 8),
      title,
      content,
      author,
      created_at: new Date().toISOString()
    }];

    console.log('Uploading:\n', payload[0].content);

    try {
      const response = await fetch('https://psext.agastyawastaken.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Upload failed:', error);
        return;
      }

      const pasteUrl = `https://izyawastaken.github.io/NeoPaste/view.html?id=${payload[0].id}`;
      await navigator.clipboard.writeText(pasteUrl);
      console.log(`✅ Uploaded & link copied: ${pasteUrl}`);
      window.open(pasteUrl, '_blank');
    } catch (err) {
      console.error('Upload error:', err);
    }
  };

  pokePasteButton.parentElement.insertBefore(neoPasteButton, pokePasteButton.nextSibling);
}

// === PASTE-TO-IMPORT ===
document.addEventListener('paste', async (e) => {
  const pasteText = (e.clipboardData || window.clipboardData).getData('text');
  const match = pasteText.match(/neopaste.*[?&]id=([a-z0-9]+)/i);
  if (match) {
    e.preventDefault();
    const id = match[1];
    try {
      const response = await fetch(`https://psext.agastyawastaken.workers.dev/?id=${id}`);
      if (!response.ok) throw new Error('Fetch failed');
      const data = await response.json();
      const team = data.content || '';
      const textarea = document.querySelector('.teamedit textarea');
      if (textarea) {
        textarea.value = team.trim();
        console.log('✅ NeoPaste imported');
      }
    } catch (err) {
      console.error('Import failed:', err);
    }
  }
});

const observer = new MutationObserver(() => {
  createNeoPasteButton();
});
observer.observe(document.body, { childList: true, subtree: true });
