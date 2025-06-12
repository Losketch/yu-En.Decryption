(function() {
	const HEX_LEN = 6;
	const unicodeRanges = [
		[0x4E00, 0x9FFF],
		[0x3400, 0x4DBF],
		[0x20000, 0x40000],
	];
	const padHex = num => num.toString(16).toUpperCase().padStart(HEX_LEN, '0');
	const isTarget = cp => unicodeRanges.some(([s, e]) => cp >= s && cp <= e);

	const tagInput = document.getElementById('tagInput');
	const plainTa = document.getElementById('plain');
	const cipherTa = document.getElementById('cipher');
	const promptEl = document.getElementById('prompt');

	function autoResize(ta) {
		ta.style.height = 'auto';
		ta.style.height = ta.scrollHeight + 'px';
	}
	[plainTa, cipherTa].forEach(ta => {
		ta.addEventListener('input', () => autoResize(ta));
	});

	function parseTag(raw) {
		if (!raw) return null;
		try {
			return raw.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) =>
				String.fromCharCode(parseInt(hex, 16))
			);
		} catch (e) {
			return null;
		}
	}

	function validateInput(text, isEncrypt = true) {
		if (!text.trim()) {
			promptEl.textContent = isEncrypt ? '请输入要加密的文本' : '请输入要解密的密文';
			return false;
		}
		return true;
	}

	function encrypt() {
		const rawTag = tagInput.value.trim();
		const tag = parseTag(rawTag);

		if (!tag) {
			promptEl.textContent = 'TAG 不能为空';
			return;
		}

		if (!validateInput(plainTa.value)) return;

		let out = '';
		for (const ch of Array.from(plainTa.value)) {
			const cp = ch.codePointAt(0);
			if (!isTarget(cp)) {
				out += ch;
			} else {
				const hex = padHex(cp);
				const enc = hex.split('')
					.map(d => String.fromCharCode(0xFE00 + parseInt(d, 16)))
					.join('');
				out += tag + enc;
			}
		}

		cipherTa.value = out;
		autoResize(cipherTa);
		promptEl.textContent = `加密完成，共处理 ${Array.from(plainTa.value).length} 个字符`;
	}

	function decrypt() {
		const rawTag = tagInput.value.trim();
		const tag = parseTag(rawTag);

		if (!tag) {
			promptEl.textContent = 'TAG 不能为空';
			return;
		}

		if (!validateInput(cipherTa.value, false)) return;

		const text = cipherTa.value;
		let i = 0,
			res = '';
		let decryptCount = 0;

		while (i < text.length) {
			if (text.startsWith(tag, i)) {
				const block = text.slice(i + tag.length, i + tag.length + HEX_LEN);
				if (block.length < HEX_LEN) {
					res += text[i++];
				} else {
					try {
						const hex = Array.from(block)
							.map(c => (c.charCodeAt(0) - 0xFE00).toString(16))
							.join('');
						const codePoint = parseInt(hex, 16);

						if (codePoint >= 0 && codePoint <= 0x10FFFF) {
							res += String.fromCodePoint(codePoint);
							decryptCount++;
						} else {
							res += text.slice(i, i + tag.length + HEX_LEN);
						}
						i += tag.length + HEX_LEN;
					} catch (e) {
						res += text[i++];
					}
				}
			} else {
				res += text[i++];
			}
		}

		plainTa.value = res;
		autoResize(plainTa);
		promptEl.textContent = `解密完成，共解密 ${decryptCount} 个字符`;
	}

	async function copyText() {
		const txt = cipherTa.value.trim();
		if (!txt) {
			promptEl.textContent = '无内容可复制';
			return;
		}

		try {
			await navigator.clipboard.writeText(txt);
			promptEl.textContent = `复制成功，共 ${txt.length} 个字符`;
		} catch (error) {
			fallbackCopy(txt);
		}
	}

	function fallbackCopy(text) {
		const ta = document.createElement('textarea');
		ta.value = text;
		ta.style.position = 'fixed';
		ta.style.opacity = '0';
		document.body.appendChild(ta);
		ta.select();

		try {
			document.execCommand('copy');
			promptEl.textContent = '复制成功（兼容模式）';
		} catch (e) {
			promptEl.textContent = '复制失败，请手动复制';
		} finally {
			document.body.removeChild(ta);
		}
	}

	async function pasteText() {
		try {
			const txt = await navigator.clipboard.readText();
			plainTa.value = txt;
			autoResize(plainTa);
			promptEl.textContent = `粘贴成功，共 ${txt.length} 个字符`;
		} catch (error) {
			promptEl.textContent = '粘贴失败，请手动粘贴或检查浏览器权限';
		}
	}

	document.getElementById('btnEncrypt').addEventListener('click', encrypt);
	document.getElementById('btnDecrypt').addEventListener('click', decrypt);
	document.getElementById('btnCopy').addEventListener('click', copyText);
	document.getElementById('btnPaste').addEventListener('click', pasteText);

	document.addEventListener('keydown', (e) => {
		if (e.ctrlKey || e.metaKey) {
			switch (e.key) {
				case 'Enter':
					e.preventDefault();
					if (e.shiftKey) {
						decrypt();
					} else {
						encrypt();
					}
					break;
			}
		}
	});
})();