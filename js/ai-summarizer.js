// ai summarizer - uses google gemini api (free) to summarize/explain/generate questions

document.addEventListener('DOMContentLoaded', () => {
  const textarea = document.getElementById('inputText');
  if (textarea) {
    textarea.addEventListener('input', () => {
      document.getElementById('charCount').textContent = textarea.value.length;
    });
  }
});

async function summarizeNotes() {
  const apiKey = localStorage.getItem('gemini_api_key');
  if (!apiKey) {
    alert('Please add your Gemini API key first on the AI Summarizer page.');
    return;
  }

  const text = document.getElementById('inputText').value.trim();
  const type = document.getElementById('summaryType').value;
  const subject = document.getElementById('summarySubject').value;

  if (!text || text.length < 50) {
    alert('Please paste at least 50 characters of notes to summarize.');
    return;
  }

  // show loading state
  document.getElementById('aiOutput').classList.add('hidden');
  document.getElementById('aiLoading').classList.remove('hidden');
  document.getElementById('copyBtn').style.display = 'none';

  const prompts = {
    summary: `Please summarize the following study notes in a clear, concise way. Focus on the key concepts and main points. Keep it short and easy to understand for a student.`,
    bullets: `Convert the following study notes into clear bullet points. Each bullet should be a key concept or important fact. Make it easy to revise quickly.`,
    questions: `Generate 8-10 important exam questions based on the following study notes. Include a mix of short answer and descriptive questions. These should cover the main topics.`,
    explain: `Explain the following study material in very simple language, as if explaining to someone who is learning this for the first time. Use simple words and examples.`
  };

  const subjectContext = subject ? `\n(Subject: ${subject.replace(/-/g, ' ')})` : '';
  const prompt = `${prompts[type]}${subjectContext}\n\n---NOTES---\n${text}\n---END NOTES---`;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error.message || 'API error');
    }

    const result = data.candidates && data.candidates[0]
      ? data.candidates[0].content.parts[0].text
      : 'No response received.';

    // display result
    document.getElementById('aiLoading').classList.add('hidden');
    const outputEl = document.getElementById('aiOutput');
    outputEl.classList.remove('hidden');
    outputEl.innerHTML = formatOutput(result);

    document.getElementById('copyBtn').style.display = 'block';
    document.getElementById('copyBtn').setAttribute('data-text', result);

  } catch (e) {
    document.getElementById('aiLoading').classList.add('hidden');
    const outputEl = document.getElementById('aiOutput');
    outputEl.classList.remove('hidden');
    outputEl.innerHTML = `<div style="color:var(--danger);background:rgba(239,68,68,0.1);padding:16px;border-radius:8px">
      <strong>❌ Error:</strong> ${e.message}<br><br>
      <small>Make sure your API key is valid. Get one at <a href="https://aistudio.google.com/apikey" target="_blank">aistudio.google.com/apikey</a></small>
    </div>`;
  }
}

// basic markdown to html
function formatOutput(text) {
  let html = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^#{1,3}\s+(.+)$/gm, '<h4 style="color:var(--primary);margin:16px 0 8px">$1</h4>')
    .replace(/^[-•]\s+(.+)$/gm, '<li style="margin:6px 0;padding-left:4px">$1</li>')
    .replace(/^(\d+)\.\s+(.+)$/gm, '<li style="margin:8px 0"><strong>$1.</strong> $2</li>')
    .replace(/\n\n/g, '</p><p style="margin-top:12px">')
    .replace(/\n/g, '<br>');

  html = html.replace(/(<li.*?<\/li>)+/gs, match => `<ul style="list-style:disc;padding-left:20px;margin:8px 0">${match}</ul>`);
  return `<div style="line-height:1.8">${html}</div>`;
}

function copyOutput() {
  const btn = document.getElementById('copyBtn');
  const text = btn.getAttribute('data-text') || document.getElementById('aiOutput').innerText;
  navigator.clipboard.writeText(text).then(() => {
    btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
    setTimeout(() => { btn.innerHTML = '<i class="fas fa-copy"></i> Copy'; }, 2000);
  });
}
