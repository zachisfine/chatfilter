let wordsList = [];
let minCharRepeats, minWordRepeats, minMultiWordRepeats;
const velocityCheckInterval = 10000; // 10 seconds
const velocityThreshold = 50; // 50 messages per interval
const inactivityThreshold = 10000; // 10 seconds for inactivity

// Load settings once when the content script is first injected
chrome.storage.sync.get(['wordsList', 'minCharRepeats', 'minWordRepeats', 'minMultiWordRepeats'], function(result) {
    wordsList = result.wordsList || "";
    minCharRepeats = parseInt(result.minCharRepeats || 5, 10);
    minWordRepeats = parseInt(result.minWordRepeats || 3, 10);
    minMultiWordRepeats = parseInt(result.minMultiWordRepeats || 2, 10);
    // Use these settings in your observer logic...
});

function containsOnlySiteEmojis(node) {
    // Attempt to directly target the container that would hold the message content or emoji.
    // This assumes emojis are directly within 'div.chat-emote-container' and text within 'span.chat-entry-content'.
    const messageContent = node.querySelector('.chat-entry-content');
    const emojiContainers = node.querySelectorAll('.chat-emote-container img[data-emote-name]');

    // Check if there's no text content and at least one emoji.
    const isEmojiOnly = !messageContent && emojiContainers.length > 0;
    return isEmojiOnly;
}


function containsRepeatingWordPatterns(text, minRepeatThreshold = 2) {
    const words = text.trim().split(/\s+/); // Split the text into words.
    let patternLength, timesRepeated, pattern, i, j;

    // Check patterns of increasing length to see if they repeat.
    for (patternLength = 1; patternLength <= words.length / 2; patternLength++) {
        for (i = 0; i <= words.length - patternLength * 2; i++) {
            pattern = words.slice(i, i + patternLength);
            timesRepeated = 1;

            for (j = i + patternLength; j <= words.length - patternLength; j += patternLength) {
                let nextPattern = words.slice(j, j + patternLength);
                if (pattern.join(' ') === nextPattern.join(' ')) {
                    timesRepeated++;
                } else {
                    break; // Pattern does not continue, move to the next starting point.
                }
            }

            if (timesRepeated >= minRepeatThreshold) {
                console.log(`Repeating pattern found: "${pattern.join(' ')}", repeated ${timesRepeated} times.`);
                return true; // Found a repeating pattern meeting the threshold.
            }
        }
    }

    return false; // No repeating pattern meeting the threshold was found.
}



function shouldFilterMessage(node, wordsList, minCharRepeats, minWordRepeats) {

    if (containsOnlySiteEmojis(node)) {
        return true;
    }

    const messageContent = node.querySelector('.chat-entry-content');
    if (messageContent) {

        const textContent = messageContent.textContent.trim().toLowerCase();
        const words = wordsList.toLowerCase().split('\n');
        
        // Check if the entire message is exactly a word from the wordsList
        const isExactMatch = words.includes(textContent);
        if (isExactMatch) {
            console.log('Exact match found:', textContent);
            return true;
        }

        // Check for repeated characters
        const repeatedCharPattern = new RegExp(`(.)\\1{${minCharRepeats - 1},}`);
        if (repeatedCharPattern.test(textContent)) {
            console.log('Repeating characters found:', textContent);
            return true;
        }

        // Improved check for repeated words
        // This pattern looks for any word repeated the specified number of times, separated by whitespace
        const wordBoundary = '\\b';
        const whitespace = '\\s+';
        const repeatedWordPattern = new RegExp(`(${wordBoundary}(\\w+)${wordBoundary})${whitespace}\\2{${minWordRepeats - 1},}`, 'i');
        if (repeatedWordPattern.test(textContent)) {
            console.log('Repeating words found:', textContent);
            return true;
        }

        // New check for multiple word repeats
        if (containsRepeatingWordPatterns(textContent, minWordRepeats)) {
            console.log('Repeating word patterns found:', textContent);
            return true;
        }

        // Check for excessive emojis
        if (countEmojis(messageContent) > 5) {
            console.log('Hiding message due to excessive emojis:', messageContent);
            return true;
        }

    }

    return false;
}

function countEmojis(text) {
    // This regex pattern is a simplified attempt to match emojis
    // Note: This might not cover all emoji sequences perfectly due to the complexity of emoji standards
    const emojiPattern = /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g;
    const matches = text.match(emojiPattern);
    return matches ? matches.length : 0;
}

function transformMessageCaseIfNeeded(textContent) {
    const totalChars = textContent.length;
    const uppercaseChars = [...textContent].filter(char => char === char.toUpperCase() && isNaN(parseInt(char))).length;
    const uppercasePercentage = (uppercaseChars / totalChars) * 100;

    // Transform to lowercase if more than 70% of the characters are uppercase
    if (uppercasePercentage > 70 && totalChars > 25) {
        return textContent.toLowerCase();
    } else {
        return textContent;
    }
}

function setupObserver(chatContainer) {
    const observer = new MutationObserver(mutations => {
        // Retrieve settings once outside the forEach to avoid repeated calls
        chrome.storage.sync.get(['wordsList', 'minCharRepeats', 'minWordRepeats'], function(result) {
            const wordsList = result.wordsList || "";
            const minCharRepeats = parseInt(result.minCharRepeats || 5, 10); // Default to 5 if not set
            const minWordRepeats = parseInt(result.minWordRepeats || 3, 10); // Default to 3 if not set
            const minMultiWordRepeats = parseInt(result.minMultiWordRepeats || 2, 10); // Default to 2 if not set

            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE && node.classList.contains('mt-0.5')) {
                        const shouldFilter = shouldFilterMessage(node, wordsList, minCharRepeats, minWordRepeats, minMultiWordRepeats);
                        if (shouldFilter) {
                            node.style.display = 'none';
                        }
                        const messageContent = node.querySelector('.chat-entry-content');
                        if (messageContent) {
                            // Transform message case if needed
                            const originalText = messageContent.textContent;
                            const transformedText = transformMessageCaseIfNeeded(originalText);
                            
                            // Update the message content if transformed
                            if (originalText !== transformedText) {
                                console.log(`More than 70% of message is uppercase and message is >25 characters, lowercased message`);
                                messageContent.textContent = transformedText;
                            }
    
                            // Proceed with any additional processing...
                        }
                    }
                });
            });
        });

    });

    observer.observe(chatContainer, { childList: true, subtree: true });
    console.log('Observer has been set up.'); // Debugging output
}

function waitForChatContainer() {
    const chatContainerSelector = '.relative.flex.grow.flex-col.overflow-hidden';
    console.log(`Looking for chat container with selector: ${chatContainerSelector}`); // Debugging output

    const chatContainer = document.querySelector(chatContainerSelector);

    if (chatContainer) {
        console.log('Chat container found, setting up observer.');
        setupObserver(chatContainer);
    } else {
        console.log('Chat container not found, retrying...');
        setTimeout(waitForChatContainer, 1000);
    }
}

waitForChatContainer();

