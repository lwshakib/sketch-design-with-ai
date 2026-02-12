
export const getInjectedHTML = (html: string) => {
  // Prevent duplicate injection if the HTML already contains our script
  if (html.includes('id="sketch-injected-script"') || html.includes("id='sketch-injected-script'")) {
    return html;
  }

  const headInjections = `
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Outfit:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
    <style id="sketch-material-icons-fix">
      .material-icons {
        font-family: 'Material Icons' !important;
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
        -moz-osx-font-smoothing: grayscale;
        font-feature-settings: 'liga';
      }
    </style>
    <script id="sketch-tailwind-cdn" src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
    <script id="sketch-lucide-icons" src="https://unpkg.com/lucide@latest"></script>
    <script id="sketch-tailwind-config">
      if (window.tailwind) {
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              colors: {
                border: "var(--border)",
                input: "var(--input)",
                ring: "var(--ring)",
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                  DEFAULT: "var(--primary)",
                  foreground: "var(--primary-foreground)",
                },
                secondary: {
                  DEFAULT: "var(--secondary)",
                  foreground: "var(--secondary-foreground)",
                },
                destructive: {
                  DEFAULT: "var(--destructive, #ef4444)",
                  foreground: "var(--destructive-foreground, #ffffff)",
                },
                muted: {
                  DEFAULT: "var(--muted)",
                  foreground: "var(--muted-foreground)",
                },
                accent: {
                  DEFAULT: "var(--accent)",
                  foreground: "var(--accent-foreground)",
                },
                popover: {
                  DEFAULT: "var(--popover)",
                  foreground: "var(--popover-foreground)",
                },
                card: {
                  DEFAULT: "var(--card)",
                  foreground: "var(--card-foreground)",
                },
              },
              borderRadius: {
                lg: "var(--radius, 0.5rem)",
                md: "calc(var(--radius, 0.5rem) - 2px)",
                sm: "calc(var(--radius, 0.5rem) - 4px)",
              },
            },
          },
        }
      }
    </script>
    <style id="sketch-injected-style">
      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        background-color: var(--background, #ffffff);
        color: var(--foreground, #000000);
        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        line-height: 1.5;
        -webkit-font-smoothing: antialiased;
      }
      ::-webkit-scrollbar { display: none; }
      * { box-sizing: border-box; }
      body[data-edit-mode="true"] * {
        pointer-events: auto !important;
        user-select: none !important;
      }
      .edit-hover-highlight {
        outline: 2px dashed #6366f1 !important;
        outline-offset: -1px !important;
        cursor: pointer !important;
        z-index: 50000 !important;
      }
      .edit-selected-highlight {
        outline: 2px solid #6366f1 !important;
        outline-offset: -1px !important;
        box-shadow: 0 0 15px rgba(99, 102, 241, 0.3) !important;
        z-index: 50001 !important;
      }
    </style>
  `;

  const scriptLogic = `
    <script id="sketch-injected-script">
      (function() {
        if (window.__SKETCH_INITIALIZED__) return;
        window.__SKETCH_INITIALIZED__ = true;

        var lastHeight = 0;
        var isEditMode = false;
        var selectedEl = null;
        var hoveredEl = null;



        var heightTimeout = null;
        var updateHistory = [];
        var sendHeight = function() {
          if (heightTimeout) return;
          heightTimeout = setTimeout(function() {
            heightTimeout = null;
            
            var body = document.body;
            var html = document.documentElement;
            
            if (!body) return;

            // Get the absolute content height by looking at all elements
            var allElements = body.getElementsByTagName('*');
            var maxBottom = 0;
            var len = allElements.length;
            var checkLimit = Math.min(len, 2000); 
            
            for (var i = 0; i < checkLimit; i++) {
              var el = allElements[i];
              // Skip invisible or extremely large elements that might be background decorations
              if (el.offsetWidth === 0 && el.offsetHeight === 0) continue;
              
              var rect = el.getBoundingClientRect();
              var bottom = rect.top + rect.height + window.pageYOffset;
              
              // Ignore elements that are likely fixed or absolute background blurs (often have very high or low top)
              if (rect.height > 2000 && rect.top < -500) continue; 

              if (bottom > maxBottom) maxBottom = bottom;
            }

            // Fallback to standard measurements but prioritize maxBottom
            var height = Math.max(
              maxBottom,
              body.scrollHeight,
              html.scrollHeight
            );

            // Sanity check: don't let it grow infinitely if it's just a few pixels
            var cappedHeight = Math.min(Math.ceil(height), 10000); 
            
            // LOOP PREVENTION: 
            // 1. Minimum delta
            if (Math.abs(cappedHeight - lastHeight) < 4) return;

            // 2. Rapid update detection
            var now = Date.now();
            updateHistory.push({ h: cappedHeight, t: now });
            if (updateHistory.length > 5) updateHistory.shift();
            
            if (updateHistory.length >= 5) {
              var timeSpan = updateHistory[updateHistory.length-1].t - updateHistory[0].t;
              var heightDiff = updateHistory[updateHistory.length-1].h - updateHistory[0].h;
              
              // If we've updated 5 times in 2 seconds and height is still growing
              if (timeSpan < 2000 && heightDiff > 0) {
                // Stop the loop - we already updated recently
                return;
              }
            }

            if (cappedHeight !== lastHeight) {
              lastHeight = cappedHeight;
              window.parent.postMessage({ type: 'HEIGHT_UPDATE', height: cappedHeight }, '*');
            }
          }, 150);
        };

        var clearHover = function() {
          if (hoveredEl) {
            hoveredEl.classList.remove('edit-hover-highlight');
            hoveredEl = null;
          }
        };

        var clearSelected = function() {
          if (selectedEl) {
            selectedEl.classList.remove('edit-selected-highlight');
            selectedEl = null;
          }
        };

        var getElementPath = function(el) {
          var path = [];
          var current = el;
          while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.body) {
            var index = 0;
            var sibling = current.previousElementSibling;
            while (sibling) {
              index++;
              sibling = sibling.previousElementSibling;
            }
            path.unshift(index);
            current = current.parentElement;
          }
          return path;
        };

        var getElementByPath = function(path) {
          var el = document.body;
          for (var i = 0; i < path.length; i++) {
            if (el && el.children[path[i]]) {
                el = el.children[path[i]];
            } else {
                return null;
            }
          }
          return el;
        };

        var handlePointerMove = function(e) {
          if (!isEditMode) return;
          var target = e.target.closest('*');
          if (!target || target === document.body || target === document.documentElement) {
            clearHover();
            return;
          }
          if (target.classList.contains('edit-selected-highlight')) {
            clearHover();
            return;
          }
          if (hoveredEl !== target) {
            clearHover();
            hoveredEl = target;
            hoveredEl.classList.add('edit-hover-highlight');
          }
        };

        var handleClick = function(e) {
          if (!isEditMode) return;
          e.preventDefault();
          e.stopPropagation();
          var target = e.target.closest('*');
          
          if (!target || target === document.body || target === document.documentElement) {
            clearSelected();
            window.parent.postMessage({ type: 'SELECTION_CLEARED' }, '*');
            return;
          }
          
          clearSelected();
          selectedEl = target;
          selectedEl.classList.add('edit-selected-highlight');
          clearHover();
          
          window.parent.postMessage({ 
            type: 'ELEMENT_CLICKED', 
            tagName: target.tagName,
            id: target.id,
            className: target.className
          }, '*');
        };

        window.addEventListener('pointermove', handlePointerMove, true);
        window.addEventListener('pointerleave', clearHover, true);
        window.addEventListener('click', handleClick, true);

        window.addEventListener('message', function(event) {
          if (event.data.type === 'UPDATE_CONTENT') {
            var savedPath = selectedEl ? getElementPath(selectedEl) : null;
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(event.data.content, 'text/html');
            
            // 1. Sync DocumentElement (HTML) Attributes
            const currentRoot = document.documentElement;
            const newRoot = newDoc.documentElement;
            // Remove attributes no longer present
            Array.from(currentRoot.attributes).forEach(attr => {
                if (!newRoot.hasAttribute(attr.name)) currentRoot.removeAttribute(attr.name);
            });
            // Set/Update attributes from new content
            Array.from(newRoot.attributes).forEach(attr => {
                currentRoot.setAttribute(attr.name, attr.value);
            });

            // 2. Sync Body Attributes
            const currentBody = document.body;
            const newBody = newDoc.body;
            // Remove attributes no longer present (excluding our internal ones)
            Array.from(currentBody.attributes).forEach(attr => {
                if (attr.name !== 'data-edit-mode' && !newBody.hasAttribute(attr.name)) {
                    currentBody.removeAttribute(attr.name);
                }
            });
            // Set/Update attributes from new content
            Array.from(newBody.attributes).forEach(attr => {
                if (attr.name !== 'data-edit-mode') {
                    currentBody.setAttribute(attr.name, attr.value);
                }
            });

            // 3. Update Body Content
            currentBody.innerHTML = newBody.innerHTML;

            // 4. Selective Head Update (Styles and Links)
            // Remove styles/links from previous AI content
            Array.from(document.head.children).forEach(child => {
              if (child.tagName === 'STYLE' || child.tagName === 'LINK') {
                 if (!child.id || (!child.id.startsWith('sketch-') && child.id !== 'theme-overrides')) {
                    child.remove();
                 }
              }
            });

            // Add new styles/links from incoming AI content
            Array.from(newDoc.head.children).forEach(child => {
              if (child.tagName === 'STYLE' || child.tagName === 'LINK') {
                if (!child.id || !child.id.startsWith('sketch-')) {
                   document.head.appendChild(child.cloneNode(true));
                }
              }
            });

            // 5. Re-render styling engine (Tailwind)
            if (window.tailwind) {
              try { 
                window.tailwind.render(); 
                // Second pass after a micro-task to ensure variables are parsed
                setTimeout(function() { window.tailwind.render(); }, 50);
              } catch (e) {}
            }

            // 6. Initialize Lucide Icons
            if (window.lucide) {
              try { window.lucide.createIcons(); } catch (e) {}
            }

            if (savedPath) {
                var newEl = getElementByPath(savedPath);
                if (newEl) {
                    selectedEl = newEl;
                    selectedEl.classList.add('edit-selected-highlight');
                    window.parent.postMessage({ 
                      type: 'ELEMENT_CLICKED', 
                      tagName: selectedEl.tagName,
                      id: selectedEl.id,
                      className: selectedEl.className
                    }, '*');
                } else {
                    selectedEl = null;
                    window.parent.postMessage({ type: 'SELECTION_CLEARED' }, '*');
                }
            }


            sendHeight();
          }
          if (event.data.type === 'SET_EDIT_MODE') {
            isEditMode = event.data.enabled;
            document.body.setAttribute('data-edit-mode', isEditMode ? 'true' : 'false');
            if (!isEditMode) {
              clearHover();
              clearSelected();
            }
          }
          if (event.data.type === 'CLEAR_SELECTION') {
            clearSelected();
          }
        });

        var observer = new MutationObserver(sendHeight);
        var resizeObserver = window.ResizeObserver ? new ResizeObserver(function() { sendHeight(); }) : null;

        var initObserver = function() {
          sendHeight();
          if (window.lucide) {
            try { window.lucide.createIcons(); } catch (e) {}
          }
          observer.observe(document.body, { 
            childList: true, 
            subtree: true, 
            attributes: true,
            characterData: true
          });
          if (resizeObserver) {
            resizeObserver.observe(document.body);
            if (document.documentElement) resizeObserver.observe(document.documentElement);
          }
          [100, 300, 600, 1000, 2000, 4000].forEach(function(delay) { setTimeout(sendHeight, delay); });
        };

        if (document.readyState === 'complete') {
          initObserver();
        } else {
          window.addEventListener('load', initObserver);
        }
      })();
    </script>
  `;

  let processedHtml = html;
  if (/<head\b[^>]*>/i.test(processedHtml)) {
    processedHtml = processedHtml.replace(/(<head\b[^>]*>)/i, '$1' + headInjections);
  } else if (/<html\b[^>]*>/i.test(processedHtml)) {
    processedHtml = processedHtml.replace(/(<html\b[^>]*>)/i, '$1<head>' + headInjections + '</head>');
  } else {
    processedHtml = '<head>' + headInjections + '</head>' + processedHtml;
  }

  if (processedHtml.toLowerCase().includes('</body>')) {
    return processedHtml.replace(/<\/body>/i, scriptLogic + '</body>');
  }
  return processedHtml + scriptLogic;
};


export const sanitizeDocumentHtml = (doc: Document, originalHtml: string) => {
  const root = doc.documentElement;
  if (!root) return originalHtml;

  const clone = root.cloneNode(true) as HTMLElement;
  
  // Remove injected script and style
  const injectedScript = clone.querySelector('#sketch-injected-script');
  if (injectedScript) injectedScript.remove();
  const injectedStyle = clone.querySelector('#sketch-injected-style');
  if (injectedStyle) injectedStyle.remove();

  const walker = doc.createTreeWalker(clone, NodeFilter.SHOW_ELEMENT);

  let current = walker.currentNode as HTMLElement | null;
  while (current) {
    if (current.style) {
      current.classList.remove('edit-hover-highlight');
      current.classList.remove('edit-selected-highlight');
      if (current.classList.length === 0) {
        current.removeAttribute('class');
      }
    }
    if (current.getAttribute("contenteditable") === "true") {
      current.removeAttribute("contenteditable");
    }
    current = walker.nextNode() as HTMLElement | null;
  }

  return "<!DOCTYPE html>" + clone.outerHTML;
};
