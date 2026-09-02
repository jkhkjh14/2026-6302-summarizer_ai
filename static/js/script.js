let lastSummary = '';

// ----- Получение процента сжатия -----
function getCompressionPercent() {
    const range = document.getElementById('compressionRange');
    return parseInt(range.value);
}

// ----- Обновление отображения процента и подписи -----
function updatePercentDisplay() {
    const percent = getCompressionPercent();
    document.getElementById('percentDisplay').textContent = percent + '%';
    
    // Показываем (оставить ~X слов) только если есть текст
    const text = document.getElementById('inputText').value.trim();
    const hintEl = document.getElementById('targetWordsHint');
    if (text) {
        const words = text.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu);
        const wordCount = words ? words.length : 0;
        const targetWords = Math.round(wordCount * percent / 100);
        hintEl.textContent = `(оставить ~${targetWords} слов)`;
    } else {
        hintEl.textContent = '';
    }
}

// ----- Счётчик символов и слов -----
document.getElementById('inputText').addEventListener('input', function() {
    const text = this.value;
    const charCount = text.length;
    const words = text.match(/[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu);
    const wordCount = words ? words.length : 0;
    document.getElementById('charCount').textContent = `Символов: ${charCount}`;
    document.getElementById('wordCount').textContent = `Слов: ${wordCount}`;
    updatePercentDisplay();
});

// ----- Синхронизация ползунка и отображения -----
document.getElementById('compressionRange').addEventListener('input', function() {
    updatePercentDisplay();
});

// ----- Кнопки быстрых процентов -----
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const val = parseInt(this.dataset.percent);
        document.getElementById('compressionRange').value = val;
        updatePercentDisplay();
    });
});

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    updatePercentDisplay();
});

// ----- Функция отображения загрузки -----
function showLoading() {
    return `
        <div class="text-center my-4">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Загрузка...</span>
            </div>
            <p class="mt-2 text-muted">Идёт обработка текста, это может занять несколько секунд...</p>
        </div>
    `;
}

// ----- Функция копирования текста -----
function copySummary() {
    const textElement = document.getElementById('summaryText');
    if (!textElement) return;
    const text = textElement.textContent;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('.btn-light');
        if (btn) {
            const original = btn.innerHTML;
            btn.innerHTML = '✅ Скопировано!';
            setTimeout(() => { btn.innerHTML = original; }, 2000);
        }
    }).catch(() => {
        alert('Не удалось скопировать текст');
    });
}

// ----- Функция очистки всех полей -----
function clearAll() {
    document.getElementById('inputText').value = '';
    document.getElementById('inputUrl').value = '';
    document.getElementById('fileInput').value = '';
    document.getElementById('result').innerHTML = '';
    document.getElementById('downloadSection').style.display = 'none';
    const event = new Event('input');
    document.getElementById('inputText').dispatchEvent(event);
    updatePercentDisplay();
}

document.getElementById('clearAllBtn').addEventListener('click', clearAll);

// ----- Общая функция отображения результата -----
function displayResult(data) {
    const resultDiv = document.getElementById('result');
    if (data.error) {
        resultDiv.innerHTML = `<div class="alert alert-danger">${data.error}</div>`;
        document.getElementById('downloadSection').style.display = 'none';
        return;
    }

    let paramInfo = '';
    if (data.desired_words) {
        paramInfo = `| Желаемое кол-во слов: ${data.desired_words}`;
    }
    if (data.compression_percent) {
        paramInfo += ` (${data.compression_percent}% от оригинала)`;
    }
    if (data.max_tokens_used) {
        paramInfo += ` | Токенов: ${data.max_tokens_used}`;
    }

    resultDiv.innerHTML = `
        <div class="card border-success mt-3">
            <div class="card-header bg-success text-white d-flex justify-content-between align-items-center">
                <span>Результат</span>
                <div>
                    <button class="btn btn-sm btn-light me-2" onclick="copySummary()">📋 Копировать</button>
                    <span class="badge bg-light text-dark">Сжатие: ${data.compression}%</span>
                </div>
            </div>
            <div class="card-body">
                <h6>Краткое изложение:</h6>
                <p class="fw-bold" id="summaryText">${data.summary}</p>
                <hr>
                <small class="text-muted">
                    Было слов: ${data.original_words} → Стало: ${data.summary_words}
                    ${paramInfo}
                </small>
            </div>
        </div>
    `;
    lastSummary = data.summary;
    document.getElementById('downloadSection').style.display = 'block';
}

// ----- Обработка текста -----
document.getElementById('summarizeTextBtn').addEventListener('click', function() {
    const text = document.getElementById('inputText').value.trim();
    if (!text) {
        alert('Введите текст');
        return;
    }
    const compressionPercent = getCompressionPercent();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = showLoading();
    fetch('/summarize_text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            text: text,
            compression_percent: compressionPercent
        })
    })
    .then(response => response.json())
    .then(data => displayResult(data))
    .catch(error => resultDiv.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`);
});

// ----- Обработка URL -----
document.getElementById('summarizeUrlBtn').addEventListener('click', function() {
    const url = document.getElementById('inputUrl').value.trim();
    if (!url) {
        alert('Введите URL');
        return;
    }
    const compressionPercent = getCompressionPercent();
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = showLoading();
    fetch('/summarize_url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            url: url,
            compression_percent: compressionPercent
        })
    })
    .then(response => response.json())
    .then(data => displayResult(data))
    .catch(error => resultDiv.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`);
});

// ----- Обработка файла -----
document.getElementById('summarizeFileBtn').addEventListener('click', function() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    if (!file) {
        alert('Выберите файл');
        return;
    }
    const compressionPercent = getCompressionPercent();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('compression_percent', compressionPercent);
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = showLoading();
    fetch('/summarize_file', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => displayResult(data))
    .catch(error => resultDiv.innerHTML = `<div class="alert alert-danger">Ошибка: ${error.message}</div>`);
});

// ----- Скачивание .txt -----
document.getElementById('downloadTxtBtn').addEventListener('click', function() {
    if (!lastSummary) return;
    fetch('/download_txt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: lastSummary })
    })
    .then(response => response.blob())
    .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'summary.txt';
        link.click();
    });
});

// ----- Скачивание .docx -----
document.getElementById('downloadDocxBtn').addEventListener('click', function() {
    if (!lastSummary) return;
    fetch('/download_docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary: lastSummary })
    })
    .then(response => response.blob())
    .then(blob => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'summary.docx';
        link.click();
    });
});

// ----- ТЁМНАЯ ТЕМА -----
(function() {
    const themeToggle = document.getElementById('themeToggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '☀️ Светлая';
    }

    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-theme');
        const isDark = document.body.classList.contains('dark-theme');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.textContent = isDark ? '☀️ Светлая' : '🌙 Тёмная';
    });
})();