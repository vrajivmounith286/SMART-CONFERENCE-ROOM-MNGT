// ===== MODAL COMPONENT =====
let overlay, content;

export function initModal() {
    overlay = document.getElementById('modal-overlay');
    content = document.getElementById('modal-content');
    overlay?.addEventListener('click', e => {
        if (e.target === overlay) closeModal();
    });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModal();
    });
}

export function openModal(html, width = '560px') {
    if (!overlay || !content) return;
    content.style.maxWidth = width;
    content.innerHTML = html;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

    // Wire up close buttons
    content.querySelectorAll('.modal-close, [data-close-modal]').forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
}

export function closeModal() {
    if (!overlay) return;
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
}
