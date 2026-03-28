/* ============================================
   API Layer - Fetch wrapper for all endpoints
   ============================================ */

const API = {
    baseUrl: '/api',

    async getPatients() {
        try {
            const res = await fetch(`${this.baseUrl}/patients`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('API unavailable, using mock data');
            return MockData.getPatients();
        }
    },

    async getPatient(id) {
        try {
            const res = await fetch(`${this.baseUrl}/patients/${id}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('API unavailable, using mock data');
            return MockData.getPatient(id);
        }
    },

    async comparePatients(idA, idB) {
        try {
            const res = await fetch(`${this.baseUrl}/compare?a=${idA}&b=${idB}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn('API unavailable, using mock data');
            return {
                patient_a: MockData.getPatient(idA),
                patient_b: MockData.getPatient(idB)
            };
        }
    },

    async analyzeUpload(file) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch(`${this.baseUrl}/analyze`, {
            method: 'POST',
            body: formData
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
};

/* ============================================
   Mock Data - Works without backend running
   ============================================ */

const MockData = (() => {
    const CONDITIONS = [
        'Atelectasis', 'Cardiomegaly', 'Consolidation',
        'Edema', 'Pleural Effusion', 'Lung Opacity',
        'Pneumothorax', 'Enlarged Cardiomediastinum'
    ];

    const SEVERITY_WEIGHTS = {
        'Pneumothorax': 10,
        'Edema': 8,
        'Pleural Effusion': 8,
        'Cardiomegaly': 7,
        'Consolidation': 6,
        'Atelectasis': 6,
        'Lung Opacity': 5,
        'Enlarged Cardiomediastinum': 4
    };

    const FIRST_NAMES = [
        'James', 'Maria', 'Robert', 'Linda', 'Michael',
        'Patricia', 'William', 'Elizabeth', 'David', 'Jennifer',
        'Richard', 'Susan', 'Joseph', 'Margaret', 'Thomas',
        'Dorothy', 'Charles', 'Karen', 'Daniel', 'Nancy'
    ];

    const LAST_NAMES = [
        'Smith', 'Johnson', 'Williams', 'Brown', 'Jones',
        'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
        'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
        'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin'
    ];

    // Seeded random for consistent mock data
    let seed = 42;
    function random() {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    }

    function generateFindings() {
        const numFindings = Math.floor(random() * 4) + 1;
        const shuffled = [...CONDITIONS].sort(() => random() - 0.5);
        const selected = shuffled.slice(0, numFindings);

        return selected.map(name => ({
            pathology: name,
            confidence: Math.round((random() * 0.7 + 0.15) * 100) / 100
        })).sort((a, b) => b.confidence - a.confidence);
    }

    function computeSeverity(findings) {
        if (findings.length === 0) return 0;
        let weightedSum = 0;
        let totalWeight = 0;
        for (const f of findings) {
            const w = SEVERITY_WEIGHTS[f.pathology] || 5;
            weightedSum += f.confidence * w;
            totalWeight += w;
        }
        return Math.round((weightedSum / totalWeight) * 100) / 100;
    }

    function severityLevel(score) {
        if (score >= 0.7) return 'critical';
        if (score >= 0.45) return 'moderate';
        if (score >= 0.25) return 'mild';
        return 'normal';
    }

    // Generate 20 mock patients
    const patients = [];
    for (let i = 1; i <= 20; i++) {
        const findings = generateFindings();
        const severity = computeSeverity(findings);
        const age = Math.floor(random() * 60) + 20;
        const sex = random() > 0.5 ? 'Male' : 'Female';
        const firstName = FIRST_NAMES[Math.floor(random() * FIRST_NAMES.length)];
        const lastName = LAST_NAMES[Math.floor(random() * LAST_NAMES.length)];

        patients.push({
            id: i,
            name: `${firstName} ${lastName}`,
            age: age,
            sex: sex,
            admission_date: `2026-03-${String(Math.floor(random() * 28) + 1).padStart(2, '0')}`,
            view: random() > 0.14 ? 'Frontal' : 'Lateral',
            ap_pa: random() > 0.28 ? 'AP' : 'PA',
            findings: findings,
            severity_score: severity,
            severity_level: severityLevel(severity),
            top_finding: findings.length > 0 ? findings[0].pathology : 'No Finding'
        });
    }

    // Sort by severity
    patients.sort((a, b) => b.severity_score - a.severity_score);

    return {
        getPatients() {
            return patients.map(p => ({
                id: p.id,
                name: p.name,
                age: p.age,
                sex: p.sex,
                severity_score: p.severity_score,
                severity_level: p.severity_level,
                top_finding: p.top_finding,
                findings: p.findings.slice(0, 3)
            }));
        },

        getPatient(id) {
            return patients.find(p => p.id === parseInt(id)) || null;
        },

        getSeverityCounts() {
            const counts = { critical: 0, moderate: 0, mild: 0, normal: 0 };
            patients.forEach(p => counts[p.severity_level]++);
            return counts;
        }
    };
})();
