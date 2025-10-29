// Default words list
const defaultWords = `W
L
facts
fax
tru
true
cap`;

// Save the words list to storage
function saveWords() {
    const words = document.getElementById('wordsList').value;
    chrome.storage.sync.set({ 'wordsList': words }, function() {
        console.log('Words list saved.');
    });
}

// Load the words list from storage
function loadWords() {
    chrome.storage.sync.get(['wordsList'], function(result) {
        if (result.wordsList) {
            document.getElementById('wordsList').value = result.wordsList;
        } else {
            document.getElementById('wordsList').value = defaultWords;
        }
    });
}

// Event listener for the save button
document.getElementById('save').addEventListener('click', saveWords);

// Load the words list when the options page is opened
document.addEventListener('DOMContentLoaded', loadWords);