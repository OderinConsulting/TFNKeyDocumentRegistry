document.addEventListener('DOMContentLoaded', function () {
    const approvedDocumentsList = document.getElementById('approved-documents-list');
    const recentProposalsList = document.getElementById('recent-proposals-list');

    if (!approvedDocumentsList || !recentProposalsList) {
        console.error('Document list elements not found in the DOM.');
        return;
    }

    let documents = [];

    // Fetch the JSON data
    fetch('../Data/read.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Fetched data:', data); // Log the fetched data
            documents = data.documents;

            // Filter and sort approved documents
            const approvedDocuments = documents
                .filter(doc => {
                    const hasEffectiveDate = doc.effectiveDate && !["n/a", "N/A", ""].includes(doc.effectiveDate.trim().toLowerCase());
                    const noSunsetDate = !doc.sunsetDate || ["n/a", "N/A", ""].includes(doc.sunsetDate.trim().toLowerCase());
                    return hasEffectiveDate && noSunsetDate;
                })
                .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
                .slice(0, 10);

            console.log('Approved documents:', approvedDocuments); // Log the approved documents

            // Filter and sort current proposals
            const currentProposals = documents
                .filter(doc => {
                    const hasProposalDate = doc.proposalDate && !["n/a", "N/A", ""].includes(doc.proposalDate.trim().toLowerCase());
                    const noEffectiveDate = !doc.effectiveDate || ["n/a", "N/A", ""].includes(doc.effectiveDate.trim().toLowerCase());
                    const noSunsetDate = !doc.sunsetDate || ["n/a", "N/A", ""].includes(doc.sunsetDate.trim().toLowerCase());
                    return hasProposalDate && noEffectiveDate && noSunsetDate;
                })
                .sort((a, b) => new Date(b.proposalDate) - new Date(a.proposalDate))
                .slice(0, 10);

            console.log('Current proposals:', currentProposals); // Log the current proposals

            // Render approved documents
            approvedDocuments.forEach(doc => {
                const li = document.createElement('li');
                const documentPageURL = `../Pages/${doc.id}.html`;
                li.innerHTML = `
                    <a href="${documentPageURL}">${doc.title}</a>
                    <p class="description">${doc.proposalSummary}</p>
                    <p class="effective-date">Effective date: ${new Date(doc.effectiveDate).toLocaleDateString()}</p>
                `;
                approvedDocumentsList.appendChild(li);
            });

            // Render current proposals
            currentProposals.forEach(doc => {
                const li = document.createElement('li');
                const documentPageURL = `../Pages/${doc.id}.html`;
                li.innerHTML = `
                    <a href="${documentPageURL}">${doc.title}</a>
                    <p class="description">${doc.proposalSummary}</p>
                    <p class="proposal-date">Proposal date: ${new Date(doc.proposalDate).toLocaleDateString()}</p>
                `;
                recentProposalsList.appendChild(li);
            });
        })
        .catch(error => console.error('Error fetching JSON:', error));
});
