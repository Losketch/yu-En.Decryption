const unicodeRanges = [
  { start: 0x4E00, end: 0x9FFF },
  { start: 0x3400, end: 0x4DBF },
];

const isInRange = codePoint => unicodeRanges.some(range => codePoint >= range.start && codePoint <= range.end);

const encrypt = () => {
  const inputText = document.getElementById('inputText').value;
  const encryptedText = Array.from(inputText).map(char => {
    const codePoint = char.codePointAt(0);
    if (!isInRange(codePoint)) return char;
    
    const hexCodePoint = codePoint.toString(16).toUpperCase();
    return '\u30e6\u200d' + hexCodePoint.split('').map(hexChar => 
      String.fromCharCode(parseInt(hexChar, 16) + 0xFE00)
    ).join('');
  }).join('');

  document.getElementById('encryptedText').value = encryptedText;
  autoResize(document.getElementById('encryptedText'));
};

const decrypt = () => {
  const encryptedText = document.getElementById('encryptedText').value;
  let decryptedText = '';
  let i = 0;

  while (i < encryptedText.length) {
    if (encryptedText.slice(i, i + 2) === '\u30e6\u200d') {
      const codePoint = encryptedText.slice(i + 2, i + 6)
        .split('')
        .map(char => (char.charCodeAt(0) - 0xFE00).toString(16))
        .join('');
      decryptedText += String.fromCodePoint(parseInt(codePoint, 16));
      i += 6;
    } else {
      decryptedText += encryptedText[i++];
    }
  }

  document.getElementById('inputText').value = decryptedText;
  autoResize(document.getElementById('inputText'));
};

const autoResize = textArea => {
  textArea.style.height = 'auto';
  textArea.style.height = textArea.scrollHeight + 'px';
};





const encryptedText = document.getElementById('encryptedText');
const inputText = document.getElementById('inputText');
const prompt = document.getElementById('prompt');

async function copyContent() {
  const text = encryptedText.value;
  if (!text) {
    prompt.textContent = '请先输入要复制的文本';
    return;
  }

  prompt.textContent = '正在尝试复制...';
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      prompt.textContent = '复制成功！';
    } else if (document.execCommand) {
      // 备用方法：使用已弃用但仍广泛支持的 execCommand
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      prompt.textContent = '使用备用方法复制成功！';
    } else {
        throw new Error('无法使用自动复制方法');
    }
  } catch (err) {
    console.error('复制失败：', err);
    prompt.textContent = '复制失败，请手动复制。';
    alert('请手动选择文本并使用Ctrl+C（或Command+C）复制。');
  }
}

async function pasteContent() {
  prompt.textContent = '正在尝试粘贴...';
  try {
    if (navigator.clipboard && navigator.clipboard.readText) {
      const text = await navigator.clipboard.readText();
      inputText.textContent = text;
      prompt.textContent = '粘贴成功！';
    } else if (document.execCommand) {
      inputText.focus();
      if (document.execCommand('paste')) {
          prompt.textContent = '使用备用方法粘贴成功！';
      } else {
          throw new Error('无法使用自动粘贴方法');
      }
    } else {
      throw new Error('不支持自动粘贴');
    }
  } catch (err) {
    console.error('粘贴失败：', err);
    prompt.textContent = '自动粘贴失败，请手动粘贴。';
    alert('请使用Ctrl+V（或Command+V）手动粘贴到输出框。');
  }
}

// 检查剪贴板权限
async function checkClipboardPermission() {
  if (navigator.permissions && navigator.permissions.query) {
    try {
      const writeResult = await navigator.permissions.query({name: 'clipboard-write'});
      const readResult = await navigator.permissions.query({name: 'clipboard-read'});

      const updateprompt = () => {
          prompt.textContent = `剪贴板权限： 写入-${writeResult.state}, 读取-${readResult.state}`;
      };

      writeResult.onchange = updateprompt;
      readResult.onchange = updateprompt;
      updateprompt();
    } catch (err) {
      console.warn('无法查询剪贴板权限：', err);
    }
  }
}

// 页面加载时检查权限
checkClipboardPermission();