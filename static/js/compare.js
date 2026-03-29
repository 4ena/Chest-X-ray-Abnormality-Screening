/* ============================================
   Compare View - GSM Arena Style
   ============================================ */

const CompareView = (() => {

    function confidenceClass(confidence) {
        if (confidence >= 0.7) return 'critical';
        if (confidence >= 0.45) return 'moderate';
        if (confidence >= 0.25) return 'mild';
        return 'normal';
    }

    function renderColumn(patient, side) {
        const infoEl = document.getElementById(`compare-info-${side}`);
        const findingsEl = document.getElementById(`compare-findings-${side}`);
        const titleEl = document.querySelector(`#compare-${side === 'a' ? 'left' : 'right'} .compare-title`);

        titleEl.textContent = patient.name;

        infoEl.innerHTML = `
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Age</span>
                    <span class="info-value">${patient.age}y</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Sex</span>
                    <span class="info-value">${patient.sex}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Severity</span>
                    <span class="info-value" style="color: var(--${patient.severity_level})">${Math.round(patient.severity_score * 100)}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">View</span>
                    <span class="info-value">${patient.view}</span>
                </div>
            </div>
        `;

        findingsEl.innerHTML = patient.findings.map(f => {
            const cls = confidenceClass(f.confidence);
            const pct = Math.round(f.confidence * 100);
            return `
                <div class="card-finding-row" style="margin-bottom: 8px;">
                    <span class="finding-name">${f.pathology}</span>
                    <div class="finding-bar-bg">
                        <div class="finding-bar ${cls}" style="width: ${pct}%"></div>
                    </div>
                    <span class="finding-pct">${pct}%</span>
                </div>
            `;
        }).join('');

        // Draw mini X-ray on compare canvas
        const canvas = document.getElementById(`compare-canvas-${side}`);
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 320;
        drawMiniXray(ctx, 320, 320, patient);
    }

    function drawMiniXray(ctx, w, h, patient) {
        // Simplified X-ray rendering for compare view
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        const gradient = ctx.createRadialGradient(w/2, h*0.45, 20, w/2, h*0.45, w*0.4);
        gradient.addColorStop(0, 'rgba(160, 160, 160, 0.25)');
        gradient.addColorStop(0.5, 'rgba(100, 100, 100, 0.2)');
        gradient.addColorStop(1, 'rgba(20, 20, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Lung fields
        ctx.fillStyle = 'rgba(30, 30, 30, 0.5)';
        ctx.beginPath();
        ctx.ellipse(w*0.35, h*0.4, w*0.12, h*0.18, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w*0.65, h*0.4, w*0.12, h*0.18, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heart
        const heartGrad = ctx.createRadialGradient(w*0.45, h*0.48, 5, w*0.45, h*0.48, w*0.1);
        heartGrad.addColorStop(0, 'rgba(150, 150, 150, 0.3)');
        heartGrad.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.fillStyle = heartGrad;
        ctx.beginPath();
        ctx.ellipse(w*0.45, h*0.48, w*0.09, h*0.12, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heatmap overlay at 40% opacity
        ctx.globalAlpha = 0.4;
        patient.findings.forEach((f, i) => {
            let cx, cy, radius;
            switch (f.pathology) {
                case 'Cardiomegaly':
                case 'Enlarged Cardiomediastinum':
                    cx = w * 0.45; cy = h * 0.48; radius = w * 0.1;
                    break;
                case 'Pleural Effusion':
                    cx = w * (0.3 + i * 0.08); cy = h * 0.68; radius = w * 0.08;
                    break;
                case 'Atelectasis':
                    cx = w * 0.35; cy = h * 0.52; radius = w * 0.07;
                    break;
                case 'Edema':
                    cx = w * 0.5; cy = h * 0.38; radius = w * 0.12;
                    break;
                case 'Consolidation':
                    cx = w * 0.63; cy = h * 0.35; radius = w * 0.07;
                    break;
                case 'Lung Opacity':
                    cx = w * 0.6; cy = h * 0.42; radius = w * 0.09;
                    break;
                case 'Pneumothorax':
                    cx = w * 0.68; cy = h * 0.25; radius = w * 0.07;
                    break;
                default:
                    cx = w * 0.5; cy = h * 0.4; radius = w * 0.08;
            }

            const intensity = f.confidence;
            const r = Math.round(255 * intensity);
            const g = Math.round(80 * (1 - intensity));

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, `rgba(${r}, ${g}, 30, ${intensity * 0.6})`);
            grad.addColorStop(1, `rgba(${r}, ${g + 50}, 30, 0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.globalAlpha = 1;

        // Label
        ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.font = '10px Inter, monospace';
        ctx.fillText(`ID: ${String(patient.id).padStart(5, '0')}`, 8, 16);
    }

    function renderDiff(patientA, patientB) {
        const diffList = document.getElementById('diff-list');

        // Collect all unique pathologies
        const allPathologies = new Set();
        patientA.findings.forEach(f => allPathologies.add(f.pathology));
        patientB.findings.forEach(f => allPathologies.add(f.pathology));

        const diffs = [];
        allPathologies.forEach(pathology => {
            const a = patientA.findings.find(f => f.pathology === pathology);
            const b = patientB.findings.find(f => f.pathology === pathology);
            const confA = a ? a.confidence : 0;
            const confB = b ? b.confidence : 0;
            const delta = confB - confA;

            diffs.push({ pathology, confA, confB, delta });
        });

        // Sort by absolute delta
        diffs.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));

        diffList.innerHTML = diffs.map(d => {
            const pctA = Math.round(d.confA * 100);
            const pctB = Math.round(d.confB * 100);
            const deltaPct = Math.round(d.delta * 100);
            let deltaClass = 'same';
            let deltaLabel = '--';

            if (Math.abs(deltaPct) >= 5) {
                deltaClass = deltaPct > 0 ? 'worse' : 'better';
                deltaLabel = `${deltaPct > 0 ? '+' : ''}${deltaPct}%`;
            }

            return `
                <div class="diff-item">
                    <div class="diff-finding-name">${d.pathology}</div>
                    <div class="diff-values">
                        <span class="diff-a" style="color: var(--${confidenceClass(d.confA)})">${pctA}%</span>
                        <span class="diff-arrow">vs</span>
                        <span class="diff-b" style="color: var(--${confidenceClass(d.confB)})">${pctB}%</span>
                        <span class="diff-delta ${deltaClass}">${deltaLabel}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    return {
        show(idA, idB) {
            const patientA = MockData.getPatient(idA);
            const patientB = MockData.getPatient(idB);
            if (!patientA || !patientB) return;

            App.switchView('compare');
            renderColumn(patientA, 'a');
            renderColumn(patientB, 'b');
            renderDiff(patientA, patientB);
        }
    };
})();
