// State
let currentState = 'LOGIN'; // LOGIN, REGISTER, DASHBOARD

// Multi-language Command Vocabulary (English, Hindi, Telugu)
const COMMANDS = {
    TRANSFER: ['transfer', 'send', 'pampinchu', 'bhejo', 'money', 'paise', 'dabbulu'],
    BILL: ['bill', 'pay', 'kattu', 'bhar', 'electricity', 'current', 'water', 'gas', 'net', 'wifi', 'dth'],
    BALANCE: ['balance', 'amount', 'entha', 'kitna', 'paise', 'chk', 'check'],
    LOGIN: ['login', 'signin', 'log in', 'sign in', 'aao', 'randi'],
    LOGOUT: ['logout', 'signout', 'po', 'jao'],
    CONFIRM: ['confirm', 'ok', 'sare', 'thik', 'done', 'yes', 'pay']
};

function checkCommand(transcript, type) {
    if (!COMMANDS[type]) return false;
    return COMMANDS[type].some(keyword => transcript.toLowerCase().includes(keyword));
}
let userProfile = null;

// Navigation Helper
function goToAuth() {
    // Loader Effect
    const btn = document.querySelector('#landing-section .btn-primary');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

    setTimeout(() => {
        document.getElementById('landing-section').classList.add('hidden-section');
        document.getElementById('landing-section').classList.remove('active-section');
        document.getElementById('auth-section').classList.remove('hidden-section');
        document.getElementById('auth-section').classList.add('active-section');

        // Reset button
        btn.innerHTML = originalText;
    }, 800); // Small delay for effect
}

function goBack() {
    document.getElementById('auth-section').classList.add('hidden-section');
    document.getElementById('auth-section').classList.remove('active-section');
    document.getElementById('landing-section').classList.remove('hidden-section');
    document.getElementById('landing-section').classList.add('active-section');
}
let recognition;
let isListening = false;
let continuousAuthInterval;
const AUTH_THRESHOLD = 0.55; // Strictness for face match (Lower is stricter, 0.6 is standard)

// DOM Elements
const video = document.getElementById('video-feed');
const canvas = document.getElementById('face-canvas');
const authSection = document.getElementById('auth-section');
const dashboardSection = document.getElementById('dashboard-section');
const voiceText = document.getElementById('voice-text');
const btnLogin = document.getElementById('btn-login');
const btnRegister = document.getElementById('btn-register');
const mobileInput = document.getElementById('mobile-input');

// Init
let modelsLoaded = false;

window.addEventListener('load', () => {
    // 1. Show App Immediately
    document.getElementById('loader').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');

    // 2. Load Models in Background
    initApp();
});

async function initApp() {
    try {
        await loadModels();
        modelsLoaded = true;
        console.log("Models Loaded");
        startVideo(video);
        initVoice();
    } catch (e) {
        console.error("Initialization Error:", e);
    }
}

// Voice Recognition Setup
// Voice Recognition Setup
// Voice Recognition Setup
function initVoice() {
    window.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.lang = 'en-IN'; // Indian English handles mixed commands better

    recognition.onresult = (e) => {
        try {
            // Fix: Only process the latest result
            const latestResult = e.results[e.results.length - 1];
            if (!latestResult) return;

            const transcript = latestResult[0].transcript;
            console.log("DEBUG: Voice Result:", transcript); // DEBUG LOG
            voiceText.textContent = transcript;

            // Parse numbers from speech if in Auth mode
            if (dashboardSection.classList.contains('hidden-section')) {
                // Explicit Login Command
                console.log("DEBUG: Checking Login Command:", transcript, checkCommand(transcript, 'LOGIN')); // DEBUG LOG
                if (checkCommand(transcript, 'LOGIN') && !isLoggingIn) {
                    speak("Logging in...");
                    attemptLogin();
                    return;
                }

                const numberMatch = transcript.match(/\d+/g);
                if (numberMatch) {
                    const numbers = numberMatch.join('');
                    if (numbers.length >= 10 && !isLoggingIn) {
                        mobileInput.value = numbers;
                        // Auto-Trigger Login
                        speak("Number recognized. Verifying...");
                        attemptLogin();
                    } else if (numbers.length >= 5) {
                        mobileInput.value = numbers;
                    }
                }
            }

            if (latestResult.isFinal) {
                const lower = transcript.toLowerCase();

                // PIN Voice Logic
                const pinOverlay = document.getElementById('upi-pin-overlay');
                if (pinOverlay && !pinOverlay.classList.contains('hidden')) {
                    // Commands
                    if (lower.includes('clear') || lower.includes('delete')) {
                        clearPin();
                        speak("Cleared.");
                        return;
                    }
                    if (lower.includes('cancel') || lower.includes('close')) {
                        closePinOverlay();
                        speak("Cancelled.");
                        return;
                    }
                    if (checkCommand(lower, 'CONFIRM')) {
                        submitPin();
                        return;
                    }

                    // Parse Numbers
                    const wordMap = {
                        'one': 1, 'won': 1, 'wan': 1, 'ek': 1, 'okati': 1,
                        'two': 2, 'to': 2, 'too': 2, 'tu': 2, 'do': 2, 'rendu': 2,
                        'three': 3, 'tree': 3, 'free': 3, 'teen': 3, 'moodu': 3,
                        'four': 4, 'for': 4, 'fo': 4, 'char': 4, 'nalugu': 4,
                        'five': 5, 'fi': 5, 'paanch': 5, 'aidu': 5,
                        'six': 6, 'sex': 6, 'che': 6, 'aaru': 6,
                        'seven': 7, 'saat': 7, 'edu': 7,
                        'eight': 8, 'ate': 8, 'aath': 8, 'enimidi': 8,
                        'nine': 9, 'nigh': 9, 'nau': 9, 'tommidi': 9,
                        'zero': 0, 'oh': 0, 'o': 0, 'shunya': 0, 'sunna': 0
                    };

                    const tokens = lower.split(/\s+/);
                    for (const token of tokens) {
                        const cleanToken = token.replace(/[^\w]/g, '');
                        // Check digits
                        if (cleanToken.match(/^\d+$/)) {
                            cleanToken.split('').forEach(d => enterPin(parseInt(d)));
                        }
                        // Check word map
                        else if (wordMap[cleanToken] !== undefined) {
                            enterPin(wordMap[cleanToken]);
                        }
                    }
                    return; // Skip standard commands
                }

                handleVoiceCommand(lower);
            }
        } catch (err) {
            console.error("Voice processing error:", err);
        }
    };

    recognition.onerror = (e) => {
        console.error("Speech recognition error", e.error);
        if (e.error === 'not-allowed') {
            speak("Microphone access denied. Please enable permissions.");
            isListening = false;
        } else {
            // Restart on error (except denied)
            if (isListening) {
                // Small backoff to prevent rapid loops
                setTimeout(() => {
                    try { recognition.start(); } catch (e) { }
                }, 1000);
            }
        }
    };

    recognition.onend = () => {
        if (isListening) {
            try {
                recognition.start();
            } catch (e) {
                console.log("Recognition already started");
            }
        }
    };

    startListening();
}

function startListening() {
    try {
        isListening = true;
        recognition.start();
        document.querySelector('.bars').style.opacity = 1;
    } catch (e) {
        // Ignore if already started
    }
}

function stopListening() {
    isListening = false;
    recognition.stop();
    document.querySelector('.bars').style.opacity = 0.3;
}

// Handlers
btnLogin.addEventListener('click', attemptLogin);
btnRegister.addEventListener('click', attemptRegister);

let isLoggingIn = false;

async function attemptLogin() {
    if (isLoggingIn) return;

    if (!modelsLoaded) {
        speak("System is initializing. Please wait a moment.");
        return;
    }

    isLoggingIn = true;

    const mobile = mobileInput.value;
    if (!mobile) {
        speak("Please enter your mobile number");
        isLoggingIn = false;
        return;
    }

    // Feedback
    const loginBtn = document.getElementById('btn-login');
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    // 1. Check Face
    // speak("Looking for face..."); 
    // Small delay to allow TTS to start if needed, but better to just run parallel

    try {
        const descriptor = await getFaceDescriptor(video);
        if (!descriptor) {
            speak("Face not detected. Please position yourself clearly.");
            isLoggingIn = false;
            loginBtn.innerHTML = 'Login';
            return;
        }

        // 2. Lookup User
        const res = await axios.post('/api/user-lookup', { mobile });
        const user = res.data;

        // 3. Match Face
        const storedDescriptor = new Float32Array(Object.values(user.faceDescriptor));
        const distance = matchFaces(descriptor, storedDescriptor);

        console.log("Face Distance:", distance);

        if (distance < AUTH_THRESHOLD) {
            // Success
            userProfile = user;
            speak(`Welcome back, ${user.name}`);
            switchSection('DASHBOARD');
        } else {
            speak("Face verification failed. Access denied.");
        }
    } catch (err) {
        speak("User not found or connection error.");
        console.error(err);
    } finally {
        isLoggingIn = false;
        loginBtn.innerHTML = 'Login';
    }
}

async function attemptRegister() {
    const mobile = mobileInput.value;
    if (!modelsLoaded) return speak("System initializing. Please wait.");
    if (!mobile) return speak("Please enter mobile number for registration");

    speak("Registering new user. Hold still.");

    // Check Camera Status
    if (!video.srcObject || !video.srcObject.active) {
        return speak("Camera is not active. Please allow camera access and reload.");
    }

    // Capture Face Image
    const descriptor = await getFaceDescriptor(video);
    if (!descriptor) return speak("Face not detected. Please ensure good lighting and look at the camera.");

    // Draw face to canvas for storage
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const faceImageBase64 = canvas.toDataURL('image/jpeg');

    // Simplify registration for demo: Auto-generate dummy data for name/voice
    const newUser = {
        mobile,
        name: "User " + mobile.slice(-4),
        faceDescriptor: descriptor,
        voiceSampleUrl: "dummy_url",
        faceImageUrl: faceImageBase64 // Actual captured image
    };

    try {
        await axios.post('/api/register', newUser);
        speak("Registration successful. You can now login.");
    } catch (err) {
        console.error(err);
        if (err.response && err.response.data && err.response.data.error) {
            speak("Registration failed. " + err.response.data.error);
        } else {
            speak("Registration failed. Please try again.");
        }
    }
}

// --- View Navigation System (PhonePe Style) ---

function switchSection(section) {
    if (section === 'DASHBOARD') {
        document.getElementById('auth-section').classList.add('hidden');
        document.getElementById('auth-section').classList.remove('active-section');
        document.getElementById('dashboard-section').classList.remove('hidden-section');

        // Ensure Home View is active
        backToHome();

        // TEST DATA: Set Default Balance for Demo (Hidden initially)
        // document.getElementById('balance-display').innerText = "10000.00"; 
        // We let it stay as "••••••" until checked

        document.getElementById('user-greeting').innerText = `Hello, ${userProfile ? userProfile.name : 'User'}`;
        startContinuousAuth();
    } else {
        document.getElementById('dashboard-section').classList.add('hidden-section');
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('auth-section').classList.add('active-section');
        clearInterval(continuousAuthInterval);
    }
}

function checkBalance() {
    const balEl = document.getElementById('balance-display');
    const statusEl = document.getElementById('balance-status');
    const icon = document.getElementById('balance-toggle-icon');

    if (balEl.innerText.includes("•")) {
        // Authenticate (Simulated)
        speak("Verifying security for balance check.");
        statusEl.innerText = "Verifying...";

        setTimeout(() => {
            balEl.innerText = "$10,000.00";
            statusEl.innerText = "Updated just now";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
            speak("Your balance is 10000 dollars.");
        }, 1000);
    } else {
        // Hide
        balEl.innerText = "••••••";
        statusEl.innerText = "Tap eye to view";
        icon.classList.add('fa-eye');
        icon.classList.remove('fa-eye-slash');
    }
}

function openTransferView() {
    hideAllViews();
    document.getElementById('transfer-contact-view').classList.remove('hidden');
    speak("Who do you want to transfer to?");
}

function openSelfTransferView() {
    hideAllViews();
    // Re-use amount view but pre-fill generic "Self Account"
    document.getElementById('transfer-amount-view').classList.remove('hidden');
    document.getElementById('pay-name').innerText = "My Bank Account";
    document.getElementById('pay-id').innerText = "**** 1234";
    document.getElementById('pay-avatar').innerText = "Self";

    document.getElementById('pay-amount-input').value = '';
    document.getElementById('pay-amount-input').focus();

    startVideo(document.getElementById('mini-video'));
    speak("Transferring to self. Enter amount.");
}

function selectContact(name, id) {
    hideAllViews();
    document.getElementById('transfer-amount-view').classList.remove('hidden');

    // Update UI with Contact Info
    document.getElementById('pay-name').innerText = name;
    document.getElementById('pay-id').innerText = id;
    document.getElementById('pay-avatar').innerText = name.charAt(0);

    // Stash ID for logic
    document.getElementById('transfer-amount-view').setAttribute('data-receiver-id', id);
    document.getElementById('pay-amount-input').value = ''; // Reset
    document.getElementById('pay-amount-input').focus();

    // Start Mini Camera for seamless auth
    startVideo(document.getElementById('mini-video'));
    speak(`Sending to ${name}. Enter amount.`);
}

// PIN Logic
let currentPin = "";

async function verifyAndPay() {
    const amount = document.getElementById('pay-amount-input').value;
    if (!amount) return speak("Please enter an amount.");

    const miniVideo = document.getElementById('mini-video');
    const btn = document.querySelector('.btn-pay');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying Face...';
    speak("Verifying face identity.");

    try {
        const descriptor = await getFaceDescriptor(miniVideo);
        if (!descriptor) {
            btn.innerHTML = originalText;
            return speak("Face not visible. Transaction blocked.");
        }

        // STRICT SECURITY CHECK
        // Compare current face with logged-in user's face
        if (userProfile && userProfile.faceDescriptor) {
            const storedDescriptor = new Float32Array(Object.values(userProfile.faceDescriptor));
            const distance = matchFaces(descriptor, storedDescriptor);

            console.log("Security Distance:", distance);

            if (distance > AUTH_THRESHOLD) { // Threshold 0.55
                btn.innerHTML = originalText;
                speak("Face mismatch. Only the account holder can transfer money.");
                return;
            }
        }

        // Face verified -> Proceed to PIN
        btn.innerHTML = originalText;
        speak("Face verified. Please enter UPI PIN.");
        openPinOverlay(amount);

    } catch (e) {
        console.error(e);
        btn.innerHTML = originalText;
        speak("Security check failed. Please try again.");
    }
}

function openPinOverlay(amount) {
    document.getElementById('upi-pin-overlay').classList.remove('hidden');
    document.getElementById('pin-amount-display').innerText = amount;
    currentPin = "";
    updatePinUI();
}

function closePinOverlay() {
    document.getElementById('upi-pin-overlay').classList.add('hidden');
    currentPin = "";
}

function enterPin(digit) {
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinUI();
    }
}

function clearPin() {
    currentPin = currentPin.slice(0, -1);
    updatePinUI();
}

function updatePinUI() {
    for (let i = 1; i <= 4; i++) {
        const dot = document.getElementById(`dot-${i}`);
        if (i <= currentPin.length) {
            dot.classList.add('filled');
        } else {
            dot.classList.remove('filled');
        }
    }
}

function submitPin() {
    if (currentPin.length !== 4) return speak("Please enter 4 digits.");

    // DEMO PIN Verification (For now, accept '1234')
    if (currentPin === '1234') {
        const amount = document.getElementById('pin-amount-display').innerText;
        closePinOverlay();
        showSuccessScreen(amount);
    } else {
        speak("Incorrect PIN. Please try again.");
        currentPin = "";
        updatePinUI();
    }
}

function showSuccessScreen(amount) {
    hideAllViews();
    document.getElementById('success-view').classList.remove('hidden');
    document.getElementById('success-amount').innerText = `$${amount}`;

    speak(`Payment of ${amount} dollars successful.`);

    // Auto-Update Balance
    const balEl = document.getElementById('balance-display');
    const newBal = parseFloat(balEl.innerText) - parseFloat(amount);
    balEl.innerText = newBal.toFixed(2);
}

function backToHome() {
    hideAllViews();
    document.getElementById('dashboard-home').classList.remove('hidden');
    // Stop any bg videos
    stopMiniVideo('mini-video');
}

function hideAllViews() {
    const views = ['dashboard-home', 'transfer-contact-view', 'transfer-amount-view', 'success-view', 'history-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
}

function openHistoryView() {
    hideAllViews();
    document.getElementById('history-view').classList.remove('hidden');
    populateHistory(); // Reuse existing function
}

// Transaction Context
let currentTransactionType = 'TRANSFER'; // TRANSFER or BILL

async function verifyAndPayBill() {
    const amount = document.getElementById('bill-amount-input').value;
    const consumerId = document.getElementById('bill-consumer-id').value;

    if (!consumerId) return speak("Please enter consumer ID.");
    if (!amount) return speak("Please enter bill amount.");

    currentTransactionType = 'BILL';
    const miniVideo = document.getElementById('bill-mini-video');
    const btn = document.querySelector('#bill-pay-view .btn-pay');

    // Save original text to restore if failed
    const originalText = btn ? btn.innerHTML : "Pay Bill";
    if (btn) btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';

    speak("Verifying face for bill payment.");

    try {
        const descriptor = await getFaceDescriptor(miniVideo);
        if (!descriptor) {
            if (btn) btn.innerHTML = originalText;
            return speak("Face not visible. Transaction blocked.");
        }

        // STRICT SECURITY CHECK
        if (userProfile && userProfile.faceDescriptor) {
            const storedDescriptor = new Float32Array(Object.values(userProfile.faceDescriptor));
            const distance = matchFaces(descriptor, storedDescriptor);
            if (distance > AUTH_THRESHOLD) {
                if (btn) btn.innerHTML = originalText;
                speak("Face mismatch. Authorization failed.");
                return;
            }
        }

        // Verified
        if (btn) btn.innerHTML = originalText;
        speak("Verified. Enter UPI PIN.");
        openPinOverlay(amount);

    } catch (e) {
        console.error(e);
        if (btn) btn.innerHTML = originalText;
        speak("Security check failed.");
    }
}

function openBillView(type) {
    hideAllViews();
    document.getElementById('bill-pay-view').classList.remove('hidden');

    // Setup UI
    document.getElementById('bill-type-label').innerText = type + " Bill";
    document.getElementById('bill-consumer-id').value = '';
    document.getElementById('bill-amount-input').value = '';

    // Set Icon
    const iconEl = document.querySelector('#bill-icon i');
    iconEl.className = 'fa-solid'; // Reset
    if (type === 'Mobile') iconEl.classList.add('fa-mobile-screen');
    else if (type === 'Electricity') iconEl.classList.add('fa-lightbulb');
    else if (type === 'DTH') iconEl.classList.add('fa-tv');
    else if (type === 'Credit Card') iconEl.classList.add('fa-credit-card');
    else iconEl.classList.add('fa-file-invoice-dollar');

    speak(`Paying ${type} bill. Enter details.`);

    // Start Camera
    startVideo(document.getElementById('bill-mini-video'));
}

// ... existing code ...

function submitPin() {
    if (currentPin.length !== 4) return speak("Please enter 4 digits.");

    if (currentPin === '1234') {
        const amount = document.getElementById('pin-amount-display').innerText;
        closePinOverlay();

        if (currentTransactionType === 'BILL') {
            showSuccessScreen(amount, "Bill Paid Successfully");
        } else {
            showSuccessScreen(amount, "Paid to Receiver");
        }

    } else {
        speak("Incorrect PIN. Please try again.");
        currentPin = "";
        updatePinUI();
    }
}

function showSuccessScreen(amount, msg = "Payment Successful") {
    hideAllViews();
    document.getElementById('success-view').classList.remove('hidden');
    document.getElementById('success-amount').innerText = `$${amount}`;
    document.getElementById('success-msg') ? document.getElementById('success-msg').innerText = msg : null;

    speak(`Payment of ${amount} dollars successful.`);

    // Auto-Update Balance
    const balEl = document.getElementById('balance-display');
    // Simple parse (assuming no commas for demo simplicity)
    let currentBal = parseFloat(balEl.innerText) || 0;
    if (balEl.innerText.includes("•")) currentBal = 10000.00;

    const newBal = currentBal - parseFloat(amount);
    if (!balEl.innerText.includes("•")) {
        balEl.innerText = newBal.toFixed(2);
    }
}

// ... existing code ...

// Chatbot / Voice Commands
async function handleVoiceCommand(cmd) {
    console.log("DEBUG: handleVoiceCommand:", cmd); // DEBUG LOG
    console.log("DEBUG: Checking TRANSFER:", checkCommand(cmd, 'TRANSFER')); // DEBUG LOG
    console.log("DEBUG: Checking BILL:", checkCommand(cmd, 'BILL')); // DEBUG LOG

    // Continuous Auth Check
    if (userProfile && !cmd.includes('help')) {
        const descriptor = await getFaceDescriptor(video);
        if (!descriptor) {
            speak("I cannot see you. Please step in front of the camera.");
            return;
        }
    }

    const chatHistory = document.getElementById('chat-history');

    // Logic
    if (checkCommand(cmd, 'TRANSFER')) {
        speak("Opening transfer window.");
        openTransferView();
    } else if (checkCommand(cmd, 'BILL')) {
        // If saying 'pay' inside a view, treat as confirm
        if (!document.getElementById('transfer-amount-view').classList.contains('hidden')) {
            verifyAndPay();
            return;
        }
        if (!document.getElementById('bill-pay-view').classList.contains('hidden')) {
            verifyAndPayBill();
            return;
        }

        speak("Opening Bill Payment.");

        let type = 'Generic';
        if (cmd.includes('electricity') || cmd.includes('current')) type = 'Electricity';
        else if (cmd.includes('water')) type = 'Water';
        else if (cmd.includes('gas')) type = 'Gas';
        else if (cmd.includes('net') || cmd.includes('wifi')) type = 'Internet';
        else if (cmd.includes('dth') || cmd.includes('tv')) type = 'DTH';

        openBillView(type);

    } else if (checkCommand(cmd, 'BALANCE')) {
        checkBalance();
    } else if (checkCommand(cmd, 'LOGOUT')) {
        speak("Logging out");
        logout();
    } else if (cmd.includes('hello') || cmd.includes('hi')) {
        speak("Hello. I am your banking assistant.");
    } else if (checkCommand(cmd, 'CONFIRM')) {
        // Context Sensitive Actions
        if (!document.getElementById('transfer-amount-view').classList.contains('hidden')) {
            verifyAndPay();
        } else if (!document.getElementById('bill-pay-view').classList.contains('hidden')) {
            verifyAndPayBill();
        } else if (!document.getElementById('upi-pin-overlay').classList.contains('hidden')) {
            submitPin();
        }
    } else {
        // Fallback to Chatbot
        processChatCommand(cmd);
    }
}

async function processChatCommand(msg) {
    const history = document.getElementById('chat-history');

    // Display User Message
    const userDiv = document.createElement('div');
    userDiv.className = 'chat-msg user';
    userDiv.innerText = msg;
    userDiv.style.textAlign = 'right';
    userDiv.style.color = 'var(--primary)';
    userDiv.style.marginBottom = '10px';
    history.appendChild(userDiv);
    history.scrollTop = history.scrollHeight;

    try {
        const res = await axios.post('/api/chat', { message: msg });
        const reply = res.data.reply;

        // Display Bot Message
        const botDiv = document.createElement('div');
        botDiv.className = 'chat-msg bot';
        botDiv.innerText = reply;
        botDiv.style.textAlign = 'left';
        botDiv.style.color = 'var(--text-main)';
        botDiv.style.marginBottom = '10px';
        history.appendChild(botDiv);
        history.scrollTop = history.scrollHeight;

        speak(reply);

    } catch (e) {
        console.error(e);
        speak("I am currently offline.");
    }
}

// Ensure verifyAndPay sets context
const originalVerifyAndPay = verifyAndPay;
verifyAndPay = async function () {
    currentTransactionType = 'TRANSFER';
    await originalVerifyAndPay();
}

function logout() {
    userProfile = null;
    switchSection('LOGIN');
    location.reload();
}

function startContinuousAuth() {
    continuousAuthInterval = setInterval(async () => {
        // Continuous auth stub
    }, 5000);
}

