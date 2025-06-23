// Import Locka functions
import { 
    encryptWeb, 
    decryptWeb, 
    generatePassword as lockaGeneratePassword, 
    generateToken as lockaGenerateToken, 
    parse 
} from 'https://cdn.jsdelivr.net/npm/locka@1.1.1/src/web.js';

import locka from 'https://cdn.jsdelivr.net/npm/locka@1.1.1/src/web.js';

// Global state
let currentStage = 1;
const totalStages = 6;
let stageProgress = [false, false, false, false, false, false];
let encryptedToken = '';

// Initialize the playground
document.addEventListener('DOMContentLoaded', () => {
    updateUI();
    showStage(1);
});

// Stage navigation functions
function nextStage() {
    if (currentStage < totalStages && stageProgress[currentStage - 1]) {
        currentStage++;
        showStage(currentStage);
        updateUI();
    } else if (currentStage === totalStages && stageProgress[currentStage - 1]) {
        showCompletion();
    }
}

function previousStage() {
    if (currentStage > 1) {
        currentStage--;
        showStage(currentStage);
        updateUI();
    }
}

function showStage(stageNumber) {
    // Hide all stages
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    
    // Show current stage
    document.getElementById(`stage${stageNumber}`).classList.add('active');
    
    // Auto-populate fields for Stage 2 if coming from Stage 1
    if (stageNumber === 2 && encryptedToken) {
        document.getElementById('encrypted2').value = encryptedToken;
        document.getElementById('password2').value = document.getElementById('password1').value;
    }
}

function showCompletion() {
    document.querySelectorAll('.stage').forEach(stage => {
        stage.classList.remove('active');
    });
    document.getElementById('completion').classList.add('active');
    updateProgress(100);
    document.getElementById('stageIndicator').textContent = 'Completed! 🎉';
}

function updateUI() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const stageIndicator = document.getElementById('stageIndicator');
    
    // Update buttons
    prevBtn.disabled = currentStage === 1;
    nextBtn.disabled = !stageProgress[currentStage - 1];
    nextBtn.textContent = currentStage === totalStages ? 'Complete 🎉' : 'Next →';
    
    // Update indicator
    stageIndicator.textContent = `Stage ${currentStage} of ${totalStages}`;
    
    // Update progress bar
    const progress = (currentStage / totalStages) * 100;
    updateProgress(progress);
}

function updateProgress(percentage) {
    document.getElementById('progressFill').style.width = percentage + '%';
}

function markStageComplete(stageNumber) {
    stageProgress[stageNumber - 1] = true;
    updateUI();
}

function showResult(elementId, message, isSuccess = true) {
    const resultElement = document.getElementById(elementId);
    resultElement.innerHTML = message;
    resultElement.className = `result ${isSuccess ? 'success' : 'error'} show`;
}

// Stage 1: Basic Encryption
window.encryptStage1 = async function() {
    const plaintext = document.getElementById('plaintext1').value;
    const password = document.getElementById('password1').value;
    
    if (!plaintext || !password) {
        showResult('result1', '❌ Please enter both a message and password!', false);
        return;
    }
    
    try {
        const encrypted = await encryptWeb(plaintext, password);
        encryptedToken = encrypted; // Store for next stage
        showResult('result1', `✅ Encrypted successfully!<br><br><strong>Token:</strong><br><code style="word-break: break-all; background: rgba(0,0,0,0.1); padding: 8px; border-radius: 4px; display: block; margin-top: 8px;">${encrypted}</code>`);
        markStageComplete(1);
    } catch (error) {
        showResult('result1', `❌ Encryption failed: ${error.message}`, false);
    }
};

// Stage 2: Decryption
window.decryptStage2 = async function() {
    const encrypted = document.getElementById('encrypted2').value;
    const password = document.getElementById('password2').value;
    
    if (!encrypted || !password) {
        showResult('result2', '❌ Please enter both the encrypted token and password!', false);
        return;
    }
    
    try {
        const decrypted = await decryptWeb(encrypted, password);
        showResult('result2', `✅ Decrypted successfully!<br><br><strong>Original message:</strong><br><code style="background: rgba(40, 167, 69, 0.1); padding: 8px; border-radius: 4px; display: block; margin-top: 8px; color: #155724;">${decrypted}</code>`);
        markStageComplete(2);
    } catch (error) {
        showResult('result2', `❌ Decryption failed: ${error.message}`, false);
    }
};

// Stage 3: Password Generation
window.generatePassword = function() {
    const length = parseInt(document.getElementById('length3').value);
    const symbols = document.getElementById('symbols3').checked;
    const uppercase = document.getElementById('uppercase3').checked;
    const numbers = document.getElementById('numbers3').checked;
    
    if (length < 8 || length > 128) {
        showResult('result3', '❌ Password length must be between 8 and 128 characters!', false);
        return;
    }
    
    // Check if at least one character type is selected
    if (!symbols && !uppercase && !numbers) {
        showResult('result3', '❌ Please select at least one character type!', false);
        return;
    }
    
    try {
        const options = {
            symbols: symbols,
            uppercase: uppercase,
            numbers: numbers,
            lowercase: true // Always include lowercase
        };
        
        const password = lockaGeneratePassword(length, options);
        
        // Calculate password strength
        const strength = calculatePasswordStrength(password, options);
        const strengthColor = strength.score >= 4 ? '#28a745' : strength.score >= 3 ? '#ffc107' : '#dc3545';
        
        showResult('result3', `
            ✅ Password generated successfully!<br><br>
            <strong>Password:</strong><br>
            <code style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; display: block; margin: 8px 0; font-size: 1.1em; letter-spacing: 1px; word-break: break-all;">${password}</code>
            <div style="margin-top: 15px;">
                <strong>Strength:</strong> 
                <span style="color: ${strengthColor}; font-weight: bold;">${strength.level}</span>
                <div style="background: #e9ecef; height: 6px; border-radius: 3px; margin-top: 5px;">
                    <div style="background: ${strengthColor}; height: 100%; width: ${(strength.score / 5) * 100}%; border-radius: 3px; transition: width 0.3s ease;"></div>
                </div>
                <small style="color: #666; margin-top: 5px; display: block;">Entropy: ~${strength.entropy} bits</small>
            </div>
        `);
        markStageComplete(3);
    } catch (error) {
        showResult('result3', `❌ Password generation failed: ${error.message}`, false);
    }
};

// Helper function to calculate password strength
function calculatePasswordStrength(password, options) {
    let charsetSize = 0;
    if (options.lowercase !== false) charsetSize += 26;
    if (options.uppercase) charsetSize += 26;
    if (options.numbers) charsetSize += 10;
    if (options.symbols) charsetSize += 32; // approximate
    
    const entropy = Math.log2(Math.pow(charsetSize, password.length));
    let score = 0;
    let level = 'Very Weak';
    
    if (entropy >= 80) { score = 5; level = 'Very Strong'; }
    else if (entropy >= 60) { score = 4; level = 'Strong'; }
    else if (entropy >= 40) { score = 3; level = 'Medium'; }
    else if (entropy >= 25) { score = 2; level = 'Weak'; }
    else if (entropy >= 15) { score = 1; level = 'Very Weak'; }
    
    return { score, level, entropy: Math.round(entropy) };
}

// Stage 4: Token Generation
window.generateToken = function() {
    const tokenLength = parseInt(document.getElementById('tokenLength4').value);
    const encoding = document.querySelector('input[name="encoding4"]:checked').value;
    
    if (tokenLength < 16 || tokenLength > 256) {
        showResult('result4', '❌ Token length must be between 16 and 256 bytes!', false);
        return;
    }
    
    try {
        const token = lockaGenerateToken(tokenLength, encoding);
        const tokenInfo = encoding === 'hex' ? 
            `${token.length} characters (${tokenLength} bytes)` : 
            `${token.length} characters (${tokenLength} bytes, base64 encoded)`;
            
        showResult('result4', `
            ✅ Token generated successfully!<br><br>
            <strong>Token (${encoding.toUpperCase()}):</strong><br>
            <code style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; display: block; margin: 8px 0; word-break: break-all; font-size: 0.9em; line-height: 1.4;">${token}</code>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <strong>Length:</strong> ${tokenInfo}<br>
                <strong>Use case:</strong> ${encoding === 'hex' ? 'API keys, database IDs, unique identifiers' : 'URL-safe tokens, web applications, compact encoding'}
            </div>
        `);
        markStageComplete(4);
    } catch (error) {
        showResult('result4', `❌ Token generation failed: ${error.message}`, false);
    }
};

// Stage 5: Hashing - FIXED VERSION
window.hashMessage = async function() {
    const message = document.getElementById('message5').value;
    const algorithm = document.querySelector('input[name="algorithm5"]:checked').value;
    
    if (!message) {
        showResult('result5', '❌ Please enter a message to hash!', false);
        return;
    }
    
    try {
        // Create a locka instance and chain the hash operation
        const lockaInstance = locka(message);
        const hashedInstance = await lockaInstance.hash(algorithm);
        const hash = hashedInstance.toString();
        
        const hashInfo = getHashInfo(algorithm);
        
        showResult('result5', `
            ✅ Message hashed successfully!<br><br>
            <strong>Original:</strong><br>
            <code style="background: rgba(108, 117, 125, 0.1); padding: 8px; border-radius: 4px; display: block; margin: 4px 0;">${message}</code>
            <strong>${algorithm} Hash:</strong><br>
            <code style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; display: block; margin: 8px 0; word-break: break-all; font-size: 0.85em; line-height: 1.4;">${hash}</code>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <strong>Algorithm:</strong> ${algorithm}<br>
                <strong>Output length:</strong> ${hashInfo.length} bits (${hash.length} hex characters)<br>
                <strong>Security:</strong> ${hashInfo.security}
            </div>
        `);
        markStageComplete(5);
    } catch (error) {
        showResult('result5', `❌ Hashing failed: ${error.message}`, false);
    }
};

// Alternative more explicit approach:
window.hashMessageAlternative = async function() {
    const message = document.getElementById('message5').value;
    const algorithm = document.querySelector('input[name="algorithm5"]:checked').value;
    
    if (!message) {
        showResult('result5', '❌ Please enter a message to hash!', false);
        return;
    }
    
    try {
        // Step by step approach for clarity
        const step1 = locka(message);           // Create locka instance with message
        const step2 = await step1.hash(algorithm); // Apply hash transformation
        const hash = step2.toString();         // Convert to string output
        
        const hashInfo = getHashInfo(algorithm);
        
        showResult('result5', `
            ✅ Message hashed successfully!<br><br>
            <strong>Original:</strong><br>
            <code style="background: rgba(108, 117, 125, 0.1); padding: 8px; border-radius: 4px; display: block; margin: 4px 0;">${message}</code>
            <strong>${algorithm} Hash:</strong><br>
            <code style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; display: block; margin: 8px 0; word-break: break-all; font-size: 0.85em; line-height: 1.4;">${hash}</code>
            <div style="margin-top: 10px; font-size: 0.9em; color: #666;">
                <strong>Algorithm:</strong> ${algorithm}<br>
                <strong>Output length:</strong> ${hashInfo.length} bits (${hash.length} hex characters)<br>
                <strong>Security:</strong> ${hashInfo.security}
            </div>
        `);
        markStageComplete(5);
    } catch (error) {
        showResult('result5', `❌ Hashing failed: ${error.message}`, false);
    }
};

// Helper function for hash information
function getHashInfo(algorithm) {
    const info = {
        'SHA-1': { length: 160, security: 'Deprecated - use for compatibility only' },
        'SHA-256': { length: 256, security: 'Excellent - recommended for most uses' },
        'SHA-512': { length: 512, security: 'Excellent - extra security margin' }
    };
    return info[algorithm] || { length: 'Unknown', security: 'Unknown' };
}

// Stage 6: Encoding & XOR
let currentOperation = '';

window.encodeBase64 = function() {
    currentOperation = 'base64';
    document.getElementById('xorKeyGroup').style.display = 'none';
    performEncoding();
};

window.encodeHex = function() {
    currentOperation = 'hex';
    document.getElementById('xorKeyGroup').style.display = 'none';
    performEncoding();
};

window.xorEncode = function() {
    currentOperation = 'xor';
    document.getElementById('xorKeyGroup').style.display = 'block';
    performEncoding();
};

function performEncoding() {
    const data = document.getElementById('data6').value;
    
    if (!data) {
        showResult('result6', '❌ Please enter some data to encode!', false);
        return;
    }
    
    try {
        let result = '';
        let explanation = '';
        
        switch (currentOperation) {
            case 'base64':
                result = locka(data).base64().toString();
                explanation = `
                    <strong>Base64 Encoding:</strong><br>
                    • Converts binary data to ASCII text<br>
                    • Uses A-Z, a-z, 0-9, +, / characters<br>
                    • Commonly used in email and web protocols<br>
                    • Easily reversible (not encryption!)
                `;
                break;
                
            case 'hex':
                result = locka(data).hex().toString();
                explanation = `
                    <strong>Hexadecimal Encoding:</strong><br>
                    • Represents bytes as 0-9, A-F characters<br>
                    • Each byte becomes 2 hex characters<br>
                    • Easy to read and debug<br>
                    • Commonly used in cryptography and debugging
                `;
                break;
                
            case 'xor':
                const xorKey = document.getElementById('xorKey6').value;
                if (!xorKey) {
                    showResult('result6', '❌ Please enter an XOR key!', false);
                    return;
                }
                const xorResult = locka(data).xor(xorKey).raw();
                const xorHex = Array.from(xorResult).map(b => b.toString(16).padStart(2, '0')).join('');
                result = xorHex;
                explanation = `
                    <strong>XOR Operation:</strong><br>
                    • Exclusive OR with repeating key<br>
                    • Same operation encodes and decodes<br>
                    • Simple obfuscation, not secure encryption<br>
                    • Key: "${xorKey}" (repeats as needed)
                `;
                break;
        }
        
        showResult('result6', `
            ✅ ${currentOperation.toUpperCase()} encoding successful!<br><br>
            <strong>Original:</strong><br>
            <code style="background: rgba(108, 117, 125, 0.1); padding: 8px; border-radius: 4px; display: block; margin: 4px 0;">${data}</code>
            <strong>Encoded:</strong><br>
            <code style="background: rgba(40, 167, 69, 0.1); padding: 12px; border-radius: 6px; display: block; margin: 8px 0; word-break: break-all; font-size: 0.9em; line-height: 1.4;">${result}</code>
            <div style="margin-top: 15px; font-size: 0.9em; color: #666;">
                ${explanation}
            </div>
        `);
        markStageComplete(6);
    } catch (error) {
        showResult('result6', `❌ Encoding failed: ${error.message}`, false);
    }
}

// Global navigation functions
window.nextStage = nextStage;
window.previousStage = previousStage;

// Restart playground function
window.restartPlayground = function() {
    currentStage = 1;
    stageProgress = [false, false, false, false, false, false];
    encryptedToken = '';
    
    // Clear all results
    for (let i = 1; i <= 6; i++) {
        const resultElement = document.getElementById(`result${i}`);
        if (resultElement) {
            resultElement.className = 'result';
            resultElement.innerHTML = '';
        }
    }
    
    // Reset form values
    document.getElementById('plaintext1').value = 'Hello, World!';
    document.getElementById('password1').value = 'mysecretkey';
    document.getElementById('encrypted2').value = '';
    document.getElementById('password2').value = '';
    document.getElementById('length3').value = 16;
    document.getElementById('symbols3').checked = true;
    document.getElementById('uppercase3').checked = true;
    document.getElementById('numbers3').checked = true;
    document.getElementById('tokenLength4').value = 32;
    document.querySelector('input[name="encoding4"][value="hex"]').checked = true;
    document.getElementById('message5').value = 'Hello, Locka!';
    document.querySelector('input[name="algorithm5"][value="SHA-256"]').checked = true;
    document.getElementById('data6').value = 'Secret Data';
    document.getElementById('xorKey6').value = 'mykey';
    document.getElementById('xorKeyGroup').style.display = 'none';
    
    showStage(1);
    updateUI();
};

// Add some keyboard shortcuts for better UX
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'ArrowRight':
                e.preventDefault();
                if (!document.getElementById('nextBtn').disabled) {
                    nextStage();
                }
                break;
            case 'ArrowLeft':
                e.preventDefault();
                if (!document.getElementById('prevBtn').disabled) {
                    previousStage();
                }
                break;
        }
    }
});

// Add copy-to-clipboard functionality for results
document.addEventListener('click', (e) => {
    if (e.target.tagName === 'CODE' && e.target.textContent.length > 10) {
        navigator.clipboard.writeText(e.target.textContent).then(() => {
            const originalText = e.target.textContent;
            e.target.textContent = 'Copied!';
            e.target.style.background = 'rgba(40, 167, 69, 0.2)';
            setTimeout(() => {
                e.target.textContent = originalText;
                e.target.style.background = '';
            }, 1000);
        }).catch(() => {
            // Fallback for older browsers
            console.log('Copy failed, but code is visible for manual copying');
        });
    }
});

// Add tooltips for better user experience
const tooltips = {
    'length3': 'Longer passwords are exponentially harder to crack',
    'symbols3': 'Special characters greatly increase password complexity',
    'tokenLength4': 'More bytes = more entropy = better security',
    'algorithm5': 'SHA-256 is the current gold standard for hashing'
};

Object.entries(tooltips).forEach(([id, text]) => {
    const element = document.getElementById(id);
    if (element) {
        element.title = text;
    }
});

console.log('🐺 Locka Playground loaded! Ready to learn encryption!');