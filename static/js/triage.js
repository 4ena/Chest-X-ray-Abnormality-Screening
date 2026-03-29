/* ============================================
   Triage Queue View
   ============================================ */

const TriageView = (() => {
    let patients = [];
    let compareMode = false;
    let selectedForCompare = new Set();

    function confidenceClass(confidence) {
        if (confidence >= 0.7) return 'critical';
        if (confidence >= 0.45) return 'moderate';
        if (confidence >= 0.25) return 'mild';
        return 'normal';
    }

    function renderCard(patient) {
        const card = document.createElement('div');
        card.className = `patient-card severity-${patient.severity_level}`;
        card.dataset.id = patient.id;
        card.dataset.severity = patient.severity_level;

        const findingsHTML = patient.findings.map(f => {
            const cls = confidenceClass(f.confidence);
            const pct = Math.round(f.confidence * 100);
            return `
                <div class="card-finding-row">
                    <span class="finding-name">${f.pathology}</span>
                    <div class="finding-bar-bg">
                        <div class="finding-bar ${cls}" style="width: ${pct}%"></div>
                    </div>
                    <span class="finding-pct">${pct}%</span>
                </div>
            `;
        }).join('');

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <div class="card-patient-name">${patient.name}</div>
                    <div class="card-patient-meta">${patient.age}y ${patient.sex}</div>
                </div>
                <span class="severity-badge ${patient.severity_level}">${patient.severity_level}</span>
            </div>
            <div class="card-findings">
                ${findingsHTML}
            </div>
            <div class="card-severity-score">
                <span class="severity-label">Severity Score</span>
                <span class="severity-score-value ${patient.severity_level}">
                    ${Math.round(patient.severity_score * 100)}
                </span>
            </div>
        `;

        card.addEventListener('click', () => {
            if (compareMode) {
                toggleCompareSelection(patient.id, card);
            } else {
                PatientView.show(patient.id);
            }
        });

        return card;
    }

    function toggleCompareSelection(id, card) {
        if (selectedForCompare.has(id)) {
            selectedForCompare.delete(id);
            card.classList.remove('selected');
        } else if (selectedForCompare.size < 2) {
            selectedForCompare.add(id);
            card.classList.add('selected');
        }
        updateCompareToolbar();
    }

    function updateCompareToolbar() {
        document.getElementById('compare-selected-count').textContent = selectedForCompare.size;
        document.getElementById('compare-go-btn').disabled = selectedForCompare.size !== 2;
    }

    function updateNavStats() {
        const counts = MockData.getSeverityCounts();
        document.getElementById('critical-count').textContent = counts.critical;
        document.getElementById('moderate-count').textContent = counts.moderate + counts.mild;
        document.getElementById('normal-count').textContent = counts.normal;
    }

    function filterCards(level) {
        const cards = document.querySelectorAll('.patient-card');
        cards.forEach(card => {
            if (level === 'all' || card.dataset.severity === level) {
                card.style.display = '';
            } else {
                card.style.display = 'none';
            }
        });
    }

    return {
        async init() {
            patients = await API.getPatients();
            const grid = document.getElementById('patient-grid');
            grid.innerHTML = '';

            patients.forEach(p => {
                grid.appendChild(renderCard(p));
            });

            updateNavStats();

            // Filter buttons
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    filterCards(btn.dataset.filter);
                });
            });

            // Compare toolbar
            document.getElementById('compare-go-btn').addEventListener('click', () => {
                const ids = Array.from(selectedForCompare);
                CompareView.show(ids[0], ids[1]);
            });

            document.getElementById('compare-cancel-btn').addEventListener('click', () => {
                this.exitCompareMode();
            });
        },

        enterCompareMode() {
            compareMode = true;
            selectedForCompare.clear();
            document.getElementById('compare-toolbar').classList.remove('hidden');
            updateCompareToolbar();
        },

        exitCompareMode() {
            compareMode = false;
            selectedForCompare.clear();
            document.getElementById('compare-toolbar').classList.add('hidden');
            document.querySelectorAll('.patient-card.selected').forEach(c => c.classList.remove('selected'));
        }
    };
})();
