const browser = globalThis.browser || chrome;

const providerSelect = document.getElementById('providerSelect');
const anthropicField = document.getElementById('anthropicField');
const openaiField = document.getElementById('openaiField');
const ollamaField = document.getElementById('ollamaField');
const anthropicKey = document.getElementById('anthropicKey');
const openaiKey = document.getElementById('openaiKey');
const ollamaUrl = document.getElementById('ollamaUrl');
const saveBtn = document.getElementById('saveBtn');
const statusMsg = document.getElementById('statusMsg');

// Show/hide fields based on selected provider
function updateFields() {
  const provider = providerSelect.value;
  anthropicField.style.display = provider === 'anthropic' ? 'block' : 'none';
  openaiField.style.display   = provider === 'openai'    ? 'block' : 'none';
  ollamaField.style.display   = provider === 'ollama'    ? 'block' : 'none';
}

// Load saved settings into the form on page open
function loadSettings() {
  browser.storage.local.get(
    ['selectedProvider', 'apiKey_anthropic', 'apiKey_openai', 'ollamaBaseUrl'],
    (result) => {
      providerSelect.value = result.selectedProvider || 'anthropic';
      anthropicKey.value   = result.apiKey_anthropic || '';
      openaiKey.value      = result.apiKey_openai    || '';
      ollamaUrl.value      = result.ollamaBaseUrl    || 'http://localhost:11434';
      updateFields();
    }
  );
}

// Save settings to chrome.storage.local
function saveSettings() {
  const provider = providerSelect.value;

  const toSave = {
    selectedProvider: provider,
    apiKey_anthropic: anthropicKey.value.trim(),
    apiKey_openai:    openaiKey.value.trim(),
    ollamaBaseUrl:    ollamaUrl.value.trim() || 'http://localhost:11434'
  };

  browser.storage.local.set(toSave, () => {
    statusMsg.textContent = '✓ Settings saved.';
    statusMsg.className = 'status';
    setTimeout(() => { statusMsg.textContent = ''; }, 3000);
  });
}

providerSelect.addEventListener('change', updateFields);
saveBtn.addEventListener('click', saveSettings);

loadSettings();