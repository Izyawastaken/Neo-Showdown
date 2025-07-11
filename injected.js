// injected.js (runs in page context)
window.addEventListener('message', function (event) {
    if (event.source !== window) return;
    if (!event.data || event.data.source !== 'neopaste-extension') return;
  
    if (event.data.evalString) {
      try {
        console.log('📥 Injected.js received evalString:\n', event.data.evalString);
        eval(event.data.evalString);
        console.log('✅ Executed setdex injection');
      } catch (err) {
        console.error('❌ Eval failed:', err);
      }
    }
  
    if (event.data.payload) {
      const data = event.data.payload;
      const species = data.species;
      const optionValue = `${species} (NeoPaste Set)`;
  
      try {
        if (!window.setdex) window.setdex = {};
        if (!window.setdex[species]) window.setdex[species] = {};
        window.setdex[species]['NeoPaste Set'] = {  
          ability: data.ability,
          item: data.item,
          teraType: data.teraType,
          nature: data.nature,
          evs: data.evs,
          ivs: data.ivs,
          moves: data.moves
        };
  
        setTimeout(() => {
          const $select = $('#p1 .set-selector');
          $select.val(optionValue).trigger('change');
  
          $select.closest('.select2-container')
            .find('.select2-chosen')
            .text(optionValue);
  
          $('#p1 .gender').val('Male').trigger('change');
  
          if (typeof performCalculations === 'function') {
            performCalculations();
          }
  
          console.log('✅ Successfully injected and selected:', optionValue);
        }, 100);
      } catch (err) {
        console.error('❌ Injection error:', err);
      }
    }
  });
  