// Formulaire de contact : envoie le message au portail d'Altear (bureau.altear.tech), qui le range
// dans sa base. Désactivé tant que le portail n'est pas en ligne (Cloudflare Access bloque encore l'API).
(() => {
  'use strict';
  const CONTACT = { enabled: true, url: 'https://bureau.altear.tech/api/contact', timeoutMs: 10000 };

  const form = document.querySelector('[data-contact]');
  if (!form) return;
  const send = form.querySelector('[data-contact-send]');
  const status = form.querySelector('[data-contact-status]');
  const off = form.querySelector('[data-contact-off]');
  const say = (text, kind = '') => { status.textContent = text; status.dataset.kind = kind; };

  if (!CONTACT.enabled) {
    send.disabled = true;
    return;
  }
  off.hidden = true;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.email || !form.elements.email.checkValidity()) { say('Indique une adresse e-mail valide.', 'error'); form.elements.email.focus(); return; }
    if (!data.message || data.message.trim().length < 10) { say('Ton message est un peu court.', 'error'); form.elements.message.focus(); return; }

    send.disabled = true;
    say('Envoi…');
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CONTACT.timeoutMs);
    try {
      const res = await fetch(CONTACT.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'omit',
        signal: controller.signal,
      });
      if (res.ok) { form.reset(); say('Message envoyé, merci ! Je te réponds dès que possible.', 'ok'); return; }
      if (res.status === 429) { say('Trop de messages d’affilée : réessaie dans quelques minutes.', 'error'); return; }
      say('Le message n’a pas pu être envoyé. Écris plutôt à contact@altear.tech.', 'error');
    } catch {
      say('Le serveur ne répond pas (PC éteint ?). Écris plutôt à contact@altear.tech.', 'error');
    } finally {
      clearTimeout(timer);
      send.disabled = false;
    }
  });
})();
