document.addEventListener('DOMContentLoaded', function () {
    const documentList = document.getElementById('document-list');
    const searchInput = document.getElementById('search-input');
    const typeSort = document.getElementById('type-sort');
    const yearFilterContainer = document.querySelector('.year-filter');
    const departmentSelect = document.getElementById('department-select'); // Department select element

    let documents = [];

    // Fetch the JSON data
    fetch('../read.json?timestamp=' + new Date().getTime()) // Make sure the path and filename match your data source
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.documents && data.documents.length > 0) {
                // Filter out documents where sunsetDate is 'N/A'
                documents = data.documents.filter(doc => doc.sunsetDate && doc.sunsetDate.trim().toLowerCase() !== 'n/a');

                // Dynamically generate year buttons based on sunset dates
                generateYearButtons(documents);

                // Filter and render documents on initial load
                filterAndRenderDocuments();

                // Event listeners for filters and search
                typeSort.addEventListener('change', filterAndRenderDocuments);
                searchInput.addEventListener('input', handleSearchInput);
                departmentSelect.addEventListener('change', filterAndRenderDocuments);
            } else {
                console.error('No documents found in JSON file.');
            }
        })
        .catch(error => console.error('Error fetching JSON:', error));

    // Function to dynamically generate year buttons based on documents' sunset dates
    function generateYearButtons(docs) {
        const yearSet = new Set(); // To avoid duplicates

        docs.forEach(doc => {
            const sunsetDate = new Date(doc.sunsetDate);
            if (!isNaN(sunsetDate)) {
                const year = sunsetDate.getFullYear();
                yearSet.add(year);
            }
        });

        // Clear previous buttons
        yearFilterContainer.innerHTML = '';

        // Create buttons for each year
        Array.from(yearSet).sort((a, b) => b - a).forEach(year => {
            const button = document.createElement('button');
            button.classList.add('year-button');
            button.dataset.year = year;
            button.textContent = year;

            // Add click event listener for each button
            button.addEventListener('click', (event) => {
                event.preventDefault();
                event.stopPropagation();
                // Toggle the active class for the clicked button (allow multiple active buttons)
                button.classList.toggle('active');
                filterAndRenderDocuments();
            });

            yearFilterContainer.appendChild(button);
        });
    }

    // Function to render documents
    function renderDocuments(docs) {
        documentList.innerHTML = ''; // Clear existing items

        docs.forEach(doc => {
            const sunsetDate = new Date(doc.sunsetDate);
            const year = sunsetDate.getFullYear();

            // Ensure keyDocument, title, and registryNo are trimmed and lowercase
            const keyDocument = (doc.keyDocument || 'UnknownKeyDocument').trim().toLowerCase();
            const title = (doc.title || 'Untitled').trim().toLowerCase();
            const registryNo = (doc.registryNo || 'UnknownRegistryNo').trim().toLowerCase();

            // Construct the filename with the .png extension
            const fileName = `${keyDocument} - ${title} - ${registryNo}.png`.toLowerCase();
            const encodedFileName = encodeURIComponent(fileName);

            // Generate the full GitHub raw URL for the image
            const thumbnailUrl = `https://github.com/OderinConsulting/TFNKeyDocumentRegistry/raw/main/TFNKeyDocumentRegistry/images/${encodedFileName}`;

            // Construct the URL for the key document page
            const documentPageURL = `https://tfnkeydocumentregistry.netlify.app/${doc.keyDocument}`;

            // Google Drive file download link using the pdfFileId from the JSON
            const pdfFileId = doc.pdfFileId || '';
            const driveDownloadURL = pdfFileId ? `https://drive.google.com/uc?export=download&id=${pdfFileId}` : '#';

            const li = document.createElement('li');
            li.dataset.type = doc.type.toLowerCase();
            li.dataset.year = year;
            li.dataset.date = doc.sunsetDate;

            li.innerHTML = `
         <div class="card-content">
            <div class="thumbnail-section">
                <img src="${thumbnailUrl}" alt="${doc.title} thumbnail" class="thumbnail-image" onerror="this.onerror=null;this.src='https://tfnkeydocumentregistry.netlify.app/images/placeholder.png';">
            </div>

            <div class="icon-text-container">
                <div class="icon-column">
                    <a href="${documentPageURL}" target="_blank">
                        <i class="fas fa-external-link-alt clickable-icon"></i>
                    </a>
                    <a href="${driveDownloadURL}" target="_blank">
                        <i class="fas fa-download clickable-icon"></i>
                    </a>
                </div>

                <div class="details-section">
                    <div class="link-section">
                        <a href="${documentPageURL}" class="document-link" target="_blank">
                            <span class="document-title">${doc.title}</span>
                        </a>
                    </div>
                    <div class="department-section">
                        <p class="contact-department">${doc.department}</p>
                    </div>
                    <div class="date-section">
                        <p class="effective-date">Sunset date: ${sunsetDate.toLocaleDateString()}</p>
                    </div>
                </div>
            </div>
        </div>
            `;

            documentList.appendChild(li);
        });
    }

    // Function to handle search input and clear filters
    function handleSearchInput() {
        // Clear active filters
        document.querySelectorAll('.year-button').forEach(button => button.classList.remove('active'));

        filterAndRenderDocuments(true); // Pass true to indicate it's a search operation
    }

    // Function to filter and render documents
    function filterAndRenderDocuments(isSearch = false) {
        const type = typeSort.value.toLowerCase();
        const searchQuery = searchInput.value.toLowerCase().trim();
        const selectedDepartment = departmentSelect.value.toLowerCase();

        // Get all active year buttons (if any)
        const activeYearButtons = document.querySelectorAll('.year-button.active');
        const activeYears = Array.from(activeYearButtons).map(button => parseInt(button.dataset.year));

        // Get today's date for comparison
        const today = new Date();

        const filteredDocuments = documents.filter(doc => {
            const sunsetDate = new Date(doc.sunsetDate);
            const sunsetDateValid = doc.sunsetDate && 
                !["n/a", "N/A", ""].includes(doc.sunsetDate.trim().toLowerCase()) &&
                !isNaN(sunsetDate) &&
                sunsetDate <= today; // Exclude future sunset dates

            const docDepartment = doc.department?.toLowerCase();

            const matchesType = type === 'all' || doc.type.toLowerCase() === type;
            const matchesYear = activeYears.length === 0 || activeYears.includes(sunsetDate.getFullYear());
            const matchesDepartment = selectedDepartment === 'all' || docDepartment === selectedDepartment;
            const matchesSearch = searchQuery === '' || doc.title.toLowerCase().includes(searchQuery); 
            
            return matchesType && matchesYear && matchesDepartment && matchesSearch && sunsetDateValid;
        });

        // Sort documents by sunset date (most recent first)
        filteredDocuments.sort((a, b) => new Date(b.sunsetDate) - new Date(a.sunsetDate));

        renderDocuments(filteredDocuments);
    }

});
