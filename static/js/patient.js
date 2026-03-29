/* ============================================
   Patient Detail View + Heatmap Overlay
   ============================================ */

const PatientView = (() => {
    let currentPatient = null;
    let baseImage = null;
    let heatmapOpacity = 0.5;

    function confidenceClass(confidence) {
        if (confidence >= 0.7) return 'critical';
        if (confidence >= 0.45) return 'moderate';
        if (confidence >= 0.25) return 'mild';
        return 'normal';
    }

    function renderPatientInfo(patient) {
        const card = document.getElementById('patient-info-card');
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
                <h2>${patient.name}</h2>
                <span class="severity-badge ${patient.severity_level}" style="font-size: 13px; padding: 5px 14px;">
                    Severity: ${Math.round(patient.severity_score * 100)}
                </span>
            </div>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Age</span>
                    <span class="info-value">${patient.age} years</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Sex</span>
                    <span class="info-value">${patient.sex}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Admitted</span>
                    <span class="info-value">${patient.admission_date}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">View</span>
                    <span class="info-value">${patient.view} (${patient.ap_pa})</span>
                </div>
            </div>
        `;
    }

    function renderFindings(findings) {
        const list = document.getElementById('findings-list');
        list.innerHTML = findings.map(f => {
            const cls = confidenceClass(f.confidence);
            const pct = Math.round(f.confidence * 100);
            const highlight = f.confidence >= 0.7 ? 'highlight' : '';
            return `
                <div class="finding-detail-row ${highlight}">
                    <span class="finding-detail-name">${f.pathology}</span>
                    <div class="finding-detail-bar-bg">
                        <div class="finding-detail-bar finding-bar ${cls}" style="width: ${pct}%"></div>
                    </div>
                    <span class="finding-detail-pct" style="color: var(--${cls})">${pct}%</span>
                </div>
            `;
        }).join('');
    }

    function renderXray(patient) {
        const canvas = document.getElementById('xray-canvas');
        const ctx = canvas.getContext('2d');
        const container = document.getElementById('xray-container');

        // Generate a procedural mock X-ray
        canvas.width = 512;
        canvas.height = 512;

        drawMockXray(ctx, canvas.width, canvas.height, patient);

        // 3D parallax effect on mouse move
        container.addEventListener('mousemove', (e) => {
            const rect = container.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            canvas.style.transform = `perspective(800px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg)`;
        });

        container.addEventListener('mouseleave', () => {
            canvas.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg)';
        });

        // Heatmap opacity slider
        const slider = document.getElementById('heatmap-slider');
        const valueDisplay = document.getElementById('heatmap-value');
        slider.value = 50;
        valueDisplay.textContent = '50%';

        slider.addEventListener('input', (e) => {
            heatmapOpacity = e.target.value / 100;
            valueDisplay.textContent = `${e.target.value}%`;
            drawMockXray(ctx, canvas.width, canvas.height, patient);
        });
    }

    function drawMockXray(ctx, w, h, patient) {
        // Dark background (simulates X-ray)
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);

        // Chest outline (bright areas)
        const gradient = ctx.createRadialGradient(w/2, h*0.45, 30, w/2, h*0.45, w*0.42);
        gradient.addColorStop(0, 'rgba(180, 180, 180, 0.3)');
        gradient.addColorStop(0.4, 'rgba(120, 120, 120, 0.25)');
        gradient.addColorStop(0.7, 'rgba(80, 80, 80, 0.2)');
        gradient.addColorStop(1, 'rgba(20, 20, 20, 0)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);

        // Ribcage-like horizontal lines
        ctx.strokeStyle = 'rgba(150, 150, 150, 0.15)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const y = h * 0.2 + i * (h * 0.07);
            ctx.beginPath();
            ctx.ellipse(w/2, y, w*0.3 - i*5, 8, 0, 0, Math.PI);
            ctx.stroke();
        }

        // Lung fields (darker ovals)
        ctx.fillStyle = 'rgba(30, 30, 30, 0.6)';
        ctx.beginPath();
        ctx.ellipse(w*0.35, h*0.4, w*0.13, h*0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(w*0.65, h*0.4, w*0.13, h*0.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Heart shadow (center-left)
        const heartGrad = ctx.createRadialGradient(w*0.45, h*0.5, 10, w*0.45, h*0.5, w*0.12);
        heartGrad.addColorStop(0, 'rgba(160, 160, 160, 0.35)');
        heartGrad.addColorStop(1, 'rgba(80, 80, 80, 0)');
        ctx.fillStyle = heartGrad;
        ctx.beginPath();
        ctx.ellipse(w*0.45, h*0.5, w*0.1, h*0.13, 0, 0, Math.PI * 2);
        ctx.fill();

        // Spine (vertical line)
        ctx.strokeStyle = 'rgba(140, 140, 140, 0.2)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(w/2, h*0.1);
        ctx.lineTo(w/2, h*0.85);
        ctx.stroke();

        // "Patient ID" text
        ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
        ctx.font = '11px Inter, monospace';
        ctx.fillText(`ID: ${String(patient.id).padStart(5, '0')}`, 12, 20);
        ctx.fillText(`${patient.view} | ${patient.ap_pa}`, 12, 34);

        // Draw heatmap overlay based on findings
        if (heatmapOpacity > 0 && patient.findings.length > 0) {
            drawHeatmapOverlay(ctx, w, h, patient.findings);
        }
    }

    function drawHeatmapOverlay(ctx, w, h, findings) {
        ctx.globalAlpha = heatmapOpacity;

        findings.forEach((f, i) => {
            // Position heatmap blobs based on pathology type
            let cx, cy, radius;

            switch (f.pathology) {
                case 'Cardiomegaly':
                case 'Enlarged Cardiomediastinum':
                    cx = w * 0.45; cy = h * 0.5; radius = w * 0.12;
                    break;
                case 'Pleural Effusion':
                    cx = w * (0.3 + i * 0.1); cy = h * 0.7; radius = w * 0.1;
                    break;
                case 'Atelectasis':
                    cx = w * 0.35; cy = h * 0.55; radius = w * 0.08;
                    break;
                case 'Edema':
                    cx = w * 0.5; cy = h * 0.4; radius = w * 0.15;
                    break;
                case 'Consolidation':
                    cx = w * 0.65; cy = h * 0.35; radius = w * 0.09;
                    break;
                case 'Lung Opacity':
                    cx = w * 0.6; cy = h * 0.45; radius = w * 0.11;
                    break;
                case 'Pneumothorax':
                    cx = w * 0.7; cy = h * 0.25; radius = w * 0.08;
                    break;
                default:
                    cx = w * 0.5; cy = h * 0.4; radius = w * 0.1;
            }

            // Color based on confidence
            const intensity = f.confidence;
            const r = Math.round(255 * intensity);
            const g = Math.round(80 * (1 - intensity));
            const b = 30;

            const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
            grad.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${intensity * 0.7})`);
            grad.addColorStop(0.5, `rgba(${r}, ${g + 40}, ${b}, ${intensity * 0.3})`);
            grad.addColorStop(1, `rgba(${r}, ${g + 60}, ${b}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(cx, cy, radius, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
    }

    return {
        show(patientId) {
            currentPatient = MockData.getPatient(patientId);
            if (!currentPatient) return;

            App.switchView('patient');
            renderPatientInfo(currentPatient);
            renderFindings(currentPatient.findings);
            renderXray(currentPatient);
        }
    };
})();
