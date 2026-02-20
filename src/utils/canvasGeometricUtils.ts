// src/utils/canvasGeometricUtils.ts

// Fonction de hachage déterministe
export const pseudoRandom = (seed: string): number => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
        hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const x = Math.sin(hash) * 10000;
    return x - Math.floor(x);
};

interface Draw2DTreeOptions {
    ctx: CanvasRenderingContext2D;
    x: number;
    y: number; // Base (pied) de l'arbre
    height: number;
    width: number;
    color: string;
    glowColor: string;
    isActive: boolean;
}

// Dessine un arbre 2D "Flat" (Empilement de formes géométriques)
export const draw2DFlatTree = (options: Draw2DTreeOptions) => {
    const { ctx, x, y, height, width, color, glowColor, isActive } = options;

    // Configuration
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';

    // Ombre portée (Glow)
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = isActive ? 30 : 0;
    ctx.shadowOffsetY = 0;

    // Dimensions relatives
    const trunkH = height * 0.2;
    const trunkW = width * 0.15;
    const foliageH = height * 0.8;

    // --- 1. Dessin du Tronc ---
    ctx.fillStyle = isActive ? '#475569' : '#334155'; // Slate-600 / Slate-700
    ctx.fillRect(x - trunkW / 2, y - trunkH, trunkW, trunkH);

    // --- 2. Dessin du Feuillage (3 Triangles empilés) ---
    const tiers = 3;
    const tierHeight = foliageH / tiers;
    const tierOverlap = tierHeight * 0.3; // Les étages se chevauchent

    // On remonte du bas vers le haut
    let currentY = y - trunkH + tierOverlap;
    let currentW = width;

    for (let i = 0; i < tiers; i++) {
        // Calcul des points du triangle (Isocèle)
        const topY = currentY - tierHeight;

        ctx.beginPath();
        ctx.moveTo(x - currentW / 2, currentY); // Bas Gauche
        ctx.lineTo(x, topY); // Haut Centre
        ctx.lineTo(x + currentW / 2, currentY); // Bas Droite
        ctx.closePath();

        // Remplissage avec Gradient
        // Gradient vertical pour donner un peu de volume 2D
        const gradient = ctx.createLinearGradient(x, topY, x, currentY);
        if (isActive) {
            // Actif : Gradient Orange/Or
            gradient.addColorStop(0, '#fbbf24'); // Amber-400
            gradient.addColorStop(1, '#ea580c'); // Orange-600
        } else {
            // Inactif : Gradient Cyan/Teal sombre
            gradient.addColorStop(0, '#2dd4bf'); // Teal-400
            gradient.addColorStop(1, '#0f766e'); // Teal-700
        }

        ctx.fillStyle = gradient;
        ctx.fill();

        // Bordure (Stroke) pour définir la forme
        ctx.strokeStyle = isActive ? '#fff7ed' : '#134e4a'; // Orange très clair ou Teal très sombre
        ctx.lineWidth = isActive ? 2 : 1;
        ctx.stroke();

        // Préparation étage suivant
        currentY = topY + tierOverlap;
        currentW *= 0.7; // On réduit la largeur en montant
    }

    // Reset Glow
    ctx.shadowBlur = 0;
};


// Dessine une ligne d'horizon simple avec un dégradé
export const draw2DHorizon = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);

    // Gradient pour le sol (fade out vers le bas)
    const gradient = ctx.createLinearGradient(0, y, 0, y + 200);
    gradient.addColorStop(0, 'rgba(15, 23, 42, 1)'); // Slate-900 (Opaque)
    gradient.addColorStop(1, 'rgba(15, 23, 42, 0)'); // Transparent

    ctx.strokeStyle = '#334155'; // Ligne d'horizon
    ctx.lineWidth = 2;
    ctx.stroke();

    // Remplissage sous l'horizon
    ctx.lineTo(width, y + 200);
    ctx.lineTo(0, y + 200);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();
};
