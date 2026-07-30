  function copyCode(btn) {
    const pre = btn.closest('.code-block').querySelector('pre');
    // Get text content but strip the .ph spans visual markers
    const text = pre.innerText || pre.textContent;
    navigator.clipboard.writeText(text).then(() => {
      btn.textContent = 'Copiado!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'Copiar';
        btn.classList.remove('copied');
      }, 2000);
    });
  }
