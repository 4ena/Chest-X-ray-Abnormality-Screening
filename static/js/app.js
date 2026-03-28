/* ============================================
   App Controller - View routing & initialization
   ============================================ */

const App = (() => {
    const views = ['triage', 'patient', 'compare', 'upload'];

    function switchView(name) {
        views.forEach(v => {
            const el = document.getElementById(`${v}-view`);
            if (el) el.classList.toggle('active', v === name);
        });

        // Update nav buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === name);
        });
    }

    function init() {
        // Nav button routing
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const view = btn.dataset.view;
                if (view === 'compare') {
                    // Enter compare selection mode on triage view
                    switchView('triage');
                    TriageView.enterCompareMode();
                } else {
                    TriageView.exitCompareMode();
                    switchView(view);
                }
            });
        });

        // Back buttons
        document.getElementById('back-to-triage').addEventListener('click', () => {
            switchView('triage');
        });

        document.getElementById('back-from-compare').addEventListener('click', () => {
            TriageView.exitCompareMode();
            switchView('triage');
        });

        // Upload zone
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        uploadZone.addEventListener('click', () => fileInput.click());

        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) {
                handleUpload(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                handleUpload(e.target.files[0]);
            }
        });

        // Initialize triage view
        TriageView.init();
    }

    function handleUpload(file) {
        const resultEl = document.getElementById('upload-result');
        resultEl.classList.remove('hidden');
        resultEl.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <div style="color: var(--accent); font-size: 14px; margin-bottom: 8px;">Analyzing...</div>
                <div style="color: var(--text-secondary); font-size: 13px;">${file.name} (${(file.size / 1024).toFixed(1)} KB)</div>
            </div>
        `;

        // Simulate analysis with mock data after delay
        setTimeout(() => {
            const mockFindings = [
                { pathology: 'Lung Opacity', confidence: 0.82 },
                { pathology: 'Pleural Effusion', confidence: 0.64 },
                { pathology: 'Atelectasis', confidence: 0.41 },
                { pathology: 'Cardiomegaly', confidence: 0.23 }
            ];

            resultEl.innerHTML = `
                <h3 style="font-size: 16px; margin-bottom: 16px;">Analysis Results</h3>
                <div style="margin-bottom: 12px; color: var(--text-secondary); font-size: 12px;">
                    File: ${file.name}
                </div>
                ${mockFindings.map(f => {
                    const pct = Math.round(f.confidence * 100);
                    let cls = 'normal';
                    if (f.confidence >= 0.7) cls = 'critical';
                    else if (f.confidence >= 0.45) cls = 'moderate';
                    else if (f.confidence >= 0.25) cls = 'mild';
                    return `
                        <div class="finding-detail-row ${f.confidence >= 0.7 ? 'highlight' : ''}" style="margin-bottom: 8px;">
                            <span class="finding-detail-name">${f.pathology}</span>
                            <div class="finding-detail-bar-bg">
                                <div class="finding-detail-bar finding-bar ${cls}" style="width: ${pct}%"></div>
                            </div>
                            <span class="finding-detail-pct" style="color: var(--${cls})">${pct}%</span>
                        </div>
                    `;
                }).join('')}
                <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-subtle); color: var(--text-muted); font-size: 11px;">
                    This is a demo with simulated results. Connect the ML backend for real inference.
                </div>
            `;
        }, 1500);
    }

    // Expose switchView publicly
    return { switchView, init };
})();

// Boot
document.addEventListener('DOMContentLoaded', App.init);
