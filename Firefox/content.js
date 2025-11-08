// content.js
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

    let isShiny = false;
set.querySelectorAll('.detailcell').forEach(cell => {
  const label = cell.querySelector('label')?.textContent.trim();
  if (label === 'Shiny') {
    const value = cell.textContent.replace('Shiny', '').trim();
    isShiny = value.toLowerCase() === 'yes';
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
    if (isShiny) text += `Shiny: Yes\n`;
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

function waitForJQuery(callback) {
  if (typeof window.$ === 'function') {
    callback();
  } else {
    setTimeout(() => waitForJQuery(callback), 50);
  }
}

function injectScriptFile(filePath) {
  const script = document.createElement('script');
  script.src = chrome.runtime.getURL(filePath);
  script.type = 'text/javascript';
  script.onload = () => script.remove();
  document.documentElement.appendChild(script);
}

// Inject the page-context script (required for modifying window.setdex)
injectScriptFile('injected.js');

(function () {
  try {
    const isNeoPasteViewer =
      (window.location.hostname === 'izyawastaken.github.io' && 
       (window.location.pathname.includes('/NeoPaste/view.html') || 
        window.location.pathname.includes('/PokeShare/view.html'))) ||
      (window.location.hostname.endsWith('.vercel.app') && 
       window.location.pathname.includes('view.html')) ||
      (window.location.protocol === 'file:' &&
        window.location.pathname.replace(/\\/g, '/').toLowerCase().endsWith('/projects/neo-showdown/view.html'));
    if (isNeoPasteViewer) {
      const meta = document.createElement('meta');
      meta.name = 'neoShowdownExtPresent';
      meta.content = 'true';
      document.head.appendChild(meta);
    }
  } catch (e) {}
})();

(function () {
  if (window.location.hostname !== 'calc.pokemonshowdown.com') return;

  const params = new URLSearchParams(window.location.search);
  const neoPasteToken = params.get('neopaste');
  const pokeShareToken = params.get('pokeShare');
  const token = neoPasteToken || pokeShareToken;
  const source = neoPasteToken ? 'NeoPaste' : 'PokeShare';
  if (!token) return;

  fetch(`https://neocalc.agastyawastaken.workers.dev/get?token=${encodeURIComponent(token)}`)
    .then(res => res.ok ? res.text() : Promise.reject('Not found'))
    .then(setText => {
      console.log('✅ Fetched NeoPaste: ', setText);

      const lines = setText.split('\n').map(l => l.trim()).filter(l => l); 
      const speciesLine = lines[0] || '';
      const abilityLine = lines.find(l => l.startsWith('Ability:')) || '';
      const teraLine = lines.find(l => l.startsWith('Tera Type:')) || '';
      const evLine = lines.find(l => l.startsWith('EVs:')) || '';
      const ivLine = lines.find(l => l.startsWith('IVs:')) || '';
      const ivs = { hp: 31, at: 31, df: 31, sa: 31, sd: 31, sp: 31 };
      if (ivLine) {
        ivLine.replace('IVs:', '').trim().split('/').forEach(iv => {
        const [num, stat] = iv.trim().split(' ');
      const map = {HP: 'hp', Atk: 'at', Def: 'df', SpA: 'sa', SpD: 'sd', Spe: 'sp'};
      if (map[stat]) ivs[map[stat]] = parseInt(num);
    });
  }

      const natureLine = lines.find(l => l.includes('Nature')) || '';
      const moves = lines.filter(l => l.startsWith('- ')).map(l => l.slice(2));

      const [speciesPart, itemPart] = speciesLine.split('@').map(s => s.trim());
      const species = speciesPart || 'Unknown';
      const item = itemPart || '';

      const ability = abilityLine.replace('Ability:', '').trim();
      const teraType = teraLine.replace('Tera Type:', '').trim();
      const nature = natureLine.replace('Nature', '').replace('Nature:', '').trim();

      const evs = { hp: 0, at: 0, df: 0, sa: 0, sd: 0, sp: 0 };
      if (evLine) {
        evLine.replace('EVs:', '').trim().split('/').forEach(ev => {
          const [num, stat] = ev.trim().split(' ');
          const map = {
            HP: 'hp', Atk: 'at', Def: 'df', SpA: 'sa', SpD: 'sd', Spe: 'sp'
          };
          if (map[stat]) evs[map[stat]] = parseInt(num);
          
        });
      }
      

      // Send data to injected.js via postMessage
      const command = `window.setdex['${species}'] = {
        'setName': {
          ability: ${JSON.stringify(ability)},
          item: ${JSON.stringify(item)},
          teraType: ${JSON.stringify(teraType)},
          nature: ${JSON.stringify(nature)},
          evs: ${JSON.stringify(evs)},
          ivs: ${JSON.stringify(ivs)},
          moves: ${JSON.stringify(moves)}
        }
      };`;

      window.postMessage({
        source: 'neopaste-extension',
        evalString: command
      }, '*');
      window.postMessage({
        source: 'neopaste-extension',
        setSource: source,
        payload: {
          species,
          ability,
          item,
          teraType,
          nature,
          evs,
          ivs,
          moves
        }
      }, '*');
      

      function waitForElement(selector, callback, timeout = 5000) {
        const startTime = Date.now();
        function check() {
          if ($(selector).length > 0) callback();
          else if (Date.now() - startTime < timeout) setTimeout(check, 100);
          else console.error('Element not found:', selector);
        }
        check();
      }
      waitForJQuery(() => {
        waitForElement('#p1 .set-selector', () => {
          if (typeof window.updateDex === 'function') {
            window.updateDex();
          }
      
          // Wait a bit for updateDex to finish updating the dropdown
          setTimeout(() => {
            const setName = `${source} Set`;
            const optionValue = `${species} (${setName})`;

            const $select = $('#p1 .set-selector');
      
            const optionExists = $select.find(`option[value="${optionValue}"]`).length > 0;
            if (!optionExists) {
              console.error('❌ Set not found in dropdown:', optionValue);
              console.log('Available options:', $select.find('option').map((_, o) => o.value).get());
              return;
            }
      
            // Ensure Select2 is initialized and use correct API
            if ($select.data('select2')) {
              $select.select2('val', optionValue);
            } else {
              $select.val(optionValue).trigger('change');
            }
      
            // Optional: Manually update the visible label if needed
            const container = $select.closest('.select2-container');
            if (container.length) {
              container.find('.select2-chosen').text(optionValue);
            }
      
            // Call Showdown functions to fully apply the change
            if (typeof window.loadSet === 'function') {
              window.loadSet('p1', species, 'setName');
            }
            if (typeof window.onSetChange === 'function') {
              window.onSetChange('p1');
            }
      
            // Set gender
            $('#p1 .gender').val('Female').trigger('change');
      
            // Recalculate stats
            if (typeof performCalculations === 'function') {
              performCalculations();
            }
      
            console.log('✅ Selected and applied set:', optionValue);
      
            // Copy full NeoPaste to clipboard
            if (navigator.clipboard?.writeText) {
              navigator.clipboard.writeText(setText).then(() => {
                console.log('✅ Copied to clipboard too');
              });
            }
          }, 300); // Give enough time for dropdown update
        });
      });
    });
})(); 