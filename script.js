
(function(){
	function siteInit(){
		console.log('[site] siteInit');
			// cache default portfolio slides HTML so we can restore later
			const carouselTrackEl = document.querySelector('.carousel .carousel__track');
			const defaultPortfolioSlidesHTML = carouselTrackEl ? carouselTrackEl.innerHTML : '';
			// Attach anchor handlers first so navigation works independent of carousel
			(function attachAnchors(){
				const anchors = Array.from(document.querySelectorAll('a[href^="#"]'));
				console.log('[site] anchors found:', anchors.length);
				anchors.forEach(a => {
					console.log('[site] anchor:', a.getAttribute('href'));
					a.addEventListener('click', function(e){
						console.log('[site] anchor click:', this.getAttribute('href'));
						let href = this.getAttribute('href') || '';
						href = href.trim();
						// if href is just '#' or empty, try to infer target from link text
						if (!href || href === '#') {
							const text = (this.textContent || '').trim().toLowerCase();
							console.log('[site] inferring target from text:', text);
							const map = {
								'sobre nós': 'sobre-nos',
								'serviços': 'servicos',
								'servicos': 'servicos',
								'portifólio': 'portfolio',
								'portfólio': 'portfolio',
								'nossos trabalhos': 'portfolio',
								'contato': 'contato',
								'contatos': 'contato',
								'': 'top'
							};
							let inferred = map[text] || null;
							// if clicked element contains an image (logo), treat as top
							if (!inferred && this.querySelector('img')) inferred = 'top';
							if (inferred) href = '#'+inferred; else return;
						}

						const id = href.replace('#','');
						// resolve target element (by id or name)
						const target = (id === 'top') ? document.documentElement : document.getElementById(id) || document.querySelector('[name="'+id+'"]');
						if (target) {
							e.preventDefault();
							// account for fixed header height so section isn't hidden
							const header = document.querySelector('.header');
							const headerH = header ? header.offsetHeight : 0;
							const rectTop = target.getBoundingClientRect().top + window.scrollY;
							const scrollTo = Math.max(0, rectTop - headerH - 12);
							window.scrollTo({ top: scrollTo, behavior: 'smooth' });
							return;
						}
						// otherwise allow default behaviour
					});
				});
					})();

					// --- Servicos mobile slider ---
					function initServicosSlider(){
						const gallery = document.querySelector('.servicos__gallery--mobile');
						const track = document.querySelector('.servicos__gallery-track');
						console.log('[slider] initServicosSlider()', { galleryExists: !!gallery, trackExists: !!track });
						if (!gallery || !track) return;
						const slides = Array.from(track.querySelectorAll('.servicos__slide'));
						console.log('[slider] slides found:', slides.length);
						if (!slides.length) return;
						let active = slides.findIndex(s => s.getAttribute('aria-hidden') === 'false');
						if (active === -1) active = 0;
						let gap = 12;
						let slideW = 340; // fallback value; will be recalculated from DOM
						const peek = 40; // show 40px of next slide on the right

						function recalcSizes(){
							// compute slide width from DOM (responsive CSS may change it)
							if (slides.length) {
								slideW = slides[0].clientWidth || slideW;
							}
							try {
								const cs = window.getComputedStyle(track);
								gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || gap;
							} catch(e) { /* ignore */ }
						}
						function updatePosition(animate=true){
							recalcSizes();
							const containerW = gallery.clientWidth;
							const centerOffset = (containerW - slideW) / 2;
							// shift left by `peek` so a portion of the next slide is visible on the right
							let x = - active * (slideW + gap) + centerOffset - peek;
							// clamp so we don't shift content completely out of view on very small containers
							const maxLeft = centerOffset - peek; // active === 0
							const maxRight = -((slides.length - 1) * (slideW + gap)) + centerOffset - peek; // active === last
							if (x > maxLeft) x = maxLeft;
							if (x < maxRight) x = maxRight;
							if (!animate) track.style.transition = 'none'; else track.style.transition = '';
							track.style.transform = `translate3d(${x}px,0,0)`;
							slides.forEach((s,i)=> s.setAttribute('aria-hidden', i===active ? 'false' : 'true'));
							updateAside();
						}

						function updateAside(){
							const asideTitle = document.querySelector('.servicos__aside-title');
							const asideText = document.querySelector('.servicos__aside-text');
							if (!asideTitle || !asideText) return;
							const cur = slides[active];
							asideTitle.textContent = cur.dataset.title || asideTitle.textContent;
							asideText.textContent = cur.dataset.text || asideText.textContent;
						}

						let startX = 0; let currentX = 0; let dragging = false; let startTranslate = 0;
						track.addEventListener('touchstart', (e)=>{
							console.log('[slider] touchstart', e.touches.length);
							if (e.touches.length !== 1) return;
							dragging = true;
							startX = e.touches[0].clientX;
							const style = window.getComputedStyle(track);
							const matrix = new DOMMatrixReadOnly(style.transform);
							startTranslate = matrix.m41 || 0;
							track.style.transition = 'none';
							// ensure touch-action is set so browser doesn't intercept
							track.style.touchAction = track.style.touchAction || 'pan-y';
						}, {passive: false});

						track.addEventListener('touchmove', (e)=>{
							if (!dragging) return;
							// prevent vertical scroll while dragging horizontally
							e.preventDefault && e.preventDefault();
							const dx = e.touches[0].clientX - startX;
							currentX = startTranslate + dx;
							track.style.transform = `translate3d(${currentX}px,0,0)`;
							console.log('[slider] touchmove dx=', dx, 'currentX=', currentX);
						}, {passive: false});

						track.addEventListener('touchend', (e)=>{
							console.log('[slider] touchend');
							if (!dragging) return; dragging = false;
							const dx = (e.changedTouches[0].clientX - startX) || 0;
							console.log('[slider] touchend dx=', dx);
							const threshold = slideW / 4;
							if (dx < -threshold && active < slides.length -1) { active++; console.log('[slider] moved next ->', active); }
							else if (dx > threshold && active > 0) { active--; console.log('[slider] moved prev ->', active); }
							updatePosition(true);
						});

						// mouse support for desktop testing
						let mouseDown = false;
						track.addEventListener('mousedown', (e)=>{
							console.log('[slider] mousedown');
							mouseDown = true; startX = e.clientX; const style = window.getComputedStyle(track); startTranslate = new DOMMatrixReadOnly(style.transform).m41 || 0; track.style.transition='none';
							e.preventDefault();
						});
						window.addEventListener('mousemove', (e)=>{
							if (!mouseDown) return; const dx = e.clientX - startX; track.style.transform = `translate3d(${startTranslate + dx}px,0,0)`; console.log('[slider] mousemove dx=', dx);
						});
						window.addEventListener('mouseup', (e)=>{
							console.log('[slider] mouseup');
							if (!mouseDown) return; mouseDown = false; const dx = e.clientX - startX; const threshold = slideW / 4; console.log('[slider] mouseup dx=', dx);
							if (dx < -threshold && active < slides.length -1) { active++; console.log('[slider] moved next (mouse) ->', active); }
							else if (dx > threshold && active > 0) { active--; console.log('[slider] moved prev (mouse) ->', active); }
							updatePosition(true);
						});

						// init
						updatePosition(false);
						window.addEventListener('resize', ()=> updatePosition(false));
					}

					// Initialize slider now that DOM is ready
					initServicosSlider();

					// Desktop interactions for servicos gallery
					function initServicosDesktop(){
						const desktop = document.querySelector('.servicos__gallery--desktop');
						if (!desktop) return;
						const thumbs = Array.from(desktop.querySelectorAll('.servicos__thumb'));
						const slides = Array.from(document.querySelectorAll('.servicos__gallery-track .servicos__slide'));
						if (!thumbs.length) return;
						function basename(path){ return (path||'').split('/').pop(); }
						thumbs.forEach(th => {
							th.style.cursor = 'pointer';
							th.addEventListener('click', (e)=>{
								const img = th.querySelector('img');
								const name = basename(img && img.getAttribute('src'));
								console.log('[desktop] thumb click', name);
								// find matching mobile slide by image filename
								const match = slides.find(s => basename((s.querySelector('img')||{}).getAttribute('src')) === name);
								if (match){
									const title = match.dataset.title || '';
									const text = match.dataset.text || '';
									const asideTitle = document.querySelector('.servicos__aside-title');
									const asideText = document.querySelector('.servicos__aside-text');
									if (asideTitle) asideTitle.textContent = title;
									if (asideText) asideText.textContent = text;
								}
								// toggle classes: clicked becomes --large, others become --narrow
								thumbs.forEach(t => { t.classList.remove('servicos__thumb--large'); t.classList.add('servicos__thumb--narrow'); });
								if (th.classList.contains('servicos__thumb--narrow')){
									th.classList.remove('servicos__thumb--narrow');
									th.classList.add('servicos__thumb--large');
								}
							});
						});
					}
					initServicosDesktop();

					// --- Portfolio carousel init ---
					function initPortfolioCarousel(){
						const carousels = Array.from(document.querySelectorAll('.carousel'));
						if (!carousels.length) return;
						carousels.forEach(carousel => {
							// clear any previous autoplay timer attached to this carousel
							if (carousel._autoplayTimer) { clearInterval(carousel._autoplayTimer); carousel._autoplayTimer = null; }
							const track = carousel.querySelector('.carousel__track');
							const slides = track ? Array.from(track.children) : [];
							const btnPrev = carousel.querySelector('.carousel__nav--left');
							const btnNext = carousel.querySelector('.carousel__nav--right');
							const indicators = carousel.querySelector('.carousel__indicators');
							let idx = 0;

							const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
							const autoplayDelay = 4000; // ms

							let _gap = 0; // assume no visual gap between slides unless CSS defines one
							function getSlideWidth(){
								if (!slides.length) return carousel.clientWidth;
								try {
									const cs = window.getComputedStyle(track);
									_gap = parseFloat(cs.gap) || parseFloat(cs.columnGap) || 0;
								} catch(e) { /* ignore */ }
								// Use the visible stage width so transforms align with the viewport of the carousel
								const stageEl = carousel.querySelector('.carousel__stage') || carousel;
								const w = stageEl.clientWidth || carousel.clientWidth || (slides[0].offsetWidth || slides[0].clientWidth);
								return w + (_gap || 0);
							}

							// On mobile we want every slide to exactly match the visible stage width
							function applyMobileSlideWidths(){
								if (!isMobile) return;
								const stageEl = carousel.querySelector('.carousel__stage') || carousel;
								const w = stageEl.clientWidth || carousel.clientWidth;
								slides.forEach(s => { try { s.style.width = w + 'px'; } catch(e){} });
							}

							// ensure widths are applied initially and after resizes
							applyMobileSlideWidths();

							function update(){
								const slideW = getSlideWidth();
								if (!track) return;
								track.style.transition = 'transform 0.5s cubic-bezier(.22,.9,.2,1)';
								track.style.transform = `translate3d(${ -idx * slideW }px,0,0)`;
								// update indicators
								if (indicators){
									const dots = Array.from(indicators.children);
									dots.forEach((d,i)=> d.classList.toggle('is-active', i===idx));
								}
							}

							// autoplay helpers
							function startAutoplay(){
								stopAutoplay();
								carousel._autoplayTimer = setInterval(()=>{
									if (!slides.length) return;
									idx = (idx < slides.length - 1) ? idx + 1 : 0;
									update();
								}, autoplayDelay);
							}
							function stopAutoplay(){
								if (carousel._autoplayTimer) { clearInterval(carousel._autoplayTimer); carousel._autoplayTimer = null; }
							}

							// build indicators
							if (indicators){
								indicators.innerHTML = '';
								slides.forEach((s,i)=>{
									const b = document.createElement('button');
									b.type = 'button';
									b.className = 'carousel__indicator' + (i===0 ? ' is-active' : '');
									b.addEventListener('click', ()=>{ idx = i; update(); if (isMobile) { stopAutoplay(); setTimeout(startAutoplay, autoplayDelay); } });
									indicators.appendChild(b);
								});
							}

							if (btnPrev) btnPrev.addEventListener('click', ()=>{ if (idx>0) { idx--; update(); } if (isMobile) { stopAutoplay(); setTimeout(startAutoplay, autoplayDelay); } });
							if (btnNext) btnNext.addEventListener('click', ()=>{ if (idx < slides.length-1) { idx++; update(); } if (isMobile) { stopAutoplay(); setTimeout(startAutoplay, autoplayDelay); } });

							// touch support for swipe
							let startX = 0, moving = false;
							if (track){
								track.addEventListener('touchstart', e=>{ if (e.touches.length!==1) return; startX = e.touches[0].clientX; moving = true; track.style.transition = 'none'; stopAutoplay(); }, {passive:false});
								track.addEventListener('touchmove', e=>{
									if (!moving) return;
									const dx = e.touches[0].clientX - startX;
									const slideW = getSlideWidth();
									// clamp translate so user cannot drag beyond first/last slide and reveal blank area
									const minTranslate = -((slides.length - 1) * slideW);
									const maxTranslate = 0;
									let translate = -idx * slideW + dx;
									if (translate > maxTranslate) translate = maxTranslate;
									if (translate < minTranslate) translate = minTranslate;
									track.style.transform = `translate3d(${ translate }px,0,0)`;
								}, {passive:false});
								track.addEventListener('touchend', e=>{
									if (!moving) return;
									moving = false;
									const dx = (e.changedTouches && e.changedTouches[0]) ? e.changedTouches[0].clientX - startX : 0;
									const slideW = getSlideWidth();
									const threshold = slideW / 6;
									if (dx < -threshold && idx < slides.length-1) idx++;
									else if (dx > threshold && idx > 0) idx--;
									// clamp idx to valid range
									idx = Math.max(0, Math.min(idx, Math.max(0, slides.length - 1)));
									update();
									setTimeout(()=>{ if (isMobile) startAutoplay(); }, 600);
								});
								// also pause autoplay when mouse enters and resume on leave (desktop hover)
								carousel.addEventListener('mouseenter', stopAutoplay);
								carousel.addEventListener('mouseleave', ()=>{ if (isMobile) startAutoplay(); });
							}

							window.addEventListener('resize', ()=> update());
							update();
							// start autoplay on mobile
							if (isMobile) startAutoplay();
						});
					}
					initPortfolioCarousel();

					// --- Portfolio action buttons (toggle text + selected state) ---
					function setPortfolioSlides(key){
						const carousel = document.querySelector('.carousel');
						if (!carousel) return;
						const track = carousel.querySelector('.carousel__track');
						if (!track) return;
						console.log('[portfolio] setPortfolioSlides ->', key);

						// build Portugal slides HTML separately
						const ptSlidesData = [
							{ src: './assets/embaixada_portugal.png', alt: 'Embaixada Portugal', caption: 'Embaixada' },
							{ src: './assets/residencia_embaixada_portugal.png', alt: 'Residência Embaixada', caption: 'Residência Embaixada' },
							{ src: './assets/youploy.png', alt: 'Youploy', caption: 'Youploy' }
						];
						const ptHTML = ptSlidesData.map(s => `
							<article class="carousel__slide">
								<img src="${s.src}" alt="${s.alt}">
								<div class="carousel__caption">${s.caption} — Portugal</div>
							</article>
						`).join('');

						const isMobile = window.matchMedia && window.matchMedia('(max-width: 768px)').matches;
						let html = defaultPortfolioSlidesHTML;

						// Use same logic on mobile and desktop: show slides according to selected key
						if (key === 'pt') html = ptHTML;
						else html = defaultPortfolioSlidesHTML;
						console.log('[portfolio] html length:', html.length, 'key:', key, 'isMobile:', !!isMobile);

						// replace track contents
						track.innerHTML = html;
						// replace the entire carousel node with a clone to remove old event listeners
						const newCarousel = carousel.cloneNode(true);
						carousel.parentNode.replaceChild(newCarousel, carousel);
						// re-init carousel logic
						initPortfolioCarousel();
						// debug: log number of slides after re-init
						setTimeout(()=>{
							const count = document.querySelectorAll('.carousel .carousel__slide').length;
							console.log('[portfolio] slides now in carousel:', count);
						}, 40);
					}

					function initPortfolioActions(){
						const actions = document.querySelector('.portfolio__actions');
						if (!actions) return;
						const buttons = Array.from(actions.querySelectorAll('.portfolio__btn'));
						if (!buttons.length) return;
						buttons.forEach(btn => {
							const key = btn.dataset.key;
							const shortText = btn.dataset.short || (key === 'pt' ? 'Portugal' : 'Brasil');
							const fullText = btn.dataset.full || (key === 'pt' ? 'Nossos trabalhos em Portugal' : 'Nossos trabalhos no Brasil');
							// cache normalized values
							btn.dataset._short = shortText;
							btn.dataset._full = fullText;
							const textEl = btn.querySelector('.portfolio__btn-text');
							// set initial label according to selected state
							if (btn.classList.contains('portfolio__btn--selected')){
								if (textEl) textEl.textContent = fullText;
								btn.setAttribute('aria-pressed','true');
							} else {
								if (textEl) textEl.textContent = shortText;
								btn.setAttribute('aria-pressed','false');
							}
							btn.addEventListener('click', ()=>{
								buttons.forEach(b => {
									b.classList.remove('portfolio__btn--selected');
									b.setAttribute('aria-pressed','false');
									const t = b.querySelector('.portfolio__btn-text');
									if (t) t.textContent = b.dataset._short || b.dataset.short;
								});
								// activate clicked
								btn.classList.add('portfolio__btn--selected');
								btn.setAttribute('aria-pressed','true');
								if (textEl) textEl.textContent = fullText;
								// swap carousel slides according to selected key
								setPortfolioSlides(btn.dataset.key || 'br');
							});
						});
					}
					initPortfolioActions();
					// ensure carousel matches initial selection
					const initialSelected = document.querySelector('.portfolio__btn--selected');
					if (initialSelected) setPortfolioSlides(initialSelected.dataset.key || 'br');

					function initContactForm(){
						const form = document.querySelector('.cta__form');
						if (!form) return;
						const submitBtn = form.querySelector('button[type="submit"]');
						const inp = {
							name: form.querySelector('input[name="name"]'),
							email: form.querySelector('input[name="email"]'),
							phone: form.querySelector('input[name="phone"]'),
							company: form.querySelector('input[name="company"]'),
							service: form.querySelector('select[name="service"]')
						};

					// whether validation errors should be shown to the user
					let showErrors = false;

					function ensureErrorEl(el){
							if (!el) return null;
							let next = el.nextElementSibling;
							if (!next || !next.classList.contains('field-error')){
								const d = document.createElement('div');
								d.className = 'field-error';
								el.parentNode.insertBefore(d, el.nextSibling);
								return d;
							}
							return next;
						}

						function setError(el, msg){
							if (!el) return;
							el.classList.add('input-invalid');
							el.setAttribute('aria-invalid','true');
							const d = ensureErrorEl(el);
							if (d) d.textContent = msg;
						}

						function clearError(el){
							if (!el) return;
							el.classList.remove('input-invalid');
							el.removeAttribute('aria-invalid');
							const d = ensureErrorEl(el);
							if (d) d.textContent = '';
						}

						function validateName(){
							const v = (inp.name.value || '').trim();
							if (!v){ if (showErrors) setError(inp.name,'Nome é obrigatório'); return false; }
							if (v.length < 2){ if (showErrors) setError(inp.name,'Informe seu nome completo'); return false; }
							if (showErrors) clearError(inp.name); return true;
						}

						function validateEmail(){
							const v = (inp.email.value || '').trim();
							const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
							if (!v){ if (showErrors) setError(inp.email,'E-mail é obrigatório'); return false; }
							if (!re.test(v)){ if (showErrors) setError(inp.email,'E-mail inválido'); return false; }
							if (showErrors) clearError(inp.email); return true;
						}

						function formatPhone(v){
							if (!v) return '';
							let d = v.replace(/\D/g,'').slice(0,11);
							if (d.length <= 2) return d;
							if (d.length <= 6) return `(${d.slice(0,2)}) ${d.slice(2)}`;
							if (d.length <= 10) return `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
							return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
						}

						function validatePhone(){
							const digits = (inp.phone.value || '').replace(/\D/g,'');
							if (!digits){ if (showErrors) setError(inp.phone,'Telefone é obrigatório'); return false; }
							if (digits.length < 10){ if (showErrors) setError(inp.phone,'Telefone incompleto'); return false; }
							if (showErrors) clearError(inp.phone); return true;
						}

						function validateService(){
							if (!inp.service) return true; // optional if missing
							if (!inp.service.value){ if (showErrors) setError(inp.service,'Selecione um serviço'); return false; }
							if (showErrors) clearError(inp.service); return true;
						}

						function updateSubmitState(){
							// do a silent validation to determine whether submit should be enabled
							const ok = (function(){
								// call validators but prevent them from showing errors by temporarily
								// preserving showErrors state
								const prev = showErrors; showErrors = false;
								const res = validateName() && validateEmail() && validatePhone() && validateService();
								showErrors = prev; return res;
							})();
							if (submitBtn) submitBtn.disabled = !ok;
						}

						// realtime listeners
						if (inp.name) inp.name.addEventListener('input', ()=>{ inp.name.value = inp.name.value.replace(/\s{2,}/g,' '); if (showErrors) validateName(); updateSubmitState(); });
						if (inp.email) inp.email.addEventListener('input', ()=>{ inp.email.value = inp.email.value.toLowerCase(); if (showErrors) validateEmail(); updateSubmitState(); });
						if (inp.phone) inp.phone.addEventListener('input', (e)=>{
							const el = inp.phone;
							const raw = el.value || '';
							const selStart = el.selectionStart || 0;
							// count digits before caret in the old value
							const digitsBefore = (raw.slice(0, selStart).match(/\d/g) || []).length;
							// format value
							const formatted = formatPhone(raw);
							el.value = formatted;
							// compute new caret position by finding the position after the same number of digits
							let pos = 0; let seen = 0;
							for (let i = 0; i < formatted.length; i++){
								if (/\d/.test(formatted[i])) seen++;
								pos = i + 1;
								if (seen >= digitsBefore) break;
							}
							if (pos < 0) pos = 0;
							try { el.setSelectionRange(pos, pos); } catch(ex) {}
							if (showErrors) validatePhone(); updateSubmitState();
						});
						if (inp.service) inp.service.addEventListener('change', ()=>{ if (showErrors) validateService(); updateSubmitState(); });

						// blur validations: only show errors after user attempted to submit
						[inp.name, inp.email, inp.phone, inp.service].forEach(el=>{ if (!el) return; el.addEventListener('blur', ()=>{ if (showErrors){ if (el === inp.name) validateName(); if (el === inp.email) validateEmail(); if (el === inp.phone) validatePhone(); if (el === inp.service) validateService(); } updateSubmitState(); }); });

						// initial state: do not show errors yet, but set submit enabled/disabled
						updateSubmitState();

						// submit handler: validate and open mailto
						form.addEventListener('submit', function(e){
							e.preventDefault();
							// enable showing errors from this point on
							showErrors = true;
							const ok = validateName() && validateEmail() && validatePhone() && validateService();
							if (!ok){ const first = form.querySelector('[aria-invalid="true"]'); if (first) first.focus(); return; }
							const fd = new FormData(form);
							const name = fd.get('name') || '';
							const email = fd.get('email') || '';
							const phone = fd.get('phone') || '';
							const company = fd.get('company') || '';
							const service = fd.get('service') || '';
							const to = 'contato@agiengenharia.com.br';
							const subject = `Contato via site - ${name || 'Sem nome'}`;
							const body = `Nome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nEmpresa/Projeto: ${company}\nServiço: ${service}\n\nMensagem enviada via formulário do site.`;
							const mailto = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
							window.location.href = mailto;
						});
					}
					initContactForm();
			}

			if (document.readyState === 'loading') {
				document.addEventListener('DOMContentLoaded', siteInit);
			} else {
				siteInit();
			}

		})();
