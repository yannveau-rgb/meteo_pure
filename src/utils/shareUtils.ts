/**
 * Helper to parse of inner components of oklch(...) and oklab(...)
 */
function parseInnerOklch(inner: string) {
  let partsStr = inner;
  let alphaStr = '';
  
  const slashIndex = inner.lastIndexOf('/');
  if (slashIndex !== -1) {
    partsStr = inner.substring(0, slashIndex);
    alphaStr = inner.substring(slashIndex + 1).trim();
  }
  
  const values: string[] = [];
  let currentToken = '';
  let parenLevel = 0;
  for (let i = 0; i < partsStr.length; i++) {
    const char = partsStr[i];
    if (char === '(') parenLevel++;
    if (char === ')') parenLevel--;
    
    if (parenLevel === 0 && (char === ',' || char === ' ' || char === '\t' || char === '\n' || char === '\r')) {
      if (currentToken) {
        values.push(currentToken);
        currentToken = '';
      }
    } else {
      currentToken += char;
    }
  }
  if (currentToken) {
    values.push(currentToken);
  }
  
  return {
    values,
    alpha: alphaStr || undefined
  };
}

/**
 * Convert OKLCH values to standard RGBA string
 */
function oklchToRgb(lVal: string, cVal: string, hVal: string, aVal?: string): string {
  let L = lVal.endsWith('%') ? parseFloat(lVal) / 100 : parseFloat(lVal);
  let C = parseFloat(cVal);
  let H = parseFloat(hVal);
  let alpha = 1;

  if (aVal) {
    const cleanA = aVal.trim().replace(/^[/\s]+/, '');
    if (cleanA.includes('var(')) {
      alpha = 1;
    } else {
      alpha = cleanA.endsWith('%') ? parseFloat(cleanA) / 100 : parseFloat(cleanA);
    }
  }

  if (isNaN(L)) L = 1;
  if (isNaN(C)) C = 0;
  if (isNaN(H)) H = 0;
  if (isNaN(alpha)) alpha = 1;

  const hRad = (H * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r_ = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_ = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076136100 * s;

  const rOut = r_ <= 0.0031308 ? 12.92 * r_ : 1.055 * Math.pow(r_, 1 / 2.4) - 0.055;
  const gOut = g_ <= 0.0031308 ? 12.92 * g_ : 1.055 * Math.pow(g_, 1 / 2.4) - 0.055;
  const bOut = b_ <= 0.0031308 ? 12.92 * b_ : 1.055 * Math.pow(b_, 1 / 2.4) - 0.055;

  const R = Math.max(0, Math.min(255, Math.round(rOut * 255)));
  const G = Math.max(0, Math.min(255, Math.round(gOut * 255)));
  const B = Math.max(0, Math.min(255, Math.round(bOut * 255)));

  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

/**
 * Convert OKLAB values to standard RGBA string
 */
function oklabToRgb(lVal: string, aValStr: string, bValStr: string, aVal?: string): string {
  let L = lVal.endsWith('%') ? parseFloat(lVal) / 100 : parseFloat(lVal);
  let a = parseFloat(aValStr);
  let b = parseFloat(bValStr);
  let alpha = 1;

  if (aVal) {
    const cleanA = aVal.trim().replace(/^[/\s]+/, '');
    if (cleanA.includes('var(')) {
      alpha = 1;
    } else {
      alpha = cleanA.endsWith('%') ? parseFloat(cleanA) / 100 : parseFloat(cleanA);
    }
  }

  if (isNaN(L)) L = 1;
  if (isNaN(a)) a = 0;
  if (isNaN(b)) b = 0;
  if (isNaN(alpha)) alpha = 1;

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const r_ = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g_ = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const b_ = -0.0041960863 * l - 0.7034186147 * m + 1.7076136100 * s;

  const rOut = r_ <= 0.0031308 ? 12.92 * r_ : 1.055 * Math.pow(r_, 1 / 2.4) - 0.055;
  const gOut = g_ <= 0.0031308 ? 12.92 * g_ : 1.055 * Math.pow(g_, 1 / 2.4) - 0.055;
  const bOut = b_ <= 0.0031308 ? 12.92 * b_ : 1.055 * Math.pow(b_, 1 / 2.4) - 0.055;

  const R = Math.max(0, Math.min(255, Math.round(rOut * 255)));
  const G = Math.max(0, Math.min(255, Math.round(gOut * 255)));
  const B = Math.max(0, Math.min(255, Math.round(bOut * 255)));

  return `rgba(${R}, ${G}, ${B}, ${alpha})`;
}

/**
 * Replace all occurrences of oklch(...) and oklab(...) in CSS text with rgb/rgba
 */
function replaceOklchOklab(cssText: string): string {
  const oklchRegex = /oklch\(\s*([^)]*(?:\([^)]*\)[^)]*)*)\)/gi;
  const oklabRegex = /oklab\(\s*([^)]*(?:\([^)]*\)[^)]*)*)\)/gi;

  let replaced = cssText.replace(oklchRegex, (match, inner) => {
    try {
      const parsed = parseInnerOklch(inner);
      if (parsed.values.length >= 3) {
        return oklchToRgb(parsed.values[0], parsed.values[1], parsed.values[2], parsed.alpha);
      }
      return 'rgba(255, 255, 255, 1)';
    } catch {
      return 'rgba(255, 255, 255, 1)';
    }
  });

  replaced = replaced.replace(oklabRegex, (match, inner) => {
    try {
      const parsed = parseInnerOklch(inner);
      if (parsed.values.length >= 3) {
        return oklabToRgb(parsed.values[0], parsed.values[1], parsed.values[2], parsed.alpha);
      }
      return 'rgba(255, 255, 255, 1)';
    } catch {
      return 'rgba(255, 255, 255, 1)';
    }
  });

  return replaced;
}

/**
 * Helper to convert a Base64 dataURL to a Blob synchronously.
 * By running fully synchronously, we prevent any asynchronous promise microtasks
 * from breaking the browser's User Gesture authorization token, ensuring navigator.clipboard.write
 * works flawlessly.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const parts = dataUrl.split(',');
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Capture an element on the screen exactly as it looks inside the application,
 * utilizing the non-destructive html2canvas `onclone` lifecycle.
 * This guarantees the user's active UI never shifts, flashes, or behaves erratically.
 * 
 * @param elementId The DOM element's ID to capture
 * @returns Base64 image data URL
 */
export async function generateElementDataUrl(elementId: string): Promise<string> {
  const originalElement = document.getElementById(elementId);
  if (!originalElement) {
    throw new Error(`Élément #${elementId} introuvable.`);
  }

  // Backup original globals and prototype methods to restore later
  const originalGetComputedStyle = window.getComputedStyle;

  // Activate computedStyle and cssText interception
  window.getComputedStyle = function(el, pseudoElt) {
    const style = originalGetComputedStyle.call(window, el, pseudoElt);
    return new Proxy(style, {
      get(target, prop) {
        if (prop === 'getPropertyValue') {
          return function(propertyName: string) {
            const val = target.getPropertyValue(propertyName);
            if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
              return replaceOklchOklab(val);
            }
            return val;
          };
        }
        // Use target itself as the receiver to prevent CSSStyleDeclaration getters throwing "Illegal invocation"
        const val = Reflect.get(target, prop, target);
        if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
          return replaceOklchOklab(val);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };

  const restoreCompatibilityLayer = () => {
    window.getComputedStyle = originalGetComputedStyle;
  };

  // 1. Create a temporary container positioned at (0,0) offscreen/hidden with positive coordinates
  const tempContainer = document.createElement('div');
  tempContainer.style.position = 'fixed';
  tempContainer.style.left = '0';
  tempContainer.style.top = '0';
  tempContainer.style.width = '480px';
  tempContainer.style.opacity = '0.01'; // Invisible to user's eye
  tempContainer.style.zIndex = '-9999';
  tempContainer.style.pointerEvents = 'none';
  
  // 2. Clone the original element
  const clonedElement = originalElement.cloneNode(true) as HTMLElement;
  const captureId = 'cloned-forecast-capture';
  clonedElement.id = captureId;
  clonedElement.style.opacity = '1';
  
  // 3. Append to body so it gets correct style computations from stylesheets
  tempContainer.appendChild(clonedElement);
  document.body.appendChild(tempContainer);

  const runCapture = async (scale: number, safeMode: boolean) => {
    const { default: html2canvas } = await import('html2canvas');
    return await html2canvas(clonedElement, {
      scale: scale,
      useCORS: true,
      backgroundColor: '#0b1329',
      scrollX: 0,
      scrollY: 0,
      logging: false,
      onclone: (clonedDoc) => {
        // 1. Remove all external stylesheet link tags from the cloned document to prevent html2canvas parsing errors
        const linkTags = clonedDoc.getElementsByTagName('link');
        for (let i = linkTags.length - 1; i >= 0; i--) {
          const tag = linkTags[i];
          if (tag.getAttribute('rel') === 'stylesheet') {
            tag.parentNode?.removeChild(tag);
          }
        }

        // 2. Remove all existing style tags from the cloned document
        const styleTags = clonedDoc.getElementsByTagName('style');
        for (let i = styleTags.length - 1; i >= 0; i--) {
          const tag = styleTags[i];
          tag.parentNode?.removeChild(tag);
        }

        // 3. Extract all stylesheet rules active in the parent document, sanitize them from oklch/oklab, and insert as a single style block
        let combinedStyles = '';
        for (let i = 0; i < document.styleSheets.length; i++) {
          const sheet = document.styleSheets[i];
          try {
            const rules = sheet.cssRules || sheet.rules;
            if (rules) {
              for (let j = 0; j < rules.length; j++) {
                combinedStyles += rules[j].cssText + '\n';
              }
            }
          } catch {
            // Silently caught for foreign/cross-origin or unloaded styles
          }
        }

        if (combinedStyles) {
          const cleanedCSS = replaceOklchOklab(combinedStyles);
          const styleEl = clonedDoc.createElement('style');
          styleEl.type = 'text/css';
          styleEl.appendChild(clonedDoc.createTextNode(cleanedCSS));
          clonedDoc.head?.appendChild(styleEl);
        }

        const docElement = clonedDoc.getElementById(captureId);
        if (docElement) {
          docElement.style.opacity = '1';
          docElement.style.background = safeMode
            ? '#0b1329'
            : 'linear-gradient(135deg, #09122c 0%, #12214e 50%, #030614 100%)';
          docElement.style.padding = '28px';
          docElement.style.borderRadius = '24px';
          docElement.style.width = '480px';
          docElement.style.maxWidth = '100%';
          docElement.style.boxShadow = 'none';
          docElement.style.filter = 'none';
          docElement.style.backdropFilter = 'none';
          (docElement.style as any).webkitBackdropFilter = 'none';

          // Recursively clean all child styles that might crash html2canvas's parser
          const allChildren = docElement.getElementsByTagName('*');
          for (let i = 0; i < allChildren.length; i++) {
            const child = allChildren[i] as HTMLElement;
            if (child.style) {
              // Convert inline style colors if present
              if (child.style.cssText && (child.style.cssText.includes('oklch') || child.style.cssText.includes('oklab'))) {
                child.style.cssText = replaceOklchOklab(child.style.cssText);
              }
              child.style.filter = 'none';
              child.style.backdropFilter = 'none';
              (child.style as any).webkitBackdropFilter = 'none';
              if (safeMode) {
                child.style.textShadow = 'none';
                child.style.boxShadow = 'none';
              }
            }

            // Convert SVG attributes like fill and stroke if they contain unsupported color functions
            const fillAttr = child.getAttribute('fill');
            if (fillAttr && (fillAttr.includes('oklch') || fillAttr.includes('oklab'))) {
              child.setAttribute('fill', replaceOklchOklab(fillAttr));
            }
            const strokeAttr = child.getAttribute('stroke');
            if (strokeAttr && (strokeAttr.includes('oklch') || strokeAttr.includes('oklab'))) {
              child.setAttribute('stroke', replaceOklchOklab(strokeAttr));
            }
            
            // Clean classes on elements (both HTML and SVG)
            const className = child.getAttribute('class') || '';
            if (className.includes('drop-shadow') || className.includes('blur') || className.includes('shadow')) {
              child.style.filter = 'none';
              child.style.boxShadow = 'none';
              child.removeAttribute('filter');
              
              const cleanedClass = className.split(' ')
                .filter(cls => !cls.startsWith('drop-shadow-') && !cls.startsWith('shadow-') && !cls.startsWith('blur-') && cls !== 'shadow' && cls !== 'blur')
                .join(' ');
              child.setAttribute('class', cleanedClass);
            }
          }
        }
      }
    });
  };

  try {
    // Attempt 1: Scaled crisp render 
    const canvas = await runCapture(1.8, false);
    const dataUrl = canvas.toDataURL('image/png');
    if (document.body.contains(tempContainer)) {
      document.body.removeChild(tempContainer);
    }
    return dataUrl;
  } catch (err) {
    console.warn("Premier essai de génération d'image échoué, tentative en mode de compatibilité...", err);
    try {
      // Attempt 2: Fail-safe mode (low scale, simplified CSS styles)
      const canvas = await runCapture(1.0, true);
      const dataUrl = canvas.toDataURL('image/png');
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      return dataUrl;
    } catch (err2) {
      console.error("Échec définitif de la génération d'image :", err2);
      if (document.body.contains(tempContainer)) {
        document.body.removeChild(tempContainer);
      }
      throw err2;
    }
  } finally {
    restoreCompatibilityLayer();
  }
}

/**
 * Copies a PNG data URL to system clipboard fully synchronously relative to the main thread.
 * Fits perfectly within the user interaction context (onClick).
 */
export async function copyDataUrlToClipboard(dataUrl: string): Promise<boolean> {
  try {
    const blob = dataUrlToBlob(dataUrl);

    if (typeof ClipboardItem !== 'undefined' && navigator.clipboard && navigator.clipboard.write) {
      const item = new ClipboardItem({ 'image/png': blob });
      await navigator.clipboard.write([item]);
      return true;
    }
    return false;
  } catch (err) {
    console.warn("La copie directe du presse-papiers a échoué :", err);
    return false;
  }
}

/**
 * Downloads a data URL as a file
 */
export function downloadDataUrl(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Attempts a native Web Share Sheet popover if supported (excellent for mobile)
 */
export async function shareImageNative(dataUrl: string, filename: string): Promise<boolean> {
  try {
    if (navigator.share && navigator.canShare) {
      const blob = dataUrlToBlob(dataUrl);
      const file = new File([blob], filename, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Météo de la semaine',
          text: 'Découvrez mes prévisions météo !'
        });
        return true;
      }
    }
    return false;
  } catch (err) {
    console.warn("Partage natif ignoré ou non supporté :", err);
    return false;
  }
}
