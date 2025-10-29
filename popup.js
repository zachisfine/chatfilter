document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.getElementById('save');
    const statusDiv = document.getElementById('status');
    const wordsListTextarea = document.getElementById('wordsList');
    const minCharRepeatsInput = document.getElementById('minCharRepeats');
    const minWordRepeatsInput = document.getElementById('minWordRepeats');
    const minMultiWordRepeatsInput = document.getElementById('minMultiWordRepeats');

    // Load existing settings
    chrome.storage.sync.get(['wordsList', 'minCharRepeats', 'minWordRepeats', 'minMultiWordRepeats'], function(result) {
        wordsListTextarea.value = result.wordsList || '';
        minCharRepeatsInput.value = result.minCharRepeats || 5;
        minWordRepeatsInput.value = result.minWordRepeats || 3;
        minMultiWordRepeatsInput.value = result.minMultiWordRepeats || 2;
    });

    // Save new settings
    saveButton.addEventListener('click', function() {
        chrome.storage.sync.set({
            'wordsList': wordsListTextarea.value,
            'minCharRepeats': minCharRepeatsInput.value,
            'minWordRepeats': minWordRepeatsInput.value,
            'minMultiWordRepeats': minMultiWordRepeatsInput.value
        }, function() {
            statusDiv.textContent = 'Settings saved!';
            setTimeout(() => statusDiv.textContent = '', 2000); // Clear feedback after 2 seconds
        });
    });
});
