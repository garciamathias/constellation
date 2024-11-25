/**
 * mathUtils.js - Gestion des formules mathématiques et LaTeX
 */

/**
 * Protège les formules LaTeX avant le rendu Markdown
 */
export function protectLatexFormulas(content) {
    return content
        .replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
            return `@@LATEX_DISPLAY@@${encodeURIComponent(formula)}@@`;
        })
        .replace(/\\\(([\s\S]*?)\\\)/g, (match, formula) => {
            return `@@LATEX_INLINE@@${encodeURIComponent(formula)}@@`;
        })
        .replace(/\$\$([\s\S]*?)\$\$/g, (match, formula) => {
            return `@@LATEX_DISPLAY@@${encodeURIComponent(formula)}@@`;
        })
        .replace(/\$([\s\S]*?)\$/g, (match, formula) => {
            return `@@LATEX_INLINE@@${encodeURIComponent(formula)}@@`;
        });
}

/**
 * Restaure les formules LaTeX après le rendu Markdown
 */
export function restoreLatexFormulas(content) {
    return content
        .replace(/@@LATEX_DISPLAY@@(.*?)@@/g, (match, formula) => {
            return `\\[${decodeURIComponent(formula)}\\]`;
        })
        .replace(/@@LATEX_INLINE@@(.*?)@@/g, (match, formula) => {
            return `\\(${decodeURIComponent(formula)}\\)`;
        });
}

/**
 * Vérifie si le message contient des formules LaTeX
 */
export function containsLatex(content) {
    return /\\\[|\\\]|\\\(|\\\)|\$\$|\$/g.test(content);
}

/**
 * Effectue le rendu MathJax sur un élément
 */
export async function renderMathJax(element) {
    try {
        await MathJax.typesetPromise([element]);
    } catch (error) {
        console.error('Error rendering MathJax:', error);
        throw error;
    }
}

/**
 * Nettoie le contenu des formules mathématiques
 */
export function sanitizeMathContent(content) {
    // Supprime les balises HTML potentiellement dangereuses dans les formules
    return content.replace(/<[^>]*>/g, '');
}