const chatArea = document.getElementById('chat-area');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const stopButton = document.getElementById('stop-button');
const historyList = document.getElementById('history-list');
const newChatButton = document.getElementById('new-chat-button');
const body = document.body;

let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
let currentChat = [];
let intervalId = 0; // Declare intervalId outside the sendMessage function

// Function to display a message
function displayMessage(message, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message');
    messageDiv.classList.add(sender + '-message');

    const icon = document.createElement('span');
    icon.textContent = sender === 'user' ? '👤' : '🤖';
    icon.classList.add('message-icon');
    messageDiv.appendChild(icon);

   let content;
    if (message.startsWith('```') && message.endsWith('```')) {
        const code = message.substring(3, message.length - 3);
        content = document.createElement('textarea');
        content.value = code;
        content.rows = 5;
        content.cols = 50;
        content.classList.add('code-box');
    }
     else {
        content = document.createElement('span');
        content.textContent = message;
    }

    messageDiv.appendChild(content);
    chatArea.appendChild(messageDiv);
    chatArea.scrollTop = chatArea.scrollHeight; // Scroll to bottom
}

// Function to send a message to Gemini API
async function sendMessage(message) {
    displayMessage(message, 'user');

    const geminiApiKey = 'AIzaSyCsjL5tYyY_TX72YWE_hkjn1_DBlhmO0aw'; // Replace with your actual API key
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-001:generateContent?key=${geminiApiKey}`;

    let conversationHistory = "";
    for (let i = 0; i < currentChat.length; i++) {
        conversationHistory += currentChat[i].sender + ": " + currentChat[i].text + "\n";
    }

    const role = document.getElementById('role-input').value;
    const prompt = role ? `You are a chatbot with the following role: ${role}. Please answer the user's question in a clear, concise, and factual manner. If you are unsure of the answer, please respond with 'I'm sorry, I don't know the answer to that question.'\n\n` : "You are a helpful and informative chatbot designed to answer questions about a variety of topics. Please answer the user's question in a clear, concise, and factual manner. If you are unsure of the answer, please respond with 'I'm sorry, I don't know the answer to that question.'\n\n";

    try {
        displayMessage("دارم فکر میکنم صبر کن...", 'bot');
        chatArea.scrollTop = chatArea.scrollHeight;

        const response = await fetch(geminiApiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt + conversationHistory + "user: " + message }] }]
            })
        });

        const data = await response.json();
       let botResponse = data.candidates[0].content.parts[0].text;

        // Robust code detection
        const codeKeywords = ["function", "const", "let", "class", "import", "export", "if", "else", "for", "while", "return"];
        const hasCodeKeywords = codeKeywords.some(keyword => botResponse.includes(keyword));
        const hasMultiLineString = botResponse.includes("\\n");
        const hasCodeComments = botResponse.includes("//") || botResponse.includes("/*");
        const hasCodeDelimiters = botResponse.startsWith("```") && botResponse.endsWith("```");

        let isCode = hasCodeKeywords || hasMultiLineString || hasCodeComments || hasCodeDelimiters;

        if (isCode && !hasCodeDelimiters) {
            botResponse = "```javascript\n" + botResponse + "\n```";
        }

        let i = 0;
        intervalId = setInterval(() => {
            if (i < botResponse.length) {
                // Replace the "thinking" message with the streaming response
                chatArea.lastChild.querySelector('.message-icon').textContent = '🤖'; // Restore the robot icon
                chatArea.lastChild.querySelector('span:nth-child(2)').textContent = botResponse.substring(0, i + 1);
                chatArea.scrollTop = chatArea.scrollHeight;
                i++;
            } else {
                clearInterval(intervalId);
                currentChat.push({ text: botResponse, sender: 'bot' });
            }
        }, 20); // Adjust the interval to control the typing speed

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        displayMessage("Error: Could not get response from the bot.", 'bot');
        chatArea.scrollTop = chatArea.scrollHeight;
    }
}

// Function to add a chat to history
function addChatToHistory() {
    if (currentChat.length > 0) {
        const now = new Date();
        const dateTimeString = now.toLocaleString('fa-IR');
        const chatTitle = currentChat[0].text.substring(0, 20) + "..."; // Use first message as title
        const historyItem = document.createElement('li');
        historyItem.textContent = chatTitle + " - " + dateTimeString;
        historyItem.addEventListener('click', () => {
            loadChat(parseInt(historyItem.dataset.index));
        });
        historyList.appendChild(historyItem);
        historyItem.dataset.index = chatHistory.length;
        chatHistory.push([...currentChat]);
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }
}

// Function to load a chat from history
function loadChat(index) {
    chatArea.innerHTML = ''; // Clear current chat
    let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];
    const chat = chatHistory[index];
    chat.forEach(message => {
        displayMessage(message.text, message.sender);
    });
}

// Stop button event listener
stopButton.addEventListener('click', () => {
    clearInterval(intervalId);
});

// Send button event listener
sendButton.addEventListener('click', () => {
    let message = messageInput.value;
    if (message) {
        if (message.length > 200) {
            message = message.substring(0, 200);
            alert("Message limited to 200 characters.");
        }
        sendMessage(message);
        messageInput.value = '';
        currentChat.push({text: message, sender: 'user'});
    }
});

document.getElementById('help-button').addEventListener('click', function() {
    const helpText = `به این هوش مصنوعی شوینکا خوش آمدید! این ربات با توانایی منحصر به فرد خود، می‌تواند نقش‌های مختلفی را بر عهده بگیرد و به شما در زمینه‌های گوناگون یاری رساند.

ویژگی‌های کلیدی

قابلیت تعیین نقش: شما می‌توانید به ربات بگویید که چه نقشی را ایفا کند. برای مثال، می‌توانید از او بخواهید که به عنوان یک نویسنده، مترجم، مشاور، معلم، یا حتی یک شخصیت خیالی پاسخ دهد.

پاسخ‌های متناسب: ربات با توجه به نقشی که به او محول می‌کنید، پاسخ‌های متناسب و مرتبط ارائه می‌دهد.

تعامل پویا: می‌توانید با ربات به صورت تعاملی گفتگو کنید و از او بخواهید که در زمینه‌های مختلف به شما کمک کند.

نحوه استفاده

تعیین نقش: قبل از شروع گفتگو، نقش مورد نظر خود را به ربات اعلام کنید. برای مثال، می‌توانید بگویید: "شما اکنون یک نویسنده خلاق هستید" یا "شما یک مشاور مالی هستید".

طرح سوال یا درخواست: پس از تعیین نقش، سوال یا درخواست خود را مطرح کنید.

دریافت پاسخ: ربات با توجه به نقش و درخواست شما، پاسخ مناسب را ارائه می‌دهد.

ادامه گفتگو: می‌توانید با ربات به صورت تعاملی گفتگو کنید و سوالات یا درخواست‌های بیشتری مطرح کنید.

مثال‌ها

نقش: معلم ریاضی

شما: "شما یک معلم ریاضی هستید. معادله x + 5 = 10 را حل کنید."

ربات: "برای حل این معادله، باید 5 را از هر دو طرف کم کنیم. بنابراین، x = 5."

نقش: نویسنده داستان

شما: "شما یک نویسنده داستان هستید. شروع یک داستان کوتاه در مورد یک گربه سخنگو را بنویسید."

ربات: "در یک شب تاریک و بارانی، گربه‌ای سیاه و سفید به نام میلو در خیابان‌های شهر قدم می‌زد. ناگهان، صدایی از درون سطل زباله شنید..."

نقش: مترجم

شما: "شما یک مترجم هستید. عبارت "Hello, how are you?" را به فارسی ترجمه کنید."

ربات: "سلام، حال شما چطور است؟"

نکات مهم

هرچه نقش دقیق‌تر و واضح‌تر تعیین شود، پاسخ‌های ربات مرتبط‌تر و مفیدتر خواهند بود.

می‌توانید در طول گفتگو، نقش ربات را تغییر دهید.

ربات در حال یادگیری و بهبود است، بنابراین ممکن است در برخی موارد پاسخ‌های کامل یا دقیق ارائه ندهد.

امیدواریم از این هوش مصنوعی متنی با قابلیت تعیین نقش، لذت ببرید و از آن در زمینه‌های مختلف بهره‌مند شوید.

این هوش مصنوعی رایگان توسط سلمان حسین پور ساخته شده و از api گوگل gemini استفاده میکنه و این هوش مصنوعی برای همگان و عموم رایگان است 1403`;
    alert(helpText);
});

// New  hat bNtton wve c uisttnor
newChatButton.addEventListener('click', () => {
    addChatToHistory();
    currentChat = [];
    displayMessage("شروع یک گفتگوی جدید...", 'bot');
});

// Function to display Suggested Prompts
function displaySuggestedPrompts() {
    const suggestedPrompts = `
        <div class="suggested-prompts">
            <div class="prompt-card">
                <h3>تخلق</h3>
                <p>جرقه بزنید به تخیل خود</p>
                <p>داستان کوتاه در مورد سفر به فضا بنویسید</p>
            </div>
            <div class="prompt-card">
                <h3>حل مسئله</h3>
                <p>جرقه بزنید به تخیل خود</p>
                <p>چگونه ترافیک شهری را کاهش دهیم؟</p>
            </div>
            <div class="prompt-card">
                <h3>یادگیری</h3>
                <p>دانش خود را گسترش دهید</p>
                <p>فهرست HTML چیست؟</p>
            </div>
        </div>
    `;
    chatArea.innerHTML = suggestedPrompts;
}

// Call displaySuggestedPrompts when the page loads
displaySuggestedPrompts();

// Clear suggested prompts when the user starts typing
messageInput.addEventListener('input', () => {
    if (chatArea.querySelector('.suggested-prompts')) {
        chatArea.innerHTML = '';
    }
});

// Send message on Enter key press
messageInput.addEventListener('keypress', function(event) {
  if (event.key === "Enter") {
   event.preventDefault();
    sendButton.click();
  }
});


// Dark/Light mode toggle// Dark/Light mode toggle
const darkModeToggle = document.getElementById('dark-mode-toggle');

darkModeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
});
