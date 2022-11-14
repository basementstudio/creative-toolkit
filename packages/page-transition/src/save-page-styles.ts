export const savePageStyles = () => {
  clearSavedPageStyles();

  const head = document.head;
  // Get all the styles of the page
  const allStyleElems = head.querySelectorAll<HTMLLinkElement>(
    'link[rel="stylesheet"], link[as="style"]'
  );
  // Get all the inline styles of the page, labelled by "data-n-href" ( defined by nextjs )
  const allInlineStylesElems = head.querySelectorAll("style[data-n-href]");

  // Create doubling links to css sheets that wont be removed unless we say so
  if (allStyleElems) {
    for (let i = 0; i < allStyleElems.length; i++) {
      const styleElem = allStyleElems[i];
      if (styleElem?.href) {
        const styles = document.createElement("link");
        styles.setAttribute("data-pt-fix", "true");
        styles.setAttribute("rel", "stylesheet");
        styles.setAttribute("href", styleElem.href);

        head.appendChild(styles);
      }
    }
  }

  // Now do the same with the inline styles
  const inlineStyles = document.createElement("style");
  inlineStyles.setAttribute("data-pt-fix", "true");
  if (allInlineStylesElems) {
    for (let i = 0; i < allInlineStylesElems.length; i++) {
      const inlineStyleElem = allInlineStylesElems[i];
      if (inlineStyleElem) {
        inlineStyles.innerHTML += inlineStyleElem.innerHTML;
      }
    }

    head.appendChild(inlineStyles);
  }
};

export const clearSavedPageStyles = () => {
  const head = document.head;
  const previousStylesFixes = head.querySelectorAll("[data-pt-fix]");

  // Delete previously created fixes
  if (previousStylesFixes) {
    for (let i = 0; i < previousStylesFixes.length; i++) {
      const previousStyleFix = previousStylesFixes[i];
      if (previousStyleFix) {
        head.removeChild(previousStyleFix);
      }
    }
  }
};
