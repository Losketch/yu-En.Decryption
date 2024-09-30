// 定义需要加密的 Unicode 区段
const unicodeRanges = [
    { start: 0x4E00, end: 0x9FFF }, // CJK Unified Ideographs (中日韩统一表意文字)
    { start: 0x3400, end: 0x4DBF }, // CJK Unified Ideographs Extension A
    // 添加更多的区段可以继续扩展
];

function isInRange(codePoint) {
    return unicodeRanges.some(range => codePoint >= range.start && codePoint <= range.end);
}

function encrypt() {
    const inputText = document.getElementById('inputText').value;

    const encryptedText = Array.from(inputText).map(char => {
        const codePoint = char.codePointAt(0);

        if (isInRange(codePoint)) {
            // 拼接 U+ 替换为 \u30e6\u200b
            let result = '\u30e6\u200b';
            
            const hexCodePoint = codePoint.toString(16).toUpperCase();
            for (let hexChar of hexCodePoint) {
                const hexValue = (parseInt(hexChar, 16) + 0xFE00); // 0-15映射到 \ufe00-\ufe0F
                result += String.fromCharCode(hexValue);
            }

            return result;
        }

        // 如果不在范围内，返回原字符
        return char;
    }).join('');

    document.getElementById('encryptedText').value = encryptedText;
    autoResize(document.getElementById('encryptedText')); // 调整加密后的 textarea 高度
}

function decrypt() {
    const encryptedText = document.getElementById('encryptedText').value;
    let decryptedText = '';
    let i = 0;

    while (i < encryptedText.length) {
        if (encryptedText.slice(i, i + 2) === '\u30e6\u200b') {
            // 找到加密片段
            let codePoint = '';
            i += 2; // 跳过分隔符

            // 解析接下来的4个字符
            for (let j = 0; j < 4; j++) {
                const charCode = encryptedText.charCodeAt(i + j);
                if (charCode >= 0xFE00 && charCode <= 0xFE0F) {
                    const hexValue = charCode - 0xFE00;
                    codePoint += hexValue.toString(16).toUpperCase();
                }
            }

            if (codePoint) {
                const charCode = parseInt(codePoint, 16);
                decryptedText += String.fromCodePoint(charCode);
            }

            i += 4; // 跳过4个异体选择符
        } else {
            // 非加密字符，直接添加
            decryptedText += encryptedText[i];
            i++;
        }
    }

    document.getElementById('inputText').value = decryptedText;
    autoResize(document.getElementById('inputText')); // 调整解密后的 textarea 高度
}



function copyToClipboard(textAreaId) {
    const textArea = document.getElementById(textAreaId);
    textArea.select();
    document.execCommand('copy'); // 复制文本
    alert('已复制到剪贴板');
}

function autoResize(textArea) {
    textArea.style.height = 'auto'; // 重置高度
    textArea.style.height = textArea.scrollHeight + 'px'; // 设置为滚动高度
}