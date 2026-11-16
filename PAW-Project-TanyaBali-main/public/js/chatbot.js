const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const messages = document.getElementById('messages');

function addMessage(text, role, source) {
  const element = document.createElement('div');
  element.className = `message ${role}`;
  element.textContent = text;

  if (source) {
    const meta = document.createElement('small');
    meta.textContent = `Sumber: ${source}`;
    element.appendChild(meta);
  }
  
  messages.appendChild(element);
  messages.scrollTop = messages.scrollHeight;
  return element;
}

async function send(text) {
  const question = (text || input.value).trim();
  if (!question) return;

  addMessage(question, 'user');
  input.value = '';
  input.disabled = true;
  const pending = addMessage('Sedang mencari informasi...', 'bot');

  try {
    const response = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: question })
    });

    const data = await response.json();
    pending.remove();
    if (!response.ok) throw new Error(data.message || 'Permintaan gagal');
    addMessage(data.answer, 'bot', data.source);
  } catch (error) {
    pending.textContent = error.message || 'Terjadi kesalahan. Coba lagi.';
  } finally {
    input.disabled = false;
    input.focus();
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  send(input.value);
});

document.querySelectorAll('.suggestion').forEach((button) => {
  button.addEventListener('click', () => send(button.textContent));
});
