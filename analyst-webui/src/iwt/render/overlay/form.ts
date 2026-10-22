import type { FormId, Credentials } from '../../model/types';

export interface FormHandle {
  el: HTMLFormElement;
  open(form: FormId, label: string): void;
  close(): void;
  setScreenPosition(x: number, y: number, scale: number): void;
  setError(message: string | null): void;
  setBusy(busy: boolean): void;
  shake(): void;
}

export function buildForm(
  host: HTMLElement,
  onSubmit: (creds: Credentials) => void,
  onCancel?: () => void,
  onMicrosoft?: () => void,
): FormHandle {
  const el = document.createElement('form');
  el.className = 'iwt-form';
  el.innerHTML =
    `<div class="pad">` +
      `<h4 data-title>I want to …</h4>` +
      `<label>Email</label><input id="iwt-email" type="email" value="pavel@onz.solutions" />` +
      `<div data-pw-wrap><label>Password</label><input id="iwt-pw" type="password" value="secret123" /></div>` +
      `<div class="err" data-err hidden></div>` +
      `<div class="row">` +
        `<button class="back" type="button" data-back>←</button>` +
        `<button class="go" type="submit" data-go>Enter</button>` +
      `</div>` +
      `<button class="ms" type="button" data-ms hidden>Sign in with Microsoft</button>` +
    `</div>`;
  host.appendChild(el);

  const title = el.querySelector<HTMLElement>('[data-title]')!;
  const pwWrap = el.querySelector<HTMLElement>('[data-pw-wrap]')!;
  const go = el.querySelector<HTMLButtonElement>('[data-go]')!;
  const errEl = el.querySelector<HTMLElement>('[data-err]')!;
  const email = el.querySelector<HTMLInputElement>('#iwt-email')!;
  const pw = el.querySelector<HTMLInputElement>('#iwt-pw')!;
  const ms = el.querySelector<HTMLButtonElement>('[data-ms]')!;
  let goLabel = 'Enter';

  el.querySelector('[data-back]')!.addEventListener('click', () => { if (onCancel) onCancel(); else close(); });
  ms.addEventListener('click', () => onMicrosoft?.());
  el.addEventListener('submit', (e) => {
    e.preventDefault();
    onSubmit({ email: email.value, password: pw.value });
  });

  function setError(message: string | null): void {
    if (message) { errEl.textContent = message; errEl.removeAttribute('hidden'); el.classList.add('error'); }
    else { errEl.textContent = ''; errEl.setAttribute('hidden', ''); el.classList.remove('error'); }
  }

  function setBusy(busy: boolean): void {
    go.disabled = busy;
    go.textContent = busy ? '…' : goLabel;
  }

  function shake(): void {
    el.classList.remove('shake');
    void el.offsetWidth;            // force reflow so the animation can restart
    el.classList.add('shake');
    setTimeout(() => el.classList.remove('shake'), 420);
  }

  function open(form: FormId, label: string): void {
    title.textContent = `I want to ${label}`;
    const isLogin = form === 'login';
    if (isLogin) pwWrap.removeAttribute('hidden');
    else pwWrap.setAttribute('hidden', '');
    goLabel = isLogin ? 'Log in' : 'Save';
    if (isLogin && onMicrosoft) ms.removeAttribute('hidden');
    else ms.setAttribute('hidden', '');
    setError(null);
    setBusy(false);
    el.classList.add('show');
    requestAnimationFrame(() => {
      el.style.borderRadius = '20px';
      el.style.transform = 'translate(-50%,-50%) scale(1)';
      el.style.opacity = '1';
    });
    email.focus();
  }

  function close(): void {
    el.style.borderRadius = '50%';
    el.style.transform = 'translate(-50%,-50%) scale(.2)';
    el.style.opacity = '0';
    setTimeout(() => el.classList.remove('show'), 300);
  }

  function setScreenPosition(x: number, y: number, scale: number): void {
    el.style.left = `${x * scale}px`;
    el.style.top = `${y * scale}px`;
  }

  return { el, open, close, setScreenPosition, setError, setBusy, shake };
}
